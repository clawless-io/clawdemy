/**
 * Boundary tests for the freshness decision.
 *
 * Every case fixes both `now` and the frontmatter dates, so none of this can
 * go red because time passed. That is the point: the browser test these
 * replace pinned a real lesson's last_reviewed and failed on the calendar.
 *
 * Run with `bun run test:unit`.
 */

import { describe, expect, test } from 'bun:test';
import { FRESH_DAYS, freshnessState, formatReviewDate } from './freshness';

/** Days added to an ISO date, as an ISO date. */
function plusDays(iso: string, days: number): string {
	const d = new Date(`${iso}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

const PUBLISHED = '2026-01-10';
const REVISED = '2026-02-01';
/** getting-started is the quarterly tier: round(3 * 30.44) = 91 days. */
const QUARTERLY_TRACK = 'getting-started';
const QUARTERLY_DAYS = 91;
/** ai-foundations is the annual tier: round(12 * 30.44) = 365 days. */
const ANNUAL_TRACK = 'ai-foundations';
const ANNUAL_DAYS = 365;

function at(nowIso: string, extra: Record<string, unknown> = {}) {
	return freshnessState({
		lastReviewed: REVISED,
		publishedAt: PUBLISHED,
		trackSlug: QUARTERLY_TRACK,
		now: new Date(`${nowIso}T12:00:00Z`),
		...extra,
	});
}

describe('the fresh window', () => {
	test('a revision reviewed today is fresh', () => {
		expect(at(REVISED).state).toBe('fresh');
	});

	test('fresh on the last day of the window', () => {
		expect(at(plusDays(REVISED, FRESH_DAYS)).state).toBe('fresh');
	});

	test('silent one day past the window, not yet stale', () => {
		const r = at(plusDays(REVISED, FRESH_DAYS + 1));
		expect(r.state).toBe('silent');
		expect(r.ageDays).toBe(FRESH_DAYS + 1);
	});
});

describe('the published_at gate', () => {
	test('a brand-new lesson stays silent, even on publication day', () => {
		expect(at(PUBLISHED, { lastReviewed: PUBLISHED }).state).toBe('silent');
	});

	test('a lesson reviewed the day after publication is fresh', () => {
		const reviewed = plusDays(PUBLISHED, 1);
		expect(at(reviewed, { lastReviewed: reviewed }).state).toBe('fresh');
	});

	test('a missing published_at is treated as new, so never fresh', () => {
		expect(at(REVISED, { publishedAt: undefined }).state).toBe('silent');
	});

	test('the gate does not suppress the stale signal', () => {
		// Same day for both dates, so the fresh gate is closed, but the review
		// window has still passed. Staleness is independent of new-vs-revised.
		const r = at(plusDays(PUBLISHED, QUARTERLY_DAYS + 1), { lastReviewed: PUBLISHED });
		expect(r.state).toBe('stale');
	});
});

describe('the per-track review window', () => {
	test('not stale on the last day of the quarterly window', () => {
		const r = at(plusDays(REVISED, QUARTERLY_DAYS));
		expect(r.staleDays).toBe(QUARTERLY_DAYS);
		expect(r.state).toBe('silent');
	});

	test('stale one day later', () => {
		expect(at(plusDays(REVISED, QUARTERLY_DAYS + 1)).state).toBe('stale');
	});

	test('an annual track is still quiet at the quarterly boundary', () => {
		const r = at(plusDays(REVISED, QUARTERLY_DAYS + 1), { trackSlug: ANNUAL_TRACK });
		expect(r.staleDays).toBe(ANNUAL_DAYS);
		expect(r.state).toBe('silent');
	});

	test('an annual track goes stale at its own boundary', () => {
		expect(at(plusDays(REVISED, ANNUAL_DAYS + 1), { trackSlug: ANNUAL_TRACK }).state).toBe(
			'stale',
		);
	});

	test('an unmapped track falls back to the middle tier, not to timeless', () => {
		const r = at(REVISED, { trackSlug: 'no-such-track' });
		expect(r.staleDays).toBe(183);
	});

	test('a per-lesson override beats the track tier', () => {
		const r = at(plusDays(REVISED, 40), { trackSlug: ANNUAL_TRACK, cadenceMonths: 1 });
		expect(r.staleDays).toBe(30);
		expect(r.state).toBe('stale');
	});
});

describe('bad and missing dates', () => {
	test('no last_reviewed renders nothing', () => {
		const r = at(REVISED, { lastReviewed: undefined });
		expect(r.state).toBe('silent');
		expect(r.ageDays).toBeNull();
		expect(r.formatted).toBeNull();
	});

	test('an unparseable last_reviewed renders nothing rather than throwing', () => {
		expect(at(REVISED, { lastReviewed: 'not a date' }).state).toBe('silent');
	});

	test('a future last_reviewed is clamped to today, not negative', () => {
		const r = at(REVISED, { lastReviewed: plusDays(REVISED, 60) });
		expect(r.ageDays).toBe(0);
		expect(r.state).toBe('fresh');
	});

	test('a Date object works as well as an ISO string', () => {
		const r = at(REVISED, { lastReviewed: new Date(`${REVISED}T00:00:00Z`) });
		expect(r.state).toBe('fresh');
	});
});

describe('date formatting', () => {
	test('an ISO date formats as its own UTC day, not the day before', () => {
		// The regression this guards: parsing "2026-04-24" gives UTC midnight,
		// and formatting in a zone west of UTC would print April 23.
		expect(formatReviewDate(new Date('2026-04-24T00:00:00Z'))).toBe('April 24, 2026');
	});

	test('the formatted date is carried through the decision', () => {
		expect(at(REVISED).formatted).toBe('February 1, 2026');
	});
});

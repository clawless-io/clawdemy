/**
 * The freshness decision, as a pure function.
 *
 * WHY THIS FILE EXISTS. The rules used to live inside LessonFreshness.astro,
 * where the only way to test them was to render a real lesson in a browser and
 * assert on the callout. That made tests/freshness.spec.ts depend on the
 * calendar: it pinned getting-started/ai-wont-replace-you (last_reviewed
 * 2026-04-24) and asserted the "Recently updated" tip, so it was green only
 * inside the 30-day fresh window and went red on 2026-05-24 without anything
 * in the code changing. The quarterly tier then started firing the stale
 * callout around 2026-07-23, breaking a second assertion the same way.
 *
 * Taking `now` as an argument is the whole fix. The boundaries get tested at
 * fixed dates, and the browser tests keep only what is true on any date.
 */

import { cadenceDays, resolveCadenceMonths } from '../data/review-cadence';

/** Days after a review during which a revision is worth announcing. */
export const FRESH_DAYS = 30;

export type FreshnessState = 'fresh' | 'silent' | 'stale';

export interface FreshnessInput {
	lastReviewed?: Date | string;
	publishedAt?: Date | string;
	/** Track slug, for the per-track review window. Null falls back to the default tier. */
	trackSlug?: string | null;
	/** Per-lesson override in months. Wins over the track tier. */
	cadenceMonths?: number;
	/** Evaluation time. Always passed in, never read from the clock in here. */
	now: Date;
}

export interface FreshnessResult {
	state: FreshnessState;
	/** Whole days between `now` and lastReviewed, clamped at 0. Null when there is no date. */
	ageDays: number | null;
	/** The review window in days that applied, for diagnostics. */
	staleDays: number;
	/** lastReviewed as en-US long form in UTC, or null. */
	formatted: string | null;
}

export function toDate(input: Date | string | undefined): Date | null {
	if (!input) return null;
	const d = input instanceof Date ? input : new Date(input);
	return Number.isNaN(d.getTime()) ? null : d;
}

export function dayDiff(a: Date, b: Date): number {
	return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Format in UTC. ISO-only frontmatter dates ("2026-04-24") parse as UTC
 * midnight, and localizing them to the build server's zone would show the
 * prior day anywhere west of UTC.
 */
export function formatReviewDate(d: Date): string {
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		timeZone: 'UTC',
	});
}

/**
 * Decide which freshness callout a lesson gets.
 *
 *   fresh   a genuine post-publication revision inside FRESH_DAYS
 *   stale   past the track's review window
 *   silent  everything else, including every brand-new lesson
 *
 * The published_at gate is deliberate: the fresh signal claims "the body
 * changed since your last visit", which is false on a lesson nobody has read
 * yet. A new lesson has lastReviewed equal to publishedAt and stays silent; a
 * real revision has lastReviewed strictly later. A missing publishedAt is
 * treated as new. The stale signal is independent of all that.
 *
 * A future lastReviewed is clamped to `now`, so an editor's typo reads as
 * freshly reviewed rather than breaking the build.
 */
export function freshnessState(input: FreshnessInput): FreshnessResult {
	const { lastReviewed, publishedAt, trackSlug = null, cadenceMonths, now } = input;

	const staleDays = cadenceDays(resolveCadenceMonths(trackSlug, cadenceMonths));
	const reviewed = toDate(lastReviewed);
	const published = toDate(publishedAt);

	if (reviewed === null) {
		return { state: 'silent', ageDays: null, staleDays, formatted: null };
	}

	const ageDays = Math.max(0, dayDiff(now, reviewed));
	const formatted = formatReviewDate(reviewed);
	const updatedAfterPublish = published !== null && dayDiff(reviewed, published) > 0;

	if (ageDays > staleDays) return { state: 'stale', ageDays, staleDays, formatted };
	if (ageDays <= FRESH_DAYS && updatedAfterPublish) {
		return { state: 'fresh', ageDays, staleDays, formatted };
	}
	return { state: 'silent', ageDays, staleDays, formatted };
}

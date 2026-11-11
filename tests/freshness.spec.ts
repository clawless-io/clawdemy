import { expect, test } from '@playwright/test';

/**
 * Freshness callout tests.
 *
 * NO ASSERTION IN THIS FILE MAY DEPEND ON THE CALENDAR. The date rules are
 * unit-tested at fixed dates in src/lib/freshness.test.ts; what is left here
 * is only what must hold on any day: the Brief shows at most one callout, a
 * callout that renders carries the lesson's own review date, and the other
 * five artifacts never carry one.
 *
 * The earlier version of this file asserted that a specific lesson showed the
 * "Recently updated" tip. That was true for thirty days after its review and
 * then went red on its own, with the stale assertion following three months
 * later. See src/components/LessonFreshness.astro for the rules themselves.
 */

// An overdue lesson, so the stale callout and its wording are actually
// exercised. This was ai-wont-replace-you until its 2026-11-11 review made it
// silent, and the wording assertion then skipped without failing; then llmops
// until the 2026-11 narration batch reviewed it. When this
// lesson is reviewed too, move the fixture to another overdue one (the weekly
// "Lessons due for review" issue lists them) or this test skips again.
const BRIEF_PATH = '/lessons/getting-started/memory-system-overview/brief/';

/** This lesson's `last_reviewed`, as LessonFreshness formats it (UTC, en-US). */
const REVIEW_DATE = 'June 5, 2026';

const FRESH = 'aside.starlight-aside--tip[aria-label="Recently updated"]';
const STALE = 'aside.starlight-aside--note[aria-label="Due for a fresh look"]';

test('the Brief shows at most one freshness callout', async ({ page }) => {
	await page.goto(BRIEF_PATH);

	const fresh = await page.locator(FRESH).count();
	const stale = await page.locator(STALE).count();

	// Fresh and stale are mutually exclusive by construction: a lesson cannot
	// be inside the 30-day window and past a review window of 91 days or more.
	expect(fresh + stale).toBeLessThanOrEqual(1);
});

test('a freshness callout carries the lesson review date and a readable sentence', async ({
	page,
}) => {
	await page.goto(BRIEF_PATH);

	const callout = page.locator(`${FRESH}, ${STALE}`);
	const count = await callout.count();

	if (count === 0) {
		// Silent is a legitimate state (a new lesson, or one inside its window),
		// so there is nothing to assert about a callout that is correctly absent.
		test.skip(true, 'lesson is in the silent state; nothing to assert');
		return;
	}

	await expect(callout).toContainText(REVIEW_DATE);
	// Whichever callout rendered, it names a date rather than a relative time:
	// CDN-cached HTML outlives its build and "2 days ago" would start lying.
	await expect(callout).toContainText(/last (updated|reviewed) on \w+ \d{1,2}, \d{4}/);
});

test('non-Brief artifacts never render the freshness callout', async ({ page }) => {
	const nonBriefPaths = [
		'/lessons/getting-started/ai-wont-replace-you/lesson/',
		'/lessons/getting-started/ai-wont-replace-you/summary/',
		'/lessons/getting-started/ai-wont-replace-you/practice/',
		'/lessons/getting-started/ai-wont-replace-you/cheatsheet/',
		'/lessons/getting-started/ai-wont-replace-you/references/',
	];

	for (const path of nonBriefPaths) {
		await page.goto(path);
		await expect(page.locator('aside[aria-label="Recently updated"]')).toHaveCount(0);
		await expect(page.locator('aside[aria-label="Due for a fresh look"]')).toHaveCount(0);
	}
});

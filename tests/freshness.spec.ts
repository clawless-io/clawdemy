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

const BRIEF_PATH = '/lessons/getting-started/ai-wont-replace-you/brief/';

/** This lesson's `last_reviewed`, as LessonFreshness formats it (UTC, en-US). */
const REVIEW_DATE = 'April 24, 2026';

const FRESH = 'aside.starlight-aside--tip[aria-label="Recently updated"]';
const STALE = 'aside.starlight-aside--caution[aria-label="Last reviewed a while ago"]';

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
		await expect(page.locator('aside[aria-label="Last reviewed a while ago"]')).toHaveCount(0);
	}
});

import { expect, test } from '@playwright/test';

/**
 * Freshness callout tests.
 *
 * Asserts that the LessonFreshness component renders the correct callout on
 * the Brief based on the `last_reviewed` frontmatter date. See
 * src/components/LessonFreshness.astro for the date-window rules.
 */

const BRIEF_PATH = '/lessons/getting-started/ai-wont-replace-you/brief/';

test('Brief shows the recently-updated callout with the formatted date', async ({ page }) => {
	await page.goto(BRIEF_PATH);

	const fresh = page.locator('aside.starlight-aside--tip[aria-label="Recently updated"]');
	await expect(fresh).toHaveCount(1);
	await expect(fresh).toContainText(/last updated on \w+ \d{1,2}, \d{4}/);
});

test('Brief does not render a stale-warning callout when last_reviewed is recent', async ({
	page,
}) => {
	await page.goto(BRIEF_PATH);

	const stale = page.locator('aside.starlight-aside--caution[aria-label="Last reviewed a while ago"]');
	await expect(stale).toHaveCount(0);
});

test('non-Brief artifacts do not render the freshness callout', async ({ page }) => {
	const nonBriefPaths = [
		'/lessons/getting-started/ai-wont-replace-you/lesson/',
		'/lessons/getting-started/ai-wont-replace-you/summary/',
		'/lessons/getting-started/ai-wont-replace-you/practice/',
		'/lessons/getting-started/ai-wont-replace-you/cheatsheet/',
		'/lessons/getting-started/ai-wont-replace-you/references/',
	];

	for (const path of nonBriefPaths) {
		await page.goto(path);
		await expect(
			page.locator('aside[aria-label="Recently updated"]'),
		).toHaveCount(0);
		await expect(
			page.locator('aside[aria-label="Last reviewed a while ago"]'),
		).toHaveCount(0);
	}
});

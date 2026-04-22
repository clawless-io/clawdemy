import { expect, test } from '@playwright/test';

/**
 * Navigation tests: sidebar contains the lesson group; prev/next links flow
 * through the artifact sequence in order (brief → lesson → summary → practice
 * → cheatsheet → references).
 */

const LESSON_BASE = '/lessons/getting-started/ai-wont-replace-you';

test('sidebar contains the Track 1 group with all six artifact entries', async ({ page }) => {
	await page.goto('/mission/');
	const sidebar = page.locator('nav[aria-label="Main"]');

	// Sidebar group label
	await expect(sidebar.getByText('Track 1: Getting Started with Clawless')).toBeVisible();

	// Each of the six artifact links present
	for (const path of [
		`${LESSON_BASE}/brief/`,
		`${LESSON_BASE}/lesson/`,
		`${LESSON_BASE}/summary/`,
		`${LESSON_BASE}/practice/`,
		`${LESSON_BASE}/cheatsheet/`,
		`${LESSON_BASE}/references/`,
	]) {
		await expect(sidebar.locator(`a[href="${path}"]`)).toHaveCount(1);
	}
});

test('prev/next chain through artifact sequence', async ({ page }) => {
	const sequence = [
		{ path: `${LESSON_BASE}/brief/`, prev: '/tracks/', next: `${LESSON_BASE}/lesson/` },
		{ path: `${LESSON_BASE}/lesson/`, prev: `${LESSON_BASE}/brief/`, next: `${LESSON_BASE}/summary/` },
		{ path: `${LESSON_BASE}/summary/`, prev: `${LESSON_BASE}/lesson/`, next: `${LESSON_BASE}/practice/` },
		{
			path: `${LESSON_BASE}/practice/`,
			prev: `${LESSON_BASE}/summary/`,
			next: `${LESSON_BASE}/cheatsheet/`,
		},
		{
			path: `${LESSON_BASE}/cheatsheet/`,
			prev: `${LESSON_BASE}/practice/`,
			next: `${LESSON_BASE}/references/`,
		},
	];

	for (const { path, prev, next } of sequence) {
		await page.goto(path);
		await expect(page.locator('a[rel="prev"]')).toHaveAttribute('href', prev);
		await expect(page.locator('a[rel="next"]')).toHaveAttribute('href', next);
	}
});

test('outbound links in main content carry rel="noopener noreferrer"', async ({ page }) => {
	await page.goto('/mission/');
	// Scope to <main>; Starlight social links in the header use rel="me"
	// (microformats convention) which is correct and unrelated to security.
	const externalLinks = page
		.locator('main a[href^="http"]:not([href*="clawdemy.org"])');
	const count = await externalLinks.count();
	expect(count).toBeGreaterThan(0);

	for (let i = 0; i < count; i++) {
		const link = externalLinks.nth(i);
		const rel = await link.getAttribute('rel');
		expect(rel).toContain('noopener');
		expect(rel).toContain('noreferrer');
	}
});

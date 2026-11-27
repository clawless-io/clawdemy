import { expect, test } from '@playwright/test';

/**
 * Hide and show for the left menu and the right "On this page" column.
 *
 * Contract: both columns are shown by default; each button hides its column
 * and widens the text; the choice survives a reload with no flash (the
 * attribute is on <html> before the first paint); below 72rem the buttons
 * are absent and a stored choice has no effect.
 */

const LESSON = '/lessons/ai-foundations/how-ai-reads-tokens/lesson/';
const NAV_KEY = 'clawdemy-nav-collapsed';
const TOC_KEY = 'clawdemy-toc-collapsed';

test.describe('wide screen', () => {
	// The buttons exist from 72rem up, so the phone projects cannot run these.
	test.skip(({ isMobile }) => isMobile, 'desktop layout only');
	test.use({ viewport: { width: 1440, height: 900 } });

	test('both columns are shown by default', async ({ page }) => {
		await page.goto(LESSON);
		await expect(page.locator('#starlight__sidebar')).toBeVisible();
		await expect(page.locator('.right-sidebar-container')).toBeVisible();
		await expect(page.locator('.cw-pane-toggle--nav')).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('.cw-pane-toggle--toc')).toHaveAttribute('aria-expanded', 'true');
	});

	test('hiding the menu widens the text and survives a reload', async ({ page }) => {
		await page.goto(LESSON);
		const text = page.locator('.sl-markdown-content');
		const before = (await text.boundingBox())!.width;

		const button = page.locator('.cw-pane-toggle--nav');
		await button.click();
		await expect(page.locator('#starlight__sidebar')).toBeHidden();
		await expect(button).toHaveAttribute('aria-expanded', 'false');
		await expect(button).toHaveAttribute('aria-label', 'Show the menu');
		expect((await text.boundingBox())!.width).toBeGreaterThan(before);
		expect(await page.evaluate((k) => localStorage.getItem(k), NAV_KEY)).toBe('1');

		await page.reload();
		await expect(page.locator('html')).toHaveAttribute('data-cw-nav', 'hidden');
		await expect(page.locator('#starlight__sidebar')).toBeHidden();

		await page.locator('.cw-pane-toggle--nav').click();
		await expect(page.locator('#starlight__sidebar')).toBeVisible();
		expect(await page.evaluate((k) => localStorage.getItem(k), NAV_KEY)).toBe('0');
	});

	test('hiding the page outline hides the glossary with it', async ({ page }) => {
		await page.goto(LESSON);
		await page.locator('.cw-pane-toggle--toc').click();
		await expect(page.locator('.right-sidebar-container')).toBeHidden();
		expect(await page.evaluate((k) => localStorage.getItem(k), TOC_KEY)).toBe('1');
		// The header must not shift when a column goes away.
		await expect(page.locator('.site-title')).toBeVisible();
	});

	test('with both hidden the page does not scroll sideways', async ({ page }) => {
		await page.addInitScript(
			([nav, toc]) => {
				localStorage.setItem(nav, '1');
				localStorage.setItem(toc, '1');
			},
			[NAV_KEY, TOC_KEY],
		);
		await page.goto(LESSON);
		await expect(page.locator('#starlight__sidebar')).toBeHidden();
		await expect(page.locator('.right-sidebar-container')).toBeHidden();
		const overflows = await page.evaluate(
			() => document.documentElement.scrollWidth > window.innerWidth,
		);
		expect(overflows).toBe(false);
	});
});

test('below 72rem a stored choice does nothing and the buttons are absent', async ({
	page,
	isMobile,
}) => {
	test.skip(isMobile, 'phone projects have their own menu');
	await page.setViewportSize({ width: 1100, height: 800 });
	await page.addInitScript((nav) => localStorage.setItem(nav, '1'), NAV_KEY);
	await page.goto(LESSON);
	await expect(page.locator('.cw-pane-toggle--nav')).toBeHidden();
	await expect(page.locator('#starlight__sidebar')).toBeVisible();
});

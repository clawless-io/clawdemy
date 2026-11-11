import { expect, test } from '@playwright/test';

/**
 * A phone visitor can change the theme on every page, including the homepage,
 * which has no sidebar menu to hold Starlight's switch (founder, 2026-11-10).
 * See the .cw-footer-theme block in src/components/Footer.astro.
 */
test('the footer theme switch shows on a phone and works, on the homepage', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	const select = page.locator('footer .cw-footer-theme select');
	await expect(select).toBeVisible();
	await select.selectOption('dark');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	await select.selectOption('light');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('on desktop the footer copy is hidden; the header already has the switch', async ({
	page,
	isMobile,
}) => {
	test.skip(isMobile, 'explicit viewport width is not meaningful under device emulation');
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');
	await expect(page.locator('footer .cw-footer-theme select')).toBeHidden();
	await expect(page.locator('header starlight-theme-select select')).toBeVisible();
});

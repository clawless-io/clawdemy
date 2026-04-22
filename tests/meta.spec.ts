import { expect, test } from '@playwright/test';

/**
 * Meta-tag tests: every page has the OG / Twitter Card meta we add via the
 * Head override (src/components/Head.astro), plus Starlight's defaults.
 */

const SAMPLE_PATHS = [
	'/',
	'/mission/',
	'/lessons/getting-started/ai-wont-replace-you/brief/',
];

for (const path of SAMPLE_PATHS) {
	test(`${path} has full OG + Twitter meta`, async ({ page }) => {
		await page.goto(path);

		// Starlight defaults
		await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
		await expect(page.locator('meta[property="og:type"]')).toHaveCount(1);
		await expect(page.locator('meta[property="og:url"]')).toHaveCount(1);
		await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
		await expect(page.locator('meta[property="og:site_name"]')).toHaveCount(1);
		await expect(page.locator('meta[name="twitter:card"]')).toHaveCount(1);

		// Our Head.astro additions
		await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
			'content',
			'https://clawdemy.org/og-default.png',
		);
		await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
			'content',
			'1200',
		);
		await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
			'content',
			'630',
		);
		await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
			'content',
			'https://clawdemy.org/og-default.png',
		);
	});
}

import { expect, test } from '@playwright/test';

/**
 * LinkedIn Follow CTA tests.
 *
 * Two-part contract: (1) the anchor exists on every page with the correct
 * href, target, rel, and aria-label; (2) we do NOT load any LinkedIn
 * platform scripts on the page (the link is a styled <a>, not a widget).
 *
 * Sampled across a representative set of routes to catch any future
 * Footer override that accidentally drops the link on a layout variant.
 */

const SAMPLE_PATHS = [
	'/',
	'/mission/',
	'/legal/privacy/',
	'/lessons/getting-started/ai-wont-replace-you/lesson/',
];

const LINKEDIN_HREF = 'https://www.linkedin.com/company/117114432/';

for (const path of SAMPLE_PATHS) {
	test(`${path} renders LinkedIn Follow anchor with correct attrs`, async ({ page }) => {
		await page.goto(path);
		const link = page.locator(`a[href="${LINKEDIN_HREF}"]`);
		await expect(link).toHaveCount(1);
		await expect(link).toHaveAttribute('target', '_blank');
		const rel = (await link.getAttribute('rel')) || '';
		expect(rel).toContain('noopener');
		expect(rel).toContain('noreferrer');
		const aria = (await link.getAttribute('aria-label')) || '';
		expect(aria.toLowerCase()).toContain('linkedin');
	});

	test(`${path} loads no LinkedIn platform scripts`, async ({ page }) => {
		const platformRequests: string[] = [];
		page.on('request', (req) => {
			const url = req.url();
			if (
				url.includes('platform.linkedin.com') ||
				url.includes('snap.licdn.com') ||
				url.includes('px.ads.linkedin.com')
			) {
				platformRequests.push(url);
			}
		});
		await page.goto(path);
		await page.waitForLoadState('networkidle');
		const html = await page.content();
		expect(html).not.toContain('platform.linkedin.com');
		expect(platformRequests).toEqual([]);
	});
}

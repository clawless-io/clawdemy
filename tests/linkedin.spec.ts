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

const X_HREF = 'https://x.com/LearnClawdemy';

for (const path of SAMPLE_PATHS) {
	test(`${path} renders X Follow anchor with correct attrs`, async ({ page }) => {
		await page.goto(path);
		const link = page.locator(`a[href="${X_HREF}"]`);
		await expect(link).toHaveCount(1);
		await expect(link).toHaveAttribute('target', '_blank');
		const rel = (await link.getAttribute('rel')) || '';
		expect(rel).toContain('noopener');
		expect(rel).toContain('noreferrer');
		const aria = (await link.getAttribute('aria-label')) || '';
		expect(aria).toContain('on X');
	});

	test(`${path} loads no X platform scripts`, async ({ page }) => {
		const xRequests: string[] = [];
		page.on('request', (req) => {
			const host = new URL(req.url()).hostname;
			if (/(^|\.)(x|twitter)\.com$/.test(host) || host.endsWith('twimg.com')) {
				xRequests.push(req.url());
			}
		});
		await page.goto(path);
		await page.waitForLoadState('networkidle');
		expect(xRequests).toEqual([]);
	});
}

/**
 * YouTube and Instagram follow links: same contract as the two above. Each
 * is one plain anchor per page, opened in a new tab, with an aria-label that
 * names the platform (the icons carry no visible text).
 */
const MORE_FOLLOW_LINKS = [
	{ name: 'YouTube', href: 'https://www.youtube.com/@clawdemy' },
	{ name: 'Instagram', href: 'https://www.instagram.com/learnclawdemy/' },
];

for (const path of SAMPLE_PATHS) {
	for (const { name, href } of MORE_FOLLOW_LINKS) {
		test(`${path} renders ${name} Follow anchor with correct attrs`, async ({ page }) => {
			await page.goto(path);
			const link = page.locator(`footer a[href="${href}"]`);
			await expect(link).toHaveCount(1);
			await expect(link).toHaveAttribute('target', '_blank');
			const rel = (await link.getAttribute('rel')) || '';
			expect(rel).toContain('noopener');
			expect(rel).toContain('noreferrer');
			const aria = (await link.getAttribute('aria-label')) || '';
			expect(aria).toContain(`on ${name}`);
		});
	}

	test(`${path} loads nothing from Instagram`, async ({ page }) => {
		const requests: string[] = [];
		page.on('request', (req) => {
			const host = new URL(req.url()).hostname;
			if (/(^|\.)(instagram|cdninstagram)\.com$/.test(host)) {
				requests.push(req.url());
			}
		});
		await page.goto(path);
		await page.waitForLoadState('networkidle');
		expect(requests).toEqual([]);
	});
}

test('wide screen: the three link groups share one row above the policy links', async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	const top = async (selector: string) => {
		const box = await page.locator(selector).first().boundingBox();
		if (!box) throw new Error(`${selector} has no box`);
		return box.y;
	};
	const about = await top('#cw-footer-about');
	const listen = await top('#cw-footer-listen');
	const follow = await top('#cw-footer-follow-heading');
	expect(Math.abs(about - listen)).toBeLessThan(2);
	expect(Math.abs(about - follow)).toBeLessThan(2);
	expect(await top('footer .cw-footer-legal')).toBeGreaterThan(about + 40);
});

test('the two listening links sit together in the Listen group', async ({ page }) => {
	await page.goto('/');
	const listen = page.locator('footer nav[aria-labelledby="cw-footer-listen"]');
	await expect(listen.locator('a[href^="https://podcasts.apple.com/"]')).toHaveCount(1);
	await expect(listen.locator('a[href="/podcast/feed.xml"]')).toHaveCount(1);
});

test('home page: the date and the next link share one compact row', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/');
	const next = page.locator('footer .cw-footer-compact a[rel="next"]');
	await expect(next).toHaveCount(1);
	await expect(next).toHaveAttribute('href', '/mission/');
	await expect(page.locator('footer .pagination-links')).toHaveCount(0);
	const date = await page.locator('footer .cw-footer-compact time').boundingBox();
	const link = await next.boundingBox();
	if (!date || !link) throw new Error('compact row is missing a box');
	expect(Math.abs(date.y + date.height / 2 - (link.y + link.height / 2))).toBeLessThan(6);
});

test('lesson pages keep the previous and next cards', async ({ page }) => {
	await page.goto('/lessons/getting-started/ai-wont-replace-you/lesson/');
	await expect(page.locator('footer .pagination-links')).toHaveCount(1);
	await expect(page.locator('footer .cw-footer-compact')).toHaveCount(0);
});

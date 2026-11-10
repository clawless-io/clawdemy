import { expect, test } from '@playwright/test';

/**
 * Arriving on a track from the homepage catalog, the left sidebar shows where
 * the reader is instead of sitting at the top (founder, 2026-11-10). See
 * src/scripts/sidebar-reveal-current.ts.
 */
test('opening a late track from the catalog brings its sidebar entry into view', async ({
	page,
	isMobile,
}) => {
	test.skip(isMobile, 'below 50em the sidebar is a closed menu');
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');
	// Track 20 sits far down the sidebar, well below the first screen.
	// Follow the tile's own href (the tiles animate in, so a click can wait
	// on a moving target; the href is what a click would open).
	const href = await page
		.locator('.v2-wall .wt:not(.is-planned) a.wt-in', { hasText: /Track 20\b/i })
		.getAttribute('href');
	expect(href).toBeTruthy();
	await page.goto(href!);

	const r = await page.evaluate(() => {
		const pane = document.getElementById('starlight__sidebar')!;
		const cur = pane.querySelector('a[aria-current="page"]')!;
		const p = pane.getBoundingClientRect();
		const c = cur.getBoundingClientRect();
		return { scrollTop: pane.scrollTop, inView: c.top >= p.top && c.bottom <= p.bottom };
	});
	expect(r.scrollTop, 'the sidebar moved off the top').toBeGreaterThan(0);
	expect(r.inView, 'the current page is visible in the sidebar').toBe(true);
});

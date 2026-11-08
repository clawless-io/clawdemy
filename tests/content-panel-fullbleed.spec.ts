import { expect, test } from '@playwright/test';

/**
 * The full-bleed marketing canvas (src/components/overrides/ContentPanel.astro).
 *
 * Overriding a Starlight component stops that component's own <style> from
 * shipping, so our override has to REPRODUCE the stock rules. If that copy
 * ever drifts, every one of the ~1,868 non-marketing pages silently loses its
 * content width. The first test here is the guard against exactly that, and it
 * matters more than the feature itself.
 *
 * The feature is deliberately INERT today: no page sets `full_bleed: true`.
 * The first attempt opted the homepage in straight away, and measuring it
 * showed why that was wrong. At a 1440px viewport the existing prose homepage
 * rendered paragraphs 1425px wide, about 166 characters per line against a
 * readable 45 to 75. Full bleed only helps a page that supplies edge-to-edge
 * sections. So these tests pin the inert state, and the opt-in flips in the
 * same commit as the sections that use it.
 */

/*
 * --sl-content-width is RESPONSIVE: 45rem at the base, then 56rem and 67.5rem
 * at wider breakpoints. The first version of this test hardcoded 45 and failed
 * at Playwright's default 1280px viewport, where it resolves to 56. So the
 * viewport is pinned and the expectation is the set of real values, which
 * still fails loudly if the cap disappears entirely.
 */
const CAP_REM_VALUES = [45, 56, 67.5];

test('a lesson page keeps its content width, so the stock CSS copy has not drifted', async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto('/lessons/ai-foundations/why-tool-using-models-fail/lesson/');
	const container = page.locator('.content-panel .sl-container').first();
	await expect(container).toBeAttached();

	const maxWidth = await container.evaluate((el) => getComputedStyle(el).maxWidth);
	// 'none' would mean the rule we reproduced from stock went missing, which
	// would unbox the prose on every non-marketing page in the build.
	expect(maxWidth).not.toBe('none');

	const rootPx = await page.evaluate(() =>
		Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
	);
	const rem = Number.parseFloat(maxWidth) / rootPx;
	const matched = CAP_REM_VALUES.some((v) => Math.abs(rem - v) < 0.5);
	expect(matched, `content cap resolved to ${rem}rem, expected one of ${CAP_REM_VALUES}`).toBe(
		true,
	);
});

test('a lesson page renders prose at a readable line length', async ({ page }) => {
	// The reader-facing consequence of the test above, stated in the units that
	// actually matter. 166 characters per line is what the regression looked like.
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/lessons/ai-foundations/why-tool-using-models-fail/lesson/');
	const chars = await page
		.locator('.sl-markdown-content p')
		.first()
		.evaluate((el) => {
			const width = el.getBoundingClientRect().width;
			const fontSize = Number.parseFloat(getComputedStyle(el).fontSize);
			return width / (fontSize * 0.5);
		});
	expect(chars).toBeLessThan(110);
});

test('no page opts into full bleed yet', async ({ page }) => {
	for (const path of ['/', '/tracks/']) {
		await page.goto(path);
		await expect(page.locator('.content-panel[data-full-bleed]')).toHaveCount(0);
	}
});

test('the full-bleed rules shipped and are scoped to the panel', async ({ page }) => {
	// Drives the REAL stylesheet on a real page rather than re-implementing the
	// rule: set the opt-in attribute the override would emit, then read what the
	// browser computes. This is the half of the change a page cannot exercise
	// until it has sections to put on the canvas.
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');

	const before = await page
		.locator('.content-panel .sl-container')
		.first()
		.evaluate((el) => getComputedStyle(el).maxWidth);
	expect(before).not.toBe('none');

	const after = await page.locator('.content-panel').first().evaluate((panel) => {
		panel.setAttribute('data-full-bleed', 'true');
		const container = panel.querySelector('.sl-container')!;
		return {
			containerMaxWidth: getComputedStyle(container).maxWidth,
			panelPaddingLeft: getComputedStyle(panel).paddingLeft,
		};
	});

	expect(after.containerMaxWidth).toBe('none');
	expect(after.panelPaddingLeft).toBe('0px');
});

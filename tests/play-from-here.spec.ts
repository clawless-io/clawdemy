import { expect, test } from '@playwright/test';

/**
 * "Play from here" (issue #73). Each narrated paragraph, list item and quote
 * gets a margin button that seeks the audio to that block's first spoken word.
 * The audio itself lives on R2 and is not fetched here; these checks pin the
 * parts that can silently break: the button must never shift the word-to-
 * timing alignment, each button must point at its block's own first word, and
 * phones (no margin) must not show it. See PLAY_FROM_HERE_ENABLED in
 * src/components/ReadAlongDim.astro.
 */
const LESSON = '/lessons/ai-agent-teams/the-trader/lesson/';

test('buttons carry their block\'s spoken start time, in reading order', async ({
	page,
	isMobile,
}) => {
	test.skip(isMobile, 'the button is a wide-screen control');
	await page.setViewportSize({ width: 1400, height: 900 });
	await page.goto(LESSON);
	await expect(page.locator('.cw-ra-here').first()).toBeAttached();

	const result = await page.evaluate(() => {
		const buttons = [...document.querySelectorAll<HTMLButtonElement>('.cw-ra-here')];
		const starts = buttons.map((b) => Number(b.dataset.raStart));
		let decreasing = 0;
		for (let k = 1; k < starts.length; k++) if (starts[k] < starts[k - 1]) decreasing++;
		// Every button must sit in a block whose first word is a highlighted word.
		const orphan = buttons.filter((b) => !b.parentElement!.querySelector('.ra-word')).length;
		return {
			buttons: buttons.length,
			buttonText: buttons.map((b) => b.textContent ?? '').join('').trim(),
			hosts: [...new Set(buttons.map((b) => b.parentElement!.tagName))].sort(),
			allFinite: starts.every((t) => Number.isFinite(t)),
			decreasing,
			orphan,
		};
	});

	expect(result.buttons).toBeGreaterThan(10);
	expect(result.buttonText).toBe('');
	for (const tag of result.hosts) expect(['BLOCKQUOTE', 'LI', 'P']).toContain(tag);
	expect(result.allFinite).toBe(true);
	expect(result.decreasing).toBe(0);
	expect(result.orphan).toBe(0);
});

test('the button appears on hover in the margin, not over the text', async ({ page, isMobile }) => {
	test.skip(isMobile, 'the button is a wide-screen control');
	await page.setViewportSize({ width: 1400, height: 900 });
	await page.goto(LESSON);
	const host = page.locator('p.cw-ra-here-host').nth(3);
	const btn = host.locator('.cw-ra-here');
	await host.scrollIntoViewIfNeeded();
	await host.hover({ position: { x: 200, y: 5 } });
	await expect(btn).toHaveCSS('opacity', '1');
	const b = await btn.boundingBox();
	const h = await host.boundingBox();
	expect(b!.x + b!.width).toBeLessThanOrEqual(h!.x);
});

test('phones do not show the button and do not scroll sideways', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(LESSON);
	await expect(page.locator('.cw-ra-here').first()).toBeAttached();
	await expect(page.locator('.cw-ra-here').first()).toBeHidden();
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
	);
	expect(overflow).toBeLessThanOrEqual(0);
});

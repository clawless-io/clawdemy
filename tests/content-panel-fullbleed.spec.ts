import { expect, test } from '@playwright/test';

/**
 * The full-bleed marketing canvas (src/components/overrides/ContentPanel.astro).
 *
 * Overriding a Starlight component stops that component's own <style> from
 * shipping, so our override has to REPRODUCE the stock rules. If that copy
 * ever drifts, every one of the ~1,868 pages which are NOT marketing routes
 * silently loses its content width. The first test here is the guard against
 * exactly that, and it matters more than the feature itself.
 *
 * THE FEATURE IS NO LONGER INERT. The homepage opts in with `full_bleed: true`
 * as of the commit that added the hero, catalog wall and stat band, so the two
 * tests that pinned the unused state have been rewritten rather than deleted:
 * one now asserts the opt-in is where it should be and nowhere else, and the
 * other drives the rules on a page that has not opted in.
 *
 * A CORRECTION THIS FILE USED TO CARRY. The earlier version said that opting
 * the homepage in produced paragraphs 1425px wide, about 166 characters per
 * line. That measurement selected `.sl-markdown-content > p`, direct children
 * only, and returned exactly one element: <p class="lp-podcast-accent">, a
 * centred flex row whose box is page-wide while its widest line box is 199px.
 * It was an element box, not a line box, and the paragraph it seemed to
 * describe does not exist. Every real paragraph on the homepage sits inside
 * .lp-section, which carries its own max-width: 54rem, so this panel's cap was
 * never what held them in. Measured properly with line boxes, the flip moved
 * no prose line by a pixel. What it did break was the page footer, which has
 * its own test below.
 */

/*
 * --sl-content-width is RESPONSIVE: 45rem at the base, then 56rem and 67.5rem
 * at wider breakpoints. The first version of this test hardcoded 45 and failed
 * at Playwright's default 1280px viewport, where it resolves to 56. So the
 * viewport is pinned and the expectation is the set of real values, which
 * still fails loudly if the cap disappears entirely.
 */
const CAP_REM_VALUES = [45, 56, 67.5];

const LESSON = '/lessons/ai-foundations/why-tool-using-models-fail/lesson/';

test('a lesson page keeps its content width, so the stock CSS copy has not drifted', async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.goto(LESSON);
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
	// actually matter.
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto(LESSON);
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

test('the homepage opts into full bleed, and other splash pages do not', async ({ page }) => {
	// Rewritten. This used to assert that NO page opted in, which was the right
	// test while the canvas shipped unused. The homepage is the one page that
	// supplies edge-to-edge sections, so it is the one page allowed on it.
	await page.goto('/');
	await expect(page.locator('.content-panel[data-full-bleed]')).toHaveCount(1);

	/*
	 * /tracks/ is the other splash route with a hero. It is next in line for
	 * this layout but has not been built yet, and until it is, it must keep
	 * its reading column. This is the assertion that fails if someone opts a
	 * page in without giving it sections to fill the width.
	 */
	await page.goto('/tracks/');
	await expect(page.locator('.content-panel[data-full-bleed]')).toHaveCount(0);
});

test('the full-bleed rules shipped and are scoped to the panel', async ({ page }) => {
	// Drives the REAL stylesheet on a real page rather than re-implementing the
	// rule: set the opt-in attribute the override would emit, then read what the
	// browser computes.
	//
	// Rewritten to run on /tracks/ rather than /. The `before` half needs a page
	// whose container is still capped, and / is no longer such a page.
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/tracks/');

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

test('the full-bleed homepage still reads at a sane line length', async ({ page }) => {
	/*
	 * The gate the flip owes. Removing the panel cap means nothing now stops a
	 * block of prose from running the full width of the glass except the rule
	 * each section carries itself, and a section added later could simply
	 * forget to carry one.
	 *
	 * The thresholds are deliberately loose rather than ideal. The widest prose
	 * the founder's design intends is .lp-lead at its own max-width: 42rem,
	 * which measures about 80 characters and 671px, and these numbers have to
	 * clear that on four browser engines whose font metrics differ. What they
	 * catch is the regression CLASS: an uncapped paragraph at this viewport
	 * measures around 1400px and 175 characters, so it fails by a factor of
	 * nearly two on either threshold.
	 *
	 * Scoped to p, li and summary, which is prose. It deliberately leaves out
	 * figcaption: .cw-illus captions are a shared illustration component used
	 * on lesson pages too, one of them measures about 115 characters today, and
	 * narrowing it is a change to 1,868 pages rather than to this one.
	 */
	const MAX_PX = 880;
	const MAX_CHARS = 90;

	await page.setViewportSize({ width: 1440, height: 900 });
	await page.goto('/');

	const offenders = await page.evaluate(
		({ maxPx, maxChars }) => {
			/*
			 * The widest LINE BOX of an element, not its element box.
			 *
			 * Element width is the wrong measurement here and gives a false
			 * positive on every centred one-liner in a wide container, which is
			 * how the 1425px figure above came to be believed.
			 * Range.getClientRects() returns one rect per line box, so the
			 * widest rect is the longest line a reader actually reads.
			 */
			const probe = (el: Element) => {
				const range = document.createRange();
				range.selectNodeContents(el);
				const rects = [...range.getClientRects()].filter((r) => r.width > 0 && r.height > 0);
				const px = rects.length ? Math.max(...rects.map((r) => r.width)) : 0;
				const fontSize = Number.parseFloat(getComputedStyle(el).fontSize) || 16;
				// 0.5em per character is the conventional average advance for
				// prose, and the same factor the lesson test above uses, so the
				// two numbers are comparable. It is NOT the ch unit, which is the
				// advance of the digit zero and runs about 25% wider in Inter.
				return { px, chars: px / (fontSize * 0.5) };
			};
			const out: { sel: string; px: number; chars: number; text: string }[] = [];
			for (const el of document.querySelectorAll('.sl-markdown-content p, .sl-markdown-content li, .sl-markdown-content summary')) {
				// Containers whose text lives in children we will visit anyway.
				if (el.querySelector('p, li, summary')) continue;
				const text = (el.textContent || '').trim();
				// Short strings cannot form a long line; a 40 character floor keeps
				// buttons, labels and single words out of the report.
				if (text.length < 40) continue;
				const cs = getComputedStyle(el);
				if (cs.display === 'none' || cs.visibility === 'hidden') continue;
				const { px, chars } = probe(el);
				if (px <= maxPx && chars <= maxChars) continue;
				const cls = typeof el.className === 'string' ? el.className.trim() : '';
				out.push({
					sel: el.tagName.toLowerCase() + (cls ? `.${cls.split(/\s+/).join('.')}` : ''),
					px: Math.round(px),
					chars: Math.round(chars),
					text: text.slice(0, 70).replace(/\s+/g, ' '),
				});
			}
			return out;
		},
		{ maxPx: MAX_PX, maxChars: MAX_CHARS },
	);

	const report = offenders
		.map((o) => `  ${o.px}px / ${o.chars}ch  ${o.sel}\n      "${o.text}"`)
		.join('\n');
	expect(
		offenders,
		`prose wider than ${MAX_PX}px or ${MAX_CHARS} characters on the full-bleed homepage:\n${report}`,
	).toEqual([]);
});

test('the page footer keeps a gutter on the full-bleed homepage', async ({ page }) => {
	/*
	 * The one thing the flip actually broke, and the reason an element-box
	 * sweep was not enough to find it: the footer meta row is right-aligned, so
	 * losing the panel gutter put "Last updated: Nov 8, 2026" at x=1440 on a
	 * 1440px viewport, touching the glass.
	 *
	 * Starlight renders its footer as a sibling of the content inside
	 * .sl-container, which is why dropping the panel's padding dropped the
	 * footer's too. ContentPanel hands it back the shared wrap and gutter.
	 */
	// Both ends of the gutter's clamp(1rem, 4vw, 2rem): 2rem at desktop, 1rem
	// on a phone. The phone case is the one that would go unnoticed.
	for (const width of [1440, 390]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/');

		const footer = page.locator('.content-panel[data-full-bleed] > .sl-container > footer');
		await expect(footer).toHaveCount(1);

		const nearest = await footer.evaluate((el) => {
			const inner = window.innerWidth;
			let closest = inner;
			for (const child of el.querySelectorAll('p, a, time, span')) {
				const text = (child.textContent || '').trim();
				if (!text) continue;
				const box = child.getBoundingClientRect();
				if (box.width === 0) continue;
				closest = Math.min(closest, box.left, inner - box.right);
			}
			return closest;
		});

		// 12px is a floor, not the design, so this passes comfortably at either
		// end of the clamp while still failing if the gutter goes missing.
		expect(
			nearest,
			`footer text is hard against the viewport edge at ${width}px`,
		).toBeGreaterThanOrEqual(12);
	}
});

import { expect, test, type Page } from '@playwright/test';

/**
 * Light mode has no pure-white surfaces.
 *
 * Founder, 2026-11-07, reading a lesson page after the page itself became
 * paper: "on the right panel on this page, that panel is still bright white...
 * It should be a slightly different color so it stands out but isn't too off."
 *
 * WHY THIS IS A FULL-DOM SWEEP AND NOT A LIST OF SELECTORS
 *
 * The first inventory of that complaint was a grep for --fl-card followed by
 * measuring the selectors that grep suggested. That can only ever find the
 * whites that already use the token being searched for: a hardcoded #fff, a
 * Starlight variable that resolves to white in light mode, or a third-party
 * theme would all have been missed. So the check walks every element and
 * reports whatever is near-white, which is the same method that produced the
 * fix and will catch a surface nobody has thought of yet.
 *
 * That is not hypothetical. A hand inventory of the complaint found four
 * near-white surfaces, all of them --fl-card: the table-of-contents rail, the
 * pagination cards, the star button and the footer LinkedIn pill. This sweep
 * found a fifth on its first run, the Pagefind search input, which takes its
 * colour from a Starlight variable no file in this repo mentions. It is fixed
 * in global.css next to the --fl-card block.
 *
 * Code blocks are rgb(246,247,249), which is Expressive Code's own light
 * theme and deliberately out of scope here.
 */

/** All channels at or above this count as white enough to glare on paper. */
const NEAR_WHITE = 252;

/**
 * Surfaces that are allowed to be near-white. Empty on purpose: in light mode
 * nothing should be. Add a selector here only with the reason, and only if a
 * white surface is genuinely wanted rather than left over.
 */
const ALLOWED: readonly string[] = [];

type Offender = { selector: string; background: string; width: number; height: number };

async function nearWhiteSurfaces(page: Page): Promise<Offender[]> {
	return page.evaluate(
		({ threshold, allowed }) => {
			// Media elements paint their own content; their background is not a surface.
			const SKIP = new Set([
				'IMG',
				'SVG',
				'PATH',
				'VIDEO',
				'PICTURE',
				'CANVAS',
				'USE',
				'G',
				'CIRCLE',
				'RECT',
				'LINE',
				'POLYLINE',
				'POLYGON',
				'DEFS',
				'STOP',
				'LINEARGRADIENT',
				'IFRAME',
			]);

			/**
			 * Computed background colours do not arrive in one format. A plain
			 * declaration serialises as `rgb()` or `rgba()`, while anything built
			 * with color-mix() serialises as `color(srgb r g b)` with 0-to-1
			 * channels, and engines differ. Both are handled; `null` means "not
			 * understood" and is reported rather than skipped.
			 */
			const parse = (css: string): { rgb: number[]; alpha: number } | null => {
				if (css === 'transparent') return { rgb: [0, 0, 0], alpha: 0 };

				const legacy = css.match(/^rgba?\(([^)]+)\)$/);
				if (legacy) {
					const parts = legacy[1].split(/[,\/]/).map((n) => Number(n.trim()));
					if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return null;
					return { rgb: parts.slice(0, 3), alpha: parts[3] === undefined ? 1 : parts[3] };
				}

				const modern = css.match(/^color\(srgb ([^)]+)\)$/);
				if (modern) {
					const parts = modern[1].split(/[\s/]+/).filter(Boolean).map(Number);
					if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return null;
					return {
						rgb: parts.slice(0, 3).map((n) => n * 255),
						alpha: parts[3] === undefined ? 1 : parts[3],
					};
				}

				return null;
			};

			const found: Offender[] = [];
			const seen = new Set<string>();

			const record = (el: Element, background: string) => {
				const box = el.getBoundingClientRect();
				if (box.width < 8 || box.height < 8) return;
				const cls =
					typeof el.className === 'string' && el.className
						? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
						: '';
				const selector = el.tagName.toLowerCase() + cls;
				if (seen.has(selector)) return;
				seen.add(selector);
				found.push({
					selector,
					background,
					width: Math.round(box.width),
					height: Math.round(box.height),
				});
			};

			for (const el of Array.from(document.querySelectorAll('*'))) {
				if (SKIP.has(el.tagName.toUpperCase())) continue;
				if (allowed.some((sel) => el.matches(sel))) continue;

				const bg = getComputedStyle(el).backgroundColor;
				const parsed = parse(bg);

				// Anything this cannot read is reported, never skipped. A parser
				// that silently drops a format it does not know turns a failing
				// surface into a passing test, which is how the first version of
				// this sweep missed every color-mix() surface on the page.
				if (parsed === null) {
					record(el, `UNPARSED ${bg}`);
					continue;
				}

				// A nearly transparent white is not a white surface.
				if (parsed.alpha < 0.5) continue;
				if (parsed.rgb.some((channel) => channel < threshold)) continue;

				// record() drops slivers: a hairline or a 1px rule is not a surface.
				record(el, bg);
			}
			return found;
		},
		{ threshold: NEAR_WHITE, allowed: ALLOWED as string[] },
	);
}

const LESSON = '/lessons/ai-foundations/why-tool-using-models-fail/lesson/';

// 1440 is pinned because the right-hand rail, the surface that prompted this,
// is not rendered at narrow viewports.
test.use({ viewport: { width: 1440, height: 900 } });

for (const path of [LESSON, '/', '/tracks/']) {
	test(`no pure-white surface on ${path}`, async ({ page }) => {
		await page.goto(path);

		// If the page is not light, the sweep below proves nothing.
		expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('light');

		expect(await nearWhiteSurfaces(page)).toEqual([]);
	});
}

test('the search dialog is paper too', async ({ page }) => {
	await page.goto(LESSON);
	await page.locator('site-search button').first().click();
	await expect(page.locator('dialog[open]')).toBeVisible();

	// Wait for the INPUT, not just the dialog. Pagefind's UI is fetched and
	// mounted after the dialog opens, so a sweep that only waits for
	// dialog[open] can run against an empty dialog, find nothing and pass
	// while checking nothing. A hand sweep did exactly that and missed the
	// white input this test then caught.
	await expect(page.locator('.pagefind-ui__search-input')).toBeVisible();

	expect(await nearWhiteSurfaces(page)).toEqual([]);
});

test('the right rail is still a panel, one rung above the page', async ({ page }) => {
	// The fix is not "make everything the same colour". The rail has to stay
	// readable as a panel, which is why it sits just above the paper rather
	// than on it. If that design decision is revisited, this is the assertion
	// to change, deliberately.
	await page.goto(LESSON);

	const read = (sel: string) =>
		page.evaluate((s) => {
			const el = document.querySelector(s);
			if (!el) throw new Error(`missing ${s}`);
			const css = getComputedStyle(el).backgroundColor;

			// Same two serialisations as the sweep above: a plain colour comes
			// back as rgb(), a color-mix() result as color(srgb 0-to-1 channels).
			const legacy = css.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
			if (legacy) return [1, 2, 3].map((i) => Number(legacy[i]));

			const modern = css.match(/^color\(srgb ([^)]+)\)$/);
			if (modern) {
				return modern[1]
					.split(/[\s/]+/)
					.filter(Boolean)
					.slice(0, 3)
					.map((n) => Number(n) * 255);
			}

			throw new Error(`unparsed background on ${s}: ${css}`);
		}, sel);

	const page_ = await read('body');
	const rail = await read('starlight-toc nav');

	for (let i = 0; i < 3; i++) {
		// Lighter than the page, so it reads as raised.
		expect(rail[i]).toBeGreaterThan(page_[i]);
		// But close to it, so it does not read as a lit patch.
		expect(rail[i] - page_[i]).toBeLessThanOrEqual(8);
	}
});

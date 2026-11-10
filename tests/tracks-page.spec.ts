import { expect, test, type Page } from '@playwright/test';

/**
 * /tracks/, redesigned 2026-11-09 to GSD's mock (section 8) on the facelift's
 * paper background, at the founder's direction: "nicely colored and
 * distinguishes the tracks... while keeping the same background we have
 * today."
 *
 * The design is colour coding, so most of what can go wrong is colour going
 * wrong quietly: every card reverting to one blue (which is how the page
 * shipped before this, because TrackCard hardcoded brand blue), path colours
 * that cannot be read as text, or a jump chip pointing at nothing.
 */

const THEME_KEYS = ['foundations', 'nn-dl', 'transformers', 'production', 'specialized', 'product'];

test.describe('at desktop width', () => {
	test.use({ viewport: { width: 1440, height: 900 } });

	test('every jump chip lands on a path section that exists', async ({ page }) => {
		await page.goto('/tracks/');
		const hrefs = await page.locator('.path-jump a').evaluateAll((els) =>
			els.map((el) => el.getAttribute('href')),
		);
		expect(hrefs).toEqual(THEME_KEYS.map((k) => `#${k}`));

		for (const key of THEME_KEYS) {
			await expect(page.locator(`section.track-grid-section#${key}`)).toHaveCount(1);
		}
	});

	test('each path wears its own colour, not one shared blue', async ({ page }) => {
		/*
		 * The regression this guards is the state the page was in before:
		 * TrackCard set --accent to brand blue on every card, so all 27 looked
		 * alike whatever path they belonged to. Six paths must produce six
		 * different label colours.
		 */
		await page.goto('/tracks/');
		const colours = await page.evaluate((keys) => {
			return keys.map((key) => {
				const label = document.querySelector(`#${key} .track-card__num`);
				return label ? getComputedStyle(label).color : 'MISSING';
			});
		}, THEME_KEYS);

		expect(colours).not.toContain('MISSING');
		expect(new Set(colours).size, `path label colours: ${colours.join(' | ')}`).toBe(6);
	});

	test('the index is three columns, and the prose list rules leave it alone', async ({
		page,
	}) => {
		await page.goto('/tracks/');
		const r = await page.evaluate(() => {
			const ol = document.querySelector('.track-list-by-number__list')!;
			const li = document.querySelector('.track-list-by-number__item')!;
			return {
				columns: getComputedStyle(ol).gridTemplateColumns.split(' ').length,
				olPadLeft: getComputedStyle(ol).paddingLeft,
				liMarginTop: getComputedStyle(li).marginTop,
			};
		});
		expect(r.columns).toBe(3);
		/*
		 * The facelift's prose list rules in global.css used to reach into
		 * every component in a page body; that is what pinned the homepage
		 * stat band to the left edge. They now skip anything inside
		 * .not-content, and these two values are what proves it here.
		 */
		expect(r.olPadLeft).toBe('0px');
		expect(r.liMarginTop).toBe('0px');
	});
});

test('the index steps down to two columns, then one', async ({ page, isMobile }) => {
	test.skip(isMobile, 'explicit viewport widths are not meaningful under device emulation');
	for (const [width, want] of [
		[900, 2],
		[500, 1],
	] as const) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/tracks/');
		const columns = await page
			.locator('.track-list-by-number__list')
			.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
		expect(columns, `index columns at ${width}px`).toBe(want);
	}
});

test('the path bands do not make the page scroll sideways', async ({ page }) => {
	// The bands bleed to the window edges with a ::before, the same technique
	// as the homepage bands, so they are exactly the kind of thing that adds a
	// horizontal scrollbar if the overflow guard ever goes.
	for (const width of [1440, 768, 390]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/tracks/');
		const s = await page.evaluate(() => ({
			html: document.documentElement.scrollWidth,
			inner: window.innerWidth,
		}));
		expect(s.html, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(s.inner);
	}
});

/**
 * Contrast of every piece of TEXT drawn in a path colour, measured in the
 * browser against the surface it actually sits on.
 *
 * Why this exists: three of the six raw path colours fail the 4.5:1 minimum
 * for small text on the paper card (transformers 4.37, production 3.38,
 * specialized 3.56). GSD's mock used them as text anyway, and so did the
 * homepage catalog wall. Text now uses --accent-ink, a darker mix of the same
 * hue, and this proves it in both themes on both pages that use it.
 */
async function pathTextContrasts(page: Page) {
	return page.evaluate(() => {
		const parse = (css: string): number[] | null => {
			const legacy = css.match(/^rgba?\(([^)]+)\)$/);
			if (legacy) {
				const p = legacy[1].split(/[\s,/]+/).filter(Boolean).map(Number);
				return [p[0], p[1], p[2], p[3] ?? 1];
			}
			const modern = css.match(/^color\(srgb ([^)]+)\)$/);
			if (modern) {
				const p = modern[1].split(/[\s/]+/).filter(Boolean).map(Number);
				return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1];
			}
			return null;
		};
		const lum = ([r, g, b]: number[]) => {
			const f = (c: number) => {
				const v = c / 255;
				return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
			};
			return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
		};
		// The first ancestor with an opaque background is the surface the text
		// is read against.
		const surface = (el: Element): number[] | null => {
			for (let n: Element | null = el; n; n = n.parentElement) {
				const c = parse(getComputedStyle(n).backgroundColor);
				if (c && c[3] > 0.99) return c;
			}
			return parse(getComputedStyle(document.body).backgroundColor);
		};

		const out: { sel: string; text: string; ratio: number; unparsed?: string }[] = [];
		const selectors = ['.track-card__num', '.track-list-by-number__num', '.wt-num'];
		for (const sel of selectors) {
			for (const el of document.querySelectorAll(sel)) {
				// Planned tracks are deliberately faded and carry no path colour.
				if (el.closest('.is-planned, .track-list-by-number__link--planned')) continue;
				const fgCss = getComputedStyle(el).color;
				const fg = parse(fgCss);
				const bg = surface(el);
				if (!fg || !bg) {
					// Never skip silently: an unparsed colour is reported, so the
					// check cannot pass by measuring nothing.
					out.push({ sel, text: (el.textContent || '').trim(), ratio: 0, unparsed: fgCss });
					continue;
				}
				const a = lum(fg);
				const b = lum(bg);
				const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
				out.push({ sel, text: (el.textContent || '').trim(), ratio });
			}
		}
		return out;
	});
}

for (const theme of ['light', 'dark'] as const) {
	test(`path-coloured text clears 4.5:1 in ${theme} mode, on /tracks/ and the homepage`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.addInitScript((t) => {
			try {
				window.localStorage.setItem('starlight-theme', t);
			} catch {
				/* storage can be unavailable; the page still renders */
			}
		}, theme);

		for (const path of ['/tracks/', '/']) {
			await page.goto(path);
			const results = await pathTextContrasts(page);
			expect(results.length, `no path-coloured text found on ${path}`).toBeGreaterThan(0);

			const failing = results.filter((r) => r.ratio < 4.5);
			const report = failing
				.map((f) =>
					f.unparsed
						? `  ${f.sel} "${f.text}": UNPARSED ${f.unparsed}`
						: `  ${f.sel} "${f.text}": ${f.ratio.toFixed(2)}:1`,
				)
				.join('\n');
			expect(failing, `${theme} ${path}, text under 4.5:1:\n${report}`).toEqual([]);
		}
	});
}

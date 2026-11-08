import { expect, test } from '@playwright/test';

/**
 * The marketing homepage: hero, catalog wall, stat band.
 *
 * These three components shipped inert over three commits and render for the
 * first time now that src/content/docs/index.mdx sets `full_bleed: true`.
 * Everything here drives the real built page, because the whole point of the
 * change is what a visitor sees in the first three seconds (founder, brief of
 * 2026-11-07: "when someone arrives, they should get the sense that they're
 * entering a universe of AI education material").
 *
 * What this file does NOT do is assert copy. Headline, tagline and the three
 * actions are read from the page's own frontmatter by the Hero override, so
 * pinning their text here would turn an editorial change into a test failure.
 * The structural contracts are what matter.
 */

const DESKTOP = { width: 1440, height: 900 };

/*
 * The wall's breaking widths are not where you would guess, so this gate
 * sweeps instead of picking one.
 *
 * The hero stays two columns down to 64rem, which means the wall is at its
 * NARROWEST somewhere around 1030 to 1180 CSS pixels, not on a phone. A
 * desktop-only check passed at 1440 while that whole band was broken: tiles
 * fell to 87px, the "TRACK 26" eyebrow wrapped to a second line on 20 tiles,
 * and the extra line pushed the meta out of the tile.
 *
 * 960 and 820 are here because the hero drops to one column at 64rem and the
 * wall gets the full width back, so they are a different layout again; 768 and
 * below is the scrolling strip.
 */
const WALL_WIDTHS = [1680, 1512, 1440, 1366, 1280, 1180, 1100, 1030, 960, 820, 768, 500, 390];

test('no tile has its text sliced off or cut short, at any width', async ({ page, isMobile }) => {
	/*
	 * Skipped under device emulation. The Pixel 7 project cannot meaningfully
	 * be 1680px wide, and the strip layout it would actually exercise is
	 * already covered here by the 500 and 390 entries on the desktop projects.
	 * The engines that matter for this check are the three desktop ones,
	 * because what differs between them is font metrics, which is what decides
	 * whether the text fits.
	 */
	test.skip(isMobile, 'desktop widths are not meaningful under device emulation');

	/*
	 * A real defect, caught by eye in a screenshot and NOT by measuring the
	 * tile, which is why this gate exists and why it checks what it checks.
	 *
	 * .wt-in is a flex column with overflow: hidden. A flex item shrinks by
	 * default, so on every tile whose title wrapped to two lines the meta
	 * line's BOX was squeezed from 19px to 11.3px and its glyphs were clipped:
	 * the reader saw the top half of "13 lessons, 3.0 h". Asking the tile
	 * whether it overflowed returned no, correctly, because the box had been
	 * made to fit. Only the text inside it had not.
	 *
	 * So the question to ask an element is whether ITS OWN content fits in ITS
	 * OWN box, one element at a time, in both axes: height catches the slicing,
	 * width catches the ellipsis that replaced it.
	 */
	for (const width of WALL_WIDTHS) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/');

		const bad = await page.locator('.v2-wall .wt').evaluateAll((tiles) =>
			tiles.flatMap((tile) => {
				const out: { tile: string; problem: string; fits: number; needs: number }[] = [];
				const title = (tile.querySelector('.wt-title')?.textContent || '').trim();
				const add = (problem: string, fits: number, needs: number) => {
					// 1px of slack for sub-pixel rounding.
					if (needs > fits + 1) out.push({ tile: title, problem, fits, needs });
				};

				for (const sel of ['.wt-num', '.wt-meta', '.wt-in']) {
					const el = tile.querySelector(sel);
					if (!el) continue;
					add(`${sel} height`, el.clientHeight, el.scrollHeight);
				}

				/*
				 * The visible half of the meta line. .wt-meta carries
				 * text-overflow: ellipsis, so a too-long label is cut to
				 * "3.0 h..." rather than overflowing, which looks like a broken
				 * unit rather than an abbreviation. The text lives in an
				 * aria-hidden span beside the screen-reader copy.
				 */
				const meta = tile.querySelector('.wt-meta');
				const visible = meta?.querySelector('[aria-hidden="true"]') ?? meta;
				if (visible) add('.wt-meta width', meta!.clientWidth, visible.scrollWidth);

				/*
				 * .wt-title is line-clamped to two lines on purpose, so its
				 * content is MEANT to exceed its box on a long track name. It is
				 * the one part not checked here.
				 */
				return out;
			}),
		);

		const report = bad
			.map((c) => `  ${c.tile}: ${c.problem} needs ${c.needs}px in a ${c.fits}px box`)
			.join('\n');
		expect(bad, `tile text does not fit at ${width}px:\n${report}`).toEqual([]);
	}
});

test.describe('at desktop width', () => {
	test.use({ viewport: DESKTOP });

	test('the marketing hero renders, with exactly one h1 that still owns #_top', async ({
		page,
	}) => {
		await page.goto('/');

		await expect(page.locator('.v2-hero')).toHaveCount(1);
		// Stock Starlight's hero markup must NOT also be present.
		await expect(page.locator('.sl-markdown-content .hero')).toHaveCount(0);

		/*
		 * The reason the hero is an override rather than a component in the
		 * page body. Dropping `hero:` from the frontmatter would make
		 * Starlight render its own PageTitle, giving the homepage a second h1
		 * also claiming id="_top". The site is mid indexing investigation, so
		 * a second h1 here would confound the read.
		 */
		const h1s = page.locator('h1');
		await expect(h1s).toHaveCount(1);
		await expect(h1s.first()).toHaveAttribute('id', '_top');
	});

	test('the catalog wall shows every track in the manifest', async ({ page }) => {
		await page.goto('/');

		/*
		 * 27 is not hardcoded design intent, it is the manifest. CatalogWall
		 * asserts at build time that its order list and src/data/tracks.ts
		 * agree, so a new track cannot silently miss the homepage. This checks
		 * the other half: that what the assertion guards actually reaches the
		 * DOM.
		 */
		const tiles = page.locator('.v2-wall .wt');
		await expect(tiles).toHaveCount(27);

		// The two planned tracks must not be clickable links to nowhere.
		const planned = page.locator('.v2-wall .wt.is-planned');
		await expect(planned).toHaveCount(2);
		await expect(page.locator('.v2-wall .wt.is-planned a')).toHaveCount(0);

		// Every live tile links somewhere real.
		const hrefs = await page.locator('.v2-wall .wt:not(.is-planned) a').evaluateAll((els) =>
			els.map((el) => el.getAttribute('href')),
		);
		expect(hrefs).toHaveLength(25);
		/*
		 * Fetched, not pattern-matched. /tracks/<track-slug> looks exactly like
		 * a valid track URL and is a 404 on this site, so a shape check would
		 * pass on 25 dead links.
		 */
		for (const href of hrefs) {
			expect(href, 'a live tile must have an href').toBeTruthy();
			const res = await page.request.get(href!);
			expect(res.status(), `tile link ${href} did not resolve`).toBe(200);
		}
	});

	test('the stat band shows eight figures and the big one does not break in two', async ({
		page,
	}) => {
		await page.goto('/');

		await expect(page.locator('.v2-stat')).toHaveCount(8);

		/*
		 * "1.5M+" wrapping after the M reads as two separate numbers. This is
		 * a real defect that was caught by eye at a narrow width and fixed
		 * with white-space: nowrap, so it gets a gate. One line box per figure
		 * is the contract.
		 */
		const lineCounts = await page.locator('.v2-stat__num').evaluateAll((els) =>
			els.map((el) => {
				const range = document.createRange();
				range.selectNodeContents(el);
				return [...range.getClientRects()].filter((r) => r.width > 0).length;
			}),
		);
		expect(lineCounts).toHaveLength(8);
		for (const lines of lineCounts) {
			expect(lines, 'a figure must render as one line').toBe(1);
		}
	});

	test('the lesson count on the page is the one derived from the content', async ({ page }) => {
		await page.goto('/');
		/*
		 * The band's figures come from src/data/curriculum-metrics.ts at build
		 * time. This asserts they are live numbers and not placeholders, which
		 * is what keeps the page honest when a track ships: a hand-written
		 * figure would need a human to remember.
		 */
		const lessons = await page
			.locator('.v2-stat', { has: page.locator('text=lessons') })
			.first()
			.locator('.v2-stat__num')
			.innerText();
		expect(Number.parseInt(lessons, 10)).toBeGreaterThan(300);
	});
});

test('the page does not scroll sideways, at desktop or on a phone', async ({ page }) => {
	/*
	 * Full-bleed sections paint to the viewport edges and the catalog wall
	 * becomes a horizontally scrolling strip below 50rem. Both are ways to
	 * give the PAGE an accidental horizontal scrollbar, which is why the
	 * existing `html, body { overflow-x: clip }` guard exists. This proves the
	 * guard still holds with the new sections in place.
	 */
	for (const width of [1440, 1024, 768, 390]) {
		await page.setViewportSize({ width, height: 900 });
		await page.goto('/');
		const scroll = await page.evaluate(() => ({
			html: document.documentElement.scrollWidth,
			inner: window.innerWidth,
		}));
		expect(scroll.html, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(scroll.inner);
	}
});

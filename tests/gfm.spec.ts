import { expect, test } from '@playwright/test';

/**
 * GitHub Flavored Markdown must stay enabled for .mdx.
 *
 * Why this file exists: Astro 6.4 deprecated `markdown.gfm` by dropping its
 * schema default, so the resolved config carried `gfm: undefined`. The .md
 * path kept working because @astrojs/markdown-remark falls back to its own
 * defaults, but @astrojs/mdx reads the config value directly and gates the
 * plugin on it, so remark-gfm was silently never added for .mdx. Every file
 * we publish is .mdx.
 *
 * The result shipped to production: 1,244 table separator rows and 7,512
 * table rows across 362 files rendered as literal pipes and dashes inside a
 * paragraph. Nothing in the suite noticed, because nothing asserted that a
 * table is a table. These tests are that assertion.
 *
 * They deliberately check the rendered page rather than the config, because
 * the config was never wrong in an obvious way. Only the output was.
 */

// A cheatsheet whose source holds a plain two-column table.
const TABLE_PAGE =
	'/lessons/neural-network-intuition/the-handwritten-digit-problem/cheatsheet/';

test('a markdown table renders as a real table, not literal pipes', async ({ page }) => {
	await page.goto(TABLE_PAGE);
	const main = page.locator('main');

	const table = main.locator('table').first();
	await expect(table).toBeVisible();

	// The header cells prove the delimiter row was consumed as a delimiter
	// rather than printed as content.
	await expect(table.locator('thead th')).toHaveCount(2);
	await expect(table.locator('thead th').first()).toHaveText('To you');
	await expect(table.locator('thead th').nth(1)).toHaveText('To a computer');
	await expect(table.locator('tbody tr')).toHaveCount(3);

	// The separator must not survive anywhere in the body copy. This is the
	// exact string a reader saw on production while GFM was off.
	await expect(main).not.toContainText('| --- |');
});

test('a table cell keeps content that follows an escaped pipe', async ({ page }) => {
	// Math notation such as |v| puts pipes inside a cell. GFM splits cells on
	// every unescaped pipe and then TRUNCATES the extra ones, so an unescaped
	// |v| does not break the table visibly: it silently drops the rest of the
	// cell. That is worse than a broken table, so it gets its own test.
	await page.goto('/lessons/visual-math-linear-algebra/dot-products/cheatsheet/');
	const row = page.locator('main table tr', { hasText: 'Geometric' }).first();
	await expect(row).toBeVisible();
	// cos(θ) sits after two pipes in the source. If escaping regresses, the
	// cell ends at "v · w =" and this fails.
	await expect(row).toContainText('cos(');
	await expect(row.locator('td')).toHaveCount(2);
});

test('task lists render as checkboxes, not literal brackets', async ({ page }) => {
	// The other GFM feature in use: 49 task-list items across 6 files.
	await page.goto('/lessons/git-workflow/merge-conflicts/cheatsheet/');
	const main = page.locator('main');
	await expect(main.locator('input[type="checkbox"]').first()).toBeAttached();
	await expect(main).not.toContainText('- [ ]');
});

import { expect, test } from '@playwright/test';

/**
 * The read-along highlight needs each page word's spoken start time. The page
 * and the narration timing tokenize differently in places, so the component
 * matches them by text (alignTiming in src/components/ReadAlongDim.astro),
 * not by position. Before that, one mismatch shifted every later word and the
 * highlight ran ahead of the voice; measured 2026-11-17, 159 of 308 lessons.
 *
 * Each fixture carries one kind of mismatch:
 *   the-trader      a symbol token "()." left where inline code was stripped
 *   dqn             14 such tokens
 *   commit-hygiene  a list number "1." shown on the page but not spoken
 *   cramers-rule    a word split by inline formatting ("M" "-inverse")
 *   the-capstone    a sentence spoken but not highlighted (a details summary)
 *
 * The component reports how many page words it matched by text and how many
 * fall inside the narration; nearly all must match.
 */
const CASES = [
	'/lessons/ai-agent-teams/the-trader/lesson/',
	'/lessons/deep-reinforcement-learning/dqn/lesson/',
	'/lessons/git-workflow/commit-hygiene/lesson/',
	'/lessons/visual-math-linear-algebra/cramers-rule/lesson/',
	'/lessons/ai-agent-teams/the-capstone/lesson/',
];

for (const url of CASES) {
	test(`read-along words are matched to the narration: ${url}`, async ({ page }) => {
		await page.goto(url);
		const root = page.locator('.cw-readalong');
		await expect(root).toHaveAttribute('data-ra-matched', /\d+/);
		const matched = Number(await root.getAttribute('data-ra-matched'));
		const spanned = Number(await root.getAttribute('data-ra-spanned'));
		expect(spanned).toBeGreaterThan(800);
		expect(matched / spanned).toBeGreaterThanOrEqual(0.99);
	});
}

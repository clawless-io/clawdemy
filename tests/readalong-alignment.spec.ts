import { expect, test } from '@playwright/test';

/**
 * The read-along highlight maps DOM word N to timing word N. The DOM walker in
 * src/components/ReadAlongDim.astro wraps only tokens holding a letter or digit,
 * but the narration extractor also emits bare symbol tokens (most often the
 * "()." left when inline code is stripped from a sentence). Before the filter,
 * each such token pushed every later word onto the previous word's timing, so
 * the highlight ran ahead of the voice; measured 2026-11-17 on 151 of 308
 * lessons. These two lessons carry such tokens (the-trader 1, dqn 14), so a
 * regression shows here as a text mismatch.
 *
 * The check mirrors the component: filter the timing the same way, then every
 * DOM word must equal its timing word, compared on letters and digits only.
 */
const CASES = [
	{ url: '/lessons/ai-agent-teams/the-trader/lesson/', slug: 'the-trader' },
	{ url: '/lessons/deep-reinforcement-learning/dqn/lesson/', slug: 'dqn' },
];

for (const c of CASES) {
	test(`read-along words line up with the narration timing: ${c.slug}`, async ({ page }) => {
		await page.goto(c.url);
		await expect(page.locator('.ra-word').first()).toBeAttached();
		const r = await page.evaluate(async (slug) => {
			const all = (await (await fetch(`/read-along/${slug}.timing.json`)).json()).words as {
				text: string;
			}[];
			const timing = all.filter((w) => /[A-Za-z0-9]/.test(w.text)).map((w) => w.text);
			const dom = [...document.querySelectorAll('.ra-word')].map((s) => s.textContent ?? '');
			const n = (x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, '');
			const N = Math.min(dom.length, timing.length);
			let firstMiss = -1;
			for (let i = 0; i < N; i++) {
				if (n(dom[i]) !== n(timing[i])) {
					firstMiss = i;
					break;
				}
			}
			const used = Number(
				(document.querySelector('.cw-readalong') as HTMLElement | null)?.dataset.raTimingWords ?? -1,
			);
			return {
				used,
				filtered: timing.length,
				N,
				symbolTokens: all.length - timing.length,
				firstMiss,
				around: firstMiss < 0 ? '' : `${dom.slice(firstMiss, firstMiss + 4).join(' ')} | ${timing.slice(firstMiss, firstMiss + 4).join(' ')}`,
			};
		}, c.slug);
		expect(r.symbolTokens, 'fixture lesson should still carry symbol tokens').toBeGreaterThan(0);
		expect(r.used, 'the component must map the filtered timing, not the raw list').toBe(r.filtered);
		expect(r.N).toBeGreaterThan(1000);
		expect(r.firstMiss, r.around).toBe(-1);
	});
}

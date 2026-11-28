import { test, expect } from '@playwright/test';

// The "about N min" label above a lesson's audio comes from the lesson's
// timing file, so it matches the narration. It was typed by hand before and
// drifted by up to ten minutes after re-renders.
for (const slug of ['ai-foundations/where-to-be-careful', 'ai-foundations/how-ai-reads-tokens']) {
	test(`audio length label matches the narration: ${slug}`, async ({ page, request }) => {
		const lesson = slug.split('/')[1];
		const timing = await (await request.get(`/read-along/${lesson}.timing.json`)).json();
		const seconds: number = timing.words[timing.words.length - 1].end;
		await page.goto(`/lessons/${slug}/lesson/`);
		const label = await page.locator('.cw-readalong-duration').first().textContent();
		const minutes = Number(label?.match(/about (\d+) min/)?.[1]);
		expect(minutes).toBe(Math.max(1, Math.round(seconds / 60)));
	});
}

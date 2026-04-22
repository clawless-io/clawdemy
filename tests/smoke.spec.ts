import { expect, test } from '@playwright/test';

/**
 * Smoke tests: every published URL renders without error.
 * Catches build regressions, broken routes, missing pages.
 */

const PUBLIC_PATHS = [
	'/',
	'/mission/',
	'/tracks/',
	'/lessons/getting-started/ai-wont-replace-you/brief/',
	'/lessons/getting-started/ai-wont-replace-you/lesson/',
	'/lessons/getting-started/ai-wont-replace-you/summary/',
	'/lessons/getting-started/ai-wont-replace-you/practice/',
	'/lessons/getting-started/ai-wont-replace-you/cheatsheet/',
	'/lessons/getting-started/ai-wont-replace-you/references/',
	'/404',
];

for (const path of PUBLIC_PATHS) {
	test(`${path} renders`, async ({ page }) => {
		const response = await page.goto(path);
		// All paths return 200 from the static build (including /404, which is
		// the static 404.html fallback page that CF Pages serves for missing
		// routes; accessing it directly is a normal 200).
		expect(response?.status()).toBe(200);
		await expect(page).toHaveTitle(/.+/);
	});
}

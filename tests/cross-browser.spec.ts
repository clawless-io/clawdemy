import { expect, test, type Page, type TestInfo } from '@playwright/test';

/**
 * Cross-browser checks: the reader flows that matter, run in every project
 * (Chromium, Firefox, WebKit, an emulated iPhone and an emulated Android
 * phone). Each check also saves a full-page screenshot, uploaded by CI, so a
 * person can look at the page in each engine. These checks prove the flows
 * work; how the page looks is judged by a person reading the screenshots.
 *
 * Limits: the phone projects are a screen size and touch setting, not real
 * phones; WebKit on Linux is not Safari; the audio check asserts the player
 * and its source, not playback, because WebKit on Linux may have no MP3
 * decoder. Set CW_ASSERT_PLAY=1 to also assert playback (the macOS run).
 */

const LESSON = '/lessons/getting-started/ai-wont-replace-you/lesson/';
const PRACTICE = '/lessons/getting-started/ai-wont-replace-you/practice/';
// A practice page that uses the interactive flashcard component.
const FLASHCARDS = '/lessons/getting-started/api-keys-and-provider-oauth/practice/';
// WebKit refuses screenshots taller than 32767 device pixels. Long lessons
// on a phone (device scale 3) exceed that; those pages get a screenshot of
// the visible screen instead of the full page.
const MAX_SHOT_DEVICE_PX = 32000;

async function shoot(page: Page, testInfo: TestInfo, name: string, screenOnly = false) {
	const file = `test-results/screenshots/${testInfo.project.name}/${name}.png`;
	const { height, scale } = await page.evaluate(() => ({
		height: document.documentElement.scrollHeight,
		scale: window.devicePixelRatio || 1,
	}));
	const maxCssHeight = Math.floor(MAX_SHOT_DEVICE_PX / scale);
	if (!screenOnly && height <= maxCssHeight) {
		await page.screenshot({ path: file, fullPage: true });
		return;
	}
	// Too tall to capture whole: keep what the reader sees on screen at this
	// step instead (the page top after loading, or the open search dialog).
	await page.screenshot({ path: file });
}

function collectPageErrors(page: Page): string[] {
	const errors: string[] = [];
	page.on('pageerror', (err) => {
		// The cookieless visit counter only accepts reports from the production
		// address; WebKit raises its refusal from localhost as a page error.
		if (err.message.includes('cloudflareinsights.com')) return;
		errors.push(err.message);
	});
	return errors;
}

test('homepage loads without script errors', async ({ page }, testInfo) => {
	const errors = collectPageErrors(page);
	const response = await page.goto('/');
	expect(response?.status()).toBe(200);
	await expect(page.locator('h1').first()).toBeVisible();
	await page.waitForLoadState('load');
	expect(errors).toEqual([]);
	await shoot(page, testInfo, '01-home');
});

test('a narrated lesson page renders its title, body and navigation', async ({
	page,
	isMobile,
}, testInfo) => {
	const errors = collectPageErrors(page);
	await page.goto(LESSON);
	await expect(page.locator('main h1').first()).toBeVisible();
	await expect(
		page.locator('main .sl-markdown-content p').filter({ visible: true }).first(),
	).toBeVisible();
	if (isMobile) {
		await expect(page.locator('starlight-menu-button button')).toBeVisible();
	} else {
		await expect(page.locator('#starlight__sidebar a[aria-current="page"]')).toBeVisible();
	}
	// No sideways scroll at any width.
	const overflow = await page.evaluate(
		() => document.documentElement.scrollWidth - document.documentElement.clientWidth,
	);
	expect(overflow).toBeLessThanOrEqual(0);
	expect(errors).toEqual([]);
	await shoot(page, testInfo, '02-lesson');
});

test('navigation reaches the next artifact', async ({ page, isMobile }, testInfo) => {
	await page.goto(LESSON);
	if (isMobile) {
		// Phones: open the menu and follow a link inside it.
		await page.locator('starlight-menu-button button').click();
		const menuLink = page.locator(`#starlight__sidebar a[href="${PRACTICE}"]`);
		await expect(menuLink).toBeVisible();
		await shoot(page, testInfo, '03-menu-open');
		await menuLink.click();
	} else {
		await page.locator('a[rel="next"]').click();
	}
	await expect(page).toHaveURL(new RegExp(`${PRACTICE}$`));
	await expect(page.locator('main h1').first()).toBeVisible();
});

test('the audio player is present and points at a versioned source', async ({
	page,
}, testInfo) => {
	await page.goto(LESSON);
	const audio = page.locator('.cw-readalong audio[data-role="audio"]');
	await expect(audio).toBeAttached();
	await expect(audio).toHaveAttribute('controls', '');
	await expect(audio).toHaveAttribute('src', /\.mp3\?v=\d+/);
	await audio.scrollIntoViewIfNeeded();
	await expect(audio).toBeVisible();
	await shoot(page, testInfo, '04-audio');

	if (process.env.CW_ASSERT_PLAY === '1') {
		await audio.evaluate((el: HTMLAudioElement) => {
			el.muted = true;
			return el.play();
		});
		await expect
			.poll(() => audio.evaluate((el: HTMLAudioElement) => el.currentTime), {
				timeout: 15_000,
			})
			.toBeGreaterThan(0);
		await audio.evaluate((el: HTMLAudioElement) => el.pause());
	}
});

test('the read-along matches page words to the narration', async ({ page }, testInfo) => {
	await page.goto(LESSON);
	const root = page.locator('.cw-readalong');
	await expect(root).toHaveAttribute('data-ra-matched', /\d+/);
	const matched = Number(await root.getAttribute('data-ra-matched'));
	const spanned = Number(await root.getAttribute('data-ra-spanned'));
	expect(spanned).toBeGreaterThan(100);
	expect(matched / spanned).toBeGreaterThanOrEqual(0.99);
	await shoot(page, testInfo, '05-readalong');
});

test('a flashcard reveals its answer on click', async ({ page }, testInfo) => {
	await page.goto(FLASHCARDS);
	const card = page.locator('details.flashcard').first();
	const answer = card.locator('.flashcard-answer');
	await card.scrollIntoViewIfNeeded();
	await expect(answer).toBeHidden();
	await card.locator('summary').click();
	await expect(card).toHaveAttribute('open', '');
	await expect(answer).toBeVisible();
	await shoot(page, testInfo, '06-flashcard');
});

test('the tracks page shows its track cards', async ({ page }, testInfo) => {
	await page.goto('/tracks/');
	const cards = page.locator('.track-card__title');
	await expect(cards.first()).toBeVisible();
	expect(await cards.count()).toBeGreaterThan(20);
	await shoot(page, testInfo, '07-tracks');
});

test('search returns a result for a known word', async ({ page }, testInfo) => {
	await page.goto('/');
	await page.locator('button[data-open-modal]').click();
	const input = page.locator('dialog[open] input');
	await expect(input).toBeVisible();
	await input.fill('tokens');
	await expect(page.locator('dialog[open] .pagefind-ui__result').first()).toBeVisible({
		timeout: 15_000,
	});
	// The search dialog sits over the screen; a full-page shot buries it.
	await shoot(page, testInfo, '08-search', true);
});

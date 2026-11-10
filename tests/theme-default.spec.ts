import { expect, test, type Page } from '@playwright/test';

/**
 * The production default is light mode (founder, 2026-11-07), and "Auto" must
 * still follow the operating system.
 *
 * This file exists because the first implementation of that change looked
 * correct and was not. Overriding Starlight's ThemeProvider alone does nothing:
 * its ThemeSelect runs `onThemeChange(loadTheme())` in the constructor on every
 * page load, re-applying the OS theme and rewriting storage microseconds later.
 * A check that re-implemented the provider's logic reported six of six passing
 * while the real page was still dark. So every assertion here drives a real
 * navigation and reads the live DOM.
 *
 * The contract under test, shared by overrides/ThemeProvider.astro and
 * overrides/ThemeSelect.astro:
 *
 *   key absent        -> first visit     -> light
 *   'auto'            -> chose Auto      -> follow the OS
 *   ''                -> legacy Auto     -> follow the OS (pre-change readers)
 *   'light' / 'dark'  -> explicit choice -> honoured
 */

/** Seed localStorage before the page's inline theme script runs, then load. */
async function loadWith(page: Page, stored: string | null) {
	await page.addInitScript((value) => {
		try {
			if (value === null) window.localStorage.removeItem('starlight-theme');
			else window.localStorage.setItem('starlight-theme', value as string);
		} catch {
			/* storage can be unavailable; the page must still render */
		}
	}, stored);
	await page.goto('/');
	return {
		theme: await page.evaluate(() => document.documentElement.dataset.theme),
		picker: await page.locator('starlight-theme-select select').first().inputValue(),
	};
}

test.describe('on a machine set to dark', () => {
	test.use({ colorScheme: 'dark' });

	test('a first-time reader gets light, not the OS preference', async ({ page }) => {
		const { theme, picker } = await loadWith(page, null);
		expect(theme).toBe('light');
		// The control must not claim "Auto" while showing a light page.
		expect(picker).toBe('light');
	});

	test('a reader who chose Auto still follows the OS', async ({ page }) => {
		const { theme, picker } = await loadWith(page, 'auto');
		expect(theme).toBe('dark');
		expect(picker).toBe('auto');
	});

	test('a reader carrying the legacy empty string still follows the OS', async ({ page }) => {
		// Stock Starlight wrote '' for Auto, so every reader from before this
		// change has it. They must not be silently switched to light.
		const { theme, picker } = await loadWith(page, '');
		expect(theme).toBe('dark');
		expect(picker).toBe('auto');
	});
});

test.describe('on a machine set to light', () => {
	test.use({ colorScheme: 'light' });

	test('Auto follows the OS here too, so dark was not a coincidence', async ({ page }) => {
		const { theme, picker } = await loadWith(page, 'auto');
		expect(theme).toBe('light');
		expect(picker).toBe('auto');
	});

	test('an explicit dark choice beats the OS', async ({ page }) => {
		const { theme, picker } = await loadWith(page, 'dark');
		expect(theme).toBe('dark');
		expect(picker).toBe('dark');
	});
});

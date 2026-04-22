import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Clawdemy.
 *
 * Tests run against `bun run preview` (the production build), not the dev
 * server, so we test what readers actually see.
 *
 * For Phase 1 we run Chromium only locally for speed; CI runs all three
 * engines + a mobile viewport. Add tests under `tests/`.
 */
export default defineConfig({
	testDir: './tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? 'github' : 'list',

	use: {
		baseURL: 'http://localhost:4321',
		trace: 'on-first-retry',
	},

	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
		// Cross-browser and mobile run in CI only to keep local feedback fast.
		...(process.env.CI
			? [
					{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
					{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
					{ name: 'mobile-chrome', use: { ...devices['Pixel 7'] } },
				]
			: []),
	],

	webServer: {
		command: 'bun run preview',
		url: 'http://localhost:4321',
		reuseExistingServer: !process.env.CI,
		timeout: 60_000,
	},
});

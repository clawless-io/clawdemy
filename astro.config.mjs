// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
	site: 'https://clawdemy.org',
	vite: {
		plugins: [tailwindcss()],
		ssr: {
			noExternal: ['@astrojs/starlight-tailwind'],
		},
	},
	integrations: [
		starlight({
			title: 'Clawdemy',
			description:
				'Free AI literacy for everyday users. From zero to autonomous, one lesson at a time.',
			customCss: ['./src/styles/global.css'],
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/clawless-io/clawdemy',
				},
			],
			// Sidebar is intentionally minimal for Phase 1 — expanded as lessons land.
			sidebar: [
				{
					label: 'Start here',
					items: [
						{ label: 'Welcome', slug: 'index' },
						{ label: 'Our mission', slug: 'mission' },
					],
				},
				{
					label: 'Tracks',
					items: [
						{ label: 'All tracks', slug: 'tracks' },
						// Lesson entries added as content lands under src/content/docs/lessons/
					],
				},
			],
			// Pagefind index built at build time via package.json build script.
			// Starlight surfaces it as the search UI.
			pagefind: true,
			// editLink intentionally disabled in Phase 1.
			// Community contributions open in Phase 11 (Doc/roadmap.md);
			// re-enable then with a defined PR-triage process. Inviting
			// PRs before we can handle them well creates noise for the
			// non-technical primary reader (Doc/strategy.md §1).
			lastUpdated: true,
			favicon: '/favicon.svg',
		}),
	],
});

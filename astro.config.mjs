// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import rehypeExternalLinks from 'rehype-external-links';

// https://astro.build/config
export default defineConfig({
	site: 'https://clawdemy.org',
	markdown: {
		// Every external link in MDX content gets target=_blank + secure rel attrs.
		// Required for security per Doc/lesson-framework.md done-criteria; protects
		// against tabnabbing and unwanted referrer leakage.
		// Starlight's social/header links use rel="me" (microformats) and are
		// emitted by component code, not markdown — they bypass this plugin
		// correctly.
		rehypePlugins: [
			[
				rehypeExternalLinks,
				{
					target: '_blank',
					rel: ['noopener', 'noreferrer'],
				},
			],
		],
	},
	vite: {
		plugins: [tailwindcss()],
		ssr: {
			noExternal: ['@astrojs/starlight-tailwind'],
		},
	},
	integrations: [
		// Sitemap with /legal/ pages excluded. Starlight registers @astrojs/sitemap
		// internally; this explicit registration runs after Starlight's build:done
		// hook so its filter is the one that lands on disk. Legal pages also carry
		// noindex meta — sitemap exclusion is hygiene, noindex is enforcement.
		sitemap({
			filter: (page) => !page.includes('/legal/'),
		}),
		starlight({
			title: 'Clawdemy',
			description:
				'Free AI literacy for everyday users. From zero to autonomous, one lesson at a time.',
			customCss: ['./src/styles/global.css'],
			social: [
				{
					icon: 'rss',
					label: 'Podcast feed (RSS)',
					href: '/podcast/feed.xml',
				},
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/clawless-io/clawdemy',
				},
			],
			// Sidebar grows as lessons land. Each lesson is a directory under
			// src/content/docs/lessons/<track>/<slug>/ with six artifact files.
			// Sidebar entries are explicit per-lesson for now; Phase 2 (Authoring DX)
			// may switch to autogenerate.
			sidebar: [
				{
					label: 'Start here',
					items: [
						{ label: 'Welcome', slug: 'index' },
						{ label: 'Our mission', slug: 'mission' },
						{ label: 'Curriculum map', slug: 'tracks' },
					],
				},
				{
					label: 'Track 1: Getting Started',
					items: [
						{
							label: "1.1  AI won't replace you",
							collapsed: true,
							items: [
								{ label: 'Brief', slug: 'lessons/getting-started/ai-wont-replace-you/brief' },
								{ label: 'Lesson', slug: 'lessons/getting-started/ai-wont-replace-you/lesson' },
								{ label: 'Practice', slug: 'lessons/getting-started/ai-wont-replace-you/practice' },
								{ label: 'Summary', slug: 'lessons/getting-started/ai-wont-replace-you/summary' },
								{ label: 'Cheatsheet', slug: 'lessons/getting-started/ai-wont-replace-you/cheatsheet' },
								{ label: 'References', slug: 'lessons/getting-started/ai-wont-replace-you/references' },
							],
						},
					],
				},
				{
					label: 'Track 5: AI Foundations',
					items: [
						{
							label: 'Lecture 1: Transformer',
							collapsed: false,
							items: [
								{
									label: '1.1  Tokens',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/how-ai-reads-tokens/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/how-ai-reads-tokens/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/how-ai-reads-tokens/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/how-ai-reads-tokens/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/how-ai-reads-tokens/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/how-ai-reads-tokens/references' },
									],
								},
								{
									label: '1.2  Embeddings',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/how-words-become-vectors/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/how-words-become-vectors/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/how-words-become-vectors/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/how-words-become-vectors/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/how-words-become-vectors/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/how-words-become-vectors/references' },
									],
								},
								{
									label: '1.3  Attention',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/how-attention-works/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/how-attention-works/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/how-attention-works/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/how-attention-works/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/how-attention-works/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/how-attention-works/references' },
									],
								},
								{
									label: '1.4  Multi-head attention',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/multi-head-attention/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/multi-head-attention/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/multi-head-attention/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/multi-head-attention/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/multi-head-attention/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/multi-head-attention/references' },
									],
								},
								{
									label: '1.5  Transformer block',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/transformer-block/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/transformer-block/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/transformer-block/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/transformer-block/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/transformer-block/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/transformer-block/references' },
									],
								},
							],
						},
						{
							label: 'Lecture 2: Transformer-based models & tricks',
							collapsed: true,
							badge: { text: 'Coming soon', variant: 'note' },
							items: [
								{ label: 'Coming soon', slug: 'lessons/ai-foundations/coming-soon' },
							],
						},
						{
							label: 'Lecture 3: Large Language Models',
							collapsed: true,
							items: [
								{
									label: '3.1  Text generation (sampling)',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/how-text-is-generated/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/how-text-is-generated/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/how-text-is-generated/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/how-text-is-generated/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/how-text-is-generated/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/how-text-is-generated/references' },
									],
								},
								{
									label: '3.2  Prompting',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/how-prompting-works/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/how-prompting-works/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/how-prompting-works/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/how-prompting-works/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/how-prompting-works/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/how-prompting-works/references' },
									],
								},
							],
						},
						{
							label: 'Lecture 4: LLM training',
							collapsed: true,
							badge: { text: 'Coming soon', variant: 'note' },
							items: [
								{ label: 'Coming soon', slug: 'lessons/ai-foundations/coming-soon' },
							],
						},
						{
							label: 'Lecture 5: LLM tuning',
							collapsed: true,
							items: [
								{
									label: '5.1  Fine-tuning + RLHF',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/how-models-learn-to-be-helpful/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/how-models-learn-to-be-helpful/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/how-models-learn-to-be-helpful/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/how-models-learn-to-be-helpful/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/how-models-learn-to-be-helpful/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/how-models-learn-to-be-helpful/references' },
									],
								},
							],
						},
						{
							label: 'Lecture 6: LLM reasoning',
							collapsed: true,
							badge: { text: 'Coming soon', variant: 'note' },
							items: [
								{ label: 'Coming soon', slug: 'lessons/ai-foundations/coming-soon' },
							],
						},
						{
							label: 'Lecture 7: Agentic LLMs',
							collapsed: true,
							items: [
								{
									label: '7.1  RAG',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/how-rag-works/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/how-rag-works/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/how-rag-works/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/how-rag-works/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/how-rag-works/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/how-rag-works/references' },
									],
								},
							],
						},
						{
							label: 'Lecture 8: LLM evaluation',
							collapsed: true,
							badge: { text: 'Coming soon', variant: 'note' },
							items: [
								{ label: 'Coming soon', slug: 'lessons/ai-foundations/coming-soon' },
							],
						},
						{
							label: 'Lecture 9: Current trends',
							collapsed: true,
							badge: { text: 'Coming soon', variant: 'note' },
							items: [
								{ label: 'Coming soon', slug: 'lessons/ai-foundations/coming-soon' },
							],
						},
					],
				},
			],
			components: {
				// Adds og:image and twitter:image to every page; Starlight 0.38
				// already emits the rest of the OG / Twitter Card meta automatically.
				Head: './src/components/Head.astro',
				// Adds a legal-links row + parent-company line under Starlight's
				// default footer (edit-link / last-updated / pagination stay).
				Footer: './src/components/Footer.astro',
			},
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

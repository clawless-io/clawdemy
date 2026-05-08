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
					// Track 5 is grouped by mental-model phase, not by Stanford lecture.
					// See Doc/curriculum/mental-model-phases.md for the seven-phase
					// arc and Doc/curriculum/source-to-phase-mapping.md for the
					// phase / phase_order assignment of each lesson.
					label: 'Track 5: AI Foundations',
					items: [
						{
							// Two-line label: "Phase N" renders small and dim (top row,
							// styled via .large::first-line in src/styles/global.css);
							// the descriptive title is the bottom row. The \n is honored
							// as a line break by `white-space: pre-line` on the .large
							// container. Pattern repeats for all seven phase entries.
							label: 'Phase 1\nHow models read text',
							collapsed: true,
							items: [
								{
									label: 'Tokens',
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
									label: 'Embeddings',
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
									label: 'Position embeddings: RoPE',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/position-embeddings-and-rope/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/position-embeddings-and-rope/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/position-embeddings-and-rope/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/position-embeddings-and-rope/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/position-embeddings-and-rope/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/position-embeddings-and-rope/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nHow models think',
							collapsed: true,
							items: [
								{
									label: 'Attention',
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
									label: 'Multi-head attention',
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
									label: 'The transformer block',
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
								{
									label: 'Stability: LayerNorm and RMSNorm',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/layer-norm-and-rmsnorm/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/layer-norm-and-rmsnorm/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/layer-norm-and-rmsnorm/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/layer-norm-and-rmsnorm/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/layer-norm-and-rmsnorm/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/layer-norm-and-rmsnorm/references' },
									],
								},
								{
									label: 'Efficiency tricks',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/attention-efficiency-tricks/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/attention-efficiency-tricks/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/attention-efficiency-tricks/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/attention-efficiency-tricks/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/attention-efficiency-tricks/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/attention-efficiency-tricks/references' },
									],
								},
								{
									label: 'Encoder-decoder: T5',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/encoder-decoder-and-t5-span-corruption/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/encoder-decoder-and-t5-span-corruption/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/encoder-decoder-and-t5-span-corruption/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/encoder-decoder-and-t5-span-corruption/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/encoder-decoder-and-t5-span-corruption/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/encoder-decoder-and-t5-span-corruption/references' },
									],
								},
								{
									label: 'BERT',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/bert-architecture-and-objectives/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/bert-architecture-and-objectives/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/bert-architecture-and-objectives/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/bert-architecture-and-objectives/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/bert-architecture-and-objectives/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/bert-architecture-and-objectives/references' },
									],
								},
								{
									label: 'BERT family: DistilBERT and RoBERTa',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/bert-derivatives-distilbert-roberta/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/bert-derivatives-distilbert-roberta/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/bert-derivatives-distilbert-roberta/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/bert-derivatives-distilbert-roberta/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/bert-derivatives-distilbert-roberta/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/bert-derivatives-distilbert-roberta/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nHow models are trained at scale',
							collapsed: true,
							items: [
								{
									label: 'Pretraining',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/how-models-are-pretrained/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/how-models-are-pretrained/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/how-models-are-pretrained/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/how-models-are-pretrained/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/how-models-are-pretrained/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/how-models-are-pretrained/references' },
									],
								},
								{
									label: 'Scaling laws and Chinchilla',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/why-scale-matters/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/why-scale-matters/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/why-scale-matters/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/why-scale-matters/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/why-scale-matters/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/why-scale-matters/references' },
									],
								},
								{
									label: 'Parallelism and Flash Attention',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/parallelism-and-flash-attention/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/parallelism-and-flash-attention/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/parallelism-and-flash-attention/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/parallelism-and-flash-attention/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/parallelism-and-flash-attention/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/parallelism-and-flash-attention/references' },
									],
								},
								{
									label: 'Quantization and mixed precision',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/quantization-and-mixed-precision/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/quantization-and-mixed-precision/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/quantization-and-mixed-precision/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/quantization-and-mixed-precision/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/quantization-and-mixed-precision/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/quantization-and-mixed-precision/references' },
									],
								},
							],
						},
						{
							label: 'Phase 4\nHow models learn to be helpful',
							collapsed: true,
							items: [
								{
									label: 'Instruction tuning, RLHF',
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
								{
									label: 'Preference data, reward models',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/preferences-into-reward-signals/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/preferences-into-reward-signals/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/preferences-into-reward-signals/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/preferences-into-reward-signals/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/preferences-into-reward-signals/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/preferences-into-reward-signals/references' },
									],
								},
								{ label: 'More lessons coming soon', slug: 'lessons/ai-foundations/coming-soon' },
							],
						},
						{
							label: 'Phase 5\nHow we steer models at inference',
							collapsed: true,
							items: [
								{
									label: 'Decoding strategies',
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
									label: 'Prompting',
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
								{ label: 'More lessons coming soon', slug: 'lessons/ai-foundations/coming-soon' },
							],
						},
						{
							label: 'Phase 6\nHow models reason and act',
							collapsed: true,
							items: [
								{
									label: 'RAG',
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
								{ label: 'More lessons coming soon', slug: 'lessons/ai-foundations/coming-soon' },
							],
						},
						{
							label: "Phase 7\nHow we judge models and where they're going",
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

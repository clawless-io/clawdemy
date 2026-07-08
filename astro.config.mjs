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
		// Sitemap with utility pages excluded (RBJ Global family rule: legal +
		// utility pages get noindex,follow AND are omitted from sitemap; footer
		// links remain). Starlight registers @astrojs/sitemap internally; this
		// explicit registration runs after Starlight's build:done hook so its
		// filter is the one that lands on disk. Utility pages also carry noindex
		// meta in their frontmatter head: block; sitemap exclusion is hygiene,
		// noindex is enforcement.
		sitemap({
			// Noindex lesson-artifact types (summary / practice / references)
				// carry robots=noindex,follow (see src/components/Head.astro), so
				// they must NOT appear in the sitemap: a noindexed URL in the
				// sitemap makes Google flag "Submitted URL marked 'noindex'" in
				// Coverage. Same hygiene rule as the legal/utility pages below
				// (noindex => omit from sitemap). The indexed artifacts
				// (lesson / brief / cheatsheet) stay in. GSD-flagged 2026-06-27.
				// /legal/licensing/ is the EXCEPTION to the legal-exclusion rule.
				// It is positive policy content where discoverability serves the
				// project (commercial inquirers searching "Clawdemy commercial
				// licensing" should land here). All other /legal/ pages stay
				// excluded from sitemap + carry noindex meta in their frontmatter.
				filter: (page) =>
					!/\/(summary|practice|references)\/?$/.test(page) &&
					(page.includes('/legal/licensing/') ||
						(!page.includes('/legal/') && !page.includes('/trust/'))),
		}),
		starlight({
			title: 'Clawdemy',
			description:
				'Free AI literacy for everyday users. From zero to autonomous, one lesson at a time.',
			// Brand wordmark replaces the plain-text title (brand-integration spec
			// 2026-06-07). Light/dark variants; sizing in src/styles/global.css.
			logo: {
				light: './src/assets/brand/Clawdemy-wordmark.png',
				dark: './src/assets/brand/Clawdemy-wordmark-white.png',
				replacesTitle: true,
			},
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
			sidebar: (() => {
					const __groups = [
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
				{
					label: '1.2  Your first conversation',
					collapsed: true,
					items: [
						{ label: 'Brief', slug: 'lessons/getting-started/first-conversation-and-model-selector/brief' },
						{ label: 'Lesson', slug: 'lessons/getting-started/first-conversation-and-model-selector/lesson' },
						{ label: 'Practice', slug: 'lessons/getting-started/first-conversation-and-model-selector/practice' },
						{ label: 'Summary', slug: 'lessons/getting-started/first-conversation-and-model-selector/summary' },
						{ label: 'Cheatsheet', slug: 'lessons/getting-started/first-conversation-and-model-selector/cheatsheet' },
						{ label: 'References', slug: 'lessons/getting-started/first-conversation-and-model-selector/references' },
					],
				},
				{
					label: '1.3  API keys and the OAuth path',
					collapsed: true,
					items: [
						{ label: 'Brief', slug: 'lessons/getting-started/api-keys-and-provider-oauth/brief' },
						{ label: 'Lesson', slug: 'lessons/getting-started/api-keys-and-provider-oauth/lesson' },
						{ label: 'Practice', slug: 'lessons/getting-started/api-keys-and-provider-oauth/practice' },
						{ label: 'Summary', slug: 'lessons/getting-started/api-keys-and-provider-oauth/summary' },
						{ label: 'Cheatsheet', slug: 'lessons/getting-started/api-keys-and-provider-oauth/cheatsheet' },
						{ label: 'References', slug: 'lessons/getting-started/api-keys-and-provider-oauth/references' },
					],
				},
				{
					label: '1.6  How Clawless remembers',
					collapsed: true,
					items: [
						{ label: 'Brief', slug: 'lessons/getting-started/memory-system-overview/brief' },
						{ label: 'Lesson', slug: 'lessons/getting-started/memory-system-overview/lesson' },
						{ label: 'Practice', slug: 'lessons/getting-started/memory-system-overview/practice' },
						{ label: 'Summary', slug: 'lessons/getting-started/memory-system-overview/summary' },
						{ label: 'Cheatsheet', slug: 'lessons/getting-started/memory-system-overview/cheatsheet' },
						{ label: 'References', slug: 'lessons/getting-started/memory-system-overview/references' },
					],
				},
				{
					label: '1.8  CostGuard and your data',
					collapsed: true,
					items: [
						{ label: 'Brief', slug: 'lessons/getting-started/costguard-and-privacy-posture/brief' },
						{ label: 'Lesson', slug: 'lessons/getting-started/costguard-and-privacy-posture/lesson' },
						{ label: 'Practice', slug: 'lessons/getting-started/costguard-and-privacy-posture/practice' },
						{ label: 'Summary', slug: 'lessons/getting-started/costguard-and-privacy-posture/summary' },
						{ label: 'Cheatsheet', slug: 'lessons/getting-started/costguard-and-privacy-posture/cheatsheet' },
						{ label: 'References', slug: 'lessons/getting-started/costguard-and-privacy-posture/references' },
					],
				},
					],
				},
				{
					label: 'Track 4: Visual Math: Linear Algebra',
					items: [
						{
							label: 'Phase 1\nGeometric foundations',
							collapsed: true,
							items: [
								{
									label: 'What vectors are',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-linear-algebra/what-vectors-actually-are/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-linear-algebra/what-vectors-actually-are/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-linear-algebra/what-vectors-actually-are/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-linear-algebra/what-vectors-actually-are/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-linear-algebra/what-vectors-actually-are/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-linear-algebra/what-vectors-actually-are/references' },
									],
								},
								{
									label: 'Spans and basis',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-linear-algebra/spans-and-basis/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-linear-algebra/spans-and-basis/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-linear-algebra/spans-and-basis/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-linear-algebra/spans-and-basis/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-linear-algebra/spans-and-basis/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-linear-algebra/spans-and-basis/references' },
									],
								},
								{
									label: 'Linear transformations',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-linear-algebra/linear-transformations/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-linear-algebra/linear-transformations/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-linear-algebra/linear-transformations/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-linear-algebra/linear-transformations/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-linear-algebra/linear-transformations/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-linear-algebra/linear-transformations/references' },
									],
								},
								{
									label: 'Matrix multiplication',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-linear-algebra/matrix-multiplication/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-linear-algebra/matrix-multiplication/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-linear-algebra/matrix-multiplication/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-linear-algebra/matrix-multiplication/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-linear-algebra/matrix-multiplication/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-linear-algebra/matrix-multiplication/references' },
									],
								},
								{
									label: 'Stepping up to 3D',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-linear-algebra/3d-transformations/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-linear-algebra/3d-transformations/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-linear-algebra/3d-transformations/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-linear-algebra/3d-transformations/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-linear-algebra/3d-transformations/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-linear-algebra/3d-transformations/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nGeometry of operations',
							collapsed: true,
							items: [
								{
									label: 'The determinant',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-linear-algebra/determinant/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-linear-algebra/determinant/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-linear-algebra/determinant/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-linear-algebra/determinant/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-linear-algebra/determinant/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-linear-algebra/determinant/references' },
									],
								},
								{
									label: 'Inverses and null space',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-linear-algebra/inverses-column-space-null-space/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-linear-algebra/inverses-column-space-null-space/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-linear-algebra/inverses-column-space-null-space/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-linear-algebra/inverses-column-space-null-space/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-linear-algebra/inverses-column-space-null-space/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-linear-algebra/inverses-column-space-null-space/references' },
									],
								},
								{
									label: 'Matrices between dimensions',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-linear-algebra/nonsquare-matrices/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-linear-algebra/nonsquare-matrices/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-linear-algebra/nonsquare-matrices/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-linear-algebra/nonsquare-matrices/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-linear-algebra/nonsquare-matrices/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-linear-algebra/nonsquare-matrices/references' },
									],
								},
								{
									label: 'Dot products',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-linear-algebra/dot-products/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-linear-algebra/dot-products/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-linear-algebra/dot-products/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-linear-algebra/dot-products/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-linear-algebra/dot-products/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-linear-algebra/dot-products/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nAdvanced perspectives',
							collapsed: true,
							items: [
								{
									label: 'Cross products (2D)',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-linear-algebra/cross-products/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-linear-algebra/cross-products/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-linear-algebra/cross-products/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-linear-algebra/cross-products/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-linear-algebra/cross-products/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-linear-algebra/cross-products/references' },
									],
								},
								{
									label: '3D cross product',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-linear-algebra/3d-cross-product-via-duality/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-linear-algebra/3d-cross-product-via-duality/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-linear-algebra/3d-cross-product-via-duality/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-linear-algebra/3d-cross-product-via-duality/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-linear-algebra/3d-cross-product-via-duality/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-linear-algebra/3d-cross-product-via-duality/references' },
									],
								},
								{
									label: 'Cramer\'s rule',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-linear-algebra/cramers-rule/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-linear-algebra/cramers-rule/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-linear-algebra/cramers-rule/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-linear-algebra/cramers-rule/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-linear-algebra/cramers-rule/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-linear-algebra/cramers-rule/references' },
									],
								},
								{
									label: 'Change of basis',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-linear-algebra/change-of-basis/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-linear-algebra/change-of-basis/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-linear-algebra/change-of-basis/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-linear-algebra/change-of-basis/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-linear-algebra/change-of-basis/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-linear-algebra/change-of-basis/references' },
									],
								},
								{
									label: 'Eigenvectors',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-linear-algebra/eigenvectors-and-eigenvalues/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-linear-algebra/eigenvectors-and-eigenvalues/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-linear-algebra/eigenvectors-and-eigenvalues/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-linear-algebra/eigenvectors-and-eigenvalues/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-linear-algebra/eigenvectors-and-eigenvalues/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-linear-algebra/eigenvectors-and-eigenvalues/references' },
									],
								},
								{
									label: 'Abstract vector spaces',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-linear-algebra/abstract-vector-spaces/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-linear-algebra/abstract-vector-spaces/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-linear-algebra/abstract-vector-spaces/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-linear-algebra/abstract-vector-spaces/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-linear-algebra/abstract-vector-spaces/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-linear-algebra/abstract-vector-spaces/references' },
									],
								},
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
									label: 'How models know word order',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/how-models-know-word-order/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/how-models-know-word-order/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/how-models-know-word-order/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/how-models-know-word-order/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/how-models-know-word-order/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/how-models-know-word-order/references' },
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
									label: 'Position embeddings + RoPE',
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
									label: 'BERT, part one: architecture',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/bert-architecture/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/bert-architecture/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/bert-architecture/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/bert-architecture/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/bert-architecture/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/bert-architecture/references' },
									],
								},
								{
									label: 'BERT, part two: pretraining and fine-tuning',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/bert-pretraining-and-fine-tuning/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/bert-pretraining-and-fine-tuning/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/bert-pretraining-and-fine-tuning/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/bert-pretraining-and-fine-tuning/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/bert-pretraining-and-fine-tuning/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/bert-pretraining-and-fine-tuning/references' },
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
								{
									label: 'Aligning models: RLHF and DPO',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/rlhf-and-dpo/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/rlhf-and-dpo/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/rlhf-and-dpo/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/rlhf-and-dpo/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/rlhf-and-dpo/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/rlhf-and-dpo/references' },
									],
								},
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
								{
									label: 'Few-shot and in-context learning',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/in-context-learning-and-few-shot/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/in-context-learning-and-few-shot/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/in-context-learning-and-few-shot/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/in-context-learning-and-few-shot/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/in-context-learning-and-few-shot/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/in-context-learning-and-few-shot/references' },
									],
								},
								{
									label: 'Chain of thought: thinking out loud',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/chain-of-thought-prompting/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/chain-of-thought-prompting/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/chain-of-thought-prompting/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/chain-of-thought-prompting/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/chain-of-thought-prompting/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/chain-of-thought-prompting/references' },
									],
								},
							],
						},
						{
							label: 'Phase 6\nHow models reason and act',
							collapsed: true,
							items: [
								{
									label: 'How reasoning models think',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/how-reasoning-models-think/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/how-reasoning-models-think/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/how-reasoning-models-think/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/how-reasoning-models-think/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/how-reasoning-models-think/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/how-reasoning-models-think/references' },
									],
								},
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
								{
									label: 'Function calling and tools',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/how-models-call-functions/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/how-models-call-functions/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/how-models-call-functions/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/how-models-call-functions/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/how-models-call-functions/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/how-models-call-functions/references' },
									],
								},
								{
									label: 'Agent loops: observe, plan, act',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/how-agent-loops-work/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/how-agent-loops-work/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/how-agent-loops-work/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/how-agent-loops-work/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/how-agent-loops-work/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/how-agent-loops-work/references' },
									],
								},
							],
						},
						{
							label: "Phase 7\nHow we judge models and where they're going",
							collapsed: true,
							items: [
								{
									label: 'Evaluation: LLM-as-a-Judge',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/how-we-evaluate-models/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/how-we-evaluate-models/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/how-we-evaluate-models/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/how-we-evaluate-models/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/how-we-evaluate-models/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/how-we-evaluate-models/references' },
									],
								},
								{
									label: 'Why benchmarks can mislead',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/why-benchmarks-can-mislead/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/why-benchmarks-can-mislead/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/why-benchmarks-can-mislead/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/why-benchmarks-can-mislead/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/why-benchmarks-can-mislead/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/why-benchmarks-can-mislead/references' },
									],
								},
								{
									label: 'Why tool-using models fail',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/why-tool-using-models-fail/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/why-tool-using-models-fail/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/why-tool-using-models-fail/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/why-tool-using-models-fail/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/why-tool-using-models-fail/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/why-tool-using-models-fail/references' },
									],
								},
								{
									label: 'Transformers beyond text',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/transformers-beyond-text/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/transformers-beyond-text/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/transformers-beyond-text/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/transformers-beyond-text/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/transformers-beyond-text/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/transformers-beyond-text/references' },
									],
								},
								{
									label: 'New ways to generate',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/new-ways-to-generate/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/new-ways-to-generate/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/new-ways-to-generate/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/new-ways-to-generate/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/new-ways-to-generate/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/new-ways-to-generate/references' },
									],
								},
								{
									label: 'Where to be careful: a safety lens',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-foundations/where-to-be-careful/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-foundations/where-to-be-careful/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-foundations/where-to-be-careful/practice' },
										{ label: 'Summary', slug: 'lessons/ai-foundations/where-to-be-careful/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-foundations/where-to-be-careful/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-foundations/where-to-be-careful/references' },
									],
								},
							],
						},
					],
				},
				{
					// Track 6 is grouped by mental-model phase, matching the Track 5
					// pattern. See Doc/curriculum/track-6/mental-model-phases.md for
					// the six-phase arc and Doc/curriculum/track-6/source-to-phase-mapping.md
					// for the phase / phase_order assignment of each lesson.
					label: 'Track 6: Privacy & Local-First AI',
					items: [
						{
							label: 'Phase 1\nWhy your privacy matters when you use AI',
							collapsed: true,
							items: [
								{
									label: 'Why your worry is rational',
									collapsed: true,
									items: [
										{ label: 'Overview', slug: 'lessons/privacy-local-first/why-your-worry-is-rational/brief' },
										{ label: 'Lesson', slug: 'lessons/privacy-local-first/why-your-worry-is-rational/lesson' },
										{ label: 'Practice', slug: 'lessons/privacy-local-first/why-your-worry-is-rational/practice' },
										{ label: 'Summary', slug: 'lessons/privacy-local-first/why-your-worry-is-rational/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/privacy-local-first/why-your-worry-is-rational/cheatsheet' },
										{ label: 'References', slug: 'lessons/privacy-local-first/why-your-worry-is-rational/references' },
									],
								},
								{
									label: 'Your starting point',
									collapsed: true,
									items: [
										{ label: 'Overview', slug: 'lessons/privacy-local-first/your-starting-point/brief' },
										{ label: 'Lesson', slug: 'lessons/privacy-local-first/your-starting-point/lesson' },
										{ label: 'Practice', slug: 'lessons/privacy-local-first/your-starting-point/practice' },
										{ label: 'Summary', slug: 'lessons/privacy-local-first/your-starting-point/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/privacy-local-first/your-starting-point/cheatsheet' },
										{ label: 'References', slug: 'lessons/privacy-local-first/your-starting-point/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nWhat an AI tool sees when you use it',
							collapsed: true,
							items: [
								{
									label: 'What happens in three seconds',
									collapsed: true,
									items: [
										{ label: 'Overview', slug: 'lessons/privacy-local-first/what-happens-in-three-seconds-the-path-your-prompt-takes/brief' },
										{ label: 'Lesson', slug: 'lessons/privacy-local-first/what-happens-in-three-seconds-the-path-your-prompt-takes/lesson' },
										{ label: 'Practice', slug: 'lessons/privacy-local-first/what-happens-in-three-seconds-the-path-your-prompt-takes/practice' },
										{ label: 'Summary', slug: 'lessons/privacy-local-first/what-happens-in-three-seconds-the-path-your-prompt-takes/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/privacy-local-first/what-happens-in-three-seconds-the-path-your-prompt-takes/cheatsheet' },
										{ label: 'References', slug: 'lessons/privacy-local-first/what-happens-in-three-seconds-the-path-your-prompt-takes/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 7: Git Workflow',
					items: [
						{
							label: 'Phase 1\nFoundations',
							collapsed: true,
							items: [
								{
									label: 'Why git exists',
									collapsed: true,
									items: [
									{ label: 'Brief', slug: 'lessons/git-workflow/why-git-exists/brief' },
									{ label: 'Lesson', slug: 'lessons/git-workflow/why-git-exists/lesson' },
									{ label: 'Practice', slug: 'lessons/git-workflow/why-git-exists/practice' },
									{ label: 'Summary', slug: 'lessons/git-workflow/why-git-exists/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/git-workflow/why-git-exists/cheatsheet' },
									{ label: 'References', slug: 'lessons/git-workflow/why-git-exists/references' },
									],
								},
								{
									label: 'Your first repo',
									collapsed: true,
									items: [
									{ label: 'Brief', slug: 'lessons/git-workflow/your-first-repo/brief' },
									{ label: 'Lesson', slug: 'lessons/git-workflow/your-first-repo/lesson' },
									{ label: 'Practice', slug: 'lessons/git-workflow/your-first-repo/practice' },
									{ label: 'Summary', slug: 'lessons/git-workflow/your-first-repo/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/git-workflow/your-first-repo/cheatsheet' },
									{ label: 'References', slug: 'lessons/git-workflow/your-first-repo/references' },
									],
								},
								{
									label: 'Commit hygiene',
									collapsed: true,
									items: [
									{ label: 'Brief', slug: 'lessons/git-workflow/commit-hygiene/brief' },
									{ label: 'Lesson', slug: 'lessons/git-workflow/commit-hygiene/lesson' },
									{ label: 'Practice', slug: 'lessons/git-workflow/commit-hygiene/practice' },
									{ label: 'Summary', slug: 'lessons/git-workflow/commit-hygiene/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/git-workflow/commit-hygiene/cheatsheet' },
									{ label: 'References', slug: 'lessons/git-workflow/commit-hygiene/references' },
									],
								},
								{
									label: 'Undoing things',
									collapsed: true,
									items: [
									{ label: 'Brief', slug: 'lessons/git-workflow/undoing-things/brief' },
									{ label: 'Lesson', slug: 'lessons/git-workflow/undoing-things/lesson' },
									{ label: 'Practice', slug: 'lessons/git-workflow/undoing-things/practice' },
									{ label: 'Summary', slug: 'lessons/git-workflow/undoing-things/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/git-workflow/undoing-things/cheatsheet' },
									{ label: 'References', slug: 'lessons/git-workflow/undoing-things/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nBranching and collaboration',
							collapsed: true,
							items: [
								{
									label: 'Branches',
									collapsed: true,
									items: [
									{ label: 'Brief', slug: 'lessons/git-workflow/branches/brief' },
									{ label: 'Lesson', slug: 'lessons/git-workflow/branches/lesson' },
									{ label: 'Practice', slug: 'lessons/git-workflow/branches/practice' },
									{ label: 'Summary', slug: 'lessons/git-workflow/branches/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/git-workflow/branches/cheatsheet' },
									{ label: 'References', slug: 'lessons/git-workflow/branches/references' },
									],
								},
								{
									label: 'Pull requests',
									collapsed: true,
									items: [
									{ label: 'Brief', slug: 'lessons/git-workflow/pull-requests/brief' },
									{ label: 'Lesson', slug: 'lessons/git-workflow/pull-requests/lesson' },
									{ label: 'Practice', slug: 'lessons/git-workflow/pull-requests/practice' },
									{ label: 'Summary', slug: 'lessons/git-workflow/pull-requests/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/git-workflow/pull-requests/cheatsheet' },
									{ label: 'References', slug: 'lessons/git-workflow/pull-requests/references' },
									],
								},
								{
									label: 'Merge conflicts',
									collapsed: true,
									items: [
									{ label: 'Brief', slug: 'lessons/git-workflow/merge-conflicts/brief' },
									{ label: 'Lesson', slug: 'lessons/git-workflow/merge-conflicts/lesson' },
									{ label: 'Practice', slug: 'lessons/git-workflow/merge-conflicts/practice' },
									{ label: 'Summary', slug: 'lessons/git-workflow/merge-conflicts/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/git-workflow/merge-conflicts/cheatsheet' },
									{ label: 'References', slug: 'lessons/git-workflow/merge-conflicts/references' },
									],
								},
								{
									label: 'Remotes and forks',
									collapsed: true,
									items: [
									{ label: 'Brief', slug: 'lessons/git-workflow/remotes-and-forks/brief' },
									{ label: 'Lesson', slug: 'lessons/git-workflow/remotes-and-forks/lesson' },
									{ label: 'Practice', slug: 'lessons/git-workflow/remotes-and-forks/practice' },
									{ label: 'Summary', slug: 'lessons/git-workflow/remotes-and-forks/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/git-workflow/remotes-and-forks/cheatsheet' },
									{ label: 'References', slug: 'lessons/git-workflow/remotes-and-forks/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nWorkflows in the wild',
							collapsed: true,
							items: [
								{
									label: 'Team workflows',
									collapsed: true,
									items: [
									{ label: 'Brief', slug: 'lessons/git-workflow/team-workflows/brief' },
									{ label: 'Lesson', slug: 'lessons/git-workflow/team-workflows/lesson' },
									{ label: 'Practice', slug: 'lessons/git-workflow/team-workflows/practice' },
									{ label: 'Summary', slug: 'lessons/git-workflow/team-workflows/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/git-workflow/team-workflows/cheatsheet' },
									{ label: 'References', slug: 'lessons/git-workflow/team-workflows/references' },
									],
								},
								{
									label: 'Releases and tags',
									collapsed: true,
									items: [
									{ label: 'Brief', slug: 'lessons/git-workflow/releases-and-tags/brief' },
									{ label: 'Lesson', slug: 'lessons/git-workflow/releases-and-tags/lesson' },
									{ label: 'Practice', slug: 'lessons/git-workflow/releases-and-tags/practice' },
									{ label: 'Summary', slug: 'lessons/git-workflow/releases-and-tags/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/git-workflow/releases-and-tags/cheatsheet' },
									{ label: 'References', slug: 'lessons/git-workflow/releases-and-tags/references' },
									],
								},
								{
									label: 'Cherry-pick and stash',
									collapsed: true,
									items: [
									{ label: 'Brief', slug: 'lessons/git-workflow/cherry-pick-and-stash/brief' },
									{ label: 'Lesson', slug: 'lessons/git-workflow/cherry-pick-and-stash/lesson' },
									{ label: 'Practice', slug: 'lessons/git-workflow/cherry-pick-and-stash/practice' },
									{ label: 'Summary', slug: 'lessons/git-workflow/cherry-pick-and-stash/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/git-workflow/cherry-pick-and-stash/cheatsheet' },
									{ label: 'References', slug: 'lessons/git-workflow/cherry-pick-and-stash/references' },
									],
								},
								{
									label: 'Rebase, deeper',
									collapsed: true,
									items: [
									{ label: 'Brief', slug: 'lessons/git-workflow/rebase-deeper/brief' },
									{ label: 'Lesson', slug: 'lessons/git-workflow/rebase-deeper/lesson' },
									{ label: 'Practice', slug: 'lessons/git-workflow/rebase-deeper/practice' },
									{ label: 'Summary', slug: 'lessons/git-workflow/rebase-deeper/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/git-workflow/rebase-deeper/cheatsheet' },
									{ label: 'References', slug: 'lessons/git-workflow/rebase-deeper/references' },
									],
								},
							],
						},
						{
							label: 'Phase 4\nMulti-agent teams',
							collapsed: true,
							items: [
								{
									label: 'Worktrees and parallel agents',
									collapsed: true,
									items: [
									{ label: 'Brief', slug: 'lessons/git-workflow/worktrees-and-parallel-agents/brief' },
									{ label: 'Lesson', slug: 'lessons/git-workflow/worktrees-and-parallel-agents/lesson' },
									{ label: 'Practice', slug: 'lessons/git-workflow/worktrees-and-parallel-agents/practice' },
									{ label: 'Summary', slug: 'lessons/git-workflow/worktrees-and-parallel-agents/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/git-workflow/worktrees-and-parallel-agents/cheatsheet' },
									{ label: 'References', slug: 'lessons/git-workflow/worktrees-and-parallel-agents/references' },
									],
								},
								{
									label: 'Multi-agent integration patterns',
									collapsed: true,
									items: [
									{ label: 'Brief', slug: 'lessons/git-workflow/multi-agent-integration-patterns/brief' },
									{ label: 'Lesson', slug: 'lessons/git-workflow/multi-agent-integration-patterns/lesson' },
									{ label: 'Practice', slug: 'lessons/git-workflow/multi-agent-integration-patterns/practice' },
									{ label: 'Summary', slug: 'lessons/git-workflow/multi-agent-integration-patterns/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/git-workflow/multi-agent-integration-patterns/cheatsheet' },
									{ label: 'References', slug: 'lessons/git-workflow/multi-agent-integration-patterns/references' },
									],
								},
								{
									label: 'AI-authored commits and PRs',
									collapsed: true,
									items: [
									{ label: 'Brief', slug: 'lessons/git-workflow/ai-authored-commits-and-prs/brief' },
									{ label: 'Lesson', slug: 'lessons/git-workflow/ai-authored-commits-and-prs/lesson' },
									{ label: 'Practice', slug: 'lessons/git-workflow/ai-authored-commits-and-prs/practice' },
									{ label: 'Summary', slug: 'lessons/git-workflow/ai-authored-commits-and-prs/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/git-workflow/ai-authored-commits-and-prs/cheatsheet' },
									{ label: 'References', slug: 'lessons/git-workflow/ai-authored-commits-and-prs/references' },
									],
								},
								{
									label: 'The future of git',
									collapsed: true,
									items: [
									{ label: 'Brief', slug: 'lessons/git-workflow/the-future-of-git-in-an-ai-world/brief' },
									{ label: 'Lesson', slug: 'lessons/git-workflow/the-future-of-git-in-an-ai-world/lesson' },
									{ label: 'Practice', slug: 'lessons/git-workflow/the-future-of-git-in-an-ai-world/practice' },
									{ label: 'Summary', slug: 'lessons/git-workflow/the-future-of-git-in-an-ai-world/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/git-workflow/the-future-of-git-in-an-ai-world/cheatsheet' },
									{ label: 'References', slug: 'lessons/git-workflow/the-future-of-git-in-an-ai-world/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 8: Visual Math: Calculus',
					items: [
						{
							label: 'Phase 1\nWhat a derivative is',
							collapsed: true,
							items: [
								{
									label: 'What calculus is',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-calculus/essence-of-calculus/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-calculus/essence-of-calculus/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-calculus/essence-of-calculus/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-calculus/essence-of-calculus/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-calculus/essence-of-calculus/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-calculus/essence-of-calculus/references' },
									],
								},
								{
									label: 'The derivative as a rate',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-calculus/the-derivative-as-a-rate/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-calculus/the-derivative-as-a-rate/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-calculus/the-derivative-as-a-rate/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-calculus/the-derivative-as-a-rate/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-calculus/the-derivative-as-a-rate/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-calculus/the-derivative-as-a-rate/references' },
									],
								},
								{
									label: 'The power rule',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-calculus/power-rule-from-geometry/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-calculus/power-rule-from-geometry/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-calculus/power-rule-from-geometry/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-calculus/power-rule-from-geometry/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-calculus/power-rule-from-geometry/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-calculus/power-rule-from-geometry/references' },
									],
								},
								{
									label: 'Trig derivatives',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-calculus/trig-derivatives-from-geometry/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-calculus/trig-derivatives-from-geometry/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-calculus/trig-derivatives-from-geometry/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-calculus/trig-derivatives-from-geometry/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-calculus/trig-derivatives-from-geometry/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-calculus/trig-derivatives-from-geometry/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nThe differentiation toolkit',
							collapsed: true,
							items: [
								{
									label: 'The product rule',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-calculus/product-rule-visually/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-calculus/product-rule-visually/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-calculus/product-rule-visually/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-calculus/product-rule-visually/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-calculus/product-rule-visually/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-calculus/product-rule-visually/references' },
									],
								},
								{
									label: 'The chain rule',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-calculus/chain-rule-visually/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-calculus/chain-rule-visually/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-calculus/chain-rule-visually/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-calculus/chain-rule-visually/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-calculus/chain-rule-visually/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-calculus/chain-rule-visually/references' },
									],
								},
								{
									label: 'Why e is special',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-calculus/why-e-is-special/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-calculus/why-e-is-special/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-calculus/why-e-is-special/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-calculus/why-e-is-special/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-calculus/why-e-is-special/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-calculus/why-e-is-special/references' },
									],
								},
								{
									label: 'Implicit differentiation',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-calculus/implicit-differentiation/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-calculus/implicit-differentiation/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-calculus/implicit-differentiation/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-calculus/implicit-differentiation/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-calculus/implicit-differentiation/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-calculus/implicit-differentiation/references' },
									],
								},
								{
									label: 'Limits, carefully',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-calculus/limits-done-carefully/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-calculus/limits-done-carefully/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-calculus/limits-done-carefully/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-calculus/limits-done-carefully/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-calculus/limits-done-carefully/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-calculus/limits-done-carefully/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nIntegration and approximation',
							collapsed: true,
							items: [
								{
									label: 'Integration & the FTC',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-calculus/integration-and-the-fundamental-theorem/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-calculus/integration-and-the-fundamental-theorem/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-calculus/integration-and-the-fundamental-theorem/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-calculus/integration-and-the-fundamental-theorem/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-calculus/integration-and-the-fundamental-theorem/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-calculus/integration-and-the-fundamental-theorem/references' },
									],
								},
								{
									label: 'Why area equals slope',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-calculus/why-area-equals-slope/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-calculus/why-area-equals-slope/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-calculus/why-area-equals-slope/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-calculus/why-area-equals-slope/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-calculus/why-area-equals-slope/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-calculus/why-area-equals-slope/references' },
									],
								},
								{
									label: 'Higher-order derivatives',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-calculus/higher-order-derivatives/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-calculus/higher-order-derivatives/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-calculus/higher-order-derivatives/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-calculus/higher-order-derivatives/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-calculus/higher-order-derivatives/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-calculus/higher-order-derivatives/references' },
									],
								},
								{
									label: 'Taylor series',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/visual-math-calculus/taylor-series/brief' },
										{ label: 'Lesson', slug: 'lessons/visual-math-calculus/taylor-series/lesson' },
										{ label: 'Practice', slug: 'lessons/visual-math-calculus/taylor-series/practice' },
										{ label: 'Summary', slug: 'lessons/visual-math-calculus/taylor-series/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/visual-math-calculus/taylor-series/cheatsheet' },
										{ label: 'References', slug: 'lessons/visual-math-calculus/taylor-series/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 9: Statistics & Probability for AI',
					items: [
						{
							label: 'Phase 1\nDescribing data',
							collapsed: true,
							items: [
								{
									label: 'Why AI runs on stats',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/statistics-and-probability/why-ai-runs-on-statistics/brief' },
										{ label: 'Lesson', slug: 'lessons/statistics-and-probability/why-ai-runs-on-statistics/lesson' },
										{ label: 'Practice', slug: 'lessons/statistics-and-probability/why-ai-runs-on-statistics/practice' },
										{ label: 'Summary', slug: 'lessons/statistics-and-probability/why-ai-runs-on-statistics/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/statistics-and-probability/why-ai-runs-on-statistics/cheatsheet' },
										{ label: 'References', slug: 'lessons/statistics-and-probability/why-ai-runs-on-statistics/references' },
									],
								},
								{
									label: 'Center and spread',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/statistics-and-probability/summarizing-data-center-and-spread/brief' },
										{ label: 'Lesson', slug: 'lessons/statistics-and-probability/summarizing-data-center-and-spread/lesson' },
										{ label: 'Practice', slug: 'lessons/statistics-and-probability/summarizing-data-center-and-spread/practice' },
										{ label: 'Summary', slug: 'lessons/statistics-and-probability/summarizing-data-center-and-spread/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/statistics-and-probability/summarizing-data-center-and-spread/cheatsheet' },
										{ label: 'References', slug: 'lessons/statistics-and-probability/summarizing-data-center-and-spread/references' },
									],
								},
								{
									label: 'The shape of data',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/statistics-and-probability/the-shape-of-data-distributions-and-histograms/brief' },
										{ label: 'Lesson', slug: 'lessons/statistics-and-probability/the-shape-of-data-distributions-and-histograms/lesson' },
										{ label: 'Practice', slug: 'lessons/statistics-and-probability/the-shape-of-data-distributions-and-histograms/practice' },
										{ label: 'Summary', slug: 'lessons/statistics-and-probability/the-shape-of-data-distributions-and-histograms/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/statistics-and-probability/the-shape-of-data-distributions-and-histograms/cheatsheet' },
										{ label: 'References', slug: 'lessons/statistics-and-probability/the-shape-of-data-distributions-and-histograms/references' },
									],
								},
								{
									label: 'Correlation',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/statistics-and-probability/when-two-things-move-together-correlation/brief' },
										{ label: 'Lesson', slug: 'lessons/statistics-and-probability/when-two-things-move-together-correlation/lesson' },
										{ label: 'Practice', slug: 'lessons/statistics-and-probability/when-two-things-move-together-correlation/practice' },
										{ label: 'Summary', slug: 'lessons/statistics-and-probability/when-two-things-move-together-correlation/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/statistics-and-probability/when-two-things-move-together-correlation/cheatsheet' },
										{ label: 'References', slug: 'lessons/statistics-and-probability/when-two-things-move-together-correlation/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nThe laws of chance',
							collapsed: true,
							items: [
								{
									label: 'Probability foundations',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/statistics-and-probability/probability-foundations/brief' },
										{ label: 'Lesson', slug: 'lessons/statistics-and-probability/probability-foundations/lesson' },
										{ label: 'Practice', slug: 'lessons/statistics-and-probability/probability-foundations/practice' },
										{ label: 'Summary', slug: 'lessons/statistics-and-probability/probability-foundations/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/statistics-and-probability/probability-foundations/cheatsheet' },
										{ label: 'References', slug: 'lessons/statistics-and-probability/probability-foundations/references' },
									],
								},
								{
									label: 'Conditional probability',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/statistics-and-probability/conditional-probability-and-independence/brief' },
										{ label: 'Lesson', slug: 'lessons/statistics-and-probability/conditional-probability-and-independence/lesson' },
										{ label: 'Practice', slug: 'lessons/statistics-and-probability/conditional-probability-and-independence/practice' },
										{ label: 'Summary', slug: 'lessons/statistics-and-probability/conditional-probability-and-independence/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/statistics-and-probability/conditional-probability-and-independence/cheatsheet' },
										{ label: 'References', slug: 'lessons/statistics-and-probability/conditional-probability-and-independence/references' },
									],
								},
								{
									label: 'Bayes\' theorem',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/statistics-and-probability/bayes-theorem/brief' },
										{ label: 'Lesson', slug: 'lessons/statistics-and-probability/bayes-theorem/lesson' },
										{ label: 'Practice', slug: 'lessons/statistics-and-probability/bayes-theorem/practice' },
										{ label: 'Summary', slug: 'lessons/statistics-and-probability/bayes-theorem/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/statistics-and-probability/bayes-theorem/cheatsheet' },
										{ label: 'References', slug: 'lessons/statistics-and-probability/bayes-theorem/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nRandom variables and distributions',
							collapsed: true,
							items: [
								{
									label: 'Expected value',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/statistics-and-probability/random-variables-and-expected-value/brief' },
										{ label: 'Lesson', slug: 'lessons/statistics-and-probability/random-variables-and-expected-value/lesson' },
										{ label: 'Practice', slug: 'lessons/statistics-and-probability/random-variables-and-expected-value/practice' },
										{ label: 'Summary', slug: 'lessons/statistics-and-probability/random-variables-and-expected-value/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/statistics-and-probability/random-variables-and-expected-value/cheatsheet' },
										{ label: 'References', slug: 'lessons/statistics-and-probability/random-variables-and-expected-value/references' },
									],
								},
								{
									label: 'The normal distribution',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/statistics-and-probability/the-normal-distribution/brief' },
										{ label: 'Lesson', slug: 'lessons/statistics-and-probability/the-normal-distribution/lesson' },
										{ label: 'Practice', slug: 'lessons/statistics-and-probability/the-normal-distribution/practice' },
										{ label: 'Summary', slug: 'lessons/statistics-and-probability/the-normal-distribution/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/statistics-and-probability/the-normal-distribution/cheatsheet' },
										{ label: 'References', slug: 'lessons/statistics-and-probability/the-normal-distribution/references' },
									],
								},
								{
									label: 'The binomial distribution',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/statistics-and-probability/the-binomial-distribution/brief' },
										{ label: 'Lesson', slug: 'lessons/statistics-and-probability/the-binomial-distribution/lesson' },
										{ label: 'Practice', slug: 'lessons/statistics-and-probability/the-binomial-distribution/practice' },
										{ label: 'Summary', slug: 'lessons/statistics-and-probability/the-binomial-distribution/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/statistics-and-probability/the-binomial-distribution/cheatsheet' },
										{ label: 'References', slug: 'lessons/statistics-and-probability/the-binomial-distribution/references' },
									],
								},
							],
						},
						{
							label: 'Phase 4\nFrom sample to truth',
							collapsed: true,
							items: [
								{
									label: 'Sampling and the CLT',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/statistics-and-probability/sampling-and-the-central-limit-theorem/brief' },
										{ label: 'Lesson', slug: 'lessons/statistics-and-probability/sampling-and-the-central-limit-theorem/lesson' },
										{ label: 'Practice', slug: 'lessons/statistics-and-probability/sampling-and-the-central-limit-theorem/practice' },
										{ label: 'Summary', slug: 'lessons/statistics-and-probability/sampling-and-the-central-limit-theorem/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/statistics-and-probability/sampling-and-the-central-limit-theorem/cheatsheet' },
										{ label: 'References', slug: 'lessons/statistics-and-probability/sampling-and-the-central-limit-theorem/references' },
									],
								},
								{
									label: 'Confidence intervals',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/statistics-and-probability/confidence-intervals/brief' },
										{ label: 'Lesson', slug: 'lessons/statistics-and-probability/confidence-intervals/lesson' },
										{ label: 'Practice', slug: 'lessons/statistics-and-probability/confidence-intervals/practice' },
										{ label: 'Summary', slug: 'lessons/statistics-and-probability/confidence-intervals/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/statistics-and-probability/confidence-intervals/cheatsheet' },
										{ label: 'References', slug: 'lessons/statistics-and-probability/confidence-intervals/references' },
									],
								},
								{
									label: 'Hypothesis testing',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/statistics-and-probability/hypothesis-testing-and-p-values/brief' },
										{ label: 'Lesson', slug: 'lessons/statistics-and-probability/hypothesis-testing-and-p-values/lesson' },
										{ label: 'Practice', slug: 'lessons/statistics-and-probability/hypothesis-testing-and-p-values/practice' },
										{ label: 'Summary', slug: 'lessons/statistics-and-probability/hypothesis-testing-and-p-values/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/statistics-and-probability/hypothesis-testing-and-p-values/cheatsheet' },
										{ label: 'References', slug: 'lessons/statistics-and-probability/hypothesis-testing-and-p-values/references' },
									],
								},
								{
									label: 'Stats in ML',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/statistics-and-probability/statistics-in-machine-learning/brief' },
										{ label: 'Lesson', slug: 'lessons/statistics-and-probability/statistics-in-machine-learning/lesson' },
										{ label: 'Practice', slug: 'lessons/statistics-and-probability/statistics-in-machine-learning/practice' },
										{ label: 'Summary', slug: 'lessons/statistics-and-probability/statistics-in-machine-learning/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/statistics-and-probability/statistics-in-machine-learning/cheatsheet' },
										{ label: 'References', slug: 'lessons/statistics-and-probability/statistics-in-machine-learning/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 10: Classical Machine Learning',
					items: [
						{
							label: 'Phase 1\nLearning from data',
							collapsed: true,
							items: [
								{
									label: 'What ML actually is',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/classical-machine-learning/what-machine-learning-actually-is/brief' },
										{ label: 'Lesson', slug: 'lessons/classical-machine-learning/what-machine-learning-actually-is/lesson' },
										{ label: 'Practice', slug: 'lessons/classical-machine-learning/what-machine-learning-actually-is/practice' },
										{ label: 'Summary', slug: 'lessons/classical-machine-learning/what-machine-learning-actually-is/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/classical-machine-learning/what-machine-learning-actually-is/cheatsheet' },
										{ label: 'References', slug: 'lessons/classical-machine-learning/what-machine-learning-actually-is/references' },
									],
								},
								{
									label: 'Linear regression',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/classical-machine-learning/fitting-a-line-linear-regression/brief' },
										{ label: 'Lesson', slug: 'lessons/classical-machine-learning/fitting-a-line-linear-regression/lesson' },
										{ label: 'Practice', slug: 'lessons/classical-machine-learning/fitting-a-line-linear-regression/practice' },
										{ label: 'Summary', slug: 'lessons/classical-machine-learning/fitting-a-line-linear-regression/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/classical-machine-learning/fitting-a-line-linear-regression/cheatsheet' },
										{ label: 'References', slug: 'lessons/classical-machine-learning/fitting-a-line-linear-regression/references' },
									],
								},
								{
									label: 'Gradient descent',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/classical-machine-learning/how-models-learn-gradient-descent/brief' },
										{ label: 'Lesson', slug: 'lessons/classical-machine-learning/how-models-learn-gradient-descent/lesson' },
										{ label: 'Practice', slug: 'lessons/classical-machine-learning/how-models-learn-gradient-descent/practice' },
										{ label: 'Summary', slug: 'lessons/classical-machine-learning/how-models-learn-gradient-descent/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/classical-machine-learning/how-models-learn-gradient-descent/cheatsheet' },
										{ label: 'References', slug: 'lessons/classical-machine-learning/how-models-learn-gradient-descent/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nClassification and ensembles',
							collapsed: true,
							items: [
								{
									label: 'Logistic regression',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/classical-machine-learning/logistic-regression/brief' },
										{ label: 'Lesson', slug: 'lessons/classical-machine-learning/logistic-regression/lesson' },
										{ label: 'Practice', slug: 'lessons/classical-machine-learning/logistic-regression/practice' },
										{ label: 'Summary', slug: 'lessons/classical-machine-learning/logistic-regression/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/classical-machine-learning/logistic-regression/cheatsheet' },
										{ label: 'References', slug: 'lessons/classical-machine-learning/logistic-regression/references' },
									],
								},
								{
									label: 'Decision trees',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/classical-machine-learning/decision-trees/brief' },
										{ label: 'Lesson', slug: 'lessons/classical-machine-learning/decision-trees/lesson' },
										{ label: 'Practice', slug: 'lessons/classical-machine-learning/decision-trees/practice' },
										{ label: 'Summary', slug: 'lessons/classical-machine-learning/decision-trees/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/classical-machine-learning/decision-trees/cheatsheet' },
										{ label: 'References', slug: 'lessons/classical-machine-learning/decision-trees/references' },
									],
								},
								{
									label: 'Random forests',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/classical-machine-learning/random-forests/brief' },
										{ label: 'Lesson', slug: 'lessons/classical-machine-learning/random-forests/lesson' },
										{ label: 'Practice', slug: 'lessons/classical-machine-learning/random-forests/practice' },
										{ label: 'Summary', slug: 'lessons/classical-machine-learning/random-forests/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/classical-machine-learning/random-forests/cheatsheet' },
										{ label: 'References', slug: 'lessons/classical-machine-learning/random-forests/references' },
									],
								},
								{
									label: 'Boosting',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/classical-machine-learning/boosting/brief' },
										{ label: 'Lesson', slug: 'lessons/classical-machine-learning/boosting/lesson' },
										{ label: 'Practice', slug: 'lessons/classical-machine-learning/boosting/practice' },
										{ label: 'Summary', slug: 'lessons/classical-machine-learning/boosting/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/classical-machine-learning/boosting/cheatsheet' },
										{ label: 'References', slug: 'lessons/classical-machine-learning/boosting/references' },
									],
								},
								{
									label: 'Support vector machines',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/classical-machine-learning/support-vector-machines/brief' },
										{ label: 'Lesson', slug: 'lessons/classical-machine-learning/support-vector-machines/lesson' },
										{ label: 'Practice', slug: 'lessons/classical-machine-learning/support-vector-machines/practice' },
										{ label: 'Summary', slug: 'lessons/classical-machine-learning/support-vector-machines/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/classical-machine-learning/support-vector-machines/cheatsheet' },
										{ label: 'References', slug: 'lessons/classical-machine-learning/support-vector-machines/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nUnsupervised learning',
							collapsed: true,
							items: [
								{
									label: 'K-means clustering',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/classical-machine-learning/k-means-clustering/brief' },
										{ label: 'Lesson', slug: 'lessons/classical-machine-learning/k-means-clustering/lesson' },
										{ label: 'Practice', slug: 'lessons/classical-machine-learning/k-means-clustering/practice' },
										{ label: 'Summary', slug: 'lessons/classical-machine-learning/k-means-clustering/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/classical-machine-learning/k-means-clustering/cheatsheet' },
										{ label: 'References', slug: 'lessons/classical-machine-learning/k-means-clustering/references' },
									],
								},
								{
									label: 'Hierarchical clustering',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/classical-machine-learning/hierarchical-clustering/brief' },
										{ label: 'Lesson', slug: 'lessons/classical-machine-learning/hierarchical-clustering/lesson' },
										{ label: 'Practice', slug: 'lessons/classical-machine-learning/hierarchical-clustering/practice' },
										{ label: 'Summary', slug: 'lessons/classical-machine-learning/hierarchical-clustering/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/classical-machine-learning/hierarchical-clustering/cheatsheet' },
										{ label: 'References', slug: 'lessons/classical-machine-learning/hierarchical-clustering/references' },
									],
								},
								{
									label: 'PCA',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/classical-machine-learning/pca/brief' },
										{ label: 'Lesson', slug: 'lessons/classical-machine-learning/pca/lesson' },
										{ label: 'Practice', slug: 'lessons/classical-machine-learning/pca/practice' },
										{ label: 'Summary', slug: 'lessons/classical-machine-learning/pca/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/classical-machine-learning/pca/cheatsheet' },
										{ label: 'References', slug: 'lessons/classical-machine-learning/pca/references' },
									],
								},
								{
									label: 't-SNE',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/classical-machine-learning/t-sne/brief' },
										{ label: 'Lesson', slug: 'lessons/classical-machine-learning/t-sne/lesson' },
										{ label: 'Practice', slug: 'lessons/classical-machine-learning/t-sne/practice' },
										{ label: 'Summary', slug: 'lessons/classical-machine-learning/t-sne/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/classical-machine-learning/t-sne/cheatsheet' },
										{ label: 'References', slug: 'lessons/classical-machine-learning/t-sne/references' },
									],
								},
							],
						},
						{
							label: 'Phase 4\nModel evaluation',
							collapsed: true,
							items: [
								{
									label: 'Bias-variance tradeoff',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/classical-machine-learning/bias-variance-tradeoff/brief' },
										{ label: 'Lesson', slug: 'lessons/classical-machine-learning/bias-variance-tradeoff/lesson' },
										{ label: 'Practice', slug: 'lessons/classical-machine-learning/bias-variance-tradeoff/practice' },
										{ label: 'Summary', slug: 'lessons/classical-machine-learning/bias-variance-tradeoff/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/classical-machine-learning/bias-variance-tradeoff/cheatsheet' },
										{ label: 'References', slug: 'lessons/classical-machine-learning/bias-variance-tradeoff/references' },
									],
								},
								{
									label: 'Cross-validation',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/classical-machine-learning/cross-validation/brief' },
										{ label: 'Lesson', slug: 'lessons/classical-machine-learning/cross-validation/lesson' },
										{ label: 'Practice', slug: 'lessons/classical-machine-learning/cross-validation/practice' },
										{ label: 'Summary', slug: 'lessons/classical-machine-learning/cross-validation/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/classical-machine-learning/cross-validation/cheatsheet' },
										{ label: 'References', slug: 'lessons/classical-machine-learning/cross-validation/references' },
									],
								},
								{
									label: 'Classification metrics',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/classical-machine-learning/classification-metrics/brief' },
										{ label: 'Lesson', slug: 'lessons/classical-machine-learning/classification-metrics/lesson' },
										{ label: 'Practice', slug: 'lessons/classical-machine-learning/classification-metrics/practice' },
										{ label: 'Summary', slug: 'lessons/classical-machine-learning/classification-metrics/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/classical-machine-learning/classification-metrics/cheatsheet' },
										{ label: 'References', slug: 'lessons/classical-machine-learning/classification-metrics/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 11: Neural Network Intuition',
					items: [
						{
							label: 'Phase 1\nNetwork structure',
							collapsed: true,
							items: [
								{
									label: 'Handwritten digits',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/neural-network-intuition/the-handwritten-digit-problem/brief' },
										{ label: 'Lesson', slug: 'lessons/neural-network-intuition/the-handwritten-digit-problem/lesson' },
										{ label: 'Practice', slug: 'lessons/neural-network-intuition/the-handwritten-digit-problem/practice' },
										{ label: 'Summary', slug: 'lessons/neural-network-intuition/the-handwritten-digit-problem/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/neural-network-intuition/the-handwritten-digit-problem/cheatsheet' },
										{ label: 'References', slug: 'lessons/neural-network-intuition/the-handwritten-digit-problem/references' },
									],
								},
								{
									label: 'Neurons and layers',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/neural-network-intuition/neurons-and-layers/brief' },
										{ label: 'Lesson', slug: 'lessons/neural-network-intuition/neurons-and-layers/lesson' },
										{ label: 'Practice', slug: 'lessons/neural-network-intuition/neurons-and-layers/practice' },
										{ label: 'Summary', slug: 'lessons/neural-network-intuition/neurons-and-layers/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/neural-network-intuition/neurons-and-layers/cheatsheet' },
										{ label: 'References', slug: 'lessons/neural-network-intuition/neurons-and-layers/references' },
									],
								},
								{
									label: 'Weights and the squish',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/neural-network-intuition/weights-biases-and-the-squish/brief' },
										{ label: 'Lesson', slug: 'lessons/neural-network-intuition/weights-biases-and-the-squish/lesson' },
										{ label: 'Practice', slug: 'lessons/neural-network-intuition/weights-biases-and-the-squish/practice' },
										{ label: 'Summary', slug: 'lessons/neural-network-intuition/weights-biases-and-the-squish/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/neural-network-intuition/weights-biases-and-the-squish/cheatsheet' },
										{ label: 'References', slug: 'lessons/neural-network-intuition/weights-biases-and-the-squish/references' },
									],
								},
								{
									label: 'The whole network',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/neural-network-intuition/the-whole-network-as-one-function/brief' },
										{ label: 'Lesson', slug: 'lessons/neural-network-intuition/the-whole-network-as-one-function/lesson' },
										{ label: 'Practice', slug: 'lessons/neural-network-intuition/the-whole-network-as-one-function/practice' },
										{ label: 'Summary', slug: 'lessons/neural-network-intuition/the-whole-network-as-one-function/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/neural-network-intuition/the-whole-network-as-one-function/cheatsheet' },
										{ label: 'References', slug: 'lessons/neural-network-intuition/the-whole-network-as-one-function/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nHow networks learn',
							collapsed: true,
							items: [
								{
									label: 'What learning means',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/neural-network-intuition/what-learning-really-means/brief' },
										{ label: 'Lesson', slug: 'lessons/neural-network-intuition/what-learning-really-means/lesson' },
										{ label: 'Practice', slug: 'lessons/neural-network-intuition/what-learning-really-means/practice' },
										{ label: 'Summary', slug: 'lessons/neural-network-intuition/what-learning-really-means/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/neural-network-intuition/what-learning-really-means/cheatsheet' },
										{ label: 'References', slug: 'lessons/neural-network-intuition/what-learning-really-means/references' },
									],
								},
								{
									label: 'The cost landscape',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/neural-network-intuition/the-cost-landscape/brief' },
										{ label: 'Lesson', slug: 'lessons/neural-network-intuition/the-cost-landscape/lesson' },
										{ label: 'Practice', slug: 'lessons/neural-network-intuition/the-cost-landscape/practice' },
										{ label: 'Summary', slug: 'lessons/neural-network-intuition/the-cost-landscape/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/neural-network-intuition/the-cost-landscape/cheatsheet' },
										{ label: 'References', slug: 'lessons/neural-network-intuition/the-cost-landscape/references' },
									],
								},
								{
									label: 'Gradient descent',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/neural-network-intuition/gradient-descent-step-by-step/brief' },
										{ label: 'Lesson', slug: 'lessons/neural-network-intuition/gradient-descent-step-by-step/lesson' },
										{ label: 'Practice', slug: 'lessons/neural-network-intuition/gradient-descent-step-by-step/practice' },
										{ label: 'Summary', slug: 'lessons/neural-network-intuition/gradient-descent-step-by-step/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/neural-network-intuition/gradient-descent-step-by-step/cheatsheet' },
										{ label: 'References', slug: 'lessons/neural-network-intuition/gradient-descent-step-by-step/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nBackpropagation',
							collapsed: true,
							items: [
								{
									label: 'What backprop does',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/neural-network-intuition/what-backpropagation-is-really-doing/brief' },
										{ label: 'Lesson', slug: 'lessons/neural-network-intuition/what-backpropagation-is-really-doing/lesson' },
										{ label: 'Practice', slug: 'lessons/neural-network-intuition/what-backpropagation-is-really-doing/practice' },
										{ label: 'Summary', slug: 'lessons/neural-network-intuition/what-backpropagation-is-really-doing/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/neural-network-intuition/what-backpropagation-is-really-doing/cheatsheet' },
										{ label: 'References', slug: 'lessons/neural-network-intuition/what-backpropagation-is-really-doing/references' },
									],
								},
								{
									label: 'Backprop and chain rule',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/neural-network-intuition/backpropagation-and-the-chain-rule/brief' },
										{ label: 'Lesson', slug: 'lessons/neural-network-intuition/backpropagation-and-the-chain-rule/lesson' },
										{ label: 'Practice', slug: 'lessons/neural-network-intuition/backpropagation-and-the-chain-rule/practice' },
										{ label: 'Summary', slug: 'lessons/neural-network-intuition/backpropagation-and-the-chain-rule/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/neural-network-intuition/backpropagation-and-the-chain-rule/cheatsheet' },
										{ label: 'References', slug: 'lessons/neural-network-intuition/backpropagation-and-the-chain-rule/references' },
									],
								},
								{
									label: 'Seeing it whole',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/neural-network-intuition/seeing-it-whole-and-where-next/brief' },
										{ label: 'Lesson', slug: 'lessons/neural-network-intuition/seeing-it-whole-and-where-next/lesson' },
										{ label: 'Practice', slug: 'lessons/neural-network-intuition/seeing-it-whole-and-where-next/practice' },
										{ label: 'Summary', slug: 'lessons/neural-network-intuition/seeing-it-whole-and-where-next/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/neural-network-intuition/seeing-it-whole-and-where-next/cheatsheet' },
										{ label: 'References', slug: 'lessons/neural-network-intuition/seeing-it-whole-and-where-next/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 12: Intro to Deep Learning',
					items: [
						{
							label: 'Phase 1\nFoundations and sequences',
							collapsed: true,
							items: [
								{
									label: 'What deep learning adds',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/intro-to-deep-learning/what-deep-learning-adds/brief' },
										{ label: 'Lesson', slug: 'lessons/intro-to-deep-learning/what-deep-learning-adds/lesson' },
										{ label: 'Practice', slug: 'lessons/intro-to-deep-learning/what-deep-learning-adds/practice' },
										{ label: 'Summary', slug: 'lessons/intro-to-deep-learning/what-deep-learning-adds/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/intro-to-deep-learning/what-deep-learning-adds/cheatsheet' },
										{ label: 'References', slug: 'lessons/intro-to-deep-learning/what-deep-learning-adds/references' },
									],
								},
								{
									label: 'Why sequences need memory',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/intro-to-deep-learning/why-sequences-need-memory/brief' },
										{ label: 'Lesson', slug: 'lessons/intro-to-deep-learning/why-sequences-need-memory/lesson' },
										{ label: 'Practice', slug: 'lessons/intro-to-deep-learning/why-sequences-need-memory/practice' },
										{ label: 'Summary', slug: 'lessons/intro-to-deep-learning/why-sequences-need-memory/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/intro-to-deep-learning/why-sequences-need-memory/cheatsheet' },
										{ label: 'References', slug: 'lessons/intro-to-deep-learning/why-sequences-need-memory/references' },
									],
								},
								{
									label: 'Attention and transformers',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/intro-to-deep-learning/attention-and-transformers-in-brief/brief' },
										{ label: 'Lesson', slug: 'lessons/intro-to-deep-learning/attention-and-transformers-in-brief/lesson' },
										{ label: 'Practice', slug: 'lessons/intro-to-deep-learning/attention-and-transformers-in-brief/practice' },
										{ label: 'Summary', slug: 'lessons/intro-to-deep-learning/attention-and-transformers-in-brief/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/intro-to-deep-learning/attention-and-transformers-in-brief/cheatsheet' },
										{ label: 'References', slug: 'lessons/intro-to-deep-learning/attention-and-transformers-in-brief/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nVision and generation',
							collapsed: true,
							items: [
								{
									label: 'How machines see',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/intro-to-deep-learning/how-machines-see-convolution/brief' },
										{ label: 'Lesson', slug: 'lessons/intro-to-deep-learning/how-machines-see-convolution/lesson' },
										{ label: 'Practice', slug: 'lessons/intro-to-deep-learning/how-machines-see-convolution/practice' },
										{ label: 'Summary', slug: 'lessons/intro-to-deep-learning/how-machines-see-convolution/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/intro-to-deep-learning/how-machines-see-convolution/cheatsheet' },
										{ label: 'References', slug: 'lessons/intro-to-deep-learning/how-machines-see-convolution/references' },
									],
								},
								{
									label: 'From edges to objects',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/intro-to-deep-learning/from-edges-to-objects/brief' },
										{ label: 'Lesson', slug: 'lessons/intro-to-deep-learning/from-edges-to-objects/lesson' },
										{ label: 'Practice', slug: 'lessons/intro-to-deep-learning/from-edges-to-objects/practice' },
										{ label: 'Summary', slug: 'lessons/intro-to-deep-learning/from-edges-to-objects/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/intro-to-deep-learning/from-edges-to-objects/cheatsheet' },
										{ label: 'References', slug: 'lessons/intro-to-deep-learning/from-edges-to-objects/references' },
									],
								},
								{
									label: 'Teaching machines to imagine',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/intro-to-deep-learning/teaching-machines-to-imagine/brief' },
										{ label: 'Lesson', slug: 'lessons/intro-to-deep-learning/teaching-machines-to-imagine/lesson' },
										{ label: 'Practice', slug: 'lessons/intro-to-deep-learning/teaching-machines-to-imagine/practice' },
										{ label: 'Summary', slug: 'lessons/intro-to-deep-learning/teaching-machines-to-imagine/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/intro-to-deep-learning/teaching-machines-to-imagine/cheatsheet' },
										{ label: 'References', slug: 'lessons/intro-to-deep-learning/teaching-machines-to-imagine/references' },
									],
								},
								{
									label: 'Generating by denoising',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/intro-to-deep-learning/generating-by-denoising-diffusion/brief' },
										{ label: 'Lesson', slug: 'lessons/intro-to-deep-learning/generating-by-denoising-diffusion/lesson' },
										{ label: 'Practice', slug: 'lessons/intro-to-deep-learning/generating-by-denoising-diffusion/practice' },
										{ label: 'Summary', slug: 'lessons/intro-to-deep-learning/generating-by-denoising-diffusion/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/intro-to-deep-learning/generating-by-denoising-diffusion/cheatsheet' },
										{ label: 'References', slug: 'lessons/intro-to-deep-learning/generating-by-denoising-diffusion/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nDecisions and limits',
							collapsed: true,
							items: [
								{
									label: 'Learning by trial and reward',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/intro-to-deep-learning/learning-by-trial-and-reward/brief' },
										{ label: 'Lesson', slug: 'lessons/intro-to-deep-learning/learning-by-trial-and-reward/lesson' },
										{ label: 'Practice', slug: 'lessons/intro-to-deep-learning/learning-by-trial-and-reward/practice' },
										{ label: 'Summary', slug: 'lessons/intro-to-deep-learning/learning-by-trial-and-reward/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/intro-to-deep-learning/learning-by-trial-and-reward/cheatsheet' },
										{ label: 'References', slug: 'lessons/intro-to-deep-learning/learning-by-trial-and-reward/references' },
									],
								},
								{
									label: 'Where deep learning breaks',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/intro-to-deep-learning/where-deep-learning-breaks/brief' },
										{ label: 'Lesson', slug: 'lessons/intro-to-deep-learning/where-deep-learning-breaks/lesson' },
										{ label: 'Practice', slug: 'lessons/intro-to-deep-learning/where-deep-learning-breaks/practice' },
										{ label: 'Summary', slug: 'lessons/intro-to-deep-learning/where-deep-learning-breaks/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/intro-to-deep-learning/where-deep-learning-breaks/cheatsheet' },
										{ label: 'References', slug: 'lessons/intro-to-deep-learning/where-deep-learning-breaks/references' },
									],
								},
								{
									label: 'Seeing the field whole',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/intro-to-deep-learning/seeing-the-field-whole/brief' },
										{ label: 'Lesson', slug: 'lessons/intro-to-deep-learning/seeing-the-field-whole/lesson' },
										{ label: 'Practice', slug: 'lessons/intro-to-deep-learning/seeing-the-field-whole/practice' },
										{ label: 'Summary', slug: 'lessons/intro-to-deep-learning/seeing-the-field-whole/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/intro-to-deep-learning/seeing-the-field-whole/cheatsheet' },
										{ label: 'References', slug: 'lessons/intro-to-deep-learning/seeing-the-field-whole/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 13: Build Neural Networks from Scratch',
					items: [
						{
							label: 'Phase 1\nThe autograd engine',
							collapsed: true,
							items: [
								{
									label: 'Building an autograd engine',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-nns-from-scratch/micrograd-the-autograd-engine/brief' },
										{ label: 'Lesson', slug: 'lessons/build-nns-from-scratch/micrograd-the-autograd-engine/lesson' },
										{ label: 'Practice', slug: 'lessons/build-nns-from-scratch/micrograd-the-autograd-engine/practice' },
										{ label: 'Summary', slug: 'lessons/build-nns-from-scratch/micrograd-the-autograd-engine/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-nns-from-scratch/micrograd-the-autograd-engine/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-nns-from-scratch/micrograd-the-autograd-engine/references' },
									],
								},
								{
									label: 'Training a neural net',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-nns-from-scratch/building-and-training-a-net/brief' },
										{ label: 'Lesson', slug: 'lessons/build-nns-from-scratch/building-and-training-a-net/lesson' },
										{ label: 'Practice', slug: 'lessons/build-nns-from-scratch/building-and-training-a-net/practice' },
										{ label: 'Summary', slug: 'lessons/build-nns-from-scratch/building-and-training-a-net/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-nns-from-scratch/building-and-training-a-net/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-nns-from-scratch/building-and-training-a-net/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nBuilding a language model',
							collapsed: true,
							items: [
								{
									label: 'The bigram model',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-nns-from-scratch/makemore-the-bigram-model/brief' },
										{ label: 'Lesson', slug: 'lessons/build-nns-from-scratch/makemore-the-bigram-model/lesson' },
										{ label: 'Practice', slug: 'lessons/build-nns-from-scratch/makemore-the-bigram-model/practice' },
										{ label: 'Summary', slug: 'lessons/build-nns-from-scratch/makemore-the-bigram-model/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-nns-from-scratch/makemore-the-bigram-model/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-nns-from-scratch/makemore-the-bigram-model/references' },
									],
								},
								{
									label: 'An MLP language model',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-nns-from-scratch/makemore-mlp-language-model/brief' },
										{ label: 'Lesson', slug: 'lessons/build-nns-from-scratch/makemore-mlp-language-model/lesson' },
										{ label: 'Practice', slug: 'lessons/build-nns-from-scratch/makemore-mlp-language-model/practice' },
										{ label: 'Summary', slug: 'lessons/build-nns-from-scratch/makemore-mlp-language-model/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-nns-from-scratch/makemore-mlp-language-model/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-nns-from-scratch/makemore-mlp-language-model/references' },
									],
								},
								{
									label: 'Activations and gradients',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-nns-from-scratch/stabilize-training-activations-gradients-batchnorm/brief' },
										{ label: 'Lesson', slug: 'lessons/build-nns-from-scratch/stabilize-training-activations-gradients-batchnorm/lesson' },
										{ label: 'Practice', slug: 'lessons/build-nns-from-scratch/stabilize-training-activations-gradients-batchnorm/practice' },
										{ label: 'Summary', slug: 'lessons/build-nns-from-scratch/stabilize-training-activations-gradients-batchnorm/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-nns-from-scratch/stabilize-training-activations-gradients-batchnorm/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-nns-from-scratch/stabilize-training-activations-gradients-batchnorm/references' },
									],
								},
								{
									label: 'Backprop by hand',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-nns-from-scratch/becoming-a-backprop-ninja/brief' },
										{ label: 'Lesson', slug: 'lessons/build-nns-from-scratch/becoming-a-backprop-ninja/lesson' },
										{ label: 'Practice', slug: 'lessons/build-nns-from-scratch/becoming-a-backprop-ninja/practice' },
										{ label: 'Summary', slug: 'lessons/build-nns-from-scratch/becoming-a-backprop-ninja/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-nns-from-scratch/becoming-a-backprop-ninja/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-nns-from-scratch/becoming-a-backprop-ninja/references' },
									],
								},
								{
									label: 'A hierarchical (WaveNet) model',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-nns-from-scratch/wavenet-hierarchical-model/brief' },
										{ label: 'Lesson', slug: 'lessons/build-nns-from-scratch/wavenet-hierarchical-model/lesson' },
										{ label: 'Practice', slug: 'lessons/build-nns-from-scratch/wavenet-hierarchical-model/practice' },
										{ label: 'Summary', slug: 'lessons/build-nns-from-scratch/wavenet-hierarchical-model/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-nns-from-scratch/wavenet-hierarchical-model/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-nns-from-scratch/wavenet-hierarchical-model/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nBuilding a transformer',
							collapsed: true,
							items: [
								{
									label: 'Self-attention from scratch',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-nns-from-scratch/building-gpt-self-attention/brief' },
										{ label: 'Lesson', slug: 'lessons/build-nns-from-scratch/building-gpt-self-attention/lesson' },
										{ label: 'Practice', slug: 'lessons/build-nns-from-scratch/building-gpt-self-attention/practice' },
										{ label: 'Summary', slug: 'lessons/build-nns-from-scratch/building-gpt-self-attention/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-nns-from-scratch/building-gpt-self-attention/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-nns-from-scratch/building-gpt-self-attention/references' },
									],
								},
								{
									label: 'Assembling the full GPT',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-nns-from-scratch/assembling-and-training-gpt/brief' },
										{ label: 'Lesson', slug: 'lessons/build-nns-from-scratch/assembling-and-training-gpt/lesson' },
										{ label: 'Practice', slug: 'lessons/build-nns-from-scratch/assembling-and-training-gpt/practice' },
										{ label: 'Summary', slug: 'lessons/build-nns-from-scratch/assembling-and-training-gpt/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-nns-from-scratch/assembling-and-training-gpt/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-nns-from-scratch/assembling-and-training-gpt/references' },
									],
								},
								{
									label: 'Building the tokenizer',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-nns-from-scratch/building-the-gpt-tokenizer/brief' },
										{ label: 'Lesson', slug: 'lessons/build-nns-from-scratch/building-the-gpt-tokenizer/lesson' },
										{ label: 'Practice', slug: 'lessons/build-nns-from-scratch/building-the-gpt-tokenizer/practice' },
										{ label: 'Summary', slug: 'lessons/build-nns-from-scratch/building-the-gpt-tokenizer/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-nns-from-scratch/building-the-gpt-tokenizer/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-nns-from-scratch/building-the-gpt-tokenizer/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 14: Practical Transformers',
					items: [
						{
							label: 'Phase 1\nTransformers library',
							collapsed: true,
							items: [
								{
									label: 'What transformers do',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/practical-transformers/what-transformers-do/brief' },
										{ label: 'Lesson', slug: 'lessons/practical-transformers/what-transformers-do/lesson' },
										{ label: 'Practice', slug: 'lessons/practical-transformers/what-transformers-do/practice' },
										{ label: 'Summary', slug: 'lessons/practical-transformers/what-transformers-do/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/practical-transformers/what-transformers-do/cheatsheet' },
										{ label: 'References', slug: 'lessons/practical-transformers/what-transformers-do/references' },
									],
								},
								{
									label: 'Run a model',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/practical-transformers/run-a-model-in-a-few-lines/brief' },
										{ label: 'Lesson', slug: 'lessons/practical-transformers/run-a-model-in-a-few-lines/lesson' },
										{ label: 'Practice', slug: 'lessons/practical-transformers/run-a-model-in-a-few-lines/practice' },
										{ label: 'Summary', slug: 'lessons/practical-transformers/run-a-model-in-a-few-lines/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/practical-transformers/run-a-model-in-a-few-lines/cheatsheet' },
										{ label: 'References', slug: 'lessons/practical-transformers/run-a-model-in-a-few-lines/references' },
									],
								},
								{
									label: 'Fine-tune on your data',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/practical-transformers/fine-tune-on-your-data/brief' },
										{ label: 'Lesson', slug: 'lessons/practical-transformers/fine-tune-on-your-data/lesson' },
										{ label: 'Practice', slug: 'lessons/practical-transformers/fine-tune-on-your-data/practice' },
										{ label: 'Summary', slug: 'lessons/practical-transformers/fine-tune-on-your-data/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/practical-transformers/fine-tune-on-your-data/cheatsheet' },
										{ label: 'References', slug: 'lessons/practical-transformers/fine-tune-on-your-data/references' },
									],
								},
								{
									label: 'Share on the Hub',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/practical-transformers/share-on-the-hub/brief' },
										{ label: 'Lesson', slug: 'lessons/practical-transformers/share-on-the-hub/lesson' },
										{ label: 'Practice', slug: 'lessons/practical-transformers/share-on-the-hub/practice' },
										{ label: 'Summary', slug: 'lessons/practical-transformers/share-on-the-hub/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/practical-transformers/share-on-the-hub/cheatsheet' },
										{ label: 'References', slug: 'lessons/practical-transformers/share-on-the-hub/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nData, tokenizers, tasks',
							collapsed: true,
							items: [
								{
									label: 'Wrangle data',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/practical-transformers/wrangle-data-with-datasets/brief' },
										{ label: 'Lesson', slug: 'lessons/practical-transformers/wrangle-data-with-datasets/lesson' },
										{ label: 'Practice', slug: 'lessons/practical-transformers/wrangle-data-with-datasets/practice' },
										{ label: 'Summary', slug: 'lessons/practical-transformers/wrangle-data-with-datasets/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/practical-transformers/wrangle-data-with-datasets/cheatsheet' },
										{ label: 'References', slug: 'lessons/practical-transformers/wrangle-data-with-datasets/references' },
									],
								},
								{
									label: 'Tokenizers up close',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/practical-transformers/tokenizers-up-close/brief' },
										{ label: 'Lesson', slug: 'lessons/practical-transformers/tokenizers-up-close/lesson' },
										{ label: 'Practice', slug: 'lessons/practical-transformers/tokenizers-up-close/practice' },
										{ label: 'Summary', slug: 'lessons/practical-transformers/tokenizers-up-close/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/practical-transformers/tokenizers-up-close/cheatsheet' },
										{ label: 'References', slug: 'lessons/practical-transformers/tokenizers-up-close/references' },
									],
								},
								{
									label: 'Main NLP tasks',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/practical-transformers/the-main-nlp-tasks/brief' },
										{ label: 'Lesson', slug: 'lessons/practical-transformers/the-main-nlp-tasks/lesson' },
										{ label: 'Practice', slug: 'lessons/practical-transformers/the-main-nlp-tasks/practice' },
										{ label: 'Summary', slug: 'lessons/practical-transformers/the-main-nlp-tasks/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/practical-transformers/the-main-nlp-tasks/cheatsheet' },
										{ label: 'References', slug: 'lessons/practical-transformers/the-main-nlp-tasks/references' },
									],
								},
								{
									label: 'Debug and get unstuck',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/practical-transformers/debug-and-get-unstuck/brief' },
										{ label: 'Lesson', slug: 'lessons/practical-transformers/debug-and-get-unstuck/lesson' },
										{ label: 'Practice', slug: 'lessons/practical-transformers/debug-and-get-unstuck/practice' },
										{ label: 'Summary', slug: 'lessons/practical-transformers/debug-and-get-unstuck/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/practical-transformers/debug-and-get-unstuck/cheatsheet' },
										{ label: 'References', slug: 'lessons/practical-transformers/debug-and-get-unstuck/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nDemos and frontier',
							collapsed: true,
							items: [
								{
									label: 'Build a demo',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/practical-transformers/build-and-share-a-demo/brief' },
										{ label: 'Lesson', slug: 'lessons/practical-transformers/build-and-share-a-demo/lesson' },
										{ label: 'Practice', slug: 'lessons/practical-transformers/build-and-share-a-demo/practice' },
										{ label: 'Summary', slug: 'lessons/practical-transformers/build-and-share-a-demo/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/practical-transformers/build-and-share-a-demo/cheatsheet' },
										{ label: 'References', slug: 'lessons/practical-transformers/build-and-share-a-demo/references' },
									],
								},
								{
									label: 'Fine-tuning LLMs',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/practical-transformers/fine-tuning-llms/brief' },
										{ label: 'Lesson', slug: 'lessons/practical-transformers/fine-tuning-llms/lesson' },
										{ label: 'Practice', slug: 'lessons/practical-transformers/fine-tuning-llms/practice' },
										{ label: 'Summary', slug: 'lessons/practical-transformers/fine-tuning-llms/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/practical-transformers/fine-tuning-llms/cheatsheet' },
										{ label: 'References', slug: 'lessons/practical-transformers/fine-tuning-llms/references' },
									],
								},
								{
									label: 'Curate datasets',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/practical-transformers/curating-datasets/brief' },
										{ label: 'Lesson', slug: 'lessons/practical-transformers/curating-datasets/lesson' },
										{ label: 'Practice', slug: 'lessons/practical-transformers/curating-datasets/practice' },
										{ label: 'Summary', slug: 'lessons/practical-transformers/curating-datasets/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/practical-transformers/curating-datasets/cheatsheet' },
										{ label: 'References', slug: 'lessons/practical-transformers/curating-datasets/references' },
									],
								},
								{
									label: 'Reasoning frontier',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/practical-transformers/reasoning-models-and-the-road-ahead/brief' },
										{ label: 'Lesson', slug: 'lessons/practical-transformers/reasoning-models-and-the-road-ahead/lesson' },
										{ label: 'Practice', slug: 'lessons/practical-transformers/reasoning-models-and-the-road-ahead/practice' },
										{ label: 'Summary', slug: 'lessons/practical-transformers/reasoning-models-and-the-road-ahead/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/practical-transformers/reasoning-models-and-the-road-ahead/cheatsheet' },
										{ label: 'References', slug: 'lessons/practical-transformers/reasoning-models-and-the-road-ahead/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 15: Build an LLM from Scratch',
					items: [
						{
							label: 'Phase 1\nThe model',
							collapsed: true,
							items: [
								{
									label: 'From scratch + tokenizer',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-an-llm-from-scratch/from-scratch-and-the-tokenizer/brief' },
										{ label: 'Lesson', slug: 'lessons/build-an-llm-from-scratch/from-scratch-and-the-tokenizer/lesson' },
										{ label: 'Practice', slug: 'lessons/build-an-llm-from-scratch/from-scratch-and-the-tokenizer/practice' },
										{ label: 'Summary', slug: 'lessons/build-an-llm-from-scratch/from-scratch-and-the-tokenizer/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-an-llm-from-scratch/from-scratch-and-the-tokenizer/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-an-llm-from-scratch/from-scratch-and-the-tokenizer/references' },
									],
								},
								{
									label: 'Counting the cost',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-an-llm-from-scratch/counting-the-cost/brief' },
										{ label: 'Lesson', slug: 'lessons/build-an-llm-from-scratch/counting-the-cost/lesson' },
										{ label: 'Practice', slug: 'lessons/build-an-llm-from-scratch/counting-the-cost/practice' },
										{ label: 'Summary', slug: 'lessons/build-an-llm-from-scratch/counting-the-cost/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-an-llm-from-scratch/counting-the-cost/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-an-llm-from-scratch/counting-the-cost/references' },
									],
								},
								{
									label: 'The architecture',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-an-llm-from-scratch/the-architecture/brief' },
										{ label: 'Lesson', slug: 'lessons/build-an-llm-from-scratch/the-architecture/lesson' },
										{ label: 'Practice', slug: 'lessons/build-an-llm-from-scratch/the-architecture/practice' },
										{ label: 'Summary', slug: 'lessons/build-an-llm-from-scratch/the-architecture/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-an-llm-from-scratch/the-architecture/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-an-llm-from-scratch/the-architecture/references' },
									],
								},
								{
									label: 'Attention + MoE',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-an-llm-from-scratch/attention-alternatives-and-moe/brief' },
										{ label: 'Lesson', slug: 'lessons/build-an-llm-from-scratch/attention-alternatives-and-moe/lesson' },
										{ label: 'Practice', slug: 'lessons/build-an-llm-from-scratch/attention-alternatives-and-moe/practice' },
										{ label: 'Summary', slug: 'lessons/build-an-llm-from-scratch/attention-alternatives-and-moe/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-an-llm-from-scratch/attention-alternatives-and-moe/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-an-llm-from-scratch/attention-alternatives-and-moe/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nSystems and efficiency',
							collapsed: true,
							items: [
								{
									label: 'GPUs and TPUs',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-an-llm-from-scratch/gpus-and-tpus/brief' },
										{ label: 'Lesson', slug: 'lessons/build-an-llm-from-scratch/gpus-and-tpus/lesson' },
										{ label: 'Practice', slug: 'lessons/build-an-llm-from-scratch/gpus-and-tpus/practice' },
										{ label: 'Summary', slug: 'lessons/build-an-llm-from-scratch/gpus-and-tpus/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-an-llm-from-scratch/gpus-and-tpus/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-an-llm-from-scratch/gpus-and-tpus/references' },
									],
								},
								{
									label: 'Kernels (Triton, XLA)',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-an-llm-from-scratch/kernels-triton-xla/brief' },
										{ label: 'Lesson', slug: 'lessons/build-an-llm-from-scratch/kernels-triton-xla/lesson' },
										{ label: 'Practice', slug: 'lessons/build-an-llm-from-scratch/kernels-triton-xla/practice' },
										{ label: 'Summary', slug: 'lessons/build-an-llm-from-scratch/kernels-triton-xla/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-an-llm-from-scratch/kernels-triton-xla/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-an-llm-from-scratch/kernels-triton-xla/references' },
									],
								},
								{
									label: 'Parallelism',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-an-llm-from-scratch/parallelism/brief' },
										{ label: 'Lesson', slug: 'lessons/build-an-llm-from-scratch/parallelism/lesson' },
										{ label: 'Practice', slug: 'lessons/build-an-llm-from-scratch/parallelism/practice' },
										{ label: 'Summary', slug: 'lessons/build-an-llm-from-scratch/parallelism/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-an-llm-from-scratch/parallelism/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-an-llm-from-scratch/parallelism/references' },
									],
								},
								{
									label: 'Inference',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-an-llm-from-scratch/inference/brief' },
										{ label: 'Lesson', slug: 'lessons/build-an-llm-from-scratch/inference/lesson' },
										{ label: 'Practice', slug: 'lessons/build-an-llm-from-scratch/inference/practice' },
										{ label: 'Summary', slug: 'lessons/build-an-llm-from-scratch/inference/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-an-llm-from-scratch/inference/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-an-llm-from-scratch/inference/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nScale, data, alignment',
							collapsed: true,
							items: [
								{
									label: 'Scaling laws',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-an-llm-from-scratch/scaling-laws/brief' },
										{ label: 'Lesson', slug: 'lessons/build-an-llm-from-scratch/scaling-laws/lesson' },
										{ label: 'Practice', slug: 'lessons/build-an-llm-from-scratch/scaling-laws/practice' },
										{ label: 'Summary', slug: 'lessons/build-an-llm-from-scratch/scaling-laws/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-an-llm-from-scratch/scaling-laws/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-an-llm-from-scratch/scaling-laws/references' },
									],
								},
								{
									label: 'Evaluation',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-an-llm-from-scratch/evaluation/brief' },
										{ label: 'Lesson', slug: 'lessons/build-an-llm-from-scratch/evaluation/lesson' },
										{ label: 'Practice', slug: 'lessons/build-an-llm-from-scratch/evaluation/practice' },
										{ label: 'Summary', slug: 'lessons/build-an-llm-from-scratch/evaluation/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-an-llm-from-scratch/evaluation/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-an-llm-from-scratch/evaluation/references' },
									],
								},
								{
									label: 'Data sources',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-an-llm-from-scratch/data-sources/brief' },
										{ label: 'Lesson', slug: 'lessons/build-an-llm-from-scratch/data-sources/lesson' },
										{ label: 'Practice', slug: 'lessons/build-an-llm-from-scratch/data-sources/practice' },
										{ label: 'Summary', slug: 'lessons/build-an-llm-from-scratch/data-sources/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-an-llm-from-scratch/data-sources/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-an-llm-from-scratch/data-sources/references' },
									],
								},
								{
									label: 'Data filtering',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-an-llm-from-scratch/data-filtering/brief' },
										{ label: 'Lesson', slug: 'lessons/build-an-llm-from-scratch/data-filtering/lesson' },
										{ label: 'Practice', slug: 'lessons/build-an-llm-from-scratch/data-filtering/practice' },
										{ label: 'Summary', slug: 'lessons/build-an-llm-from-scratch/data-filtering/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-an-llm-from-scratch/data-filtering/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-an-llm-from-scratch/data-filtering/references' },
									],
								},
								{
									label: 'Post-training (SFT, RLHF)',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-an-llm-from-scratch/post-training-sft-rlhf/brief' },
										{ label: 'Lesson', slug: 'lessons/build-an-llm-from-scratch/post-training-sft-rlhf/lesson' },
										{ label: 'Practice', slug: 'lessons/build-an-llm-from-scratch/post-training-sft-rlhf/practice' },
										{ label: 'Summary', slug: 'lessons/build-an-llm-from-scratch/post-training-sft-rlhf/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-an-llm-from-scratch/post-training-sft-rlhf/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-an-llm-from-scratch/post-training-sft-rlhf/references' },
									],
								},
								{
									label: 'Reasoning RL',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/build-an-llm-from-scratch/reasoning-rl/brief' },
										{ label: 'Lesson', slug: 'lessons/build-an-llm-from-scratch/reasoning-rl/lesson' },
										{ label: 'Practice', slug: 'lessons/build-an-llm-from-scratch/reasoning-rl/practice' },
										{ label: 'Summary', slug: 'lessons/build-an-llm-from-scratch/reasoning-rl/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/build-an-llm-from-scratch/reasoning-rl/cheatsheet' },
										{ label: 'References', slug: 'lessons/build-an-llm-from-scratch/reasoning-rl/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 16: Computer Vision',
					items: [
						{
							label: 'Phase 1\nFoundations for vision',
							collapsed: true,
							items: [
								{
									label: 'Why seeing is hard',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/computer-vision/why-seeing-is-hard/brief' },
										{ label: 'Lesson', slug: 'lessons/computer-vision/why-seeing-is-hard/lesson' },
										{ label: 'Practice', slug: 'lessons/computer-vision/why-seeing-is-hard/practice' },
										{ label: 'Summary', slug: 'lessons/computer-vision/why-seeing-is-hard/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/computer-vision/why-seeing-is-hard/cheatsheet' },
										{ label: 'References', slug: 'lessons/computer-vision/why-seeing-is-hard/references' },
									],
								},
								{
									label: 'Linear classifiers',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/computer-vision/linear-classifiers/brief' },
										{ label: 'Lesson', slug: 'lessons/computer-vision/linear-classifiers/lesson' },
										{ label: 'Practice', slug: 'lessons/computer-vision/linear-classifiers/practice' },
										{ label: 'Summary', slug: 'lessons/computer-vision/linear-classifiers/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/computer-vision/linear-classifiers/cheatsheet' },
										{ label: 'References', slug: 'lessons/computer-vision/linear-classifiers/references' },
									],
								},
								{
									label: 'Loss + optimization',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/computer-vision/loss-and-optimization/brief' },
										{ label: 'Lesson', slug: 'lessons/computer-vision/loss-and-optimization/lesson' },
										{ label: 'Practice', slug: 'lessons/computer-vision/loss-and-optimization/practice' },
										{ label: 'Summary', slug: 'lessons/computer-vision/loss-and-optimization/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/computer-vision/loss-and-optimization/cheatsheet' },
										{ label: 'References', slug: 'lessons/computer-vision/loss-and-optimization/references' },
									],
								},
								{
									label: 'NNs + backprop',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/computer-vision/neural-networks-and-backprop/brief' },
										{ label: 'Lesson', slug: 'lessons/computer-vision/neural-networks-and-backprop/lesson' },
										{ label: 'Practice', slug: 'lessons/computer-vision/neural-networks-and-backprop/practice' },
										{ label: 'Summary', slug: 'lessons/computer-vision/neural-networks-and-backprop/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/computer-vision/neural-networks-and-backprop/cheatsheet' },
										{ label: 'References', slug: 'lessons/computer-vision/neural-networks-and-backprop/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nHow machines see',
							collapsed: true,
							items: [
								{
									label: 'Convolution + CNNs',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/computer-vision/convolution-and-cnns/brief' },
										{ label: 'Lesson', slug: 'lessons/computer-vision/convolution-and-cnns/lesson' },
										{ label: 'Practice', slug: 'lessons/computer-vision/convolution-and-cnns/practice' },
										{ label: 'Summary', slug: 'lessons/computer-vision/convolution-and-cnns/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/computer-vision/convolution-and-cnns/cheatsheet' },
										{ label: 'References', slug: 'lessons/computer-vision/convolution-and-cnns/references' },
									],
								},
								{
									label: 'CNN architectures',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/computer-vision/cnn-architectures/brief' },
										{ label: 'Lesson', slug: 'lessons/computer-vision/cnn-architectures/lesson' },
										{ label: 'Practice', slug: 'lessons/computer-vision/cnn-architectures/practice' },
										{ label: 'Summary', slug: 'lessons/computer-vision/cnn-architectures/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/computer-vision/cnn-architectures/cheatsheet' },
										{ label: 'References', slug: 'lessons/computer-vision/cnn-architectures/references' },
									],
								},
								{
									label: 'Sequence tools',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/computer-vision/sequence-tools-for-vision/brief' },
										{ label: 'Lesson', slug: 'lessons/computer-vision/sequence-tools-for-vision/lesson' },
										{ label: 'Practice', slug: 'lessons/computer-vision/sequence-tools-for-vision/practice' },
										{ label: 'Summary', slug: 'lessons/computer-vision/sequence-tools-for-vision/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/computer-vision/sequence-tools-for-vision/cheatsheet' },
										{ label: 'References', slug: 'lessons/computer-vision/sequence-tools-for-vision/references' },
									],
								},
								{
									label: 'Detection + segmentation',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/computer-vision/detection-segmentation-visualizing/brief' },
										{ label: 'Lesson', slug: 'lessons/computer-vision/detection-segmentation-visualizing/lesson' },
										{ label: 'Practice', slug: 'lessons/computer-vision/detection-segmentation-visualizing/practice' },
										{ label: 'Summary', slug: 'lessons/computer-vision/detection-segmentation-visualizing/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/computer-vision/detection-segmentation-visualizing/cheatsheet' },
										{ label: 'References', slug: 'lessons/computer-vision/detection-segmentation-visualizing/references' },
									],
								},
								{
									label: 'Video understanding',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/computer-vision/video-understanding/brief' },
										{ label: 'Lesson', slug: 'lessons/computer-vision/video-understanding/lesson' },
										{ label: 'Practice', slug: 'lessons/computer-vision/video-understanding/practice' },
										{ label: 'Summary', slug: 'lessons/computer-vision/video-understanding/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/computer-vision/video-understanding/cheatsheet' },
										{ label: 'References', slug: 'lessons/computer-vision/video-understanding/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nGenerating + grounding vision',
							collapsed: true,
							items: [
								{
									label: 'Self-supervised vision',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/computer-vision/self-supervised-vision/brief' },
										{ label: 'Lesson', slug: 'lessons/computer-vision/self-supervised-vision/lesson' },
										{ label: 'Practice', slug: 'lessons/computer-vision/self-supervised-vision/practice' },
										{ label: 'Summary', slug: 'lessons/computer-vision/self-supervised-vision/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/computer-vision/self-supervised-vision/cheatsheet' },
										{ label: 'References', slug: 'lessons/computer-vision/self-supervised-vision/references' },
									],
								},
								{
									label: 'GANs + VAEs',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/computer-vision/gans-and-vaes/brief' },
										{ label: 'Lesson', slug: 'lessons/computer-vision/gans-and-vaes/lesson' },
										{ label: 'Practice', slug: 'lessons/computer-vision/gans-and-vaes/practice' },
										{ label: 'Summary', slug: 'lessons/computer-vision/gans-and-vaes/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/computer-vision/gans-and-vaes/cheatsheet' },
										{ label: 'References', slug: 'lessons/computer-vision/gans-and-vaes/references' },
									],
								},
								{
									label: 'Diffusion models',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/computer-vision/diffusion-models/brief' },
										{ label: 'Lesson', slug: 'lessons/computer-vision/diffusion-models/lesson' },
										{ label: 'Practice', slug: 'lessons/computer-vision/diffusion-models/practice' },
										{ label: 'Summary', slug: 'lessons/computer-vision/diffusion-models/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/computer-vision/diffusion-models/cheatsheet' },
										{ label: 'References', slug: 'lessons/computer-vision/diffusion-models/references' },
									],
								},
								{
									label: '3D vision',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/computer-vision/3d-vision/brief' },
										{ label: 'Lesson', slug: 'lessons/computer-vision/3d-vision/lesson' },
										{ label: 'Practice', slug: 'lessons/computer-vision/3d-vision/practice' },
										{ label: 'Summary', slug: 'lessons/computer-vision/3d-vision/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/computer-vision/3d-vision/cheatsheet' },
										{ label: 'References', slug: 'lessons/computer-vision/3d-vision/references' },
									],
								},
								{
									label: 'Vision and language',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/computer-vision/vision-and-language/brief' },
										{ label: 'Lesson', slug: 'lessons/computer-vision/vision-and-language/lesson' },
										{ label: 'Practice', slug: 'lessons/computer-vision/vision-and-language/practice' },
										{ label: 'Summary', slug: 'lessons/computer-vision/vision-and-language/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/computer-vision/vision-and-language/cheatsheet' },
										{ label: 'References', slug: 'lessons/computer-vision/vision-and-language/references' },
									],
								},
								{
									label: 'World modeling',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/computer-vision/world-modeling/brief' },
										{ label: 'Lesson', slug: 'lessons/computer-vision/world-modeling/lesson' },
										{ label: 'Practice', slug: 'lessons/computer-vision/world-modeling/practice' },
										{ label: 'Summary', slug: 'lessons/computer-vision/world-modeling/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/computer-vision/world-modeling/cheatsheet' },
										{ label: 'References', slug: 'lessons/computer-vision/world-modeling/references' },
									],
								},
								{
									label: 'Human-centered AI',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/computer-vision/human-centered-ai/brief' },
										{ label: 'Lesson', slug: 'lessons/computer-vision/human-centered-ai/lesson' },
										{ label: 'Practice', slug: 'lessons/computer-vision/human-centered-ai/practice' },
										{ label: 'Summary', slug: 'lessons/computer-vision/human-centered-ai/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/computer-vision/human-centered-ai/cheatsheet' },
										{ label: 'References', slug: 'lessons/computer-vision/human-centered-ai/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 17: RL Foundations',
					items: [
						{
							label: 'Phase 1\nThe RL setup',
							collapsed: true,
							items: [
								{
									label: 'What RL actually is',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/reinforcement-learning-foundations/what-reinforcement-learning-actually-is/brief' },
										{ label: 'Lesson', slug: 'lessons/reinforcement-learning-foundations/what-reinforcement-learning-actually-is/lesson' },
										{ label: 'Practice', slug: 'lessons/reinforcement-learning-foundations/what-reinforcement-learning-actually-is/practice' },
										{ label: 'Summary', slug: 'lessons/reinforcement-learning-foundations/what-reinforcement-learning-actually-is/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/reinforcement-learning-foundations/what-reinforcement-learning-actually-is/cheatsheet' },
										{ label: 'References', slug: 'lessons/reinforcement-learning-foundations/what-reinforcement-learning-actually-is/references' },
									],
								},
								{
									label: 'Markov decision processes',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/reinforcement-learning-foundations/markov-decision-processes/brief' },
										{ label: 'Lesson', slug: 'lessons/reinforcement-learning-foundations/markov-decision-processes/lesson' },
										{ label: 'Practice', slug: 'lessons/reinforcement-learning-foundations/markov-decision-processes/practice' },
										{ label: 'Summary', slug: 'lessons/reinforcement-learning-foundations/markov-decision-processes/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/reinforcement-learning-foundations/markov-decision-processes/cheatsheet' },
										{ label: 'References', slug: 'lessons/reinforcement-learning-foundations/markov-decision-processes/references' },
									],
								},
								{
									label: 'Value + Bellman',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/reinforcement-learning-foundations/value-functions-and-the-bellman-equations/brief' },
										{ label: 'Lesson', slug: 'lessons/reinforcement-learning-foundations/value-functions-and-the-bellman-equations/lesson' },
										{ label: 'Practice', slug: 'lessons/reinforcement-learning-foundations/value-functions-and-the-bellman-equations/practice' },
										{ label: 'Summary', slug: 'lessons/reinforcement-learning-foundations/value-functions-and-the-bellman-equations/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/reinforcement-learning-foundations/value-functions-and-the-bellman-equations/cheatsheet' },
										{ label: 'References', slug: 'lessons/reinforcement-learning-foundations/value-functions-and-the-bellman-equations/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nPlanning with a known model',
							collapsed: true,
							items: [
								{
									label: 'Policy iteration',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/reinforcement-learning-foundations/policy-iteration/brief' },
										{ label: 'Lesson', slug: 'lessons/reinforcement-learning-foundations/policy-iteration/lesson' },
										{ label: 'Practice', slug: 'lessons/reinforcement-learning-foundations/policy-iteration/practice' },
										{ label: 'Summary', slug: 'lessons/reinforcement-learning-foundations/policy-iteration/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/reinforcement-learning-foundations/policy-iteration/cheatsheet' },
										{ label: 'References', slug: 'lessons/reinforcement-learning-foundations/policy-iteration/references' },
									],
								},
								{
									label: 'Value iteration',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/reinforcement-learning-foundations/value-iteration/brief' },
										{ label: 'Lesson', slug: 'lessons/reinforcement-learning-foundations/value-iteration/lesson' },
										{ label: 'Practice', slug: 'lessons/reinforcement-learning-foundations/value-iteration/practice' },
										{ label: 'Summary', slug: 'lessons/reinforcement-learning-foundations/value-iteration/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/reinforcement-learning-foundations/value-iteration/cheatsheet' },
										{ label: 'References', slug: 'lessons/reinforcement-learning-foundations/value-iteration/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nModel-free learning',
							collapsed: true,
							items: [
								{
									label: 'Monte Carlo prediction',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/reinforcement-learning-foundations/monte-carlo-prediction/brief' },
										{ label: 'Lesson', slug: 'lessons/reinforcement-learning-foundations/monte-carlo-prediction/lesson' },
										{ label: 'Practice', slug: 'lessons/reinforcement-learning-foundations/monte-carlo-prediction/practice' },
										{ label: 'Summary', slug: 'lessons/reinforcement-learning-foundations/monte-carlo-prediction/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/reinforcement-learning-foundations/monte-carlo-prediction/cheatsheet' },
										{ label: 'References', slug: 'lessons/reinforcement-learning-foundations/monte-carlo-prediction/references' },
									],
								},
								{
									label: 'Temporal-difference learning',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/reinforcement-learning-foundations/temporal-difference-learning/brief' },
										{ label: 'Lesson', slug: 'lessons/reinforcement-learning-foundations/temporal-difference-learning/lesson' },
										{ label: 'Practice', slug: 'lessons/reinforcement-learning-foundations/temporal-difference-learning/practice' },
										{ label: 'Summary', slug: 'lessons/reinforcement-learning-foundations/temporal-difference-learning/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/reinforcement-learning-foundations/temporal-difference-learning/cheatsheet' },
										{ label: 'References', slug: 'lessons/reinforcement-learning-foundations/temporal-difference-learning/references' },
									],
								},
								{
									label: 'Q-learning',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/reinforcement-learning-foundations/q-learning/brief' },
										{ label: 'Lesson', slug: 'lessons/reinforcement-learning-foundations/q-learning/lesson' },
										{ label: 'Practice', slug: 'lessons/reinforcement-learning-foundations/q-learning/practice' },
										{ label: 'Summary', slug: 'lessons/reinforcement-learning-foundations/q-learning/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/reinforcement-learning-foundations/q-learning/cheatsheet' },
										{ label: 'References', slug: 'lessons/reinforcement-learning-foundations/q-learning/references' },
									],
								},
							],
						},
						{
							label: 'Phase 4\nScaling up',
							collapsed: true,
							items: [
								{
									label: 'Function approx + deep RL',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/reinforcement-learning-foundations/function-approximation-and-deep-rl/brief' },
										{ label: 'Lesson', slug: 'lessons/reinforcement-learning-foundations/function-approximation-and-deep-rl/lesson' },
										{ label: 'Practice', slug: 'lessons/reinforcement-learning-foundations/function-approximation-and-deep-rl/practice' },
										{ label: 'Summary', slug: 'lessons/reinforcement-learning-foundations/function-approximation-and-deep-rl/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/reinforcement-learning-foundations/function-approximation-and-deep-rl/cheatsheet' },
										{ label: 'References', slug: 'lessons/reinforcement-learning-foundations/function-approximation-and-deep-rl/references' },
									],
								},
								{
									label: 'Policy gradient + modern RL',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/reinforcement-learning-foundations/policy-gradient-and-the-path-to-modern-rl/brief' },
										{ label: 'Lesson', slug: 'lessons/reinforcement-learning-foundations/policy-gradient-and-the-path-to-modern-rl/lesson' },
										{ label: 'Practice', slug: 'lessons/reinforcement-learning-foundations/policy-gradient-and-the-path-to-modern-rl/practice' },
										{ label: 'Summary', slug: 'lessons/reinforcement-learning-foundations/policy-gradient-and-the-path-to-modern-rl/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/reinforcement-learning-foundations/policy-gradient-and-the-path-to-modern-rl/cheatsheet' },
										{ label: 'References', slug: 'lessons/reinforcement-learning-foundations/policy-gradient-and-the-path-to-modern-rl/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 20: AI Agents and Tool Use',
					items: [
						{
							label: 'Phase 1\nWhat agents are',
							collapsed: true,
							items: [
								{
									label: 'What makes an agent',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-agents-and-tool-use/what-makes-an-ai-an-agent/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-agents-and-tool-use/what-makes-an-ai-an-agent/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-agents-and-tool-use/what-makes-an-ai-an-agent/practice' },
										{ label: 'Summary', slug: 'lessons/ai-agents-and-tool-use/what-makes-an-ai-an-agent/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-agents-and-tool-use/what-makes-an-ai-an-agent/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-agents-and-tool-use/what-makes-an-ai-an-agent/references' },
									],
								},
								{
									label: 'Tool use',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-agents-and-tool-use/how-tool-use-turns-a-model-into-an-agent/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-agents-and-tool-use/how-tool-use-turns-a-model-into-an-agent/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-agents-and-tool-use/how-tool-use-turns-a-model-into-an-agent/practice' },
										{ label: 'Summary', slug: 'lessons/ai-agents-and-tool-use/how-tool-use-turns-a-model-into-an-agent/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-agents-and-tool-use/how-tool-use-turns-a-model-into-an-agent/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-agents-and-tool-use/how-tool-use-turns-a-model-into-an-agent/references' },
									],
								},
								{
									label: 'Choosing a framework',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-agents-and-tool-use/choosing-an-agent-framework/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-agents-and-tool-use/choosing-an-agent-framework/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-agents-and-tool-use/choosing-an-agent-framework/practice' },
										{ label: 'Summary', slug: 'lessons/ai-agents-and-tool-use/choosing-an-agent-framework/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-agents-and-tool-use/choosing-an-agent-framework/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-agents-and-tool-use/choosing-an-agent-framework/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nAgent design patterns',
							collapsed: true,
							items: [
								{
									label: 'Tool definitions in depth',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-agents-and-tool-use/the-tool-use-design-pattern-in-depth/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-agents-and-tool-use/the-tool-use-design-pattern-in-depth/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-agents-and-tool-use/the-tool-use-design-pattern-in-depth/practice' },
										{ label: 'Summary', slug: 'lessons/ai-agents-and-tool-use/the-tool-use-design-pattern-in-depth/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-agents-and-tool-use/the-tool-use-design-pattern-in-depth/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-agents-and-tool-use/the-tool-use-design-pattern-in-depth/references' },
									],
								},
								{
									label: 'Giving agents memory',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-agents-and-tool-use/giving-agents-memory/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-agents-and-tool-use/giving-agents-memory/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-agents-and-tool-use/giving-agents-memory/practice' },
										{ label: 'Summary', slug: 'lessons/ai-agents-and-tool-use/giving-agents-memory/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-agents-and-tool-use/giving-agents-memory/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-agents-and-tool-use/giving-agents-memory/references' },
									],
								},
								{
									label: 'Agentic RAG',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-agents-and-tool-use/agentic-rag/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-agents-and-tool-use/agentic-rag/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-agents-and-tool-use/agentic-rag/practice' },
										{ label: 'Summary', slug: 'lessons/ai-agents-and-tool-use/agentic-rag/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-agents-and-tool-use/agentic-rag/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-agents-and-tool-use/agentic-rag/references' },
									],
								},
								{
									label: 'Planning',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-agents-and-tool-use/planning/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-agents-and-tool-use/planning/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-agents-and-tool-use/planning/practice' },
										{ label: 'Summary', slug: 'lessons/ai-agents-and-tool-use/planning/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-agents-and-tool-use/planning/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-agents-and-tool-use/planning/references' },
									],
								},
								{
									label: 'Multi-agent systems',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-agents-and-tool-use/multi-agent-systems/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-agents-and-tool-use/multi-agent-systems/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-agents-and-tool-use/multi-agent-systems/practice' },
										{ label: 'Summary', slug: 'lessons/ai-agents-and-tool-use/multi-agent-systems/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-agents-and-tool-use/multi-agent-systems/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-agents-and-tool-use/multi-agent-systems/references' },
									],
								},
								{
									label: 'Self-checking (metacognition)',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-agents-and-tool-use/metacognition/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-agents-and-tool-use/metacognition/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-agents-and-tool-use/metacognition/practice' },
										{ label: 'Summary', slug: 'lessons/ai-agents-and-tool-use/metacognition/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-agents-and-tool-use/metacognition/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-agents-and-tool-use/metacognition/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nProduction agents',
							collapsed: true,
							items: [
								{
									label: 'Building trustworthy agents',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-agents-and-tool-use/building-trustworthy-agents/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-agents-and-tool-use/building-trustworthy-agents/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-agents-and-tool-use/building-trustworthy-agents/practice' },
										{ label: 'Summary', slug: 'lessons/ai-agents-and-tool-use/building-trustworthy-agents/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-agents-and-tool-use/building-trustworthy-agents/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-agents-and-tool-use/building-trustworthy-agents/references' },
									],
								},
								{
									label: 'Securing agents',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-agents-and-tool-use/securing-agents/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-agents-and-tool-use/securing-agents/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-agents-and-tool-use/securing-agents/practice' },
										{ label: 'Summary', slug: 'lessons/ai-agents-and-tool-use/securing-agents/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-agents-and-tool-use/securing-agents/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-agents-and-tool-use/securing-agents/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 21: LLM Ops and Production',
					items: [
						{
							label: 'Phase 1\nFoundations and first app',
							collapsed: true,
							items: [
								{
									label: 'Launch an LLM app',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/llm-ops-and-production/launch-an-llm-app/brief' },
										{ label: 'Lesson', slug: 'lessons/llm-ops-and-production/launch-an-llm-app/lesson' },
										{ label: 'Practice', slug: 'lessons/llm-ops-and-production/launch-an-llm-app/practice' },
										{ label: 'Summary', slug: 'lessons/llm-ops-and-production/launch-an-llm-app/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/llm-ops-and-production/launch-an-llm-app/cheatsheet' },
										{ label: 'References', slug: 'lessons/llm-ops-and-production/launch-an-llm-app/references' },
									],
								},
								{
									label: 'LLM foundations',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/llm-ops-and-production/llm-foundations/brief' },
										{ label: 'Lesson', slug: 'lessons/llm-ops-and-production/llm-foundations/lesson' },
										{ label: 'Practice', slug: 'lessons/llm-ops-and-production/llm-foundations/practice' },
										{ label: 'Summary', slug: 'lessons/llm-ops-and-production/llm-foundations/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/llm-ops-and-production/llm-foundations/cheatsheet' },
										{ label: 'References', slug: 'lessons/llm-ops-and-production/llm-foundations/references' },
									],
								},
								{
									label: 'Prompt engineering',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/llm-ops-and-production/prompt-engineering/brief' },
										{ label: 'Lesson', slug: 'lessons/llm-ops-and-production/prompt-engineering/lesson' },
										{ label: 'Practice', slug: 'lessons/llm-ops-and-production/prompt-engineering/practice' },
										{ label: 'Summary', slug: 'lessons/llm-ops-and-production/prompt-engineering/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/llm-ops-and-production/prompt-engineering/cheatsheet' },
										{ label: 'References', slug: 'lessons/llm-ops-and-production/prompt-engineering/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nBuilding production apps',
							collapsed: true,
							items: [
								{
									label: 'Augmented LLMs',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/llm-ops-and-production/augmented-llms/brief' },
										{ label: 'Lesson', slug: 'lessons/llm-ops-and-production/augmented-llms/lesson' },
										{ label: 'Practice', slug: 'lessons/llm-ops-and-production/augmented-llms/practice' },
										{ label: 'Summary', slug: 'lessons/llm-ops-and-production/augmented-llms/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/llm-ops-and-production/augmented-llms/cheatsheet' },
										{ label: 'References', slug: 'lessons/llm-ops-and-production/augmented-llms/references' },
									],
								},
								{
									label: 'Project walkthrough',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/llm-ops-and-production/project-walkthrough/brief' },
										{ label: 'Lesson', slug: 'lessons/llm-ops-and-production/project-walkthrough/lesson' },
										{ label: 'Practice', slug: 'lessons/llm-ops-and-production/project-walkthrough/practice' },
										{ label: 'Summary', slug: 'lessons/llm-ops-and-production/project-walkthrough/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/llm-ops-and-production/project-walkthrough/cheatsheet' },
										{ label: 'References', slug: 'lessons/llm-ops-and-production/project-walkthrough/references' },
									],
								},
								{
									label: 'UX for LUIs',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/llm-ops-and-production/ux-for-luis/brief' },
										{ label: 'Lesson', slug: 'lessons/llm-ops-and-production/ux-for-luis/lesson' },
										{ label: 'Practice', slug: 'lessons/llm-ops-and-production/ux-for-luis/practice' },
										{ label: 'Summary', slug: 'lessons/llm-ops-and-production/ux-for-luis/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/llm-ops-and-production/ux-for-luis/cheatsheet' },
										{ label: 'References', slug: 'lessons/llm-ops-and-production/ux-for-luis/references' },
									],
								},
								{
									label: 'LLMOps',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/llm-ops-and-production/llmops/brief' },
										{ label: 'Lesson', slug: 'lessons/llm-ops-and-production/llmops/lesson' },
										{ label: 'Practice', slug: 'lessons/llm-ops-and-production/llmops/practice' },
										{ label: 'Summary', slug: 'lessons/llm-ops-and-production/llmops/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/llm-ops-and-production/llmops/cheatsheet' },
										{ label: 'References', slug: 'lessons/llm-ops-and-production/llmops/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nAdvanced and the field',
							collapsed: true,
							items: [
								{
									label: 'What\'s next',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/llm-ops-and-production/whats-next/brief' },
										{ label: 'Lesson', slug: 'lessons/llm-ops-and-production/whats-next/lesson' },
										{ label: 'Practice', slug: 'lessons/llm-ops-and-production/whats-next/practice' },
										{ label: 'Summary', slug: 'lessons/llm-ops-and-production/whats-next/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/llm-ops-and-production/whats-next/cheatsheet' },
										{ label: 'References', slug: 'lessons/llm-ops-and-production/whats-next/references' },
									],
								},
								{
									label: 'Training your own LLM',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/llm-ops-and-production/training-your-own-llm/brief' },
										{ label: 'Lesson', slug: 'lessons/llm-ops-and-production/training-your-own-llm/lesson' },
										{ label: 'Practice', slug: 'lessons/llm-ops-and-production/training-your-own-llm/practice' },
										{ label: 'Summary', slug: 'lessons/llm-ops-and-production/training-your-own-llm/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/llm-ops-and-production/training-your-own-llm/cheatsheet' },
										{ label: 'References', slug: 'lessons/llm-ops-and-production/training-your-own-llm/references' },
									],
								},
								{
									label: 'Agents',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/llm-ops-and-production/agents/brief' },
										{ label: 'Lesson', slug: 'lessons/llm-ops-and-production/agents/lesson' },
										{ label: 'Practice', slug: 'lessons/llm-ops-and-production/agents/practice' },
										{ label: 'Summary', slug: 'lessons/llm-ops-and-production/agents/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/llm-ops-and-production/agents/cheatsheet' },
										{ label: 'References', slug: 'lessons/llm-ops-and-production/agents/references' },
									],
								},
								{
									label: 'Industry perspective',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/llm-ops-and-production/industry-perspective/brief' },
										{ label: 'Lesson', slug: 'lessons/llm-ops-and-production/industry-perspective/lesson' },
										{ label: 'Practice', slug: 'lessons/llm-ops-and-production/industry-perspective/practice' },
										{ label: 'Summary', slug: 'lessons/llm-ops-and-production/industry-perspective/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/llm-ops-and-production/industry-perspective/cheatsheet' },
										{ label: 'References', slug: 'lessons/llm-ops-and-production/industry-perspective/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 18: Deep Reinforcement Learning',
					items: [
						{
							label: 'Phase 1\nRL foundations',
							collapsed: true,
							items: [
								{
									label: 'Introduction to deep RL',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/introduction-to-deep-rl/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/introduction-to-deep-rl/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/introduction-to-deep-rl/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/introduction-to-deep-rl/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/introduction-to-deep-rl/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/introduction-to-deep-rl/references' },
									],
								},
								{
									label: 'Imitation learning',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/imitation-learning/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/imitation-learning/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/imitation-learning/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/imitation-learning/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/imitation-learning/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/imitation-learning/references' },
									],
								},
								{
									label: 'RL fundamentals',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/rl-fundamentals/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/rl-fundamentals/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/rl-fundamentals/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/rl-fundamentals/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/rl-fundamentals/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/rl-fundamentals/references' },
									],
								},
								{
									label: 'Policy gradients',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/policy-gradients/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/policy-gradients/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/policy-gradients/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/policy-gradients/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/policy-gradients/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/policy-gradients/references' },
									],
								},
								{
									label: 'Actor-critic',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/actor-critic/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/actor-critic/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/actor-critic/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/actor-critic/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/actor-critic/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/actor-critic/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nCore deep-RL algorithms',
							collapsed: true,
							items: [
								{
									label: 'Value-based RL',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/value-based-rl/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/value-based-rl/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/value-based-rl/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/value-based-rl/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/value-based-rl/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/value-based-rl/references' },
									],
								},
								{
									label: 'DQN',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/dqn/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/dqn/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/dqn/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/dqn/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/dqn/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/dqn/references' },
									],
								},
								{
									label: 'PPO',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/ppo/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/ppo/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/ppo/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/ppo/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/ppo/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/ppo/references' },
									],
								},
								{
									label: 'Model-based learning',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/model-based-learning/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/model-based-learning/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/model-based-learning/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/model-based-learning/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/model-based-learning/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/model-based-learning/references' },
									],
								},
								{
									label: 'Planning with models',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/planning-with-models/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/planning-with-models/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/planning-with-models/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/planning-with-models/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/planning-with-models/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/planning-with-models/references' },
									],
								},
								{
									label: 'Variational inference',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/variational-inference/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/variational-inference/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/variational-inference/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/variational-inference/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/variational-inference/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/variational-inference/references' },
									],
								},
								{
									label: 'Control as inference',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/control-as-inference/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/control-as-inference/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/control-as-inference/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/control-as-inference/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/control-as-inference/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/control-as-inference/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nRL frontiers',
							collapsed: true,
							items: [
								{
									label: 'RLHF',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/rlhf/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/rlhf/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/rlhf/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/rlhf/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/rlhf/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/rlhf/references' },
									],
								},
								{
									label: 'Offline RL: the problem',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/offline-rl-problem/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/offline-rl-problem/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/offline-rl-problem/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/offline-rl-problem/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/offline-rl-problem/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/offline-rl-problem/references' },
									],
								},
								{
									label: 'Offline RL: algorithms',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/offline-rl-algorithms/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/offline-rl-algorithms/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/offline-rl-algorithms/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/offline-rl-algorithms/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/offline-rl-algorithms/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/offline-rl-algorithms/references' },
									],
								},
								{
									label: 'Exploration',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/exploration/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/exploration/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/exploration/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/exploration/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/exploration/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/exploration/references' },
									],
								},
								{
									label: 'Multi-task and meta-RL',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/multi-task-meta-rl/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/multi-task-meta-rl/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/multi-task-meta-rl/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/multi-task-meta-rl/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/multi-task-meta-rl/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/multi-task-meta-rl/references' },
									],
								},
								{
									label: 'Challenges and open problems',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/deep-reinforcement-learning/challenges-and-open-problems/brief' },
										{ label: 'Lesson', slug: 'lessons/deep-reinforcement-learning/challenges-and-open-problems/lesson' },
										{ label: 'Practice', slug: 'lessons/deep-reinforcement-learning/challenges-and-open-problems/practice' },
										{ label: 'Summary', slug: 'lessons/deep-reinforcement-learning/challenges-and-open-problems/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/deep-reinforcement-learning/challenges-and-open-problems/cheatsheet' },
										{ label: 'References', slug: 'lessons/deep-reinforcement-learning/challenges-and-open-problems/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 19: Generative Models and Diffusion',
					items: [
						{
							label: 'Phase 1\nGenerative foundations',
							collapsed: true,
							items: [
								{
									label: 'What a generative model is',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/generative-models-and-diffusion/what-a-generative-model-is/brief' },
										{ label: 'Lesson', slug: 'lessons/generative-models-and-diffusion/what-a-generative-model-is/lesson' },
										{ label: 'Practice', slug: 'lessons/generative-models-and-diffusion/what-a-generative-model-is/practice' },
										{ label: 'Summary', slug: 'lessons/generative-models-and-diffusion/what-a-generative-model-is/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/generative-models-and-diffusion/what-a-generative-model-is/cheatsheet' },
										{ label: 'References', slug: 'lessons/generative-models-and-diffusion/what-a-generative-model-is/references' },
									],
								},
								{
									label: 'Autoregressive models',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/generative-models-and-diffusion/autoregressive-models/brief' },
										{ label: 'Lesson', slug: 'lessons/generative-models-and-diffusion/autoregressive-models/lesson' },
										{ label: 'Practice', slug: 'lessons/generative-models-and-diffusion/autoregressive-models/practice' },
										{ label: 'Summary', slug: 'lessons/generative-models-and-diffusion/autoregressive-models/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/generative-models-and-diffusion/autoregressive-models/cheatsheet' },
										{ label: 'References', slug: 'lessons/generative-models-and-diffusion/autoregressive-models/references' },
									],
								},
								{
									label: 'Maximum likelihood and KL',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/generative-models-and-diffusion/maximum-likelihood-and-the-kl-view/brief' },
										{ label: 'Lesson', slug: 'lessons/generative-models-and-diffusion/maximum-likelihood-and-the-kl-view/lesson' },
										{ label: 'Practice', slug: 'lessons/generative-models-and-diffusion/maximum-likelihood-and-the-kl-view/practice' },
										{ label: 'Summary', slug: 'lessons/generative-models-and-diffusion/maximum-likelihood-and-the-kl-view/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/generative-models-and-diffusion/maximum-likelihood-and-the-kl-view/cheatsheet' },
										{ label: 'References', slug: 'lessons/generative-models-and-diffusion/maximum-likelihood-and-the-kl-view/references' },
									],
								},
								{
									label: 'Normalizing flows',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/generative-models-and-diffusion/normalizing-flows/brief' },
										{ label: 'Lesson', slug: 'lessons/generative-models-and-diffusion/normalizing-flows/lesson' },
										{ label: 'Practice', slug: 'lessons/generative-models-and-diffusion/normalizing-flows/practice' },
										{ label: 'Summary', slug: 'lessons/generative-models-and-diffusion/normalizing-flows/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/generative-models-and-diffusion/normalizing-flows/cheatsheet' },
										{ label: 'References', slug: 'lessons/generative-models-and-diffusion/normalizing-flows/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nLatent and adversarial',
							collapsed: true,
							items: [
								{
									label: 'Latent variables and the ELBO',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/generative-models-and-diffusion/latent-variables-and-the-elbo/brief' },
										{ label: 'Lesson', slug: 'lessons/generative-models-and-diffusion/latent-variables-and-the-elbo/lesson' },
										{ label: 'Practice', slug: 'lessons/generative-models-and-diffusion/latent-variables-and-the-elbo/practice' },
										{ label: 'Summary', slug: 'lessons/generative-models-and-diffusion/latent-variables-and-the-elbo/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/generative-models-and-diffusion/latent-variables-and-the-elbo/cheatsheet' },
										{ label: 'References', slug: 'lessons/generative-models-and-diffusion/latent-variables-and-the-elbo/references' },
									],
								},
								{
									label: 'VAE training',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/generative-models-and-diffusion/vae-training-in-practice/brief' },
										{ label: 'Lesson', slug: 'lessons/generative-models-and-diffusion/vae-training-in-practice/lesson' },
										{ label: 'Practice', slug: 'lessons/generative-models-and-diffusion/vae-training-in-practice/practice' },
										{ label: 'Summary', slug: 'lessons/generative-models-and-diffusion/vae-training-in-practice/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/generative-models-and-diffusion/vae-training-in-practice/cheatsheet' },
										{ label: 'References', slug: 'lessons/generative-models-and-diffusion/vae-training-in-practice/references' },
									],
								},
								{
									label: 'GANs: the minimax game',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/generative-models-and-diffusion/gans-the-minimax-game/brief' },
										{ label: 'Lesson', slug: 'lessons/generative-models-and-diffusion/gans-the-minimax-game/lesson' },
										{ label: 'Practice', slug: 'lessons/generative-models-and-diffusion/gans-the-minimax-game/practice' },
										{ label: 'Summary', slug: 'lessons/generative-models-and-diffusion/gans-the-minimax-game/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/generative-models-and-diffusion/gans-the-minimax-game/cheatsheet' },
										{ label: 'References', slug: 'lessons/generative-models-and-diffusion/gans-the-minimax-game/references' },
									],
								},
								{
									label: 'WGAN gradient penalty',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/generative-models-and-diffusion/wgan-gradient-penalty/brief' },
										{ label: 'Lesson', slug: 'lessons/generative-models-and-diffusion/wgan-gradient-penalty/lesson' },
										{ label: 'Practice', slug: 'lessons/generative-models-and-diffusion/wgan-gradient-penalty/practice' },
										{ label: 'Summary', slug: 'lessons/generative-models-and-diffusion/wgan-gradient-penalty/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/generative-models-and-diffusion/wgan-gradient-penalty/cheatsheet' },
										{ label: 'References', slug: 'lessons/generative-models-and-diffusion/wgan-gradient-penalty/references' },
									],
								},
								{
									label: 'Evaluating generative models',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/generative-models-and-diffusion/evaluating-generative-models/brief' },
										{ label: 'Lesson', slug: 'lessons/generative-models-and-diffusion/evaluating-generative-models/lesson' },
										{ label: 'Practice', slug: 'lessons/generative-models-and-diffusion/evaluating-generative-models/practice' },
										{ label: 'Summary', slug: 'lessons/generative-models-and-diffusion/evaluating-generative-models/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/generative-models-and-diffusion/evaluating-generative-models/cheatsheet' },
										{ label: 'References', slug: 'lessons/generative-models-and-diffusion/evaluating-generative-models/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nEnergy, score, diffusion',
							collapsed: true,
							items: [
								{
									label: 'Energy-based models',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/generative-models-and-diffusion/energy-based-models/brief' },
										{ label: 'Lesson', slug: 'lessons/generative-models-and-diffusion/energy-based-models/lesson' },
										{ label: 'Practice', slug: 'lessons/generative-models-and-diffusion/energy-based-models/practice' },
										{ label: 'Summary', slug: 'lessons/generative-models-and-diffusion/energy-based-models/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/generative-models-and-diffusion/energy-based-models/cheatsheet' },
										{ label: 'References', slug: 'lessons/generative-models-and-diffusion/energy-based-models/references' },
									],
								},
								{
									label: 'Score matching',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/generative-models-and-diffusion/score-matching/brief' },
										{ label: 'Lesson', slug: 'lessons/generative-models-and-diffusion/score-matching/lesson' },
										{ label: 'Practice', slug: 'lessons/generative-models-and-diffusion/score-matching/practice' },
										{ label: 'Summary', slug: 'lessons/generative-models-and-diffusion/score-matching/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/generative-models-and-diffusion/score-matching/cheatsheet' },
										{ label: 'References', slug: 'lessons/generative-models-and-diffusion/score-matching/references' },
									],
								},
								{
									label: 'Diffusion I',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/generative-models-and-diffusion/diffusion-i-forward-and-reverse-processes/brief' },
										{ label: 'Lesson', slug: 'lessons/generative-models-and-diffusion/diffusion-i-forward-and-reverse-processes/lesson' },
										{ label: 'Practice', slug: 'lessons/generative-models-and-diffusion/diffusion-i-forward-and-reverse-processes/practice' },
										{ label: 'Summary', slug: 'lessons/generative-models-and-diffusion/diffusion-i-forward-and-reverse-processes/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/generative-models-and-diffusion/diffusion-i-forward-and-reverse-processes/cheatsheet' },
										{ label: 'References', slug: 'lessons/generative-models-and-diffusion/diffusion-i-forward-and-reverse-processes/references' },
									],
								},
								{
									label: 'Diffusion II',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/generative-models-and-diffusion/diffusion-ii-training-and-sampling/brief' },
										{ label: 'Lesson', slug: 'lessons/generative-models-and-diffusion/diffusion-ii-training-and-sampling/lesson' },
										{ label: 'Practice', slug: 'lessons/generative-models-and-diffusion/diffusion-ii-training-and-sampling/practice' },
										{ label: 'Summary', slug: 'lessons/generative-models-and-diffusion/diffusion-ii-training-and-sampling/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/generative-models-and-diffusion/diffusion-ii-training-and-sampling/cheatsheet' },
										{ label: 'References', slug: 'lessons/generative-models-and-diffusion/diffusion-ii-training-and-sampling/references' },
									],
								},
								{
									label: 'Score-based diffusion (SDEs)',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/generative-models-and-diffusion/score-based-diffusion-via-sdes/brief' },
										{ label: 'Lesson', slug: 'lessons/generative-models-and-diffusion/score-based-diffusion-via-sdes/lesson' },
										{ label: 'Practice', slug: 'lessons/generative-models-and-diffusion/score-based-diffusion-via-sdes/practice' },
										{ label: 'Summary', slug: 'lessons/generative-models-and-diffusion/score-based-diffusion-via-sdes/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/generative-models-and-diffusion/score-based-diffusion-via-sdes/cheatsheet' },
										{ label: 'References', slug: 'lessons/generative-models-and-diffusion/score-based-diffusion-via-sdes/references' },
									],
								},
								{
									label: 'The four-paradigm landscape',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/generative-models-and-diffusion/the-four-paradigm-landscape/brief' },
										{ label: 'Lesson', slug: 'lessons/generative-models-and-diffusion/the-four-paradigm-landscape/lesson' },
										{ label: 'Practice', slug: 'lessons/generative-models-and-diffusion/the-four-paradigm-landscape/practice' },
										{ label: 'Summary', slug: 'lessons/generative-models-and-diffusion/the-four-paradigm-landscape/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/generative-models-and-diffusion/the-four-paradigm-landscape/cheatsheet' },
										{ label: 'References', slug: 'lessons/generative-models-and-diffusion/the-four-paradigm-landscape/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 22: Building with Claude',
					items: [
						{
							label: 'Phase 1\nAPI foundations',
							collapsed: true,
							items: [
								{
									label: 'Your first Claude API call',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/building-with-claude/your-first-claude-api-call/brief' },
										{ label: 'Lesson', slug: 'lessons/building-with-claude/your-first-claude-api-call/lesson' },
										{ label: 'Practice', slug: 'lessons/building-with-claude/your-first-claude-api-call/practice' },
										{ label: 'Summary', slug: 'lessons/building-with-claude/your-first-claude-api-call/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/building-with-claude/your-first-claude-api-call/cheatsheet' },
										{ label: 'References', slug: 'lessons/building-with-claude/your-first-claude-api-call/references' },
									],
								},
								{
									label: 'The Messages API in production',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/building-with-claude/the-messages-api-in-production/brief' },
										{ label: 'Lesson', slug: 'lessons/building-with-claude/the-messages-api-in-production/lesson' },
										{ label: 'Practice', slug: 'lessons/building-with-claude/the-messages-api-in-production/practice' },
										{ label: 'Summary', slug: 'lessons/building-with-claude/the-messages-api-in-production/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/building-with-claude/the-messages-api-in-production/cheatsheet' },
										{ label: 'References', slug: 'lessons/building-with-claude/the-messages-api-in-production/references' },
									],
								},
								{
									label: 'Choosing your model and the effort dial',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/building-with-claude/choosing-your-model-and-the-effort-dial/brief' },
										{ label: 'Lesson', slug: 'lessons/building-with-claude/choosing-your-model-and-the-effort-dial/lesson' },
										{ label: 'Practice', slug: 'lessons/building-with-claude/choosing-your-model-and-the-effort-dial/practice' },
										{ label: 'Summary', slug: 'lessons/building-with-claude/choosing-your-model-and-the-effort-dial/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/building-with-claude/choosing-your-model-and-the-effort-dial/cheatsheet' },
										{ label: 'References', slug: 'lessons/building-with-claude/choosing-your-model-and-the-effort-dial/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nAugmentation patterns',
							collapsed: true,
							items: [
								{
									label: 'Tool use, the foundation',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/building-with-claude/tool-use-the-foundation/brief' },
										{ label: 'Lesson', slug: 'lessons/building-with-claude/tool-use-the-foundation/lesson' },
										{ label: 'Practice', slug: 'lessons/building-with-claude/tool-use-the-foundation/practice' },
										{ label: 'Summary', slug: 'lessons/building-with-claude/tool-use-the-foundation/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/building-with-claude/tool-use-the-foundation/cheatsheet' },
										{ label: 'References', slug: 'lessons/building-with-claude/tool-use-the-foundation/references' },
									],
								},
								{
									label: 'Server-side tools and built-ins',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/building-with-claude/server-side-tools-and-built-ins/brief' },
										{ label: 'Lesson', slug: 'lessons/building-with-claude/server-side-tools-and-built-ins/lesson' },
										{ label: 'Practice', slug: 'lessons/building-with-claude/server-side-tools-and-built-ins/practice' },
										{ label: 'Summary', slug: 'lessons/building-with-claude/server-side-tools-and-built-ins/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/building-with-claude/server-side-tools-and-built-ins/cheatsheet' },
										{ label: 'References', slug: 'lessons/building-with-claude/server-side-tools-and-built-ins/references' },
									],
								},
								{
									label: 'Model Context Protocol',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/building-with-claude/model-context-protocol/brief' },
										{ label: 'Lesson', slug: 'lessons/building-with-claude/model-context-protocol/lesson' },
										{ label: 'Practice', slug: 'lessons/building-with-claude/model-context-protocol/practice' },
										{ label: 'Summary', slug: 'lessons/building-with-claude/model-context-protocol/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/building-with-claude/model-context-protocol/cheatsheet' },
										{ label: 'References', slug: 'lessons/building-with-claude/model-context-protocol/references' },
									],
								},
								{
									label: 'Prompt caching and context management',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/building-with-claude/prompt-caching-and-context-management/brief' },
										{ label: 'Lesson', slug: 'lessons/building-with-claude/prompt-caching-and-context-management/lesson' },
										{ label: 'Practice', slug: 'lessons/building-with-claude/prompt-caching-and-context-management/practice' },
										{ label: 'Summary', slug: 'lessons/building-with-claude/prompt-caching-and-context-management/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/building-with-claude/prompt-caching-and-context-management/cheatsheet' },
										{ label: 'References', slug: 'lessons/building-with-claude/prompt-caching-and-context-management/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nAgent patterns',
							collapsed: true,
							items: [
								{
									label: 'From single call to agent loop',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/building-with-claude/from-single-call-to-agent-loop/brief' },
										{ label: 'Lesson', slug: 'lessons/building-with-claude/from-single-call-to-agent-loop/lesson' },
										{ label: 'Practice', slug: 'lessons/building-with-claude/from-single-call-to-agent-loop/practice' },
										{ label: 'Summary', slug: 'lessons/building-with-claude/from-single-call-to-agent-loop/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/building-with-claude/from-single-call-to-agent-loop/cheatsheet' },
										{ label: 'References', slug: 'lessons/building-with-claude/from-single-call-to-agent-loop/references' },
									],
								},
								{
									label: 'Six effective-agent patterns',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/building-with-claude/six-effective-agent-patterns/brief' },
										{ label: 'Lesson', slug: 'lessons/building-with-claude/six-effective-agent-patterns/lesson' },
										{ label: 'Practice', slug: 'lessons/building-with-claude/six-effective-agent-patterns/practice' },
										{ label: 'Summary', slug: 'lessons/building-with-claude/six-effective-agent-patterns/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/building-with-claude/six-effective-agent-patterns/cheatsheet' },
										{ label: 'References', slug: 'lessons/building-with-claude/six-effective-agent-patterns/references' },
									],
								},
								{
									label: 'Agent Skills and Claude Code',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/building-with-claude/agent-skills-and-claude-code/brief' },
										{ label: 'Lesson', slug: 'lessons/building-with-claude/agent-skills-and-claude-code/lesson' },
										{ label: 'Practice', slug: 'lessons/building-with-claude/agent-skills-and-claude-code/practice' },
										{ label: 'Summary', slug: 'lessons/building-with-claude/agent-skills-and-claude-code/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/building-with-claude/agent-skills-and-claude-code/cheatsheet' },
										{ label: 'References', slug: 'lessons/building-with-claude/agent-skills-and-claude-code/references' },
									],
								},
								{
									label: 'Subagents and Claude Managed Agents',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/building-with-claude/subagents-and-managed-agents/brief' },
										{ label: 'Lesson', slug: 'lessons/building-with-claude/subagents-and-managed-agents/lesson' },
										{ label: 'Practice', slug: 'lessons/building-with-claude/subagents-and-managed-agents/practice' },
										{ label: 'Summary', slug: 'lessons/building-with-claude/subagents-and-managed-agents/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/building-with-claude/subagents-and-managed-agents/cheatsheet' },
										{ label: 'References', slug: 'lessons/building-with-claude/subagents-and-managed-agents/references' },
									],
								},
							],
						},
						{
							label: 'Phase 4\nProduction',
							collapsed: true,
							items: [
								{
									label: 'Shipping a Claude application',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/building-with-claude/shipping-a-claude-application/brief' },
										{ label: 'Lesson', slug: 'lessons/building-with-claude/shipping-a-claude-application/lesson' },
										{ label: 'Practice', slug: 'lessons/building-with-claude/shipping-a-claude-application/practice' },
										{ label: 'Summary', slug: 'lessons/building-with-claude/shipping-a-claude-application/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/building-with-claude/shipping-a-claude-application/cheatsheet' },
										{ label: 'References', slug: 'lessons/building-with-claude/shipping-a-claude-application/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 23: AI Safety and Alignment',
					items: [
						{
							label: 'Phase 1\nThe risks landscape',
							collapsed: true,
							items: [
								{
									label: 'AI safety as a field',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-safety-and-alignment/ai-safety-as-a-field/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-safety-and-alignment/ai-safety-as-a-field/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-safety-and-alignment/ai-safety-as-a-field/practice' },
										{ label: 'Summary', slug: 'lessons/ai-safety-and-alignment/ai-safety-as-a-field/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-safety-and-alignment/ai-safety-as-a-field/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-safety-and-alignment/ai-safety-as-a-field/references' },
									],
								},
								{
									label: 'The four catastrophic risk categories',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-safety-and-alignment/four-catastrophic-risk-categories/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-safety-and-alignment/four-catastrophic-risk-categories/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-safety-and-alignment/four-catastrophic-risk-categories/practice' },
										{ label: 'Summary', slug: 'lessons/ai-safety-and-alignment/four-catastrophic-risk-categories/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-safety-and-alignment/four-catastrophic-risk-categories/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-safety-and-alignment/four-catastrophic-risk-categories/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nSafety and alignment',
							collapsed: true,
							items: [
								{
									label: 'Monitoring and robustness',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-safety-and-alignment/monitoring-and-robustness/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-safety-and-alignment/monitoring-and-robustness/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-safety-and-alignment/monitoring-and-robustness/practice' },
										{ label: 'Summary', slug: 'lessons/ai-safety-and-alignment/monitoring-and-robustness/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-safety-and-alignment/monitoring-and-robustness/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-safety-and-alignment/monitoring-and-robustness/references' },
									],
								},
								{
									label: 'The alignment problem',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-safety-and-alignment/the-alignment-problem/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-safety-and-alignment/the-alignment-problem/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-safety-and-alignment/the-alignment-problem/practice' },
										{ label: 'Summary', slug: 'lessons/ai-safety-and-alignment/the-alignment-problem/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-safety-and-alignment/the-alignment-problem/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-safety-and-alignment/the-alignment-problem/references' },
									],
								},
								{
									label: 'Safety engineering',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-safety-and-alignment/safety-engineering/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-safety-and-alignment/safety-engineering/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-safety-and-alignment/safety-engineering/practice' },
										{ label: 'Summary', slug: 'lessons/ai-safety-and-alignment/safety-engineering/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-safety-and-alignment/safety-engineering/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-safety-and-alignment/safety-engineering/references' },
									],
								},
								{
									label: 'Complex systems and emergent risk',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-safety-and-alignment/complex-systems/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-safety-and-alignment/complex-systems/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-safety-and-alignment/complex-systems/practice' },
										{ label: 'Summary', slug: 'lessons/ai-safety-and-alignment/complex-systems/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-safety-and-alignment/complex-systems/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-safety-and-alignment/complex-systems/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nEthics and governance',
							collapsed: true,
							items: [
								{
									label: 'Beneficial AI and machine ethics',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-safety-and-alignment/beneficial-ai-and-machine-ethics/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-safety-and-alignment/beneficial-ai-and-machine-ethics/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-safety-and-alignment/beneficial-ai-and-machine-ethics/practice' },
										{ label: 'Summary', slug: 'lessons/ai-safety-and-alignment/beneficial-ai-and-machine-ethics/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-safety-and-alignment/beneficial-ai-and-machine-ethics/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-safety-and-alignment/beneficial-ai-and-machine-ethics/references' },
									],
								},
								{
									label: 'Collective action and multi-agent dynamics',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-safety-and-alignment/collective-action-and-multi-agent-dynamics/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-safety-and-alignment/collective-action-and-multi-agent-dynamics/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-safety-and-alignment/collective-action-and-multi-agent-dynamics/practice' },
										{ label: 'Summary', slug: 'lessons/ai-safety-and-alignment/collective-action-and-multi-agent-dynamics/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-safety-and-alignment/collective-action-and-multi-agent-dynamics/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-safety-and-alignment/collective-action-and-multi-agent-dynamics/references' },
									],
								},
								{
									label: 'AI governance',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/ai-safety-and-alignment/ai-governance/brief' },
										{ label: 'Lesson', slug: 'lessons/ai-safety-and-alignment/ai-governance/lesson' },
										{ label: 'Practice', slug: 'lessons/ai-safety-and-alignment/ai-governance/practice' },
										{ label: 'Summary', slug: 'lessons/ai-safety-and-alignment/ai-governance/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/ai-safety-and-alignment/ai-governance/cheatsheet' },
										{ label: 'References', slug: 'lessons/ai-safety-and-alignment/ai-governance/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 24: Multimodal AI',
					items: [
						{
							label: 'Phase 1\nOrientation',
							collapsed: true,
							items: [
								{
									label: 'What multimodal AI is',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/multimodal-ai/what-multimodal-ai-actually-is/brief' },
										{ label: 'Lesson', slug: 'lessons/multimodal-ai/what-multimodal-ai-actually-is/lesson' },
										{ label: 'Practice', slug: 'lessons/multimodal-ai/what-multimodal-ai-actually-is/practice' },
										{ label: 'Summary', slug: 'lessons/multimodal-ai/what-multimodal-ai-actually-is/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/multimodal-ai/what-multimodal-ai-actually-is/cheatsheet' },
										{ label: 'References', slug: 'lessons/multimodal-ai/what-multimodal-ai-actually-is/references' },
									],
								},
							],
						},
						{
							label: 'Phase 2\nLarge multimodal models',
							collapsed: true,
							items: [
								{
									label: 'LLMs to multimodal',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/multimodal-ai/from-llms-to-lmms/brief' },
										{ label: 'Lesson', slug: 'lessons/multimodal-ai/from-llms-to-lmms/lesson' },
										{ label: 'Practice', slug: 'lessons/multimodal-ai/from-llms-to-lmms/practice' },
										{ label: 'Summary', slug: 'lessons/multimodal-ai/from-llms-to-lmms/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/multimodal-ai/from-llms-to-lmms/cheatsheet' },
										{ label: 'References', slug: 'lessons/multimodal-ai/from-llms-to-lmms/references' },
									],
								},
								{
									label: 'Native multimodal',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/multimodal-ai/native-multimodal-intelligence/brief' },
										{ label: 'Lesson', slug: 'lessons/multimodal-ai/native-multimodal-intelligence/lesson' },
										{ label: 'Practice', slug: 'lessons/multimodal-ai/native-multimodal-intelligence/practice' },
										{ label: 'Summary', slug: 'lessons/multimodal-ai/native-multimodal-intelligence/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/multimodal-ai/native-multimodal-intelligence/cheatsheet' },
										{ label: 'References', slug: 'lessons/multimodal-ai/native-multimodal-intelligence/references' },
									],
								},
								{
									label: 'Multimodal reasoning',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/multimodal-ai/reasoning-over-multimodal-inputs/brief' },
										{ label: 'Lesson', slug: 'lessons/multimodal-ai/reasoning-over-multimodal-inputs/lesson' },
										{ label: 'Practice', slug: 'lessons/multimodal-ai/reasoning-over-multimodal-inputs/practice' },
										{ label: 'Summary', slug: 'lessons/multimodal-ai/reasoning-over-multimodal-inputs/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/multimodal-ai/reasoning-over-multimodal-inputs/cheatsheet' },
										{ label: 'References', slug: 'lessons/multimodal-ai/reasoning-over-multimodal-inputs/references' },
									],
								},
							],
						},
						{
							label: 'Phase 3\nGenerative models',
							collapsed: true,
							items: [
								{
									label: 'Diffusion transformers',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/multimodal-ai/transformers-in-diffusion/brief' },
										{ label: 'Lesson', slug: 'lessons/multimodal-ai/transformers-in-diffusion/lesson' },
										{ label: 'Practice', slug: 'lessons/multimodal-ai/transformers-in-diffusion/practice' },
										{ label: 'Summary', slug: 'lessons/multimodal-ai/transformers-in-diffusion/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/multimodal-ai/transformers-in-diffusion/cheatsheet' },
										{ label: 'References', slug: 'lessons/multimodal-ai/transformers-in-diffusion/references' },
									],
								},
								{
									label: 'Video generation',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/multimodal-ai/transformers-for-video-generation/brief' },
										{ label: 'Lesson', slug: 'lessons/multimodal-ai/transformers-for-video-generation/lesson' },
										{ label: 'Practice', slug: 'lessons/multimodal-ai/transformers-for-video-generation/practice' },
										{ label: 'Summary', slug: 'lessons/multimodal-ai/transformers-for-video-generation/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/multimodal-ai/transformers-for-video-generation/cheatsheet' },
										{ label: 'References', slug: 'lessons/multimodal-ai/transformers-for-video-generation/references' },
									],
								},
							],
						},
						{
							label: 'Phase 4\nAdvanced directions',
							collapsed: true,
							items: [
								{
									label: 'JEPA and world models',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/multimodal-ai/jepa-and-world-modeling/brief' },
										{ label: 'Lesson', slug: 'lessons/multimodal-ai/jepa-and-world-modeling/lesson' },
										{ label: 'Practice', slug: 'lessons/multimodal-ai/jepa-and-world-modeling/practice' },
										{ label: 'Summary', slug: 'lessons/multimodal-ai/jepa-and-world-modeling/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/multimodal-ai/jepa-and-world-modeling/cheatsheet' },
										{ label: 'References', slug: 'lessons/multimodal-ai/jepa-and-world-modeling/references' },
									],
								},
								{
									label: 'World models for science',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/multimodal-ai/multimodal-world-models-for-science/brief' },
										{ label: 'Lesson', slug: 'lessons/multimodal-ai/multimodal-world-models-for-science/lesson' },
										{ label: 'Practice', slug: 'lessons/multimodal-ai/multimodal-world-models-for-science/practice' },
										{ label: 'Summary', slug: 'lessons/multimodal-ai/multimodal-world-models-for-science/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/multimodal-ai/multimodal-world-models-for-science/cheatsheet' },
										{ label: 'References', slug: 'lessons/multimodal-ai/multimodal-world-models-for-science/references' },
									],
								},
								{
									label: 'Multimodal agents',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/multimodal-ai/multimodal-agents-in-production/brief' },
										{ label: 'Lesson', slug: 'lessons/multimodal-ai/multimodal-agents-in-production/lesson' },
										{ label: 'Practice', slug: 'lessons/multimodal-ai/multimodal-agents-in-production/practice' },
										{ label: 'Summary', slug: 'lessons/multimodal-ai/multimodal-agents-in-production/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/multimodal-ai/multimodal-agents-in-production/cheatsheet' },
										{ label: 'References', slug: 'lessons/multimodal-ai/multimodal-agents-in-production/references' },
									],
								},
								{
									label: 'Where it is going',
									collapsed: true,
									items: [
										{ label: 'Brief', slug: 'lessons/multimodal-ai/where-multimodal-ai-is-going/brief' },
										{ label: 'Lesson', slug: 'lessons/multimodal-ai/where-multimodal-ai-is-going/lesson' },
										{ label: 'Practice', slug: 'lessons/multimodal-ai/where-multimodal-ai-is-going/practice' },
										{ label: 'Summary', slug: 'lessons/multimodal-ai/where-multimodal-ai-is-going/summary' },
										{ label: 'Cheatsheet', slug: 'lessons/multimodal-ai/where-multimodal-ai-is-going/cheatsheet' },
										{ label: 'References', slug: 'lessons/multimodal-ai/where-multimodal-ai-is-going/references' },
									],
								},
							],
						},
					],
				},
				{
					label: 'Track 25: AI Agent Teams',
					items: [
						{
							label: 'Why split one AI into many',
							collapsed: true,
							items: [
								{ label: 'Brief', slug: 'lessons/ai-agent-teams/why-split-one-ai-into-many/brief' },
								{ label: 'Lesson', slug: 'lessons/ai-agent-teams/why-split-one-ai-into-many/lesson' },
								{ label: 'Practice', slug: 'lessons/ai-agent-teams/why-split-one-ai-into-many/practice' },
								{ label: 'Summary', slug: 'lessons/ai-agent-teams/why-split-one-ai-into-many/summary' },
								{ label: 'Cheatsheet', slug: 'lessons/ai-agent-teams/why-split-one-ai-into-many/cheatsheet' },
								{ label: 'References', slug: 'lessons/ai-agent-teams/why-split-one-ai-into-many/references' },
							],
						},
						{
							label: 'How an agent fetches its own data',
							collapsed: true,
							items: [
								{ label: 'Brief', slug: 'lessons/ai-agent-teams/how-an-agent-fetches-its-own-data/brief' },
								{ label: 'Lesson', slug: 'lessons/ai-agent-teams/how-an-agent-fetches-its-own-data/lesson' },
								{ label: 'Practice', slug: 'lessons/ai-agent-teams/how-an-agent-fetches-its-own-data/practice' },
								{ label: 'Summary', slug: 'lessons/ai-agent-teams/how-an-agent-fetches-its-own-data/summary' },
								{ label: 'Cheatsheet', slug: 'lessons/ai-agent-teams/how-an-agent-fetches-its-own-data/cheatsheet' },
								{ label: 'References', slug: 'lessons/ai-agent-teams/how-an-agent-fetches-its-own-data/references' },
							],
						},
							{
								label: 'The bull and the bear',
								collapsed: true,
								items: [
									{ label: 'Brief', slug: 'lessons/ai-agent-teams/the-bull-and-the-bear/brief' },
									{ label: 'Lesson', slug: 'lessons/ai-agent-teams/the-bull-and-the-bear/lesson' },
									{ label: 'Practice', slug: 'lessons/ai-agent-teams/the-bull-and-the-bear/practice' },
									{ label: 'Summary', slug: 'lessons/ai-agent-teams/the-bull-and-the-bear/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/ai-agent-teams/the-bull-and-the-bear/cheatsheet' },
									{ label: 'References', slug: 'lessons/ai-agent-teams/the-bull-and-the-bear/references' },
								],
							},
							{
								label: 'The trader',
								collapsed: true,
								items: [
									{ label: 'Brief', slug: 'lessons/ai-agent-teams/the-trader/brief' },
									{ label: 'Lesson', slug: 'lessons/ai-agent-teams/the-trader/lesson' },
									{ label: 'Practice', slug: 'lessons/ai-agent-teams/the-trader/practice' },
									{ label: 'Summary', slug: 'lessons/ai-agent-teams/the-trader/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/ai-agent-teams/the-trader/cheatsheet' },
									{ label: 'References', slug: 'lessons/ai-agent-teams/the-trader/references' },
								],
							},
							{
								label: 'The risk gate',
								collapsed: true,
								items: [
									{ label: 'Brief', slug: 'lessons/ai-agent-teams/the-risk-gate/brief' },
									{ label: 'Lesson', slug: 'lessons/ai-agent-teams/the-risk-gate/lesson' },
									{ label: 'Practice', slug: 'lessons/ai-agent-teams/the-risk-gate/practice' },
									{ label: 'Summary', slug: 'lessons/ai-agent-teams/the-risk-gate/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/ai-agent-teams/the-risk-gate/cheatsheet' },
									{ label: 'References', slug: 'lessons/ai-agent-teams/the-risk-gate/references' },
								],
							},
							{
								label: 'Orchestration and shared state',
								collapsed: true,
								items: [
									{ label: 'Brief', slug: 'lessons/ai-agent-teams/orchestration-and-shared-state/brief' },
									{ label: 'Lesson', slug: 'lessons/ai-agent-teams/orchestration-and-shared-state/lesson' },
									{ label: 'Practice', slug: 'lessons/ai-agent-teams/orchestration-and-shared-state/practice' },
									{ label: 'Summary', slug: 'lessons/ai-agent-teams/orchestration-and-shared-state/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/ai-agent-teams/orchestration-and-shared-state/cheatsheet' },
									{ label: 'References', slug: 'lessons/ai-agent-teams/orchestration-and-shared-state/references' },
								],
							},
							{
								label: 'Memory and reflection',
								collapsed: true,
								items: [
									{ label: 'Brief', slug: 'lessons/ai-agent-teams/memory-and-reflection/brief' },
									{ label: 'Lesson', slug: 'lessons/ai-agent-teams/memory-and-reflection/lesson' },
									{ label: 'Practice', slug: 'lessons/ai-agent-teams/memory-and-reflection/practice' },
									{ label: 'Summary', slug: 'lessons/ai-agent-teams/memory-and-reflection/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/ai-agent-teams/memory-and-reflection/cheatsheet' },
									{ label: 'References', slug: 'lessons/ai-agent-teams/memory-and-reflection/references' },
								],
							},
							{
								label: 'The capstone',
								collapsed: true,
								items: [
									{ label: 'Brief', slug: 'lessons/ai-agent-teams/the-capstone/brief' },
									{ label: 'Lesson', slug: 'lessons/ai-agent-teams/the-capstone/lesson' },
									{ label: 'Practice', slug: 'lessons/ai-agent-teams/the-capstone/practice' },
									{ label: 'Summary', slug: 'lessons/ai-agent-teams/the-capstone/summary' },
									{ label: 'Cheatsheet', slug: 'lessons/ai-agent-teams/the-capstone/cheatsheet' },
									{ label: 'References', slug: 'lessons/ai-agent-teams/the-capstone/references' },
								],
							}
],
				},
				{
					label: 'Track 26: Agentic Systems',
					items: [
						{
							label: 'Thinking like an architect',
							collapsed: true,
							items: [
								{ label: 'Brief', slug: 'lessons/engineering-agentic-systems/thinking-like-an-architect/brief' },
								{ label: 'Lesson', slug: 'lessons/engineering-agentic-systems/thinking-like-an-architect/lesson' },
								{ label: 'Practice', slug: 'lessons/engineering-agentic-systems/thinking-like-an-architect/practice' },
								{ label: 'Summary', slug: 'lessons/engineering-agentic-systems/thinking-like-an-architect/summary' },
								{ label: 'Cheatsheet', slug: 'lessons/engineering-agentic-systems/thinking-like-an-architect/cheatsheet' },
								{ label: 'References', slug: 'lessons/engineering-agentic-systems/thinking-like-an-architect/references' },
							],
						},
						{
							label: 'CLAUDE.md at team scale',
							collapsed: true,
							items: [
								{ label: 'Brief', slug: 'lessons/engineering-agentic-systems/claude-md-at-team-scale/brief' },
								{ label: 'Lesson', slug: 'lessons/engineering-agentic-systems/claude-md-at-team-scale/lesson' },
								{ label: 'Practice', slug: 'lessons/engineering-agentic-systems/claude-md-at-team-scale/practice' },
								{ label: 'Summary', slug: 'lessons/engineering-agentic-systems/claude-md-at-team-scale/summary' },
								{ label: 'Cheatsheet', slug: 'lessons/engineering-agentic-systems/claude-md-at-team-scale/cheatsheet' },
								{ label: 'References', slug: 'lessons/engineering-agentic-systems/claude-md-at-team-scale/references' },
							],
						},
						{
							label: 'Schemas that refuse to lie',
							collapsed: true,
							items: [
								{ label: 'Brief', slug: 'lessons/engineering-agentic-systems/schemas-that-refuse-to-lie/brief' },
								{ label: 'Lesson', slug: 'lessons/engineering-agentic-systems/schemas-that-refuse-to-lie/lesson' },
								{ label: 'Practice', slug: 'lessons/engineering-agentic-systems/schemas-that-refuse-to-lie/practice' },
								{ label: 'Summary', slug: 'lessons/engineering-agentic-systems/schemas-that-refuse-to-lie/summary' },
								{ label: 'Cheatsheet', slug: 'lessons/engineering-agentic-systems/schemas-that-refuse-to-lie/cheatsheet' },
								{ label: 'References', slug: 'lessons/engineering-agentic-systems/schemas-that-refuse-to-lie/references' },
							],
						},
						{
							label: 'Tools other agents can trust',
							collapsed: true,
							items: [
								{ label: 'Brief', slug: 'lessons/engineering-agentic-systems/tools-other-agents-can-trust/brief' },
								{ label: 'Lesson', slug: 'lessons/engineering-agentic-systems/tools-other-agents-can-trust/lesson' },
								{ label: 'Practice', slug: 'lessons/engineering-agentic-systems/tools-other-agents-can-trust/practice' },
								{ label: 'Summary', slug: 'lessons/engineering-agentic-systems/tools-other-agents-can-trust/summary' },
								{ label: 'Cheatsheet', slug: 'lessons/engineering-agentic-systems/tools-other-agents-can-trust/cheatsheet' },
								{ label: 'References', slug: 'lessons/engineering-agentic-systems/tools-other-agents-can-trust/references' },
							],
						},
						{
							label: 'Orchestration that survives contact',
							collapsed: true,
							items: [
								{ label: 'Brief', slug: 'lessons/engineering-agentic-systems/orchestration-that-survives-contact/brief' },
								{ label: 'Lesson', slug: 'lessons/engineering-agentic-systems/orchestration-that-survives-contact/lesson' },
								{ label: 'Practice', slug: 'lessons/engineering-agentic-systems/orchestration-that-survives-contact/practice' },
								{ label: 'Summary', slug: 'lessons/engineering-agentic-systems/orchestration-that-survives-contact/summary' },
								{ label: 'Cheatsheet', slug: 'lessons/engineering-agentic-systems/orchestration-that-survives-contact/cheatsheet' },
								{ label: 'References', slug: 'lessons/engineering-agentic-systems/orchestration-that-survives-contact/references' },
							],
						},
						{
							label: 'Reliability is a design choice',
							collapsed: true,
							items: [
								{ label: 'Brief', slug: 'lessons/engineering-agentic-systems/reliability-is-a-design-choice/brief' },
								{ label: 'Lesson', slug: 'lessons/engineering-agentic-systems/reliability-is-a-design-choice/lesson' },
								{ label: 'Practice', slug: 'lessons/engineering-agentic-systems/reliability-is-a-design-choice/practice' },
								{ label: 'Summary', slug: 'lessons/engineering-agentic-systems/reliability-is-a-design-choice/summary' },
								{ label: 'Cheatsheet', slug: 'lessons/engineering-agentic-systems/reliability-is-a-design-choice/cheatsheet' },
								{ label: 'References', slug: 'lessons/engineering-agentic-systems/reliability-is-a-design-choice/references' },
							],
						},
						{
							label: 'Agents in the pipeline',
							collapsed: true,
							items: [
								{ label: 'Brief', slug: 'lessons/engineering-agentic-systems/agents-in-the-pipeline/brief' },
								{ label: 'Lesson', slug: 'lessons/engineering-agentic-systems/agents-in-the-pipeline/lesson' },
								{ label: 'Practice', slug: 'lessons/engineering-agentic-systems/agents-in-the-pipeline/practice' },
								{ label: 'Summary', slug: 'lessons/engineering-agentic-systems/agents-in-the-pipeline/summary' },
								{ label: 'Cheatsheet', slug: 'lessons/engineering-agentic-systems/agents-in-the-pipeline/cheatsheet' },
								{ label: 'References', slug: 'lessons/engineering-agentic-systems/agents-in-the-pipeline/references' },
							],
						},
						{
							label: 'The capstone: design, build, defend',
							collapsed: true,
							items: [
								{ label: 'Brief', slug: 'lessons/engineering-agentic-systems/design-build-defend/brief' },
								{ label: 'Lesson', slug: 'lessons/engineering-agentic-systems/design-build-defend/lesson' },
								{ label: 'Practice', slug: 'lessons/engineering-agentic-systems/design-build-defend/practice' },
								{ label: 'Summary', slug: 'lessons/engineering-agentic-systems/design-build-defend/summary' },
								{ label: 'Cheatsheet', slug: 'lessons/engineering-agentic-systems/design-build-defend/cheatsheet' },
								{ label: 'References', slug: 'lessons/engineering-agentic-systems/design-build-defend/references' },
							],
						},
					],
				}
			];
					const __top = __groups.filter((g) => !/^Track \d+/.test(g.label));
					const __tracks = __groups
						.filter((g) => /^Track \d+/.test(g.label))
						.sort((a, b) => parseInt(a.label.match(/Track (\d+)/)?.[1] ?? '0', 10) - parseInt(b.label.match(/Track (\d+)/)?.[1] ?? '0', 10));
					return [...__top, ...__tracks];
				})(),
			components: {
				// Adds og:image and twitter:image to every page; Starlight 0.38
				// already emits the rest of the OG / Twitter Card meta automatically.
				Head: './src/components/Head.astro',
				// Adds a legal-links row + parent-company line under Starlight's
				// default footer (edit-link / last-updated / pagination stay).
				Footer: './src/components/Footer.astro',
				// Adds a persistent site nav (Mission / Tracks / Podcast / Trust) to
				// the header so orientation pages are reachable from the homepage,
				// which renders no sidebar (founder, 2026-07-07).
				Header: './src/components/Header.astro',
				// Adds an auto-detected acronym glossary under the right-rail
				// table of contents. See src/components/overrides/PageSidebar.astro
				// + src/data/acronyms.ts.
				PageSidebar: './src/components/overrides/PageSidebar.astro',
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
			favicon: '/favicon-32.png',
		}),
	],
});

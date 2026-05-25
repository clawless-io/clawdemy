import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

/**
 * Extends Starlight's docsSchema with the Brief frontmatter fields from
 * Doc/lesson-framework.md §3.
 *
 * Only `brief.mdx` files are required to populate the extended fields. Other
 * artifacts (lesson/summary/practice/cheatsheet/references) use the base
 * docsSchema with all extensions optional, so their frontmatter can stay
 * minimal.
 *
 * Deeper validation (required-vs-optional per artifact type, Bloom-verb
 * checking, slug shape) runs in `scripts/validate-content.ts` as a build-time
 * check invoked by CI.
 */
export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				// Lesson-wide identifiers — populated on brief.mdx only
				slug: z.string().optional(),
				track: z
					.enum([
						'getting-started',
						'use-case-cookbook',
						'agent-building-101',
						'openclaw-deep-dive',
						'ai-foundations',
						'privacy-local-first',
						'pain-point-library',
						// Mirror tracks (structural mirrors of external open courses)
						'intro-to-deep-learning', // Track 12: MIT 6.S191 (Amini and Amini)
						'build-nns-from-scratch', // Track 13: Karpathy Neural Networks Zero to Hero
						'ai-agents-and-tool-use', // Track 20: Microsoft AI Agents for Beginners + Berkeley CS294
						'neural-network-intuition', // Track 11: 3Blue1Brown Neural Networks series
						'practical-transformers', // Track 14: Hugging Face LLM Course
					])
					.optional(),
				course: z.string().optional(),
				order: z.number().int().optional(),

				// Phase grouping for Track 5 (AI Foundations) and Track 6 (Privacy &
				// Local-First AI), per their mental-model curricula. Optional at the
				// schema level; the validator (scripts/validate-content.ts) requires
				// both fields when track ∈ {'ai-foundations', 'privacy-local-first'}
				// and checks (phase, phase_order) uniqueness per-track. Phase slugs
				// are stable identifiers; sidebar group labels derive in
				// astro.config.mjs. Track 5 phases per Doc/curriculum/mental-model-
				// phases.md; Track 6 phases per Doc/curriculum/track-6/mental-model-
				// phases.md (6 phases: orientation → data-flow → threat-models →
				// vendor-policies → local-first → rights-hygiene).
				phase: z
					.enum([
						// Track 5 (AI Foundations)
						'read-text',
						'architecture',
						'training',
						'tuning',
						'inference',
						'reasoning-and-agents',
						'evaluation-and-frontier',
						// Track 6 (Privacy & Local-First AI)
						'orientation',
						'data-flow',
						'threat-models',
						'vendor-policies',
						'local-first',
						'rights-hygiene',
						// Track 12 (Intro to Deep Learning)
						'foundations-and-sequences',
						'vision-and-generation',
						'decisions-and-limits',
						// Track 13 (Build Neural Networks from Scratch)
						'the-autograd-engine',
						'building-a-language-model',
						'building-a-transformer',
						// Track 20 (AI Agents and Tool Use)
						'what-agents-are',
						'agent-design-patterns',
						'production-agents',
						// Track 11 (Neural Network Intuition)
						'network-structure',
						'how-networks-learn',
						'backpropagation',
						// Track 14 (Practical Transformers — Hugging Face LLM Course)
						'transformers-library',
						'data-tokenizers-tasks',
						'demos-and-frontier',
					])
					.optional(),
				phase_order: z.number().int().positive().optional(),

				// Track 6 (Privacy & Local-First AI) stale-claim review cadence
				// in months, per Doc/curriculum/track-6/philosophy.md governance
				// addendum 2. Vendor-policy-citing lessons: 3 (quarterly). Mixed
				// vendor + framework lessons: 6 (semi-annual). Regulatory and
				// foundational primer lessons: 12 (annual). The build-time
				// staleness gate (scripts/check-track6-citations.ts, planned)
				// reads last_reviewed + review_cadence_months and flags lessons
				// past the window.
				review_cadence_months: z.number().int().positive().optional(),

				// Reader orientation
				difficulty: z.enum(['intro', 'standard', 'deep']).optional(),
				estimated_read_minutes: z.number().int().positive().optional(),
				estimated_practice_minutes: z.number().int().nonnegative().optional(),
				prerequisites: z.array(z.string()).optional(),
				learning_outcomes: z.array(z.string()).optional(),

				// Authorship + lifecycle
				authors: z.array(z.string()).optional(),
				published_at: z.coerce.date().optional(),
				last_reviewed: z.coerce.date().optional(),
				status: z.enum(['draft', 'published', 'needs-review']).optional(),

				// License
				license: z
					.object({
						text: z.string().default('CC-BY-SA-4.0'),
						code: z.string().default('MIT'),
					})
					.optional(),

				// Source attribution — required if derived from external material
				source_material: z
					.object({
						type: z.enum([
							'youtube',
							'reddit-cluster',
							'clawless-kb',
							'reddit-thread',
							'original',
							'web-course',
						]),
						primary_url: z.string().url().optional(),
						attribution_block: z
							.literal('see references.mdx')
							.default('see references.mdx'),
					})
					.optional(),

				// Artifact type — lets the validator know which rules apply
				artifact: z
					.enum(['brief', 'lesson', 'summary', 'practice', 'cheatsheet', 'references'])
					.optional(),
			}),
		}),
	}),
};

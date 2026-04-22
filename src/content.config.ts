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
					])
					.optional(),
				course: z.string().optional(),
				order: z.number().int().optional(),

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

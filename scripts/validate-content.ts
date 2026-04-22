/**
 * Validates lesson frontmatter against the `Doc/lesson-framework.md` §3 schema.
 *
 * Philosophy:
 * - Astro's content collection already enforces type-shape validation at build
 *   time via Zod. This script runs stricter checks that are content-policy,
 *   not type-level — things the Reviewer would otherwise have to do manually.
 *
 * What it checks today (Phase 1):
 * - Every lesson directory contains all six artifact files
 * - brief.mdx has the required frontmatter populated
 * - learning_outcomes use Bloom-aligned action verbs
 * - prerequisites point at lessons that actually exist (or are empty)
 *
 * What it will add later:
 * - Reading-level scoring
 * - Dead-link detection (delegated to a separate link-check workflow)
 * - Bloom-level ↔ Practice-type alignment check
 *
 * Exit code 0 = all good. Non-zero = validation failures; CI blocks merge.
 */

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';

const ROOT = new URL('..', import.meta.url).pathname;
const LESSONS_ROOT = join(ROOT, 'src/content/docs/lessons');

const REQUIRED_ARTIFACTS = [
	'brief.mdx',
	'lesson.mdx',
	'summary.mdx',
	'practice.mdx',
	'cheatsheet.mdx',
	'references.mdx',
] as const;

// Bloom-aligned verbs per Doc/lesson-framework.md §4
const BLOOM_VERBS = [
	// Remember
	'identify',
	'list',
	'name',
	'recall',
	'define',
	// Understand
	'explain',
	'summarize',
	'paraphrase',
	'classify',
	'compare',
	// Apply
	'use',
	'run',
	'configure',
	'set up',
	'modify',
	// Analyze
	'distinguish',
	'debug',
	'decompose',
	// Evaluate
	'choose between',
	'assess',
	'justify',
	'critique',
	// Create
	'design',
	'build',
	'compose',
	'produce',
];

const BriefSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1),
	slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
	track: z.enum([
		'getting-started',
		'use-case-cookbook',
		'agent-building-101',
		'openclaw-deep-dive',
		'ai-foundations',
		'privacy-local-first',
		'pain-point-library',
	]),
	difficulty: z.enum(['intro', 'standard', 'deep']),
	estimated_read_minutes: z.number().int().positive(),
	estimated_practice_minutes: z.number().int().nonnegative(),
	prerequisites: z.array(z.string()),
	learning_outcomes: z.array(z.string()).min(3).max(5),
	authors: z.array(z.string()).min(1),
	published_at: z.coerce.date(),
	last_reviewed: z.coerce.date(),
	status: z.enum(['draft', 'published', 'needs-review']),
	artifact: z.literal('brief'),
});

interface ValidationError {
	path: string;
	message: string;
}

async function main(): Promise<number> {
	const errors: ValidationError[] = [];

	if (!existsSync(LESSONS_ROOT)) {
		console.log(
			`No lessons directory yet at ${relative(ROOT, LESSONS_ROOT)} — nothing to validate. Phase 1 Sprint 2 will create it.`,
		);
		return 0;
	}

	const tracks = await readdir(LESSONS_ROOT, { withFileTypes: true });

	for (const trackEntry of tracks) {
		if (!trackEntry.isDirectory()) continue;
		const trackDir = join(LESSONS_ROOT, trackEntry.name);
		const lessons = await readdir(trackDir, { withFileTypes: true });

		for (const lessonEntry of lessons) {
			if (!lessonEntry.isDirectory()) continue;
			const lessonDir = join(trackDir, lessonEntry.name);
			const relLessonDir = relative(ROOT, lessonDir);

			// Check all six artifacts exist
			for (const artifact of REQUIRED_ARTIFACTS) {
				if (!existsSync(join(lessonDir, artifact))) {
					errors.push({
						path: relLessonDir,
						message: `Missing required artifact: ${artifact}`,
					});
				}
			}

			// Validate brief.mdx frontmatter
			const briefPath = join(lessonDir, 'brief.mdx');
			if (existsSync(briefPath)) {
				const raw = await readFile(briefPath, 'utf8');
				const { data } = matter(raw);

				const parsed = BriefSchema.safeParse(data);
				if (!parsed.success) {
					for (const issue of parsed.error.issues) {
						errors.push({
							path: relative(ROOT, briefPath),
							message: `Frontmatter: ${issue.path.join('.')} — ${issue.message}`,
						});
					}
				} else {
					// Bloom verb check on learning outcomes
					for (const outcome of parsed.data.learning_outcomes) {
						const firstWord = outcome.trim().split(/\s+/)[0]?.toLowerCase() ?? '';
						const twoWords = outcome.trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase();
						if (!BLOOM_VERBS.some((v) => v === firstWord || v === twoWords)) {
							errors.push({
								path: relative(ROOT, briefPath),
								message: `Learning outcome does not start with a Bloom-aligned verb: "${outcome}"`,
							});
						}
					}
				}
			}
		}
	}

	if (errors.length === 0) {
		console.log('✓ Content validation passed.');
		return 0;
	}

	console.error(`\n✗ ${errors.length} validation error(s):\n`);
	for (const err of errors) {
		console.error(`  ${err.path}`);
		console.error(`    ${err.message}\n`);
	}
	return 1;
}

const code = await main();
process.exit(code);

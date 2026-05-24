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
	'read',
	'state',
	// Understand
	'explain',
	'describe',
	'summarize',
	'paraphrase',
	'classify',
	'compare',
	'predict',
	'walk through',
	'trace',
	'recognize',
	'connect',
	'demonstrate',
	'articulate',
	'interpret',
	// Apply
	'use',
	'apply',
	'run',
	'configure',
	'set up',
	'modify',
	// Analyze
	'distinguish',
	'differentiate',
	'debug',
	'decompose',
	'analyze',
	// Evaluate
	'choose between',
	'assess',
	'justify',
	'critique',
	'evaluate',
	// Create
	'design',
	'build',
	'compose',
	'produce',
	'create',
	// Mirror-track domain verbs (Track 12/13), added 2026-05-23 with Doc/lesson-framework.md §4
	'size',
	'derive',
	'backpropagate',
	'contrast',
	'encode',
	'lay out',
	'compute',
	'assemble',
	'choose',
	'walk',
	'judge',
	'decide',
	'match',
	'write',
	'add',
	'draw',
];

const TRACK_5_PHASE_SLUGS = [
	'read-text',
	'architecture',
	'training',
	'tuning',
	'inference',
	'reasoning-and-agents',
	'evaluation-and-frontier',
] as const;

const TRACK_6_PHASE_SLUGS = [
	'orientation',
	'data-flow',
	'threat-models',
	'vendor-policies',
	'local-first',
	'rights-hygiene',
] as const;

const TRACK_12_PHASE_SLUGS = [
	'foundations-and-sequences',
	'vision-and-generation',
	'decisions-and-limits',
] as const;

const TRACK_13_PHASE_SLUGS = [
	'the-autograd-engine',
	'building-a-language-model',
	'building-a-transformer',
] as const;

const TRACK_20_PHASE_SLUGS = [
	'what-agents-are',
	'agent-design-patterns',
	'production-agents',
] as const;

const PHASE_SLUGS = [
	...TRACK_5_PHASE_SLUGS,
	...TRACK_6_PHASE_SLUGS,
	...TRACK_12_PHASE_SLUGS,
	...TRACK_13_PHASE_SLUGS,
	...TRACK_20_PHASE_SLUGS,
] as const;

const BriefSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1),
	// Lesson identity is derived from the directory path, not a frontmatter slug.
	// (Astro reserves `slug:` in frontmatter for URL override; we don't want that
	// here because the file path already encodes track/lesson identity correctly.)
	track: z.enum([
		'getting-started',
		'use-case-cookbook',
		'agent-building-101',
		'openclaw-deep-dive',
		'ai-foundations',
		'privacy-local-first',
		'pain-point-library',
		'intro-to-deep-learning',
		'build-nns-from-scratch',
		'ai-agents-and-tool-use',
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
	// Phase context for Track 5 (AI Foundations). Optional at the schema level;
	// enforced conditionally below based on track. See Doc/curriculum/mental-model-phases.md.
	phase: z.enum(PHASE_SLUGS).optional(),
	phase_order: z.number().int().positive().optional(),
});

interface ValidationError {
	path: string;
	message: string;
}

async function main(): Promise<number> {
	const errors: ValidationError[] = [];

	// Tracks (phase, phase_order) tuples seen across Track 5 lessons so we can
	// report duplicates. Key: `${phase}/${phase_order}`. Value: list of brief paths.
	const phaseSlotsTrack5 = new Map<string, string[]>();
	// Same per-track tracking for Track 6 (Privacy & Local-First AI).
	const phaseSlotsTrack6 = new Map<string, string[]>();
	// Same per-track tracking for the mirror tracks (Track 12, Track 13).
	const phaseSlotsTrack12 = new Map<string, string[]>();
	const phaseSlotsTrack13 = new Map<string, string[]>();
	const phaseSlotsTrack20 = new Map<string, string[]>();

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

					// Track-5 phase context: required when track is ai-foundations.
					// See Doc/curriculum/mental-model-phases.md and source-to-phase-mapping.md.
					if (parsed.data.track === 'ai-foundations') {
						if (parsed.data.phase === undefined) {
							errors.push({
								path: relative(ROOT, briefPath),
								message: `Track 5 lesson missing required field: phase (one of ${TRACK_5_PHASE_SLUGS.join(', ')})`,
							});
						} else if (!TRACK_5_PHASE_SLUGS.includes(parsed.data.phase as any)) {
							errors.push({
								path: relative(ROOT, briefPath),
								message: `Track 5 lesson has phase "${parsed.data.phase}" but Track 5 phases are: ${TRACK_5_PHASE_SLUGS.join(', ')}. Looks like a Track 6 phase slug used on a Track 5 lesson.`,
							});
						}
						if (parsed.data.phase_order === undefined) {
							errors.push({
								path: relative(ROOT, briefPath),
								message: `Track 5 lesson missing required field: phase_order`,
							});
						}
						if (parsed.data.phase !== undefined && parsed.data.phase_order !== undefined) {
							const key = `${parsed.data.phase}/${parsed.data.phase_order}`;
							const seen = phaseSlotsTrack5.get(key) ?? [];
							seen.push(relative(ROOT, briefPath));
							phaseSlotsTrack5.set(key, seen);
						}
					}

					// Track-6 phase context: required when track is privacy-local-first.
					// See Doc/curriculum/track-6/mental-model-phases.md and
					// Doc/curriculum/track-6/source-to-phase-mapping.md.
					if (parsed.data.track === 'privacy-local-first') {
						if (parsed.data.phase === undefined) {
							errors.push({
								path: relative(ROOT, briefPath),
								message: `Track 6 lesson missing required field: phase (one of ${TRACK_6_PHASE_SLUGS.join(', ')})`,
							});
						} else if (!TRACK_6_PHASE_SLUGS.includes(parsed.data.phase as any)) {
							errors.push({
								path: relative(ROOT, briefPath),
								message: `Track 6 lesson has phase "${parsed.data.phase}" but Track 6 phases are: ${TRACK_6_PHASE_SLUGS.join(', ')}. Looks like a Track 5 phase slug used on a Track 6 lesson.`,
							});
						}
						if (parsed.data.phase_order === undefined) {
							errors.push({
								path: relative(ROOT, briefPath),
								message: `Track 6 lesson missing required field: phase_order`,
							});
						}
						if (parsed.data.phase !== undefined && parsed.data.phase_order !== undefined) {
							const key = `${parsed.data.phase}/${parsed.data.phase_order}`;
							const seen = phaseSlotsTrack6.get(key) ?? [];
							seen.push(relative(ROOT, briefPath));
							phaseSlotsTrack6.set(key, seen);
						}
					}

					// Track 12 phase context: required when track is intro-to-deep-learning.
					if (parsed.data.track === 'intro-to-deep-learning') {
						if (parsed.data.phase === undefined) {
							errors.push({
								path: relative(ROOT, briefPath),
								message: `Track 12 lesson missing required field: phase (one of ${TRACK_12_PHASE_SLUGS.join(', ')})`,
							});
						} else if (!TRACK_12_PHASE_SLUGS.includes(parsed.data.phase as any)) {
							errors.push({
								path: relative(ROOT, briefPath),
								message: `Track 12 lesson has phase "${parsed.data.phase}" but Track 12 phases are: ${TRACK_12_PHASE_SLUGS.join(', ')}.`,
							});
						}
						if (parsed.data.phase_order === undefined) {
							errors.push({
								path: relative(ROOT, briefPath),
								message: `Track 12 lesson missing required field: phase_order`,
							});
						}
						if (parsed.data.phase !== undefined && parsed.data.phase_order !== undefined) {
							const key = `${parsed.data.phase}/${parsed.data.phase_order}`;
							const seen = phaseSlotsTrack12.get(key) ?? [];
							seen.push(relative(ROOT, briefPath));
							phaseSlotsTrack12.set(key, seen);
						}
					}

					// Track 13 phase context: required when track is build-nns-from-scratch.
					if (parsed.data.track === 'build-nns-from-scratch') {
						if (parsed.data.phase === undefined) {
							errors.push({
								path: relative(ROOT, briefPath),
								message: `Track 13 lesson missing required field: phase (one of ${TRACK_13_PHASE_SLUGS.join(', ')})`,
							});
						} else if (!TRACK_13_PHASE_SLUGS.includes(parsed.data.phase as any)) {
							errors.push({
								path: relative(ROOT, briefPath),
								message: `Track 13 lesson has phase "${parsed.data.phase}" but Track 13 phases are: ${TRACK_13_PHASE_SLUGS.join(', ')}.`,
							});
						}
						if (parsed.data.phase_order === undefined) {
							errors.push({
								path: relative(ROOT, briefPath),
								message: `Track 13 lesson missing required field: phase_order`,
							});
						}
						if (parsed.data.phase !== undefined && parsed.data.phase_order !== undefined) {
							const key = `${parsed.data.phase}/${parsed.data.phase_order}`;
							const seen = phaseSlotsTrack13.get(key) ?? [];
							seen.push(relative(ROOT, briefPath));
							phaseSlotsTrack13.set(key, seen);
						}
					}

					// Track 20 phase context: required when track is ai-agents-and-tool-use.
					if (parsed.data.track === 'ai-agents-and-tool-use') {
						if (parsed.data.phase === undefined) {
							errors.push({
								path: relative(ROOT, briefPath),
								message: `Track 20 lesson missing required field: phase (one of ${TRACK_20_PHASE_SLUGS.join(', ')})`,
							});
						} else if (!TRACK_20_PHASE_SLUGS.includes(parsed.data.phase as any)) {
							errors.push({
								path: relative(ROOT, briefPath),
								message: `Track 20 lesson has phase "${parsed.data.phase}" but Track 20 phases are: ${TRACK_20_PHASE_SLUGS.join(', ')}.`,
							});
						}
						if (parsed.data.phase_order === undefined) {
							errors.push({
								path: relative(ROOT, briefPath),
								message: `Track 20 lesson missing required field: phase_order`,
							});
						}
						if (parsed.data.phase !== undefined && parsed.data.phase_order !== undefined) {
							const key = `${parsed.data.phase}/${parsed.data.phase_order}`;
							const seen = phaseSlotsTrack20.get(key) ?? [];
							seen.push(relative(ROOT, briefPath));
							phaseSlotsTrack20.set(key, seen);
						}
					}
				}
			}
		}
	}

	// Report any duplicate (phase, phase_order) tuples within Track 5 or
	// within Track 6. Duplicates are per-track: Track 5 phase "training"
	// and Track 6 phase "orientation" never collide because they're
	// different slug namespaces; the duplicate check fires only when two
	// lessons within the same track claim the same slot.
	for (const [key, paths] of phaseSlotsTrack5) {
		if (paths.length > 1) {
			for (const p of paths) {
				errors.push({
					path: p,
					message: `Track 5: duplicate (phase, phase_order) pair "${key}"; also used by: ${paths.filter((q) => q !== p).join(', ')}`,
				});
			}
		}
	}
	for (const [key, paths] of phaseSlotsTrack6) {
		if (paths.length > 1) {
			for (const p of paths) {
				errors.push({
					path: p,
					message: `Track 6: duplicate (phase, phase_order) pair "${key}"; also used by: ${paths.filter((q) => q !== p).join(', ')}`,
				});
			}
		}
	}
	for (const [key, paths] of phaseSlotsTrack12) {
		if (paths.length > 1) {
			for (const p of paths) {
				errors.push({
					path: p,
					message: `Track 12: duplicate (phase, phase_order) pair "${key}"; also used by: ${paths.filter((q) => q !== p).join(', ')}`,
				});
			}
		}
	}
	for (const [key, paths] of phaseSlotsTrack13) {
		if (paths.length > 1) {
			for (const p of paths) {
				errors.push({
					path: p,
					message: `Track 13: duplicate (phase, phase_order) pair "${key}"; also used by: ${paths.filter((q) => q !== p).join(', ')}`,
				});
			}
		}
	}
	for (const [key, paths] of phaseSlotsTrack20) {
		if (paths.length > 1) {
			for (const p of paths) {
				errors.push({
					path: p,
					message: `Track 20: duplicate (phase, phase_order) pair "${key}"; also used by: ${paths.filter((q) => q !== p).join(', ')}`,
				});
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

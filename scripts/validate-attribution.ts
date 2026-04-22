/**
 * Enforces the attribution-block rule from Doc/attribution-policy.md and
 * Doc/lesson-framework.md §2.6.
 *
 * Rule: if a lesson's brief.mdx has `source_material.type` set to anything
 * other than `original`, the corresponding `references.mdx` MUST include an
 * attribution block. CI blocks merge if it doesn't.
 *
 * The attribution block is detected by the presence of the literal string
 * "Source material:" followed by at least one line describing the source.
 *
 * This is deliberately permissive on format and strict on presence — we care
 * that the block *exists*, not that it matches a rigid template.
 */

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import matter from 'gray-matter';

const ROOT = new URL('..', import.meta.url).pathname;
const LESSONS_ROOT = join(ROOT, 'src/content/docs/lessons');

const ATTRIBUTION_MARKER = /source\s+material\s*:/i;

interface Finding {
	path: string;
	message: string;
}

async function main(): Promise<number> {
	const findings: Finding[] = [];

	if (!existsSync(LESSONS_ROOT)) {
		console.log(
			`No lessons directory yet — nothing to check. Phase 1 Sprint 2 will create ${relative(ROOT, LESSONS_ROOT)}.`,
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
			const briefPath = join(lessonDir, 'brief.mdx');
			const referencesPath = join(lessonDir, 'references.mdx');

			if (!existsSync(briefPath)) continue;

			const briefRaw = await readFile(briefPath, 'utf8');
			const { data: briefData } = matter(briefRaw);
			const sourceType: string | undefined = briefData?.source_material?.type;

			if (!sourceType || sourceType === 'original') continue;

			if (!existsSync(referencesPath)) {
				findings.push({
					path: relative(ROOT, lessonDir),
					message: `source_material.type="${sourceType}" but references.mdx is missing.`,
				});
				continue;
			}

			const referencesRaw = await readFile(referencesPath, 'utf8');
			if (!ATTRIBUTION_MARKER.test(referencesRaw)) {
				findings.push({
					path: relative(ROOT, referencesPath),
					message: `source_material.type="${sourceType}" but no attribution block found (looked for "Source material:" marker).`,
				});
			}
		}
	}

	if (findings.length === 0) {
		console.log('✓ Attribution-block enforcement passed.');
		return 0;
	}

	console.error(`\n✗ ${findings.length} attribution issue(s):\n`);
	for (const f of findings) {
		console.error(`  ${f.path}`);
		console.error(`    ${f.message}\n`);
	}
	return 1;
}

const code = await main();
process.exit(code);

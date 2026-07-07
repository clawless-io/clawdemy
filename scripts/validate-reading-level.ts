/**
 * Reading-level gate. Per Doc/lesson-framework.md §8.1 ("Pro-grade quality bar"):
 *
 *   Khan-warmth tracks (1 getting-started, 2 use-case-cookbook,
 *     3 agent-building-101, 6 privacy-local-first, 7 pain-point-library)
 *     must score Flesch Reading Ease >= 60
 *
 *   Stripe-precision tracks (4 openclaw-deep-dive, 5 ai-foundations)
 *     must score Flesch Reading Ease >= 40
 *
 * Higher Flesch Reading Ease = easier to read. The script scores the prose
 * body of each lesson.mdx (frontmatter, code blocks, MDX components, and
 * inline markdown machinery stripped first) and exits non-zero if any
 * lesson lands below its track's threshold.
 *
 * Why only lesson.mdx: the other artifacts are deliberately denser by design
 * (cheatsheet is table-heavy, references is annotated link list, practice is
 * Q&A). The Reading Ease formula penalizes those structures unfairly. The
 * lesson body is where Khan-warmth or Stripe-precision actually has to land.
 *
 * Exit code 0 = all good. Non-zero = at least one lesson under threshold;
 * CI blocks the merge.
 */

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import rs from 'text-readability';

const ROOT = new URL('..', import.meta.url).pathname;
const LESSONS_ROOT = join(ROOT, 'src/content/docs/lessons');

// Track slug → minimum acceptable Flesch Reading Ease.
// Numbers map to Doc/lesson-framework.md §8.1 reading-level rules.
const THRESHOLDS: Record<string, number> = {
	'getting-started': 60,
	'use-case-cookbook': 60,
	'agent-building-101': 60,
	'privacy-local-first': 60,
	'pain-point-library': 60,
	'openclaw-deep-dive': 40,
	'ai-foundations': 40,
	'git-workflow': 40,
	'engineering-agentic-systems': 40,
};

interface ScoreRow {
	path: string;
	track: string;
	threshold: number;
	score: number;
	pass: boolean;
}

/**
 * Strips MDX scaffolding so the readability formula sees only prose.
 *
 * Removes (in order):
 *   - YAML frontmatter
 *   - Fenced code blocks (``` ... ```)
 *   - Import statements
 *   - JSX/Astro component tags (both self-closing and paired)
 *   - HTML tags
 *   - Markdown link/image syntax (keep link text, drop URL)
 *   - Inline code (`...`)
 *   - Markdown emphasis markers (* _ ` #)
 *
 * The pipeline is conservative: it errs on the side of removing too much
 * rather than passing through machinery that would skew the score.
 */
function extractProse(raw: string): string {
	let text = raw;
	// 1. Frontmatter
	text = text.replace(/^---[\s\S]*?\n---\n/, '');
	// 2. Fenced code blocks
	text = text.replace(/```[\s\S]*?```/g, '');
	// 3. Import statements
	text = text.replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '');
	// 4. JSX/Astro paired tags <Comp>...</Comp>
	text = text.replace(/<([A-Z][A-Za-z0-9]*)\b[^>]*>[\s\S]*?<\/\1>/g, '');
	// 5. JSX/Astro self-closing tags <Comp ... />
	text = text.replace(/<[A-Z][A-Za-z0-9]*\b[^>]*\/>/g, '');
	// 6. Remaining HTML tags (paired)
	text = text.replace(/<([a-z][a-zA-Z0-9]*)\b[^>]*>([\s\S]*?)<\/\1>/g, '$2');
	// 7. Self-closing HTML tags
	text = text.replace(/<[^>]+\/>/g, '');
	// 8. Markdown image syntax ![alt](url) -> drop entirely (alt text is metadata)
	text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '');
	// 9. Markdown link [text](url) -> keep text only
	text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
	// 10. Inline code
	text = text.replace(/`[^`]*`/g, '');
	// 11. Markdown emphasis + heading markers
	text = text.replace(/[*_]{1,3}/g, '').replace(/^#+\s*/gm, '');
	// 12. Pipe-table residue
	text = text.replace(/\|/g, ' ');
	// 13. Collapse whitespace
	text = text.replace(/\s+/g, ' ').trim();
	return text;
}

async function main(): Promise<number> {
	const rows: ScoreRow[] = [];

	if (!existsSync(LESSONS_ROOT)) {
		console.log('No lessons directory yet. Nothing to score.');
		return 0;
	}

	const tracks = await readdir(LESSONS_ROOT, { withFileTypes: true });

	for (const trackEntry of tracks) {
		if (!trackEntry.isDirectory()) continue;
		const trackSlug = trackEntry.name;
		const threshold = THRESHOLDS[trackSlug];
		if (threshold === undefined) {
			console.warn(
				`! Unknown track "${trackSlug}" (no threshold mapping). Skipping. Add to THRESHOLDS in scripts/validate-reading-level.ts if this is a real track.`,
			);
			continue;
		}

		const trackDir = join(LESSONS_ROOT, trackSlug);
		const lessons = await readdir(trackDir, { withFileTypes: true });

		for (const lessonEntry of lessons) {
			if (!lessonEntry.isDirectory()) continue;
			const lessonPath = join(trackDir, lessonEntry.name, 'lesson.mdx');
			if (!existsSync(lessonPath)) continue;

			const raw = await readFile(lessonPath, 'utf8');
			const prose = extractProse(raw);

			// Need at least one full sentence for the formula to behave.
			if (prose.length < 200) {
				console.warn(`! ${relative(ROOT, lessonPath)}: stripped prose < 200 chars; skipping.`);
				continue;
			}

			const score = rs.fleschReadingEase(prose);
			rows.push({
				path: relative(ROOT, lessonPath),
				track: trackSlug,
				threshold,
				score: Math.round(score * 10) / 10,
				pass: score >= threshold,
			});
		}
	}

	rows.sort((a, b) => a.score - b.score);

	const failed = rows.filter((r) => !r.pass);

	console.log('\nFlesch Reading Ease scores (higher = easier):\n');
	for (const r of rows) {
		const mark = r.pass ? '✓' : '✗';
		console.log(`  ${mark} ${r.score.toString().padStart(5)} (≥${r.threshold})  ${r.path}`);
	}

	if (failed.length === 0) {
		console.log(`\n✓ All ${rows.length} lesson(s) at or above their track's reading-level threshold.`);
		return 0;
	}

	console.error(
		`\n✗ ${failed.length} of ${rows.length} lesson(s) below their track's reading-level threshold.`,
	);
	console.error(
		'  Lower the average word length, shorten sentences, or break up paragraphs.',
	);
	console.error(
		'  See Doc/lesson-framework.md §8.1 (Khan-warmth tracks ≥60, Stripe-precision tracks ≥40).',
	);
	return 1;
}

const code = await main();
process.exit(code);

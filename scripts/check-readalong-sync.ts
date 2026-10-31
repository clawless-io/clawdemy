/**
 * Build-failing check: every shipped read-along timing file must describe the
 * lesson prose that is in the repo right now.
 *
 * WHY THIS EXISTS. On 2026-10-31 three lessons were re-rendered with --force.
 * The render regenerated public/read-along/*.timing.json, but that JSON was
 * never committed. R2 audio publishes to production the moment it uploads and
 * is decoupled from git, so production served the NEW audio against the OLD
 * timings: agent-skills-and-claude-code had 2336 timing entries for 2420
 * spoken words. The ReadAlongDim walker indexes into words[N], so a count
 * mismatch desyncs the highlight progressively through the lesson instead of
 * failing loudly. Nothing in the pipeline noticed, and nothing would have.
 *
 * WHAT IT COMPARES. The renderer records the exact prose it narrated in
 * `stats.prose_chars` and `stats.prose_words`, computed from mdxToProse and a
 * whitespace split. This check recomputes both from the lesson.mdx on disk,
 * with the same function the renderer uses, and fails on any disagreement.
 * A stale timing file therefore cannot reach main: either the text changed and
 * the lesson needs a re-render, or a render happened and its JSON was not
 * committed. Both are the same defect from the reader's side.
 *
 * TWO TIERS, AND WHY. A WORD-count mismatch is a defect: the walker maps DOM
 * word N to words[N], so a different count desyncs the highlight progressively
 * through the lesson. That exits 1. A CHAR-count mismatch with an identical
 * word count does not move a single highlight index; measured 2026-10-31, 181
 * of 285 lessons drift by 1 to 30 chars with word counts intact, which is the
 * prose extractor having been refined since those renders. That reports and
 * exits 0, so the real signal is not buried under it.
 *
 * NOT IN validate:all YET, AND HERE IS THE PROMOTION CONDITION. On the day
 * this was written 9 lessons already had word-level desync, so wiring it into
 * the build would have shipped a red gate. Same path validate:freshness and
 * validate:narration took: report-only until the queue clears.
 *
 * THE PR THAT CLOSES THE LAST MISMATCH ALSO WIRES THIS INTO validate:all AND
 * INTO .github/workflows/ci.yml. Not a separate follow-up, not "later". That
 * is whichever change makes `bun run validate:readalong-sync` exit 0, whether
 * that is re-rendering the nine or restoring the stripped markup to the
 * narration. If you are reading this and the command exits 0, promoting it is
 * part of your change.
 *
 * WHY THOSE 9 WERE OUT OF SYNC, measured 2026-10-31. Not what it looks like.
 * The lesson bodies were NOT shortened: running today's mdxToProse over each
 * lesson.mdx AS IT STOOD AT ITS RENDER COMMIT gives the same lower word count
 * it gives today (how-rag-works: 3601 then, 3601 now, 3814 recorded in the
 * timing file). The extractor changed, not the text. Diffing each stale
 * timing file against its current prose names the cause exactly:
 *   8 of 9   the audio reads a markdown TABLE out loud, pipes and all
 *            ("pipe Stage pipe Symptom pipe Common cause pipe pipe dash...")
 *   1 of 9   the audio reads Starlight directive syntax out loud
 *            (":::note[A gotcha worth banking now]", ":::warning[...]")
 * mdxToProse's strip-set was extended to match the ReadAlongDim walker's skip
 * set, which is correct, and the lessons rendered before each extension were
 * never re-rendered. So this is the same defect family as the 24-lesson
 * internal-notes leak that check-narration-integrity.ts exists for: narration
 * speaking markup aloud to a learner. It is not cosmetic drift.
 *
 * WHAT IT DOES NOT CATCH. It cannot see what R2 is actually serving, because
 * R2 is outside git. It catches the git half, which is the half we control at
 * review time. Run `audio:generate --dry-run <slug>` for the R2 half.
 */

import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { mdxToProse } from './generate-audio';

const LESSONS_ROOT = 'src/content/docs/lessons';
const TIMING_DIR = 'public/read-along';

interface Problem {
	slug: string;
	kind: 'orphan-timing' | 'chars' | 'words' | 'matched' | 'malformed';
	detail: string;
}

/** slug -> lesson.mdx path, for every lesson in the catalog. */
async function lessonIndex(): Promise<Map<string, string>> {
	const index = new Map<string, string>();
	for (const track of await readdir(LESSONS_ROOT, { withFileTypes: true })) {
		if (!track.isDirectory()) continue;
		const trackPath = join(LESSONS_ROOT, track.name);
		for (const slug of await readdir(trackPath, { withFileTypes: true })) {
			if (!slug.isDirectory()) continue;
			const mdxPath = join(trackPath, slug.name, 'lesson.mdx');
			if (existsSync(mdxPath)) index.set(slug.name, mdxPath);
		}
	}
	return index;
}

function wordCount(prose: string): number {
	return prose.split(/\s+/).filter(Boolean).length;
}

async function main(): Promise<void> {
	const index = await lessonIndex();
	const timingFiles = (await readdir(TIMING_DIR)).filter((f) => f.endsWith('.timing.json'));

	const problems: Problem[] = [];
	let checked = 0;

	for (const file of timingFiles.sort()) {
		const slug = file.replace(/\.timing\.json$/, '');
		const mdxPath = index.get(slug);

		if (!mdxPath) {
			problems.push({
				slug,
				kind: 'orphan-timing',
				detail: `no ${LESSONS_ROOT}/<track>/${slug}/lesson.mdx exists for this timing file`,
			});
			continue;
		}

		let timing: {
			stats?: { prose_chars?: number; prose_words?: number; matched_words?: number };
			words?: unknown[];
		};
		try {
			timing = JSON.parse(await readFile(join(TIMING_DIR, file), 'utf8'));
		} catch (err) {
			problems.push({ slug, kind: 'malformed', detail: `unparseable JSON: ${String(err)}` });
			continue;
		}

		const stats = timing.stats;
		if (!stats || typeof stats.prose_chars !== 'number' || typeof stats.prose_words !== 'number') {
			// schema_version 1 files predate the stats block. They cannot be
			// verified, so say so rather than passing them silently.
			problems.push({
				slug,
				kind: 'malformed',
				detail: 'timing file has no stats.prose_chars / stats.prose_words to check against',
			});
			continue;
		}

		const prose = mdxToProse(await readFile(mdxPath, 'utf8'));
		const chars = prose.length;
		const words = wordCount(prose);
		checked++;

		if (chars !== stats.prose_chars) {
			problems.push({
				slug,
				kind: 'chars',
				detail: `lesson.mdx narrates ${chars} chars, timing file was built from ${stats.prose_chars}`,
			});
		}
		if (words !== stats.prose_words) {
			problems.push({
				slug,
				kind: 'words',
				detail: `lesson.mdx narrates ${words} words, timing file was built from ${stats.prose_words}`,
			});
		}
		if (
			typeof stats.matched_words === 'number' &&
			Array.isArray(timing.words) &&
			timing.words.length !== stats.matched_words
		) {
			problems.push({
				slug,
				kind: 'matched',
				detail: `words[] holds ${timing.words.length} entries but stats.matched_words says ${stats.matched_words}`,
			});
		}
	}

	const wordProblems = problems.filter((p) => p.kind === 'words');
	const hardProblems = problems.filter((p) => p.kind !== 'chars');
	const charOnly = new Set(
		problems.filter((p) => p.kind === 'chars').map((p) => p.slug),
	);
	for (const p of problems) if (p.kind !== 'chars') charOnly.delete(p.slug);

	console.log(`Read-along sync  (${timingFiles.length} timing file(s), ${checked} verifiable)\n`);

	if (hardProblems.length === 0 && charOnly.size === 0) {
		console.log('CLEAN: every timing file matches the lesson prose in the repo.');
		return;
	}

	if (hardProblems.length > 0) {
		const bySlug = new Map<string, Problem[]>();
		for (const p of hardProblems) {
			const list = bySlug.get(p.slug) ?? [];
			list.push(p);
			bySlug.set(p.slug, list);
		}
		console.error(`DESYNC: ${bySlug.size} lesson(s) ship audio that does not match the page.\n`);
		for (const [slug, list] of [...bySlug].sort()) {
			console.error(`  ${slug}`);
			for (const p of list) console.error(`    ${p.kind}: ${p.detail}`);
		}
		console.error(
			'\nA word-count mismatch means one of two things, and both ship a broken\n' +
				'read-along highlight:\n' +
				'  1. The narrated prose changed and the audio was never re-rendered,\n' +
				'     either because the body was edited or because mdxToProse learned\n' +
				'     to strip something it used to narrate. Either way the audio now\n' +
				'     speaks text the reader cannot see.\n' +
				'     Fix: bun run audio:generate --force <slug>, bump cacheVersion,\n' +
				'     commit the regenerated timing JSON. This costs credits.\n' +
				'  2. A render happened and its timing JSON was not committed. R2 already\n' +
				'     serves the new audio, so production is desynced right now.\n' +
				'     Fix: commit public/read-along/<slug>.timing.json. This is free.\n',
		);
		process.exitCode = 1;
	}

	if (charOnly.size > 0) {
		console.log(
			`\nNOTE: ${charOnly.size} lesson(s) differ only in character count, with word\n` +
				'counts intact. The walker indexes words, so no highlight moves. This is\n' +
				'the prose extractor having been refined since those renders, and it is\n' +
				'not worth a paid re-render on its own. Not a failure.',
		);
	}
}

await main();

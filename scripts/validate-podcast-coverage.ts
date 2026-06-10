/**
 * Podcast-coverage guard.
 *
 * Root cause it prevents (founder, 2026-06-10): the podcast feeds
 * (/podcast/feed.xml + /podcast/foundations/feed.xml) only include a lesson
 * whose brief is `status: published`. When new tracks shipped, nobody was
 * thinking about the podcast, so dozens of live, narrated lessons sat
 * status:draft and were silently missing from the feeds (the "212 vs 300" gap).
 *
 * This check fails CI when a lesson is demonstrably podcast-ready — its audio
 * exists on R2 (the same HEAD probe the feed uses) — but its brief is NOT
 * `published`, so the feed would skip it. In other words: "you shipped a
 * narrated lesson but forgot to let it into the podcast."
 *
 * Intentionally NOT flagged:
 *   - briefs with no audio yet (not podcast-ready; e.g. a track mid-build)
 *   - status: needs-review (deliberately held)
 *   - status: published (already in the feed)
 *
 * Mirrors the feed's logic exactly (gray-matter for the frontmatter status,
 * HEAD probe for audio), so a green check means the feeds are complete.
 * Network note: a transient R2 error is treated as "no audio" (fail-safe — it
 * won't spuriously block CI; the gap just gets caught on the next run).
 */

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import matter from 'gray-matter';

const ROOT = new URL('..', import.meta.url).pathname;
const LESSONS_ROOT = join(ROOT, 'src/content/docs/lessons');
const AUDIO_BASE = 'https://audio.clawdemy.org/lessons';

interface Finding {
	path: string;
	message: string;
}

async function hasAudio(slug: string): Promise<boolean> {
	try {
		const r = await fetch(`${AUDIO_BASE}/${slug}-lesson.mp3`, { method: 'HEAD' });
		return r.ok;
	} catch {
		return false; // fail-safe: don't block CI on a transient network error
	}
}

async function main(): Promise<number> {
	if (!existsSync(LESSONS_ROOT)) {
		console.log('No lessons directory yet — nothing to check.');
		return 0;
	}

	const findings: Finding[] = [];
	const tracks = await readdir(LESSONS_ROOT, { withFileTypes: true });

	for (const trackEntry of tracks) {
		if (!trackEntry.isDirectory()) continue;
		const trackDir = join(LESSONS_ROOT, trackEntry.name);
		const lessons = await readdir(trackDir, { withFileTypes: true });

		for (const lessonEntry of lessons) {
			if (!lessonEntry.isDirectory()) continue;
			const briefPath = join(trackDir, lessonEntry.name, 'brief.mdx');
			if (!existsSync(briefPath)) continue;

			const { data } = matter(await readFile(briefPath, 'utf8'));
			if (data?.artifact !== 'brief') continue;

			const status: string | undefined = data?.status;
			// Already in the feed, or deliberately held — not our concern.
			if (status === 'published' || status === 'needs-review') continue;

			// Candidate (draft / unset). Only a problem if it's actually
			// podcast-ready (audio exists), in which case the feed is skipping it.
			if (await hasAudio(lessonEntry.name)) {
				findings.push({
					path: relative(ROOT, briefPath),
					message: `audio exists on R2 but brief status is "${status ?? 'unset'}" (not "published"), so this lesson is missing from the podcast feeds.`,
				});
			}
		}
	}

	if (findings.length === 0) {
		console.log('✓ Podcast-coverage check passed (no narrated lessons missing from the feeds).');
		return 0;
	}

	console.error(`\n✗ ${findings.length} lesson(s) narrated but missing from the podcast feeds:\n`);
	for (const f of findings) {
		console.error(`  ${f.path}`);
		console.error(`    ${f.message}\n`);
	}
	console.error('Fix: set the brief\'s `status: published` (the feeds self-include it), or remove the audio if the lesson is not ready.');
	return 1;
}

const code = await main();
process.exit(code);

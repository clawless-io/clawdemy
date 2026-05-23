#!/usr/bin/env bun
/**
 * Citation-currency check for Track 6 (Privacy & Local-First AI) lessons.
 *
 * Per Doc/curriculum/track-6/philosophy.md governance addendum 2: every
 * Track 6 lesson carries a per-lesson stale-claim review cadence
 * (`review_cadence_months` in brief.mdx frontmatter, with `last_reviewed`
 * as the anchor date). Vendor-policy-citing lessons get quarterly cadence
 * (3 months); regulatory-text-citing lessons get annual (12 months). The
 * cadence defends against the silent-staleness failure mode where a
 * vendor changes a clause and the lesson keeps asserting the old version.
 *
 * This script is the build-time gate. For every Track 6 lesson it:
 *   1. Loads brief.mdx frontmatter (track, last_reviewed, review_cadence_months)
 *   2. Skips lessons not in Track 6 (track !== 'privacy-local-first')
 *   3. Computes `last_reviewed + review_cadence_months`
 *   4. Flags the lesson if the current date is past that window
 *
 * A future extension will fetch each cited URL and verify the quoted
 * sentence is still present (the SHA-based citation pattern). That
 * extension lives in this same file; for now the scaffold catches the
 * date-window failures.
 *
 * Exit codes:
 *   0  — all Track 6 lessons within their cadence window (or no Track 6
 *        lessons yet)
 *   1  — one or more Track 6 lessons past their cadence window
 *
 * Usage:
 *   bun run scripts/check-track6-citations.ts            # exit non-zero on failure
 *   bun run scripts/check-track6-citations.ts --dry-run  # print state, never fail
 */

import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import matter from 'gray-matter';

const ROOT = process.cwd();
const LESSONS_ROOT = join(ROOT, 'src/content/docs/lessons');
const TRACK_6_DIR = 'privacy-local-first';

interface LessonState {
	path: string;
	track: string;
	lastReviewed: Date;
	cadenceMonths: number;
	dueDate: Date;
	overdue: boolean;
}

async function main(): Promise<number> {
	const dryRun = process.argv.includes('--dry-run');
	const today = new Date();

	if (!existsSync(join(LESSONS_ROOT, TRACK_6_DIR))) {
		console.log(
			`No Track 6 lesson directory at ${relative(ROOT, join(LESSONS_ROOT, TRACK_6_DIR))} yet — nothing to check. Phase F will create it.`,
		);
		return 0;
	}

	const lessonDirs = await readdir(join(LESSONS_ROOT, TRACK_6_DIR), { withFileTypes: true });
	const states: LessonState[] = [];

	for (const entry of lessonDirs) {
		if (!entry.isDirectory()) continue;
		const briefPath = join(LESSONS_ROOT, TRACK_6_DIR, entry.name, 'brief.mdx');
		if (!existsSync(briefPath)) continue;

		const raw = await readFile(briefPath, 'utf8');
		const { data } = matter(raw);

		if (data.track !== 'privacy-local-first') continue;
		if (!data.last_reviewed) {
			console.warn(`! ${relative(ROOT, briefPath)} — missing last_reviewed in frontmatter`);
			continue;
		}
		if (!data.review_cadence_months) {
			console.warn(`! ${relative(ROOT, briefPath)} — missing review_cadence_months in frontmatter`);
			continue;
		}

		const lastReviewed = new Date(data.last_reviewed);
		const cadenceMonths = Number(data.review_cadence_months);
		const dueDate = new Date(lastReviewed);
		dueDate.setMonth(dueDate.getMonth() + cadenceMonths);
		const overdue = today > dueDate;

		states.push({
			path: relative(ROOT, briefPath),
			track: data.track,
			lastReviewed,
			cadenceMonths,
			dueDate,
			overdue,
		});
	}

	if (states.length === 0) {
		console.log('No Track 6 lessons with brief.mdx frontmatter yet — nothing to check.');
		return 0;
	}

	const overdue = states.filter((s) => s.overdue);
	const ok = states.filter((s) => !s.overdue);

	console.log(`Checked ${states.length} Track 6 lessons.`);
	console.log(`  ${ok.length} within cadence window`);
	console.log(`  ${overdue.length} past cadence window`);

	if (overdue.length > 0) {
		console.log('');
		console.log('Overdue lessons (last_reviewed + review_cadence_months has passed):');
		for (const s of overdue) {
			const daysOver = Math.floor((today.getTime() - s.dueDate.getTime()) / (24 * 60 * 60 * 1000));
			console.log(
				`  ${s.path} — reviewed ${s.lastReviewed.toISOString().slice(0, 10)}, ` +
					`due ${s.dueDate.toISOString().slice(0, 10)} (${daysOver} days overdue)`,
			);
		}
		console.log('');
		console.log('Action: re-verify the cited claims against the live sources, update');
		console.log('  the lesson body if needed, and bump last_reviewed in brief.mdx.');
	}

	if (dryRun) {
		return 0;
	}
	return overdue.length > 0 ? 1 : 0;
}

main().then(
	(code) => process.exit(code),
	(e) => {
		console.error(e);
		process.exit(2);
	},
);

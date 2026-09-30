#!/usr/bin/env bun
/**
 * Catalog-wide lesson freshness report.
 *
 * Generalizes scripts/check-track6-citations.ts (which only ever looked at
 * privacy-local-first, and was never wired into an npm script, so it never ran)
 * to all tracks, using the founder-approved per-track cadence tiers in
 * src/data/review-cadence.ts.
 *
 * WHAT IT READS. `last_reviewed` from each lesson's brief.mdx, which is the
 * canonical anchor date: 308 of 308 briefs carry it, versus 36 lesson.mdx files.
 * Cadence comes from the track tier, overridden by `review_cadence_months` in
 * the brief frontmatter when a single lesson needs a tighter clock.
 *
 * REPORT-ONLY BY DEFAULT. Exit code is 0 even when lessons are overdue. An
 * overdue lesson is a scheduling signal, not a broken build, and failing deploys
 * over a calendar date would block unrelated work. Use --strict in a dedicated
 * check if you ever want it to gate something.
 *
 * Draft lessons are skipped: nagging about the review date of something
 * unpublished is noise.
 *
 * Usage:
 *   bun run validate:freshness              # report, always exit 0
 *   bun run validate:freshness -- --strict  # exit 1 if anything is overdue
 *   bun run validate:freshness -- --json    # machine-readable, for a queue
 */

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import matter from 'gray-matter';
import {
	cadenceDays,
	resolveCadenceMonths,
	TRACK_CADENCE_MONTHS,
} from '../src/data/review-cadence';

const ROOT = process.cwd();
const LESSONS_ROOT = join(ROOT, 'src/content/docs/lessons');
const STRICT = process.argv.includes('--strict');
const AS_JSON = process.argv.includes('--json');
const DUE_SOON_DAYS = 30;

interface Row {
	track: string;
	slug: string;
	path: string;
	lastReviewed: Date | null;
	cadenceMonths: number;
	dueDate: Date | null;
	daysOverdue: number | null;
	overridden: boolean;
}

function dayDiff(a: Date, b: Date): number {
	return Math.floor((a.getTime() - b.getTime()) / 86_400_000);
}

function iso(d: Date): string {
	return d.toISOString().slice(0, 10);
}

/** Published lessons whose brief.mdx is draft, so they have no freshness anchor. */
const untracked: string[] = [];

async function collect(): Promise<Row[]> {
	const rows: Row[] = [];
	const now = new Date();
	const tracks = await readdir(LESSONS_ROOT, { withFileTypes: true });
	for (const track of tracks) {
		if (!track.isDirectory()) continue;
		const lessons = await readdir(join(LESSONS_ROOT, track.name), { withFileTypes: true });
		for (const lesson of lessons) {
			if (!lesson.isDirectory()) continue;
			const briefPath = join(LESSONS_ROOT, track.name, lesson.name, 'brief.mdx');
			if (!existsSync(briefPath)) continue;
			const { data } = matter(await readFile(briefPath, 'utf8'));
			if (data.status === 'draft') {
				// A draft brief is normally fine to skip. But when the LESSON is
				// published and only its brief is draft, the lesson is live with no
				// freshness anchor at all, which is a tracking hole rather than a
				// work-in-progress. Surface that case.
				const lessonPath = join(LESSONS_ROOT, track.name, lesson.name, 'lesson.mdx');
				if (existsSync(lessonPath)) {
					const { data: ld } = matter(await readFile(lessonPath, 'utf8'));
					if (ld.status !== 'draft') {
						untracked.push(`${track.name}/${lesson.name}`);
					}
				}
				continue;
			}

			const override = data.review_cadence_months ? Number(data.review_cadence_months) : null;
			const cadenceMonths = resolveCadenceMonths(track.name, override);
			const raw = data.last_reviewed;
			const lastReviewed = raw ? new Date(raw) : null;
			const valid = lastReviewed && !Number.isNaN(lastReviewed.getTime());

			let dueDate: Date | null = null;
			let daysOverdue: number | null = null;
			if (valid) {
				dueDate = new Date(lastReviewed!.getTime() + cadenceDays(cadenceMonths) * 86_400_000);
				daysOverdue = dayDiff(now, dueDate);
			}
			rows.push({
				track: track.name,
				slug: lesson.name,
				path: relative(ROOT, briefPath),
				lastReviewed: valid ? lastReviewed : null,
				cadenceMonths,
				dueDate,
				daysOverdue,
				overridden: override !== null,
			});
		}
	}
	return rows;
}

const rows = await collect();
const missing = rows.filter((r) => !r.lastReviewed);
const dated = rows.filter((r) => r.lastReviewed && r.daysOverdue !== null);
// Sort by worst-track-first, then worst-lesson-first inside the track, so each
// track prints as one contiguous block while the most urgent still leads.
const overdueUnsorted = dated.filter((r) => r.daysOverdue! > 0);
const trackWorst = new Map<string, number>();
for (const r of overdueUnsorted) {
	trackWorst.set(r.track, Math.max(trackWorst.get(r.track) ?? 0, r.daysOverdue!));
}
const overdue = overdueUnsorted.sort(
	(a, b) =>
		trackWorst.get(b.track)! - trackWorst.get(a.track)! ||
		a.track.localeCompare(b.track) ||
		b.daysOverdue! - a.daysOverdue!,
);
const dueSoon = dated
	.filter((r) => r.daysOverdue! <= 0 && r.daysOverdue! > -DUE_SOON_DAYS)
	.sort((a, b) => b.daysOverdue! - a.daysOverdue!);

if (AS_JSON) {
	console.log(
		JSON.stringify(
			{
				generated: iso(new Date()),
				counts: {
					tracked: rows.length,
					overdue: overdue.length,
					dueSoon: dueSoon.length,
					missingDate: missing.length,
					untracked: untracked.length,
				},
				untracked,
				overdue: overdue.map((r) => ({
					track: r.track,
					slug: r.slug,
					lastReviewed: iso(r.lastReviewed!),
					cadenceMonths: r.cadenceMonths,
					due: iso(r.dueDate!),
					daysOverdue: r.daysOverdue,
				})),
			},
			null,
			2,
		),
	);
} else {
	console.log(`Lesson freshness report  (${iso(new Date())})`);
	console.log(`tracked ${rows.length} published lessons across ${Object.keys(TRACK_CADENCE_MONTHS).length} mapped tracks\n`);

	if (overdue.length) {
		console.log(`OVERDUE (${overdue.length}) — past the track's review window:`);
		let lastTrack = '';
		for (const r of overdue) {
			if (r.track !== lastTrack) {
				console.log(`\n  ${r.track}  [${r.cadenceMonths} month cadence]`);
				lastTrack = r.track;
			}
			const tag = r.overridden ? ' (per-lesson override)' : '';
			console.log(
				`    ${String(r.daysOverdue).padStart(4)}d overdue   reviewed ${iso(r.lastReviewed!)}  due ${iso(r.dueDate!)}  ${r.slug}${tag}`,
			);
		}
		console.log('');
	} else {
		console.log('OVERDUE: none\n');
	}

	if (dueSoon.length) {
		console.log(`DUE WITHIN ${DUE_SOON_DAYS} DAYS (${dueSoon.length}):`);
		for (const r of dueSoon) {
			console.log(`    in ${String(-r.daysOverdue!).padStart(3)}d   due ${iso(r.dueDate!)}  ${r.track}/${r.slug}`);
		}
		console.log('');
	}

	if (missing.length) {
		console.log(`NO last_reviewed (${missing.length}) — no freshness signal can render:`);
		for (const r of missing) console.log(`    ${r.track}/${r.slug}`);
		console.log('');
	}

	if (untracked.length) {
		console.log(`UNTRACKED (${untracked.length}) — lesson is published but its brief.mdx is draft,`);
		console.log('so no last_reviewed anchor exists and no freshness signal can ever fire:');
		for (const u of untracked) console.log(`    ${u}`);
		console.log('');
	}

	const byTrack = new Map<string, number>();
	for (const r of overdue) byTrack.set(r.track, (byTrack.get(r.track) ?? 0) + 1);
	if (byTrack.size) {
		console.log('Overdue by track:');
		for (const [t, c] of [...byTrack].sort((a, b) => b[1] - a[1])) {
			console.log(`    ${String(c).padStart(3)}  ${t}  [${TRACK_CADENCE_MONTHS[t] ?? 'default'} mo]`);
		}
	}
}

if (STRICT && overdue.length > 0) process.exit(1);

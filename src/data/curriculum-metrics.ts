/**
 * Curriculum metrics, derived at BUILD TIME from what the repo actually holds.
 *
 * WHY THIS FILE EXISTS
 *
 * Marketing numbers used to be hand-maintained constants, and they drifted:
 * the RBJ family sites still carried "24 tracks" long after the real count
 * moved. Every number here is computed from primary artifacts instead, so a
 * number cannot be stale unless the content itself is:
 *
 *   narration hours  <- public/read-along/<slug>.timing.json, last word's end
 *   lesson counts    <- src/content/docs/lessons/<track>/<lesson>/lesson.mdx
 *   track counts     <- src/data/tracks.ts (the manifest)
 *
 * and the three are CROSS-CHECKED against each other at build time. If they
 * disagree, the build throws rather than shipping a wrong number. That is the
 * whole point of the file: silence is not an option, because a quietly wrong
 * "70 hours" on the homepage is worse than a failed build.
 *
 * SERVER ONLY. This reads the filesystem with node:fs, so it must only ever be
 * imported from .astro frontmatter or another build-time module, never from a
 * client script. Importing it into client code fails the build, which is the
 * behaviour we want.
 *
 * COST: one pass over 285 timing files. Measured at well under a second, and
 * the figure is logged by scripts/check-metrics.ts.
 *
 * Companion: src/data/curriculum-stats.ts holds the end-state SCOPE figures
 * (27 tracks, 327 lessons) that existing copy is framed around. This file is
 * about what is LIVE today. The two answer different questions; do not merge
 * them, and do not swap one for the other in copy without the founder's call.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { TRACKS } from './tracks';
import type { ThemeKey } from './tracks';

/**
 * Paths resolve from the PROJECT ROOT via process.cwd(), not from
 * import.meta.url.
 *
 * This is the one non-obvious thing in the file, and it cost a failed build to
 * learn. Astro bundles this module into dist/.prerender/chunks/ before running
 * it, so an import.meta.url-relative path resolves against that chunk
 * directory and not against src/data/. The first version used
 * `new URL('../content/docs/lessons/', import.meta.url)` and died with
 * `ENOENT: scandir dist/.prerender/content/docs/lessons/`. It passed when run
 * directly through `bun run metrics`, because nothing is bundled there, which
 * is exactly the kind of false pass worth remembering.
 *
 * `astro build`, `astro dev` and the scripts all run from the project root.
 * assertProjectRoot() turns a wrong cwd into a clear message instead of a
 * confusing ENOENT deeper in.
 */
function assertProjectRoot(root: string): string {
	const marker = join(root, 'astro.config.mjs');
	if (!existsSync(marker)) {
		throw new Error(
			`[curriculum-metrics] Expected to run from the project root, but ${root} has no ` +
				`astro.config.mjs. This module reads src/content/docs/lessons/ and ` +
				`public/read-along/ relative to the working directory.`,
		);
	}
	return root;
}

const ROOT = assertProjectRoot(process.cwd());
const LESSONS_DIR = join(ROOT, 'src/content/docs/lessons');
const TIMING_DIR = join(ROOT, 'public/read-along');

/** One word in a read-along timing file. */
interface TimingWord {
	text: string;
	start: number;
	end: number;
}

interface TimingFile {
	schema_version: number;
	slug: string;
	words: TimingWord[];
}

/** Per-track derived metrics. */
export interface TrackMetrics {
	/** Track directory slug. */
	slug: string;
	/** Lessons on disk for this track. */
	lessons: number;
	/** How many of those lessons have narration. */
	narrated: number;
	/** Total narration seconds across the track. */
	seconds: number;
	/** Total narration hours, one decimal. */
	hours: number;
	/**
	 * Display label for the hours, chosen so short tracks do not read "0.4
	 * hours". Under one hour it switches to whole minutes.
	 */
	hoursLabel: string;
}

/** Build a lesson-slug -> track-slug map from the content directory. */
function readLessonIndex(): { bySlug: Map<string, string>; perTrack: Map<string, number> } {
	const bySlug = new Map<string, string>();
	const perTrack = new Map<string, number>();

	for (const trackEntry of readdirSync(LESSONS_DIR, { withFileTypes: true })) {
		if (!trackEntry.isDirectory()) continue;
		const trackSlug = trackEntry.name;
		const trackDir = join(LESSONS_DIR, trackSlug);
		let count = 0;

		for (const lessonEntry of readdirSync(trackDir, { withFileTypes: true })) {
			if (!lessonEntry.isDirectory()) continue;
			// A lesson directory counts only if it actually carries a lesson body.
			if (!existsSync(join(trackDir, lessonEntry.name, 'lesson.mdx'))) {
				continue;
			}
			if (bySlug.has(lessonEntry.name)) {
				throw new Error(
					`[curriculum-metrics] Duplicate lesson slug "${lessonEntry.name}" in tracks ` +
						`"${bySlug.get(lessonEntry.name)}" and "${trackSlug}". Lesson slugs are the ` +
						`key used to attribute narration to a track, so they must be globally unique.`,
				);
			}
			bySlug.set(lessonEntry.name, trackSlug);
			count += 1;
		}
		perTrack.set(trackSlug, count);
	}

	return { bySlug, perTrack };
}

/**
 * Duration of one narration, in seconds.
 *
 * Taken from the END of the LAST word rather than any stats field, because the
 * timing file's `stats` block carries only prose/word counts and no duration.
 * The last word's end is what the read-along player itself scrubs against, so
 * it is the same number the reader experiences.
 */
function durationOf(file: TimingFile, name: string): number {
	const words = file.words;
	if (!Array.isArray(words) || words.length === 0) {
		throw new Error(`[curriculum-metrics] ${name} has no words array; cannot derive a duration.`);
	}
	const last = words[words.length - 1];
	if (typeof last?.end !== 'number' || !Number.isFinite(last.end) || last.end <= 0) {
		throw new Error(
			`[curriculum-metrics] ${name} last word has no usable end time (got ${String(last?.end)}).`,
		);
	}
	return last.end;
}

function hoursLabelFor(seconds: number): string {
	if (seconds <= 0) return 'No audio yet';
	const hours = seconds / 3600;
	if (hours < 1) return `${Math.round(seconds / 60)} min`;
	return `${hours.toFixed(1)} hours`;
}

function compute() {
	const { bySlug, perTrack } = readLessonIndex();

	const secondsByTrack = new Map<string, number>();
	const narratedByTrack = new Map<string, number>();
	let totalSeconds = 0;
	let narratedLessons = 0;
	const orphans: string[] = [];

	const timingFiles = readdirSync(TIMING_DIR).filter((f) => f.endsWith('.timing.json'));

	for (const name of timingFiles) {
		const raw = readFileSync(join(TIMING_DIR, name), 'utf8');
		const parsed = JSON.parse(raw) as TimingFile;
		const lessonSlug = name.replace(/\.timing\.json$/, '');
		const trackSlug = bySlug.get(lessonSlug);

		if (!trackSlug) {
			orphans.push(lessonSlug);
			continue;
		}

		const seconds = durationOf(parsed, name);
		totalSeconds += seconds;
		narratedLessons += 1;
		secondsByTrack.set(trackSlug, (secondsByTrack.get(trackSlug) ?? 0) + seconds);
		narratedByTrack.set(trackSlug, (narratedByTrack.get(trackSlug) ?? 0) + 1);
	}

	// A timing file with no lesson is a real defect: audio is published to R2 and
	// served to readers independently of git, so an orphan means we are paying to
	// host narration for a page that no longer exists, or a lesson was renamed
	// without its audio. Either way it must not pass silently.
	if (orphans.length > 0) {
		throw new Error(
			`[curriculum-metrics] ${orphans.length} read-along timing file(s) do not match any ` +
				`lesson directory: ${orphans.join(', ')}. Either the lesson was renamed (move the ` +
				`timing file and re-upload the audio under the new slug) or the audio is stale ` +
				`(delete the timing file and the R2 object).`,
		);
	}

	// Cross-check the manifest against the filesystem. tracks.ts hand-maintains
	// a `lessons` count per track and it is used on track cards, so drift there
	// shows a wrong number to every reader browsing the catalog.
	const mismatches: string[] = [];
	for (const track of TRACKS) {
		const onDisk = perTrack.get(track.slug) ?? 0;
		if (track.status === 'planned') {
			if (onDisk !== 0) {
				mismatches.push(
					`${track.slug}: marked planned but has ${onDisk} lesson(s) on disk (promote it to live)`,
				);
			}
			continue;
		}
		if (track.lessons !== onDisk) {
			mismatches.push(`${track.slug}: tracks.ts says ${track.lessons}, disk has ${onDisk}`);
		}
	}
	const unmanifested = [...perTrack.keys()].filter((s) => !TRACKS.some((t) => t.slug === s));
	for (const slug of unmanifested) {
		mismatches.push(`${slug}: lesson directory exists but no entry in tracks.ts`);
	}
	if (mismatches.length > 0) {
		throw new Error(
			`[curriculum-metrics] tracks.ts has drifted from the content directory:\n  ` +
				mismatches.join('\n  ') +
				`\nFix tracks.ts (or the content) so published counts stay true.`,
		);
	}

	const liveTracks = TRACKS.filter((t) => t.status === 'live');
	const liveLessons = [...perTrack.values()].reduce((a, b) => a + b, 0);

	const byTrack = new Map<string, TrackMetrics>();
	for (const track of TRACKS) {
		const seconds = secondsByTrack.get(track.slug) ?? 0;
		byTrack.set(track.slug, {
			slug: track.slug,
			lessons: perTrack.get(track.slug) ?? 0,
			narrated: narratedByTrack.get(track.slug) ?? 0,
			seconds,
			hours: Number((seconds / 3600).toFixed(1)),
			hoursLabel: hoursLabelFor(seconds),
		});
	}

	const byTheme = new Map<ThemeKey, { tracks: number; lessons: number; seconds: number }>();
	for (const track of liveTracks) {
		const m = byTrack.get(track.slug)!;
		const acc = byTheme.get(track.theme) ?? { tracks: 0, lessons: 0, seconds: 0 };
		acc.tracks += 1;
		acc.lessons += m.lessons;
		acc.seconds += m.seconds;
		byTheme.set(track.theme, acc);
	}

	return {
		byTrack,
		byTheme,
		totals: {
			/** Tracks readers can open today. */
			liveTracks: liveTracks.length,
			/** Tracks in the manifest, live plus planned. */
			manifestTracks: TRACKS.length,
			/** Lesson bodies on disk. */
			liveLessons,
			/** Lessons with word-level read-along narration. */
			narratedLessons,
			narrationSeconds: Math.round(totalSeconds),
			narrationHours: Number((totalSeconds / 3600).toFixed(1)),
			/** Mean narration length, in whole minutes. */
			narrationAvgMinutes: Math.round(totalSeconds / narratedLessons / 60),
		},
	};
}

const metrics = compute();

/**
 * Site-wide totals, every one of them derived and cross-checked.
 *
 * Current values are printed by `bun run metrics`. Do not transcribe them into
 * copy as literals; import from here so they stay true.
 */
export const CURRICULUM_METRICS = metrics.totals;

/** Per-track metrics, keyed by track directory slug. */
export const TRACK_METRICS = metrics.byTrack;

/** Per-theme rollups, keyed by ThemeKey, live tracks only. */
export const THEME_METRICS = metrics.byTheme;

/** Metrics for one track. Throws on an unknown slug rather than returning zeros. */
export function trackMetrics(slug: string): TrackMetrics {
	const m = metrics.byTrack.get(slug);
	if (!m) {
		throw new Error(
			`[curriculum-metrics] No metrics for track "${slug}". Known: ` +
				[...metrics.byTrack.keys()].join(', '),
		);
	}
	return m;
}

/** Format a seconds total the way the homepage and rails display it. */
export const formatNarrationLabel = hoursLabelFor;

#!/usr/bin/env bun
/**
 * Narration integrity check: does any shipped audio speak internal notes aloud?
 *
 * WHY THIS EXISTS. mdxToProse strips JSX expression comments since 2026-06-29,
 * so newly generated audio is clean. But the fix was never backfilled, and the
 * failure is INVISIBLE from source: when a diagram placeholder comment is later
 * replaced by a real illustration, the comment disappears from the .mdx while the
 * stale MP3 keeps narrating it forever. Grepping lesson source finds 3 lessons.
 * Checking what the voice actually said finds 24. (Found 2026-09-30.)
 *
 * THE GROUND TRUTH IS THE TIMING JSON, NOT THE SOURCE. public/read-along/
 * <slug>.timing.json lists every word the narrator spoke, so a leaked comment
 * shows up there as the mangled opener `{/`. Real prose never contains it.
 *
 * REMEDY when this fires: re-render the named lessons and bump cacheVersion.
 *   bun run audio:generate --force <slug>      (per lesson, costs credits)
 * then bump `cacheVersion` in the lesson's ReadAlongDim props so CDN caches drop.
 *
 * Report-only by default, and deliberately NOT in validate:all while the known
 * backlog of 24 is outstanding; adding it there now would fail every run for a
 * reason nobody can fix in the moment. Once the backlog is cleared, wire it into
 * validate:all so a regression fails loudly.
 *
 * TWO FAMILIES, ONE CAUSE. Internal notes were the first thing mdxToProse
 * learned to strip, but not the last. Every later extension of its strip-set
 * silently invalidated the audio of every lesson already rendered that
 * contained the newly stripped construct. The full delta between the strip-set
 * of 2026-05-12 and today, read off the diff rather than guessed at:
 *
 *   21bbe59  2026-05-29  markdown table rows      ^[ \t]*\|.*\|[ \t]*$
 *   6621e6a  2026-06-06  the References section    ^#{2,3} References ... EOF
 *   24d8882  2026-06-29  JSX comments              \{\/\* ... \*\/\}
 *   1af1eef  2026-07-12  :::directive asides       opener, title and closer
 *   2939037  2026-07-12  aria-hidden aside titles  (same rule as above)
 *
 * The markers below are derived from that list, not from inspecting the
 * lessons that happened to fail. Measured over all 285 shipped narrations on
 * 2026-10-31, they flag exactly 9 lessons and nothing else.
 *
 * WHAT IS DELIBERATELY NOT A MARKER:
 *   a bare "|"   Mathematical notation, not a table. Seven reinforcement
 *                learning lessons narrate P(s' | s, a) and |S| in prose, and
 *                every one of them is correctly in sync: the walker sees the
 *                same pipes the narrator read. That is a separate
 *                narration-quality issue (math belongs in plain English or a
 *                fence) and it needs a prose edit, not a re-render. Flagging a
 *                lone pipe here would bury the real signal under it. The table
 *                marker keys on the SEPARATOR row instead, which mathematics
 *                never produces.
 *   "arXiv:..."  the-capstone speaks one arXiv id, inside a deliberate
 *                attribution blockquote in the body. Not a References leak.
 *
 * Usage:
 *   bun run validate:narration
 *   bun run validate:narration -- --strict   # exit 1 if any lesson leaks
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const TIMING_DIR = join(ROOT, 'public/read-along');
const STRICT = process.argv.includes('--strict');

interface Marker {
	/** Short name, printed next to the lesson. */
	name: string;
	/** True when this spoken word is the marker. */
	test: (word: string) => boolean;
	/** One line for the operator: what the listener actually hears. */
	why: string;
}

/**
 * Family 1: internal production notes. These must never reach a learner, and
 * the backlog is clear, so --strict fails on them.
 */
const LEAK_MARKERS: Marker[] = [
	{
		name: 'jsx-comment',
		test: (w) => w.includes('{/'),
		why: 'narrates a JSX comment, usually a diagram or component placeholder',
	},
	{
		name: 'placeholder',
		test: (w) => w.includes('DIAGRAM PLACEHOLDER') || w.includes('COMPONENT PLACEHOLDER'),
		why: 'narrates an authoring placeholder aloud',
	},
];

/**
 * A markdown table separator row, as the narrator pronounces it: a dash run,
 * optionally pipe-separated and pipe-wrapped, optionally with alignment
 * colons. `|---|---|`, `---`, `|:---:|` all match.
 *
 * DO NOT SIMPLIFY THIS TO "a run of pipes". That was the obvious first guess
 * and it is wrong: it flags 15 lessons instead of 8, because seven
 * reinforcement-learning lessons narrate mathematics in prose, P(s' | s, a)
 * and pi(a | s) and |S|, and every one of them is correctly IN SYNC. A pipe
 * marker would add seven false positives and bury the real signal. The
 * separator row is the discriminator because mathematics never produces one.
 * Verified across all 285 shipped narrations on 2026-10-31: this matches the
 * eight table lessons exactly, no false positives, no false negatives.
 */
const TABLE_SEPARATOR = /^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?$/;

/**
 * Family 2: page markup read aloud. Same root cause, but the remedy costs
 * credits, so it reports and does not fail --strict until the queue clears.
 */
const MARKUP_MARKERS: Marker[] = [
	{
		name: 'table',
		test: (w) => TABLE_SEPARATOR.test(w),
		why: 'reads a markdown table aloud, pipes and separator row included',
	},
	{
		name: 'directive',
		test: (w) => w.startsWith(':::'),
		why: 'reads Starlight directive syntax aloud, such as :::note[Title]',
	},
];

/**
 * Whether --strict also fails on family 2.
 *
 * FLIP THIS TO true IN THE SAME PULL REQUEST THAT RE-RENDERS THE LAST LESSON
 * ON THE MARKUP LIST. Not a separate follow-up. It is false today only because
 * 9 lessons are outstanding and validate:all already runs this check with
 * --strict, so flipping it now would fail every run for a reason nobody can
 * fix in the moment.
 */
const STRICT_INCLUDES_MARKUP = false;

interface Hit {
	slug: string;
	generated: string;
	count: number;
	chars: number;
	heard: string;
	markers: string[];
	why: string[];
}

const files = (await readdir(TIMING_DIR)).filter((f) => f.endsWith('.timing.json'));
const leaks: Hit[] = [];
const markup: Hit[] = [];

function scan(words: string[], markers: Marker[]): Omit<Hit, 'slug' | 'generated' | 'chars'> | null {
	const idx: number[] = [];
	const names = new Set<string>();
	const why = new Set<string>();
	words.forEach((w, i) => {
		for (const m of markers) {
			if (m.test(w)) {
				idx.push(i);
				names.add(m.name);
				why.add(m.why);
			}
		}
	});
	if (idx.length === 0) return null;
	// Back up a few words so the operator hears the construct in context.
	const from = Math.max(0, idx[0] - 4);
	return {
		count: idx.length,
		heard: words.slice(from, from + 16).join(' '),
		markers: [...names],
		why: [...why],
	};
}

for (const file of files.sort()) {
	const slug = file.replace('.timing.json', '');
	let doc: any;
	try {
		doc = JSON.parse(await readFile(join(TIMING_DIR, file), 'utf8'));
	} catch {
		console.warn(`! could not parse ${relative(ROOT, join(TIMING_DIR, file))}`);
		continue;
	}
	const words: string[] = (doc.words ?? []).map((w: any) => String(w.text ?? '').trim());
	const meta = {
		slug,
		generated: String(doc.generated_at ?? '?').slice(0, 10),
		chars: Number(doc.stats?.prose_chars ?? 0),
	};
	const a = scan(words, LEAK_MARKERS);
	if (a) leaks.push({ ...meta, ...a });
	const b = scan(words, MARKUP_MARKERS);
	if (b) markup.push({ ...meta, ...b });
}

console.log(`Narration integrity  (scanned ${files.length} read-along timing files)\n`);

/** Measured 2026-10-31 across three real renders: $0.63/12599, $0.74/14729, $0.80/15990. */
const USD_PER_1K_CHARS = 0.0501;
/** Measured credit draw, not the estimator inside generate-audio.ts. */
const CREDITS_PER_CHAR = 0.22;

function report(title: string, hits: Hit[], remedy: string): void {
	const chars = hits.reduce((n, h) => n + h.chars, 0);
	console.log(`${title} (${hits.length}):\n`);
	for (const h of hits.sort((a, b) => b.count - a.count)) {
		console.log(`  ${h.slug}  [${h.markers.join(', ')}]`);
		console.log(
			`     ${h.count} occurrence(s) | audio ${h.generated} | ${h.chars.toLocaleString()} prose chars`,
		);
		for (const w of h.why) console.log(`     ${w}`);
		console.log(`     heard: ...${h.heard.slice(0, 110)}...`);
	}
	// Chars come from the timing file, so they are the prose AS NARRATED, not as
	// the page reads today. A re-render bills today's prose, which for the
	// markup family is smaller (the stripped markup is gone), so treat this as
	// an upper bound. Measured 2026-10-31: 136,888 recorded vs 132,276 current.
	console.log(
		`\n  Total ${hits.length} lesson(s), ${chars.toLocaleString()} prose chars as narrated, ` +
			`so at most about ${Math.round(chars * CREDITS_PER_CHAR).toLocaleString()} credits ` +
			`(roughly $${((chars / 1000) * USD_PER_1K_CHARS).toFixed(2)}). A re-render bills\n` +
			`  today's prose, which is smaller.`,
	);
	console.log(`  ${remedy}\n`);
}

if (leaks.length === 0) {
	console.log('CLEAN: no shipped narration speaks internal notes aloud.');
} else {
	report(
		'DEFECTIVE, internal notes narrated aloud',
		leaks,
		'Each needs: bun run audio:generate --force <slug>  + a cacheVersion bump.',
	);
}

if (markup.length > 0) {
	report(
		'PAGE MARKUP NARRATED ALOUD',
		markup,
		'Each needs a re-render + cacheVersion bump. Same cause as the internal-note\n' +
			'  leak: mdxToProse learned to strip this construct AFTER these lessons were\n' +
			'  rendered, and the audio was never rebuilt. Not a reader-visible text bug,\n' +
			'  so the page itself is correct; only the voice is stale.',
	);
	if (!STRICT_INCLUDES_MARKUP) {
		console.log(
			'  Reported, not failing: STRICT_INCLUDES_MARKUP is false while this queue\n' +
				'  is outstanding. Flip it in the pull request that re-renders the last one.\n',
		);
	}
}

const failing = leaks.length > 0 || (STRICT_INCLUDES_MARKUP && markup.length > 0);
if (STRICT && failing) process.exit(1);

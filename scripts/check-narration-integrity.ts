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
 * Usage:
 *   bun run validate:narration
 *   bun run validate:narration -- --strict   # exit 1 if any lesson leaks
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const TIMING_DIR = join(ROOT, 'public/read-along');
const STRICT = process.argv.includes('--strict');

/** The mangled JSX comment opener, plus a historical internal marker. */
const LEAK_TOKENS = ['{/', 'DIAGRAM PLACEHOLDER', 'COMPONENT PLACEHOLDER'];

interface Leak {
	slug: string;
	generated: string;
	leaks: number;
	chars: number;
	heard: string;
}

const files = (await readdir(TIMING_DIR)).filter((f) => f.endsWith('.timing.json'));
const found: Leak[] = [];

for (const file of files.sort()) {
	const slug = file.replace('.timing.json', '');
	let doc: any;
	try {
		doc = JSON.parse(await readFile(join(TIMING_DIR, file), 'utf8'));
	} catch {
		console.warn(`! could not parse ${relative(ROOT, join(TIMING_DIR, file))}`);
		continue;
	}
	const words: string[] = (doc.words ?? []).map((w: any) => String(w.text ?? ''));
	const idx: number[] = [];
	words.forEach((w, i) => {
		if (LEAK_TOKENS.some((t) => w.includes(t))) idx.push(i);
	});
	if (idx.length === 0) continue;
	found.push({
		slug,
		generated: String(doc.generated_at ?? '?').slice(0, 10),
		leaks: idx.length,
		chars: Number(doc.stats?.prose_chars ?? 0),
		heard: words.slice(idx[0], idx[0] + 12).join(' '),
	});
}

console.log(`Narration integrity  (scanned ${files.length} read-along timing files)\n`);

if (found.length === 0) {
	console.log('CLEAN: no shipped narration speaks internal notes aloud.');
} else {
	const totalChars = found.reduce((n, f) => n + f.chars, 0);
	console.log(`DEFECTIVE (${found.length}) — these MP3s narrate internal production notes:\n`);
	for (const f of found.sort((a, b) => b.leaks - a.leaks)) {
		console.log(`  ${f.slug}`);
		console.log(`     ${f.leaks} leak(s) | audio ${f.generated} | ${f.chars.toLocaleString()} prose chars`);
		console.log(`     heard: ...${f.heard.slice(0, 96)}...`);
	}
	console.log(`\nTo fix: ${found.length} lesson(s), ${totalChars.toLocaleString()} prose chars total`);
	console.log(`Approx Flash v2.5 credits (0.5/char): ${Math.round(totalChars * 0.5).toLocaleString()}`);
	console.log('Each needs: bun run audio:generate --force <slug>  + a cacheVersion bump.');
}

if (STRICT && found.length > 0) process.exit(1);

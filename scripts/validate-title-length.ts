/**
 * Title length gate (SEO). Per the 2026-06-26 lesson-SEO spec (Global Sites
 * Developer) and Founder Advisor's 2026-06-27 phased decision.
 *
 * Google truncates the rendered <title> around 60 chars in SERPs, cutting the
 * distinguishing tail (keyword or artifact type). Starlight renders the page
 * as `<frontmatter title> | Clawdemy`, so the rendered length is the
 * frontmatter title plus the 11-char " | Clawdemy" suffix.
 *
 * This gate enforces rendered length <= 60 on the INDEXED artifacts only
 * (lesson, brief, cheatsheet). summary / practice / references are
 * noindex,follow -> exempt.
 *
 * Iterates EVERY track/artifact. Exit 0 = clean, non-zero = at least one
 * indexed title too long.
 */

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const LESSONS_ROOT = join(ROOT, 'src/content/docs/lessons');

const INDEXED = new Set(['lesson', 'brief', 'cheatsheet']);
const ARTIFACT_FILES = ['lesson', 'brief', 'cheatsheet', 'summary', 'practice', 'references'];
const SUFFIX = ' | Clawdemy'; // Starlight site title 'Clawdemy' + default delimiter
const MAX = 60;

interface Row {
	path: string;
	rendered: number;
	title: string;
	ok: boolean;
}

function getField(body: string, key: string): string | undefined {
	const m = body.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
	if (!m) return undefined;
	return m[1].trim().replace(/^["']|["']$/g, '');
}

function frontmatter(raw: string): { artifact?: string; title?: string } {
	const m = raw.match(/^---\n([\s\S]*?)\n---/);
	if (!m) return {};
	return { artifact: getField(m[1], 'artifact'), title: getField(m[1], 'title') };
}

async function main(): Promise<number> {
	if (!existsSync(LESSONS_ROOT)) {
		console.log('No lessons directory yet. Nothing to check.');
		return 0;
	}

	const rows: Row[] = [];
	const tracks = await readdir(LESSONS_ROOT, { withFileTypes: true });
	for (const t of tracks) {
		if (!t.isDirectory()) continue;
		const trackDir = join(LESSONS_ROOT, t.name);
		const lessons = await readdir(trackDir, { withFileTypes: true });
		for (const l of lessons) {
			if (!l.isDirectory()) continue;
			for (const af of ARTIFACT_FILES) {
				const p = join(trackDir, l.name, `${af}.mdx`);
				if (!existsSync(p)) continue;
				const raw = await readFile(p, 'utf8');
				const { artifact, title } = frontmatter(raw);
				const kind = artifact ?? af;
				if (!INDEXED.has(kind)) continue;
				const rel = relative(ROOT, p);
				const t0 = title ?? '';
				const rendered = t0.length + SUFFIX.length;
				rows.push({ path: rel, rendered, title: t0, ok: rendered <= MAX });
			}
		}
	}

	const failed = rows.filter((r) => !r.ok);
	rows.sort((a, b) => b.rendered - a.rendered);

	console.log(`\nTitle gate: rendered <= ${MAX} chars (frontmatter title + "${SUFFIX}") on indexed artifacts.`);
	console.log(`Checked ${rows.length} indexed artifact(s); ${failed.length} failing.\n`);
	for (const r of failed.slice(0, 40)) {
		console.log(`  ✗ ${r.rendered.toString().padStart(3)}  "${r.title}"`);
	}
	if (failed.length > 40) console.log(`  ... and ${failed.length - 40} more`);

	if (failed.length === 0) {
		console.log(`\n✓ All ${rows.length} indexed artifact titles render <= ${MAX} chars.`);
		return 0;
	}
	console.error(`\n✗ ${failed.length} indexed artifact title(s) render > ${MAX} chars. Shorten the frontmatter title (keyword survives in the first ~48 chars).`);
	return 1;
}

process.exit(await main());

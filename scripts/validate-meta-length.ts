/**
 * Meta-description length gate (SEO). Per the 2026-06-26 lesson-SEO spec
 * (Global Sites Developer) and Founder Advisor's 2026-06-27 phased decision.
 *
 * Google truncates meta descriptions past ~160 chars (and may replace an
 * over-long OR too-short one with a worse auto-snippet), killing CTR even at
 * position 1-2. This gate enforces 110-160 chars on the INDEXED artifacts
 * only (lesson, brief, cheatsheet). The noindexed artifacts (summary,
 * practice, references) are exempt: they carry robots=noindex,follow (see
 * src/components/Head.astro), so their snippet never shows in SERPs.
 *
 * Also hard-fails on em/en-dashes (brand rule) and warns on SEO-spam
 * superlatives. Iterates EVERY track/artifact (unlike the reading-level
 * gate's track-map): length limits are universal.
 *
 * Exit 0 = clean. Non-zero = at least one indexed artifact out of range or
 * containing a dash.
 */

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const LESSONS_ROOT = join(ROOT, 'src/content/docs/lessons');

// Indexed artifacts get a SERP snippet, so their meta must be tuned.
// summary / practice / references are noindex,follow -> exempt.
const INDEXED = new Set(['lesson', 'brief', 'cheatsheet']);
const ARTIFACT_FILES = ['lesson', 'brief', 'cheatsheet', 'summary', 'practice', 'references'];
const MIN = 110;
const MAX = 160;
const SUPERLATIVE =
	/\b(best|ultimate|amazing|incredible|perfect|easiest|greatest|flawless|revolutionary|cutting[- ]edge|world[- ]class|unparalleled|must[- ]read)\b/i;

interface Row {
	path: string;
	artifact: string;
	len: number;
	ok: boolean;
	reason: string;
}

function getField(body: string, key: string): string | undefined {
	const m = body.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
	if (!m) return undefined;
	return m[1].trim().replace(/^["']|["']$/g, '');
}

function frontmatter(raw: string): { artifact?: string; description?: string } {
	const m = raw.match(/^---\n([\s\S]*?)\n---/);
	if (!m) return {};
	return { artifact: getField(m[1], 'artifact'), description: getField(m[1], 'description') };
}

async function main(): Promise<number> {
	if (!existsSync(LESSONS_ROOT)) {
		console.log('No lessons directory yet. Nothing to check.');
		return 0;
	}

	const rows: Row[] = [];
	const warnings: string[] = [];

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
				const { artifact, description } = frontmatter(raw);
				const kind = artifact ?? af;
				if (!INDEXED.has(kind)) continue; // noindexed artifacts are exempt
				const rel = relative(ROOT, p);
				if (!description) {
					rows.push({ path: rel, artifact: kind, len: 0, ok: false, reason: 'missing description' });
					continue;
				}
				const len = description.length;
				let ok = true;
				let reason = '';
				if (/[—–]/.test(description)) {
					ok = false;
					reason = 'contains em/en-dash';
				} else if (len > MAX) {
					ok = false;
					reason = `too long (>${MAX})`;
				} else if (len < MIN) {
					ok = false;
					reason = `too short (<${MIN})`;
				}
				if (SUPERLATIVE.test(description)) {
					warnings.push(`  ! superlative in ${rel}: "${description.match(SUPERLATIVE)?.[0]}"`);
				}
				rows.push({ path: rel, artifact: kind, len, ok, reason });
			}
		}
	}

	const failed = rows.filter((r) => !r.ok);
	rows.sort((a, b) => b.len - a.len);

	console.log(`\nMeta-description gate: ${MIN}-${MAX} chars on indexed artifacts (lesson/brief/cheatsheet).`);
	console.log(`Checked ${rows.length} indexed artifact(s); ${failed.length} failing.\n`);
	for (const r of failed.slice(0, 40)) {
		console.log(`  ✗ ${r.len.toString().padStart(4)}  ${r.reason.padEnd(20)} ${r.path}`);
	}
	if (failed.length > 40) console.log(`  ... and ${failed.length - 40} more`);
	if (warnings.length) {
		console.log(`\nSuperlative warnings (${warnings.length}):`);
		console.log(warnings.slice(0, 15).join('\n'));
	}

	if (failed.length === 0) {
		console.log(`\n✓ All ${rows.length} indexed artifact descriptions are ${MIN}-${MAX} chars and dash-free.`);
		return 0;
	}
	console.error(`\n✗ ${failed.length} indexed artifact description(s) out of range. Target ${MIN}-${MAX} chars, no em/en-dashes.`);
	return 1;
}

process.exit(await main());

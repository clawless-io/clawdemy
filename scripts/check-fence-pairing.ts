#!/usr/bin/env bun
/**
 * CI gate: catch unpairable code fences in lesson MDX.
 *
 * Why this exists
 * ---------------
 * `building-with-claude/agent-skills-and-claude-code/lesson.mdx` shipped to
 * production with a SKILL.md example that contained a nested ```python fence
 * inside an outer ```yaml fence. Markdown cannot nest fences of the same
 * length: per CommonMark a closing fence may not carry an info string, so the
 * inner ```python was swallowed as literal content and the NEXT bare ``` closed
 * the outer block early. The result was roughly 42% of the lesson body
 * rendering inside a single <pre>, with a heading buried in it, and a
 * read-along desynced by 980 words. It was invisible to `astro build` (the MDX
 * was still valid) and to every validator we had.
 *
 * What it checks, per column-0 fence
 * ----------------------------------
 *   1. A fence opened while already inside a fence AND carrying an info string
 *      (```python, ```yaml, ...). That is the agent-skills defect: it can never
 *      close the outer block, so it becomes content and the structure breaks.
 *   2. A fence left unclosed at end of file.
 *
 * Both are hard failures. The fix is to restructure so nesting is unnecessary
 * (split the example into separate fences and narrate the join in prose), which
 * is what we did for agent-skills. Do NOT "fix" these by lengthening the outer
 * fence to four backticks: mdxToProse mispairs the longer marker and leaves a
 * stray backtick in the narration.
 *
 * Known limitation, inherited and deliberate
 * ------------------------------------------
 * Only column-0 fences are considered, matching the existing awk fence gate
 * (see the "Awk fence gate" note in project memory). An indented fence inside
 * a list item is not seen by either tool. Keep fences at column 0.
 *
 * Usage:
 *   bun run scripts/check-fence-pairing.ts
 *   bun run scripts/check-fence-pairing.ts --dry-run   # report, exit 0
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = 'src/content/docs';
const FENCE = /^(`{3,})[ \t]*(.*)$/;

interface Violation {
	file: string;
	line: number;
	kind: 'nested-with-info' | 'unclosed';
	detail: string;
	openedAt: number;
}

function walk(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir)) {
		const p = join(dir, entry);
		if (statSync(p).isDirectory()) walk(p, out);
		else if (p.endsWith('.mdx')) out.push(p);
	}
	return out;
}

function scan(file: string): Violation[] {
	const found: Violation[] = [];
	const lines = readFileSync(file, 'utf8').split('\n');

	let openLine = 0;
	let openMarker = '';
	let inFence = false;

	for (let i = 0; i < lines.length; i++) {
		const m = FENCE.exec(lines[i]);
		if (!m) continue;
		const [, marker, info] = m;
		const infoText = info.trim();

		if (!inFence) {
			inFence = true;
			openLine = i + 1;
			openMarker = marker;
			continue;
		}

		// Inside a fence. A valid closer is >= the opening marker and bare.
		if (marker.length >= openMarker.length && infoText === '') {
			inFence = false;
			continue;
		}

		if (infoText !== '') {
			found.push({
				file,
				line: i + 1,
				kind: 'nested-with-info',
				detail: `\`\`\`${infoText}`,
				openedAt: openLine,
			});
			// Treat it as content and keep scanning for the real closer.
		}
	}

	if (inFence) {
		found.push({
			file,
			line: openLine,
			kind: 'unclosed',
			detail: openMarker,
			openedAt: openLine,
		});
	}

	return found;
}

function main(): number {
	const dryRun = process.argv.includes('--dry-run');
	const files = walk(ROOT);
	const violations = files.flatMap(scan);

	console.log(`Fence pairing  (scanned ${files.length} MDX files under ${ROOT})`);
	console.log('');

	if (violations.length === 0) {
		console.log('CLEAN: every column-0 fence pairs, and none is left open.');
		return 0;
	}

	for (const v of violations) {
		const where = `${relative('.', v.file)}:${v.line}`;
		if (v.kind === 'nested-with-info') {
			console.error(`✗ ${where}`);
			console.error(
				`    ${v.detail} opens while the fence from line ${v.openedAt} is still open.`,
			);
			console.error(
				'    Markdown cannot nest same-length fences, so this becomes literal',
			);
			console.error(
				'    content and the next bare ``` closes the outer block early.',
			);
		} else {
			console.error(`✗ ${where}`);
			console.error(`    fence ${v.detail} is never closed before end of file.`);
		}
		console.error('');
	}

	console.error(
		`${violations.length} fence defect(s). Restructure so nesting is unnecessary;`,
	);
	console.error(
		'do not lengthen the outer fence, which breaks narration instead.',
	);

	if (dryRun) {
		console.error('(--dry-run: not exiting non-zero)');
		return 0;
	}
	return 1;
}

process.exit(main());

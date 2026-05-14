#!/usr/bin/env bun
/**
 * Pre-commit / CI gate: scan the public repo for unauthorized PVC voice
 * ID occurrences.
 *
 * Per Doc/brand.md "Voice ID handling (security)" rule (locked
 * 2026-05-13, tightened 2026-05-14):
 *
 *   - Stock voice IDs (e.g., Peter ZthjuvLPty3kTMaNKVKb) may appear in
 *     any repo. They identify a voice in ElevenLabs' public library, not
 *     an account.
 *   - Custom PVC voice IDs are account-bound. They must NOT appear in:
 *       • lesson MDX
 *       • public READMEs
 *       • commit messages reachable from clawless-io/clawdemy (public)
 *
 *   They MAY appear in:
 *       • scripts/generate-audio.ts (fallback default for tracks not in
 *         TRACK_VOICE_MAP; grandfathered)
 *
 *   They MUST appear as a placeholder format only in:
 *       • .env.example (never the actual ID)
 *
 *   They MUST appear (private-repo only) in:
 *       • Doc/brand.md (private clawdemy-internal repo, not scanned by
 *         this gate which runs against the public repo)
 *
 * This script runs against the public repo working tree (or staged
 * changes when invoked from a pre-commit hook). It scans all tracked
 * files plus staged additions for PVC voice ID strings, allowlists the
 * known acceptable locations, and exits non-zero if any unauthorized
 * occurrence is found.
 *
 * To install as a pre-commit hook:
 *   echo '#!/bin/sh\nbun run scripts/check-voice-id-leak.ts' > .git/hooks/pre-commit
 *   chmod +x .git/hooks/pre-commit
 *
 * To run on demand:
 *   bun run scripts/check-voice-id-leak.ts            # scans tracked files; exits non-zero on violations
 *   bun run scripts/check-voice-id-leak.ts --staged   # scans staged-additions only (pre-commit mode)
 *   bun run scripts/check-voice-id-leak.ts --dry-run  # prints findings, never exits non-zero
 *
 * Adding a new PVC voice ID:
 *   When founder/operator clones a new PVC voice for a future track, add
 *   the new ID to PVC_VOICE_IDS below. Stock voice IDs do NOT go here;
 *   only PVC clones do.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { relative, join } from 'node:path';

const ROOT = process.cwd();

// PVC (custom-cloned) voice IDs. Add new entries here when the operator
// clones a new PVC voice for a future track. NEVER add stock voice IDs.
const PVC_VOICE_IDS = [
	'GuflK5NRKwVLKwEeBYTy', // Track 5 PVC, locked 2026-04-19
];

// Files where PVC voice IDs are explicitly allowed per Doc/brand.md.
// Path matching is exact relative to repo root; no glob.
const ALLOWED_FILES = new Set([
	'scripts/generate-audio.ts',
]);

// .env.example MUST contain only placeholders, never the actual ID.
// Tracked separately from ALLOWED_FILES because the rule is different
// (presence allowed but only as placeholder, not actual).
const PLACEHOLDER_ONLY_FILES = new Set([
	'.env.example',
]);

// Placeholder patterns that satisfy PLACEHOLDER_ONLY_FILES rules.
// These represent intentional documentation patterns; a PVC ID inside
// these is a violation regardless of file.
const PLACEHOLDER_PATTERNS = [
	/__\w*voice_id\w*__/i,
	/your_voice_id/i,
	/example_voice_id/i,
];

interface Finding {
	file: string;
	line: number;
	id: string;
	context: string;
	severity: 'violation' | 'placeholder-violation';
}

function gitTrackedFiles(): string[] {
	try {
		const out = execSync('git ls-files', { cwd: ROOT, encoding: 'utf-8' });
		return out.split('\n').filter(Boolean);
	} catch (e) {
		console.error('git ls-files failed; running outside a git checkout?');
		return [];
	}
}

function gitStagedAddedFiles(): string[] {
	try {
		const out = execSync('git diff --cached --name-only --diff-filter=AM', {
			cwd: ROOT,
			encoding: 'utf-8',
		});
		return out.split('\n').filter(Boolean);
	} catch {
		return [];
	}
}

function scanFile(relPath: string): Finding[] {
	const findings: Finding[] = [];
	let text: string;
	try {
		text = readFileSync(join(ROOT, relPath), 'utf-8');
	} catch {
		return findings; // file removed / binary / unreadable; skip
	}
	const lines = text.split('\n');
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		for (const id of PVC_VOICE_IDS) {
			if (line.includes(id)) {
				if (ALLOWED_FILES.has(relPath)) continue;
				if (PLACEHOLDER_ONLY_FILES.has(relPath)) {
					// Real PVC ID in a placeholder-only file is a violation.
					findings.push({
						file: relPath,
						line: i + 1,
						id,
						context: line.trim().slice(0, 200),
						severity: 'placeholder-violation',
					});
					continue;
				}
				findings.push({
					file: relPath,
					line: i + 1,
					id,
					context: line.trim().slice(0, 200),
					severity: 'violation',
				});
			}
		}
	}
	return findings;
}

function main(): number {
	const args = new Set(process.argv.slice(2));
	const stagedOnly = args.has('--staged');
	const dryRun = args.has('--dry-run');

	const files = stagedOnly ? gitStagedAddedFiles() : gitTrackedFiles();
	if (files.length === 0) {
		if (stagedOnly) {
			console.log('No staged file additions/modifications. Skipping voice-ID gate.');
			return 0;
		}
		console.error('No tracked files found. Are you in the public clawdemy repo?');
		return 2;
	}

	const findings: Finding[] = [];
	for (const f of files) {
		findings.push(...scanFile(f));
	}

	if (findings.length === 0) {
		console.log(
			`✓ Voice-ID gate passed. Scanned ${files.length} file(s) for ${PVC_VOICE_IDS.length} PVC voice ID(s); no unauthorized occurrences.`,
		);
		return 0;
	}

	console.error('');
	console.error('✗ Voice-ID gate FAILED. PVC voice ID leaks detected:');
	console.error('');
	for (const f of findings) {
		const tag = f.severity === 'placeholder-violation'
			? '[PLACEHOLDER-FILE VIOLATION: real PVC ID in placeholder-only file]'
			: '[VIOLATION: PVC ID outside allowed locations]';
		console.error(`  ${f.file}:${f.line}  ${tag}`);
		console.error(`    ${f.context}`);
		console.error('');
	}
	console.error(
		'Per Doc/brand.md voice-ID-handling rule (private repo): custom PVC voice IDs may only',
	);
	console.error(
		`appear in ${[...ALLOWED_FILES].join(', ')} (fallback default), and as a placeholder in`,
	);
	console.error(
		`${[...PLACEHOLDER_ONLY_FILES].join(', ')}. They are private-repo-only otherwise.`,
	);
	console.error('');
	console.error('Fix: replace the PVC ID with a placeholder, or move the reference to a private location.');

	if (dryRun) {
		console.error('(--dry-run: not exiting non-zero)');
		return 0;
	}
	return 1;
}

process.exit(main());

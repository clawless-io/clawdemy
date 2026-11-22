/**
 * Promote staged lesson audio to the public bucket at release.
 *
 * scripts/generate-audio.ts uploads every render to a private staging bucket.
 * This script publishes exactly the recordings a release changes, by a
 * server-side copy (no second render, no download and re-upload).
 *
 * Usage, from a checkout at the commit being released:
 *   bun run audio:promote --dry-run     # print the plan, change nothing
 *   bun run audio:promote               # copy, then verify each object
 *   bun run audio:promote --base <ref>  # compare against <ref> instead of origin/main
 *
 * Which lessons: every public/read-along/<slug>.timing.json added or changed
 * on HEAD since its merge base with the base (default origin/main, fetched
 * first, so it is what production serves now). Renames count as additions. Those are the recordings this release changes. No slug list is taken
 * from the command line, so nothing outside the release can be published.
 *
 * Safety checks, all run before anything is copied (all or nothing):
 *   - lesson text and timing files have no uncommitted changes;
 *   - each staged object carries the prose hash of the lesson text at HEAD,
 *     so the audio published was rendered from the text being released;
 *   - each staged object's bytes match the audio_md5 in the committed timing
 *     JSON, so the published audio is the one those word timings belong to;
 *   - each timing JSON points at the public URL for its slug;
 *   - a recording that replaces a live one comes with a new cacheVersion in
 *     its lesson, or the CDN would keep serving the old file with new timings.
 * Before a live recording is replaced, it is copied server-side into staging
 * under previous/<UTC stamp>/ so a release can be rolled back. After each copy,
 * the public object is checked over the S3 endpoint (never the public URL,
 * whose CDN caches 404s) for the same size and ETag. A copy failure stops the
 * run partway; running it again is safe, as copies are idempotent.
 *
 * Order at release: run this after the release pull request's checks are
 * green and immediately before merging it. If the site deployed first, new
 * pages would request the new cache version while the bucket still held the
 * old audio (or nothing, for a new lesson), and the CDN would cache that.
 */

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { CopyObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import {
	getR2Client,
	mdxToProse,
	R2_STAGING_BUCKET,
	R2_PUBLIC_BUCKET,
	R2_KEY_PREFIX,
	META_PROSE_HASH,
} from './generate-audio.ts';

const LESSONS_ROOT = 'src/content/docs/lessons';
const TIMING_DIR = 'public/read-along';
const PUBLIC_BASE = 'https://audio.clawdemy.org/';

function git(args: string[]): string {
	const res = spawnSync('git', args, { encoding: 'utf8' });
	if (res.status !== 0) {
		throw new Error(`git ${args.join(' ')} failed: ${(res.stderr || '').trim()}`);
	}
	return res.stdout.trim();
}

async function findLessonMdx(slug: string): Promise<string | null> {
	const tracks = await readdir(LESSONS_ROOT, { withFileTypes: true });
	for (const t of tracks) {
		if (!t.isDirectory()) continue;
		const p = join(LESSONS_ROOT, t.name, slug, 'lesson.mdx');
		if (existsSync(p)) return p;
	}
	return null;
}

async function head(bucket: string, key: string) {
	try {
		return await getR2Client().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
	} catch (err: any) {
		if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) return null;
		throw err;
	}
}

interface Plan {
	slug: string;
	key: string;
	size: number;
	etag: string;
	publicEtag: string | null;
}

async function main() {
	const args = process.argv.slice(2);
	const dryRun = args.includes('--dry-run');
	const baseIdx = args.indexOf('--base');
	const base = baseIdx >= 0 ? args[baseIdx + 1] : 'origin/main';
	if (!base || base.startsWith('--')) {
		console.error('--base needs a git ref.');
		process.exit(1);
	}

	const dirty = git(['status', '--porcelain', '--untracked-files=no', '--', LESSONS_ROOT, TIMING_DIR, 'scripts']);
	if (dirty) {
		console.error('Uncommitted changes in lesson text, timing files or scripts. Promote only from a clean checkout of the release commit:');
		console.error(dirty);
		process.exit(1);
	}

	if (base.startsWith('origin/')) {
		git(['fetch', '--quiet', 'origin', base.slice('origin/'.length)]);
	}
	const headCommit = git(['rev-parse', 'HEAD']);
	const baseCommit = git(['rev-parse', base]);
	const mergeBase = git(['merge-base', baseCommit, headCommit]);
	console.log(`release commit ${headCommit}`);
	console.log(`compared with  ${base} (${baseCommit}), merge base ${mergeBase}`);

	const changed = git(['diff', '--name-only', '--no-renames', '--diff-filter=AM', mergeBase, headCommit, '--', TIMING_DIR])
		.split('\n')
		.filter((f) => f.endsWith('.timing.json'));
	if (changed.length === 0) {
		console.log('No timing files changed: this release publishes no audio.');
		return;
	}

	const problems: string[] = [];
	const plans: Plan[] = [];
	for (const file of changed) {
		const slug = file.slice(TIMING_DIR.length + 1, -'.timing.json'.length);
		const key = `${R2_KEY_PREFIX}${slug}-lesson.mp3`;
		const mdxPath = await findLessonMdx(slug);
		if (!mdxPath) {
			problems.push(`${slug}: no lesson.mdx found for this timing file`);
			continue;
		}
		const timingBytes = await readFile(file);
		const timing = JSON.parse(timingBytes.toString('utf8'));
		if (timing.audio_url !== `${PUBLIC_BASE}${key}`) {
			problems.push(`${slug}: timing JSON audio_url is ${timing.audio_url}, expected ${PUBLIC_BASE}${key}`);
		}
		const proseHash = createHash('sha256').update(mdxToProse(await readFile(mdxPath, 'utf-8'))).digest('hex');
		const staged = await head(R2_STAGING_BUCKET!, key);
		if (!staged) {
			problems.push(`${slug}: nothing staged at ${key}`);
			continue;
		}
		if (staged.Metadata?.[META_PROSE_HASH] !== proseHash) {
			problems.push(`${slug}: staged audio was rendered from different text than the lesson at this commit`);
		}
		const stagedMd5 = (staged.ETag ?? '').replace(/"/g, '');
		if (!timing.audio_md5) {
			problems.push(`${slug}: timing JSON has no audio_md5 (rendered before fingerprints); re-render it`);
		} else if (stagedMd5 !== timing.audio_md5) {
			problems.push(`${slug}: staged audio is not the recording the committed timing JSON was made for`);
		}
		const pub = await head(R2_PUBLIC_BUCKET, key);
		if (pub && pub.ETag !== staged.ETag) {
			const cv = (text: string) => text.match(/cacheVersion="([^"]*)"/)?.[1] ?? null;
			const now = cv(await readFile(mdxPath, 'utf-8'));
			const before = spawnSync('git', ['show', `${baseCommit}:${mdxPath}`], { encoding: 'utf8' });
			const was = before.status === 0 ? cv(before.stdout) : null;
			if (now === null || now === was) {
				problems.push(`${slug}: replaces live audio but its cacheVersion is unchanged (${now}); bump it on dev`);
			}
		}
		plans.push({
			slug,
			key,
			size: staged.ContentLength ?? -1,
			etag: staged.ETag ?? '',
			publicEtag: pub?.ETag ?? null,
		});
	}

	if (problems.length > 0) {
		console.error(`Refusing to promote anything. ${problems.length} problem(s):`);
		for (const p of problems) console.error(`  - ${p}`);
		process.exit(1);
	}

	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	for (const p of plans) {
		const state = p.publicEtag === null ? 'new' : p.publicEtag === p.etag ? 'same as live' : 'replaces live';
		console.log(`${dryRun ? '~ plan   ' : '> copy   '} ${p.slug.padEnd(40)} ${(p.size / 1024 / 1024).toFixed(2)} MB  ${state}`);
		if (dryRun) continue;
		if (p.publicEtag !== null && p.publicEtag !== p.etag) {
			const backupKey = `previous/${stamp}/${p.key}`;
			await getR2Client().send(
				new CopyObjectCommand({
					Bucket: R2_STAGING_BUCKET,
					Key: backupKey,
					CopySource: `${R2_PUBLIC_BUCKET}/${p.key.split('/').map(encodeURIComponent).join('/')}`,
					MetadataDirective: 'COPY',
				}),
			);
			const saved = await head(R2_STAGING_BUCKET!, backupKey);
			if (!saved || saved.ETag !== p.publicEtag) {
				throw new Error(`${p.slug}: could not back up the live recording to ${backupKey}; nothing replaced.`);
			}
			console.log(`= backup  ${p.slug.padEnd(40)} staging ${backupKey}`);
		}
		await getR2Client().send(
			new CopyObjectCommand({
				Bucket: R2_PUBLIC_BUCKET,
				Key: p.key,
				CopySource: `${R2_STAGING_BUCKET}/${p.key.split('/').map(encodeURIComponent).join('/')}`,
				MetadataDirective: 'COPY',
			}),
		);
		const after = await head(R2_PUBLIC_BUCKET, p.key);
		if (!after || after.ContentLength !== p.size || after.ETag !== p.etag) {
			throw new Error(
				`${p.slug}: public copy does not match the staged object ` +
					`(size ${after?.ContentLength} vs ${p.size}, etag ${after?.ETag} vs ${p.etag}). Stop and investigate before merging.`,
			);
		}
		console.log(`= verified ${p.slug}`);
	}
	console.log(dryRun ? `${plans.length} recording(s) would be published.` : `${plans.length} recording(s) published. Merge the release now.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

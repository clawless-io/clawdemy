/**
 * Generate AI-narrated MP3s for Clawdemy lessons via ElevenLabs.
 *
 * Build-time generation: reads a lesson's MDX, strips it to clean prose,
 * calls the ElevenLabs Text-to-Speech API once, writes a static MP3 to
 * `public/audio/<slug>-lesson.mp3`. After that, listeners stream the MP3
 * from the site's own domain; no per-listener API call ever.
 *
 * Caching: each MP3 is paired with a `.hash` file containing the SHA-256
 * of the prose that produced it. Subsequent runs compare hashes and skip
 * lessons whose prose has not changed, so editing one lesson does not
 * regenerate the rest.
 *
 * Setup:
 *   1. Copy `.env.example` to `.env`.
 *   2. Add your ElevenLabs API key.
 *   3. Add your Cloudflare R2 credentials (account ID + access key + secret).
 *   4. (Optional) Adjust the voice ID.
 *
 * Usage:
 *   bun run audio:generate <slug>                # render + upload to R2 (default)
 *   bun run audio:generate --all                 # every lesson, render + upload
 *   bun run audio:generate --no-upload <slug>    # render locally only, skip R2
 *   bun run audio:generate --upload-only <slug>  # upload existing local MP3, no render
 *   bun run audio:generate --upload-only --all   # upload every existing local MP3
 *   bun run audio:generate --dry-run <slug>      # preview prose, no API call
 *   bun run audio:generate --list                # show available slugs
 *
 * The R2 upload step is idempotent: a HEAD on the public URL
 * (audio.clawdemy.org/lessons/<slug>-lesson.mp3) is checked first; if the
 * file is already there, the PUT is skipped.
 *
 * Lesson slugs are the directory names under
 *   src/content/docs/lessons/<track>/<slug>/
 *
 * Pricing context (consumer ElevenLabs tiers): about $0.30 per 1,000
 * characters. A typical 12,000-character Clawdemy lesson runs about
 * $3.60 at full re-render. Hash caching means most runs cost $0.
 */

import { mkdir, readFile, writeFile, readdir, stat, copyFile, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'GuflK5NRKwVLKwEeBYTy';

// Per-track voice casting (per Doc/brand.md "Audio narration — per-track
// casting", locked 2026-05-13). Voice is cast once at a track's Phase 0 and
// locked across the track's lifetime. Listeners get a consistent narrator
// per track; new tracks may use new voices.
//
// The map routes by lesson directory slug (the first segment under
// src/content/docs/lessons/<track>/<slug>/). The script-level VOICE_ID
// above is the fallback for any track not listed, which keeps the existing
// Track 5 default intact even if the map is empty.
//
// Per CLAUDE.md §3.5 global-flags rule: voice is per-track config, not per-
// lesson prop. Per-lesson voice overrides are deliberately NOT supported.
// Adding a track is one line here; never per-lesson MDX.
const TRACK_VOICE_MAP: Record<string, string> = {
	// Track 5 (AI Foundations) — custom PVC voice, locked 2026-04-19.
	'ai-foundations': 'GuflK5NRKwVLKwEeBYTy',
	// Track 6 (Privacy & Local-First AI) — "Peter" ElevenLabs stock voice,
	// locked 2026-05-13. Directory slug below is the proposed value pending
	// Track 6 Phase E equivalent ratification ('privacy-local-first');
	// founder may pick a different slug, in which case update the key here.
	'privacy-local-first': 'ZthjuvLPty3kTMaNKVKb',
};

/**
 * Resolve the voice ID for a given track. Falls back to the script-level
 * VOICE_ID default if the track is not explicitly mapped, so unknown tracks
 * fail gracefully (render with the default voice rather than throwing).
 */
function resolveVoiceId(track: string): string {
	return TRACK_VOICE_MAP[track] ?? VOICE_ID;
}

// Flash v2.5 with-timestamps pipeline (Experiment 2, 2026-05-13). Replaces
// the prior Multilingual v2 plain-text-to-speech + WhisperX post-alignment
// path. Flash v2.5 supports the native /with-timestamps endpoint and the
// custom PVC voice, costs half what Multilingual v2 did, and allows 40K
// chars per request so a typical Clawdemy lesson fits in a single call
// (eliminating the multi-chunk concatenation that broke Chrome's MP3 seek
// table). See reference_elevenlabs_with_timestamps_pipeline.md.
const MODEL_ID = 'eleven_flash_v2_5';

// 500-char headroom below Flash's 40K limit for safe paragraph-boundary
// splits. Almost every Clawdemy lesson lands as one chunk at this cap.
const MAX_CHARS_PER_REQUEST = 39500;

// Flash v2.5 pricing as of 2026-05-12 (triangulated across our and the
// advisor's research): $0.05 per 1,000 characters. with-timestamps has
// no premium over standard text-to-speech on the same model.
const COST_PER_1K_CHARS = 0.05;

// ffmpeg lives at /opt/homebrew/bin on this Mac. Used to rewrite the MP3
// Xing/Info seek header after concat so Chrome can seek correctly even
// on a multi-chunk file. Defensive on single-chunk output too.
const FFMPEG = '/opt/homebrew/bin/ffmpeg';

const LESSONS_ROOT = 'src/content/docs/lessons';
const AUDIO_OUT = 'public/audio';
const TIMING_OUT = 'public/read-along';
const BACKUP_DIR = 'public/audio/.backup';

// Cloudflare R2 (S3-compatible) for syncing rendered MP3s to the
// clawdemy-audio bucket served at audio.clawdemy.org.
// Env vars come from .env (gitignored); see .env.example for the shape.
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET = 'clawdemy-audio';
const R2_KEY_PREFIX = 'lessons/';
const R2_PUBLIC_BASE = 'https://audio.clawdemy.org/';

// ---------------------------------------------------------------------------
// Cloudflare R2 sync
// ---------------------------------------------------------------------------

/**
 * Lazily build the R2 client. We only fail on missing credentials when an
 * upload is actually attempted, so dry-run / list / --no-upload flows still
 * work in environments without R2 credentials configured (e.g., CI).
 */
let r2ClientInstance: S3Client | null = null;
function getR2Client(): S3Client {
	if (r2ClientInstance) return r2ClientInstance;
	if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
		throw new Error(
			'R2 credentials missing. Set CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, ' +
				'and R2_SECRET_ACCESS_KEY in .env (see .env.example), or pass --no-upload ' +
				'to skip the R2 sync step.',
		);
	}
	r2ClientInstance = new S3Client({
		endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		region: 'auto',
		credentials: {
			accessKeyId: R2_ACCESS_KEY_ID,
			secretAccessKey: R2_SECRET_ACCESS_KEY,
		},
	});
	return r2ClientInstance;
}

/**
 * HEAD the object directly via the R2 S3 endpoint. Returns true iff the
 * bucket has a copy.
 *
 * Why S3 and not the public custom-domain URL? Cloudflare's CDN caches
 * 404 responses on audio.clawdemy.org for ~4 hours. If we HEAD the public
 * URL on a fresh slug before uploading, CF caches a 404 that listeners
 * will see for the full TTL even after we PUT the file. The S3 endpoint
 * goes straight to R2 with no CDN in front, so it's both the right
 * source of truth and side-effect-free.
 */
async function isAlreadyUploaded(slug: string): Promise<boolean> {
	const client = getR2Client();
	const key = `${R2_KEY_PREFIX}${slug}-lesson.mp3`;
	try {
		await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
		return true;
	} catch (err: any) {
		// AWS SDK throws on 404; that's our signal the object is absent.
		if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) {
			return false;
		}
		throw err;
	}
}

/**
 * Upload an MP3 to clawdemy-audio at lessons/<slug>-lesson.mp3 with
 * Content-Type audio/mpeg, then verify by HEAD-ing the same object via
 * the S3 endpoint. We avoid the public CF URL for verify too, both to
 * keep the verify side-effect-free and because R2's eventual consistency
 * on the S3 endpoint is faster than CF's revalidation against R2.
 */
async function uploadToR2(slug: string, body: Buffer): Promise<void> {
	const client = getR2Client();
	const key = `${R2_KEY_PREFIX}${slug}-lesson.mp3`;
	await client.send(
		new PutObjectCommand({
			Bucket: R2_BUCKET,
			Key: key,
			Body: body,
			ContentType: 'audio/mpeg',
		}),
	);
	for (let attempt = 0; attempt < 5; attempt++) {
		await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
		try {
			await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }));
			return;
		} catch (err: any) {
			if (err?.name === 'NotFound' || err?.$metadata?.httpStatusCode === 404) {
				continue; // not yet visible; retry
			}
			throw err;
		}
	}
	throw new Error(
		`Upload to R2 PUT succeeded for ${key} but a follow-up HeadObject ` +
			`did not find it after retries. Bucket may be misconfigured.`,
	);
}

// ---------------------------------------------------------------------------
// MDX -> prose
// ---------------------------------------------------------------------------

/**
 * Strip MDX/Markdown to plain prose suitable for narration.
 *
 * Decisions:
 *   - Frontmatter and import lines: dropped.
 *   - Self-closing JSX (illustrations, callouts): dropped. Audio listeners
 *     don't have visuals; prose around the diagram has to stand alone.
 *   - JSX with text children: tags stripped, text kept (so <strong>X</strong>
 *     becomes X). We don't currently use this in lesson bodies but it is
 *     defensive.
 *   - Code blocks (``` ... ```): dropped entirely. Reading code aloud would
 *     be unintelligible. The surrounding prose already explains what the
 *     code shows.
 *   - Inline code (`x`): backticks stripped, content kept.
 *   - Markdown links [label](url): URL dropped, label kept.
 *   - Headings (#, ##, ...): become sentences ending with a period, so the
 *     TTS engine inserts a natural pause.
 *   - List bullets (-, *, 1.): markers stripped; items separated by periods.
 */
export function mdxToProse(mdx: string): string {
	let text = mdx;

	// Frontmatter
	text = text.replace(/^---\n[\s\S]*?\n---\n/, '');

	// Import statements
	text = text.replace(/^\s*import\s+.+?from\s+['"][^'"]+['"];?\s*$/gm, '');

	// JSX expression comments {/* ... */}: drop entirely. They render to nothing
	// in the DOM, so the ReadAlongDim walker never sees their words; narrating
	// them would both speak an internal note aloud (e.g. the "Read-along audio is
	// wired at production-deploy time" marker on 17 lessons) AND push every later
	// word out of sync with the highlight. Stripped before the italic pass so the
	// inner asterisks are never mistaken for emphasis. Found 2026-06-29 on
	// ai-agent-teams L2 while ear-checking the code-lesson narration.
	text = text.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

	// References / bibliography section: drop from the "## References" heading to
	// the end of the document. Bibliography entries are URLs, arXiv IDs, author
	// lists, DOIs, and venue names that the TTS mispronounces ("arXiv:1805.00909"
	// reads as garbage); they are made to be read and clicked, not narrated.
	// Founder rule 2026-06-06 (applies to every render from here on; shipped
	// lessons keep their existing ref-inclusive audio because their MP3 + timing
	// JSON are frozen and are not re-rendered). Safe against the ReadAlongDim
	// walker: References is the LAST section of every lesson, so the timing JSON
	// simply ends earlier and the walker's N = min(words, spans) clamp leaves the
	// still-visible, clickable reference DOM un-highlighted (no mid-document
	// drift, since nothing follows References). Heading-anchored + exact-match so
	// a mid-prose mention of "references" is never caught.
	text = text.replace(/^#{2,3}[ \t]+References[ \t]*$[\s\S]*/m, '');

	// Code blocks (fenced)
	text = text.replace(/```[\s\S]*?```/g, '');

	// Markdown tables: remove entire table rows (header, separator, body).
	// ReadAlongDim's DOM walker only counts highlight words inside BLOCK_TAGS
	// (P / LI / Hn / BLOCKQUOTE); <td> and <th> are NOT block tags, so table
	// cells never enter the read-along word sequence. The narration must drop
	// them too, or every word after a table drifts out of sync with the
	// highlight. (Bug found 2026-05-29 on the-main-nlp-tasks: the audio read
	// the task-map table while the highlight skipped it.) Runs after the
	// fenced-code strip so any pipe characters inside code blocks are already
	// gone. Clawdemy tables use the bracketed-pipe convention (each row starts
	// and ends with |).
	text = text.replace(/^[ \t]*\|.*\|[ \t]*$/gm, '');

	// Self-closing JSX components: <Component ... />
	text = text.replace(/<[A-Z][a-zA-Z0-9]*[^<>]*\/>/g, '');

	// JSX open + close tags (single line). For now we keep inner text; if
	// nested components ever ship in lesson bodies we'll need a real parser.
	text = text.replace(/<\/?[A-Z][a-zA-Z0-9]*[^<>]*>/g, '');

	// Inline code: drop entirely (content included). The DOM walker in
	// <ReadAlongDim /> skips <code> elements, so for the prose-to-DOM word
	// indices to align, we must also skip inline code from the narrated
	// prose. Removed-content trade-off: variable names like `e_cat` no
	// longer get pronounced, which is acceptable because the narrator
	// previously stumbled on them anyway (the same fix we applied for
	// inline-formula bullets on how-models-know-word-order).
	text = text.replace(/`[^`]+`/g, '');

	// Markdown links: [label](url) -> label
	text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

	// Bold and italic: keep content, strip markers
	text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
	text = text.replace(/__([^_]+)__/g, '$1');
	text = text.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1');
	text = text.replace(/(?<!_)_([^_\n]+)_(?!_)/g, '$1');

	// Headings: trailing period for natural pause; keep the text
	text = text.replace(/^#{1,6}\s+(.+)$/gm, '$1.');

	// Bullet markers
	text = text.replace(/^\s*[-*]\s+/gm, '');

	// Numbered list markers
	text = text.replace(/^\s*\d+\.\s+/gm, '');

	// Blockquote markers
	text = text.replace(/^\s*>\s?/gm, '');

	// Horizontal rules
	text = text.replace(/^\s*---+\s*$/gm, '');

	// HTML break tags
	text = text.replace(/<br\s*\/?>/gi, ' ');

	// Trailing backslashes (markdown line breaks)
	text = text.replace(/\\$/gm, '');

	// Pronunciation: ElevenLabs Flash v2.5 sometimes normalizes standalone "AI"
	// to the word "eye" (heard on how-ai-reads-tokens, 2026-06-08). Spelling it
	// "A.I." forces letter-by-letter narration. Word-boundary anchored so it
	// never touches "AI" inside another word (maintain, Hussain, email); the
	// optional ('s|s) group keeps possessive "AI's" and plural "AIs" intact.
	// The second pass collapses "A.I.." (when "AI" ended a sentence) back to a
	// single terminal period. Narration-only: the page still displays "AI".
	// Demo-verified by ear before any R2 regen (CLAUDE.md §8.5).
	text = text.replace(/\bAI('s|s)?\b/g, 'A.I.$1');
	text = text.replace(/A\.I\.\./g, 'A.I.');

	// Collapse whitespace
	text = text.replace(/\n{3,}/g, '\n\n');
	text = text.split('\n').map((l) => l.trim()).join('\n');
	text = text.trim();

	return text;
}

// ---------------------------------------------------------------------------
// Chunking
// ---------------------------------------------------------------------------

/**
 * Split prose into chunks safely under MAX_CHARS_PER_REQUEST. Splits at
 * paragraph boundaries first; if a single paragraph is too large, splits
 * at sentence boundaries.
 */
function chunkProse(prose: string, maxChars = MAX_CHARS_PER_REQUEST): string[] {
	if (prose.length <= maxChars) return [prose];

	const chunks: string[] = [];
	const paragraphs = prose.split(/\n{2,}/);

	let current = '';
	for (const para of paragraphs) {
		const candidate = current ? `${current}\n\n${para}` : para;
		if (candidate.length <= maxChars) {
			current = candidate;
			continue;
		}

		// Flush current
		if (current) {
			chunks.push(current);
			current = '';
		}

		// Paragraph itself fits
		if (para.length <= maxChars) {
			current = para;
			continue;
		}

		// Paragraph too big; split by sentence
		const sentences = para.match(/[^.!?]+[.!?]+\s*/g) ?? [para];
		let buf = '';
		for (const s of sentences) {
			const cand = buf + s;
			if (cand.length <= maxChars) {
				buf = cand;
			} else {
				if (buf) chunks.push(buf.trim());
				buf = s;
			}
		}
		if (buf) chunks.push(buf.trim());
	}
	if (current) chunks.push(current);

	return chunks;
}

// ---------------------------------------------------------------------------
// ElevenLabs API — with-timestamps endpoint
// ---------------------------------------------------------------------------

interface TimestampsResponse {
	audio: Buffer;
	characters: string[];
	charStarts: number[];
	charEnds: number[];
}

/**
 * Single call to /v1/text-to-speech/{voice}/with-timestamps. Returns the
 * MP3 audio AND character-level alignment in the SAME response object
 * (per advisor's guidance — splitting into two requests would drift
 * because TTS is non-deterministic).
 *
 * Error path: non-200 throws (caller exits non-zero, never writes partial
 * output). 429 with Retry-After triggers a single retry after the
 * recommended delay before giving up — avoids losing a render to a
 * transient rate limit mid-batch.
 */
async function ttsRequestWithTimestamps(
	text: string,
	voiceId: string,
	attempt: number = 0,
): Promise<TimestampsResponse> {
	const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`;
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'xi-api-key': ELEVENLABS_API_KEY!,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			text,
			model_id: MODEL_ID,
			voice_settings: {
				stability: 0.5,
				similarity_boost: 0.75,
				style: 0,
				use_speaker_boost: true,
			},
		}),
	});

	if (response.status === 429 && attempt === 0) {
		const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
		console.warn(
			`  ! 429 rate-limited; sleeping ${retryAfter}s then retrying once`,
		);
		await new Promise((r) => setTimeout(r, retryAfter * 1000));
		return ttsRequestWithTimestamps(text, voiceId, attempt + 1);
	}

	if (!response.ok) {
		const body = await response.text();
		throw new Error(
			`ElevenLabs API ${response.status} ${response.statusText}: ${body.slice(0, 500)}`,
		);
	}

	const json = (await response.json()) as {
		audio_base64: string;
		alignment: {
			characters: string[];
			character_start_times_seconds: number[];
			character_end_times_seconds: number[];
		};
	};

	if (!json.audio_base64 || !json.alignment) {
		throw new Error(
			`ElevenLabs response missing audio_base64 or alignment: ${JSON.stringify(json).slice(0, 200)}`,
		);
	}

	return {
		audio: Buffer.from(json.audio_base64, 'base64'),
		characters: json.alignment.characters,
		charStarts: json.alignment.character_start_times_seconds,
		charEnds: json.alignment.character_end_times_seconds,
	};
}

// ---------------------------------------------------------------------------
// Character → word conversion
// ---------------------------------------------------------------------------

interface WordTiming {
	text: string;
	start: number;
	end: number;
}

/**
 * Group ElevenLabs character-level alignment into word-level timings,
 * with a cumulative offset for the rare case of multi-chunk lessons.
 *
 * Word boundaries: any whitespace character (`\s`). Punctuation stays
 * attached to the word it touches (matches how the DOM walker tokenizes).
 *
 * Whitespace chars themselves get no entry — their timestamps from the
 * API may be zero / undefined since they're not pronounced. We skip
 * them entirely; the next non-whitespace char becomes the next word's
 * start.
 *
 * NFC normalization applied to the word text so MDX-side curly quotes
 * (U+2019) and ElevenLabs-returned straight quotes (U+0027) don't
 * spuriously fail equality checks downstream.
 */
function charactersToWords(
	chars: string[],
	starts: number[],
	ends: number[],
	offset: number = 0,
): WordTiming[] {
	const out: WordTiming[] = [];
	let buf = '';
	let bufStart: number | null = null;
	let bufEnd = 0;
	for (let i = 0; i < chars.length; i++) {
		const c = chars[i];
		if (/\s/.test(c)) {
			if (buf) {
				out.push({
					text: buf.normalize('NFC'),
					start: (bufStart ?? 0) + offset,
					end: bufEnd + offset,
				});
				buf = '';
				bufStart = null;
			}
			continue;
		}
		if (buf === '') {
			bufStart = starts[i];
		}
		buf += c;
		bufEnd = ends[i];
	}
	if (buf) {
		out.push({
			text: buf.normalize('NFC'),
			start: (bufStart ?? 0) + offset,
			end: bufEnd + offset,
		});
	}
	return out;
}

// ---------------------------------------------------------------------------
// ffmpeg Xing-header rewrite + backup helpers
// ---------------------------------------------------------------------------

/**
 * Rewrite the MP3 Xing/Info VBR seek header at the start of the file to
 * reflect the entire file's frame count and duration. Critical when we
 * Buffer.concat multiple ElevenLabs MP3 chunks: each chunk arrives as a
 * complete MP3 with its own Xing header, and a naive concat would leave
 * Chrome consulting only chunk 1's header on seek (the documented cause
 * of the t=25.6s eviction-reseek bug). Defensive even for single-chunk
 * output — same code path, same guarantee.
 *
 * `-c:a copy` means no re-encode: zero quality loss, fast. The whole
 * pass runs in well under a second on a typical lesson.
 */
async function rewriteXingHeader(mp3Path: string): Promise<void> {
	const tmp = mp3Path + '.tmp.mp3';
	await new Promise<void>((resolve, reject) => {
		const ff = spawn(FFMPEG, [
			'-y',
			'-i', mp3Path,
			'-c:a', 'copy',
			'-write_xing', '1',
			'-map_metadata', '0',
			tmp,
		]);
		let stderr = '';
		ff.stderr.on('data', (d) => {
			stderr += d.toString();
		});
		ff.on('error', reject);
		ff.on('exit', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-500)}`));
		});
	});
	await rename(tmp, mp3Path);
}

/**
 * Copy the existing MP3 + timing JSON to public/audio/.backup/ with a
 * timestamp suffix BEFORE an --force overwrite. Cheap rollback insurance
 * if the freshly-rendered audio sounds noticeably worse than the prior
 * version. Cleaned up manually when no longer needed.
 */
async function backupExistingArtifacts(slug: string): Promise<void> {
	const mp3 = join(AUDIO_OUT, `${slug}-lesson.mp3`);
	const timing = join(TIMING_OUT, `${slug}.timing.json`);
	if (!existsSync(mp3) && !existsSync(timing)) return;
	await mkdir(BACKUP_DIR, { recursive: true });
	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	if (existsSync(mp3)) {
		await copyFile(mp3, join(BACKUP_DIR, `${slug}-lesson.${stamp}.mp3`));
	}
	if (existsSync(timing)) {
		await copyFile(timing, join(BACKUP_DIR, `${slug}.timing.${stamp}.json`));
	}
}

// ---------------------------------------------------------------------------
// Lesson discovery
// ---------------------------------------------------------------------------

interface Lesson {
	track: string;
	slug: string;
	dir: string;
	mdxPath: string;
}

async function findLessons(): Promise<Lesson[]> {
	const out: Lesson[] = [];
	const tracks = await readdir(LESSONS_ROOT, { withFileTypes: true });
	for (const track of tracks) {
		if (!track.isDirectory()) continue;
		const trackPath = join(LESSONS_ROOT, track.name);
		const slugs = await readdir(trackPath, { withFileTypes: true });
		for (const slug of slugs) {
			if (!slug.isDirectory()) continue;
			const dir = join(trackPath, slug.name);
			const mdxPath = join(dir, 'lesson.mdx');
			if (existsSync(mdxPath)) {
				out.push({ track: track.name, slug: slug.name, dir, mdxPath });
			}
		}
	}
	return out;
}

// ---------------------------------------------------------------------------
// Generate
// ---------------------------------------------------------------------------

/**
 * Upload the local MP3 for a slug to R2, idempotent by default: if the
 * R2 bucket already has a copy at the target key, skip. Used both by the
 * render path (after a fresh write) and by --upload-only mode.
 *
 * Pass `force: true` to overwrite an existing R2 object. Required when
 * the lesson body has been revised: a fresh render lands locally with a
 * new hash, but the R2 object at the same key still holds the old audio,
 * so listeners would keep hearing the prior version until manual purge.
 */
async function ensureUploadedToR2(
	slug: string,
	opts: { force?: boolean } = {},
): Promise<'uploaded' | 'already'> {
	if (!opts.force && (await isAlreadyUploaded(slug))) {
		console.log(`= R2      ${slug.padEnd(30)} already uploaded`);
		return 'already';
	}
	const localPath = join(AUDIO_OUT, `${slug}-lesson.mp3`);
	if (!existsSync(localPath)) {
		throw new Error(
			`Cannot upload ${slug}: no local MP3 at ${localPath}. Run audio:generate ` +
				`without --upload-only first to render it, or remove --upload-only.`,
		);
	}
	const body = await readFile(localPath);
	const sizeMb = (body.length / 1024 / 1024).toFixed(2);
	process.stdout.write(`> upload  ${slug.padEnd(30)} ${sizeMb} MB...`);
	await uploadToR2(slug, body);
	console.log(' ok');
	return 'uploaded';
}

async function generateOne(
	lesson: Lesson,
	opts: { dryRun: boolean; force: boolean; upload: boolean },
) {
	const mdx = await readFile(lesson.mdxPath, 'utf-8');
	const prose = mdxToProse(mdx);
	const hash = createHash('sha256').update(prose).digest('hex');

	const outMp3 = join(AUDIO_OUT, `${lesson.slug}-lesson.mp3`);
	const outHash = join(AUDIO_OUT, `${lesson.slug}-lesson.hash`);
	const outTiming = join(TIMING_OUT, `${lesson.slug}.timing.json`);

	const cached =
		!opts.force &&
		existsSync(outMp3) &&
		existsSync(outHash) &&
		existsSync(outTiming) &&
		(await readFile(outHash, 'utf-8')).trim() === hash;

	const chunks = chunkProse(prose);
	const estCost = (prose.length / 1000) * COST_PER_1K_CHARS;

	const meta = {
		slug: lesson.slug,
		chars: prose.length,
		chunks: chunks.length,
		cached,
		estCost: `$${estCost.toFixed(2)}`,
	};

	if (cached) {
		console.log(`= cached  ${lesson.slug.padEnd(30)} ${prose.length} chars`);
		if (opts.upload) {
			await ensureUploadedToR2(lesson.slug, { force: opts.force });
		}
		return meta;
	}

	if (opts.dryRun) {
		console.log(`~ dry-run ${lesson.slug.padEnd(30)} ${prose.length} chars in ${chunks.length} chunk(s), est ${meta.estCost}`);
		console.log('  ---- prose preview (first 400 chars) ----');
		console.log('  ' + prose.slice(0, 400).replace(/\n/g, '\n  '));
		console.log('  ---- end preview ----');
		return meta;
	}

	if (!ELEVENLABS_API_KEY) {
		throw new Error(
			'ELEVENLABS_API_KEY missing. Copy .env.example to .env and add your key.',
		);
	}

	// Backup existing artifacts before --force overwrite (advisor's
	// rollback-insurance ask). No-op if nothing existed yet.
	if (opts.force) {
		await backupExistingArtifacts(lesson.slug);
	}

	const voiceId = resolveVoiceId(lesson.track);
	process.stdout.write(`> render  ${lesson.slug.padEnd(30)} ${chunks.length} chunk(s), voice ${voiceId} (track: ${lesson.track})...`);
	await mkdir(AUDIO_OUT, { recursive: true });
	await mkdir(TIMING_OUT, { recursive: true });

	const audioBuffers: Buffer[] = [];
	const allWords: WordTiming[] = [];
	let cumulativeOffset = 0;

	for (let i = 0; i < chunks.length; i++) {
		const result = await ttsRequestWithTimestamps(chunks[i], voiceId);
		audioBuffers.push(result.audio);
		const words = charactersToWords(
			result.characters,
			result.charStarts,
			result.charEnds,
			cumulativeOffset,
		);
		allWords.push(...words);
		// Advance the cumulative offset by this chunk's last-character
		// end time. Per advisor's call: use the alignment's own duration
		// (in seconds), not byte length or character count.
		if (result.charEnds.length > 0) {
			cumulativeOffset += result.charEnds[result.charEnds.length - 1];
		}
		process.stdout.write(` ${i + 1}/${chunks.length}`);
	}

	// Concat audio and write to disk before the ffmpeg pass.
	const merged = Buffer.concat(audioBuffers);
	await writeFile(outMp3, merged);
	await writeFile(outHash, hash);

	// Defensive Xing-header rewrite. Single-chunk output gets it too
	// (cheap, ensures Chrome's seek table is always correct regardless
	// of chunk count).
	await rewriteXingHeader(outMp3);

	// Compute match-rate sanity. Compares the count of ElevenLabs-aligned
	// words to the count of words in the source prose (whitespace split,
	// filter empties, NFC normalize). On Flash v2.5 this should be very
	// near 100% on every run; a dip below 95% is signal of a chunking
	// or character-grouping bug, not normal drift.
	const proseWords = prose
		.split(/\s+/)
		.filter(Boolean)
		.map((w) => w.normalize('NFC'));
	const matched = allWords.length;
	const matchRate = proseWords.length > 0 ? matched / proseWords.length : 0;
	const matchPct = (matchRate * 100).toFixed(1);

	await writeFile(
		outTiming,
		JSON.stringify(
			{
				schema_version: 2,
				slug: lesson.slug,
				audio_url: `${R2_PUBLIC_BASE}lessons/${lesson.slug}-lesson.mp3`,
				model_id: MODEL_ID,
				generated_at: new Date().toISOString(),
				stats: {
					prose_chars: prose.length,
					prose_words: proseWords.length,
					matched_words: matched,
					match_rate: Math.round(matchRate * 10000) / 10000,
					chunks: chunks.length,
				},
				words: allWords,
			},
			null,
			2,
		) + '\n',
	);

	const sizeMb = (merged.length / 1024 / 1024).toFixed(2);
	console.log(
		` ok ${sizeMb} MB | ${prose.length} chars | ${matched} words | match ${matchPct}% | ${meta.estCost}`,
	);

	if (matchRate < 0.95) {
		console.warn(
			`  ! match rate ${matchPct}% is below 95% threshold. Inspect ${outTiming} before shipping.`,
		);
	}

	if (opts.upload) {
		await ensureUploadedToR2(lesson.slug, { force: opts.force });
	}

	return meta;
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

async function main() {
	const args = process.argv.slice(2);
	const all = args.includes('--all');
	const list = args.includes('--list');
	const dryRun = args.includes('--dry-run');
	const force = args.includes('--force');
	const noUpload = args.includes('--no-upload');
	const uploadOnly = args.includes('--upload-only');
	const slug = args.find((a) => !a.startsWith('--'));

	if (noUpload && uploadOnly) {
		console.error('--no-upload and --upload-only are mutually exclusive.');
		process.exit(1);
	}
	// --dry-run is a render-flow flag and is meaningless in upload-only mode.
	// --force IS valid with --upload-only: it means "overwrite R2 with the
	// existing local MP3 even if R2 already has a copy at the target key."
	if (uploadOnly && dryRun) {
		console.error('--upload-only cannot be combined with --dry-run.');
		process.exit(1);
	}

	const lessons = await findLessons();

	if (list) {
		console.log('Lessons with lesson.mdx:');
		for (const l of lessons) {
			console.log(`  ${l.slug}  (${l.track})`);
		}
		return;
	}

	let targets: Lesson[] = [];
	if (all) {
		targets = lessons;
	} else if (slug) {
		const found = lessons.find((l) => l.slug === slug);
		if (!found) {
			console.error(`Lesson not found: ${slug}`);
			console.error('Run with --list to see available slugs.');
			process.exit(1);
		}
		targets = [found];
	} else {
		console.error('Usage:');
		console.error('  bun run audio:generate <slug>                  # render + upload');
		console.error('  bun run audio:generate --all                    # every lesson, render + upload');
		console.error('  bun run audio:generate --no-upload <slug>       # render locally, skip R2');
		console.error('  bun run audio:generate --upload-only <slug>     # upload existing local MP3, no render');
		console.error('  bun run audio:generate --upload-only --all      # upload every existing local MP3');
		console.error('  bun run audio:generate --dry-run <slug>         # preview prose, no API call');
		console.error('  bun run audio:generate --list                   # show available slugs');
		process.exit(1);
	}

	if (uploadOnly) {
		// Skip the render path entirely; just sync existing local MP3s to R2.
		// Dry-run is intentionally not supported here; the upload either happens or it doesn't.
		let uploadedCount = 0;
		let alreadyCount = 0;
		for (const lesson of targets) {
			const result = await ensureUploadedToR2(lesson.slug, { force });
			if (result === 'uploaded') uploadedCount++;
			else alreadyCount++;
		}
		if (targets.length > 1) {
			console.log('---');
			console.log(`total: ${targets.length} lesson(s)`);
			console.log(`uploaded: ${uploadedCount}, already on R2: ${alreadyCount}`);
		}
		return;
	}

	const upload = !noUpload && !dryRun;
	let totalChars = 0;
	let totalCachedChars = 0;
	for (const lesson of targets) {
		const meta = await generateOne(lesson, { dryRun, force, upload });
		totalChars += meta.chars;
		if (meta.cached) totalCachedChars += meta.chars;
	}

	if (targets.length > 1) {
		const billable = totalChars - totalCachedChars;
		const cost = (billable / 1000) * 0.3;
		console.log('---');
		console.log(`total: ${targets.length} lesson(s)`);
		console.log(`billable chars: ${billable} (skipped ${totalCachedChars} cached)`);
		console.log(`estimated cost: $${cost.toFixed(2)}`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

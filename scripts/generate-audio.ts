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
 *   3. (Optional) Adjust the voice ID.
 *
 * Usage:
 *   bun run audio:generate <slug>           # one lesson by slug
 *   bun run audio:generate --all            # every lesson on the site
 *   bun run audio:generate --list           # show what would generate
 *   bun run audio:generate --dry-run <slug> # preview prose, no API call
 *
 * Lesson slugs are the directory names under
 *   src/content/docs/lessons/<track>/<slug>/
 *
 * Pricing context (consumer ElevenLabs tiers): about $0.30 per 1,000
 * characters. A typical 12,000-character Clawdemy lesson runs about
 * $3.60 at full re-render. Hash caching means most runs cost $0.
 */

import { mkdir, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'GuflK5NRKwVLKwEeBYTy';
const MODEL_ID = 'eleven_multilingual_v2';

// ElevenLabs limits per-request character counts depending on plan.
// 2,500 is a safe ceiling that works on every paid tier; chunks above
// this size are split at paragraph boundaries.
const MAX_CHARS_PER_REQUEST = 2500;

const LESSONS_ROOT = 'src/content/docs/lessons';
const AUDIO_OUT = 'public/audio';

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

	// Code blocks (fenced)
	text = text.replace(/```[\s\S]*?```/g, '');

	// Self-closing JSX components: <Component ... />
	text = text.replace(/<[A-Z][a-zA-Z0-9]*[^<>]*\/>/g, '');

	// JSX open + close tags (single line). For now we keep inner text; if
	// nested components ever ship in lesson bodies we'll need a real parser.
	text = text.replace(/<\/?[A-Z][a-zA-Z0-9]*[^<>]*>/g, '');

	// Inline code: keep content
	text = text.replace(/`([^`]+)`/g, '$1');

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
// ElevenLabs API
// ---------------------------------------------------------------------------

async function ttsRequest(text: string): Promise<Buffer> {
	const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'xi-api-key': ELEVENLABS_API_KEY!,
			'Content-Type': 'application/json',
			Accept: 'audio/mpeg',
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

	if (!response.ok) {
		const body = await response.text();
		throw new Error(
			`ElevenLabs API ${response.status} ${response.statusText}: ${body}`,
		);
	}

	return Buffer.from(await response.arrayBuffer());
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

async function generateOne(lesson: Lesson, opts: { dryRun: boolean; force: boolean }) {
	const mdx = await readFile(lesson.mdxPath, 'utf-8');
	const prose = mdxToProse(mdx);
	const hash = createHash('sha256').update(prose).digest('hex');

	const outMp3 = join(AUDIO_OUT, `${lesson.slug}-lesson.mp3`);
	const outHash = join(AUDIO_OUT, `${lesson.slug}-lesson.hash`);

	const cached =
		!opts.force &&
		existsSync(outMp3) &&
		existsSync(outHash) &&
		(await readFile(outHash, 'utf-8')).trim() === hash;

	const chunks = chunkProse(prose);
	const estCost = (prose.length / 1000) * 0.3; // ~$0.30 per 1k chars at consumer tier

	const meta = {
		slug: lesson.slug,
		chars: prose.length,
		chunks: chunks.length,
		cached,
		estCost: `$${estCost.toFixed(2)}`,
	};

	if (cached) {
		console.log(`= cached  ${lesson.slug.padEnd(30)} ${prose.length} chars`);
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

	process.stdout.write(`> render  ${lesson.slug.padEnd(30)} ${chunks.length} chunk(s)...`);
	await mkdir(AUDIO_OUT, { recursive: true });

	const buffers: Buffer[] = [];
	for (let i = 0; i < chunks.length; i++) {
		const buf = await ttsRequest(chunks[i]);
		buffers.push(buf);
		process.stdout.write(` ${i + 1}/${chunks.length}`);
	}

	const merged = Buffer.concat(buffers);
	await writeFile(outMp3, merged);
	await writeFile(outHash, hash);

	const sizeMb = (merged.length / 1024 / 1024).toFixed(2);
	console.log(` ok ${sizeMb} MB, ${meta.estCost}`);
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
	const slug = args.find((a) => !a.startsWith('--'));

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
		console.error('Usage: bun run audio:generate <slug> | --all | --list');
		console.error('       bun run audio:generate --dry-run <slug>');
		process.exit(1);
	}

	let totalChars = 0;
	let totalCachedChars = 0;
	for (const lesson of targets) {
		const meta = await generateOne(lesson, { dryRun, force });
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

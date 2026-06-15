/**
 * One-off: narrate RBJ Global engineering retrospectives via ElevenLabs,
 * WITH word-level read-along timing (Clawdemy-style grey-out).
 *
 * Cross-project helper (NOT part of the Clawdemy lesson pipeline). Reuses
 * Clawdemy's ElevenLabs API key + the same model/voice-settings baseline
 * and the same character->word alignment + Xing-header discipline, but
 * reads plain prose .txt sources, uses RBJ's male voice, and writes to the
 * rbjglobal-site public dirs (no R2).
 *
 * Outputs per article:
 *   - public/audio/engineering/<slug>.mp3            (96 kbps mono, Xing-fixed)
 *   - public/read-along/<slug>.timing.json           ({text,start,end}[] words)
 *
 * IMPORTANT (read-along invariant): word N of the timing JSON corresponds to
 * word N of the SPOKEN narration. For the grey-out to track on screen, the
 * displayed article body must render the SAME words in the SAME order (i.e.
 * rendered FROM narration.txt). See CLAUDE.md S8.3.
 *
 * Run from the clawdemy project root so bun auto-loads clawdemy/.env:
 *   bun run scripts/gen-rbj-audio.ts
 */

import { readFile, writeFile, stat, mkdir, rename } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
if (!ELEVENLABS_API_KEY) {
	console.error('ELEVENLABS_API_KEY missing from env (.env in cwd).');
	process.exit(1);
}

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

// Founder-chosen RBJ Global male voice (deliberately NOT Clawdemy's voice).
const VOICE_ID = 'UgBBYS2sOqTuMpoF3BR0';
const MODEL_ID = 'eleven_flash_v2_5';
const VOICE_SETTINGS = { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true };

const SRC_DIR = '/Users/junaidsiddiqi/Projects/rbjglobal-site/app/engineering';
const AUDIO_OUT = '/Users/junaidsiddiqi/Projects/rbjglobal-site/public/audio/engineering';
const TIMING_OUT = '/Users/junaidsiddiqi/Projects/rbjglobal-site/public/read-along';

const JOBS = ['orchestrating-ai-agent-fleets', 'building-claudelink', 'mdx-brace-trap'];

interface WordTiming { text: string; start: number; end: number; }

/** Group ElevenLabs char-level alignment into word-level timings (verbatim
 *  port of Clawdemy generate-audio.ts charactersToWords). */
function charactersToWords(chars: string[], starts: number[], ends: number[]): WordTiming[] {
	const out: WordTiming[] = [];
	let buf = '';
	let bufStart: number | null = null;
	let bufEnd = 0;
	for (let i = 0; i < chars.length; i++) {
		const c = chars[i];
		if (/\s/.test(c)) {
			if (buf) {
				out.push({ text: buf.normalize('NFC'), start: bufStart ?? 0, end: bufEnd });
				buf = '';
				bufStart = null;
			}
			continue;
		}
		if (buf === '') bufStart = starts[i];
		buf += c;
		bufEnd = ends[i];
	}
	if (buf) out.push({ text: buf.normalize('NFC'), start: bufStart ?? 0, end: bufEnd });
	return out;
}

interface Aligned { mp3: Buffer; words: WordTiming[]; }

async function ttsWithTimestamps(text: string, attempt = 0): Promise<Aligned> {
	const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=mp3_44100_96`;
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'xi-api-key': ELEVENLABS_API_KEY!, 'Content-Type': 'application/json' },
		body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
	});

	if (response.status === 429 && attempt === 0) {
		const retryAfter = parseInt(response.headers.get('retry-after') || '5', 10);
		console.warn(`  ! 429 rate-limited; sleeping ${retryAfter}s then retrying once`);
		await new Promise((r) => setTimeout(r, retryAfter * 1000));
		return ttsWithTimestamps(text, attempt + 1);
	}
	if (!response.ok) {
		const body = await response.text();
		throw new Error(`ElevenLabs API ${response.status} ${response.statusText}: ${body.slice(0, 500)}`);
	}

	const json = (await response.json()) as {
		audio_base64: string;
		alignment: { characters: string[]; character_start_times_seconds: number[]; character_end_times_seconds: number[]; };
	};
	if (!json.audio_base64 || !json.alignment) {
		throw new Error(`Response missing audio_base64 or alignment: ${JSON.stringify(json).slice(0, 200)}`);
	}
	const mp3 = Buffer.from(json.audio_base64, 'base64');
	if (mp3.byteLength < 1000) throw new Error(`Suspiciously small audio (${mp3.byteLength} bytes)`);
	const words = charactersToWords(
		json.alignment.characters,
		json.alignment.character_start_times_seconds,
		json.alignment.character_end_times_seconds,
	);
	return { mp3, words };
}

/** Rewrite the MP3 Xing/Info VBR seek header so Chrome seeks correctly
 *  (defensive port of Clawdemy rewriteXingHeader; matters on long files). */
async function rewriteXingHeader(mp3Path: string): Promise<void> {
	const tmp = mp3Path + '.tmp.mp3';
	await new Promise<void>((resolve, reject) => {
		const ff = spawn(FFMPEG, ['-y', '-i', mp3Path, '-c:a', 'copy', '-write_xing', '1', '-map_metadata', '0', tmp]);
		let stderr = '';
		ff.stderr.on('data', (d) => { stderr += d.toString(); });
		ff.on('error', reject);
		ff.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-500)}`))));
	});
	await rename(tmp, mp3Path);
}

await mkdir(AUDIO_OUT, { recursive: true });
await mkdir(TIMING_OUT, { recursive: true });

let totalChars = 0;
for (const slug of JOBS) {
	const text = (await readFile(`${SRC_DIR}/${slug}/narration.txt`, 'utf8')).trim();
	totalChars += text.length;
	console.log(`\n>>> ${slug}  (${text.length} chars)`);
	const { mp3, words } = await ttsWithTimestamps(text);
	const mp3Path = `${AUDIO_OUT}/${slug}.mp3`;
	await writeFile(mp3Path, mp3);
	await rewriteXingHeader(mp3Path);
	const timingPath = `${TIMING_OUT}/${slug}.timing.json`;
	await writeFile(timingPath, JSON.stringify(words));
	const { size } = await stat(mp3Path);
	const dur = words.length ? words[words.length - 1].end : 0;
	console.log(`    mp3   ${mp3Path}  (${(size / 1024 / 1024).toFixed(2)} MB, ~${(dur / 60).toFixed(1)} min)`);
	console.log(`    timing ${timingPath}  (${words.length} words)`);
}

console.log(`\nDONE. ${JOBS.length} files, ${totalChars} total chars.`);
console.log(`with-timestamps is the SAME price as plain TTS on Flash v2.5 (no premium) => ~same ${totalChars}-char cost as the first pass. Pull real cost from the ElevenLabs dashboard.`);

// Wire <ReadAlongDim> into BARE lessons of a track (frontmatter -> prose, no
// existing ReadAlongDim, no {/* placeholder comments). Usage:
//   bun scripts/wire-readalong.mjs <track> [cacheVersion]
// Idempotent. Computes approxMinutes from each rendered MP3. Skips lessons
// that already have ReadAlongDim, that lack an MP3, or that contain {/*
// placeholder comments (those need bespoke wiring -- not handled here).
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';

const track = process.argv[2];
const cacheVersion = process.argv[3] || '20260605';
if (!track) { console.error('usage: wire-readalong.mjs <track> [cacheVersion]'); process.exit(1); }
const ROOT = `src/content/docs/lessons/${track}`;
const FFPROBE = '/opt/homebrew/bin/ffprobe';

for (const slug of readdirSync(ROOT)) {
	const file = `${ROOT}/${slug}/lesson.mdx`;
	const mp3 = `public/audio/${slug}-lesson.mp3`;
	if (!existsSync(file)) continue;
	let content = readFileSync(file, 'utf8');
	if (content.includes('ReadAlongDim')) { console.log(`skip (wired): ${slug}`); continue; }
	if (content.includes('{/*')) { console.log(`SKIP (has placeholder, needs bespoke): ${slug}`); continue; }
	if (!existsSync(mp3)) { console.log(`SKIP (no mp3): ${slug}`); continue; }

	const sec = parseFloat(execSync(`${FFPROBE} -v error -show_entries format=duration -of default=nk=1:nw=1 ${mp3}`).toString().trim());
	const mins = Math.round(sec / 60);

	const lines = content.split('\n');
	const dashes = [];
	for (let i = 0; i < lines.length; i++) if (lines[i] === '---') dashes.push(i);
	if (dashes.length < 2) { console.log(`NO frontmatter close: ${slug}`); continue; }
	const close = dashes[1];
	const block = [
		'',
		"import ReadAlongDim from '../../../../../components/ReadAlongDim.astro';",
		'',
		'<ReadAlongDim',
		`  src="https://audio.clawdemy.org/lessons/${slug}-lesson.mp3"`,
		`  slug="${slug}"`,
		`  cacheVersion="${cacheVersion}"`,
		`  approxMinutes={${mins}}`,
		'/>',
	];
	writeFileSync(file, [...lines.slice(0, close + 1), ...block, ...lines.slice(close + 1)].join('\n'));
	console.log(`wired: ${slug}  (${sec.toFixed(0)}s -> ${mins} min)`);
}

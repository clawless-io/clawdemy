// Correct approxMinutes={N} in each lesson of a track from the real MP3
// duration. Usage: bun scripts/fix-approx-minutes.mjs <track>
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
const track = process.argv[2];
const ROOT = `src/content/docs/lessons/${track}`;
const FFPROBE = '/opt/homebrew/bin/ffprobe';
for (const slug of readdirSync(ROOT)) {
	const file = `${ROOT}/${slug}/lesson.mdx`;
	const mp3 = `public/audio/${slug}-lesson.mp3`;
	if (!existsSync(file) || !existsSync(mp3)) continue;
	let c = readFileSync(file, 'utf8');
	if (!c.includes('approxMinutes=')) continue;
	const sec = parseFloat(execSync(`${FFPROBE} -v error -show_entries format=duration -of default=nk=1:nw=1 ${mp3}`).toString().trim());
	const mins = Math.round(sec / 60);
	const next = c.replace(/approxMinutes=\{\d+\}/, `approxMinutes={${mins}}`);
	if (next !== c) { writeFileSync(file, next); console.log(`${slug}: approxMinutes -> ${mins} (${sec.toFixed(0)}s)`); }
}

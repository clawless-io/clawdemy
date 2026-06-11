// T23 bespoke wiring: replace the commented LessonFreshness + SourceLecture
// placeholders with LIVE JSX (they narrate as garbage otherwise, CLAUDE.md
// §8.4) and add ReadAlongDim. approxMinutes is estimated from word count here
// (pre-render); fix-approx-minutes.mjs corrects it from the real MP3 after.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const ROOT = 'src/content/docs/lessons/ai-safety-and-alignment';
const CV = '20260605';

for (const slug of readdirSync(ROOT)) {
	const file = `${ROOT}/${slug}/lesson.mdx`;
	if (!existsSync(file)) continue;
	let content = readFileSync(file, 'utf8');
	if (content.includes('ReadAlongDim')) { console.log(`skip (wired): ${slug}`); continue; }

	// Extract the live SourceLecture JSX from inside the placeholder comment.
	const slMatch = content.match(/<SourceLecture[^>]*\/>/);
	if (!slMatch) { console.log(`NO SourceLecture in ${slug} -- skipping`); continue; }
	const sourceLecture = slMatch[0];

	// Remove the two placeholder comment lines entirely.
	const lines = content.split('\n').filter((l) => !l.includes('COMPONENT PLACEHOLDER'));

	// Estimate listening minutes from body word count (~150 wpm narration).
	let fc = false, words = 0, inFm = false, dashes = 0;
	for (const l of lines) {
		const t = l.trim();
		if (t === '---') { dashes++; inFm = dashes < 2; continue; }
		if (dashes < 2) continue;            // frontmatter
		if (t.startsWith('```')) { fc = !fc; continue; }
		if (fc || t.startsWith('<') || t.startsWith('import ')) continue;
		words += t.split(/\s+/).filter(Boolean).length;
	}
	const mins = Math.max(1, Math.round(words / 150));

	// Find frontmatter close and insert the wiring block.
	const idx = lines.findIndex((l, i) => l === '---' && lines.slice(0, i).includes('---'));
	const block = [
		'',
		"import ReadAlongDim from '../../../../../components/ReadAlongDim.astro';",
		"import LessonFreshness from '../../../../../components/LessonFreshness.astro';",
		"import SourceLecture from '../../../../../components/SourceLecture.astro';",
		'',
		'<ReadAlongDim',
		`  src="https://audio.clawdemy.org/lessons/${slug}-lesson.mp3"`,
		`  slug="${slug}"`,
		`  cacheVersion="${CV}"`,
		`  approxMinutes={${mins}}`,
		'/>',
		'',
		'<LessonFreshness lastReviewed={frontmatter.last_reviewed} />',
		'',
		sourceLecture,
	];
	const out = [...lines.slice(0, idx + 1), ...block, ...lines.slice(idx + 1)].join('\n');
	writeFileSync(file, out);
	console.log(`wired: ${slug}  (~${mins} min est, SourceLecture preserved)`);
}

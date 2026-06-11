// Generic wiring for lessons whose chrome is commented placeholders of the
// form {/* ... <LessonFreshness lastReviewed={frontmatter.last_reviewed} /> ... */}
// and {/* ... <SourceLecture url=... title=... instructor=... /> ... */}.
// Replaces them with LIVE JSX (they narrate as garbage otherwise, §8.4) and
// adds ReadAlongDim. approxMinutes estimated from word count; corrected later
// by fix-approx-minutes.mjs. Usage: bun scripts/wire-fss.mjs <track> [cacheVersion]
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
const track = process.argv[2];
const CV = process.argv[3] || '20260605';
const ROOT = `src/content/docs/lessons/${track}`;
for (const slug of readdirSync(ROOT)) {
	const file = `${ROOT}/${slug}/lesson.mdx`;
	if (!existsSync(file)) continue;
	let content = readFileSync(file, 'utf8');
	if (content.includes('ReadAlongDim')) { console.log(`skip (wired): ${slug}`); continue; }
	const sl = content.match(/<SourceLecture[^>]*\/>/);
	if (!sl) { console.log(`NO SourceLecture placeholder: ${slug} -- skipping`); continue; }
	const lines = content.split('\n').filter((l) => !l.includes('COMPONENT PLACEHOLDER'));
	// word count estimate
	let fc = false, dashes = 0, words = 0;
	for (const l of lines) {
		const t = l.trim();
		if (t === '---') { dashes++; continue; }
		if (dashes < 2) continue;
		if (t.startsWith('```')) { fc = !fc; continue; }
		if (fc || t.startsWith('<') || t.startsWith('import ') || /^\|.*\|$/.test(t)) continue;
		words += t.split(/\s+/).filter(Boolean).length;
	}
	const mins = Math.max(1, Math.round(words / 150));
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
		sl[0],
	];
	writeFileSync(file, [...lines.slice(0, idx + 1), ...block, ...lines.slice(idx + 1)].join('\n'));
	console.log(`wired: ${slug} (~${mins} min est)`);
}

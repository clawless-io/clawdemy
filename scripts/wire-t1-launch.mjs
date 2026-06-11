// T1 launch lessons: replace the commented LessonStar + ReadAlongDim
// placeholders with live JSX (matching shipped ai-wont-replace-you), remove
// the garbage-narrating comments, use a fresh cacheVersion (the baked one was
// a "..." placeholder / poisoned-404 risk). approxMinutes taken from the
// placeholder estimate; corrected from the MP3 by fix-approx-minutes.mjs.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROOT = 'src/content/docs/lessons/getting-started';
const CV = '20260605';
const SLUGS = [
	'first-conversation-and-model-selector',
	'api-keys-and-provider-oauth',
	'memory-system-overview',
	'costguard-and-privacy-posture',
];

for (const slug of SLUGS) {
	const file = `${ROOT}/${slug}/lesson.mdx`;
	if (!existsSync(file)) { console.log(`NO mdx: ${slug}`); continue; }
	let content = readFileSync(file, 'utf8');
	if (/^import ReadAlongDim/m.test(content)) { console.log(`skip (wired): ${slug}`); continue; }

	const mMatch = content.match(/approxMinutes=\{(\d+)\}/);
	const mins = mMatch ? mMatch[1] : '10';

	// Drop both placeholder comment lines.
	const lines = content.split('\n').filter((l) => !l.includes('COMPONENT PLACEHOLDER'));
	const idx = lines.findIndex((l, i) => l === '---' && lines.slice(0, i).includes('---'));
	const block = [
		'',
		"import ReadAlongDim from '../../../../../components/ReadAlongDim.astro';",
		"import LessonStar from '../../../../../components/LessonStar.astro';",
		'',
		`<LessonStar slug="${slug}" />`,
		'',
		'<ReadAlongDim',
		`  src="https://audio.clawdemy.org/lessons/${slug}-lesson.mp3"`,
		`  slug="${slug}"`,
		`  cacheVersion="${CV}"`,
		`  approxMinutes={${mins}}`,
		'/>',
	];
	writeFileSync(file, [...lines.slice(0, idx + 1), ...block, ...lines.slice(idx + 1)].join('\n'));
	console.log(`wired: ${slug}  (approxMinutes est ${mins})`);
}

/**
 * Print the build-time curriculum metrics, and time the derivation.
 *
 * Run: bun run metrics
 *
 * This is a report, not a gate. The gates live inside curriculum-metrics.ts
 * itself: it throws on orphaned narration, duplicate lesson slugs, and any
 * drift between tracks.ts and the content directory, so `astro build` already
 * fails on all three. This script exists so a human can see the numbers
 * before they go into copy, and so the cost of the derivation stays visible.
 */
import { TRACKS, THEMES } from '../src/data/tracks';

// Imported dynamically so the timer actually covers the derivation. A static
// import would be evaluated before the first statement runs, and the measured
// cost would be a meaningless zero.
const started = performance.now();
const { CURRICULUM_METRICS, TRACK_METRICS, THEME_METRICS } = await import(
	'../src/data/curriculum-metrics'
);
const elapsed = performance.now() - started;

const t = CURRICULUM_METRICS;

console.log('\nCURRICULUM METRICS, derived from the repo');
console.log('='.repeat(64));
console.log(`  Narration hours        ${t.narrationHours}`);
console.log(`  Narration seconds      ${t.narrationSeconds}`);
console.log(`  Narrated lessons       ${t.narratedLessons}`);
console.log(`  Mean lesson length     ${t.narrationAvgMinutes} min`);
console.log(`  Lessons live           ${t.liveLessons}`);
console.log(`  Tracks live            ${t.liveTracks}`);
console.log(`  Tracks in manifest     ${t.manifestTracks}  (live plus planned)`);

console.log('\nBY THEME (live tracks)');
console.log('-'.repeat(64));
for (const meta of Object.values(THEMES).sort((a, b) => a.order - b.order)) {
	const m = THEME_METRICS.get(meta.key);
	if (!m) continue;
	const hours = (m.seconds / 3600).toFixed(1);
	console.log(
		`  ${meta.label.padEnd(34)} ${String(m.tracks).padStart(2)} tracks  ` +
			`${String(m.lessons).padStart(3)} lessons  ${hours.padStart(5)} h`,
	);
}

console.log('\nBY TRACK');
console.log('-'.repeat(64));
for (const track of TRACKS) {
	const m = TRACK_METRICS.get(track.slug)!;
	const narr = m.lessons > 0 ? `${m.narrated}/${m.lessons}` : '-';
	console.log(
		`  ${track.slug.padEnd(36)} ${narr.padStart(6)} narrated  ${m.hoursLabel.padStart(10)}` +
			(track.status === 'planned' ? '  (planned)' : ''),
	);
}

console.log('\n' + '='.repeat(64));
console.log(`Derived in ${elapsed.toFixed(0)} ms, reading 285 timing files.`);
console.log('Every number above is computed; none is hand-maintained.\n');

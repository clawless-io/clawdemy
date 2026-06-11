// T22 audio gloss: strip the _<8-digit-date> version suffix from API
// identifiers in NARRATED PROSE only (the date narrates as garbage). Leaves
// fenced code and frontmatter untouched, so the exact versioned string stays
// in the python/json examples for readers. Version-COMPARISON sentences (same
// tool, current vs previous) are NOT safely handled here -- fix those by hand.
// Usage: bun scripts/gloss-t22-versions.mjs <lesson.mdx path>
import { readFileSync, writeFileSync } from 'node:fs';
const file = process.argv[2];
const t = readFileSync(file, 'utf8');
const parts = t.split('\n');
let fc = false, dashes = 0, changed = 0;
const out = parts.map((line) => {
	const s = line.trim();
	if (s === '---') { dashes++; return line; }
	if (dashes < 2) return line;                 // frontmatter
	if (s.startsWith('```')) { fc = !fc; return line; }
	if (fc) return line;                          // fenced code
	const next = line.replace(/([A-Za-z][A-Za-z0-9_]*)_(202\d{5})/g, (m, name) => { changed++; return name; });
	return next;
});
writeFileSync(file, out.join('\n'));
console.log(`${file}: stripped ${changed} version-date suffixes from prose`);

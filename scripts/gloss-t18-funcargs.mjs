// T18 math-gloss FUNCTION-ARG pass: only the UNAMBIGUOUS standalone
// distribution references in narrated PROSE (fence + frontmatter + table aware).
// Converts p(x)/q(z|x)/p(z|x) style references to spoken "p of x" / "q of z
// given x". Equation-shaped fragments (p(x) = ∫ ... dz, KL(...), E_q[...],
// N(0,1), H(pi(...))) are SEMANTIC and stay MANUAL -- this script does NOT touch
// them. No rule contains a markdown-active char, so no corruption mode. Run the
// corruption scan after anyway.
// Usage: bun scripts/gloss-t18-funcargs.mjs <lesson.mdx path>
import { readFileSync, writeFileSync } from 'node:fs';
const file = process.argv[2];
// order: longer/more-specific (with bars / commas) FIRST so nested forms win.
const SUBS = [
	[/p\(x \| z\)/g, 'p of x given z'],
	[/p\(z \| x\)/g, 'p of z given x'],
	[/q\(z \| x\)/g, 'q of z given x'],
	[/p\(x, z\)/g, 'p of x and z'],
	[/p\(x\)/g, 'p of x'],
	[/p\(z\)/g, 'p of z'],
	[/q\(z\)/g, 'q of z'],
];
const lines = readFileSync(file, 'utf8').split('\n');
let fc = false, dashes = 0, n = 0;
const out = lines.map((line) => {
	const s = line.trim();
	if (s === '---') { dashes++; return line; }
	if (dashes < 2) return line;                       // frontmatter
	if (s.startsWith('```')) { fc = !fc; return line; }
	if (fc) return line;                                // fenced code
	if (/^\|.*\|$/.test(s)) return line;                // table row
	let next = line;
	for (const [re, rep] of SUBS) next = next.replace(re, (m) => { n++; return rep; });
	return next;
});
writeFileSync(file, out.join('\n'));
console.log(`${file.split('/').slice(-2)[0]}: ${n} funcarg subs`);

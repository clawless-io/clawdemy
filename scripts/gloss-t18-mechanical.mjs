// T18 math-gloss MECHANICAL pass: only the UNAMBIGUOUS symbol-to-word
// substitutions, in narrated PROSE (fence + frontmatter + table aware). The
// equation-shaped inline math and subscripts (Q_k, s_t, gamma^k, |.|_inf, full
// equations) are SEMANTIC and stay MANUAL -- this script does NOT touch them.
// Usage: bun scripts/gloss-t18-mechanical.mjs <lesson.mdx path>
import { readFileSync, writeFileSync } from 'node:fs';
const file = process.argv[2];
// order matters: longer/more-specific first
const SUBS = [
	[/Q\^\*/g, 'Q-star'], [/V\^\*/g, 'V-star'],
	[/Q\^π/g, 'Q-pi'], [/V\^π/g, 'V-pi'], [/A\^π/g, 'A-pi'],
	[/Q\^\\pi/g, 'Q-pi'], [/V\^\\pi/g, 'V-pi'],
	[/Q\*/g, 'Q-star'], [/V\*/g, 'V-star'], [/A\*/g, 'A-star'], [/T\*/g, 'T-star'],
	[/π\*/g, 'pi-star'], [/π\^\*/g, 'pi-star'],
	[/Q_theta/g, 'Q-theta'], [/V_theta/g, 'V-theta'], [/pi_theta/g, 'pi-theta'], [/π_theta/g, 'pi-theta'],
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
console.log(`${file.split('/').slice(-2)[0]}: ${n} mechanical subs`);

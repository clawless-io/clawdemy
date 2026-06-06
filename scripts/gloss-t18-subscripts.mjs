// T18 math-gloss SUBSCRIPT-REFERENCE pass: only the UNAMBIGUOUS *spelled*
// standalone symbol references in narrated PROSE (fence + frontmatter + table
// aware). Fenced display equations use Unicode Greek (φ θ π γ) and are NOT
// touched; this pass only rewrites the spelled forms ("V_phi", "V^pi") that
// appear in prose. Equation-shaped inline fragments (G_t - V_phi(s_t), parens,
// minus signs) are SEMANTIC and stay MANUAL -- this script does NOT touch them.
// No rule contains a bare '*', so the markdown-bold corruption mode that bit the
// mechanical pass cannot occur here. Still: run the corruption scan after.
// Usage: bun scripts/gloss-t18-subscripts.mjs <lesson.mdx path>
import { readFileSync, writeFileSync } from 'node:fs';
const file = process.argv[2];
// order: longer/more-specific first. Spelled forms only (phi/psi/pi/theta).
const SUBS = [
	[/V_phi/g, 'V-phi'], [/Q_phi/g, 'Q-phi'], [/A_phi/g, 'A-phi'],
	[/V_psi/g, 'V-psi'], [/Q_psi/g, 'Q-psi'],
	[/V_theta/g, 'V-theta'], [/Q_theta/g, 'Q-theta'], [/A_theta/g, 'A-theta'],
	[/pi_theta/g, 'pi-theta'], [/pi_phi/g, 'pi-phi'],
	[/V\^pi/g, 'V-pi'], [/Q\^pi/g, 'Q-pi'], [/A\^pi/g, 'A-pi'],
	[/V\^\\pi/g, 'V-pi'], [/Q\^\\pi/g, 'Q-pi'],
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
console.log(`${file.split('/').slice(-2)[0]}: ${n} subscript subs`);

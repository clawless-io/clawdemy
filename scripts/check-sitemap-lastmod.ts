/**
 * Sitemap lastmod integrity gate.
 *
 * WHY THIS EXISTS. `astro.config.mjs` derives each lesson artifact's sitemap
 * `lastmod` from the last commit that touched its `.mdx`. The failure mode that
 * matters is not a missing date, it is a UNIFORM one: if the build runs against a
 * shallow clone, every file resolves to the same commit and every URL gets the
 * same timestamp. That is build time wearing a disguise. Google learns to
 * distrust a lastmod that moves on every page every deploy and then ignores the
 * signal entirely, which leaves us worse off than emitting none at all.
 *
 * `astro.config.mjs` already guards that case by detecting a shallow repository
 * and emitting NO lastmod. This gate is the belt to that braces: it fails the
 * build if lastmod is present but carries no information.
 *
 * THREE STATES, deliberately:
 *   - no lastmod at all      -> PASS, with a warning. This is the legitimate
 *                               shallow-clone fallback. Omitting is the status
 *                               quo and is safe.
 *   - lastmod, >= MIN dates  -> PASS. The signal carries information.
 *   - lastmod, < MIN dates   -> FAIL. Uniform or near-uniform dates are worse
 *                               than none, so refuse to ship them.
 *
 * Requested by SEO Specialist 2026-10-26, during the indexing diagnosis that
 * found zero of 44 sampled lesson/brief/cheatsheet URLs indexed.
 *
 * Reads the BUILT sitemap, not the config, so it tests the artifact a crawler
 * actually gets. Run it after `bun run build`.
 */

import { readFile } from 'node:fs/promises';

/** Below this many distinct dates, a present lastmod is noise, not signal. */
const MIN_DISTINCT_DATES = 5;

const SITEMAP = 'dist/sitemap-0.xml';

async function main() {
	const strict = process.argv.includes('--strict');

	let xml: string;
	try {
		xml = await readFile(SITEMAP, 'utf-8');
	} catch {
		console.error(`Sitemap lastmod  FAIL: ${SITEMAP} not found. Run \`bun run build\` first.`);
		process.exit(1);
	}

	const urlCount = (xml.match(/<url>/g) ?? []).length;
	const lastmods = [...xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
	// Compare by calendar day: two commits on the same day are the same signal to
	// a crawler, and counting timestamps would let 924 near-identical values pass.
	const distinctDays = new Set(lastmods.map((d) => d.slice(0, 10)));

	console.log(`Sitemap lastmod  (${SITEMAP})`);
	console.log(`  URLs:            ${urlCount}`);
	console.log(`  with lastmod:    ${lastmods.length}`);
	console.log(`  without:         ${urlCount - lastmods.length}`);
	console.log(`  distinct days:   ${distinctDays.size}`);

	if (lastmods.length === 0) {
		console.log('');
		console.log('WARN: no lastmod emitted. This is the expected shallow-clone fallback');
		console.log('      (see buildContentModifiedMap in astro.config.mjs). Safe, but the');
		console.log('      sitemap carries no recrawl-priority signal. If this is a full');
		console.log('      clone, the date map is broken and lastmod is silently missing.');
		process.exit(0);
	}

	if (distinctDays.size < MIN_DISTINCT_DATES) {
		console.error('');
		console.error(
			`FAIL: ${lastmods.length} URLs carry lastmod but only ${distinctDays.size} distinct ` +
				`day(s), below the floor of ${MIN_DISTINCT_DATES}.`,
		);
		console.error('      A near-uniform lastmod tells crawlers every page changed at once,');
		console.error('      which is false and trains them to ignore the field. Emitting none');
		console.error('      is better. Likely cause: the build ran against a shallow clone and');
		console.error("      the shallow guard did not catch it, so every file resolved to one");
		console.error('      commit. Fix the date source rather than lowering this floor.');
		console.error('');
		console.error(`      Dates seen: ${[...distinctDays].sort().join(', ')}`);
		process.exit(1);
	}

	console.log('');
	console.log(`CLEAN: lastmod present on ${lastmods.length} URLs across ${distinctDays.size} distinct days.`);
	if (strict && urlCount - lastmods.length > 0) {
		console.log(
			`NOTE: ${urlCount - lastmods.length} URL(s) carry no lastmod (hub and legal pages have ` +
				'no lesson source to date from). Not a failure.',
		);
	}
	process.exit(0);
}

main();

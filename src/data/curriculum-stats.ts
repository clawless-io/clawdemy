/**
 * The four at-a-glance numbers for the StatBanner.
 *
 * FOUNDER RULING, 2026-11-07: the LIVE count is canonical. These used to be
 * end-state SCOPE figures ("327 lessons"), framed so copy never claimed
 * availability. That framing is no longer needed and the scope number was no
 * longer true: it was written when Track 27 was still unbuilt, and nothing in
 * the repo derives it. tracks.ts sums to 308, which is what readers can
 * actually open, so 308 is what we say.
 *
 * Values are now DERIVED from src/data/curriculum-metrics.ts rather than typed
 * here, so they cannot drift from the content again. Updating a number is no
 * longer an edit; it happens when the catalog changes.
 *
 * Server-only, because curriculum-metrics reads the filesystem at build time.
 * The single consumer, StatBanner.astro, is server-rendered.
 */
import { CURRICULUM_METRICS } from './curriculum-metrics';

export interface CurriculumStat {
	/** Visual number/value, e.g. "26", "318", "1.5M+", "Free". */
	value: string;
	/** Visual label under the value, e.g. "Tracks", "Lessons". */
	label: string;
	/**
	 * Optional full accessible sentence. When set, the visual value+label are
	 * aria-hidden and this string is exposed via .sr-only, so screen readers
	 * announce the expanded form. Used only for the "1.5M+" shorthand.
	 */
	srText?: string;
}

// NOTE: StatBanner.astro's responsive divider CSS assumes exactly 4 stats
// (2x2 mobile / 4-up desktop). If you add or remove a stat, update the
// nth-child divider suppression in StatBanner.astro to match.
//
// "Tracks" is the MANIFEST count (25 live plus 2 planned). That is honest on
// /tracks/, where the two planned ones are listed and marked coming soon.
export const CURRICULUM_STATS: readonly CurriculumStat[] = [
	{ value: String(CURRICULUM_METRICS.manifestTracks), label: 'Tracks' },
	{ value: String(CURRICULUM_METRICS.liveLessons), label: 'Lessons' },
	{ value: '1.5M+', label: 'Words', srText: 'More than 1.5 million words' },
	{ value: 'Free', label: 'No signup' },
] as const;

/**
 * Single source of truth for the Clawdemy curriculum-scale marketing numbers.
 *
 * These are END-STATE curriculum-SCOPE figures (the shape of the full
 * 25-track curriculum), NOT a claim about how many lessons are live today.
 * Copy that uses them must stay in scope framing ("a 25-track curriculum",
 * "built lesson by lesson"), never "310 lessons available now".
 *
 * One constant, imported by StatBanner.astro (and reusable by the homepage
 * redesign). Updating a number is a one-line edit here; revisit only if the
 * curriculum scope itself changes (a track added beyond 24, or dropped).
 */
export interface CurriculumStat {
	/** Visual number/value, e.g. "24", "310", "1.5M+", "Free". */
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
export const CURRICULUM_STATS: readonly CurriculumStat[] = [
	{ value: '25', label: 'Tracks' },
	{ value: '310', label: 'Lessons' },
	{ value: '1.5M+', label: 'Words', srText: 'More than 1.5 million words' },
	{ value: 'Free', label: 'No signup' },
] as const;

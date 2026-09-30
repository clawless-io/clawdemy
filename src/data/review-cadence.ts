/**
 * Single source of truth for lesson review cadence.
 *
 * Founder-approved 2026-09-29. Replaces the flat 180-day staleness line that
 * both LessonFreshness.astro and the Track 6 citation gate used to assume.
 *
 * WHY TIERS. A flat window is wrong in two directions at once. It tells readers
 * to distrust timeless material (an eigenvector will not change), while staying
 * silent on lessons that genuinely rot (a vendor API surface reviewed in May).
 * Measured on 2026-09-29: a flat 180-day line put 237 lessons into a single
 * November cliff, almost all of it math, and surfaced ZERO of the 31
 * vendor/product lessons that were already overdue on a risk-appropriate clock.
 *
 * THE TIERS (per governance addendum 2, originally scoped to Track 6):
 *   3  quarterly  Vendor, product, or policy surfaces. Claims go out of date
 *                 because someone else shipped a change.
 *   6  semi-annual  Framework and practice tracks. Patterns drift, fundamentals
 *                 hold.
 *  12  annual     Conceptual and mathematical tracks. The content is stable;
 *                 an annual pass catches drift in framing and links.
 *
 * HOW TO CHANGE A CADENCE. Edit the map below, not a lesson. Per-lesson
 * `review_cadence_months` in frontmatter still wins when a single lesson needs
 * a tighter clock than its track (that is how the three privacy lessons were
 * authored). Prefer the map: one edit here beats 300 frontmatter edits, and it
 * keeps the policy readable in one place.
 *
 * Adding a track? Add it here. Unmapped tracks fall back to
 * DEFAULT_CADENCE_MONTHS, which is deliberately the middle tier so a new track
 * is never silently treated as timeless.
 */

/** Fallback for any track not named below. Middle tier on purpose. */
export const DEFAULT_CADENCE_MONTHS = 6;

/** Quarterly: vendor, product, and policy-coupled tracks. */
const QUARTERLY = [
	'getting-started',
	'building-with-claude',
	'llm-ops-and-production',
	'privacy-local-first',
] as const;

/** Semi-annual: framework and applied-practice tracks. */
const SEMI_ANNUAL = [
	'ai-agents-and-tool-use',
	'ai-agent-teams',
	'engineering-agentic-systems',
	'generative-ai-in-the-real-world',
	'ai-safety-and-alignment',
] as const;

/** Annual: conceptual, mathematical, and historical tracks. */
const ANNUAL = [
	'ai-foundations',
	'build-an-llm-from-scratch',
	'build-nns-from-scratch',
	'classical-machine-learning',
	'computer-vision',
	'deep-reinforcement-learning',
	'generative-models-and-diffusion',
	'git-workflow',
	'intro-to-deep-learning',
	'multimodal-ai',
	'neural-network-intuition',
	'practical-transformers',
	'reinforcement-learning-foundations',
	'statistics-and-probability',
	'visual-math-calculus',
	'visual-math-linear-algebra',
] as const;

export const TRACK_CADENCE_MONTHS: Readonly<Record<string, number>> = Object.freeze({
	...Object.fromEntries(QUARTERLY.map((t) => [t, 3])),
	...Object.fromEntries(SEMI_ANNUAL.map((t) => [t, 6])),
	...Object.fromEntries(ANNUAL.map((t) => [t, 12])),
});

/**
 * Cadence for a lesson, in months. A per-lesson frontmatter override wins;
 * otherwise the track tier; otherwise the middle-tier default.
 */
export function resolveCadenceMonths(
	trackSlug: string | null | undefined,
	override?: number | null,
): number {
	if (typeof override === 'number' && Number.isFinite(override) && override > 0) {
		return override;
	}
	if (trackSlug && trackSlug in TRACK_CADENCE_MONTHS) {
		return TRACK_CADENCE_MONTHS[trackSlug];
	}
	return DEFAULT_CADENCE_MONTHS;
}

/**
 * Months to days for date math. 30.44 is the mean Gregorian month, which keeps
 * a 12-month window from drifting a week off a calendar year.
 */
export function cadenceDays(months: number): number {
	return Math.round(months * 30.44);
}

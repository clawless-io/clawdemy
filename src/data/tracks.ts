// ---------------------------------------------------------------------------
// Clawdemy track manifest — the single source of truth for track cards.
//
// The homepage theme rails, the /tracks grid, and any future surface read from
// THIS file. Update an entry here and every surface updates. (Homepage redesign
// plan §8.4: "Track manifest as the single source of truth".)
//
// Phase A deliverable (2026-06-07). Theme names + per-track theme assignments
// are the advisor's defaults from the redesign plan §7 / Q2; the FOUNDER locks
// them at Phase F. They are content decisions, kept here so a rename is a
// one-line edit. Level badges, blurbs, and curated "Start here" selection are
// likewise easy to adjust.
//
// Data provenance:
//   - id / title              -> master track inventory (2026-05-18)
//   - slug / href / lessons   -> live content under src/content/docs/lessons/
//                                (href = each track's first lesson, taken from
//                                the hand-built sidebar in astro.config.mjs;
//                                lessons = actual lesson.mdx count)
//   - blurb / level / theme   -> editorial (advisor defaults; founder-lockable)
//
// Stat-banner numbers (24 tracks / total lessons / words) live in the marketing
// CURRICULUM_STATS constant, NOT here. This manifest is per-track card data.
// ---------------------------------------------------------------------------

export type ThemeKey =
	| 'foundations'
	| 'nn-dl'
	| 'transformers'
	| 'production'
	| 'specialized'
	| 'product';

export type Level = 'Beginner' | 'Foundations' | 'Intermediate' | 'Advanced';

export type TrackStatus = 'live' | 'planned';

export interface Track {
	/** Clawdemy track number (stable; used as the small accent label per Q3(c)). */
	id: number;
	/** Content directory slug under src/content/docs/lessons/. */
	slug: string;
	/** Full track title. */
	title: string;
	/** One-line description, under ~100 chars (card body). */
	blurb: string;
	/** Base theme grouping (rail membership). Founder-lockable at Phase F. */
	theme: ThemeKey;
	/** Difficulty badge. */
	level: Level;
	/** Actual published lesson count (0 while planned). */
	lessons: number;
	/** 'live' = clickable; 'planned' = not yet built (no href). */
	status: TrackStatus;
	/** Entry URL (first lesson). Empty string while planned. */
	href: string;
	/** Curated "Start here" featured rail membership (plan §7). */
	startHere?: boolean;
	/** Sort order within the Start here rail (lower = earlier). */
	startHereOrder?: number;
}

// Theme display metadata. `order` drives the homepage rail sequence (plan §6).
// `accent` is a CSS custom-property value used for the accent label, level
// badge, and the per-theme geometric card icon (Q4(b): abstract icons, no
// faces/logos/photography — calm brand).
export interface ThemeMeta {
	key: ThemeKey;
	label: string;
	/** Short rail subtitle, optional. */
	tagline: string;
	/** Accent color (hex). */
	accent: string;
	/** Rail display order on the homepage. */
	order: number;
}

export const THEMES: Record<ThemeKey, ThemeMeta> = {
	foundations: {
		key: 'foundations',
		label: 'Foundations',
		tagline: 'The math and classical ML everything else builds on.',
		accent: '#2563eb',
		order: 1,
	},
	'nn-dl': {
		key: 'nn-dl',
		label: 'Neural Networks & Deep Learning',
		tagline: 'From intuition to building networks from scratch.',
		accent: '#7c3aed',
		order: 2,
	},
	transformers: {
		key: 'transformers',
		label: 'Transformers & LLMs',
		tagline: 'How modern language and multimodal models actually work.',
		accent: '#db2777',
		order: 3,
	},
	production: {
		key: 'production',
		label: 'Production & Agents',
		tagline: 'Reinforcement learning, agents, ops, and shipping for real.',
		accent: '#ea580c',
		order: 4,
	},
	specialized: {
		key: 'specialized',
		label: 'Specialized & Adjacent',
		tagline: 'Vision, generative models, safety, and privacy.',
		accent: '#0d9488',
		order: 5,
	},
	product: {
		key: 'product',
		label: 'For Clawless users',
		tagline: 'Get hands-on with the Clawless product itself.',
		accent: '#475569',
		order: 6,
	},
};

/** Themes in homepage rail order. */
export const THEME_ORDER: ThemeMeta[] = Object.values(THEMES).sort(
	(a, b) => a.order - b.order,
);

// ---------------------------------------------------------------------------
// The tracks. 22 live + 2 planned (T2 / T3) = the 24-track curriculum.
// href values are verified against the live sidebar entry per track.
// ---------------------------------------------------------------------------
export const TRACKS: Track[] = [
	{
		id: 1,
		slug: 'getting-started',
		title: 'Getting Started with Clawless',
		blurb: "Install, first chat, first agent: your first 'I built something' moment.",
		theme: 'product',
		level: 'Beginner',
		lessons: 5,
		status: 'live',
		href: '/lessons/getting-started/ai-wont-replace-you/lesson/',
		startHere: true,
		startHereOrder: 3,
	},
	{
		id: 4,
		slug: 'visual-math-linear-algebra',
		title: 'Visual Math: Linear Algebra',
		blurb: 'Vectors, matrices, and transformations, built from visual intuition.',
		theme: 'foundations',
		level: 'Beginner',
		lessons: 15,
		status: 'live',
		href: '/lessons/visual-math-linear-algebra/what-vectors-actually-are/lesson/',
		startHere: true,
		startHereOrder: 2,
	},
	{
		id: 5,
		slug: 'ai-foundations',
		title: 'Transformers and LLMs',
		blurb: 'Attention, transformers, and how modern AI actually works.',
		theme: 'transformers',
		level: 'Foundations',
		lessons: 34,
		status: 'live',
		href: '/lessons/ai-foundations/how-ai-reads-tokens/lesson/',
		startHere: true,
		startHereOrder: 1,
	},
	{
		id: 6,
		slug: 'privacy-local-first',
		title: 'Privacy & Local-First AI',
		blurb: "Use AI without trading away your data, your clients', or your family's.",
		theme: 'specialized',
		level: 'Beginner',
		lessons: 3,
		status: 'live',
		href: '/lessons/privacy-local-first/why-your-worry-is-rational/lesson/',
		startHere: true,
		startHereOrder: 4,
	},
	{
		id: 8,
		slug: 'visual-math-calculus',
		title: 'Visual Math: Calculus',
		blurb: 'Derivatives, integrals, and the chain rule, built from intuition.',
		theme: 'foundations',
		level: 'Beginner',
		lessons: 13,
		status: 'live',
		href: '/lessons/visual-math-calculus/essence-of-calculus/lesson/',
	},
	{
		id: 9,
		slug: 'statistics-and-probability',
		title: 'Statistics & Probability for AI',
		blurb: 'The probability and statistics that machine learning runs on.',
		theme: 'foundations',
		level: 'Beginner',
		lessons: 14,
		status: 'live',
		href: '/lessons/statistics-and-probability/why-ai-runs-on-statistics/lesson/',
	},
	{
		id: 10,
		slug: 'classical-machine-learning',
		title: 'Classical Machine Learning',
		blurb: 'Regression, trees, SVMs, and clustering, before the deep-learning era.',
		theme: 'foundations',
		level: 'Beginner',
		lessons: 15,
		status: 'live',
		href: '/lessons/classical-machine-learning/what-machine-learning-actually-is/lesson/',
	},
	{
		id: 11,
		slug: 'neural-network-intuition',
		title: 'Neural Network Intuition',
		blurb: 'What a neural network is, visually, from the handwritten-digit problem.',
		theme: 'nn-dl',
		level: 'Beginner',
		lessons: 10,
		status: 'live',
		href: '/lessons/neural-network-intuition/the-handwritten-digit-problem/lesson/',
	},
	{
		id: 12,
		slug: 'intro-to-deep-learning',
		title: 'Introduction to Deep Learning',
		blurb: 'A broad first survey of deep learning and where it is used.',
		theme: 'nn-dl',
		level: 'Intermediate',
		lessons: 10,
		status: 'live',
		href: '/lessons/intro-to-deep-learning/what-deep-learning-adds/lesson/',
	},
	{
		id: 13,
		slug: 'build-nns-from-scratch',
		title: 'Build Neural Networks from Scratch',
		blurb: 'Build an autograd engine and a neural net from nothing.',
		theme: 'nn-dl',
		level: 'Intermediate',
		lessons: 10,
		status: 'live',
		href: '/lessons/build-nns-from-scratch/micrograd-the-autograd-engine/lesson/',
	},
	{
		id: 14,
		slug: 'practical-transformers',
		title: 'Practical Transformers with Hugging Face',
		blurb: 'Use transformers in practice with the Hugging Face ecosystem.',
		theme: 'transformers',
		level: 'Intermediate',
		lessons: 12,
		status: 'live',
		href: '/lessons/practical-transformers/what-transformers-do/lesson/',
	},
	{
		id: 15,
		slug: 'build-an-llm-from-scratch',
		title: 'Build an LLM from Scratch',
		blurb: 'Tokenizer to trained model: construct a language model end to end.',
		theme: 'transformers',
		level: 'Advanced',
		lessons: 14,
		status: 'live',
		href: '/lessons/build-an-llm-from-scratch/from-scratch-and-the-tokenizer/lesson/',
	},
	{
		id: 16,
		slug: 'computer-vision',
		title: 'Computer Vision',
		blurb: 'How machines see: convolutions, detection, and modern vision models.',
		theme: 'specialized',
		level: 'Advanced',
		lessons: 16,
		status: 'live',
		href: '/lessons/computer-vision/why-seeing-is-hard/lesson/',
	},
	{
		id: 17,
		slug: 'reinforcement-learning-foundations',
		title: 'Reinforcement Learning Foundations',
		blurb: 'Agents, rewards, and policies: the foundations of reinforcement learning.',
		theme: 'production',
		level: 'Intermediate',
		lessons: 10,
		status: 'live',
		href: '/lessons/reinforcement-learning-foundations/what-reinforcement-learning-actually-is/lesson/',
	},
	{
		id: 18,
		slug: 'deep-reinforcement-learning',
		title: 'Deep Reinforcement Learning',
		blurb: 'Policy gradients, Q-learning, PPO, and the algorithms behind RLHF.',
		theme: 'production',
		level: 'Advanced',
		lessons: 18,
		status: 'live',
		href: '/lessons/deep-reinforcement-learning/introduction-to-deep-rl/lesson/',
	},
	{
		id: 19,
		slug: 'generative-models-and-diffusion',
		title: 'Generative Models & Diffusion',
		blurb: 'VAEs, GANs, and diffusion: how AI generates images and more.',
		theme: 'specialized',
		level: 'Advanced',
		lessons: 15,
		status: 'live',
		href: '/lessons/generative-models-and-diffusion/what-a-generative-model-is/lesson/',
	},
	{
		id: 20,
		slug: 'ai-agents-and-tool-use',
		title: 'AI Agents and Tool Use',
		blurb: 'Give models tools, memory, and loops so they act, not just answer.',
		theme: 'production',
		level: 'Intermediate',
		lessons: 11,
		status: 'live',
		href: '/lessons/ai-agents-and-tool-use/what-makes-an-ai-an-agent/lesson/',
	},
	{
		id: 21,
		slug: 'llm-ops-and-production',
		title: 'LLM Ops and Production',
		blurb: 'Ship LLM apps: evaluation, deployment, monitoring, and cost.',
		theme: 'production',
		level: 'Advanced',
		lessons: 11,
		status: 'live',
		href: '/lessons/llm-ops-and-production/launch-an-llm-app/lesson/',
	},
	{
		id: 22,
		slug: 'building-with-claude',
		title: 'Building with Claude',
		blurb: 'Build real applications on the Claude API, step by step.',
		theme: 'production',
		level: 'Intermediate',
		lessons: 12,
		status: 'live',
		href: '/lessons/building-with-claude/your-first-claude-api-call/lesson/',
	},
	{
		id: 23,
		slug: 'ai-safety-and-alignment',
		title: 'AI Safety & Alignment',
		blurb: 'Risks, alignment, and the open problems of building safe AI.',
		theme: 'specialized',
		level: 'Intermediate',
		lessons: 9,
		status: 'live',
		href: '/lessons/ai-safety-and-alignment/ai-safety-as-a-field/lesson/',
	},
	{
		id: 24,
		slug: 'multimodal-ai',
		title: 'Multimodal AI',
		blurb: 'Models that see, hear, and read: vision-language and beyond.',
		theme: 'transformers',
		level: 'Advanced',
		lessons: 10,
		status: 'live',
		href: '/lessons/multimodal-ai/what-multimodal-ai-actually-is/lesson/',
	},

	// --- Planned (not yet built; rendered only where status is surfaced) ----
	{
		id: 2,
		slug: 'use-case-cookbook',
		title: 'Use Case Cookbook',
		blurb: 'Copy-pasteable recipes for real tasks, runnable in Clawless.',
		theme: 'product',
		level: 'Beginner',
		lessons: 0,
		status: 'planned',
		href: '',
	},
	{
		id: 3,
		slug: 'agent-building-101',
		title: 'Agent Building 101',
		blurb: 'Skills, tools, channels, and cron: the Clawless extension layer.',
		theme: 'product',
		level: 'Intermediate',
		lessons: 0,
		status: 'planned',
		href: '',
	},
	{
		id: 7,
		slug: 'git-workflow',
		title: 'Git Workflow: From Solo to Multi-Agent Teams',
		blurb: 'Version control as collaboration infrastructure, from your first commit to coordinating AI agent teams on parallel branches.',
		theme: 'production',
		level: 'Beginner',
		lessons: 4,
		status: 'live',
		href: '/lessons/git-workflow/why-git-exists/lesson/',
	},
];

// --- Selectors (used by the homepage rails, /tracks grid, and future surfaces) ---

/** Live tracks only, in manifest order. */
export const liveTracks = (): Track[] => TRACKS.filter((t) => t.status === 'live');

/** Live tracks in a theme, in manifest order. */
export function tracksByTheme(theme: ThemeKey): Track[] {
	return TRACKS.filter((t) => t.status === 'live' && t.theme === theme);
}

/** The curated "Start here" rail, in startHereOrder. */
export function startHereTracks(): Track[] {
	return TRACKS.filter((t) => t.status === 'live' && t.startHere).sort(
		(a, b) => (a.startHereOrder ?? 99) - (b.startHereOrder ?? 99),
	);
}

/** Rough reading/listening time for a track, derived from lesson count. */
export function trackHours(t: Track): number {
	// ~18 narrated minutes per lesson on average across the catalog.
	return Math.max(1, Math.round((t.lessons * 18) / 60));
}

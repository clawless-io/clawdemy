import { defineCollection, z } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

/**
 * Extends Starlight's docsSchema with the Brief frontmatter fields from
 * Doc/lesson-framework.md §3.
 *
 * Only `brief.mdx` files are required to populate the extended fields. Other
 * artifacts (lesson/summary/practice/cheatsheet/references) use the base
 * docsSchema with all extensions optional, so their frontmatter can stay
 * minimal.
 *
 * Deeper validation (required-vs-optional per artifact type, Bloom-verb
 * checking, slug shape) runs in `scripts/validate-content.ts` as a build-time
 * check invoked by CI.
 */
export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.object({
				// Lesson-wide identifiers — populated on brief.mdx only
				slug: z.string().optional(),
				track: z
					.enum([
						'getting-started',
						'use-case-cookbook',
						'agent-building-101',
						'openclaw-deep-dive',
						'ai-foundations',
						'privacy-local-first',
						'pain-point-library',
						'git-workflow', // Track 7: Git Workflow (Pro Git + Atlassian; multi-agent angle)
						// Mirror tracks (structural mirrors of external open courses)
						'intro-to-deep-learning', // Track 12: MIT 6.S191 (Amini and Amini)
						'build-nns-from-scratch', // Track 13: Karpathy Neural Networks Zero to Hero
						'ai-agents-and-tool-use', // Track 20: Microsoft AI Agents for Beginners + Berkeley CS294
						'ai-agent-teams', // Track 25: Anatomy of an AI Agent Team (TradingAgents case study)
						'engineering-agentic-systems', // Track 26: Engineering Agentic Systems (advanced layer atop Track 22)
						'generative-ai-in-the-real-world', // Track 27: Generative AI in the Real World (HKS DPI-681M adaptation)
						'neural-network-intuition', // Track 11: 3Blue1Brown Neural Networks series
						'practical-transformers', // Track 14: Hugging Face LLM Course
						'reinforcement-learning-foundations', // Track 17: David Silver UCL RL Course
						'llm-ops-and-production', // Track 21: Full Stack Deep Learning LLM Bootcamp
						'build-an-llm-from-scratch', // Track 15: Sebastian Raschka book
						'computer-vision', // Track 16: Stanford CS231n
						'visual-math-linear-algebra', // Track 4: 3Blue1Brown Essence of Linear Algebra
						'visual-math-calculus', // Track 8: 3Blue1Brown Essence of Calculus
						'statistics-and-probability', // Track 9: Khan Academy Statistics & Probability (curated for AI)
						'classical-machine-learning', // Track 10: StatQuest (Josh Starmer) + Microsoft ML-For-Beginners
						'multimodal-ai', // Track 24: Stanford CS25 "Transformers United" V4/V5/V6
						'generative-models-and-diffusion', // Track 19: Stanford CS236 + Berkeley CS294-158
						'deep-reinforcement-learning', // Track 18: Berkeley CS285 (Sergey Levine)
						'building-with-claude', // Track 22: Building with Claude (Anthropic docs)
						'ai-safety-and-alignment', // Track 23: AI Safety, Ethics and Society (CAIS / Hendrycks)
					])
					.optional(),
				course: z.string().optional(),
				order: z.number().int().optional(),

				// Phase grouping for Track 5 (AI Foundations) and Track 6 (Privacy &
				// Local-First AI), per their mental-model curricula. Optional at the
				// schema level; the validator (scripts/validate-content.ts) requires
				// both fields when track ∈ {'ai-foundations', 'privacy-local-first'}
				// and checks (phase, phase_order) uniqueness per-track. Phase slugs
				// are stable identifiers; sidebar group labels derive in
				// astro.config.mjs. Track 5 phases per Doc/curriculum/mental-model-
				// phases.md; Track 6 phases per Doc/curriculum/track-6/mental-model-
				// phases.md (6 phases: orientation → data-flow → threat-models →
				// vendor-policies → local-first → rights-hygiene).
				phase: z
					.enum([
						// Track 5 (AI Foundations)
						'read-text',
						'architecture',
						'training',
						'tuning',
						'inference',
						'reasoning-and-agents',
						'evaluation-and-frontier',
						// Track 6 (Privacy & Local-First AI)
						'orientation',
						'data-flow',
						'threat-models',
						'vendor-policies',
						'local-first',
						'rights-hygiene',
						// Track 12 (Intro to Deep Learning)
						'foundations-and-sequences',
						'vision-and-generation',
						'decisions-and-limits',
						// Track 13 (Build Neural Networks from Scratch)
						'the-autograd-engine',
						'building-a-language-model',
						'building-a-transformer',
						// Track 20 (AI Agents and Tool Use)
						'what-agents-are',
						'agent-design-patterns',
						'production-agents',
						// Track 11 (Neural Network Intuition)
						'network-structure',
						'how-networks-learn',
						'backpropagation',
						// Track 14 (Practical Transformers — Hugging Face LLM Course)
						'transformers-library',
						'data-tokenizers-tasks',
						'demos-and-frontier',
						// Track 17 (Reinforcement Learning Foundations — David Silver UCL)
						'the-rl-setup',
						'planning-with-a-known-model',
						'model-free-learning',
						'scaling-up',
						// Track 21 (LLM Ops and Production — Full Stack Deep Learning)
						'foundations-and-first-app',
						'building-production-apps',
						'advanced-and-the-field',
						// Track 15 (Build an LLM from Scratch — Sebastian Raschka)
						'the-model',
						'systems-and-efficiency',
						'scale-data-and-alignment',
						// Track 16 (Computer Vision — Stanford CS231n)
						'foundations-for-vision',
						'how-machines-see',
						'generating-and-grounding-vision',
						// Track 4 (Visual Math: Linear Algebra — 3Blue1Brown Essence of Linear Algebra)
						'geometric-foundations',
						'geometry-of-operations',
						'advanced-perspectives',
						// Track 8 (Visual Math: Calculus — 3Blue1Brown Essence of Calculus)
						'what-a-derivative-is',
						'differentiation-toolkit',
						'integration-and-approximation',
						// Track 9 (Statistics & Probability for AI — Khan Academy curated)
						'describing-data',
						'probability-foundations',
						'random-variables-and-distributions',
						'statistical-inference',
						// Track 10 (Classical Machine Learning — StatQuest + Microsoft ML-For-Beginners)
						'learning-from-data',
						'classification-and-ensembles',
						'unsupervised-learning',
						'model-evaluation',
						// Track 24 (Multimodal AI — Stanford CS25 Transformers United)
						'multimodal-foundations',
						'large-multimodal-models',
						'generative-multimodal-models',
						'advanced-multimodal-directions',
						// Track 19 (Generative Models and Diffusion — Stanford CS236 / Berkeley CS294-158)
						'generative-foundations',
						'latent-and-adversarial',
						'energy-score-diffusion',
						// Track 18 (Deep RL)
						'rl-foundations',
						'core-deep-rl-algorithms',
						'rl-frontiers',
						// Track 22 (Building with Claude)
						'api-foundations',
						'augmentation-patterns',
						'agent-patterns',
						'production',
						// Track 23 (AI Safety, Ethics and Society — CAIS)
						'the-risks-landscape',
						'safety-and-alignment',
						'ethics-and-governance',
						// Track 7 (Git Workflow: From Solo to Multi-Agent Teams)
						'foundations',
						'branching-and-collaboration',
						'workflows-in-the-wild',
						'multi-agent-teams',
					])
					.optional(),
				phase_order: z.number().int().positive().optional(),

				// Track 6 (Privacy & Local-First AI) stale-claim review cadence
				// in months, per Doc/curriculum/track-6/philosophy.md governance
				// addendum 2. Vendor-policy-citing lessons: 3 (quarterly). Mixed
				// vendor + framework lessons: 6 (semi-annual). Regulatory and
				// foundational primer lessons: 12 (annual). The build-time
				// staleness gate (scripts/check-track6-citations.ts, planned)
				// reads last_reviewed + review_cadence_months and flags lessons
				// past the window.
				review_cadence_months: z.number().int().positive().optional(),

				// Reader orientation
				difficulty: z.enum(['intro', 'standard', 'deep']).optional(),
				estimated_read_minutes: z.number().int().positive().optional(),
				estimated_practice_minutes: z.number().int().nonnegative().optional(),
				prerequisites: z.array(z.string()).optional(),
				learning_outcomes: z.array(z.string()).optional(),

				// Authorship + lifecycle
				authors: z.array(z.string()).optional(),
				published_at: z.coerce.date().optional(),
				last_reviewed: z.coerce.date().optional(),
				status: z.enum(['draft', 'published', 'needs-review']).optional(),

				// License
				license: z
					.object({
						text: z.string().default('CC-BY-NC-SA-4.0'),
						code: z.string().default('MIT'),
					})
					.optional(),

				// Source attribution — required if derived from external material
				source_material: z
					.object({
						type: z.enum([
							'youtube',
							'reddit-cluster',
							'clawless-kb',
							'reddit-thread',
							'original',
							'web-course',
						]),
						primary_url: z.string().url().optional(),
						attribution_block: z
							.literal('see references.mdx')
							.default('see references.mdx'),
					})
					.optional(),

				// Artifact type — lets the validator know which rules apply
				artifact: z
					.enum(['brief', 'lesson', 'summary', 'practice', 'cheatsheet', 'references'])
					.optional(),
			}),
		}),
	}),
};

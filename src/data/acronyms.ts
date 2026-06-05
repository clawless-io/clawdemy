/**
 * Global acronym glossary — single source of truth.
 *
 * The right-sidebar <AcronymGlossary> auto-detects which of these acronyms
 * actually appear on a page (whole-word, case-sensitive match against the
 * page body) and lists their expansions under "On this page". Adding one
 * entry here lights it up across the ENTIRE catalog, current and future,
 * with zero per-lesson edits and zero audio impact (the sidebar is not
 * narrated). This is the global-flag pattern (CLAUDE.md §3.5): the feature
 * is catalog-wide policy controlled from one place, never a per-lesson prop.
 *
 * Editorial rules for this file:
 *  - Expansions are treated like citations: they MUST be accurate. A wrong
 *    expansion is a brand-critical error. Fact-check before adding.
 *  - Keys are matched case-sensitively as whole words, so "CLIP" never
 *    matches "clip" and "ViT" never matches "transit". Hyphens count as
 *    word boundaries, so "GPT" is detected inside "GPT-4V".
 *  - Do NOT add ultra-generic terms (AI, ML) — they would match everywhere
 *    and turn the panel into noise.
 *  - Do NOT add product/model NAMES (GPT-4V, Gemini, Claude, CogVLM,
 *    CogAgent, LLaVA is the exception because it genuinely expands). A name
 *    is not an expandable acronym; "expanding" it is pedantry or fabrication.
 */
export const ACRONYMS: Record<string, string> = {
	// Core model / architecture vocabulary
	LLM: 'Large Language Model',
	LMM: 'Large Multimodal Model',
	VLM: 'Vision-Language Model',
	ViT: 'Vision Transformer',
	MLP: 'Multilayer Perceptron',
	CNN: 'Convolutional Neural Network',
	RNN: 'Recurrent Neural Network',
	GAN: 'Generative Adversarial Network',
	VAE: 'Variational Autoencoder',
	GPT: 'Generative Pre-trained Transformer',
	MoE: 'Mixture of Experts',
	JEPA: 'Joint-Embedding Predictive Architecture',

	// Attention / transformer internals
	QKV: 'Query, Key, Value',
	BPE: 'Byte-Pair Encoding',

	// Vision / multimodal
	CLIP: 'Contrastive Language-Image Pre-training',
	LLaVA: 'Large Language and Vision Assistant',
	VQ: 'Vector Quantization',
	OCR: 'Optical Character Recognition',
	GUI: 'Graphical User Interface',

	// Training / alignment
	RLHF: 'Reinforcement Learning from Human Feedback',
	SFT: 'Supervised Fine-Tuning',
	PPO: 'Proximal Policy Optimization',
	DPO: 'Direct Preference Optimization',
	SGD: 'Stochastic Gradient Descent',
	ELBO: 'Evidence Lower Bound',
	RAG: 'Retrieval-Augmented Generation',
	CoT: 'Chain of Thought',

	// Reinforcement learning
	RL: 'Reinforcement Learning',
	MDP: 'Markov Decision Process',
	DQN: 'Deep Q-Network',

	// Speech / IO
	NLP: 'Natural Language Processing',
	ASR: 'Automatic Speech Recognition',
	TTS: 'Text-to-Speech',

	// Hardware
	GPU: 'Graphics Processing Unit',
	TPU: 'Tensor Processing Unit',
};

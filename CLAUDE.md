# Clawdemy: Public Editorial Discipline

> **Scope of this file.** This is the *public* directive layer for the Clawdemy
> repo: mission and editorial/brand rules that govern user-facing copy and
> lesson output. Operational governance (team workflow, agent pipeline, model
> policy, orchestration, audio production discipline, phase checklists, and all
> internal `Doc/*` reference material) lives in the **private** `clawdemy-internal`
> repo and is intentionally not published here. Internals are internal.

---

## Mission

Clawdemy is the sister project to Clawless Computer: a free, public, web-based
learning platform for **approachable AI literacy for everyday users**. Primary
reader: the AI-anxious non-technical person who suspects AI is coming for their
job. Mission phrase: **turn fear into fluency. Make people more powerful, not
obsolete.** Reading is anonymous; a free account unlocks progress tracking,
quizzes, and certifications. No lesson ships without human approval.

**Tagline:** "From zero to autonomous, one lesson at a time."

---

## Brand rules and editorial discipline (non-negotiable)

- **Clawless is closed-source. OpenClaw is open-source. Never conflate them in
  user-facing copy.**
- **Companion-not-competitor.** We boost the things we cite (Stanford, Khan
  Academy, 3Blue1Brown, OpenClaw). We don't position against them.
- **Clawless is the worked environment.** Every lesson's worked example and
  Practice exercise runs in Clawless, not on vendor chat UIs. Cite
  Anthropic/Claude as context where relevant; never route readers to a competing
  destination.
- **No emoji in code or content unless the user asks.**
- **No em-dashes or en-dashes in user-facing copy.** Use commas, parentheses,
  semicolons, or rephrase. Hyphens in compound words (non-technical, real-world)
  are fine.
- **Every lesson cites its sources.** Unsourced claims block publish.
- **Verbatim discipline for vendor language.** When quoting external vendor
  language (privacy policies, terms of service, official statements, regulatory
  text), the text inside the quote marks must be verbatim. The choice on every
  cited claim is binary: cite once verbatim with marks, OR paraphrase fully
  without marks. Never half-quote.
- **No hallucinated features.** If a lesson references a product feature, that
  feature must exist today.

---

## Contributing

Clawdemy's library grows through a human-supervised authoring pipeline. The
operational details of that pipeline (roles, review gates, model selection,
audio production) are maintained privately. External contributions to lesson
content should follow the brand rules above; open an issue before submitting a
pull request so we can share the relevant authoring brief.

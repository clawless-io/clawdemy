# Clawdemy — Agent Instructions (always loaded)

> **Purpose:** This file is the directive layer for every agent working in the public Clawdemy repo. It covers mission, editorial discipline, the role workflow, model selection, and the ClaudeLink protocol. Operational pointers to internal docs, cross-project protocols, and content-secret governance live in `internal/CLAUDE.md` (private, nested repo).
>
> **Status:** Phase 0 charter closed 2026-04-20. Phase 1 unblocked. Track 5 (AI Foundations) shipped 35 lessons; Track 6 (Privacy & Local-First AI) frozen at 3 lessons on 2026-05-18 under the KISS cost-threshold rule (see §2). Internal `HANDOVER.md` carries current-state context for resuming agents.

---

## 1. Mission (the one paragraph)

Clawdemy is the sister project to Clawless Computer, a free, public, web-based learning platform for **approachable AI literacy for everyday users**. Primary reader: the AI-anxious non-technical person who suspects AI is coming for their job. Mission phrase: **turn fear into fluency. Make people more powerful, not obsolete.** Reading is anonymous; a free account unlocks progress tracking, quizzes, and certifications. The library grows itself through an agentic Scout→Curator→Writer→Reviewer pipeline, but no lesson ships without human approval.

## 2. Brand rules and editorial discipline (non-negotiable)

### Brand identity

- **Clawless is closed-source. OpenClaw is open-source. Never conflate them in user-facing copy.** Enforced across every lesson, marketing page, and social post.
- **Companion-not-competitor.** We boost the things we cite (Stanford, Khan Academy, 3Blue1Brown, OpenClaw). We don't position against them.
- **Clawless is the worked environment.** Every lesson's worked example and Practice exercise runs in Clawless, not on vendor chat UIs (claude.ai, chatgpt.com, etc.). Cite Anthropic/Claude as context where relevant; never route readers to a competing destination. Full rule in `internal/Doc/content-model.md` Authoring rules.
- **No emoji in code or content unless the user asks.**
- **No em-dashes (—) or en-dashes (–) in user-facing copy.** Use commas, parentheses, semicolons, or rephrase. Hyphens in compound words (non-technical, real-world) are fine. Full guidance in `internal/Doc/content-model.md` Authoring rules.
- **Tagline:** "From zero to autonomous, one lesson at a time."
- Full voice, tone-per-track calibration, and founder-voice guidance → `internal/Doc/brand.md`.

### A1 verbatim discipline (vendor language)

When quoting external vendor language inside attribution windows (privacy policies, terms of service, official statements, regulatory text), the text inside the quote marks must be **verbatim**. No paraphrasing inside quotes. No extension (adding words inside the quote that aren't in the source). No collapse (cutting words from the middle without ellipsis). No stitch (joining non-adjacent sentences without clear marking). The choice on every cited claim is binary: cite once verbatim with marks, OR paraphrase fully without marks. Never half-quote. Locked 2026-05-17 (Track 6 Group A constitution amendment A1); reusable as standing editorial discipline for any vendor-citing lesson going forward.

### Vendor naming policy (mix-and-match)

When a lesson cites a specific external vendor:

- **Name directly** when (a) citing a publicly-published positive example (a vendor doing privacy-preserving design right, a published policy section being clear), or (b) citing the vendor's own verbatim policy text under A1 discipline.
- **Anonymize** ("Company A" / "Company B" / similar) when (a) discussing a security breach or incident, (b) the attribution is uncertain (a behavior reported by users that the vendor hasn't confirmed), or (c) the lesson's claim is critical of vendor behavior in a way that benefits from depersonalization.
- **Founder pre-ship notification** is required for any lesson that names a vendor in a security-breach context, even when the breach is public knowledge.

The principle: name vendors when the citation is a positive example or a verbatim policy quote; anonymize when the discussion could read as accusation or attribution is shaky. Asymmetric framing (one vendor named, a parallel-role vendor anonymized) is a substantive issue per the review rubric. Full policy + the Company A/B mapping table for Track 6 specifically live in `internal/Doc/curriculum/track-6/philosophy.md` (Group A constitution amendments).

### KISS cost-threshold for free education

On a zero-revenue free-education site, external legal review, audit overhead, multi-agent fact-check loops, counsel side-channels, and retroactive policy patches are real costs that must be justified by the value of the artifact being protected. When per-deliverable marginal cost exceeds what a free lesson can pay back, the answer is to cut scope, not grind through. Founder verbatim (2026-05-18): *"KISS. If we can't do this, don't continue. If we need to get legality advice, advisors, if we need to get lawyers involved, that is a cost for an education website that I'm building for free at this moment, with zero revenue."*

Apply this whenever a workstream has accumulated legal/review infrastructure that the deliverable can't repay at zero revenue. Two failure modes the rule guards against: sunk-cost continuation (the machinery is built, the per-lesson cost stays flat) and scope creep on free deliverables. Recognize the inversion, ship the simpler version or park the workstream with a named revisit trigger (revenue, scale, founder explicit signal). Worked example: Track 6 freeze, 2026-05-18.

### Substantive vs paranoid tone-softening

When applying review fixes (internal review, external audit feedback, advisor relays), classify each finding before applying:

- **SUBSTANTIVE — apply:** self-trips on rules we ourselves shipped; factual errors; asymmetric framing; unprovable claims; A1 verbatim discipline violations.
- **PARANOID tone-softening — push back:** sanitizing memorable rhetoric purely because it could read as opinionated; hedging factual claims to the point of saying nothing; removing analytical observations the reader needs; adding disclaimers to material that doesn't legally require them.

The applicable threat is politely-disagreeing email, not lawsuit. Calibrate effort accordingly. Don't drain the teaching punch with over-cautious editing. Founder rule 2026-05-17.

## 3. Team model & working agreements

Five standing roles. Architect + Reviewer + Security Analyst participate at **discussion time**, not just at gate time. Shift-left security is a hard rule, captured from prior-project lessons.

| Role | When they fire | Job |
|---|---|---|
| **Architect** | (1) During discussion of any medium+ item, *before* we commit. (2) Before any code goes in. | Approves the design, flags structural risks, names simpler alternatives, gives explicit Go/No-Go. Always asks: *what's the simplest thing that works, and what does this lock us into?* |
| **Developer / Writer** | After Architect Go | Implements the approved design exactly. (For content: drafts the lesson against the approved brief.) Doesn't expand scope mid-flight. |
| **Reviewer** | (1) During discussion of any medium+ item, *before* we commit. (2) After build/draft is ready. | Audits correctness against the actual artifact (code or lesson). Hunts for the failure modes the Architect didn't predict. Never skipped. |
| **Security Analyst** (senior) | (1) During discussion of any medium+ item, *before* we commit. (2) Before code goes in, writes the threat model. (3) After build, audits against it. | Threat-models the design, names abuse paths before they exist, audits the build against them. Owns: authn/authz, session handling, input validation, rate limits, secret hygiene, prompt-injection surface in the agent pipeline, abuse of free-tier resources, data minimization, privacy. Never skipped for medium+ items or for anything touching auth, sessions, user input, external ingestion, or the agent pipeline. |
| **QA** | After Reviewer + Security sign-off | Designs and runs the automated tests. **Playwright is the contract**: functional + regression + e2e, not just smoke. Test depth table + canonical category list in `internal/Doc/qa.md`. |

### 3.1 The "medium-or-larger" rule (when the three voices must weigh in)

| Size | Examples | Discussion-time roles |
|---|---|---|
| **Small** | Copy edits, single-line config, doc typos, fixing a broken link in a lesson, adjusting a Tailwind class | None required, just do it |
| **Medium** | Adding a new page type, new MDX schema field, new Astro component, swapping a dependency, new agent prompt, new lesson template, new D1 table | **Architect + Reviewer + Security Analyst must weigh in before we commit** |
| **Large** | New phase, new integration, framework or platform change, new auth flow, new agentic pipeline stage | **All three voices weigh in, AND a written plan must exist before code/content begins** |

In conversation, the pattern is explicit: responses on medium+ items include labeled `**Architect view:**`, `**Reviewer view:**`, `**Security Analyst view:**` sections. They may disagree; we resolve in dialogue. The Security Analyst view may be brief but is never omitted; silence on security is not the same as no risk.

### 3.2 Code workflow

**Architect + Security (threat model) → Developer → Reviewer + Security (audit) → QA**, sequential, no skipping (except §3.4). Security fires twice: once at design, once at build.

- Commit early, commit often. Every passing build is a commit boundary.
- A code change without the matching `CLAUDE.md` / `Doc/` update is unfinished work.

### 3.3 Content workflow

**Editor (brief) → Writer (draft) → Reviewer (audit) → QA (verification) → Publish**, sequential. **Security Analyst also reviews** any lesson that (a) describes auth, keys, privacy, or threat-model topics, (b) ships runnable code or shell commands readers are likely to copy-paste, or (c) is drafted by an agent (to catch prompt-injection-contaminated material before it wears our brand).

- Drafts live in `internal/drafts/`; published lessons in `src/content/`. Promotion is deliberate, not a side effect.
- Every lesson cites its sources. Unsourced claims block publish.
- Content QA runs automated checks: dead-link scanner, attribution-block presence, code-fence validity, reading-level score, alt-text coverage on images. Manual fact-check by the Reviewer is still required.
- Attribution rules → `internal/Doc/attribution-policy.md`.

### 3.4 Skip rules

- **Architect and QA** *may* be skipped only for: single-file CSS/copy changes, docs-only changes, same-session BLOCKER hotfixes.
- **Reviewer is never skipped.** Discussion-time Architect + Reviewer + Security Analyst voices are never skipped for medium+ items.
- **Security Analyst is additionally never skipped**, regardless of change size, for anything touching auth, sessions, cookies, user input, secret handling, external data ingestion (Scout/Curator sources), or the agent pipeline. A "small" change to an auth flow is still security-relevant.

### 3.5 Cross-cutting rules

- **Document-first.** A change without a documentation update is unfinished work.
- **No hallucinated features.** If a lesson references a Clawless feature, it must exist in the v5 KB at `~/Projects/clawless-v1/clawless/docs/knowledge-base/` *today*. The directory is *named* `clawless-v1` for legacy reasons but the v5 source-of-truth content lives in the `clawless/docs/knowledge-base/` subfolder; the `desktop/knowledge-base/` v1 archive is stale and must not be referenced (it has features like vault, master password, recovery key, mobile companion, workspaces that no longer exist in v5).
- **Pointer hygiene.** When moving or renaming anything in `internal/Doc/`, grep for existing pointers and update them in the same change. Dead pointers silently break the system.
- **Security trumps openness.** The public repo hosts framework, decisions, lesson output, and tooling. Anything that creates an exploitable attack surface (agent prompts when Phase 6/7 ships, rate-limit values, vulnerability details, prompt-engineering work) stays in the private `internal/` repo. Default when in doubt: private wins. Full policy in `internal/Doc/decisions.md` row 24.
- **Global flags over per-page configuration.** UI features that are policy across the catalog (the read-along player, an audio control, a footer module, a banner, a kill-switch flag, anything every lesson is supposed to inherit) live behind a single constant or config value inside the component, not as a prop you add to every lesson MDX. The kill-switch path matters more than the enablement path: when a future Chrome version regresses on a feature, one constant flip + a 70-second deploy reverts the whole catalog at once; per-page props would mean editing N lessons under pressure, which doesn't scale past the first few dozen. *Trial-phase exception:* when a feature is being evaluated on a subset of lessons (3-5 lessons getting it before deciding whether to make it policy), per-lesson props are permitted. The trial-to-policy transition is the moment to lift the prop to a global constant. The transition is mechanical: search-and-remove the prop from all lesson MDX, replace the component's prop reading with a constant. Per-lesson props for whether-the-feature-exists are forbidden ONCE the feature is policy. Per-page props are reserved for genuine variance between pages (different audio src, different slug, different cacheVersion), not for whether-the-feature-exists. *Exclusion via asset presence (preferred for policy features):* if a small subset of lessons shouldn't have a policy feature (e.g., a few short lessons shouldn't get read-along audio), encode the exclusion via underlying asset presence, not via a UI flag. Component checks if the underlying asset exists; renders the feature only when present. The "exclusion" is naturally encoded in whether the asset was generated for that lesson. This keeps the global-flag rule pure: the feature is globally enabled; what varies per-lesson is whether the underlying ASSET exists, not whether the UI feature is allowed. *Fallback for UI-only features (no underlying asset to check):* if a UI-only feature genuinely needs per-lesson exclusion (e.g., a navigation breadcrumb that shouldn't show on intro lessons), use a hardcoded `EXCLUDED_SLUGS` array inside the component as the single source of truth. Keep the array small; treat additions as exceptions, not as the norm. AVOID per-lesson schema fields for feature on/off, that path reintroduces the per-page-prop pattern this rule explicitly closes. Locked 2026-05-13 after the read-along style-toggle refactor.
- **Simple over browser-fragile.** When a feature depends on browser-internal behavior that varies across browsers or versions (programmatic interaction with native media controls, click-to-seek on `<audio>`/`<video>`, drag-to-scrub, hover on touch, autoplay policies, drag-and-drop, IntersectionObserver/ResizeObserver edge cases, focus-management quirks, scroll-snap, render-frame timing), ship the simpler version that does not depend on that internal, even if it means cutting the feature. Locked 2026-05-09 after the read-along trial; Playwright/Chromium does NOT reliably reproduce Safari and other-browser audio quirks. Apply to every future feature decision involving browser internals: two failed real-browser attempts on a feature = take the fallback.

### 3.6 Phase close-out checklist (curriculum work)

> **Status:** locked 2026-05-16 (codifies the lessons-learned doc ratified by founder 2026-05-15 + advisor-relayed Wave 1 audit-fix additions). Full per-phase procedures live at `internal/Doc/curriculum/phase-checklists.md`.

For every curriculum-track phase, a close-out verification pass is mandatory before the phase is declared complete. The bar: **on every new track, the same audit should find materially fewer issues than Track 6's Phase F readiness audit found**, because the issues get caught at phase close-outs rather than at a pre-Phase-F gate. Six structural lessons + one validated bonus procedure + three advisor-relayed additions, all binding:

1. **Verify captured corpus at file level before Phase B.** For every P0 source, grep the stripped file against the concepts that source is supposed to anchor. Substantive prose, not a navigation link. Special attention: JavaScript-rendered sites (Mozilla PNI, gdpr-info.eu) where agent fetchers retrieve only the HTML skeleton. *How to verify:* per-source grep results recorded in the Phase A close-out doc.
2. **Constitution-check at Phase D close-out.** Every lesson slot satisfies every per-slot constitutional requirement (the canonical mandatory field is `**Phase advance:**`). No granularity violations slip through. *How to verify:* a "Constitution compliance check" subsection with one line per requirement, each marked ✓ or flagged.
3. **Pre-author every named artifact before phase ratification.** If a rubric, template, model document, or worked example is referenced by 2+ lessons, the artifact is authored on disk before Phase D ratifies. *How to verify:* a "Named artifacts inventory" subsection listing every named artifact with `[authored at path]` or `[Phase F authoring; not blocking Phase D]`.
4. **Audit inherited cross-track pipeline prompts for contamination.** When a new track inherits Stage 1/2/3/4 prompts from a prior track, audit for literal references to the prior track and either substitute, parameterize, or declare a track-specific variant. *How to verify:* a short inheritance-decision doc per inherited prompt; mental-dispatch simulation result recorded. Full procedure in `internal/Doc/governance/lesson-pipeline-agents.md` Track inheritance audit section.
5. **Doc-vs-doc consistency check at every phase close-out.** Every cross-doc claim a phase output makes is verified against the cited doc and resolved before the phase closes. *How to verify:* a "Cross-doc consistency check" subsection with one line per cross-doc claim, each marked ✓ or flagged.
6. **Voice spec requires demonstration, not just label.** Track Phase 0 ratifies 2-4 sample paragraphs demonstrating the track's voice tier at the track's actual content registers (60-120 words each). Labels alone are not sufficient. *How to verify:* `internal/Doc/brand.md` per-track row contains an explicit "Sample paragraphs" subsection with founder-ratified samples inline.
7. **(Bonus, validated during Track 6 Wave 1) Constitution-against-filesystem verification.** Before committing any phase-output batch: list every file changed, list the changes against the authorizing dispatch + the constitution + sibling docs, revert any change that exceeds scope or violates the constitution. Runs at every commit boundary, not just phase close-outs.

**Advisor-relayed additions (2026-05-16, post-Wave 1 audit on Track 6 lessons 1.1 + 1.2):**

8. **Per-lesson external audit cadence.** Every lesson ships to a feature branch → internal pipeline (Stages 1-4 + Security Analyst + Stage 3.5) green → external audit (advisor reviewer + advisor security + cross-reviewer) runs on the branch → findings integrated → THEN merge to main → Cloudflare auto-deploys. Per-lesson external audit continues through at least lesson 1.5 of any new track. Risk-triggered audits (regulatory, vendor-rubric, rights-request, any practice with a template a reader might act on) remain in the loop indefinitely.
9. **Stage 3.5 cross-doc check between Stage 3 and Stage 4.** ~20 min wall-clock per lesson. Verifies every claim each artifact makes about ANOTHER doc against the cited doc. Catches the cross-doc misses that the internal Stage 3 SME critic does not reliably catch. Mandatory from Track 6 lesson 2.1 onward. Full procedure in `internal/Doc/governance/lesson-pipeline-agents.md` Stage 3.5 section.
10. **learning_outcomes vs ONE-capability — brief contract.** Every lesson brief.mdx names ONE end-state capability explicitly (per the Phase D `Capability gained:` line), separately from the `learning_outcomes` field's 3-5 supporting outcomes that build to it. The two coexist when the brief names them separately. Full contract in `internal/Doc/governance/lesson-pipeline-agents.md` learning_outcomes section.

For the canonical expanded per-phase procedures (Phase A through Phase F kickoff and per-lesson close-out), read `internal/Doc/curriculum/phase-checklists.md`. This summary loads into every Clawdemy session; the expanded file is on-demand.

---

## 4. Model selection policy

Pipeline-tiered to manage token spend. Founder-approved 2026-05-07.

| Pipeline stage | Model | Why |
|---|---|---|
| **Stage 1** — Writer (lesson body draft) | Opus on technical lessons, Sonnet on simpler ones | Technical accuracy needs Opus; founder owns the gray-zone calls. Flag uncertain lessons before drafting. |
| **Stage 2** — Editor (style, em-dash sweep, reading-level) | Sonnet | Mechanical sweep work; cosmetic-cost failure mode. |
| **Stage 3** — SME critic against source transcript | Opus | Wrongness here is hallucinated content shipped to learners. Never downtier. |
| **Stage 4** — Product owner (fits-curriculum judgment) | Sonnet | Judgment work, but cosmetic-cost failure mode. |
| Subagent Explore + Plan default | Sonnet | Per-query-cost work; parent stays Opus for synthesis. |

**Calibration requirement.** For the first 5 lessons after rollout, run a parallel Opus shadow pass on Stages 2 and 4. Compare: did Sonnet catch the same issues Opus would (especially em-dashes, reading-level slips, voice consistency)? Any false positives or false negatives? If Stage 2 false negatives are material (em-dashes shipped, reading-level off, voice drift), escalate Stage 2 back to Opus. If Stage 4 misses curriculum-fit judgments Opus would catch, same. If they're cosmetic, accept the trade-off.

Full reasoning, fleet-wide rollout plan, savings projections, and per-agent variants live in private documentation; see `internal/CLAUDE.md` if you have access.

---

## 5. Orchestration model (parallel-terminal era, locked 2026-05-18)

Clawdemy operates with one canonical lead and a variable pool of parallel executor terminals.

**Lead.** `clawdemy-lead` (Opus 4.7; ClaudeLink role `clawdemy-lead`). Sole owner of canonical Clawdemy memory, vendor naming policy, A1 verbatim discipline, Group A constitution, `HANDOVER.md`, cross-track decisions, and policy triage. Does NOT execute lesson drafting unless founder explicitly assigns. (Prior name `Clawdemy Developer Opus` retired 2026-05-21; the role is now identified solely by the `clawdemy-lead` ClaudeLink handle.)

**Executors.** `clawdemy-dev-01` through `clawdemy-dev-NN` (kebab-case, two-digit zero-padded suffix). Each executor owns one track end-to-end and works lesson-by-lesson. Briefed by `clawless-advisor`. Identifier is stable across session restarts.

**Escalation.** Executors ping `clawless-advisor` for assignments and completion confirmation. The advisor reviews commits and dispatches the next lesson. The advisor escalates to `clawdemy-lead` for cross-track, policy, or vendor-naming triage. Founder pings whoever directly.

**Reference.** The master track inventory at `/Users/junaidsiddiqi/Projects/clawless-v1/clawless/advisor/clawdemy-master-track-inventory-2026-05-18.md` is the canonical source for track assignments and orchestration waves.

**Single-terminal mode (prior policy, superseded 2026-05-18).** Locked 2026-05-07 after the dual-terminal Opus+Sonnet experiment was rolled back same-day. That policy was about avoiding multi-terminal-per-agent routing (dispatch friction). The current parallel-terminal model is structurally different: each executor owns an independent track with no shared state and no routing decisions. The friction model from 2026-05-07 does not apply here.

---

## 6. Global agent collaboration (ClaudeLink, inherited)

This repo participates in the ClaudeLink multi-agent setup defined in the user's global `~/.claude/CLAUDE.md`. Inbox-check-before / inbox-check-after rules apply. If another agent's role could help with a blocker, message them rather than grinding.

### Automatic Inbox Checking

- **BEFORE starting any task**: Check your inbox using `read_inbox` first
- **AFTER completing any task**: Check your inbox again using `read_inbox`
- If you receive a message, acknowledge it and act on it before moving on
- If a message requires you to change your current work, do so immediately
- If a message is from another agent asking for information, respond using `send` before continuing your own work
- High-priority messages take precedence over your current task

### Autonomous Collaboration

- When you finish work that another agent might care about, proactively send them an update
- If you encounter a problem that another agent's role could help with, send them a message
- When you make a decision that affects the project, post it to the bulletin board
- If you're blocked waiting for another agent, say so and check inbox again

### Communication Shortcuts

- **"check response"** or **"check messages"** — Use `read_inbox` to check for new messages
- **"ask the [role]"** — Send a message to that role and check inbox for their reply
- **"tell the [role]"** — Send a one-way message to that role
- **"who's online"** — Use `get_agents` to list all connected agents
- **"update the board"** — Use `post_bulletin` to post a status update
- **"check the board"** — Use `get_bulletin` to read the bulletin board

---

## 7. Internal supplemental rules

For internal cross-project protocols, the pointer table to `Doc/*` reference material, the HANDOVER discipline rule, the parent-site update protocol, the legal-doc sync protocol, and the cross-project relay protocol, read `internal/CLAUDE.md`. That file is in a nested private repo (gitignored from this public repo); operators with access to the internal repo should read it explicitly as part of onboarding. Editorial-discipline rules in this file remain canonical for all sessions.

# Clawdemy Legal Documents — Independent Senior Policy Review

**Date:** 2026-05-02
**Reviewer:** Senior policy and terms reviewer (independent audit)
**Scope:** Privacy Policy, Terms of Use, Cookie Policy, Disclaimer
**Files audited:**
- `src/content/docs/legal/privacy.mdx`
- `src/content/docs/legal/terms.mdx`
- `src/content/docs/legal/cookies.mdx`
- `src/content/docs/legal/disclaimer.mdx`

**Reference quality bar:** Khan Academy, MIT OpenCourseWare, Coursera platform terms.

> **Disclaimer.** I am NOT a licensed attorney and this audit is NOT legal advice. It is a meticulous reviewer's pass intended to drive an internal polish round. Before publishing material legal language, run the final draft past licensed Texas counsel familiar with US consumer privacy and CC BY-SA distribution.

---

## Executive summary

Overall posture is unusually clean for a US LLC educational site: the documents are short, plain-English, internally coherent on the "we collect almost nothing" thesis, and they correctly call out the one functional cookie. The voice meets the founder's stated bar. The brand rule of "no em-dashes / en-dashes" is fully respected across all four files (verified with a Unicode grep — zero hits).

The biggest issues are not draftsmanship failures but **disclosure gaps** typical of educational sites that have grown past their first-pass legal scaffolding:

1. **Public contact email mismatch.** All four documents use `info@rbjglobal.com`. The commissioning brief specifies `info@clawdemy.org` as the public site email. This needs founder confirmation before any change, but the discrepancy is the single most important finding because it reaches across every document.
2. **No CCPA / "Do Not Sell or Share" disclosure** even as a "we don't sell" affirmative statement, which is now standard for US-facing sites regardless of California targeting.
3. **No GDPR data-subject-rights statement** at all, even a single sentence acknowledging that EU visitors have rights and explaining that there is virtually no personal data to exercise them against.
4. **AI-generated content disclosure is split** between Disclaimer and Terms but never says "lessons are written by humans, audio is AI-generated, and some lesson drafts may pass through agentic tooling before human review" — which is the real picture and which an attribution-conscious educational site of this profile would disclose explicitly.
5. **CC BY-SA 4.0 attribution requirements for downstream users are mentioned but not specified.** Khan Academy and MIT OCW both spell out exactly *what* an attribution string should look like. Clawdemy currently says "give appropriate credit" and stops there.
6. **The CC BY-NC 4.0 / CC BY-SA 4.0 license interaction in the Disclaimer is technically muddled** and risks misrepresenting compliance with Stanford CME 295's license.
7. **Terms of Use is missing several disclosures** that a reputable B2C educational site would include even when there is no account and no commerce: indemnification (light-touch), severability, entire-agreement, age representation, DMCA contact, jurisdiction/venue beyond just choice of law.
8. **Cookie Policy claims GDPR/ePrivacy exemption** for the star cookie. The argument is defensible but the legal characterization ("solely to deliver a service the user explicitly requested") is the *strict-necessity* exemption, which is narrower than the doc's prose implies. It needs softening.

Below, findings are categorized by severity.

---

## CRITICAL (must fix before next release)

### C-1. Contact email inconsistency with stated public email

**Files:** all four legal documents
**Sections:** every "Contact" block, plus inline references in Privacy (Children), Terms (Acceptable use)
**Current text (representative):**
> info@rbjglobal.com

**Proposed text:**
> info@clawdemy.org

**Justification:** The commissioning brief identifies `info@clawdemy.org` as Clawdemy's public email. Every legal doc currently routes contact to `info@rbjglobal.com` (the parent-company address). For a property-specific legal page, the property-specific email is what users expect; routing them to the parent company creates an off-brand handoff and arguably weakens the property's own privacy posture by mixing data flows across entities. Founder must confirm which address is correct and the inboxes must actually be monitored before any change ships, but the inconsistency is real and reaches across every contact reference. If the founder's intent is to consolidate at `info@rbjglobal.com`, then the brief is stale and no change is needed; if the brief is correct, every reference must move.

**Note for Architect triage:** This finding is CRITICAL because it is the single change that touches every document and because contact-routing is the one channel rights-holders, regulators, and abuse reporters use. Confirm intent before applying.

---

### C-2. CC BY-NC 4.0 / CC BY-SA 4.0 license interaction is technically incorrect as written

**File:** `src/content/docs/legal/disclaimer.mdx`
**Section:** "Open-source acknowledgments"
**Current text:**
> Clawdemy is built on Astro (MIT) and Starlight (MIT). The curriculum content is licensed CC BY-SA 4.0. Open-source code retains its original license; the curriculum's adaptations are released under the same CC BY-SA 4.0 license as the original material is shared under (Stanford CME 295 lecture notes are CC BY-NC 4.0; our adaptations stay within those terms where they apply).

**Proposed text:**
> Clawdemy is built on Astro (MIT) and Starlight (MIT). Open-source code retains its original license. Original Clawdemy curriculum content is licensed CC BY-SA 4.0.
>
> Some lessons adapt material from third-party sources that ship under their own licenses. Stanford CME 295 lecture notes, for example, are released under CC BY-NC 4.0 (non-commercial). Where Clawdemy adapts CC BY-NC material, the adapted lesson retains the upstream non-commercial restriction and is marked accordingly on the lesson page. Lessons authored from scratch or adapted from CC BY or CC BY-SA sources are released under CC BY-SA 4.0. Each lesson page indicates the applicable license for that specific lesson.

**Justification:** The current text is internally contradictory. CC BY-SA and CC BY-NC are not compatible for re-licensing: an adaptation of a CC BY-NC work cannot be released under CC BY-SA, because CC BY-SA permits commercial use and CC BY-NC does not. Saying "our adaptations are released under the same CC BY-SA 4.0 license as the original material is shared under" while simultaneously noting the original is CC BY-NC misrepresents the license stack. The clean way to handle this is per-lesson licensing flagged on the lesson page, with the policy doc explaining the rule. This is CRITICAL because (a) Stanford is a named upstream, (b) license misrepresentation is one of the few things that draws an actual cease-and-desist for educational sites, and (c) it conflicts with the Terms-of-Use claim that the entire curriculum is CC BY-SA.

---

### C-3. Terms of Use claims "the curriculum" is CC BY-SA without flagging upstream non-commercial restrictions

**File:** `src/content/docs/legal/terms.mdx`
**Section:** "Use of the curriculum"
**Current text:**
> The Clawdemy curriculum content is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0). You may share, adapt, translate, and remix the curriculum freely, including for commercial purposes, as long as you give appropriate credit and license your adaptations under the same terms.

**Proposed text:**
> Original Clawdemy curriculum content is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0). You may share, adapt, translate, and remix this content freely, including for commercial purposes, as long as you give appropriate credit and license your adaptations under the same terms. The full license text is at https://creativecommons.org/licenses/by-sa/4.0/.
>
> Some lessons adapt material from third-party sources released under their own licenses (for example, Stanford CME 295 lecture notes are CC BY-NC 4.0). Where the upstream license imposes additional restrictions (such as non-commercial use), those restrictions carry through to the adapted lesson. Each lesson page indicates the applicable license. When in doubt, follow the lesson-page indicator, not this overview.

**Justification:** Same root cause as C-2. A reader of the Terms today would reasonably believe the entire curriculum is freely commercially redistributable under CC BY-SA, which is not true if any lesson adapts CC BY-NC source material. This is CRITICAL because the Terms is the document a downstream redistributor (translator, fork operator, secondary educational platform) reads to decide whether they can commercialize. Mis-stating the license here invites downstream infringement of Stanford's CC BY-NC terms, which then traces back to Clawdemy's representation.

---

## HIGH (substantive issue, fix soon)

### H-1. CC BY-SA attribution string is undefined

**File:** `src/content/docs/legal/terms.mdx`
**Section:** "Use of the curriculum"
**Current text:**
> You may share, adapt, translate, and remix the curriculum freely, including for commercial purposes, as long as you give appropriate credit and license your adaptations under the same terms.

**Proposed text (insert after the existing paragraph or at the end of the section):**
> When attributing a Clawdemy lesson, please use the following format or its equivalent:
>
> "Adapted from Clawdemy (https://clawdemy.org), licensed under CC BY-SA 4.0."
>
> If you have adapted a specific lesson, name it: "Adapted from 'Lesson Title' on Clawdemy (lesson URL), licensed under CC BY-SA 4.0." Translations and remixes must be released under CC BY-SA 4.0 or a compatible license per the CC compatibility chart.

**Justification:** CC BY-SA 4.0 requires the licensee to provide attribution in a "reasonable manner." Sites that take CC seriously (Wikipedia, Khan Academy, MIT OCW) tell downstream users exactly what attribution looks like. Without a recommended form, downstream attribution is haphazard, dilutes brand traceability, and creates avoidable disputes about whether attribution was "appropriate."

---

### H-2. No CCPA / "no sale, no share" affirmative statement

**File:** `src/content/docs/legal/privacy.mdx`
**Section:** new section, between "What stays in your browser" and "Verification" (or after "Verification")
**Current text:** (none — the document does not address CCPA at all)

**Proposed text (new section to insert):**
> ## Sale and sharing of personal information
>
> We do not sell or share personal information for cross-context behavioral advertising or for any other purpose, as those terms are defined under the California Consumer Privacy Act (CCPA) and similar US state privacy laws. Because we do not collect personal information beyond the disclosed star-cookie aggregate, there is no underlying data to sell or share. We do not run a "Do Not Sell or Share My Personal Information" link because there is no sale or sharing to opt out of.

**Justification:** Even though Clawdemy is a Texas LLC and the brief notes US-Texas as primary jurisdiction, the site is reachable from California and from every other US state with a consumer privacy regime (Texas TDPSA, California CCPA/CPRA, Virginia VCDPA, Colorado CPA, etc.). Affirmative "we don't sell, we don't share" statements have become the de-facto disclosure standard because they short-circuit a class of complaints and clarify intent. Coursera, Khan Academy, and Codecademy all carry an equivalent paragraph. Adding it costs nothing and removes ambiguity.

---

### H-3. No GDPR data-subject-rights paragraph

**File:** `src/content/docs/legal/privacy.mdx`
**Section:** new section, suggested placement before "Children"
**Current text:** (none — GDPR is not mentioned in any legal doc)

**Proposed text (new section to insert):**
> ## EU and UK visitors
>
> Clawdemy is published from the United States and is not directed at people in the European Union or the United Kingdom. If you visit from the EU or UK, the GDPR and UK GDPR may give you rights with respect to personal data we hold about you, including the right to access, correct, delete, restrict processing, port, or object to processing. Because Clawdemy collects no personal data beyond the per-lesson aggregate star count described above (which is not joined to your identity or device), there is in practice almost nothing for these rights to attach to. If you believe we hold personal data about you and you wish to exercise a right, contact us at the email address in the Contact section. We will respond within 30 days.

**Justification:** Even non-EU-targeting US sites are typically reachable in the EU and benefit from a brief GDPR acknowledgment. The phrasing here is honest about the (non-)targeting posture, gives the user a route, and establishes the 30-day response window. The Cookie Policy already invokes ePrivacy/GDPR for the consent-exemption argument (see H-5), so introducing GDPR as a concept in the Privacy Policy is consistent. Khan Academy and MIT OCW both carry equivalent paragraphs.

---

### H-4. AI-authored vs AI-narrated vs agent-pipeline content is not fully disclosed

**File:** `src/content/docs/legal/disclaimer.mdx`
**Section:** "AI narration" — should be expanded into a broader AI-authorship section
**Current text:**
> ## AI narration
>
> Lesson audio is generated by AI text-to-speech, not by a human voice actor. We disclose this so you can decide how much to weight tone, pacing, or pronunciation when you listen. Text remains the source of truth.

**Proposed text:**
> ## AI in the production pipeline
>
> Clawdemy is transparent about where AI participates in producing lessons:
>
> - **Lesson text.** Lessons are drafted with the assistance of large language models and are reviewed and edited by humans before publication. A lesson does not ship without human review. Where a lesson includes a factual claim, we cite the underlying source so you can verify it directly.
> - **Lesson audio.** Audio is generated by AI text-to-speech, not by a human voice actor. We disclose this so you can decide how much to weight tone, pacing, or pronunciation when you listen.
> - **Visual diagrams and figures.** Diagrams are hand-authored unless a lesson explicitly notes otherwise.
>
> Text remains the source of truth. If you find an error, the GitHub repository at github.com/clawless-io/clawdemy is the place to flag it.

**Justification:** Educational sites are increasingly expected to disclose AI's role in content production with the same specificity they apply to data collection. The current Disclaimer addresses audio but not text or the agentic pipeline disclosed in the project's `Doc/agent-pipeline.md`. A reader who later discovers the curriculum was drafted with LLM assistance and reviewed by humans (which is the truth) should not feel the disclosure was buried. This level of transparency is also a competitive differentiator for an AI-literacy site — it models the disclosure norm we want learners to expect from other sites.

---

### H-5. Cookie Policy overstates the GDPR/ePrivacy exemption

**File:** `src/content/docs/legal/cookies.mdx`
**Section:** "No banner"
**Current text:**
> The star cookies are set only when you take an explicit action (clicking the star). Your action is the consent. There is no consent banner because there is nothing to ask permission for upfront, and the cookie literally cannot exist until you ask for it by starring something. Under ePrivacy and GDPR, cookies that exist solely to deliver a service the user explicitly requested are exempt from the consent requirement.

**Proposed text:**
> The star cookies are set only when you take an explicit action (clicking the star). The cookie does not exist until you ask for it by starring a lesson, and its only purpose is to keep your browser from double-counting in the per-lesson aggregate count. Under the ePrivacy Directive and the EDPB's guidance on cookie consent, cookies that are strictly necessary to deliver a service the user has explicitly requested are exempt from the prior-consent requirement. We treat the star cookie as falling within that exemption because it is created only in response to your click and serves only the service you requested. If you would prefer no cookie, simply do not click the star icon.

**Justification:** The current phrasing collapses two different exemption rationales ("user explicitly requested" and "strictly necessary"). The strict-necessity exemption is the one most commonly cited for functional cookies, and it is narrower than "the user clicked the button." Tightening the language to track the EDPB guidance posture (a) makes the legal characterization more defensible if challenged and (b) explicitly hands the user the off-switch (don't click). The current phrasing's claim that "your action is the consent" is informal and could be read as inferring consent from conduct, which is exactly what GDPR forbids.

---

### H-6. Terms of Use is missing a severability / entire-agreement / age clause cluster

**File:** `src/content/docs/legal/terms.mdx`
**Section:** new sections to add, suggested placement after "Limitation of liability" and before "Governing law"
**Current text:** (none — these clauses are absent)

**Proposed text (new sections to insert):**
> ## Eligibility
>
> Clawdemy is open to readers of any age. By using the site, you represent that you can lawfully agree to these terms in the jurisdiction where you live, or that a parent or guardian agrees on your behalf. Because Clawdemy does not require an account or collect personal information from readers, no separate parental consent mechanism is required.
>
> ## Severability
>
> If any provision of these terms is found unenforceable, the remaining provisions remain in full force and effect.
>
> ## Entire agreement
>
> These terms, together with the Privacy Policy, Cookie Policy, and Disclaimer, are the entire agreement between you and RBJ Global LLC regarding your use of clawdemy.org.

**Justification:** Severability and entire-agreement clauses are standard in B2C terms of any maturity (Coursera, Khan Academy, edX all carry them). Their absence is unusual enough that a reader doing a competitive comparison will notice. Eligibility / age representation is also standard and addresses a real gap in the current Terms: there is no statement of who may use the site, even though the Privacy Policy alludes to younger learners. This cluster is HIGH rather than CRITICAL because the absence does not actively mislead, but adding them brings the document up to professional standard.

---

### H-7. No DMCA / takedown notice route in Terms

**File:** `src/content/docs/legal/terms.mdx`
**Section:** new section, suggested placement before "Limitation of liability"
**Current text:** (none — DMCA / takedown is not addressed)

**Proposed text (new section to insert):**
> ## Copyright and takedown
>
> Clawdemy adapts public educational material under the relevant Creative Commons licenses and links to third-party sources for further reading. If you are a rights-holder and believe material on Clawdemy infringes your copyright, please send a notice to the email address in the Contact section. Include: identification of the work, the URL of the allegedly infringing page on clawdemy.org, your contact information, and a statement under penalty of perjury that you are the rights-holder or authorized to act on the rights-holder's behalf. We will review and respond promptly. We may forward complete notices to the affected contributor and may publish redacted versions in a transparency log.

**Justification:** A site that openly republishes adapted educational material from third-party sources should expose a takedown route. Even if no claim ever arrives, the public route signals good-faith engagement with rights-holders. The full DMCA-agent registration ($6 with the US Copyright Office) is a separate question for the founder; the in-Terms route can be added today.

---

### H-8. Privacy Policy "do not access logs for marketing" language is loose

**File:** `src/content/docs/legal/privacy.mdx`
**Section:** "What we collect from this site"
**Current text:**
> We do not log IP addresses beyond what Cloudflare requires to serve the site to your browser, and we do not access those logs for marketing or analytics purposes.

**Proposed text:**
> Cloudflare, our hosting and CDN provider, processes request metadata (including IP address and user agent) for the operational purpose of delivering the site to your browser and protecting against abuse. We do not run our own logging infrastructure on top of this. We do not access Cloudflare's request data for marketing, profiling, analytics, or audience segmentation. Cloudflare's privacy practices are described at https://www.cloudflare.com/privacypolicy/.

**Justification:** "We do not log IP addresses beyond what Cloudflare requires" is technically inaccurate (Cloudflare does the logging; Clawdemy doesn't log at all). The current phrasing implies Clawdemy might do incremental logging on top of Cloudflare. The proposed text is more precise about who logs what and aligns with the Cloudflare paragraph in the Cookie Policy.

---

## MEDIUM (polish, consider for next pass)

### M-1. "Effective" date format and version history

**Files:** all four
**Sections:** the "Effective: May 2, 2026" line at the top
**Current text:**
> **Effective: May 2, 2026**

**Proposed text:**
> **Last updated: May 2, 2026 — view change history at github.com/clawless-io/clawdemy/commits/main/src/content/docs/legal**

**Justification:** "Effective" implies a binding commencement date; "Last updated" is more honest for a living document with a curriculum mindset. Linking to the Git history offers per-document version history without building any new infrastructure. This is the pattern Khan Academy uses (with their archive page) and that MIT OCW uses (with the modification date).

---

### M-2. Privacy Policy should name the audio-CDN provider

**File:** `src/content/docs/legal/privacy.mdx`
**Section:** "Audio lessons (podcast feed)"
**Current text:**
> If you subscribe to the Clawdemy podcast feed, your podcast app downloads audio files directly from clawdemy.org (or from the CDN serving them). We do not run podcast-host analytics that match listens to listeners. Aggregate request counts at the CDN level exist for operational purposes (capacity planning, abuse prevention) and are not joined to any identity.

**Proposed text:**
> If you subscribe to the Clawdemy podcast feed, your podcast app downloads audio files directly from clawdemy.org. The audio files are served from Cloudflare, the same CDN that serves the rest of the site. We do not run podcast-host analytics that match listens to listeners and do not use podcast-tracking services like Chartable, Podtrac, or Spotify for Podcasters analytics. Aggregate request counts at the CDN level exist for operational purposes (capacity planning, abuse prevention) and are not joined to any identity.

**Justification:** Naming the CDN provider keeps the disclosure consistent with the Cookie Policy and forecloses the user's reasonable question "which CDN?" The explicit "we do not use Chartable / Podtrac / Spotify analytics" is the podcast-world equivalent of "we don't run Google Analytics" and is meaningful to listeners who pay attention to podcast tracking.

---

### M-3. Cookie Policy should add a consent / withdrawal-of-consent paragraph

**File:** `src/content/docs/legal/cookies.mdx`
**Section:** new paragraph at the end of "Why a cookie at all" or as part of "How to clear it"
**Current text:** (the doc explains how to delete but does not frame deletion as withdrawal of consent)

**Proposed text (insert at the end of "How to clear it"):**
> Deleting the `cw_star_<slug>` cookie withdraws your consent for that cookie. There is no other consent to withdraw because no other cookie is set on this site. Your star count for that lesson will reset to "unstarred" the next time the page loads.

**Justification:** GDPR requires that withdrawing consent be as easy as giving it. The Cookie Policy already explains how to delete the cookie; framing the deletion explicitly as "withdrawal of consent" closes the loop and aligns with EDPB guidance.

---

### M-4. Terms "Acceptable use" is missing a hard ban on automated scraping at scale

**File:** `src/content/docs/legal/terms.mdx`
**Section:** "Acceptable use"
**Current text:**
> You may read, share links to, fork, adapt, and reference Clawdemy freely. Please do not attempt to access this site through automated means at a rate that disrupts service for other learners. If you discover an actual security issue, email info@rbjglobal.com and we will respond.

**Proposed text:**
> You may read, share links to, fork, adapt, and reference Clawdemy freely. Because the curriculum is openly licensed under CC BY-SA 4.0, you may also clone the GitHub repository at github.com/clawless-io/clawdemy rather than scraping the site, and we encourage that route for any bulk use.
>
> Please do not access this site through automated means at a rate that disrupts service for other learners or that bypasses Cloudflare's rate limits. Reasonable, well-behaved crawlers (search engines, archival projects) are welcome. Aggressive scraping, brute-force probing, vulnerability scanning, and attempts to circumvent the star-counter logic are not.
>
> If you discover an actual security issue, email the address in the Contact section. Please give us a reasonable window to remediate before any public disclosure.

**Justification:** A free, openly-licensed site is a magnet for scrapers. Pointing them to the Git repo (the cleaner route) reduces server load and aligns with the openness ethos. The added specificity (no vulnerability scanning, no star-counter circumvention) gives the operator something to point to if abuse arises. The "reasonable window before public disclosure" line is the standard ask in a coordinated-disclosure posture and is appropriate even without a formal bug-bounty program.

---

### M-5. Disclaimer "Curriculum independence" should explicitly disclaim sponsorship by named third parties

**File:** `src/content/docs/legal/disclaimer.mdx`
**Section:** "Curriculum independence"
**Current text:**
> Clawdemy is built independently. Mentions of third-party software, services, models, or research (OpenAI, Anthropic, Google, Meta, Stanford, and others) acknowledge their existence, technical role, or licensing terms. No endorsement, partnership, sponsorship, or affiliation is implied beyond what is explicitly stated.

**Proposed text:**
> Clawdemy is built independently and is not sponsored by, affiliated with, endorsed by, or partnered with any of the third parties named in its lessons (including but not limited to OpenAI, Anthropic, Google, Meta, Microsoft, Stanford University, the Hugging Face team, or any other organization referenced in the curriculum). Where a lesson mentions a product, model, service, paper, or course, the mention acknowledges its existence, technical role, or licensing terms. Trademarks named in lessons remain the property of their respective owners.

**Justification:** "No endorsement... is implied beyond what is explicitly stated" leaves a small gap (what if Clawdemy explicitly stated something it shouldn't have?) The expanded version is the standard "no sponsorship, no affiliation, trademarks of their respective owners" formula and closes the gap. This is also the formula a sister-project-of-Clawless would want, given the Clawless / Anthropic delineation the brand rules already enforce.

---

### M-6. Disclaimer "Forward-looking statements" should add the explicit "no guarantee of continued availability"

**File:** `src/content/docs/legal/disclaimer.mdx`
**Section:** "Forward-looking statements"
**Current text:**
> Clawdemy describes upcoming tracks and planned material. Plans change. Anything described as planned, queued, or coming is not a promise of delivery on a specific date. Topics are the commitment; deadlines are not.

**Proposed text:**
> Clawdemy describes upcoming tracks and planned material. Plans change. Anything described as planned, queued, or coming is not a promise of delivery on a specific date. Topics are the commitment; deadlines are not. We also do not guarantee that any specific lesson, track, or feature will remain available indefinitely. Lessons may be revised, retired, or replaced as the field evolves. The GitHub repository preserves prior versions for anyone who wants to reference them.

**Justification:** A site that openly evolves its curriculum should say so. The Git-history pointer answers the natural follow-up question ("where do I find the old version?") without requiring the operator to maintain a separate archive page.

---

### M-7. Privacy Policy "Children" section should reference COPPA explicitly (light touch)

**File:** `src/content/docs/legal/privacy.mdx`
**Section:** "Children"
**Current text:**
> Clawdemy is designed for people who want to understand AI, including students and younger learners. We do not knowingly collect personal information from anyone, including children. Because there is no account, no form, and no comment system, there is no mechanism through which a child's information could reach us. If you are a parent or guardian with questions, contact us at info@rbjglobal.com.

**Proposed text:**
> Clawdemy is open to learners of any age. Consistent with the US Children's Online Privacy Protection Act (COPPA), we do not knowingly collect personal information from children under 13. Because Clawdemy has no account system, no forms, no comment system, and no other input mechanism, there is no route by which a child's personal information could reach us. If you are a parent or guardian and believe a child has somehow provided personal information, contact us at the address in the Contact section and we will delete it promptly.

**Justification:** A direct COPPA reference (without overclaiming compliance) is the educational-site standard. The current phrasing is good but doesn't name the regime, and the deletion commitment for parents is the missing piece.

---

### M-8. Tone consistency in section headings

**Files:** `src/content/docs/legal/cookies.mdx`, `src/content/docs/legal/disclaimer.mdx`
**Sections:** various
**Current text (examples):**
- "What we don't do with it" (cookies)
- "What we don't run" (cookies)
- "What's not in the cookie" (cookies)

**Proposed text:** No verbatim replacement; flagging that the negative-form-heading pattern ("What we don't…") is used three times in the Cookie Policy and once nowhere else. Consider tightening to a consistent voice, perhaps "What the cookie does not contain" / "What we do not use the cookie for" / "What we do not run." This is a polish-only nit but the reading experience improves with parallel construction.

**Justification:** Khan Academy and MIT OCW both maintain parallel-construction headings inside a single document. The current Cookie Policy is informal-and-direct, which fits the brand voice, but the contraction pattern ("don't") used three times in headings sits oddly against the neutral non-contracted prose elsewhere in the same doc.

---

## LOW (nitpick, batch later)

### L-1. The repo URL is not consistent across docs

**Files:** `src/content/docs/legal/privacy.mdx`, `src/content/docs/legal/disclaimer.mdx`
**Sections:** GitHub references
**Current text:**
- Privacy: "github.com/clawless-io/clawdemy"
- Disclaimer: "github.com/clawless-io/clawdemy"

**Proposed text:** Make the references hyperlinks (markdown link syntax) rather than bare URLs, and standardize on one form across all docs.

**Justification:** Bare URLs are fine but are less accessible (no underline, no link-target context for screen readers) and look less professional than linked text. Pure polish.

---

### L-2. "We" / "Clawdemy" / "RBJ Global LLC" voice flips

**Files:** all four
**Sections:** various
**Current text:** Pronoun usage flips between "Clawdemy" (the property), "we" (the operator), and "RBJ Global LLC" (the entity).

**Proposed text:** Establish at the top of each doc that "we / us / our" means RBJ Global LLC operating clawdemy.org, and then use the pronouns consistently. Reserve "RBJ Global LLC" for the entity-specific contexts (limitation of liability, governing law, contact block).

**Justification:** Khan Academy and Coursera both establish the pronoun-to-entity mapping in the opening paragraph and keep it consistent. The Clawdemy docs do this most of the time but slip occasionally (e.g., "Clawdemy uses Pagefind" mid-Privacy where "we use Pagefind" would match the surrounding pronoun voice).

---

### L-3. "Texas law" should be "the laws of the State of Texas, USA"

**File:** `src/content/docs/legal/terms.mdx`
**Section:** "Limitation of liability"
**Current text:**
> To the maximum extent permitted by Texas law, RBJ Global LLC is not liable for any damages arising from your use of this educational site or the curriculum it publishes.

**Proposed text:**
> To the maximum extent permitted by the laws of the State of Texas, USA, RBJ Global LLC and its members, officers, employees, and agents are not liable for any direct, indirect, incidental, consequential, special, or exemplary damages arising from or relating to your use of this educational site or the curriculum it publishes, even if advised of the possibility of such damages.

**Justification:** The current limitation-of-liability clause is unusually short for a B2C site. The proposed expansion adds the standard "members, officers, employees, agents" downstream coverage and the standard damages enumeration. This is LOW because the brevity is a brand-voice choice and does not actively expose RBJ Global LLC; the expansion is closer to what a Texas court would expect to see.

---

### L-4. Cookie Policy should include the Sec-Fetch / SameSite / Secure cookie attributes for full transparency

**File:** `src/content/docs/legal/cookies.mdx`
**Section:** "The cookies we may set" table
**Current text:** Table omits cookie attributes.

**Proposed text:** Add a sentence below the table:
> The `cw_star_<slug>` cookie is set with the `Secure` and `SameSite=Lax` attributes. It is HTTP-only by default and is never readable from JavaScript outside the click handler that sets it.

**Justification:** A privacy-forward Cookie Policy that already over-discloses (which is good) can lean further into the "we set it correctly" signal by listing the attributes. This is LOW because users don't typically read this, but security-curious readers and privacy reviewers will, and it costs almost nothing to add. NOTE: Confirm the actual cookie attributes in code before publishing this language.

---

### L-5. "Decisions you make about your career, your business, your code, or your life should not rest on a Clawdemy lesson alone" is great, but can be stronger

**File:** `src/content/docs/legal/disclaimer.mdx`
**Section:** "Educational content"
**Current text:**
> Decisions you make about your career, your business, your code, or your life should not rest on a Clawdemy lesson alone.

**Proposed text:**
> Important decisions about your career, business, code, security posture, money, health, or legal standing should not rest on a Clawdemy lesson alone. Cross-check with primary sources (which we link in every lesson) and, where appropriate, with a qualified professional.

**Justification:** Adding "security posture, money, health, or legal standing" sharpens the disclaimer for the specific harms an AI-literacy site can plausibly contribute to (a reader copies a security pattern from a lesson, a reader makes a financial bet on a model's behavior, etc.). Explicit always wins over implicit in a disclaimer.

---

### L-6. Privacy Policy "Verification" section is delightful but should anchor to specific browser versions or note the UI changes

**File:** `src/content/docs/legal/privacy.mdx`
**Section:** "Verification"
**Current text:**
> Open your browser's developer tools, navigate to the Network tab, and reload any page on this site.

**Proposed text:** No verbatim change. Just a note that browser dev-tools UI evolves and the description may drift from reality. Consider anchoring to a year ("As of 2026, in Chrome…") or removing the version-specific language.

**Justification:** Khan Academy avoids this kind of UI-pinned instruction precisely because of drift. The Clawdemy version is charming and educational; just be aware it will need a refresh every couple of years.

---

### L-7. Disclaimer "Open curriculum, mixed sources" implies more sources than currently exist

**File:** `src/content/docs/legal/disclaimer.mdx`
**Section:** "Open curriculum, mixed sources"
**Current text:**
> Clawdemy adapts public educational material (currently Stanford CME 295 and other open sources) into a free, audio-narrated form.

**Proposed text:**
> Clawdemy adapts public educational material into a free, audio-narrated form. Current source material includes Stanford CME 295 lecture notes; additional sources will be added as new tracks ship and will be cited per-lesson.

**Justification:** "And other open sources" is hand-wavy if the only current source is Stanford. Tightening to "current source material includes…" is more honest and gives the doc a natural place to grow.

---

## Cross-document observations

### O-1. The four docs are very nearly internally consistent (good)

The "we collect almost nothing" claim is consistent across Privacy, Cookies, and Disclaimer. The CC BY-SA license claim shows up in Terms and Disclaimer with the technical inconsistency noted in C-2 / C-3. The contact block is consistent (same address in all four — though see C-1 about whether that address is the right one).

### O-2. The brand rule on em-dashes / en-dashes is fully respected

Verified with a Unicode grep across all four files. Zero em-dashes (U+2014), zero en-dashes (U+2013). The prose reads cleanly with the comma / paren / period style the brand requires.

### O-3. The four docs do not name the founder (which is consistent with brand-voice intent)

Jay Siddiqi is named publicly on the mission page and elsewhere on the site, but is not in the legal docs. This is appropriate — legal docs name the entity (RBJ Global LLC) and not the individual. No change recommended; flagging only because the brief mentioned the founder is named publicly and a reviewer might wonder why the legal docs don't include the name.

### O-4. The "noindex,follow" robots meta on every legal page is unusual

All four docs have `robots: noindex,follow` in the frontmatter. This means the legal docs will not appear in search engine results. For a small educational site with no commerce flow this is a defensible choice, but it does mean a privacy-curious user searching "clawdemy privacy policy" via Google will not find the page directly. Reputable educational sites generally allow indexing of their legal docs because the docs are themselves a credibility signal. Worth a founder discussion. Not a finding (this is a deliberate technical choice), just an observation.

### O-5. The legal docs do not link to each other

Privacy links to the Cookie Policy once. The other docs do not cross-link. Adding a "see also" footer to each doc with links to the other three would be a small UX improvement and would make the legal section feel like one coherent set of documents rather than four parallel pages.

### O-6. No "data retention" statement in Privacy

Beyond the 1-year cookie duration, the Privacy Policy does not state how long any data is retained. For an educational site that collects almost nothing, this is fine, but a half-sentence would make the disclosure complete: "Aggregate per-lesson star counts are retained indefinitely as part of the site's public state. We have no other data to retain."

---

## Triage routing (from the commissioning brief)

Per the brief:
- **LOW + MEDIUM:** site-dev applies autonomously after Architect triage.
- **HIGH + CRITICAL:** route to founder via Clawless Advisor for sign-off, then apply.

The CRITICAL items (C-1 contact email; C-2 / C-3 license characterization) all hinge on founder confirmation:
- C-1 needs the founder to confirm which email is canonical.
- C-2 / C-3 need the founder to confirm the per-lesson licensing model (which they already operate but may want to phrase differently).

The HIGH items are largely additive (CCPA paragraph, GDPR paragraph, expanded AI-disclosure section, attribution string, severability cluster, DMCA route) and do not conflict with anything in the current docs. They can be drafted in a single PR for founder review.

---

## End of report

Signed: senior policy and terms reviewer (independent audit), 2026-05-02. Not legal advice.

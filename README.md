# Clawdemy

**Free AI literacy for everyday users.** The sister project to [Clawless Computer](https://clawless.ai).

> From zero to autonomous, one lesson at a time.

Live at [clawdemy.org](https://clawdemy.org).

---

## What this is

Clawdemy is a free, public, web-based learning platform aimed at people who are most worried that AI will replace them. Articles, walkthroughs, and practical guides for turning fear into fluency.

Read more on the [mission page](https://clawdemy.org/mission/) or browse [available tracks](https://clawdemy.org/tracks/).

## What's in this repo

This repo is the **site source** that builds [clawdemy.org](https://clawdemy.org). It contains the Astro project, lesson content collections, build tooling, and CI configuration.

Operations, planning documents, agent prompt engineering, and internal review processes are intentionally kept private. The lessons are the product; the workshop floor isn't.

## Built with

- [Astro](https://astro.build/) + [Starlight](https://starlight.astro.build/), content-first, zero-JS-default
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Pagefind](https://pagefind.app/), static search
- [Cloudflare Pages](https://pages.cloudflare.com/), hosting

## Local development

```bash
bun install
bun run dev          # dev server at http://localhost:4321
bun run build        # production build + Pagefind index
bun run preview      # preview the production build
bun run typecheck    # astro check
bun run validate:all # content schema + attribution block checks
```

## Reporting issues

Found a problem in a published lesson? Open an issue. We read them.

Pull requests for typo fixes and link corrections are welcome. Larger contributions (new lessons, structural changes) are not yet open; we'll publish a contribution process when we're ready for them.

## License

**Lesson content** (everything under `src/content/docs/`): [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Share, adapt, remix, even commercially, as long as you credit Clawdemy and share-alike.

**Code, build tooling, and supporting scripts**: [MIT](./LICENSE). Use freely.

Full terms in [`LICENSE`](./LICENSE).

## Related projects

- **[Clawless Computer](https://clawless.ai)**, the desktop OS for AI that Clawdemy teaches. Closed-source.
- **[OpenClaw](https://github.com/openclaw/openclaw)**, the open-source engine Clawless wraps. Not the same thing as Clawless.

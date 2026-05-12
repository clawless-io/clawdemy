#!/usr/bin/env python3
"""
migrate-lesson-mdx.py — swap <AudioPlayer> for <ReadAlongLesson> in lesson.mdx.

For each input slug, performs three textual edits on the lesson's mdx:
  1. Replace `import AudioPlayer from '.../AudioPlayer.astro';`
       with  `import ReadAlongLesson from '.../ReadAlongLesson.astro';`
  2. Replace the `<AudioPlayer src=... approxMinutes={N} />` invocation
       with  `<ReadAlongLesson src=... slug="<slug>" approxMinutes={N} />`
     The `src=` value is preserved verbatim, including any existing query
     string (so the pilot lesson's `?v=YYYYMMDD` cache-buster survives).
     The slug attribute is added because <ReadAlongLesson> uses it to
     resolve the timing JSON path.

Skips a lesson if it already imports ReadAlongLesson (idempotent), or
if it does not import AudioPlayer (nothing to migrate).

Does NOT touch:
  - Lesson body prose
  - Frontmatter
  - LessonStar invocations
  - Any other component imports

Usage:
  python3 scripts/migrate-lesson-mdx.py <slug> [<slug> ...]
  python3 scripts/migrate-lesson-mdx.py --all
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
LESSONS = REPO / "src" / "content" / "docs" / "lessons"


EASY_SLUGS = [
    "attention-efficiency-tricks",
    "chain-of-thought-prompting",
    "encoder-decoder-and-t5-span-corruption",
    "how-agent-loops-work",
    "how-ai-reads-tokens",
    "how-attention-works",
    "how-models-are-pretrained",
    "how-models-call-functions",
    "how-prompting-works",
    "how-reasoning-models-think",
    "how-text-is-generated",
    "how-we-evaluate-models",
    "how-words-become-vectors",
    "in-context-learning-and-few-shot",
    "layer-norm-and-rmsnorm",
    "multi-head-attention",
    "new-ways-to-generate",
    "parallelism-and-flash-attention",
    "position-embeddings-and-rope",
    "quantization-and-mixed-precision",
    "rlhf-and-dpo",
    "transformer-block",
    "transformers-beyond-text",
    "where-to-be-careful",
    "why-benchmarks-can-mislead",
    "why-scale-matters",
    "why-tool-using-models-fail",
    "ai-wont-replace-you",
]


def find_mdx(slug: str) -> Path | None:
    matches = list(LESSONS.glob(f"*/{slug}/lesson.mdx"))
    if len(matches) != 1:
        return None
    return matches[0]


def revert_one(slug: str) -> tuple[bool, str]:
    """Reverse migration: swap <ReadAlongLesson .../> back to <AudioPlayer .../>.

    Used as a production kill-switch: every lesson goes back to the plain
    AudioPlayer card. Read-along code, timing JSONs, alignment scripts all
    remain on disk for dev iteration; just no production page surfaces
    them anymore. Re-enabling is `migrate_one(slug)` again.
    """
    mdx_path = find_mdx(slug)
    if mdx_path is None:
        return False, "no lesson.mdx found"

    text = mdx_path.read_text()

    if "ReadAlongLesson" not in text:
        return False, "not migrated"

    new_text, n_imports = re.subn(
        r"import\s+ReadAlongLesson\s+from\s+'([^']+)/ReadAlongLesson\.astro';",
        r"import AudioPlayer from '\1/AudioPlayer.astro';",
        text,
    )
    if n_imports != 1:
        return False, f"expected 1 ReadAlongLesson import, found {n_imports}"

    pattern = re.compile(r"<ReadAlongLesson\b([\s\S]*?)/>", re.DOTALL)
    match = pattern.search(new_text)
    if not match:
        return False, "no <ReadAlongLesson .../> invocation"

    attrs_raw = match.group(1)
    # Drop the slug attribute we added during migration.
    attrs_raw = re.sub(r'\s*slug="[^"]*"', "", attrs_raw)
    # Drop any cache-buster query string from src so the audio URL is back
    # to the bare canonical form. Listeners hit the regular CF-cached MP3.
    attrs_raw = re.sub(
        r'(src="[^"]*\.mp3)\?[^"]*"',
        r'\1"',
        attrs_raw,
    )
    attrs_raw = attrs_raw.strip()
    new_invocation = f"<AudioPlayer {attrs_raw} />"
    new_text = new_text[: match.start()] + new_invocation + new_text[match.end():]

    mdx_path.write_text(new_text)
    return True, "reverted"


def migrate_one(slug: str) -> tuple[bool, str]:
    mdx_path = find_mdx(slug)
    if mdx_path is None:
        return False, "no lesson.mdx found"

    text = mdx_path.read_text()

    if "ReadAlongLesson" in text:
        return False, "already migrated"
    if "AudioPlayer" not in text:
        return False, "no AudioPlayer invocation"

    # Rewrite the import line.
    new_text, n_imports = re.subn(
        r"import\s+AudioPlayer\s+from\s+'([^']+)/AudioPlayer\.astro';",
        r"import ReadAlongLesson from '\1/ReadAlongLesson.astro';",
        text,
    )
    if n_imports != 1:
        return False, f"expected 1 AudioPlayer import, found {n_imports}"

    # Find and rewrite the <AudioPlayer ... /> invocation.
    # The invocation may have multiple attributes; capture the inner text
    # and pass through. The src= attribute we keep verbatim (including
    # the URL slashes); the slug= attribute we add. The character class
    # must NOT exclude `/` because the audio URL contains slashes.
    pattern = re.compile(
        r"<AudioPlayer\b([\s\S]*?)/>",
        re.DOTALL,
    )
    match = pattern.search(new_text)
    if not match:
        return False, "no <AudioPlayer .../> self-closing invocation"

    attrs_raw = match.group(1).strip()
    # Append slug attribute if not already there.
    if "slug=" not in attrs_raw:
        # Place slug right after src=
        attrs_raw = re.sub(
            r'(src="[^"]*")',
            rf'\1\n  slug="{slug}"',
            attrs_raw,
            count=1,
        )
    # Reformat: opening tag on its own line, each attribute on its own,
    # closing /> on its own line, indented two spaces.
    # The simplest version that keeps attributes readable:
    new_invocation = f"<ReadAlongLesson {attrs_raw} />"

    new_text = new_text[: match.start()] + new_invocation + new_text[match.end():]

    mdx_path.write_text(new_text)
    return True, "migrated"


ALL_MIGRATED_SLUGS = EASY_SLUGS + [
    "bert-architecture",
    "bert-pretraining-and-fine-tuning",
    "bert-derivatives-distilbert-roberta",
    "how-models-learn-to-be-helpful",
    "how-rag-works",
    "preferences-into-reward-signals",
    "how-models-know-word-order",
]


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print(
            "usage:\n"
            "  migrate-lesson-mdx.py <slug> [<slug> ...]   # migrate\n"
            "  migrate-lesson-mdx.py --all                  # migrate the easy set\n"
            "  migrate-lesson-mdx.py --revert <slug> ...    # revert per slug\n"
            "  migrate-lesson-mdx.py --revert --all         # revert every migrated lesson",
            file=sys.stderr,
        )
        return 2

    revert_mode = "--revert" in args
    if revert_mode:
        args = [a for a in args if a != "--revert"]

    if revert_mode:
        slugs = ALL_MIGRATED_SLUGS if args == ["--all"] else args
        action = revert_one
        action_label = "reverted"
        already_label = "not migrated"
    else:
        slugs = EASY_SLUGS if args == ["--all"] else args
        action = migrate_one
        action_label = "migrated"
        already_label = "already migrated"

    ok = 0
    skipped = 0
    failed = 0
    for slug in slugs:
        success, msg = action(slug)
        flag = "ok " if success else "skip" if msg in ("already migrated", "not migrated") else "FAIL"
        print(f"  [{flag}] {slug:42s}  {msg}")
        if success:
            ok += 1
        elif msg in ("already migrated", "not migrated"):
            skipped += 1
        else:
            failed += 1
    print(f"\n{ok} {action_label}, {skipped} skipped, {failed} failed")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())

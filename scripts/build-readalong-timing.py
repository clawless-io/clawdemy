#!/usr/bin/env python3
"""
build-readalong-timing.py — produce per-MDX-word timing JSON for read-along.

Pipeline:
  WhisperX raw output (.read-along-trial/<slug>.json)
    + lesson MDX (src/content/docs/lessons/<track>/<slug>/lesson.mdx)
    -> public/read-along/<slug>.timing.json

The MDX is the source of truth for what the reader sees. We extract prose
words from MDX in render order (frontmatter / imports / component tags /
fenced code / inline code stripped). We then sequence-match those MDX words
against the WhisperX-aligned audio words. The output array has one entry
per MDX word, in render order, with start/end timestamps when matched (or
nulls for words the narrator skipped or rephrased).

The runtime <ReadAlongLesson> component walks the rendered lesson body in
DOM order and assigns the Nth prose word to the Nth entry in the words
array. The word-tokenization rule (`\\S+` with at-least-one-letter-or-digit)
is identical on both sides, so positions align.

Usage:
  python3 scripts/build-readalong-timing.py <slug>
"""

from __future__ import annotations

import difflib
import json
import re
import sys
from pathlib import Path


WORD_RE = re.compile(r"\S+")
HAS_ALNUM = re.compile(r"[A-Za-z0-9]")


def normalize(word: str) -> str:
    return re.sub(r"[^a-z0-9']", "", word.lower())


def flatten_whisperx(raw: dict) -> list[dict]:
    out = []
    for seg in raw.get("segments", []):
        for w in seg.get("words", []):
            if "start" in w and "end" in w:
                out.append({"word": w["word"], "start": w["start"], "end": w["end"]})
    return out


def extract_mdx_words(mdx_text: str) -> list[str]:
    """Extract prose words from MDX in render order.

    The runtime DOM walker must produce the same sequence. Skip rules:
      - Frontmatter (--- ... ---)
      - Import statements
      - Component tags (self-closing and paired)
      - Fenced code blocks (```...```)
      - Inline code (`...`)
      - Markdown link URLs (keep link text)
      - Inline emphasis markers (* and _)
      - Heading markers (## etc.)
      - List bullets, blockquote markers, trailing hard-breaks (\\)

    Tokens with no letters or digits (e.g. lone "=", "—") are not "words"
    on either side.
    """
    text = mdx_text

    # Frontmatter
    if text.startswith("---"):
        end_fm = text.find("---", 3)
        if end_fm != -1:
            text = text[end_fm + 3:]

    # Imports
    text = re.sub(r"^import .*$", "", text, flags=re.MULTILINE)

    # Self-closing component tags <Component ... />
    text = re.sub(r"<[A-Z][A-Za-z0-9]*[^>]*?/>", "", text, flags=re.DOTALL)

    # Paired component tags <Component ...>...</Component>
    text = re.sub(
        r"<([A-Z][A-Za-z0-9]*)[^>]*?>.*?</\1>",
        "",
        text,
        flags=re.DOTALL,
    )

    # Fenced code blocks
    text = re.sub(r"```.*?```", "", text, flags=re.DOTALL)

    # Inline code
    text = re.sub(r"`[^`\n]*`", "", text)

    # Markdown links [text](url) -> text
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)

    # Emphasis markers
    text = re.sub(r"\*+", "", text)
    text = re.sub(r"_{2,}", "", text)

    # Heading markers
    text = re.sub(r"^#+\s+", "", text, flags=re.MULTILINE)

    # List bullets
    text = re.sub(r"^\s*[-*+]\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"^\s*\d+\.\s+", "", text, flags=re.MULTILINE)

    # Blockquote markers
    text = re.sub(r"^\s*>\s+", "", text, flags=re.MULTILINE)

    # Trailing hard-break backslash
    text = re.sub(r"\\\s*$", "", text, flags=re.MULTILINE)

    return [w for w in WORD_RE.findall(text) if HAS_ALNUM.search(w)]


def align(mdx_words: list[str], whisperx_words: list[dict]) -> list[dict]:
    mdx_norm = [normalize(w) for w in mdx_words]
    wx_norm = [normalize(w["word"]) for w in whisperx_words]

    matcher = difflib.SequenceMatcher(a=mdx_norm, b=wx_norm, autojunk=False)

    result: list[dict | None] = [None] * len(mdx_words)
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            for offset in range(i2 - i1):
                m_idx = i1 + offset
                w_idx = j1 + offset
                result[m_idx] = {
                    "text": mdx_words[m_idx],
                    "start": whisperx_words[w_idx]["start"],
                    "end": whisperx_words[w_idx]["end"],
                }

    for i, w in enumerate(mdx_words):
        if result[i] is None:
            result[i] = {"text": w, "start": None, "end": None}

    return result  # type: ignore[return-value]


def find_mdx_path(slug: str, project_root: Path) -> Path:
    candidates = list(
        (project_root / "src" / "content" / "docs" / "lessons").glob(
            f"*/{slug}/lesson.mdx"
        )
    )
    if not candidates:
        raise SystemExit(
            f"Could not find lesson.mdx for slug '{slug}' under any track."
        )
    if len(candidates) > 1:
        raise SystemExit(
            f"Multiple matches for slug '{slug}': {candidates}"
        )
    return candidates[0]


def main() -> None:
    if len(sys.argv) != 2:
        print(
            "Usage: python3 scripts/build-readalong-timing.py <slug>",
            file=sys.stderr,
        )
        raise SystemExit(2)
    slug = sys.argv[1]

    project_root = Path(__file__).parent.parent
    raw_path = project_root / ".read-along-trial" / f"{slug}.json"
    mdx_path = find_mdx_path(slug, project_root)
    out_path = project_root / "public" / "read-along" / f"{slug}.timing.json"

    if not raw_path.exists():
        raise SystemExit(
            f"Raw WhisperX JSON not found at {raw_path}. "
            f"Run scripts/align-lesson-audio.py first, or place the raw "
            f"alignment at that path."
        )

    raw = json.loads(raw_path.read_text())
    whisperx = flatten_whisperx(raw)
    if not whisperx:
        raise SystemExit(f"No aligned words in {raw_path}")

    mdx_text = mdx_path.read_text()
    mdx_words = extract_mdx_words(mdx_text)
    if not mdx_words:
        raise SystemExit(f"No prose words extracted from {mdx_path}")

    aligned = align(mdx_words, whisperx)
    matched = sum(1 for w in aligned if w["start"] is not None)

    output = {
        "schema_version": 1,
        "slug": slug,
        "audio_url": f"https://audio.clawdemy.org/lessons/{slug}-lesson.mp3",
        "stats": {
            "mdx_words": len(mdx_words),
            "whisperx_words": len(whisperx),
            "matched_words": matched,
            "match_rate": round(matched / len(mdx_words), 4),
        },
        "words": aligned,
    }

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(output, indent=2) + "\n")

    print(f"Wrote {out_path}")
    print(f"  MDX words:      {output['stats']['mdx_words']}")
    print(f"  WhisperX words: {output['stats']['whisperx_words']}")
    print(
        f"  Matched:        {output['stats']['matched_words']} "
        f"({output['stats']['match_rate'] * 100:.1f}%)"
    )


if __name__ == "__main__":
    main()

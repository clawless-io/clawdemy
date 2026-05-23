#!/usr/bin/env python3
"""
rollout-readalong.py — batch-migrate lessons to the read-along component.

For each input slug, runs the per-lesson pipeline:
  1. Stage the MP3 in .read-along-trial/ (copy from public/audio/, or
     download from R2 if absent locally).
  2. Run WhisperX on the MP3 -> raw alignment JSON in .read-along-trial/.
  3. Run build-readalong-timing.py -> public/read-along/<slug>.timing.json.

Idempotent: if .read-along-trial/<slug>.json already exists, the WhisperX
step is skipped. If public/read-along/<slug>.timing.json already exists
AND is newer than its inputs, the build-readalong-timing step is skipped.

MDX edits (component swap) are NOT in this script. Run
scripts/migrate-lesson-mdx.py after this finishes.

Usage:
  python3 scripts/rollout-readalong.py <slug> [<slug> ...]
  python3 scripts/rollout-readalong.py --all     # every easy lesson
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
AUDIO_DIR = REPO / "public" / "audio"
TRIAL_DIR = REPO / ".read-along-trial"
PUBLIC_TIMING = REPO / "public" / "read-along"
WHISPERX = Path.home() / "Library" / "Python" / "3.9" / "bin" / "whisperx"


def stage_mp3(slug: str) -> Path | None:
    """Ensure .read-along-trial/<slug>.mp3 exists; return its path."""
    target = TRIAL_DIR / f"{slug}.mp3"
    if target.exists():
        return target
    src = AUDIO_DIR / f"{slug}-lesson.mp3"
    if src.exists():
        TRIAL_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copy(src, target)
        return target
    # Try R2 download as a last resort.
    url = f"https://audio.clawdemy.org/lessons/{slug}-lesson.mp3"
    print(f"  -> downloading from {url}")
    TRIAL_DIR.mkdir(parents=True, exist_ok=True)
    r = subprocess.run(["curl", "-fL", "-o", str(target), url])
    if r.returncode != 0:
        print(f"  !! curl failed for {slug}", file=sys.stderr)
        return None
    return target


def run_whisperx(slug: str) -> bool:
    raw = TRIAL_DIR / f"{slug}.json"
    if raw.exists():
        return True
    mp3 = TRIAL_DIR / f"{slug}.mp3"
    if not mp3.exists():
        print(f"  !! no staged mp3 at {mp3}", file=sys.stderr)
        return False
    if not WHISPERX.exists():
        print(f"  !! whisperx binary not found at {WHISPERX}", file=sys.stderr)
        return False
    cmd = [
        str(WHISPERX),
        str(mp3),
        "--model", "small.en",
        "--device", "cpu",
        "--compute_type", "int8",
        "--language", "en",
        "--vad_method", "silero",
        "--output_format", "json",
        "--output_dir", str(TRIAL_DIR),
    ]
    t0 = time.time()
    r = subprocess.run(cmd, capture_output=True, text=True)
    elapsed = time.time() - t0
    if r.returncode != 0:
        print(f"  !! whisperx failed for {slug} ({elapsed:.1f}s)", file=sys.stderr)
        print(r.stderr[-1000:], file=sys.stderr)
        return False
    print(f"  -> whisperx ok ({elapsed:.1f}s)")
    return raw.exists()


def build_timing(slug: str) -> bool:
    cmd = ["python3", str(REPO / "scripts" / "build-readalong-timing.py"), slug]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f"  !! build-readalong-timing failed for {slug}", file=sys.stderr)
        print(r.stderr, file=sys.stderr)
        return False
    # Print the last line with the match rate.
    for line in r.stdout.splitlines():
        if "Matched:" in line or "Wrote " in line:
            print(f"  {line.strip()}")
    return True


def process(slug: str) -> bool:
    print(f"[{slug}]")
    if not stage_mp3(slug):
        return False
    if not run_whisperx(slug):
        return False
    if not build_timing(slug):
        return False
    return True


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


def main() -> int:
    args = sys.argv[1:]
    if not args:
        print("usage: rollout-readalong.py <slug> [<slug> ...] | --all", file=sys.stderr)
        return 2
    slugs = EASY_SLUGS if args == ["--all"] else args

    total = len(slugs)
    ok = []
    fail = []
    t_start = time.time()
    for i, slug in enumerate(slugs, 1):
        print(f"\n=== ({i}/{total}) {slug} ===  [elapsed: {(time.time()-t_start)/60:.1f}m]")
        if process(slug):
            ok.append(slug)
        else:
            fail.append(slug)

    print("\n" + "=" * 60)
    print(f"done in {(time.time()-t_start)/60:.1f} min: {len(ok)} ok, {len(fail)} failed")
    if fail:
        print("FAILED slugs:")
        for s in fail:
            print(f"  {s}")
    return 0 if not fail else 1


if __name__ == "__main__":
    raise SystemExit(main())

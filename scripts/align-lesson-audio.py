#!/usr/bin/env python3
"""Forced-alignment helper: WhisperX on a lesson MP3.

Runs WhisperX and writes a raw alignment JSON to
`.read-along-trial/<slug>.json`. That raw output is the input to
`scripts/build-readalong-timing.py`, which produces the MDX-aligned
production timing JSON consumed by `<ReadAlongLesson>`.

Pipeline:
    audio:generate -> mp3 in public/audio/
    cp public/audio/<slug>-lesson.mp3 .read-along-trial/<slug>.mp3
    align-lesson-audio.py <slug>             # this script
    build-readalong-timing.py <slug>         # produces public/read-along/*.timing.json

Usage:
    python3 scripts/align-lesson-audio.py <slug>

The script expects:
- An MP3 at .read-along-trial/<slug>.mp3 (copy from public/audio/ after
  audio:generate runs).
- WhisperX installed (pip install whisperx) and ffmpeg on PATH.
- WhisperX CLI on PATH. On macOS with pip --user installs, that means:
  export PATH="$HOME/Library/Python/3.9/bin:$PATH"

Uses --vad_method silero to avoid the pyannote PyTorch 2.6 weights_only
incompatibility that surfaces with the default pyannote VAD.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent
TRIAL_DIR = REPO_ROOT / ".read-along-trial"
PUBLIC_DIR = REPO_ROOT / "public" / "read-along"


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: align-lesson-audio.py <slug>", file=sys.stderr)
        return 2

    slug = sys.argv[1]
    audio_path = TRIAL_DIR / f"{slug}.mp3"
    if not audio_path.exists():
        print(f"audio not found: {audio_path}", file=sys.stderr)
        print(f"hint: curl -o {audio_path} https://audio.clawdemy.org/lessons/{slug}-lesson.mp3", file=sys.stderr)
        return 1

    whisperx = shutil.which("whisperx")
    if not whisperx:
        print("whisperx not on PATH (pip install whisperx, then add ~/Library/Python/<ver>/bin to PATH)", file=sys.stderr)
        return 1

    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    raw_json = TRIAL_DIR / f"{slug}.json"

    cmd = [
        whisperx,
        str(audio_path),
        "--model", "small.en",
        "--device", "cpu",
        "--compute_type", "int8",
        "--language", "en",
        "--vad_method", "silero",
        "--output_format", "json",
        "--output_dir", str(TRIAL_DIR),
    ]
    print("running:", " ".join(cmd))
    subprocess.run(cmd, check=True)

    if not raw_json.exists():
        print(f"expected output not found: {raw_json}", file=sys.stderr)
        return 1

    with raw_json.open() as f:
        timing = json.load(f)
    word_count = sum(len(seg.get("words", [])) for seg in timing.get("segments", []))
    print(f"wrote {raw_json} ({word_count} aligned words across {len(timing.get('segments', []))} segments)")
    print(f"next: python3 scripts/build-readalong-timing.py {slug}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

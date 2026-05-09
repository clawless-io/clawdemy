#!/usr/bin/env python3
"""Forced-alignment helper for the read-along trial.

Runs WhisperX on a lesson MP3 and writes a word-level timing JSON to
public/read-along/<slug>.timing.json. The trial preview page reads that JSON
to highlight words synchronously with the audio.

Usage:
    python3 scripts/align-lesson-audio.py <slug>

The script expects:
- An MP3 at .read-along-trial/<slug>.mp3 (download manually from R2 first).
- WhisperX installed (pip install whisperx) and ffmpeg on PATH.

It uses --vad_method silero to avoid the pyannote PyTorch 2.6 weights_only
incompatibility that surfaces with the default pyannote VAD.

Trial only. The full feature build will move alignment into the audio:generate
pipeline (likely via ElevenLabs with-timestamps for new renders) so this
script does not need to be production-grade.
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

    target = PUBLIC_DIR / f"{slug}.timing.json"
    shutil.copy(raw_json, target)

    with target.open() as f:
        timing = json.load(f)
    word_count = sum(len(seg.get("words", [])) for seg in timing.get("segments", []))
    print(f"wrote {target} ({word_count} aligned words across {len(timing.get('segments', []))} segments)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

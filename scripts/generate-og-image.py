#!/usr/bin/env python3
"""
Open Graph image generator for clawdemy.org.

Renders the 1200x630 social preview card surfaced on LinkedIn, Twitter,
Facebook, Slack, etc. when a clawdemy.org URL is shared. Output is
written to public/og-default.png, the existing path the Astro layout's
<meta property="og:image"> tag references.

Family pattern (cross-product, established by whisprdesk-developer at
whisprdesk-website commit 648056d): white background, centered three-
line hierarchy (title -> primary tagline -> sub-tagline), supersampled
2x render with LANCZOS downsample. Slate-800 + slate-600 on the two
text lines is family DNA; only the title color and (optionally) title
font vary per product.

This OG card is the light-bg replacement for the prior dark-bg
public/og-default.png. The dark version did not pop against LinkedIn's
white card chrome; the light version surfaces the brand on the same
canvas the rest of the RBJ product family uses (Clawless, WhisprDesk,
RBJ Global).

Run:
  python3 scripts/generate-og-image.py

Output:
  public/og-default.png  (1200x630, PNG-optimize, ~80-150KB)

NOTE on cross-repo placement: this generator was authored by
Clawless Site Developer in coordination with the cross-product OG
work on 2026-05-16, founder-authorized via direct dispatch. The
clawdemy-developer terminal was deliberately not involved (per
founder: "the developer is currently busy working on lessons, I don't
want to disturb"). If clawdemy-developer wants to take ownership of
this script later, the per-repo placement makes that handoff clean.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = REPO_ROOT / "public" / "og-default.png"

WIDTH, HEIGHT = 1200, 630
SCALE = 2
RENDER_W, RENDER_H = WIDTH * SCALE, HEIGHT * SCALE

# Family DNA: white background. Clawdemy's live site default is dark
# mode, but the OG card lives in LinkedIn's chrome and should match the
# family-wide light-bg pattern for cross-product visual coherence.
BG = (255, 255, 255)

# Title color: teal-700. Chosen to give Clawdemy a distinct identity in
# the family color matrix:
#   - whisprdesk: dark royal blue (#1F49C4)
#   - clawless: cyan-700 (#0E7490)
#   - rbjglobal: warm brown (#6B4226)
#   - clawdemy: teal-700 (#0F766E)  <- this product
# Teal reads as "growth / learning / wisdom" and stays in the cool-color
# half of the family without overlapping clawless's cyan or whisprdesk's
# royal blue.
TITLE_COLOR = (15, 118, 110)   # #0F766E

# Family DNA text colors. Do not vary per product.
TAGLINE_COLOR = (31, 41, 55)   # slate-800 #1f2937
DETAIL_COLOR = (71, 85, 105)   # slate-600 #475569

# Fonts. SF Pro Rounded for the wordmark matches whisprdesk and clawless.
# Clawdemy's site uses Inter sans-serif as primary, so a rounded sans for
# the wordmark stays in the family typographic register.
SF_REGULAR = "/System/Library/Fonts/SFNS.ttf"
SF_ROUNDED = "/System/Library/Fonts/SFNSRounded.ttf"


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def center_x(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    return (RENDER_W - (bbox[2] - bbox[0])) // 2


def main() -> None:
    img = Image.new("RGB", (RENDER_W, RENDER_H), BG)
    draw = ImageDraw.Draw(img)

    title_font = load_font(SF_ROUNDED, 168 * SCALE)
    tagline_font = load_font(SF_REGULAR, 68 * SCALE)
    detail_font = load_font(SF_REGULAR, 46 * SCALE)

    title = "Clawdemy"
    tagline = "Free AI literacy."
    detail = "From zero to autonomous, one lesson at a time."

    title_y = 150 * SCALE
    tagline_y = 360 * SCALE
    detail_y = 480 * SCALE

    draw.text((center_x(draw, title, title_font), title_y), title, fill=TITLE_COLOR, font=title_font)
    draw.text((center_x(draw, tagline, tagline_font), tagline_y), tagline, fill=TAGLINE_COLOR, font=tagline_font)
    draw.text((center_x(draw, detail, detail_font), detail_y), detail, fill=DETAIL_COLOR, font=detail_font)

    final = img.resize((WIDTH, HEIGHT), Image.LANCZOS)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    final.save(OUT_PATH, "PNG", optimize=True)
    print(f"Wrote {OUT_PATH} ({WIDTH}x{HEIGHT}, supersampled {SCALE}x)")


if __name__ == "__main__":
    main()

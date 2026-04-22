/**
 * Generates the default Open Graph preview image used in social shares.
 *
 * Output: public/og-default.png (1200x630, the dimension social platforms expect).
 *
 * This is a placeholder. Replace with a designed asset whenever a real visual
 * is ready — the meta tag in src/components/Head.astro doesn't change.
 *
 * Run: bun run scripts/generate-og-image.ts
 */

import sharp from 'sharp';

const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0d1117"/>
      <stop offset="100%" stop-color="#1a1f2e"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="270" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="120" font-weight="800" fill="#ffffff" text-anchor="middle" letter-spacing="-3">Clawdemy</text>
  <text x="600" y="380" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="400" fill="#a8b2c1" text-anchor="middle">From zero to autonomous,</text>
  <text x="600" y="430" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="38" font-weight="400" fill="#a8b2c1" text-anchor="middle">one lesson at a time.</text>
  <text x="600" y="540" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="500" fill="#5a6a7d" text-anchor="middle">clawdemy.org</text>
</svg>
`);

const outputPath = 'public/og-default.png';

await sharp(svg).png({ quality: 95 }).toFile(outputPath);
console.log(`OG image written to ${outputPath}`);

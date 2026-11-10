Clawdemy self-hosted brand fonts.

Inter and JetBrains Mono are not ours. Both are licensed under the SIL Open
Font License 1.1, and the OFL requires the license to travel with the font
files, which is why the two LICENSE files sit here beside them.

Files are the unmodified latin variable subsets published by Fontsource:

  @fontsource-variable/inter          5.2.8  inter-latin-wght-normal.woff2
  @fontsource-variable/inter          5.2.8  inter-latin-wght-italic.woff2
  @fontsource-variable/jetbrains-mono 5.2.8  jetbrains-mono-latin-wght-normal.woff2

Each file was verified byte-identical (sha256) to the npm registry tarball
before it was committed, so the bytes here are the published bytes.

They are served from this origin, never from a font CDN. The
Content-Security-Policy in public/_headers sets font-src 'self', so a
third-party font host would be blocked rather than silently allowed.

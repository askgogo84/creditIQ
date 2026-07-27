// Phase 1 design-system fonts — self-hosted via next/font/local (no Google CDN;
// Clash/Satoshi aren't on it anyway). These are ADDED as new CSS variables and do
// NOT replace the app's current fonts (body still renders Geist). Only <Figure>
// consumes --font-jbmono this phase; --font-clash / --font-satoshi are loaded and
// ready for Phase 2 but applied nowhere yet, so no existing page changes.
//
// Face routing (see /public/fonts):
//   Clash Display  — variable .woff2 (display) → --font-clash    [preloaded]
//   Satoshi        — variable .woff2 (body)    → --font-satoshi
//   JetBrains Mono — STATIC 400 .woff2 (data)  → --font-jbmono
//
// DEVIATION FROM TRD §2 (which names "JetBrainsMono-Variable.woff2"): JetBrains only
// ships a variable .TTF (uncompressed, heavy) — there is NO variable .woff2 — so we
// self-host the static Regular (400) .woff2. <Figure> needs a single mono weight, not
// a hierarchy, so 400 alone is sufficient. This is intentional, not a missing file.
// Phase 2 task: subset all three to Latin + ₹ before the landing page ships (that's
// the phase with the real LCP/JS budget and the final glyph set).
import localFont from 'next/font/local';

export const clashDisplay = localFont({
  src: '../public/fonts/ClashDisplay-Variable.woff2',
  weight: '400 700', // variable axis; design uses 500 + 600
  display: 'swap',
  preload: true, // the display face is the only preloaded one
  variable: '--font-clash',
  fallback: ['system-ui', 'sans-serif'],
});

export const satoshi = localFont({
  src: '../public/fonts/Satoshi-Variable.woff2',
  weight: '400 700', // variable axis; design uses 400 / 500 / 700
  display: 'swap',
  preload: false,
  variable: '--font-satoshi',
  fallback: ['system-ui', 'sans-serif'],
});

export const jetbrainsMono = localFont({
  src: '../public/fonts/JetBrainsMono-Regular.woff2',
  weight: '400', // static single weight (see deviation note above)
  display: 'swap',
  preload: false,
  variable: '--font-jbmono',
  fallback: ['ui-monospace', 'monospace'],
});

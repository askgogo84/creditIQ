// lib/face-ink.ts
// ONE source of truth for the card-FACE ink decision. WCAG relative luminance with sRGB
// linearization; the 0.1791 threshold is the exact black/white crossover, so the chosen
// ink at full opacity clears ≥4.5:1 on ANY card colour.
//
// Both CardMockup and CreditCard3D route through this. CreditCard3D previously used a
// DIVERGED YIQ luma ((0.299r+0.587g+0.114b)/255) with a >0.6 threshold — too strict on
// the light side, so some light-faced cards picked white ink and the text vanished. The
// WCAG-linear fix (110fc889) had only ever landed on CardMockup. See docs/CLEAR-THE-BOARD.md.

// Relative luminance 0 (black) .. 1 (white); returns 0 for a malformed hex.
export function faceLuminance(hex: string): number {
  const h = (hex || '').replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (n.length < 6) return 0;
  const ch = (i: number) => parseInt(n.slice(i, i + 2), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(ch(0)) + 0.7152 * lin(ch(2)) + 0.0722 * lin(ch(4));
}

// true = the face is LIGHT → use DARK ink; false = a dark face → use LIGHT ink.
export function faceIsLight(hex: string): boolean {
  return faceLuminance(hex) > 0.1791;
}

// RGB triplet for rgba(...) usage (CardMockup convention). Malformed hex → white ink,
// matching the prior CardMockup behaviour.
export function faceInk(hex: string): '0,0,0' | '255,255,255' {
  return faceIsLight(hex) ? '0,0,0' : '255,255,255';
}

import type { CSSProperties, ReactElement } from 'react';

type Kind = 'check' | 'cross' | 'neutral' | 'alert';

/**
 * Inline SVG replacement for the retired "(ok)" / "(x)" / "(!!)" / "~" ASCII
 * pseudo-icons that were shipping as literal text. Follows the GoalIcon pattern in
 * points-optimizer: stroke-based, currentColor by default, no emoji / font
 * dependency. aria-hidden — it is ALWAYS paired with adjacent text that carries
 * the meaning, so the icon is decorative to assistive tech.
 */
export function StatusGlyph({ kind, color, size = 13, style }: {
  kind: Kind;
  color?: string;
  size?: number;
  style?: CSSProperties;
}) {
  const path =
    kind === 'cross' ? 'M18 6 6 18M6 6l12 12' :
    kind === 'neutral' ? 'M5 12h14' :
    // 'alert' = an exclamation (vertical stroke + round dot) — deliberately NOT a
    // warning triangle, which reads as "caution" rather than "attention".
    kind === 'alert' ? 'M12 7v6M12 17h.01' :
    'M20 6 9 17l-5-5';
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color ?? 'currentColor'} strokeWidth={2.5}
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true" focusable="false"
      style={{ flex: '0 0 auto', ...style }}
    >
      <path d={path} />
    </svg>
  );
}

// Sentinel icon tokens for data-driven lists (where the `icon` field is otherwise
// a real emoji). A row whose icon is one of these renders a StatusGlyph; anything
// else falls through to the emoji text. Keeps status markers as crisp vectors
// while leaving genuine emoji (📞 💳 …) untouched.
const GLYPH_TOKENS: Record<string, { kind: Kind; color: string }> = {
  'glyph:check': { kind: 'check', color: '#16a34a' },
  'glyph:cross': { kind: 'cross', color: '#B84230' },
  'glyph:alert': { kind: 'alert', color: '#C9972E' },
};

/**
 * Render a StatusGlyph for a sentinel token (see GLYPH_TOKENS), or null for any
 * other value (e.g. a real emoji). Usage at a render site:
 *   {iconGlyph(item.icon, 18) ?? <span>{item.icon}</span>}
 */
export function iconGlyph(token: string, size = 16): ReactElement | null {
  const g = GLYPH_TOKENS[token];
  return g ? <StatusGlyph kind={g.kind} color={g.color} size={size} /> : null;
}

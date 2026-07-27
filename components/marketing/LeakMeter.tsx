'use client';

import { useEffect, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// The animated ₹ leak figure, rendered as an INLINE monospace span so it lives
// inside the headline sentence ("Your cards leak ₹X every year.") at the headline's
// own size — the number is the punch inside a sentence, not a separate billboard.
// Count-up 0→target over ~1.2s (ease-out, holds); prefers-reduced-motion jumps to the
// final value with no animation. Provenance (the ESTIMATED pill + caption) is composed
// by the page BELOW the sentence, so the headline completes first.
export function LeakMeter({ target, durationMs = 1200 }: { target: number; durationMs?: number }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / durationMs);
      setValue(Math.round(easeOut(t) * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return (
    <span
      style={{
        fontFamily: 'var(--font-jbmono), ui-monospace, monospace',
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"tnum" 1',
        fontSize: '0.92em', // optical match to the Clash headline (mono reads a touch larger)
        letterSpacing: '-0.02em',
        whiteSpace: 'nowrap', // never split ₹1,84,000 across lines on mobile
      }}
    >
      ₹{value.toLocaleString('en-IN')}
    </span>
  );
}

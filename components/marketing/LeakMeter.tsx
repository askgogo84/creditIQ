'use client';

import { useEffect, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// The animated ₹ leak figure, rendered as an INLINE monospace span so it lives
// inside the headline sentence ("Your cards leak ₹X–₹Y every year.") at the headline's
// own size — the number is the punch inside a sentence, not a separate billboard.
// It is a RANGE: floor (a cash-only card, no portal discipline) → ceiling (best card,
// fully optimised). Both count up 0→value over ~1.2s on a SINGLE shared progress clock
// so they land together (ease-out, holds); prefers-reduced-motion jumps straight to the
// final values. Provenance (the ESTIMATED pill + caption) is composed by the page BELOW
// the sentence, so the headline completes first.
export function LeakMeter({ floor, ceiling, durationMs = 1200 }: { floor: number; ceiling: number; durationMs?: number }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setProgress(1);
      return;
    }
    let raf = 0;
    let start = 0;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / durationMs);
      setProgress(easeOut(t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [floor, ceiling, durationMs]);

  const floorVal = Math.round(progress * floor);
  const ceilingVal = Math.round(progress * ceiling);

  return (
    <span
      style={{
        fontFamily: 'var(--font-jbmono), ui-monospace, monospace',
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"tnum" 1',
        fontSize: '0.92em', // optical match to the Clash headline (mono reads a touch larger)
        letterSpacing: '-0.02em',
        whiteSpace: 'nowrap', // never split the range across lines on mobile
      }}
    >
      ₹{floorVal.toLocaleString('en-IN')}&ndash;₹{ceilingVal.toLocaleString('en-IN')}
    </span>
  );
}

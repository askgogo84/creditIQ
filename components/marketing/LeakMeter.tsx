'use client';

import { useEffect, useState } from 'react';
import { Figure } from '@/components/design/Figure';

interface LeakMeterProps {
  /** Target annual-leak figure in ₹ */
  target: number;
  durationMs?: number;
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Count-up 0 → target over ~1.2s (rAF, ease-out), then holds. Under
// prefers-reduced-motion the final value renders immediately with no animation.
export function LeakMeter({ target, durationMs = 1200 }: LeakMeterProps) {
  // Start at 0 on both server and client (deterministic — no hydration mismatch),
  // then either jump to the final value (reduced motion) or animate up to it.
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
    <div>
      <Figure
        value={`₹${value.toLocaleString('en-IN')}`}
        unit="inr"
        provenance="estimated"
        valueColor="#F5F0E8"
        style={{
          alignItems: 'flex-start',
          fontSize: 'clamp(48px, 12vw, 112px)',
          fontWeight: 700,
          lineHeight: 1,
          letterSpacing: '-0.03em',
        }}
      />
      <div
        style={{
          marginTop: 14,
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#8A93A3',
        }}
      >
        Estimated annual leak · based on typical Indian card usage
      </div>
    </div>
  );
}

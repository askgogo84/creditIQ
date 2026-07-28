'use client';

import { useMemo, useState } from 'react';
import { LeakMeter } from './LeakMeter';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { computeLeakRange } from '@/lib/engine';

const clash = 'var(--font-clash), system-ui, sans-serif';

// ₹-glyph compact money — mirrors lib/utils formatINR's K/L/Cr scale but with the ₹
// glyph (the hero uses ₹ everywhere) and trailing zeros trimmed: 50000→₹50K,
// 150000→₹1.5L, 500000→₹5L. Kept local so lib/utils is untouched.
const rupee = (n: number): string => {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2).replace(/\.?0+$/, '')}Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2).replace(/\.?0+$/, '')}L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1).replace(/\.?0+$/, '')}K`;
  return `₹${n.toLocaleString('en-IN')}`;
};

// Bounds/step matched EXACTLY to the spend slider on app/card/[slug]/CardDetailClient.tsx
// so the two surfaces feel like one control.
const MIN = 5000;
const MAX = 500000;
const STEP = 5000;
const DEFAULT_SPEND = 50000;

// Client island that owns the hero's spend state. The leak RANGE is recomputed from the
// live catalogue on every slider change (~0.1ms across all 49 cards at both bases — far
// under one frame, so no debounce). The caption's ₹ basis tracks the same `spend`, so it
// can never say ₹50K while the slider sits elsewhere.
export function HeroLeak() {
  const [spend, setSpend] = useState(DEFAULT_SPEND);
  const { floor, ceiling } = useMemo(
    () => computeLeakRange(SEED_CARDS, { monthly_total_inr: spend }),
    [spend]
  );

  return (
    <>
      {/* Scoped to this slider. Uses `input.hero-leak-range` + !important because the
          app-wide `input[type="range"]` rules in globals.css (incl. a !important thumb
          colour at :1039 and a 24px thumb) out-specify a bare class and would otherwise
          win. Themes the track/thumb to the hero gold on the dark ground, and gives a
          ≥44px touch target at ≤480px (WCAG); desktop keeps the global 24px thumb. */}
      <style>{`
        input.hero-leak-range { background: var(--line-strong, rgba(20,41,80,0.20)) !important; }
        input.hero-leak-range::-webkit-slider-thumb { background: var(--copper-3, #D89B2A) !important; border: 2px solid var(--bg, #F5EFE6) !important; }
        input.hero-leak-range::-moz-range-thumb { background: var(--copper-3, #D89B2A) !important; border: 2px solid var(--bg, #F5EFE6) !important; }
        @media (max-width: 480px) {
          input.hero-leak-range::-webkit-slider-thumb { width: 44px !important; height: 44px !important; }
          input.hero-leak-range::-moz-range-thumb { width: 44px !important; height: 44px !important; }
        }
      `}</style>

      <h1 style={{ fontFamily: clash, fontSize: 'clamp(40px, 8vw, 84px)', fontWeight: 600, lineHeight: 1.08, letterSpacing: '-0.03em', margin: 0, color: 'var(--ink, #142950)' }}>
        Your cards leak <LeakMeter floor={floor} ceiling={ceiling} /> every year.
      </h1>

      {/* Provenance sits BELOW the completed sentence — qualifies the figure without
          breaking the headline into fragments. The basis line tracks the slider. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
        <span style={{ alignSelf: 'flex-start', fontSize: 9, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--prov-estimated)', background: 'color-mix(in srgb, var(--prov-estimated) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--prov-estimated) 30%, transparent)', padding: '2px 8px', borderRadius: 100 }}>
          Estimated
        </span>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3, #5A6A8A)' }}>
          At {rupee(spend)}/mo · cash-only floor vs. optimised
        </div>
      </div>

      {/* Spend slider — same bounds/step/formatting as the card-detail control. */}
      <div style={{ maxWidth: 340, marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-3, #5A6A8A)' }}>
            Monthly spend
          </span>
          <span style={{ fontFamily: 'var(--font-jbmono), ui-monospace, monospace', fontSize: 16, fontWeight: 700, color: 'var(--prov-cached)', fontVariantNumeric: 'tabular-nums' }}>
            {rupee(spend)}
          </span>
        </div>
        <input
          className="hero-leak-range"
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={spend}
          onChange={(e) => setSpend(parseInt(e.target.value, 10))}
          aria-label="Monthly spend"
          style={{ width: '100%' }}
        />
      </div>
    </>
  );
}

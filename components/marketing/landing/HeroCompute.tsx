'use client';

import { useMemo } from 'react';
import { LeakMeter } from '@/components/marketing/LeakMeter';
import { computeLeakRange } from '@/lib/engine';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { useSpend, rupeeShort, SPEND_MIN, SPEND_MAX, SPEND_STEP } from './SpendContext';

// Hero compute column — the ONE spend slider on the page lives here, and drives
// both the leak range above it and the card rankings far below (via SpendContext).
// Type A: Fraunces 300 headline with one italic emphasis word; the ₹ range is the
// JetBrains-Mono figure (LeakMeter), engine-computed over SEED_CARDS at 5K–5L.

const FR = "'Fraunces', Georgia, serif";
const IN = "'Inter', system-ui, sans-serif";
const MO = "'JetBrains Mono', ui-monospace, monospace";

export function HeroCompute() {
  const { spend, setSpend } = useSpend();
  const { floor, ceiling } = useMemo(
    () => computeLeakRange(SEED_CARDS, { monthly_total_inr: spend }),
    [spend]
  );

  return (
    <div style={{ minWidth: 0 }}>
      {/* Themed slider track/thumb for THIS control only, on the dark hero ground. */}
      <style>{`
        input.ciqL-hero-range { accent-color: #D89B2A; }
        input.ciqL-hero-range::-webkit-slider-thumb { background: #D89B2A; }
        input.ciqL-hero-range::-moz-range-thumb { background: #D89B2A; border: none; }
      `}</style>

      <h1 style={{ fontFamily: FR, fontWeight: 300, fontSize: 'clamp(40px,6.4vw,84px)', lineHeight: 1.02, letterSpacing: '-0.015em', color: '#f7f4ef', margin: '20px 0 0', textWrap: 'pretty' }}>
        Your points are a plane ticket. You just haven&rsquo;t{' '}
        <em style={{ fontStyle: 'italic', color: '#e8b45c' }}>booked</em> it yet.
      </h1>

      {/* Provenance sits below the headline; the basis tracks the slider. */}
      <div style={{ marginTop: 22, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.22)', fontFamily: IN, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.72)' }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: '#9aa2ad' }} />
          Estimated
        </span>
        <span style={{ fontFamily: IN, fontSize: 13.5, color: 'rgba(247,244,239,.66)' }}>
          at {rupeeShort(spend)}/mo · cash-only floor vs. optimised
        </span>
      </div>

      {/* The leak RANGE — moved OUT of the headline (comp Type A shows the ₹ figure as
          its own billboard below the Estimated pill, not fused into a Cleo-style
          sentence). Still driven live by the shared spend slider below. */}
      <div style={{ marginTop: 14, color: '#f7f4ef' }}>
        <LeakMeter floor={floor} ceiling={ceiling} />
      </div>

      {/* The single shared spend slider */}
      <div style={{ marginTop: 24, maxWidth: 404, padding: '18px 20px', border: '1px solid rgba(255,255,255,.16)', borderRadius: 16, background: 'rgba(255,255,255,.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
          <label htmlFor="ciqL-spend" style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: IN, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)' }}>
            Monthly spend
          </label>
          <span style={{ flexShrink: 0, fontFamily: MO, fontSize: 15, fontWeight: 500, color: '#f7f4ef', fontVariantNumeric: 'tabular-nums' }}>
            {rupeeShort(spend)}
          </span>
        </div>
        <input
          id="ciqL-spend"
          className="ciqL-hero-range"
          type="range"
          min={SPEND_MIN}
          max={SPEND_MAX}
          step={SPEND_STEP}
          value={spend}
          onChange={(e) => setSpend(parseInt(e.target.value, 10))}
          aria-label="Monthly spend"
          style={{ width: '100%', height: 44, marginTop: 4, cursor: 'pointer', background: 'transparent' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MO, fontSize: 11, color: 'rgba(255,255,255,.45)' }}>
          <span>₹5,000</span>
          <span>₹5,00,000</span>
        </div>
      </div>
    </div>
  );
}

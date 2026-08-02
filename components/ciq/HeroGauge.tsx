// components/ciq/HeroGauge.tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { EstimateRange } from './EstimateRange';

// Count-up that RE-RUNS whenever the target changes (fixes 0 when data loads
// after mount). Honours prefers-reduced-motion by jumping straight to target.
function useCountUp(target: number, ms = 1400) {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setVal(target); fromRef.current = target; return; }
    const from = fromRef.current;
    const to = target;
    if (from === to) { setVal(to); return; }
    let t0: number | null = null;
    let raf = 0;
    const step = (ts: number) => {
      if (t0 === null) t0 = ts;
      const p = Math.min((ts - t0) / ms, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (to - from) * e));
      if (p < 1) raf = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}

/**
 * HeroGauge — the signature verified-vs-estimated gauge.
 *
 * HONESTY: the headline is the user's REAL point count (verified points come
 * from statements, estimated from manual entry). The rupee figure is only ever
 * shown as a clearly-labelled ESTIMATE RANGE, never as the hero number and
 * never in verified-green. See docs/dashboard-data-audit.md §1.
 */
export function HeroGauge({
  points, verifiedPoints, estimatedPoints, estLow, estHigh, cardCount,
}: {
  points: number; verifiedPoints: number; estimatedPoints: number;
  estLow: number; estHigh: number; cardCount: number;
}) {
  const counted = useCountUp(points);
  const [fill, setFill] = useState(false);

  // re-trigger the gauge fill whenever the split changes (data arrives after mount)
  useEffect(() => {
    setFill(false);
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setFill(true)));
    return () => cancelAnimationFrame(id);
  }, [verifiedPoints, estimatedPoints]);

  const denom = verifiedPoints + estimatedPoints || 1;
  const vPct = (verifiedPoints / denom) * 100;
  const ePct = (estimatedPoints / denom) * 100;

  return (
    <section className="ciq-rise d2" style={{
      margin: '18px 20px 0', borderRadius: 24, padding: '24px 22px',
      background: 'var(--ciq-card-metal)', border: '1px solid var(--ciq-gold-line)',
      position: 'relative', overflow: 'hidden', boxShadow: '0 22px 54px -28px #000',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg,transparent,var(--ciq-gold-2),transparent)', opacity: .6 }} />
      <div style={{ position: 'absolute', inset: 0,
        background: 'radial-gradient(120% 90% at 100% 0,var(--ciq-gold-soft),transparent 55%)' }} />

      <div style={{ position: 'relative' }}>
        <div className="ciq-mono" style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ciq-ink-3)' }}>
          Total reward points
        </div>
        <div className="ciq-display" style={{ fontWeight: 600, fontSize: 54, lineHeight: 1, letterSpacing: '-.03em', marginTop: 10, fontVariantNumeric: 'tabular-nums' }}>
          {counted.toLocaleString('en-IN')}
          <span style={{ fontSize: 22, color: 'var(--ciq-gold-2)', marginLeft: 8 }}>pts</span>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ height: 12, borderRadius: 99, background: 'rgba(0,0,0,.35)', border: '1px solid var(--ciq-line)', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: fill ? `${vPct}%` : 0, background: 'var(--ciq-verified)',
              transition: 'width 1.3s cubic-bezier(.22,1,.36,1) .3s', boxShadow: '0 0 12px color-mix(in srgb,var(--ciq-verified) 50%,transparent)' }} />
            <div style={{ width: fill ? `${ePct}%` : 0, background: 'var(--ciq-estimated)', opacity: .5,
              transition: 'width 1.3s cubic-bezier(.22,1,.36,1) .5s' }} />
          </div>
          <div style={{ display: 'flex', gap: 22, marginTop: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ciq-verified)' }} />
                <span className="ciq-mono" style={{ fontSize: 9.5, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--ciq-ink-3)' }}>Verified</span>
              </div>
              <div className="ciq-display" style={{ fontWeight: 600, fontSize: 20, marginTop: 5, color: 'var(--ciq-verified)', fontVariantNumeric: 'tabular-nums' }}>
                {verifiedPoints.toLocaleString('en-IN')} <span style={{ fontSize: 12 }}>pts</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--ciq-estimated)', opacity: .55 }} />
                <span className="ciq-mono" style={{ fontSize: 9.5, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--ciq-ink-3)' }}>Estimated</span>
              </div>
              <div className="ciq-display" style={{ fontWeight: 600, fontSize: 20, marginTop: 5, color: 'var(--ciq-ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                {estimatedPoints.toLocaleString('en-IN')} <span style={{ fontSize: 12 }}>pts</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingTop: 15, borderTop: '1px solid var(--ciq-line)' }}>
          <div style={{ fontSize: 11, color: 'var(--ciq-ink-3)' }}>{cardCount} {cardCount === 1 ? 'card' : 'cards'}</div>
          <EstimateRange low={estLow} high={estHigh} />
        </div>
      </div>
    </section>
  );
}

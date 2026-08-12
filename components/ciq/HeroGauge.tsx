// components/ciq/HeroGauge.tsx
'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { EstimateRange } from './EstimateRange';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Run the count-up setup BEFORE paint on the client (0→climb, no flash of the final
// value); fall back to useEffect on the server where useLayoutEffect is a no-op + warns.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// Count-up for the wallet headline. ANIMATION-GATED CORRECTNESS
// (docs/dashboard-data-audit.md addendum, 3 Aug 2026): this number sits under
// "We don't guess your money", so a wrong-but-animating value reads as a lie. The FINAL
// value is therefore the rendered DEFAULT (useState(target)) — SSR, no-JS, reduced-motion
// and any rAF stall/interrupt (backgrounded tab, dropped frame, throttle) all leave the
// TRUE count on screen. The 0→target ease is progressive enhancement layered on in a
// layout effect, with a hard setTimeout guard that snaps to the true value if rAF never
// completes. Re-runs when the target changes (data can load after mount).
function useCountUp(target: number, ms = 1400) {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(0);
  useIsomorphicLayoutEffect(() => {
    const to = target;
    if (prefersReducedMotion() || fromRef.current === to) { setDisplay(to); fromRef.current = to; return; }
    const from = fromRef.current;
    let raf = 0;
    let start = 0;
    let done = false;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const finish = () => { if (done) return; done = true; setDisplay(to); fromRef.current = to; };
    // Hard guard: a backgrounded tab / throttle / dropped frame pauses rAF — snap to the
    // true value after the window so a wrong number is never stranded under the honesty claim.
    const guard = setTimeout(finish, ms + 200);
    const tick = (now: number) => {
      if (done) return;
      if (!start) start = now;
      const t = Math.min(1, (now - start) / ms);
      setDisplay(Math.round(from + (to - from) * ease(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else { clearTimeout(guard); finish(); }
    };
    setDisplay(from); // begin the climb (pre-paint via layout effect)
    raf = requestAnimationFrame(tick);
    return () => { done = true; cancelAnimationFrame(raf); clearTimeout(guard); };
  }, [target, ms]);
  return display;
}

/**
 * HeroGauge — the signature verified-vs-estimated gauge (white/copper light system).
 *
 * HONESTY: the headline is the user's REAL point count (verified points come
 * from statements, estimated from manual entry). The rupee figure is only ever
 * shown as a clearly-labelled ESTIMATE RANGE, never as the hero number and
 * never in verified-green. See docs/dashboard-data-audit.md §1.
 *
 * Provenance colours use the shared, contrast-tuned tokens: --prov-verified
 * (green, reserved for the moat) and --prov-estimated (neutral grey, understated).
 * Copper is an accent only, never a data colour.
 */
export function HeroGauge({
  points, verifiedPoints, estimatedPoints, estLow, estHigh, cardCount,
}: {
  points: number; verifiedPoints: number; estimatedPoints: number;
  estLow: number; estHigh: number; cardCount: number;
}) {
  const counted = useCountUp(points);
  // Bars default to their TRUE width (fill=true): SSR, no-JS, reduced-motion and any rAF
  // stall all leave the correct split drawn — same animation-gated-correctness rule as the
  // headline (a wallet with verified points must never draw an empty verified segment).
  const [fill, setFill] = useState(true);
  // prefers-reduced-motion: the wallet no longer sits under the [data-ciq] rule
  // that used to kill transitions, so the gauge fill honours it itself — reduced
  // users get the final split instantly, no width animation.
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }
  }, []);

  // Grow-in enhancement: drop to 0 then rAF→true so the bar animates; re-runs when the
  // split changes (data arrives after mount). Guarded with a setTimeout so a
  // backgrounded/throttled tab (rAF paused) still lands at the true width, never an empty bar.
  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion()) { setFill(true); return; }
    let raf = 0;
    const guard = setTimeout(() => setFill(true), 1800);
    setFill(false);
    raf = requestAnimationFrame(() => requestAnimationFrame(() => { clearTimeout(guard); setFill(true); }));
    return () => { cancelAnimationFrame(raf); clearTimeout(guard); };
  }, [verifiedPoints, estimatedPoints]);

  const denom = verifiedPoints + estimatedPoints || 1;
  const vPct = (verifiedPoints / denom) * 100;
  const ePct = (estimatedPoints / denom) * 100;

  return (
    <section className="w-rise d2" style={{
      margin: '18px 20px 0', borderRadius: 24, padding: '24px 22px',
      background: 'var(--surface)', border: '1px solid var(--line-strong)',
      position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-lg)',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg,transparent,var(--copper-3),transparent)', opacity: .6 }} />
      <div style={{ position: 'absolute', inset: 0,
        background: 'radial-gradient(120% 90% at 100% 0,color-mix(in srgb,var(--copper-3) 12%,transparent),transparent 55%)' }} />

      <div style={{ position: 'relative' }}>
        <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
          Total reward points
        </div>
        <div className="w-display" style={{ fontWeight: 600, fontSize: 54, lineHeight: 1, letterSpacing: '-.03em', marginTop: 10, color: 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>
          {counted.toLocaleString('en-IN')}
          <span style={{ fontSize: 22, color: 'var(--copper)', marginLeft: 8 }}>pts</span>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ height: 12, borderRadius: 99, background: 'color-mix(in srgb,var(--ink) 8%,transparent)', border: '1px solid var(--line)', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: (fill || reduce) ? `${vPct}%` : 0, background: 'var(--prov-verified)',
              transition: reduce ? 'none' : 'width 1.3s cubic-bezier(.22,1,.36,1) .3s', boxShadow: '0 0 12px color-mix(in srgb,var(--prov-verified) 50%,transparent)' }} />
            <div style={{ width: (fill || reduce) ? `${ePct}%` : 0, background: 'var(--prov-estimated)', opacity: .5,
              transition: reduce ? 'none' : 'width 1.3s cubic-bezier(.22,1,.36,1) .5s' }} />
          </div>
          <div style={{ display: 'flex', gap: 22, marginTop: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--prov-verified)' }} />
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Verified</span>
              </div>
              <div className="w-display" style={{ fontWeight: 600, fontSize: 20, marginTop: 5, color: 'var(--prov-verified)', fontVariantNumeric: 'tabular-nums' }}>
                {verifiedPoints.toLocaleString('en-IN')} <span style={{ fontSize: 12 }}>pts</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--prov-estimated)', opacity: .55 }} />
                <span className="mono" style={{ fontSize: 9.5, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Estimated</span>
              </div>
              <div className="w-display" style={{ fontWeight: 600, fontSize: 20, marginTop: 5, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                {estimatedPoints.toLocaleString('en-IN')} <span style={{ fontSize: 12 }}>pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* All-estimated state: no verified points yet. Say so plainly and
            understated (grey, never dressed up) — the actionable upload CTA
            lives just below in WalletView. See PRD §7. */}
        {verifiedPoints === 0 && estimatedPoints > 0 && (
          <div className="mono" style={{ marginTop: 14, fontSize: 11, lineHeight: 1.45, color: 'var(--prov-estimated)' }}>
            All estimated — upload a statement to verify.
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, paddingTop: 15, borderTop: '1px solid var(--line)' }}>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{cardCount} {cardCount === 1 ? 'card' : 'cards'}</div>
          <EstimateRange low={estLow} high={estHigh} variant="light" />
        </div>
      </div>
    </section>
  );
}

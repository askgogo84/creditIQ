'use client';

import { useEffect, useLayoutEffect, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// Run the count-up setup BEFORE the browser paints on the client (so the enhancement
// resets 0→animate without a flash of the final value), but fall back to useEffect on
// the server where useLayoutEffect is a no-op + warns.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// The animated ₹ leak figure, rendered as an INLINE monospace span so it lives
// inside the headline sentence ("Your cards leak ₹X–₹Y every year.") at the headline's
// own size — the number is the punch inside a sentence, not a separate billboard.
// It is a RANGE: floor (a cash-only card, no portal discipline) → ceiling (best card,
// fully optimised). Both count up 0→value over ~1.2s on a SINGLE shared progress clock
// so they land together (ease-out, holds); prefers-reduced-motion jumps straight to the
// final values. Provenance (the ESTIMATED pill + caption) is composed by the page BELOW
// the sentence, so the headline completes first.
// Count-up plays ONCE on mount. floor/ceiling are live props driven by the hero spend
// slider — once progress reaches 1 it stays there, so slider drags update the displayed
// values directly with NO re-animation per tick (see the mount-only effect below).
export function LeakMeter({ floor, ceiling, durationMs = 1200 }: { floor: number; ceiling: number; durationMs?: number }) {
  // ANIMATION-GATED CORRECTNESS (docs/dashboard-data-audit.md addendum, 3 Aug 2026):
  // this ₹ figure sits under a "real math, not a self-reported guess" claim, so a
  // wrong-but-animating number reads as a lie. The FINAL value is therefore the rendered
  // default (progress = 1) — SSR, no-JS, reduced-motion, and any rAF stall/interrupt all
  // leave the TRUE range on screen. The count-up is progressive enhancement layered on
  // top: only if the effect actually runs does it drop to 0 and climb back.
  const [progress, setProgress] = useState(1);

  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion()) return; // already at the final value
    let raf = 0;
    let start = 0;
    let done = false;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const finish = () => { done = true; setProgress(1); };
    // Hard guard: whatever throttles rAF (backgrounded tab, dropped frames, CPU stall),
    // snap to the true value after the animation window — never strand an intermediate.
    const guard = setTimeout(finish, durationMs + 200);
    const tick = (now: number) => {
      if (done) return;
      if (!start) start = now;
      const t = Math.min(1, (now - start) / durationMs);
      setProgress(easeOut(t));
      if (t < 1) raf = requestAnimationFrame(tick);
      else { done = true; clearTimeout(guard); }
    };
    // Now that the enhancement is confirmed running, begin the count-up from 0. This runs
    // pre-paint (layout effect) so the client paints 0→climb, not a flash of the final.
    setProgress(0);
    raf = requestAnimationFrame(tick);
    return () => { done = true; cancelAnimationFrame(raf); clearTimeout(guard); };
    // Mount-only on purpose: floor/ceiling are deliberately excluded so a spend-slider
    // drag updates the values (progress is already 1) WITHOUT restarting the count-up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const floorVal = Math.round(progress * floor);
  const ceilingVal = Math.round(progress * ceiling);

  return (
    <span
      style={{
        fontFamily: 'var(--font-jbmono), ui-monospace, monospace',
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"tnum" 1',
        // Was 0.92em of the headline. Now an independent clamp so the WIDEST range
        // (₹5L spend → up to ~₹2.4L, e.g. "₹1,39,530–₹2,39,610") stays on ONE line at
        // 375px instead of clipping under the hero's overflow:hidden. 7.36vw ≈ 0.92×8vw,
        // so it still tracks the fluid headline in the 500–1050px zone; below 500px the
        // headline pins at 40px while this keeps shrinking to a 26px floor.
        fontSize: 'clamp(26px, 7.36vw, 77px)',
        letterSpacing: '-0.02em',
        whiteSpace: 'nowrap', // never split the range across lines on mobile
      }}
    >
      ₹{floorVal.toLocaleString('en-IN')}&ndash;₹{ceilingVal.toLocaleString('en-IN')}
    </span>
  );
}

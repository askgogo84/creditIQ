'use client';
import { useCallback, useRef } from 'react';

/**
 * Scroll a results container into view after a submit SUCCEEDS.
 *
 * Usage:
 *   const { ref, scrollToResults } = useScrollToResults();
 *   ...
 *   <div ref={ref} style={{ scrollMarginTop: 76 }}>…results…</div>
 *   // in the handler, success path only:
 *   setResult(data);
 *   scrollToResults();
 *
 * Give the container a `scrollMarginTop` that clears any fixed header:
 *   - 76 on pages that render the fixed <Header/> (its inner height is 60px)
 *   - 16 in the signed-in app shell (AppRail/TabBar only — no fixed TOP bar)
 *
 * Call scrollToResults() in the SUCCESS path only — never on error, never on an
 * empty result set. A double requestAnimationFrame lets a conditionally-rendered
 * results block commit to the DOM before we scroll. Honors prefers-reduced-motion
 * (falls back to an instant jump instead of a smooth animation).
 */
export function useScrollToResults<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const scrollToResults = useCallback(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const behavior: ScrollBehavior = reduce ? 'auto' : 'smooth';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ref.current?.scrollIntoView({ behavior, block: 'start' });
      });
    });
  }, []);
  return { ref, scrollToResults };
}

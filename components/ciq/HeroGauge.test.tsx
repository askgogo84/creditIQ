import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { HeroGauge } from './HeroGauge';

// jsdom has no matchMedia; stub it so the count-up takes its reduced-motion
// path and lands on the final value synchronously.
beforeAll(() => {
  window.matchMedia = ((query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
});

describe('HeroGauge — honesty invariants', () => {
  it('headline is the real POINT count, not a rupee value', () => {
    render(<HeroGauge points={1240} verifiedPoints={900} estimatedPoints={340} estLow={310} estHigh={2232} cardCount={2} />);
    expect(screen.getByText('Total reward points')).toBeInTheDocument();
    expect(screen.getByText('1,240')).toBeInTheDocument();
    // the big number is not prefixed with a rupee sign
    expect(screen.queryByText(/^₹1,240$/)).not.toBeInTheDocument();
  });

  it('splits verified vs estimated in POINTS', () => {
    render(<HeroGauge points={1240} verifiedPoints={900} estimatedPoints={340} estLow={310} estHigh={2232} cardCount={2} />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Self-entered')).toBeInTheDocument();
    expect(screen.getByText('900')).toBeInTheDocument();
    expect(screen.getByText('340')).toBeInTheDocument();
  });

  it('shows any rupee figure ONLY as a labelled estimate range', () => {
    render(<HeroGauge points={1240} verifiedPoints={900} estimatedPoints={340} estLow={310} estHigh={2232} cardCount={2} />);
    expect(screen.getByText('estimate')).toBeInTheDocument();
    expect(screen.getByText('≈ ₹310–₹2,232')).toBeInTheDocument();
  });

  // Regression for the animation-gated-correctness incident (docs/dashboard-data-audit.md
  // addendum): a backgrounded tab / throttle pauses the count-up rAF. The headline must
  // NEVER strand an intermediate value under "We don't guess your money" — the setTimeout
  // guard has to land the true total even if no animation frame ever fires.
  it('lands the TRUE total via the guard even if the count-up rAF never fires', () => {
    const realMM = window.matchMedia;
    // motion allowed (not the reduced-motion shortcut), so the enhancement path runs
    window.matchMedia = ((q: string) => ({
      matches: false, media: q, onchange: null,
      addEventListener: () => {}, removeEventListener: () => {},
      addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    // rAF is scheduled but never calls back — the backgrounded-tab case
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(0 as unknown as number);
    vi.useFakeTimers();
    try {
      render(<HeroGauge points={876499} verifiedPoints={56499} estimatedPoints={820000} estLow={310} estHigh={2232} cardCount={3} />);
      act(() => { vi.advanceTimersByTime(2000); }); // past the ms(1400)+200 count-up guard
      expect(screen.getByText('8,76,499')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
      raf.mockRestore();
      window.matchMedia = realMM;
    }
  });

  it('pluralises the card count', () => {
    const { rerender } = render(<HeroGauge points={100} verifiedPoints={100} estimatedPoints={0} estLow={25} estHigh={180} cardCount={1} />);
    expect(screen.getByText('1 card')).toBeInTheDocument();
    rerender(<HeroGauge points={100} verifiedPoints={100} estimatedPoints={0} estLow={25} estHigh={180} cardCount={3} />);
    expect(screen.getByText('3 cards')).toBeInTheDocument();
  });
});

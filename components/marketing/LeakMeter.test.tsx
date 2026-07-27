import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeakMeter } from './LeakMeter';

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('reduce') ? reduce : !reduce,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    })),
  );
}

describe('LeakMeter', () => {
  beforeEach(() => {
    (window as any).matchMedia = undefined;
  });

  it('prefers-reduced-motion: renders the final value immediately (no animation)', () => {
    mockReducedMotion(true);
    render(<LeakMeter target={184000} />);
    expect(screen.getByText(`₹${(184000).toLocaleString('en-IN')}`)).toBeInTheDocument();
    // provenance is estimated (grey pill) + the descriptive caption
    expect(screen.getByText('Estimated')).toBeInTheDocument();
    expect(screen.getByText(/estimated annual leak/i)).toBeInTheDocument();
  });
});

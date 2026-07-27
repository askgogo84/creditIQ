import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Figure } from './Figure';

describe('Figure — provenance primitive', () => {
  it('verified: renders the "Verified" text label and formatted INR value', () => {
    render(<Figure value={18400} unit="inr" provenance="verified" />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText('Rs.18,400')).toBeInTheDocument();
  });

  it('cached: renders "Cached", the relative asOf, and the value', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000);
    render(<Figure value={12500} unit="inr" provenance="cached" asOf={threeHoursAgo} />);
    expect(screen.getByText(/^Cached · updated 3h ago$/)).toBeInTheDocument();
    expect(screen.getByText('Rs.12,500')).toBeInTheDocument();
  });

  it('estimated: renders "Estimated" and a verbatim string value (range)', () => {
    render(<Figure value="Rs.28,000 – Rs.55,000" unit="inr" provenance="estimated" />);
    expect(screen.getByText('Estimated')).toBeInTheDocument();
    expect(screen.getByText('Rs.28,000 – Rs.55,000')).toBeInTheDocument();
  });

  it('colour is never the only signal: every state exposes its provenance as TEXT', () => {
    const { rerender } = render(<Figure value={1} unit="pts" provenance="verified" />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
    rerender(<Figure value={1} unit="pts" provenance="estimated" />);
    expect(screen.getByText('Estimated')).toBeInTheDocument();
  });

  it('formats units', () => {
    const { rerender } = render(<Figure value={5000} unit="pts" provenance="estimated" />);
    expect(screen.getByText('5,000 pts')).toBeInTheDocument();
    rerender(<Figure value={5000} unit="miles" provenance="estimated" />);
    expect(screen.getByText('5,000 miles')).toBeInTheDocument();
  });

  it('numeral uses tabular figures', () => {
    render(<Figure value={100} unit="inr" provenance="estimated" />);
    expect(screen.getByText('Rs.100')).toHaveStyle({ fontVariantNumeric: 'tabular-nums' });
  });

  it('exposes an accessible label combining value and provenance', () => {
    render(<Figure value={18400} unit="inr" provenance="verified" />);
    const aria = screen.getByRole('group').getAttribute('aria-label') || '';
    expect(aria).toContain('Verified');
    expect(aria).toContain('Rs.18,400');
  });

  it('colours the label (not the numeral) from the --prov-* token', () => {
    render(<Figure value={1} unit="inr" provenance="cached" asOf={Date.now()} />);
    const label = screen.getByText(/^Cached/);
    expect(label).toHaveStyle({ color: 'var(--prov-cached)' });
  });
});

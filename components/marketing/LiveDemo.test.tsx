import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveDemo } from './LiveDemo';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('LiveDemo — anonymous-visitor worst case', () => {
  it('empty fare cache: falls back to the typical ESTIMATED range', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ json: async () => ({ fares: [] }) }),
    );
    render(<LiveDemo />);
    // Default route is BLR→DXB, est [22000, 38000]. Cache miss → estimated fallback.
    expect(await screen.findByText('Estimated')).toBeInTheDocument();
    const lo = `₹${(22000).toLocaleString('en-IN')}`;
    const hi = `₹${(38000).toLocaleString('en-IN')}`;
    expect(screen.getByText(`${lo} – ${hi}`)).toBeInTheDocument();
    expect(screen.getByText(/no live fare cached/i)).toBeInTheDocument();
  });

  it('fresh cached fare: shows the CACHED provenance and the price', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          fares: [{ price_inr: 24999, stale: false, found_at: new Date().toISOString(), airlineName: 'IndiGo', depart_date: '2026-09-01' }],
        }),
      }),
    );
    render(<LiveDemo />);
    expect(await screen.findByText(/^Cached/)).toBeInTheDocument();
    expect(screen.getByText(`₹${(24999).toLocaleString('en-IN')}`)).toBeInTheDocument();
  });
});

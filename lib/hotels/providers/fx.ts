// lib/hotels/providers/fx.ts
//
// Live foreign exchange. There is deliberately NO FALLBACK CONSTANT anywhere
// in this file or anywhere else in the tree.
//
// Accor's own terms name the euro as the reference currency and say the INR
// conversion is done daily "for reference only". So the rupee value of an
// Accor stay moves entirely with EUR/INR — the exchange rate IS the margin.
// A stored constant would silently turn a live product into a stale one.
//
// When the fetch fails we return null and the UI suppresses the rupee
// comparison. That is the correct behaviour, not a degraded one.

export interface FxSnapshot {
  rate: number;
  fetched_at: string;
  source: string;
}

export interface FxProvider {
  readonly id: string;
  rate(from: string, to: string): Promise<FxSnapshot | null>;
}

/**
 * Fetches from a public FX endpoint. No key required, no caching beyond the
 * request. If you add caching later, cap it in MINUTES and put the fetched_at
 * on screen — never let a rate age silently.
 */
export class LiveFxProvider implements FxProvider {
  readonly id = 'exchangerate-host';

  async rate(from = 'EUR', to = 'INR'): Promise<FxSnapshot | null> {
    try {
      const res = await fetch(
        `https://api.exchangerate.host/latest?base=${from}&symbols=${to}`,
        { next: { revalidate: 300 } },
      );
      if (!res.ok) return null;

      const data = await res.json();
      const value = data?.rates?.[to];
      if (typeof value !== 'number' || !isFinite(value) || value <= 0) return null;

      return {
        rate: value,
        fetched_at: new Date().toISOString(),
        source: 'exchangerate.host',
      };
    } catch {
      // Deliberately silent and deliberately null. No constant, no guess.
      return null;
    }
  }
}

/** For tests only. Never wire this into a page. */
export class FixedFxProvider implements FxProvider {
  readonly id = 'fixed-test-only';
  constructor(private readonly value: number | null) {}
  async rate(): Promise<FxSnapshot | null> {
    return this.value === null
      ? null
      : { rate: this.value, fetched_at: new Date().toISOString(), source: 'test' };
  }
}

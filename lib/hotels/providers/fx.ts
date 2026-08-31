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
// ── TWO HARD-WON RULES (31 Aug 2026) ──────────────────────────────────────
//
// 1. ALWAYS pass an AbortSignal. An un-timed-out fetch inside a React server
//    component does not fail loudly — it hangs the render, and Next serves a
//    fallback page with a 200 status and NOTHING in the terminal. We lost most
//    of a day to exactly that. Every network call on a server-rendered path
//    gets a timeout.
//
// 2. NEVER add a fallback rate. When the fetch fails we return null and the
//    page says plainly that it will not convert to rupees. A wrong rupee
//    figure on a money surface is worse than no rupee figure.
//
// Provider: frankfurter.app — European Central Bank reference rates, free, no
// API key, no rate limit worth worrying about. (The previous provider,
// exchangerate.host, started requiring a key and silently stopped returning
// rates, which is what surfaced rule 1.)

export interface FxSnapshot {
  rate: number;
  fetched_at: string;
  source: string;
}

export interface FxProvider {
  readonly id: string;
  rate(from: string, to: string): Promise<FxSnapshot | null>;
}

const TIMEOUT_MS = 3000;

export class LiveFxProvider implements FxProvider {
  readonly id = 'frankfurter';

  async rate(from = 'EUR', to = 'INR'): Promise<FxSnapshot | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(
        `https://api.frankfurter.app/latest?from=${from}&to=${to}`,
        {
          signal: controller.signal,
          // Cache for 5 minutes. Short enough that the rate is honest, long
          // enough that a page full of hotels does not hammer the endpoint.
          // The fetched_at below is always the real fetch time, so a cached
          // rate never claims to be fresher than it is.
          next: { revalidate: 300 },
        },
      );
      if (!res.ok) return null;

      const data = await res.json();
      const value = data?.rates?.[to];
      if (typeof value !== 'number' || !isFinite(value) || value <= 0) {
        return null;
      }

      return {
        rate: value,
        fetched_at: new Date().toISOString(),
        source: 'frankfurter.app (ECB)',
      };
    } catch {
      // Timeout, network failure, malformed JSON — all the same answer.
      // Deliberately silent, deliberately null. No constant, no guess.
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Tries providers in order and returns the first live rate. Add a second
 * provider here rather than adding a fallback constant anywhere — the point is
 * redundancy of SOURCES, never a hardcoded number.
 */
export class ChainedFxProvider implements FxProvider {
  readonly id = 'chained';
  constructor(private readonly providers: FxProvider[]) {}

  async rate(from = 'EUR', to = 'INR'): Promise<FxSnapshot | null> {
    for (const p of this.providers) {
      const r = await p.rate(from, to);
      if (r) return r;
    }
    return null;
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

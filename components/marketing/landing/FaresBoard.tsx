'use client';

import { useEffect, useState } from 'react';

// Live fares, straight from /api/fares (the cron-populated cached_fares table).
// One corridor selected at a time; a fresh cached price shows CACHED (copper), a
// cache miss / all-stale shows ESTIMATED (neutral grey) — never a fabricated fare.
// The comp's award-path and ₹/point rows are intentionally absent: that data does
// not exist in the API, so rendering it would be a placeholder figure.
//
// Type: JetBrains Mono for every figure. No shadows. 44px-tall corridor pills.

const FR = "'Fraunces', Georgia, serif";
const IN = "'Inter', system-ui, sans-serif";
const MO = "'JetBrains Mono', ui-monospace, monospace";

// Warmed corridors (subset of lib/fares TOP_ROUTES) so an anonymous visitor never
// lands on a cold cache. TP city codes; `label` is the display route.
const CORRIDORS = [
  { o: 'BLR', d: 'DXB', label: 'BLR–DXB', cabin: 'economy, one way' },
  { o: 'DEL', d: 'DXB', label: 'DEL–DXB', cabin: 'economy, one way' },
  { o: 'BOM', d: 'SIN', label: 'BOM–SIN', cabin: 'economy, one way' },
  { o: 'DEL', d: 'LON', label: 'DEL–LON', cabin: 'economy, one way' },
  { o: 'BLR', d: 'BKK', label: 'BLR–BKK', cabin: 'economy, one way' },
] as const;

const INR = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

// found_at → compact age ("4h", "2d"). Guards a bad/absent timestamp.
function ageLabel(iso: string | null | undefined): string {
  if (!iso) return 'recently';
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'recently';
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return 'under 1h';
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

type Result =
  | { kind: 'loading' }
  | { kind: 'cached'; price: number; airline?: string; departDate?: string | null; foundAt: string }
  | { kind: 'estimated' };

export function FaresBoard() {
  const [active, setActive] = useState(0);
  const [result, setResult] = useState<Result>({ kind: 'loading' });
  const c = CORRIDORS[active];

  useEffect(() => {
    let cancelled = false;
    setResult({ kind: 'loading' });
    fetch(`/api/fares?origin=${c.o}&destination=${c.d}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const fresh = (Array.isArray(d?.fares) ? d.fares : []).find((f: any) => !f.stale && f.price_inr);
        if (fresh) {
          setResult({
            kind: 'cached',
            price: fresh.price_inr,
            airline: fresh.airlineName || fresh.airline,
            departDate: fresh.depart_date ?? null,
            foundAt: fresh.found_at,
          });
        } else {
          setResult({ kind: 'estimated' });
        }
      })
      .catch(() => {
        if (!cancelled) setResult({ kind: 'estimated' });
      });
    return () => {
      cancelled = true;
    };
  }, [c.o, c.d]);

  return (
    <div>
      {/* Corridor pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 32 }}>
        {CORRIDORS.map((corr, i) => {
          const on = i === active;
          return (
            <button
              key={corr.label}
              onClick={() => setActive(i)}
              style={{
                minHeight: 44,
                padding: '0 18px',
                borderRadius: 999,
                cursor: 'pointer',
                fontFamily: MO,
                fontSize: 13,
                letterSpacing: '0.03em',
                transition: '150ms',
                border: `1px solid ${on ? '#142335' : '#ddd0c0'}`,
                background: on ? '#142335' : 'transparent',
                color: on ? '#fbf8f3' : '#2b385c',
              }}
            >
              {corr.label}
            </button>
          );
        })}
      </div>

      {/* Result card — white surface on the sand band, 1px sand-line border, no shadow */}
      <div
        style={{
          marginTop: 28,
          background: '#ffffff',
          border: '1px solid #e5d9cc',
          borderRadius: 20,
          padding: 'clamp(22px, 3vw, 34px)',
          minHeight: 168,
        }}
      >
        <div style={{ fontFamily: MO, fontSize: 13, fontWeight: 500, letterSpacing: '0.04em', color: '#2b385c' }}>
          {c.label} · {c.cabin}
        </div>

        {result.kind === 'loading' && (
          <div style={{ fontFamily: MO, fontSize: 'clamp(40px,6vw,62px)', fontWeight: 500, color: '#8A857B', lineHeight: 1.05, marginTop: 8 }}>
            …
          </div>
        )}

        {result.kind === 'cached' && (
          <>
            <div style={{ fontFamily: MO, fontSize: 'clamp(40px,6vw,62px)', fontWeight: 500, letterSpacing: '-0.02em', color: '#142335', lineHeight: 1.05, marginTop: 8 }}>
              {INR(result.price)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 11px', borderRadius: 999, background: 'rgba(185,139,31,.14)', border: '1px solid rgba(185,139,31,.42)', fontFamily: IN, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a5c0f' }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: '#B98B1F' }} />
                Cached
              </span>
              <span style={{ fontFamily: IN, fontSize: 13, color: '#6b6b6d' }}>
                updated {ageLabel(result.foundAt)} ago
                {result.airline ? ` · ${result.airline}` : ''}
                {result.departDate ? ` · sample ${result.departDate}` : ''}
              </span>
            </div>
            <p style={{ fontFamily: IN, fontSize: 12, lineHeight: 1.5, color: '#6b6b6d', margin: '16px 0 0', maxWidth: '56ch' }}>
              Cheapest cached cash fare via Travelpayouts — not a live quote for your exact dates. Age is stamped on every one.
            </p>
          </>
        )}

        {result.kind === 'estimated' && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 14 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 11px', borderRadius: 999, background: 'rgba(107,107,109,.1)', border: '1px solid rgba(107,107,109,.3)', fontFamily: IN, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5b6169' }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: '#9aa2ad' }} />
                Estimated
              </span>
            </div>
            <p style={{ fontFamily: IN, fontSize: 14.5, lineHeight: 1.6, color: '#2b385c', margin: '14px 0 0', maxWidth: '56ch' }}>
              No fresh fare is cached for this corridor right now. We never invent one — check another route above, or come back after the next refresh.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

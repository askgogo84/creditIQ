'use client';

import { useEffect, useState } from 'react';
import { Figure } from '@/components/design/Figure';

// Route selector is limited to WARMED routes (subset of lib/fares.ts TOP_ROUTES) so
// an anonymous visitor never lands on an empty cache and sees nothing. Each carries a
// typical estimated round-trip range used ONLY as the honest fallback on a cache miss.
interface DemoRoute {
  o: string; // TP city code
  d: string;
  label: string;
  est: [number, number]; // typical round-trip economy ₹ range
}

const ROUTES: DemoRoute[] = [
  { o: 'BLR', d: 'DXB', label: 'Bangalore → Dubai', est: [22000, 38000] },
  { o: 'DEL', d: 'DXB', label: 'Delhi → Dubai', est: [20000, 35000] },
  { o: 'BOM', d: 'SIN', label: 'Mumbai → Singapore', est: [28000, 48000] },
  { o: 'DEL', d: 'LON', label: 'Delhi → London', est: [55000, 95000] },
  { o: 'BLR', d: 'BKK', label: 'Bangalore → Bangkok', est: [20000, 36000] },
];

type Result =
  | { kind: 'loading' }
  | { kind: 'cached'; price: number; airline?: string; departDate?: string | null; foundAt: string }
  | { kind: 'estimated' };

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export function LiveDemo() {
  const [route, setRoute] = useState<DemoRoute>(ROUTES[0]);
  const [result, setResult] = useState<Result>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setResult({ kind: 'loading' });
    fetch(`/api/fares?origin=${route.o}&destination=${route.d}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const fresh = (Array.isArray(d?.fares) ? d.fares : []).find((f: any) => !f.stale);
        if (fresh && fresh.price_inr) {
          setResult({
            kind: 'cached',
            price: fresh.price_inr,
            airline: fresh.airlineName || fresh.airline,
            departDate: fresh.depart_date ?? null,
            foundAt: fresh.found_at,
          });
        } else {
          // Cache miss (or all stale) → honest estimated range, ESTIMATED label.
          setResult({ kind: 'estimated' });
        }
      })
      .catch(() => {
        if (!cancelled) setResult({ kind: 'estimated' });
      });
    return () => {
      cancelled = true;
    };
  }, [route]);

  return (
    <div
      id="live-demo"
      style={{
        background: 'rgba(245,240,232,0.04)',
        border: '1px solid rgba(245,240,232,0.12)',
        borderRadius: 20,
        padding: 'clamp(20px, 4vw, 32px)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--prov-cached)', marginBottom: 10 }}>
        ● Live · real cached fares
      </div>
      <h3 style={{ fontFamily: 'var(--font-clash), system-ui, sans-serif', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 600, margin: '0 0 6px', color: '#F5F0E8' }}>
        Change the route. Watch a real fare update.
      </h3>
      <p style={{ margin: '0 0 20px', color: '#9AA3B2', fontSize: 15, lineHeight: 1.55, maxWidth: 520 }}>
        This queries our live cached-fare cache — no account needed. When we have a fresh cached price it shows{' '}
        <span style={{ color: 'var(--prov-cached)', fontWeight: 600 }}>gold</span>; otherwise an honest{' '}
        <span style={{ color: 'var(--prov-estimated)', fontWeight: 600 }}>estimate</span>.
      </p>

      {/* route selector — warmed routes only */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {ROUTES.map((r) => {
          const active = r.o === route.o && r.d === route.d;
          return (
            <button
              key={`${r.o}-${r.d}`}
              onClick={() => setRoute(r)}
              style={{
                padding: '8px 14px',
                borderRadius: 100,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: active ? '#0E1420' : '#C7CDD6',
                background: active ? 'var(--prov-cached)' : 'transparent',
                border: `1px solid ${active ? 'var(--prov-cached)' : 'rgba(245,240,232,0.18)'}`,
              }}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* result */}
      <div style={{ minHeight: 90 }}>
        <div style={{ fontSize: 11, color: '#8A93A3', marginBottom: 6 }}>Cheapest round-trip · {route.label}</div>
        {result.kind === 'loading' && (
          <div style={{ fontFamily: 'var(--font-jbmono), monospace', fontSize: 'clamp(28px,5vw,44px)', color: '#4A5568' }}>…</div>
        )}
        {result.kind === 'cached' && (
          <>
            <Figure
              value={inr(result.price)}
              unit="inr"
              provenance="cached"
              asOf={result.foundAt}
              valueColor="#F5F0E8"
              style={{ alignItems: 'flex-start', fontSize: 'clamp(28px,5vw,44px)', fontWeight: 700 }}
            />
            <div style={{ fontSize: 12, color: '#8A93A3', marginTop: 6 }}>
              {result.airline ? `${result.airline} · ` : ''}Cheapest cached fare via Travelpayouts
              {result.departDate ? ` · sample ${result.departDate}` : ''} · not your exact dates
            </div>
          </>
        )}
        {result.kind === 'estimated' && (
          <>
            <Figure
              value={`${inr(route.est[0])} – ${inr(route.est[1])}`}
              unit="inr"
              provenance="estimated"
              valueColor="#C7CDD6"
              style={{ alignItems: 'flex-start', fontSize: 'clamp(24px,4vw,36px)', fontWeight: 600 }}
            />
            <div style={{ fontSize: 12, color: '#8A93A3', marginTop: 6 }}>
              No live fare cached for this route right now — typical range shown.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

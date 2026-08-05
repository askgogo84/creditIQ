'use client';

import { useEffect, useState } from 'react';

// Hero proof card — fills the hero's right column with a REAL cached fare from
// /api/fares (one warmed corridor). Cached hit: route, price, gold CACHED pill,
// age, airline. No award path, no ₹/point — that data isn't in the API, so it is
// never shown. Cache miss / all-stale: honest Estimated state, no invented price.

const IN = "'Inter', system-ui, sans-serif";
const MO = "'JetBrains Mono', ui-monospace, monospace";

const ORIGIN = 'DEL';
const DEST = 'DXB';
const ROUTE = 'DEL → DXB';

const INR = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

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
  | { kind: 'cached'; price: number; airline?: string; foundAt: string }
  | { kind: 'estimated' };

export function HeroProof() {
  const [result, setResult] = useState<Result>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/fares?origin=${ORIGIN}&destination=${DEST}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const fresh = (Array.isArray(d?.fares) ? d.fares : []).find((f: any) => !f.stale && f.price_inr);
        if (fresh) {
          setResult({ kind: 'cached', price: fresh.price_inr, airline: fresh.airlineName || fresh.airline, foundAt: fresh.found_at });
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
  }, []);

  const cached = result.kind === 'cached';

  return (
    <div style={{ justifySelf: 'end', width: '100%', maxWidth: 404 }}>
      <div style={{ background: 'var(--hp-card-bg,#fbf8f3)', border: '1px solid var(--hp-hair,#e5d9cc)', borderRadius: 20, padding: 24, boxShadow: 'var(--hp-shadow,none)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: IN, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--hp-muted,#6b6b6d)' }}>
            Live proof
          </span>
          {cached ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 11px', borderRadius: 999, background: 'rgba(185,139,31,.14)', border: '1px solid rgba(185,139,31,.42)', fontFamily: IN, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a5c0f' }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: '#B98B1F' }} />
              Cached
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 11px', borderRadius: 999, background: 'rgba(107,107,109,.1)', border: '1px solid rgba(107,107,109,.3)', fontFamily: IN, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5b6169' }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: '#9aa2ad' }} />
              Estimated
            </span>
          )}
        </div>

        <div style={{ marginTop: 18, fontFamily: MO, fontSize: 13, fontWeight: 500, letterSpacing: '0.04em', color: 'var(--hp-body,#2b385c)' }}>
          {ROUTE} · one way · economy
        </div>

        {result.kind === 'loading' && (
          <div style={{ fontFamily: MO, fontSize: 'clamp(34px,4.6vw,44px)', fontWeight: 500, color: '#8A857B', lineHeight: 1.1, marginTop: 6 }}>…</div>
        )}

        {result.kind === 'cached' && (
          <>
            <div style={{ fontFamily: MO, fontSize: 'clamp(34px,4.6vw,44px)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--hp-ink,#142335)', lineHeight: 1.1, marginTop: 6 }}>
              {INR(result.price)}
            </div>
            <div style={{ fontFamily: IN, fontSize: 13, color: 'var(--hp-muted,#6b6b6d)', marginTop: 4 }}>
              Lowest cash fare in our cache · updated {ageLabel(result.foundAt)} ago
              {result.airline ? ` · ${result.airline}` : ''}
            </div>
            <div style={{ height: 1, background: 'var(--hp-hair,#e5d9cc)', margin: '20px 0' }} />
            <p style={{ fontFamily: IN, fontSize: 12, lineHeight: 1.5, color: 'var(--hp-muted,#6b6b6d)', margin: 0 }}>
              Fares are cached, not quoted. Age is stamped on every one. Connect statements and these turn{' '}
              <span style={{ color: 'var(--hp-verified,#0b7a47)', fontWeight: 600 }}>verified</span>.
            </p>
          </>
        )}

        {result.kind === 'estimated' && (
          <>
            <p style={{ fontFamily: IN, fontSize: 14.5, lineHeight: 1.6, color: 'var(--hp-body,#2b385c)', margin: '10px 0 0' }}>
              No fresh fare is cached for this corridor right now. We don&rsquo;t invent one — this stamp turns
              gold the moment the cache refreshes.
            </p>
            <div style={{ height: 1, background: 'var(--hp-hair,#e5d9cc)', margin: '20px 0' }} />
            <p style={{ fontFamily: IN, fontSize: 12, lineHeight: 1.5, color: 'var(--hp-muted,#6b6b6d)', margin: 0 }}>
              Fares are cached, not quoted. Age is stamped on every one. Connect statements and these turn{' '}
              <span style={{ color: 'var(--hp-verified,#0b7a47)', fontWeight: 600 }}>verified</span>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

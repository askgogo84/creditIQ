'use client';
// components/ciq/LiveAwardRow.tsx
// Live award-price row mounted under a trip-planner destination card.
//
// Six states (UIUX brief): skeleton / live-full / live-no-cash / empty /
// zero-verified / anon. Derived from POST /api/trip-planner/live-price
// (LiveDestinationPrice). Estimated-only users surface as zero-verified (the
// API's zeroVerified already covers them — verified balance = statement-sourced).
//
// HONESTY STYLING (locked):
//   - #4FBF87 (verified green) ONLY on the verified-balance figure + its check.
//   - #8A857B (grey) for estimates and the empty state.
//   - the "Live" pill is gold, NEVER green.
//
// No fixed positioning. Fixed reserved height (~112px) to avoid layout shift.
//
// NOTE: built from the Phase-1c task's inline spec; the docs/live-award UIUX
// brief was not present in the repo, so exact microcopy/spacing may need a later
// pass against it.
import { useEffect, useId, useState } from 'react';
import Link from 'next/link';
import { authedFetch } from '@/lib/authed-fetch';
import type { LiveDestinationPrice } from '@/lib/types';

const VERIFIED_GREEN = '#4FBF87';
const GREY = '#8A857B';
const GOLD = '#C9972E';

// Minimal accessible origin picker — no standalone airport-select component
// exists in the flights UI to reuse, so this is the sanctioned native-select
// fallback (major Indian metros; BLR default).
const ORIGINS = [
  { code: 'BLR', label: 'Bangalore (BLR)' },
  { code: 'DEL', label: 'Delhi (DEL)' },
  { code: 'BOM', label: 'Mumbai (BOM)' },
  { code: 'MAA', label: 'Chennai (MAA)' },
  { code: 'HYD', label: 'Hyderabad (HYD)' },
  { code: 'CCU', label: 'Kolkata (CCU)' },
  { code: 'COK', label: 'Kochi (COK)' },
  { code: 'GOI', label: 'Goa (GOI)' },
];

type LiveCabin = 'economy' | 'business';
type RowState = 'skeleton' | 'live-full' | 'live-no-cash' | 'empty' | 'zero-verified' | 'anon';

// Session memoization per (destination, origin, cabin). Module-level so it
// survives re-expanding the same card within the SPA session.
const priceCache = new Map<string, LiveDestinationPrice>();

function deriveState(d: LiveDestinationPrice): RowState {
  if (!d.live || !d.award) return 'empty';
  if (d.zeroVerified) return 'zero-verified';
  if (d.cashPrice == null) return 'live-no-cash';
  return 'live-full';
}

const srOnly: React.CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
};

export interface LiveAwardRowProps {
  destination: string;      // destination IATA, e.g. 'SIN'
  destinationCity: string;  // e.g. 'Singapore'
  defaultOrigin?: string;   // default 'BLR'
}

export default function LiveAwardRow({
  destination,
  destinationCity,
  defaultOrigin = 'BLR',
}: LiveAwardRowProps) {
  const [origin, setOrigin] = useState(defaultOrigin);
  const [cabin, setCabin] = useState<LiveCabin>('economy');
  const [state, setState] = useState<RowState>('skeleton');
  const [data, setData] = useState<LiveDestinationPrice | null>(null);
  const originId = useId();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const key = `${destination}|${origin}|${cabin}`;

    const cached = priceCache.get(key);
    if (cached) {
      setData(cached);
      setState(deriveState(cached));
      return () => { cancelled = true; controller.abort(); };
    }

    setState('skeleton');
    const timer = setTimeout(() => controller.abort(), 8000); // 8s client cap

    (async () => {
      try {
        const res = await authedFetch('/api/trip-planner/live-price', {
          method: 'POST',
          body: JSON.stringify({ origin, destination, cabin }),
          signal: controller.signal,
        });
        if (cancelled) return;
        if (res.status === 401) { setState('anon'); return; } // Flow D
        const json = (await res.json()) as LiveDestinationPrice;
        if (cancelled) return;
        priceCache.set(key, json);
        setData(json);
        setState(deriveState(json));
      } catch {
        if (!cancelled) setState('empty'); // 8s cap or network error -> empty
      } finally {
        clearTimeout(timer);
      }
    })();

    return () => { cancelled = true; controller.abort(); clearTimeout(timer); };
  }, [destination, origin, cabin]);

  // ── sub-renders ─────────────────────────────────────────────────────────────
  const LivePill = () => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: 'rgba(201,151,46,0.14)', border: '1px solid rgba(201,151,46,0.35)',
      color: GOLD, fontSize: 10, fontWeight: 800, letterSpacing: 0.8,
      textTransform: 'uppercase', padding: '2px 8px', borderRadius: 100,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD }} />
      Live
    </span>
  );

  const VerifiedLine = () => (
    <div style={{ fontSize: 12.5, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ color: VERIFIED_GREEN, fontWeight: 800 }}>
        {'✓'} {(data?.verifiedPoints ?? 0).toLocaleString('en-IN')} verified pts
      </span>
      {data?.affordable
        ? <span style={{ color: 'var(--text-muted, #64748b)' }}>{'·'} covers this award</span>
        : <span style={{ color: GREY }}>{'·'} short by {(data?.shortfall ?? 0).toLocaleString('en-IN')} pts</span>}
    </div>
  );

  const AwardLine = ({ withCash }: { withCash: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <LivePill />
      <span
        title={data?.award?.program}
        style={{ fontSize: 15, fontWeight: 800, color: 'var(--text, #0f172a)' }}
      >
        {(data?.award?.mileageCost ?? 0).toLocaleString('en-IN')} miles
      </span>
      {withCash && data?.cashPrice != null
        ? <span style={{ fontSize: 12, color: GREY }}>{'·'} {'≈'} {'₹'}{data.cashPrice.toLocaleString('en-IN')} cash</span>
        : <span style={{ fontSize: 12, color: GREY }}>{'·'} cash fare unavailable</span>}
    </div>
  );

  function renderState() {
    switch (state) {
      case 'skeleton':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} aria-hidden="true">
            <div style={{ height: 15, width: '62%', borderRadius: 6, background: 'rgba(138,133,123,0.20)' }} />
            <div style={{ height: 12, width: '42%', borderRadius: 6, background: 'rgba(138,133,123,0.12)' }} />
            <span style={srOnly}>Checking live award seats{'…'}</span>
          </div>
        );
      case 'live-full':
        return (<><AwardLine withCash /><VerifiedLine /></>);
      case 'live-no-cash':
        return (<><AwardLine withCash={false} /><VerifiedLine /></>);
      case 'zero-verified':
        return (
          <>
            <AwardLine withCash />
            <div style={{ fontSize: 12.5, marginTop: 6, color: GREY }}>
              <Link href="/upload-statement" style={{ color: GOLD, fontWeight: 700, textDecoration: 'none' }}>
                Add a card statement to see your verified value {'→'}
              </Link>
            </div>
          </>
        );
      case 'empty':
        return (
          <div style={{ fontSize: 13, color: GREY, lineHeight: 1.5 }}>
            No live award seats for {destinationCity} in the next 30 days. Try another cabin or origin.
          </div>
        );
      case 'anon':
        return (
          <div style={{ fontSize: 13, color: 'var(--text, #0f172a)' }}>
            <Link href="/login?next=/trip-planner" style={{ color: GOLD, fontWeight: 700, textDecoration: 'none' }}>
              Sign in to see live award prices {'→'}
            </Link>
          </div>
        );
    }
  }

  const selectStyle: React.CSSProperties = {
    height: 44, padding: '0 10px', borderRadius: 10,
    border: '1.5px solid var(--border, #e2e8f0)', background: 'var(--bg-surface, #f8fafc)',
    color: 'var(--text, #0f172a)', fontSize: 13, fontWeight: 600, cursor: 'pointer', maxWidth: 190,
  };

  return (
    <div style={{
      minHeight: 112, boxSizing: 'border-box', marginTop: 10,
      background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e2e8f0)',
      borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Controls — hidden for anon (nothing to configure until signed in). */}
      {state !== 'anon' && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label htmlFor={originId} style={srOnly}>Origin airport</label>
          <select
            id={originId}
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            style={selectStyle}
          >
            {ORIGINS.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
          </select>
          <div role="group" aria-label="Cabin class" style={{ display: 'flex', border: '1.5px solid var(--border, #e2e8f0)', borderRadius: 10, overflow: 'hidden' }}>
            {(['economy', 'business'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCabin(c)}
                aria-pressed={cabin === c}
                style={{
                  minHeight: 44, minWidth: 92, padding: '0 12px', border: 'none',
                  background: cabin === c ? GOLD : 'transparent',
                  color: cabin === c ? '#0a0a0a' : 'var(--text, #0f172a)',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result region — announced politely as it resolves. */}
      <div
        aria-live="polite"
        aria-busy={state === 'skeleton'}
        style={{ minHeight: 44, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
      >
        {renderState()}
      </div>
    </div>
  );
}

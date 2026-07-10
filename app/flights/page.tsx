'use client';

// app/flights/page.tsx
// Cash + award + your-points "fusion" flight search (SaveSage-style).
// POSTs /api/flights/fusion and renders each flight with a cash option and,
// when an award match exists, a points option.
//
// HONESTY: every redemption is verified:false. Points values render in NEUTRAL
// GREY "estimate" styling — NEVER verified-green (#22c55e / #16a34a / #4FBF87
// are reserved for verified-from-statement data). A disclosure sits beside every
// points value. "currency-unknown" and "not-transferable" cards are shown, not hidden.

import { useState } from 'react';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { authedFetch } from '@/lib/authed-fetch';

// ── estimate palette (deliberately grey/gold, never green) ──────────────────
const GREY = '#64748b';
const GREY_SOFT = '#94a3b8';
const ESTIMATE_BG = '#f1f5f9';
const ESTIMATE_BORDER = '#e2e8f0';
const GOLD = '#C9972E';
const RED = '#dc2626';

type Cabin = 'economy' | 'business' | 'first';

interface RedemptionOption {
  cardName: string;
  bank: string;
  status: 'ok' | 'currency-unknown' | 'not-transferable';
  currency?: string;
  transferPartner?: string;
  ratio?: [number, number];
  cardPointsNeeded?: number;
  yourPoints?: number;
  canAfford?: boolean;
  verified: false;
  rating?: { valuePerPointInr: number | null; label: string };
}

interface FusedFlight {
  id: string;
  price: number;
  airline: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: number;
  stops: number;
  bookingLink: string;
  award: { program: string; mileageCost: number; seats: number; source: string } | null;
  redemption: RedemptionOption[];
  bestOption: RedemptionOption | null;
}

interface FusionResponse {
  route: { from: string; to: string; date_from: string; date_to: string; cabin: Cabin };
  counts: { cashFlights: number; awards: number; cards: number };
  verifiedPolicy: string;
  flights: FusedFlight[];
}

// Best-effort official program sites for the "how to book with points" link.
// These are program HOMEPAGES, not guaranteed deep links — the note makes the
// transfer step explicit so we never imply a one-tap award booking.
const PROGRAM_SITE: Record<string, string> = {
  singapore: 'https://www.singaporeair.com',
  'air-india': 'https://www.airindia.com',
  ba: 'https://www.britishairways.com',
};

const inr = (n: number) => n.toLocaleString('en-IN');
const fmtTime = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export default function FlightsFusionPage() {
  const [from, setFrom] = useState('BLR');
  const [to, setTo] = useState('SIN');
  const [date, setDate] = useState('');
  const [pax, setPax] = useState(1);
  const [cabin, setCabin] = useState<Cabin>('economy');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<FusionResponse | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const search = async () => {
    if (!from.trim() || !to.trim()) return;
    setLoading(true);
    setError('');
    setData(null);
    setExpanded(null);
    try {
      const res = await authedFetch('/api/flights/fusion', {
        method: 'POST',
        body: JSON.stringify({
          from: from.trim(),
          to: to.trim(),
          date_from: date || '',
          date_to: date || '',
          pax, // collected for the UI; the award/cash search is per-adult
          cabin,
        }),
      });
      if (res.status === 401) {
        setError('Please sign in to see points options for your own cards.');
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'search failed');
      setData(json as FusionResponse);
    } catch {
      setError('Could not fetch flights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const LABEL: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: GREY, textTransform: 'uppercase',
    letterSpacing: 1, display: 'block', marginBottom: 8,
  };
  const FIELD: React.CSSProperties = {
    width: '100%', height: 44, padding: '0 14px',
    background: 'var(--bg-surface, #f8fafc)', border: `1.5px solid var(--border, #e2e8f0)`,
    borderRadius: 10, fontSize: 14, color: 'var(--text, #0f172a)', outline: 'none',
    boxSizing: 'border-box', WebkitAppearance: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f8f9fc)' }}>
      <Header />
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '32px 20px 100px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(201,151,46,0.12)', border: '1px solid rgba(201,151,46,0.3)', borderRadius: 100, padding: '5px 16px', marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: GOLD, display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: 1.5, textTransform: 'uppercase' }}>Cash vs Points</span>
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 5vw, 44px)', fontWeight: 900, color: 'var(--text, #0f172a)', margin: '0 0 10px', letterSpacing: -1, lineHeight: 1.1 }}>
            Should you pay cash or points?
          </h1>
          <p style={{ fontSize: 15, color: GREY, margin: 0, lineHeight: 1.6, maxWidth: 520, marginInline: 'auto' }}>
            We compare live fares against award seats and your own card points &mdash; then show the smartest way to fly.
          </p>
        </div>

        {/* Search form */}
        <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 20, padding: 20, marginBottom: 20, boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={LABEL}>From</label>
              <input value={from} onChange={e => setFrom(e.target.value.toUpperCase())} placeholder="BLR" maxLength={3} style={FIELD} />
            </div>
            <div>
              <label style={LABEL}>To</label>
              <input value={to} onChange={e => setTo(e.target.value.toUpperCase())} placeholder="SIN" maxLength={3} style={FIELD} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={LABEL}>Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={FIELD} />
            </div>
            <div>
              <label style={LABEL}>Travellers</label>
              <select value={pax} onChange={e => setPax(Number(e.target.value))} style={{ ...FIELD, cursor: 'pointer' }}>
                {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'adult' : 'adults'}</option>)}
              </select>
            </div>
            <div>
              <label style={LABEL}>Cabin</label>
              <select value={cabin} onChange={e => setCabin(e.target.value as Cabin)} style={{ ...FIELD, cursor: 'pointer' }}>
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="first">First</option>
              </select>
            </div>
          </div>
          <button
            onClick={search}
            disabled={loading || !from.trim() || !to.trim()}
            style={{
              width: '100%', height: 52,
              background: loading || !from.trim() || !to.trim() ? '#cbd5e1' : 'linear-gradient(135deg, #C9972E, #E8B84B)',
              color: loading || !from.trim() || !to.trim() ? '#94a3b8' : '#0a0a0a',
              border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 800,
              cursor: loading || !from.trim() || !to.trim() ? 'not-allowed' : 'pointer',
              boxShadow: loading || !from.trim() || !to.trim() ? 'none' : '0 6px 20px rgba(201,151,46,0.28)',
            }}
          >
            {loading ? 'Comparing cash & points…' : 'Compare cash vs points →'}
          </button>
        </div>

        {/* Global estimate disclosure */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: ESTIMATE_BG, border: `1px solid ${ESTIMATE_BORDER}`, borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
          <span style={{ fontSize: 15, lineHeight: 1.2 }}>{'ℹ️'}</span>
          <div style={{ fontSize: 12, color: GREY, lineHeight: 1.5 }}>
            <strong style={{ color: '#475569' }}>Estimated &mdash; transfer ratios not yet verified.</strong>{' '}
            Points values below are honest estimates, not confirmed with the bank or airline.
            We don&rsquo;t guess your money: confirm the transfer ratio before you move any points.
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', color: RED, fontSize: 14, marginBottom: 20 }}>{error}</div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>{'✈️'}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #0f172a)' }}>Checking fares, award seats & your points{'…'}</div>
          </div>
        )}

        {data && !loading && (
          <>
            <div style={{ fontSize: 12, color: GREY_SOFT, marginBottom: 12 }}>
              {data.flights.length} flight{data.flights.length === 1 ? '' : 's'} {data.route.from} {'→'} {data.route.to}
              {' · '}{data.counts.awards} award seat{data.counts.awards === 1 ? '' : 's'} found
              {' · '}{data.counts.cards} of your cards checked
            </div>

            {data.flights.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: GREY }}>
                No flights found for this route/date. Try different dates or airports.
              </div>
            )}

            {data.flights.map(f => (
              <FlightCard
                key={f.id}
                flight={f}
                open={expanded === f.id}
                onToggle={() => setExpanded(expanded === f.id ? null : f.id)}
              />
            ))}
          </>
        )}
      </main>
      <DesignFooter />
    </div>
  );
}

// ── flight card ──────────────────────────────────────────────────────────────

function FlightCard({ flight, open, onToggle }: { flight: FusedFlight; open: boolean; onToggle: () => void }) {
  const best = flight.bestOption;
  const hasAward = !!flight.award;

  return (
    <div style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 16, marginBottom: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' }}>
      {/* summary row */}
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text, #0f172a)' }}>
              {flight.airline || 'Flight'} {'·'} {flight.from} {'→'} {flight.to}
            </div>
            <div style={{ fontSize: 12, color: GREY, marginTop: 3 }}>
              {fmtTime(flight.departure)}{flight.stops > 0 ? ` · ${flight.stops} stop${flight.stops > 1 ? 's' : ''}` : ' · non-stop'}
              {flight.duration ? ` · ${flight.duration}h` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: GREY_SOFT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Cash</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text, #0f172a)', lineHeight: 1.1 }}>{'₹'}{inr(flight.price)}</div>
          </div>
        </div>

        {/* two booking paths */}
        <div style={{ display: 'grid', gridTemplateColumns: hasAward ? '1fr 1fr' : '1fr', gap: 10, marginTop: 14 }}>
          <a
            href={flight.bookingLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', textAlign: 'center', padding: '11px 12px', borderRadius: 10,
              background: 'var(--ink, #142950)', color: '#fff', textDecoration: 'none',
              fontSize: 13, fontWeight: 700,
            }}
          >
            Book via Cash {'₹'}{inr(flight.price)} {'↗'}
          </a>

          {hasAward && best && best.status === 'ok' && (
            <button
              onClick={onToggle}
              style={{
                padding: '11px 12px', borderRadius: 10, cursor: 'pointer',
                background: '#fff', border: `1.5px solid ${GOLD}`, color: '#7a5a12',
                fontSize: 13, fontWeight: 700,
              }}
            >
              Book via Points: {inr(best.cardPointsNeeded || 0)} pts + est. taxes
            </button>
          )}

          {hasAward && !best && (
            <button
              onClick={onToggle}
              style={{
                padding: '11px 12px', borderRadius: 10, cursor: 'pointer',
                background: ESTIMATE_BG, border: `1.5px solid ${ESTIMATE_BORDER}`, color: GREY,
                fontSize: 13, fontWeight: 700,
              }}
            >
              Award seat exists {'—'} see card options
            </button>
          )}
        </div>

        {/* award / points sub-line */}
        {hasAward ? (
          <div style={{ marginTop: 10, fontSize: 12, color: GREY }}>
            {'⚑'} {flight.award!.program} {'·'} {inr(flight.award!.mileageCost)} miles
            {flight.award!.seats ? ` · ${flight.award!.seats} seat${flight.award!.seats > 1 ? 's' : ''} left` : ''}
            {best && best.status === 'ok' ? (
              <>
                {' · '}via <strong>{best.cardName}</strong>
                <span style={{ color: GREY_SOFT }}> (estimate)</span>
              </>
            ) : null}
          </div>
        ) : (
          <div style={{ marginTop: 10, fontSize: 12, color: GREY_SOFT }}>
            No award seat matched {'—'} cash only for this flight.
          </div>
        )}

        {hasAward && (
          <button
            onClick={onToggle}
            style={{ marginTop: 10, background: 'none', border: 'none', color: GOLD, fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0 }}
          >
            {open ? 'Hide card-by-card breakdown ↑' : 'Show card-by-card breakdown ↓'}
          </button>
        )}
      </div>

      {/* detail: per-card redemption */}
      {open && hasAward && (
        <div style={{ borderTop: '1px solid var(--border, #e2e8f0)', background: 'var(--bg-surface, #f8fafc)', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GREY, textTransform: 'uppercase', letterSpacing: 1 }}>
              Your cards {'→'} {flight.award!.program}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: GREY, background: ESTIMATE_BG, border: `1px solid ${ESTIMATE_BORDER}`, borderRadius: 100, padding: '3px 10px', textTransform: 'uppercase', letterSpacing: 1 }}>
              Estimated {'·'} not verified
            </span>
          </div>

          {flight.redemption.length === 0 && (
            <div style={{ fontSize: 13, color: GREY }}>No cards on file. Add your cards to see points options.</div>
          )}

          {flight.redemption.map((r, i) => (
            <RedemptionRow key={i} r={r} source={flight.award!.source} program={flight.award!.program} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── one card's redemption estimate (grey/gold styling only) ─────────────────

function RedemptionRow({ r, source, program }: { r: RedemptionOption; source: string; program: string }) {
  const rowBase: React.CSSProperties = {
    background: '#fff', border: `1px solid ${ESTIMATE_BORDER}`, borderRadius: 12,
    padding: '12px 14px', marginBottom: 8,
  };

  if (r.status === 'currency-unknown') {
    return (
      <div style={rowBase}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #0f172a)' }}>{r.cardName}</div>
        <div style={{ fontSize: 12, color: GREY, marginTop: 3 }}>
          {r.bank} {'·'} Currency unknown {'—'} not enough info to estimate a transfer. We won&rsquo;t guess a program or ratio.
        </div>
      </div>
    );
  }

  if (r.status === 'not-transferable') {
    return (
      <div style={rowBase}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text, #0f172a)' }}>{r.cardName}</div>
        <div style={{ fontSize: 12, color: GREY, marginTop: 3 }}>
          {r.bank} {'·'} {r.currency} {'—'} no known transfer route to {program}.
        </div>
      </div>
    );
  }

  // status === 'ok'
  const site = PROGRAM_SITE[source];
  const vpp = r.rating?.valuePerPointInr;
  return (
    <div style={rowBase}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text, #0f172a)' }}>{r.cardName}</div>
          <div style={{ fontSize: 12, color: GREY, marginTop: 3 }}>
            {r.bank} {'·'} {r.transferPartner}
            {r.ratio ? ` · transfer ${r.ratio[0]}:${r.ratio[1]}` : ''}
          </div>
        </div>
        {site && (
          <a
            href={site}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, fontWeight: 700, color: '#7a5a12', textDecoration: 'none', border: `1.5px solid ${GOLD}`, borderRadius: 8, padding: '6px 12px', whiteSpace: 'nowrap' }}
          >
            How to book {'↗'}
          </a>
        )}
      </div>

      {/* numbers row */}
      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 12 }}>
        <Stat label="Points needed" value={`${inr(r.cardPointsNeeded || 0)}`} />
        <Stat label="Your points" value={`${inr(r.yourPoints || 0)}`} />
        {vpp != null && <Stat label="Est. value / point" value={`≈ ₹${vpp.toFixed(2)}`} />}
      </div>

      {/* affordability (gold / red — never green) */}
      <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: r.canAfford ? GOLD : RED }}>
        {r.canAfford
          ? `✓ Your points cover this (estimate)`
          : `Short by ${inr((r.cardPointsNeeded || 0) - (r.yourPoints || 0))} pts`}
      </div>

      <div style={{ marginTop: 6, fontSize: 11, color: GREY_SOFT, lineHeight: 1.5 }}>
        Estimate only. Transfer your {r.bank} points to {r.transferPartner}, then book the award seat.
        Confirm the {r.ratio ? `${r.ratio[0]}:${r.ratio[1]} ` : ''}ratio on transfer {'—'} it is not yet verified.
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: GREY_SOFT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text, #0f172a)' }}>{value}</div>
    </div>
  );
}

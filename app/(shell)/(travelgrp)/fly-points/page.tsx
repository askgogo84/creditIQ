'use client';

// Fly on Points — Phase 3 board (NEW route; /trip-planner is untouched, Phase 5
// does the swap). Builds the approved mockup at docs/travel-redesign/
// travel-redesign-mockup.html against real /api/flights/fusion data.
//
// Deliberate deviations from the mockup, per the Phase-3 brief:
//   - No determinate progress bar. Fusion is ONE blocking call; a per-programme bar
//     would be the fake progress we are removing. Plain honest loading state instead.
//   - Rows are keyboard-focusable buttons, ready to become disclosure controls in
//     Phase 4. The expanded detail panel (cost / points-vs-cash / transfer ladder)
//     is Phase 4 and not built here.

import { useMemo, useState } from 'react';
import { authedFetch } from '@/lib/authed-fetch';
import { AirportSelect, labelFor } from '@/components/ciq/fly-points/AirportSelect';
import type { RedemptionOption } from '@/lib/fusion-core';
import '@/components/ciq/fly-points/fly-points.css';

// ── shape of a fusion row (see app/api/flights/fusion/route.ts) ──
interface AwardView {
  program: string;
  mileageCost: number;
  economyMiles: number;
  businessMiles: number;
  seats: number;
  source: string;
  isDirect: boolean;
  date: string;
  cabin: string;
  trip: {
    departsAt: string;
    arrivesAt: string;
    durationMinutes: number;
    stops: number;
    totalTaxes: number;
    taxesCurrency: string;
  } | null;
}
interface FusionRow {
  id: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: number;
  stops: number;
  award: AwardView | null;
  redemption: RedemptionOption[];
  bestOption: RedemptionOption | null;
}

// The card we surface on the collapsed row. Fusion's `bestOption` drops rows a held
// card can't AFFORD (pickBest gates on affordability), but the app-flow says those
// rows still show with the shortfall named — so we pick from the full redemption set:
// a reachable ('ok') option, cheapest first, affordable preferred. null = no held card
// can reach this award -> the honest "Not priced" line.
function pickDisplayOption(redemption: RedemptionOption[]): RedemptionOption | null {
  const ok = (redemption || []).filter((o) => o.status === 'ok' && o.cardPointsNeeded != null);
  if (!ok.length) return null;
  const affordable = ok.filter((o) => o.canAfford);
  const pool = affordable.length ? affordable : ok;
  return pool.reduce((b, o) => (o.cardPointsNeeded! < b.cardPointsNeeded! ? o : b));
}

type BandCabin = 'all' | 'economy' | 'business';

// ── date helpers (client-side; new Date is fine in the browser) ──
function todayISO(): string { return new Date().toISOString().slice(0, 10); }
function isoPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function shiftISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function fmtDate(iso: string): { d: string; wd: string } {
  const dt = new Date((iso || '').length > 10 ? iso : iso + 'T00:00:00');
  if (isNaN(dt.getTime())) return { d: iso, wd: '' };
  return {
    d: dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    wd: dt.toLocaleDateString('en-GB', { weekday: 'short' }),
  };
}
function fmtTime(iso: string): string {
  if (!iso) return '';
  const dt = new Date(iso);
  if (!isNaN(dt.getTime()) && iso.includes('T')) {
    return dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
  return '';
}
function fmtDuration(mins: number): string {
  if (!mins || mins <= 0) return '';
  const h = Math.floor(mins / 60), m = mins % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}
function fmtStops(stops: number): string {
  if (stops < 0) return '';
  return stops === 0 ? 'non-stop' : `${stops} stop${stops > 1 ? 's' : ''}`;
}
function fmtMiles(n: number): string {
  return n > 0 ? n.toLocaleString('en-IN') : '';
}
// seats.aero taxes are minor units of taxesCurrency. Only render a figure we trust:
// INR routes get ₹; anything else shows the currency code beside the amount.
function fmtTaxes(trip: AwardView['trip']): string {
  if (!trip || !(trip.totalTaxes > 0)) return '';
  const amount = Math.round(trip.totalTaxes / 100);
  const cur = trip.taxesCurrency || '';
  const sym = cur === 'INR' ? '₹' : cur ? cur + ' ' : '';
  return `+ ${sym}${amount.toLocaleString('en-IN')} taxes`;
}

export default function FlyPointsPage() {
  const [from, setFrom] = useState('BLR');
  const [to, setTo] = useState('DXB');
  const [date, setDate] = useState(isoPlusDays(21));
  const [flex, setFlex] = useState(3);
  const [cabin, setCabin] = useState<BandCabin>('all');

  const [rows, setRows] = useState<FusionRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [collapsed, setCollapsed] = useState(false);

  // Filters — all re-filter the fetched set; none re-query.
  const [nonStop, setNonStop] = useState(false);
  const [cabinFilter, setCabinFilter] = useState<'' | 'economy' | 'business'>('');
  const [cardsScope, setCardsScope] = useState<'mine' | 'all'>('mine');

  const dateFrom = flex > 0 ? shiftISO(date, -flex) : date;
  const dateTo = flex > 0 ? shiftISO(date, flex) : date;

  const search = async () => {
    if (!from || !to || from === to) return;
    setLoading(true);
    setError('');
    setRows(null);
    try {
      const res = await authedFetch('/api/flights/fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from, to,
          date_from: dateFrom,
          date_to: dateTo,
          // 'all' searches economy (widest availability); the record still carries
          // business miles for the other column. 'business' searches business.
          cabin: cabin === 'business' ? 'business' : 'economy',
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'search failed');
      // Points board: only rows that carry an award.
      const awardRows: FusionRow[] = (data.flights || []).filter((r: FusionRow) => r.award);
      setRows(awardRows);
      setCollapsed(true);
    } catch {
      setError('Couldn’t reach the award search just now — try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  const swap = () => { setFrom(to); setTo(from); };

  // Apply filters to the fetched rows (pure, no network).
  const shown = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => {
      const a = r.award!;
      if (nonStop) {
        const stops = a.trip ? a.trip.stops : a.isDirect ? 0 : r.stops;
        if (!(stops === 0)) return false;
      }
      if (cabinFilter === 'economy' && !(a.economyMiles > 0)) return false;
      if (cabinFilter === 'business' && !(a.businessMiles > 0)) return false;
      // My cards = only rows a held card can reach (affordable or not).
      if (cardsScope === 'mine' && !pickDisplayOption(r.redemption)) return false;
      return true;
    });
  }, [rows, nonStop, cabinFilter, cardsScope]);

  const summaryLine = `${labelFor(from).split(' (')[1]?.replace(')', '') || from} → ${
    labelFor(to).split(' (')[1]?.replace(')', '') || to
  } · ${fmtDate(date).d} ${flex > 0 ? `±${flex}` : ''} · ${
    cabin === 'all' ? 'All cabins' : cabin === 'economy' ? 'Economy' : 'Business'
  }`;

  const dateRangeLabel = flex > 0 ? `${fmtDate(dateFrom).d}–${fmtDate(dateTo).d}` : fmtDate(date).d;

  return (
    <div className="fp-root">
      <h1 className="fp-title">Fly on Points</h1>
      <p className="fp-sub">
        See what your points reach — the real number you’d transfer, the card it comes
        from, and where we have no route rather than a guess.
      </p>

      {/* SEARCH BAND — collapses in place to a summary once results exist */}
      {collapsed && rows ? (
        <button className="fp-summary" onClick={() => setCollapsed(false)}>
          <span className="fp-summary-txt fp-mono">{summaryLine}</span>
          <span className="fp-summary-edit">Edit</span>
        </button>
      ) : (
        <div className="fp-search">
          <AirportSelect label="From" value={from} exclude={to} onChange={setFrom} />
          <button className="fp-swap" title="Swap" aria-label="Swap airports" onClick={swap}>⇄</button>
          <AirportSelect label="To" value={to} exclude={from} onChange={setTo} />

          <div className="fp-fld">
            <label className="fp-fld-label" htmlFor="fp-date">Date</label>
            <input
              id="fp-date" type="date" className="fp-fld-val fp-mono"
              value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="fp-fld">
            <label className="fp-fld-label" htmlFor="fp-flex">Flex</label>
            <select
              id="fp-flex" className="fp-fld-val fp-mono"
              value={flex} onChange={(e) => setFlex(Number(e.target.value))}
            >
              {[0, 1, 2, 3, 7].map((n) => (
                <option key={n} value={n}>{n === 0 ? 'Exact' : `±${n} days`}</option>
              ))}
            </select>
          </div>
          <div className="fp-fld">
            <label className="fp-fld-label" htmlFor="fp-cabin">Cabin</label>
            <select
              id="fp-cabin" className="fp-fld-val"
              value={cabin} onChange={(e) => setCabin(e.target.value as BandCabin)}
            >
              <option value="all">All</option>
              <option value="economy">Economy</option>
              <option value="business">Business</option>
            </select>
          </div>

          <button className="fp-btn" onClick={search} disabled={loading || from === to}>
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      )}

      {/* LOADING — plain, honest, no fake per-programme progress */}
      {loading && (
        <div className="fp-loading" role="status">
          <span className="fp-spinner" aria-hidden="true" />
          Searching live award seats for {from} → {to}. This is one search across every
          programme — it can take a few seconds.
        </div>
      )}

      {error && !loading && <div className="fp-error" style={{ marginTop: 18 }}>{error}</div>}

      {/* FILTERS + RESULTS */}
      {rows && !loading && (
        <>
          <div className="fp-filters" role="group" aria-label="Filters">
            <button className="fp-chip" aria-pressed={!nonStop} onClick={() => setNonStop(false)}>All stops</button>
            <button className="fp-chip" aria-pressed={nonStop} onClick={() => setNonStop(true)}>Non-stop</button>
            <button
              className="fp-chip"
              aria-pressed={cabinFilter === 'economy'}
              onClick={() => setCabinFilter((c) => (c === 'economy' ? '' : 'economy'))}
            >Economy</button>
            <button
              className="fp-chip"
              aria-pressed={cabinFilter === 'business'}
              onClick={() => setCabinFilter((c) => (c === 'business' ? '' : 'business'))}
            >Business</button>
            <button
              className="fp-chip fp-chip-right"
              aria-pressed={cardsScope === 'all'}
              onClick={() => setCardsScope('all')}
            >All cards</button>
            <button
              className="fp-chip"
              aria-pressed={cardsScope === 'mine'}
              onClick={() => setCardsScope('mine')}
            >My cards</button>
          </div>

          <p className="fp-count">
            {shown.length} option{shown.length === 1 ? '' : 's'} · {dateRangeLabel} ·{' '}
            {cardsScope === 'mine' ? 'using the cards in your wallet' : 'across all cards we track'}
          </p>

          {shown.length === 0 ? (
            <div className="fp-empty">
              No award seats to show for {from} → {to} on {dateRangeLabel}
              {cardsScope === 'mine' ? ' that your wallet cards can reach' : ''}. An empty
              award search is a real answer — try widening the dates or switching to All cards.
            </div>
          ) : (
            <div className="fp-list">
              <div className="fp-head">
                <div>Date</div>
                <div>Programme &amp; route</div>
                <div style={{ textAlign: 'right' }}>Economy</div>
                <div style={{ textAlign: 'right' }}>Business</div>
                <div style={{ textAlign: 'right' }}>You pay</div>
              </div>
              {shown.map((r) => (
                <ResultRow key={r.id} row={r} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ResultRow({ row }: { row: FusionRow }) {
  const a = row.award!;
  const dateISO = a.date || row.departure;
  const { d, wd } = fmtDate(dateISO);
  const dep = fmtTime(a.trip?.departsAt || row.departure);
  const arr = fmtTime(a.trip?.arrivesAt || row.arrival);
  const dur = fmtDuration(a.trip?.durationMinutes || row.duration * 60);
  const stops = a.trip ? a.trip.stops : a.isDirect ? 0 : row.stops;
  const legParts = [
    `${row.from} → ${row.to}`,
    dep && arr ? `${dep} → ${arr}` : '',
    dur,
    fmtStops(stops),
  ].filter(Boolean);

  const econ = fmtMiles(a.economyMiles);
  const biz = fmtMiles(a.businessMiles);
  const best = pickDisplayOption(row.redemption);

  return (
    <button className="fp-row" aria-expanded="false">
      <div className="fp-date">{d} <small>{wd}</small></div>

      <div>
        <div className="fp-prog">{a.program}</div>
        <div className="fp-leg">{legParts.join(' · ')}</div>
      </div>

      {/* desktop cabin columns */}
      <div className={`fp-cabin fp-mono${econ ? '' : ' none'}`}>{econ || '—'}</div>
      <div className={`fp-cabin fp-mono${biz ? '' : ' none'}`}>{biz || '—'}</div>

      {/* mobile cabin block */}
      <div className="fp-cabins-m">
        <div>Economy<b className={`fp-mono${econ ? '' : ' none'}`}>{econ || '—'}</b></div>
        <div>Business<b className={`fp-mono${biz ? '' : ' none'}`}>{biz || '—'}</b></div>
      </div>

      {/* you pay — the ladder's pointsRequired, or the honest no-route line */}
      {best && best.cardPointsNeeded != null ? (
        <div className="fp-cost">
          <b className="fp-mono">{best.cardPointsNeeded.toLocaleString('en-IN')} pts</b>
          {fmtTaxes(a.trip) && <span className="fp-tax fp-mono">{fmtTaxes(a.trip)}</span>}
          <div className="fp-card">
            {best.cardName}{' '}
            <span className={`fp-pill ${best.selfEntered ? 'self' : 'wallet'}`}>
              {best.selfEntered ? 'Self-entered' : 'In wallet'}
            </span>
          </div>
        </div>
      ) : (
        <div className="fp-noprice">Not priced · no known route from your cards</div>
      )}
    </button>
  );
}

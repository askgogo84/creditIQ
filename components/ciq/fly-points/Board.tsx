'use client';

// Fly on Points board — the Travel section's primary surface, served at
// /trip-planner (Phase 5 swap; the AI planner is retired, free-text lives on the
// Ask AI tab). Builds the approved mockup at docs/travel-redesign/
// travel-redesign-mockup.html against real /api/flights/fusion data.
//
// Deliberate deviation from the mockup: no determinate progress bar. Fusion is ONE
// blocking call; a per-programme bar would be the fake progress we are removing.
//
// The row is a real disclosure control (one open at a time). The inline detail
// carries three blocks — cost by cabin, points-vs-cash (cash fetched live on
// demand), and the transfer ladder — plus one Book action and the irreversible-
// transfer warning. Not-priced rows expand into an honest "why not" block.
//
// Inbound deep links land here: ?q=Trip to <city> prefills the destination;
// ?points=/&bank= (legacy planner params) are harmless no-ops — the board prices
// from the user's actual wallet cards, not a typed points total.

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authedFetch } from '@/lib/authed-fetch';
import { AirportSelect, labelFor } from '@/components/ciq/fly-points/AirportSelect';
import { detectIataFromText } from '@/components/design/FlightSearch';
import type { RedemptionOption, CabinBest } from '@/lib/fusion-core';
import type { Route } from '@/lib/transfer-ladder';
import { describeDuration } from '@/lib/transfer-ladder';
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
  cabins: CabinBest[]; // per-cabin best option (ladder + pointsRequired), server-computed
}

// Primary cabin for the collapsed row = economy when priced/available, else the
// first cabin the record carries. The collapsed "you pay" reflects this cabin.
function primaryCabin(row: FusionRow): CabinBest | undefined {
  return row.cabins?.find((c) => c.cabin === 'economy') ?? row.cabins?.[0];
}
// A row is reachable ("My cards") if ANY cabin has a priced option.
function rowReachable(row: FusionRow): boolean {
  return !!row.cabins?.some((c) => c.best);
}

type BandCabin = 'all' | 'economy' | 'business';

// MANUAL FX ESTIMATE — not a live or sourced rate. This is the house convenience
// rate; it WILL drift from the market and must be replaced by a sourced/live rate
// (RBI reference rate or an FX feed) before any converted figure is treated as
// solid. Any converted tax is rendered with "≈" and this rate + date, never as an
// exact number. Bump USD_INR_SET whenever the rate is touched.
const USD_INR_ESTIMATE = 90;
const USD_INR_SET = '20 Aug 2026';

// ── taxes for the detail. seats.aero taxes are minor units of taxesCurrency.
//   exact  = the rupee figure is real (INR, or zero taxes).
//   !exact = converted from a foreign currency via the manual estimate above —
//            the UI must flag it as approximate and name the rate.
//   inr:null = a currency we don't convert; show it natively, no rupee claim. ──
interface Taxes { inr: number | null; exact: boolean; native: string | null; }
function taxesFor(trip: AwardView['trip']): Taxes {
  if (!trip || !(trip.totalTaxes > 0)) return { inr: 0, exact: true, native: null };
  const major = Math.round(trip.totalTaxes / 100);
  if (trip.taxesCurrency === 'INR') return { inr: major, exact: true, native: null };
  if (trip.taxesCurrency === 'USD') {
    return { inr: major * USD_INR_ESTIMATE, exact: false, native: `US$${major.toLocaleString('en-US')}` };
  }
  return { inr: null, exact: false, native: `${trip.taxesCurrency} ${major.toLocaleString('en-IN')}` };
}

// Best-effort award-search deep links. Most programmes don't accept award-search
// prefill via querystring, so these are landing pages into the redemption flow;
// unknown sources fall back to a search rather than a fabricated deep link.
const BOOKING_LANDING: Record<string, string> = {
  singapore: 'https://www.singaporeair.com/en_UK/us/ppsclub-krisflyer/use-miles/',
  'air-india': 'https://www.airindia.com/in/en/loyalty/flying-returns.html',
  ba: 'https://www.britishairways.com/travel/redeem/execclub/',
  united: 'https://www.united.com/en/us/book-flight/united-award',
  aeroplan: 'https://www.aircanada.com/aeroplan/redeem/',
  alaska: 'https://www.alaskaair.com/booking/award',
  velocity: 'https://experience.velocityfrequentflyer.com/',
  aadvantage: 'https://www.aa.com/booking/find-flights',
  delta: 'https://www.delta.com/flight-search/book-a-flight',
  emirates: 'https://www.emirates.com/us/english/skywards/',
  etihad: 'https://www.etihad.com/en-us/etihad-guest',
  flyingblue: 'https://www.flyingblue.com/en/spend/flights',
  virginatlantic: 'https://www.virginatlantic.com/flying-club/spend-miles',
};
function bookingUrl(source: string, programme: string): string {
  return (
    BOOKING_LANDING[source] ||
    `https://www.google.com/search?q=${encodeURIComponent(programme + ' award booking')}`
  );
}

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

export function Board() {
  const params = useSearchParams();
  // ?q=Trip to <city> (from /explore etc.) prefills the destination. No city match
  // -> default DXB. ?points=/&bank= are ignored: the board prices from wallet cards.
  const qTo = detectIataFromText(params.get('q') || '') || 'DXB';

  const [from, setFrom] = useState('BLR');
  const [to, setTo] = useState(qTo);
  const [date, setDate] = useState(isoPlusDays(21));
  const [flex, setFlex] = useState(3);
  const [cabin, setCabin] = useState<BandCabin>('all');

  const [rows, setRows] = useState<FusionRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null); // one row open at a time

  // Filters — all re-filter the fetched set; none re-query.
  const [nonStop, setNonStop] = useState(false);
  const [cabinFilter, setCabinFilter] = useState<'' | 'economy' | 'business'>('');
  // Default ALL CARDS: the first search shows the user what award seats EXIST, then
  // they narrow to what their wallet can fund. My cards is the deliberate narrowing,
  // not the starting point.
  const [cardsScope, setCardsScope] = useState<'mine' | 'all'>('all');

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

  // Filtering is two stages so the empty state can tell them apart (stop/cabin chips
  // vs the cards narrowing). Neither stage re-queries. The list is NEVER filtered by
  // whether we have a transfer route — an unpriceable seat still renders, honestly,
  // as "Not priced".
  const base = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => {
      const a = r.award!;
      if (nonStop) {
        const stops = a.trip ? a.trip.stops : a.isDirect ? 0 : r.stops;
        if (!(stops === 0)) return false;
      }
      if (cabinFilter === 'economy' && !(a.economyMiles > 0)) return false;
      if (cabinFilter === 'business' && !(a.businessMiles > 0)) return false;
      return true;
    });
  }, [rows, nonStop, cabinFilter]);

  // My cards = only rows a held card can reach (affordable or not). All cards = every
  // seat, unreachable ones shown as "Not priced".
  const shown = useMemo(
    () => (cardsScope === 'mine' ? base.filter(rowReachable) : base),
    [base, cardsScope],
  );

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
              {rows.length === 0 ? (
                // Genuinely no award seats for the route/dates.
                <>No award seats found for {from} → {to} on {dateRangeLabel}. An empty
                award search is a real answer — try widening the dates.</>
              ) : base.length === 0 ? (
                // Seats exist; the stop/cabin chips hid them.
                <>{rows.length} award seat{rows.length === 1 ? '' : 's'} found, but none match
                the current stop or cabin filter — clear a filter to see {rows.length === 1 ? 'it' : 'them'}.</>
              ) : (
                // Seats exist and pass the chips, but the wallet can't reach any of them.
                <>
                  {base.length} award seat{base.length === 1 ? '' : 's'} found for {from} → {to}, but
                  none can be booked with the cards in your wallet.{' '}
                  <button className="fp-inline-link" onClick={() => setCardsScope('all')}>
                    Show all cards
                  </button>{' '}
                  to see them.
                </>
              )}
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
                <ResultRow
                  key={r.id}
                  row={r}
                  open={expandedId === r.id}
                  onToggle={() => setExpandedId((id) => (id === r.id ? null : r.id))}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ResultRow({ row, open, onToggle }: { row: FusionRow; open: boolean; onToggle: () => void }) {
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
  const best = primaryCabin(row)?.best ?? null;
  // Shortfall = what the transfer needs minus what the card holds. 03-APP-FLOW:
  // the row still shows, with the gap named. yourPoints is the display card's balance.
  const need = best?.cardPointsNeeded ?? 0;
  const shortfall = best ? Math.max(0, need - (best.yourPoints ?? 0)) : 0;
  const detailId = `fp-d-${row.id}`;

  return (
    <>
      <button
        className="fp-row"
        aria-expanded={open}
        aria-controls={detailId}
        onClick={onToggle}
      >
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

        {/* you pay — the ladder's pointsRequired + shortfall, or the honest no-route line */}
        {best && best.cardPointsNeeded != null ? (
          <div className="fp-cost">
            <div className="fp-payline">
              <span className="fp-pay fp-mono">{need.toLocaleString('en-IN')} pts</span>
              {shortfall > 0 && (
                <span className="fp-short fp-mono">· {shortfall.toLocaleString('en-IN')} short</span>
              )}
            </div>
            {shortfall > 0 && best.selfEntered && (
              <div className="fp-short-note">based on the balance you entered</div>
            )}
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

      {open && <RowDetail row={row} id={detailId} />}
    </>
  );
}

// ── expanded row — inline, one open at a time (03-APP-FLOW S4/S5) ──
function RowDetail({ row, id }: { row: FusionRow; id: string }) {
  const a = row.award!;
  const reachable = rowReachable(row);
  // Cabin selector spans the cabins the record actually prices.
  const cabins = row.cabins || [];
  const [cabin, setCabin] = useState<CabinBest['cabin']>(
    (primaryCabin(row)?.cabin ?? cabins[0]?.cabin ?? 'economy') as CabinBest['cabin'],
  );
  const sel = cabins.find((c) => c.cabin === cabin) ?? cabins[0];
  const selBest = sel?.best ?? null;

  // Cash is fetched live only on request — never shown beside a points figure until asked.
  const [cash, setCash] = useState<{ state: 'idle' | 'loading' | 'done' | 'error'; price: number | null }>(
    { state: 'idle', price: null },
  );
  const fetchCash = async () => {
    setCash({ state: 'loading', price: null });
    try {
      const res = await authedFetch('/api/flights/cash-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: row.from, to: row.to }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error('failed');
      setCash({ state: 'done', price: typeof data.cashPrice === 'number' ? data.cashPrice : null });
    } catch {
      setCash({ state: 'error', price: null });
    }
  };

  const taxes = taxesFor(a.trip);
  const programme = a.program;

  return (
    <div className="fp-detail" id={id} role="region">
      {/* NOT PRICED — honest "why not" (still lets them price cash) */}
      {!reachable ? (
        <>
          <div className="fp-blk">
            <h4>Not priced</h4>
            <p className="fp-verdict">
              This seat is real — {programme} has it. We have no verified transfer route
              from the cards in your wallet into {programme}, so we won’t put a number on
              it. We’d rather say that than guess a ratio.
            </p>
          </div>
          <CashBlock cash={cash} onFetch={fetchCash} taxes={taxes} need={null} />
        </>
      ) : (
        <>
          {/* 1 · WHAT IT COSTS — miles + taxes, cabin selectable */}
          <div className="fp-blk">
            <div className="fp-blk-head">
              <h4>What it costs</h4>
              {cabins.length > 1 && (
                <div className="fp-cabtabs" role="group" aria-label="Cabin">
                  {cabins.map((c) => (
                    <button
                      key={c.cabin}
                      className="fp-cabtab"
                      aria-pressed={c.cabin === cabin}
                      onClick={() => setCabin(c.cabin)}
                    >
                      {c.cabin === 'economy' ? 'Economy' : 'Business'}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="fp-costrow">
              <div>
                <span className="fp-costbig fp-mono">{(sel?.miles ?? 0).toLocaleString('en-IN')}</span>{' '}
                <span className="fp-costsub">{programme} miles</span>
              </div>
              <div className="fp-costsub">
                {taxes.inr === 0 && taxes.exact ? (
                  'no cash taxes on this fare'
                ) : taxes.exact && taxes.inr != null ? (
                  <>plus <b className="fp-mono">₹{taxes.inr.toLocaleString('en-IN')}</b> paid in cash for taxes</>
                ) : taxes.inr != null ? (
                  // converted from a foreign currency — flag it, name the rate + date
                  <>plus <b className="fp-mono">{taxes.native}</b> in cash for taxes{' '}
                    <span className="fp-estnote">≈ ₹{taxes.inr.toLocaleString('en-IN')} at $1=₹{USD_INR_ESTIMATE}, set {USD_INR_SET} — estimate</span></>
                ) : (
                  <>plus <b className="fp-mono">{taxes.native}</b> in cash for taxes</>
                )}
              </div>
            </div>
          </div>

          {/* 2 · POINTS VS CASH — cash fetched live on demand */}
          <div className="fp-blk">
            <h4>Points vs cash</h4>
            <CashBlock
              cash={cash}
              onFetch={fetchCash}
              taxes={taxes}
              need={selBest?.cardPointsNeeded ?? null}
            />
          </div>

          {/* 3 · HOW TO GET THE MILES — the transfer ladder */}
          <div className="fp-blk">
            <h4>How to get {(sel?.miles ?? 0).toLocaleString('en-IN')} {programme} miles</h4>
            {selBest?.routes?.length ? (
              <Ladder routes={selBest.routes} cardName={selBest.cardName} programme={programme} />
            ) : (
              <p className="fp-foot">
                No known route from your cards into {programme} for {cabin}. The other cabin
                may still price.
              </p>
            )}
            {selBest && (
              <div className="fp-act">
                <a
                  className="fp-btn"
                  href={bookingUrl(a.source, programme)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Book on {programme} →
                </a>
              </div>
            )}
            {selBest && (
              <div className="fp-warn">
                <b>Check the seat is still there before you transfer.</b> Transfers out of
                your bank can’t be undone — if the seat goes, the miles stay in {programme}.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Points-vs-cash body — the "Show cash price" gate + the verdict once fetched.
//
// SCOPE HONESTY: the fetched fare is the cheapest on the ROUTE (Travelpayouts
// prices/cheap), not a quote for THIS DATE's award. The real date-fare is >= this
// floor, so keep/value-per-point computed here are LOWER BOUNDS on the true trip.
// That lets us say points look poor value at the floor — but NOT assert "book with
// cash", because a pricier date fare could tilt it back to points.
function CashBlock({
  cash, onFetch, taxes, need,
}: {
  cash: { state: 'idle' | 'loading' | 'done' | 'error'; price: number | null };
  onFetch: () => void;
  taxes: Taxes;
  need: number | null;      // card points for the selected cabin, or null (not priced)
}) {
  if (cash.state === 'idle') {
    return (
      <div>
        <button className="fp-btn-quiet" onClick={onFetch}>Show cash price</button>
        <p className="fp-foot">Fetched live when you ask. We don’t show an estimate next to a real points figure.</p>
      </div>
    );
  }
  if (cash.state === 'loading') return <p className="fp-foot">Fetching the live cash fare…</p>;
  if (cash.state === 'error' || cash.price == null) {
    return <p className="fp-foot">Couldn’t fetch a live cash fare for this route just now — no number invented.</p>;
  }

  const cashFare = cash.price;
  const routeNote = (
    <p className="fp-foot">Cheapest fare on this route, not a quote for this date — check the exact date’s fare before deciding.</p>
  );

  // No rupee tax figure (foreign currency we won't convert), or no priced points
  // route: show the fare plainly, no keep/value math.
  if (taxes.inr == null || need == null) {
    return (
      <div>
        <p className="fp-verdict">
          The cheapest cash fare on this route is <b className="fp-mono">₹{cashFare.toLocaleString('en-IN')}</b>.
          {need == null
            ? ' No priced points route to compare it against.'
            : taxes.inr == null
              ? ` Taxes are in ${taxes.native} — we won’t convert them on a guess to compare.`
              : ''}
        </p>
        {routeNote}
      </div>
    );
  }

  const approx = !taxes.exact;              // taxes converted via the manual FX estimate
  const a = approx ? '≈' : '';
  const keep = Math.max(0, cashFare - taxes.inr);
  const vpp = need > 0 ? keep / need : 0;   // LOWER BOUND (cash is the route floor)
  const poorAtFloor = vpp < 0.30;

  return (
    <div>
      {poorAtFloor ? (
        <p className="fp-verdict">
          Against this route’s cheapest fare — <b className="fp-mono">₹{cashFare.toLocaleString('en-IN')}</b>,
          the route floor, not this date — points look <b className="fp-alert">poor value</b> here:{' '}
          <b className="fp-mono">{need.toLocaleString('en-IN')}</b> points save {a}
          <b className="fp-mono">₹{keep.toLocaleString('en-IN')}</b>, about {a}
          <b className="fp-mono">₹{vpp.toFixed(2)}</b> per point, below the ₹0.30 portal floor. Your date
          may cost more, which would tilt it back toward points — check the date’s fare before you burn them.
        </p>
      ) : (
        <p className="fp-verdict">
          The cheapest cash fare on this route is <b className="fp-mono">₹{cashFare.toLocaleString('en-IN')}</b>{' '}
          (the route floor, not this date). Against even that, with points you pay {a}
          <b className="fp-mono">₹{taxes.inr.toLocaleString('en-IN')}</b> in taxes and{' '}
          <span className="fp-keep">keep at least {a}₹{keep.toLocaleString('en-IN')}</span> — {a}₹{vpp.toFixed(2)} per
          point, at or above the ₹0.30 floor. A pricier date fare only helps points.
        </p>
      )}
      <p className="fp-vpp fp-mono">VALUE PER POINT {a}₹{vpp.toFixed(2)} · portal floor ₹0.30 · vs route-cheapest fare</p>
      {approx && (
        <p className="fp-estnote">
          Taxes converted from {taxes.native} at $1=₹{USD_INR_ESTIMATE}, set {USD_INR_SET} — manual estimate, not a live rate.
        </p>
      )}
      {routeNote}
    </div>
  );
}

// The transfer ladder — one route per line: path, ratio (nominal), hops, DAYS, and
// the payable pointsRequired (the truth). Long/unknown durations are flagged.
function Ladder({ routes, cardName, programme }: { routes: Route[]; cardName: string; programme: string }) {
  return (
    <div className="fp-ladder">
      {routes.map((r, i) => {
        const days = describeDuration(r);
        const risky = r.durationDaysMax != null && r.durationDaysMax > 7; // can't hold a live seat
        const unknown = r.durationUnknown;
        const hops = r.hops.length === 1 ? 'Direct' : `${r.hops.length} hops`;
        const [nf, nt] = r.nominalRatio;
        return (
          <div key={i} className={`fp-rung${i === 0 ? ' best' : ''}`}>
            <div>
              <div className="fp-path">
                {cardName} <span className="fp-arw">→</span> {programme}
              </div>
              <div className="fp-rmeta">
                {hops} · nominal {nf}:{nt}
                {r.minTransferIncrement ? ` · min ${r.minTransferIncrement.toLocaleString('en-IN')}` : ''}
                {r.state !== 'verified' ? ' · estimated, not issuer-confirmed' : ''}
              </div>
              {r.roundingInflated && (
                <div className="fp-rmeta">
                  rounded up to a {(r.minTransferIncrement ?? 0).toLocaleString('en-IN')}-mile transfer minimum
                </div>
              )}
            </div>
            <div className={`fp-days fp-mono${risky ? ' risk' : unknown ? ' warn' : ' ok'}`}>
              {unknown ? 'time unknown' : days}
            </div>
            <div className="fp-pts fp-mono">{r.pointsRequired.toLocaleString('en-IN')} pts</div>
          </div>
        );
      })}
      {routes.some((r) => r.durationDaysMax != null && r.durationDaysMax > 7) && (
        <p className="fp-risknote">
          A route that takes this long can’t hold a seat that’s available today — it will very
          likely be gone before your miles arrive.
        </p>
      )}
    </div>
  );
}

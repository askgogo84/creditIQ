'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authedFetch } from '@/lib/authed-fetch'
import { AirportSelect } from '@/components/ciq/fly-points/AirportSelect'
import { labelFor, resolveCity } from '@/lib/data/airports'
import type { RedemptionOption } from '@/lib/fusion-core'
import { ConciergeRequestButton } from '@/components/ciq/concierge/ConciergeRequestButton'
import { buildFlightConciergeRequest } from '@/components/ciq/concierge/travel-requests'
import { programmeIdForFlightSource } from '@/lib/redemption-rails/programme-resolver'
import { WalletRailMatrix } from './WalletRailMatrix'
import { rankWalletOptions } from './flight-wallet-comparison'
import '@/components/ciq/fly-points/fly-points.css'
import './investor-flight-workspace.css'

type Cabin = 'economy' | 'business'

type AwardView = {
  program: string
  mileageCost: number
  seats: number
  source: string
  isDirect: boolean
  date: string
  cabin: string
  trip: {
    flightNumbers?: string
    carriers?: string
    departsAt: string
    arrivesAt: string
    durationMinutes: number
    stops: number
    totalTaxes: number
    taxesCurrency: string
  } | null
}

type FusionRow = {
  id: string
  price: number
  airline?: string
  bookingLink?: string
  cashUnavailable?: boolean
  from: string
  to: string
  departure: string
  arrival: string
  duration: number
  stops: number
  award: AwardView | null
  redemption: RedemptionOption[]
  bestOption: RedemptionOption | null
}

type FusionCounts = {
  cashFlights: number
  awards: number
  awardsEnriched: number
  awardOnlyCards: number
  cards: number
}

function isoPlusDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function fmtDate(iso: string) {
  const d = new Date((iso || '').length > 10 ? iso : `${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function fmtTime(iso: string) {
  if (!iso?.includes('T')) return ''
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtDuration(mins: number) {
  if (!(mins > 0)) return 'duration unavailable'
  return `${Math.floor(mins / 60)}h ${(mins % 60).toString().padStart(2, '0')}m`
}

function fmtStops(stops: number) {
  if (stops < 0) return 'stops unknown'
  return stops === 0 ? 'non-stop' : `${stops} stop${stops === 1 ? '' : 's'}`
}

function nativeTaxes(trip: AwardView['trip']) {
  if (!trip || !(trip.totalTaxes > 0)) return null
  const amount = Math.round(trip.totalTaxes / 100)
  return trip.taxesCurrency === 'INR' ? `₹${amount.toLocaleString('en-IN')}` : `${trip.taxesCurrency} ${amount.toLocaleString('en-IN')}`
}

function rowReachable(row: FusionRow) {
  return row.redemption.some((option) => option.status === 'ok')
}

export function GlobalFlightWorkspace() {
  const params = useSearchParams()
  const qTo = resolveCity(params.get('q') || '') || ''
  const [from, setFrom] = useState('BLR')
  const [to, setTo] = useState(qTo)
  const [date, setDate] = useState(isoPlusDays(21))
  const [cabin, setCabin] = useState<Cabin>('business')
  const [scope, setScope] = useState<'all' | 'mine'>('all')
  const [nonStop, setNonStop] = useState(false)
  const [rows, setRows] = useState<FusionRow[] | null>(null)
  const [counts, setCounts] = useState<FusionCounts | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function search() {
    if (!from || !to || from === to) return
    setLoading(true)
    setError('')
    setRows(null)
    setCounts(null)
    setSelectedId(null)
    try {
      const res = await authedFetch('/api/flights/fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, date_from: date, date_to: date, cabin }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'search failed')
      // Inventory-first: keep cash-only, cash+award and award-only rows. Wallet
      // reachability is a filter, never a reason to erase provider inventory.
      setRows((data.flights || []) as FusionRow[])
      setCounts(data.counts ?? null)
    } catch {
      setError('Couldn’t complete the provider search just now — try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (!rows) return []
    return rows.filter((row) => {
      const stops = row.award?.trip?.stops ?? (row.award?.isDirect ? 0 : row.stops)
      if (nonStop && stops !== 0) return false
      if (scope === 'mine' && !rowReachable(row)) return false
      return true
    })
  }, [rows, scope, nonStop])

  useEffect(() => {
    if (!filtered.length) return setSelectedId(null)
    if (!selectedId || !filtered.some((row) => row.id === selectedId)) setSelectedId(filtered[0].id)
  }, [filtered, selectedId])

  const selected = filtered.find((row) => row.id === selectedId) ?? null

  return (
    <div className="ifw-root">
      <div className="ifw-title-row">
        <div>
          <h1 className="ifw-title">Any city. All provider-returned options.</h1>
          <p className="ifw-sub">Cash-only itineraries, award-only availability and matched cash + award rows stay in one search. Your wallet is evaluated after inventory is loaded.</p>
        </div>
        <div className="ifw-honesty">No hidden top-5 · no wallet-only default</div>
      </div>

      <div className="fp-search ifw-search">
        <AirportSelect label="From" value={from} exclude={to} onChange={setFrom} />
        <button className="fp-swap" title="Swap" aria-label="Swap airports" onClick={() => { setFrom(to); setTo(from) }}>⇄</button>
        <AirportSelect label="To" value={to} exclude={from} onChange={setTo} />
        <div className="fp-fld"><label className="fp-fld-label" htmlFor="global-date">Date</label><input id="global-date" type="date" className="fp-fld-val fp-mono" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        <div className="fp-fld"><label className="fp-fld-label" htmlFor="global-cabin">Cabin</label><select id="global-cabin" className="fp-fld-val" value={cabin} onChange={(e) => setCabin(e.target.value as Cabin)}><option value="business">Business</option><option value="economy">Economy</option></select></div>
        <button className="fp-btn" onClick={search} disabled={loading || !from || !to || from === to}>{loading ? 'Searching…' : 'Search'}</button>
      </div>

      {loading && <div className="fp-loading" role="status">Loading cash and award inventory for {from} → {to}…</div>}
      {error && !loading && <div className="fp-error ifw-error">{error}</div>}

      {rows && !loading && (
        <>
          <div className="ifw-toolbar">
            <div>
              <strong>{filtered.length} visible · {rows.length} loaded</strong>
              <span>{labelFor(from)} → {labelFor(to)} · {fmtDate(date)} · {cabin}{counts ? ` · ${counts.cashFlights} cash rows · ${counts.awards} award records` : ''}</span>
            </div>
            <div className="ifw-filters" role="group" aria-label="Flight result filters">
              <button aria-pressed={scope === 'all'} onClick={() => setScope('all')}>All options</button>
              <button aria-pressed={scope === 'mine'} onClick={() => setScope('mine')}>Legacy mapped transfer estimate</button>
              <button aria-pressed={nonStop} onClick={() => setNonStop((v) => !v)}>Non-stop</button>
            </div>
          </div>
          <div className="ifw-source-note">Cash provider search requests its full supported result window. Selected results now load a separate exact-card redemption-rail matrix; the old transfer estimate is retained only as a temporary filter until rail-aware ranking replaces it.</div>

          <div className="ifw-workspace">
            <div className="ifw-left">
              {filtered.length === 0 ? (
                <div className="ifw-empty">{rows.length === 0 ? 'No connected provider returned inventory for this search.' : <>No loaded option matches this filter. <button onClick={() => setScope('all')}>Show all loaded options</button>.</>}</div>
              ) : (
                <div className="ifw-list" role="listbox" aria-label="Flight options">
                  {filtered.map((row) => <GlobalFlightRow key={row.id} row={row} active={row.id === selectedId} onSelect={() => setSelectedId(row.id)} />)}
                </div>
              )}
            </div>
            <GlobalDecisionPanel row={selected} />
          </div>
        </>
      )}
    </div>
  )
}

function GlobalFlightRow({ row, active, onSelect }: { row: FusionRow; active: boolean; onSelect: () => void }) {
  const award = row.award
  const trip = award?.trip ?? null
  const stops = trip?.stops ?? (award?.isDirect ? 0 : row.stops)
  const taxes = nativeTaxes(trip)
  return (
    <button className={`ifw-row${active ? ' active' : ''}`} onClick={onSelect} role="option" aria-selected={active}>
      <div className="ifw-date"><b>{fmtDate(award?.date || row.departure)}</b><span>{fmtTime(trip?.departsAt || row.departure) || 'time n/a'}</span></div>
      <div className="ifw-programme"><b>{award?.program || row.airline || 'Cash itinerary'}</b><span>{row.from} → {row.to} · {fmtDuration(trip?.durationMinutes || row.duration * 60)} · {fmtStops(stops)}</span><small>{award ? (row.price > 0 ? 'Cash + award' : 'Award-only') : 'Cash-only · still part of the search'}</small></div>
      <div className="ifw-metric"><b>{award ? award.mileageCost.toLocaleString('en-IN') : '—'}</b><span>{award ? `${award.program} miles` : 'no award match'}</span>{taxes && <small>+ {taxes} taxes</small>}</div>
      <div className="ifw-metric"><b>{row.price > 0 ? `₹${row.price.toLocaleString('en-IN')}` : '—'}</b><span>{row.price > 0 ? 'cash fare' : 'cash not matched'}</span></div>
      <div className="ifw-best"><b>{award ? 'View all paths' : 'Cash'}</b><span>{award ? 'every wallet card' : 'retain points'}</span></div>
    </button>
  )
}

function GlobalDecisionPanel({ row }: { row: FusionRow | null }) {
  if (!row) return <aside className="ifw-panel empty"><div><b>Select an option</b><p>Inventory stays visible whether or not CreditIQ can price a redemption path.</p></div></aside>

  const award = row.award
  // Legacy estimated transfer rows are retained only inside the Concierge request
  // snapshot until the v3.1 execution engine consumes the new rail registry.
  const options = award ? rankWalletOptions(row.redemption) : []
  const best = row.bestOption
  const taxes = nativeTaxes(award?.trip ?? null)
  const request = buildFlightConciergeRequest(row, options, best)

  if (!award) {
    return (
      <aside className="ifw-panel">
        <div className="ifw-panel-head"><span>Cash-only itinerary</span><h2>{row.airline || 'Cash flight'} · ₹{row.price.toLocaleString('en-IN')}</h2><p>No award match was returned for this itinerary. CreditIQ keeps it visible instead of deleting it from the search.</p></div>
        <div className="ifw-cash-compare"><div className="ifw-section-label">Decision</div><div className="ifw-cash-row"><span>Pay cash and retain all wallet points</span><b>₹{row.price.toLocaleString('en-IN')}</b></div></div>
        <WalletRailMatrix travelKind="flight" programmeId={null} />
        <div className="ifw-actions">{row.bookingLink ? <a href={row.bookingLink} target="_blank" rel="noopener noreferrer">Check fare directly →</a> : <span /> }<ConciergeRequestButton request={request} /></div>
        <div className="ifw-source-note">No loyalty transfer recommendation is manufactured when no award programme is matched. Generic portal/voucher/native rails can still be shown.</div>
      </aside>
    )
  }

  const programmeId = programmeIdForFlightSource(award.source)

  return (
    <aside className="ifw-panel">
      <div className="ifw-panel-head"><span>Award opportunity</span><h2>{award.program}</h2><p>CreditIQ now enumerates every sourced redemption rail from every card in your wallet. A card remains visible even when it has no verified path into this programme.</p><div className="ifw-award-cost"><b>{award.mileageCost.toLocaleString('en-IN')} {award.program} miles</b><span>{taxes ? `+ ${taxes} taxes` : 'taxes not supplied'}</span></div></div>
      <WalletRailMatrix travelKind="flight" programmeId={programmeId} />
      <div className="ifw-cash-compare"><div className="ifw-section-label">Cash comparison</div>{row.price > 0 ? <div className="ifw-cash-row"><span>Matched cash fare</span><b>₹{row.price.toLocaleString('en-IN')}</b></div> : <p className="ifw-muted">No matched cash fare was returned. CreditIQ does not invent one.</p>}</div>
      <div className="ifw-guardrail"><b>Guardrail:</b> the rail matrix enumerates sourced possibilities; v3.1 financial arithmetic and direct checkout remain the authority before an irreversible transfer.</div>
      <div className="ifw-actions"><a href={`https://www.google.com/search?q=${encodeURIComponent(award.program + ' award booking')}`} target="_blank" rel="noopener noreferrer">Check award directly →</a><ConciergeRequestButton request={request} /></div>
    </aside>
  )
}

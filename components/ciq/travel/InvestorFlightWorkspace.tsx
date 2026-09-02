'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { authedFetch } from '@/lib/authed-fetch'
import { AirportSelect } from '@/components/ciq/fly-points/AirportSelect'
import { labelFor, resolveCity } from '@/lib/data/airports'
import type { RedemptionOption } from '@/lib/fusion-core'
import { rankWalletOptions, sameWalletOption, walletOptionReason } from './flight-wallet-comparison'
import '@/components/ciq/fly-points/fly-points.css'
import './investor-flight-workspace.css'

type BandCabin = 'economy' | 'business'

type AwardView = {
  program: string
  mileageCost: number
  economyMiles: number
  businessMiles: number
  seats: number
  source: string
  isDirect: boolean
  date: string
  cabin: string
  trip: {
    flightNumbers?: string
    carriers?: string
    aircraft?: string
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
}

function bookingUrl(source: string, programme: string): string {
  return BOOKING_LANDING[source] || `https://www.google.com/search?q=${encodeURIComponent(programme + ' award booking')}`
}

function isoPlusDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function fmtDate(iso: string): string {
  const d = new Date((iso || '').length > 10 ? iso : `${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function fmtTime(iso: string): string {
  if (!iso || !iso.includes('T')) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtDuration(mins: number): string {
  if (!(mins > 0)) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

function fmtStops(stops: number): string {
  if (stops < 0) return 'stops unknown'
  return stops === 0 ? 'non-stop' : `${stops} stop${stops === 1 ? '' : 's'}`
}

function nativeTaxes(trip: AwardView['trip']): string | null {
  if (!trip || !(trip.totalTaxes > 0)) return null
  const amount = Math.round(trip.totalTaxes / 100)
  if (trip.taxesCurrency === 'INR') return `₹${amount.toLocaleString('en-IN')}`
  return `${trip.taxesCurrency} ${amount.toLocaleString('en-IN')}`
}

function rowReachable(row: FusionRow): boolean {
  return row.redemption.some((o) => o.status === 'ok')
}

export function InvestorFlightWorkspace() {
  const params = useSearchParams()
  const qTo = resolveCity(params.get('q') || '') || ''

  const [from, setFrom] = useState('BLR')
  const [to, setTo] = useState(qTo)
  const [date, setDate] = useState(isoPlusDays(21))
  const [cabin, setCabin] = useState<BandCabin>('business')
  const [nonStop, setNonStop] = useState(false)
  const [cardsScope, setCardsScope] = useState<'mine' | 'all'>('mine')
  const [rows, setRows] = useState<FusionRow[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const search = async () => {
    if (!from || !to || from === to) return
    setLoading(true)
    setError('')
    setRows(null)
    setSelectedId(null)

    try {
      const res = await authedFetch('/api/flights/fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          date_from: date,
          date_to: date,
          cabin,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'search failed')

      const awardRows = ((data.flights || []) as FusionRow[]).filter((row) => row.award)
      setRows(awardRows)
    } catch {
      setError('Couldn’t reach the award search just now — try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (!rows) return []
    return rows.filter((row) => {
      if (nonStop) {
        const stops = row.award?.trip?.stops ?? (row.award?.isDirect ? 0 : row.stops)
        if (stops !== 0) return false
      }
      if (cardsScope === 'mine' && !rowReachable(row)) return false
      return true
    })
  }, [rows, nonStop, cardsScope])

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !filtered.some((row) => row.id === selectedId)) setSelectedId(filtered[0].id)
  }, [filtered, selectedId])

  const selected = filtered.find((row) => row.id === selectedId) ?? null

  return (
    <div className="ifw-root">
      <div className="ifw-title-row">
        <div>
          <h1 className="ifw-title">Search once. See the best wallet path.</h1>
          <p className="ifw-sub">
            Award inventory on the left. Every supported card in your wallet compared on the right.
            Unsupported or incomplete cards stay visible instead of disappearing.
          </p>
        </div>
        <div className="ifw-honesty">All transfer options are source-status aware</div>
      </div>

      <div className="fp-search ifw-search">
        <AirportSelect label="From" value={from} exclude={to} onChange={setFrom} />
        <button className="fp-swap" title="Swap" aria-label="Swap airports" onClick={() => { setFrom(to); setTo(from) }}>⇄</button>
        <AirportSelect label="To" value={to} exclude={from} onChange={setTo} />
        <div className="fp-fld">
          <label className="fp-fld-label" htmlFor="ifw-date">Date</label>
          <input id="ifw-date" type="date" className="fp-fld-val fp-mono" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="fp-fld">
          <label className="fp-fld-label" htmlFor="ifw-cabin">Cabin</label>
          <select id="ifw-cabin" className="fp-fld-val" value={cabin} onChange={(e) => setCabin(e.target.value as BandCabin)}>
            <option value="business">Business</option>
            <option value="economy">Economy</option>
          </select>
        </div>
        <button className="fp-btn" onClick={search} disabled={loading || !from || !to || from === to}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {loading && <div className="fp-loading" role="status">Searching live award inventory for {from} → {to}…</div>}
      {error && !loading && <div className="fp-error ifw-error">{error}</div>}

      {rows && !loading && (
        <div className="ifw-workspace">
          <div className="ifw-left">
            <div className="ifw-toolbar">
              <div>
                <strong>{filtered.length} option{filtered.length === 1 ? '' : 's'}</strong>
                <span>{labelFor(from)} → {labelFor(to)} · {fmtDate(date)} · {cabin}</span>
              </div>
              <div className="ifw-filters" role="group" aria-label="Flight result filters">
                <button aria-pressed={cardsScope === 'mine'} onClick={() => setCardsScope('mine')}>Bookable with my cards</button>
                <button aria-pressed={cardsScope === 'all'} onClick={() => setCardsScope('all')}>All award seats</button>
                <button aria-pressed={nonStop} onClick={() => setNonStop((v) => !v)}>Non-stop</button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="ifw-empty">
                {rows.length === 0
                  ? 'No award seats found for this route and date.'
                  : cardsScope === 'mine'
                    ? <>Award seats exist, but none have a known route from the cards in your wallet. <button onClick={() => setCardsScope('all')}>Show all award seats</button>.</>
                    : 'No result matches the current filters.'}
              </div>
            ) : (
              <div className="ifw-list" role="listbox" aria-label="Award flight options">
                {filtered.map((row) => (
                  <FlightResultRow
                    key={row.id}
                    row={row}
                    active={row.id === selectedId}
                    onSelect={() => setSelectedId(row.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <FlightDecisionPanel row={selected} />
        </div>
      )}
    </div>
  )
}

function FlightResultRow({ row, active, onSelect }: { row: FusionRow; active: boolean; onSelect: () => void }) {
  const award = row.award!
  const trip = award.trip
  const stops = trip?.stops ?? (award.isDirect ? 0 : row.stops)
  const best = row.bestOption
  const taxes = nativeTaxes(trip)

  return (
    <button
      className={`ifw-row${active ? ' active' : ''}`}
      onClick={onSelect}
      role="option"
      aria-selected={active}
    >
      <div className="ifw-date">
        <b>{fmtDate(award.date || row.departure)}</b>
        <span>{fmtTime(trip?.departsAt || row.departure) || 'time n/a'}</span>
      </div>
      <div className="ifw-programme">
        <b>{award.program}</b>
        <span>{row.from} → {row.to} · {fmtDuration(trip?.durationMinutes || row.duration * 60)} · {fmtStops(stops)}</span>
        <small>{award.source ? 'Award source available' : 'Award source unknown'}</small>
      </div>
      <div className="ifw-metric">
        <b>{award.mileageCost.toLocaleString('en-IN')}</b>
        <span>{award.program} miles</span>
        {taxes && <small>+ {taxes} taxes</small>}
      </div>
      <div className="ifw-metric">
        <b>{row.price > 0 ? `₹${row.price.toLocaleString('en-IN')}` : '—'}</b>
        <span>{row.price > 0 ? 'cash fare' : 'cash not matched'}</span>
      </div>
      <div className="ifw-best">
        <b>{best ? best.cardName : 'No route'}</b>
        <span>{best?.cardPointsNeeded != null ? `${best.cardPointsNeeded.toLocaleString('en-IN')} card pts` : 'not priced'}</span>
      </div>
    </button>
  )
}

function FlightDecisionPanel({ row }: { row: FusionRow | null }) {
  if (!row || !row.award) {
    return (
      <aside className="ifw-panel empty">
        <div>
          <b>Select a flight</b>
          <p>CreditIQ will compare every card returned by your wallet for that award programme.</p>
        </div>
      </aside>
    )
  }

  const award = row.award
  const options = rankWalletOptions(row.redemption)
  const best = row.bestOption
  const taxes = nativeTaxes(award.trip)
  const supportedCount = options.filter((o) => o.status === 'ok').length

  return (
    <aside className="ifw-panel">
      <div className="ifw-panel-head">
        <span>Best wallet transfer path</span>
        <h2>{best ? `${best.cardName} → ${award.program}` : `No known wallet route → ${award.program}`}</h2>
        <p>
          Compared across {options.length} card{options.length === 1 ? '' : 's'} in this wallet.
          {supportedCount < options.length ? ` ${options.length - supportedCount} card${options.length - supportedCount === 1 ? '' : 's'} need mapping or have no known route.` : ''}
        </p>
        <div className="ifw-award-cost">
          <b>{award.mileageCost.toLocaleString('en-IN')} {award.program} miles</b>
          <span>{taxes ? `+ ${taxes} taxes` : 'taxes not supplied'}</span>
        </div>
      </div>

      <div className="ifw-compare">
        <div className="ifw-section-label">Compared across your cards</div>
        {options.length === 0 ? (
          <p className="ifw-muted">No cards were returned by the wallet for this search.</p>
        ) : options.map((option) => {
          const isBest = sameWalletOption(option, best)
          return (
            <div key={`${option.bank}|${option.cardName}`} className={`ifw-card-option${isBest ? ' winner' : ''}`}>
              <div>
                <b>{option.cardName}</b>
                <span>{option.bank}</span>
                <small>{walletOptionReason(option, award.programme ?? award.program)}</small>
              </div>
              <div className="ifw-option-right">
                {option.status === 'ok' && option.cardPointsNeeded != null ? (
                  <>
                    <b>{option.cardPointsNeeded.toLocaleString('en-IN')}</b>
                    <span>card points</span>
                    <small>{option.selfEntered ? 'Self-entered balance' : 'Wallet balance'}</small>
                  </>
                ) : (
                  <>
                    <b>—</b>
                    <span>{option.status === 'currency-unknown' ? 'not mapped' : 'no route'}</span>
                  </>
                )}
              </div>
              {isBest && <em>Best current route</em>}
            </div>
          )
        })}
      </div>

      <div className="ifw-cash-compare">
        <div className="ifw-section-label">Cash comparison</div>
        {row.price > 0 ? (
          <div className="ifw-cash-row"><span>Same search cash fare</span><b>₹{row.price.toLocaleString('en-IN')}</b></div>
        ) : (
          <p className="ifw-muted">No matched cash fare was returned for this award row. CreditIQ is not inventing one.</p>
        )}
        <p className="ifw-muted">Bank-portal comparison is not yet part of the current flight fusion engine, so this panel does not fabricate a portal winner.</p>
      </div>

      <div className="ifw-steps">
        <div className="ifw-section-label">What happens next</div>
        <DecisionStep n="1" title="Reconfirm the exact award seat" text="Check the same flight, date and cabin again before any points move." />
        <DecisionStep n="2" title="Use the best reachable card route" text={best?.cardPointsNeeded != null ? `Current routing estimate: ${best.cardPointsNeeded.toLocaleString('en-IN')} ${best.cardName} points.` : 'No safe transfer amount is available from this wallet yet.'} />
        <DecisionStep n="3" title="Verify transfer terms before an irreversible move" text="The current fusion API marks every transfer candidate verified:false. CreditIQ must source ratio, minimum, increment and timing before presenting an irreversible exact instruction." />
        <DecisionStep n="4" title="Book and reconcile" text="After booking, record the bank points moved, programme miles spent and cash/taxes actually paid." />
      </div>

      <div className="ifw-guardrail">
        <b>Guardrail:</b> foreign-currency award taxes are shown in their native currency here. The previous manual USD→INR convenience conversion is deliberately not used in this workspace.
      </div>

      <div className="ifw-actions">
        <a href={bookingUrl(award.source, award.program)} target="_blank" rel="noopener noreferrer">Check award directly →</a>
        <button disabled title="Concierge case creation is the next build slice">Concierge booking — next build</button>
      </div>

      <div className="ifw-source-note">
        Wallet comparison is card-agnostic: any Indian credit card returned by the wallet is evaluated. Cards without mapped redemption rules remain visible as “not mapped” or “no route” rather than disappearing.
      </div>
    </aside>
  )
}

function DecisionStep({ n, title, text }: { n: string; title: string; text: string }) {
  return (
    <div className="ifw-step">
      <div>{n}</div>
      <p><b>{title}</b><span>{text}</span></p>
    </div>
  )
}

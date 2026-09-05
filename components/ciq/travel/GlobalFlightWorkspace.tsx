'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ChevronDown, PlaneTakeoff } from 'lucide-react'
import { authedFetch } from '@/lib/authed-fetch'
import { AirportSelect } from '@/components/ciq/fly-points/AirportSelect'
import { labelFor, resolveCity } from '@/lib/data/airports'
import type { RedemptionOption } from '@/lib/fusion-core'
import { rankWalletOptions } from '@/components/ciq/travel/flight-wallet-comparison'
import { ConciergeRequestButton } from '@/components/ciq/concierge/ConciergeRequestButton'
import { buildFlightConciergeRequest } from '@/components/ciq/concierge/travel-requests'
import { buildFlightSelfServePlan } from '@/lib/travel/flight-redemption-plan'
import '@/components/ciq/fly-points/fly-points.css'

type Cabin = 'economy' | 'business'
type DetailTab = 'compare' | 'book' | 'sources'

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

const SEARCH_STAGES = [
  ['Searching available flights', 'Checking cash and award inventory for the selected route…'],
  ['Checking award programmes', 'Comparing connected loyalty programmes and cabin pricing…'],
  ['Comparing your wallet', 'Testing mapped card-to-programme transfer paths against your balances…'],
  ['Building redemption paths', 'Preparing self-serve steps and the Concierge handoff snapshot…'],
] as const

function isoPlusDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function asDate(iso: string) {
  const value = (iso || '').length > 10 ? iso : `${iso}T00:00:00`
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function fmtDate(iso: string) {
  const d = asDate(iso)
  return d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : iso
}

function fmtWeekday(iso: string) {
  const d = asDate(iso)
  return d ? d.toLocaleDateString('en-GB', { weekday: 'short' }) : ''
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
  return row.redemption.some(option => option.status === 'ok')
}

function programmeMark(name: string) {
  const parts = name.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'CI'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function GlobalFlightWorkspace() {
  const params = useSearchParams()
  const qTo = resolveCity(params.get('q') || '') || ''
  const [from, setFrom] = useState('BLR')
  const [to, setTo] = useState(qTo)
  const [date, setDate] = useState(isoPlusDays(21))
  const [flexDays, setFlexDays] = useState<0 | 3 | 7>(0)
  const [cabin, setCabin] = useState<Cabin>('business')
  const [scope, setScope] = useState<'all' | 'mine'>('all')
  const [nonStop, setNonStop] = useState(false)
  const [rows, setRows] = useState<FusionRow[] | null>(null)
  const [counts, setCounts] = useState<FusionCounts | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('compare')
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading) {
      setLoadingStage(0)
      return
    }
    const timer = window.setInterval(() => {
      setLoadingStage(current => Math.min(current + 1, SEARCH_STAGES.length - 1))
    }, 900)
    return () => window.clearInterval(timer)
  }, [loading])

  async function search(destination = to) {
    if (!from || !destination || from === destination) return
    if (destination !== to) setTo(destination)
    setLoading(true)
    setLoadingStage(0)
    setError('')
    setRows(null)
    setCounts(null)
    setSelectedId(null)
    setDetailTab('compare')

    try {
      const res = await authedFetch('/api/flights/fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to: destination,
          date_from: shiftDate(date, -flexDays),
          date_to: shiftDate(date, flexDays),
          cash_date: date,
          cabin,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'search failed')
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
    return rows.filter(row => {
      const stops = row.award?.trip?.stops ?? (row.award?.isDirect ? 0 : row.stops)
      if (nonStop && stops !== 0) return false
      if (scope === 'mine' && !rowReachable(row)) return false
      return true
    })
  }, [rows, scope, nonStop])

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId(null)
      return
    }
    if (selectedId && !filtered.some(row => row.id === selectedId)) setSelectedId(null)
  }, [filtered, selectedId])

  const loadingCopy = SEARCH_STAGES[loadingStage]

  return (
    <div className="approved-flight-workspace">
      <section className="approved-flight-search" aria-label="Search flight awards">
        <AirportSelect label="From" value={from} exclude={to} onChange={setFrom} />
        <button className="fp-swap" type="button" title="Swap" aria-label="Swap airports" onClick={() => { setFrom(to); setTo(from) }}>⇄</button>
        <AirportSelect label="To" value={to} exclude={from} onChange={setTo} />
        <div className="fp-fld"><label className="fp-fld-label" htmlFor="approved-global-date">Date</label><input id="approved-global-date" type="date" className="fp-fld-val fp-mono" value={date} onChange={event => setDate(event.target.value)} /></div>
        <div className="fp-fld"><label className="fp-fld-label" htmlFor="approved-global-flex">Dates</label><select id="approved-global-flex" className="fp-fld-val" value={flexDays} onChange={event => setFlexDays(Number(event.target.value) as 0 | 3 | 7)}><option value={0}>Exact</option><option value={3}>±3 days</option><option value={7}>±7 days</option></select></div>
        <div className="fp-fld"><label className="fp-fld-label" htmlFor="approved-global-cabin">Cabin</label><select id="approved-global-cabin" className="fp-fld-val" value={cabin} onChange={event => setCabin(event.target.value as Cabin)}><option value="business">Business</option><option value="economy">Economy</option></select></div>
        <button className="fp-btn" type="button" onClick={() => void search()} disabled={loading || !from || !to || from === to}>{loading ? 'Searching…' : 'Search awards'}</button>
      </section>

      {loading && (
        <div className="approved-flight-loader approved-flight-loader-rich" role="status" aria-live="polite">
          <div className="approved-flight-animation" aria-hidden="true">
            <span className="approved-flight-airport start"><b>{from}</b><small>{labelFor(from).replace(/\s*\([^)]*\)$/, '')}</small></span>
            <div className="approved-flight-arc"><i /></div>
            <span className="approved-flight-moving-plane"><PlaneTakeoff size={24} /></span>
            <span className="approved-flight-airport end"><b>{to}</b><small>{labelFor(to).replace(/\s*\([^)]*\)$/, '')}</small></span>
          </div>
          <strong>{loadingCopy[0]}</strong>
          <p>{loadingCopy[1]}</p>
          <div className="approved-search-stage-dots" aria-hidden="true">
            {SEARCH_STAGES.map((_, index) => <i key={index} className={index <= loadingStage ? 'active' : undefined} />)}
          </div>
        </div>
      )}

      {error && !loading && <div className="approved-flight-empty" role="alert">{error}</div>}

      {!rows && !loading && !error && (
        <div className="approved-flight-empty">
          <b>{to ? `Ready to search ${from} → ${to}` : 'Choose a destination to start.'}</b><br />
          Search once, then open any result to compare points, cash and the safe booking path.
        </div>
      )}

      {rows && !loading && (
        <>
          <div className="approved-flight-toolbar">
            <div>
              <b>{filtered.length} award options</b>
              <span>{labelFor(from)} → {labelFor(to)} · {fmtDate(date)}{flexDays ? ` ±${flexDays} days` : ''} · {cabin}{counts ? ` · ${counts.cashFlights} target-date cash rows · ${counts.awards} award records` : ''}</span>
            </div>
            <div className="approved-flight-filters" role="group" aria-label="Flight result filters">
              <button type="button" aria-pressed={scope === 'all'} onClick={() => setScope('all')}>All options</button>
              <button type="button" aria-pressed={scope === 'mine'} onClick={() => setScope('mine')}>My wallet</button>
              <button type="button" aria-pressed={nonStop} onClick={() => setNonStop(value => !value)}>Non-stop</button>
            </div>
          </div>
          <div className="approved-flight-note">Award discovery covers the selected flexible window. Cash remains a benchmark for the exact target date. Open a result before transferring points; CreditIQ keeps live verification and irreversible-transfer warnings in the decision flow.</div>

          <section className="approved-award-list" aria-label="Flight award results">
            <div className="approved-award-head"><span>Date</span><span>Programme & route</span><span>Economy</span><span>Business</span><span>Best wallet path</span><span /></div>
            {filtered.length === 0 ? (
              <div className="approved-flight-empty">No loaded option matches this filter.</div>
            ) : filtered.map(row => {
              const award = row.award
              const trip = award?.trip ?? null
              const stops = trip?.stops ?? (award?.isDirect ? 0 : row.stops)
              const active = selectedId === row.id
              const reachable = rowReachable(row)
              const taxes = nativeTaxes(trip)
              const programme = award?.program || row.airline || 'Cash itinerary'
              const depart = fmtTime(trip?.departsAt || row.departure)
              const arrive = fmtTime(trip?.arrivesAt || row.arrival)
              const duration = fmtDuration(trip?.durationMinutes || row.duration * 60)
              const economyMiles = award && cabin === 'economy' ? award.mileageCost.toLocaleString('en-IN') : '—'
              const businessMiles = award && cabin === 'business' ? award.mileageCost.toLocaleString('en-IN') : '—'
              const rankedOptions = rankWalletOptions(row.redemption)
              const selectedWalletOption = row.bestOption ?? rankedOptions.find(option => option.status === 'ok') ?? null
              const selfServe = buildFlightSelfServePlan({
                award: award ? { source: award.source, program: award.program, mileageCost: award.mileageCost } : null,
                option: selectedWalletOption,
                taxesLabel: taxes,
              })
              const conciergeRequest = buildFlightConciergeRequest(row, rankedOptions, selectedWalletOption)

              return (
                <article className={`approved-award-item${active ? ' open' : ''}`} key={row.id}>
                  <button
                    type="button"
                    className="approved-award-row"
                    aria-expanded={active}
                    onClick={() => {
                      setSelectedId(current => current === row.id ? null : row.id)
                      setDetailTab('compare')
                    }}
                  >
                    <span><b>{fmtDate(award?.date || row.departure)}</b><small>{fmtWeekday(award?.date || row.departure)} {depart}</small></span>
                    <span className="approved-award-programme"><i className="approved-airline-logo">{programmeMark(programme)}</i><span><b>{programme}</b><small>{row.from} {depart || ''} → {row.to} {arrive || ''} · {duration} · {fmtStops(stops)}</small></span></span>
                    <span><b>{economyMiles}</b><small>{economyMiles === '—' ? 'not searched' : 'miles'}</small></span>
                    <span><b>{businessMiles}</b><small>{businessMiles === '—' ? 'not searched' : 'miles'}</small></span>
                    <span className="approved-wallet-path"><b>{award ? (selfServe.executable ? 'Ready to verify' : reachable ? 'Wallet route' : 'Verify route') : 'Cash'}</b><small>{award ? (selfServe.pointsNeeded ? `${selfServe.pointsNeeded.toLocaleString('en-IN')} card pts` : 'needs verification') : (row.price > 0 ? `₹${row.price.toLocaleString('en-IN')}` : 'fare unavailable')}</small></span>
                    <ChevronDown className="approved-row-chevron" size={16} />
                  </button>

                  {active && (
                    <div className="approved-award-detail">
                      <div className="approved-decision-hero">
                        <div><span className="approved-section-kicker">CreditIQ recommendation</span><h3>{award ? `Verify ${programme}, then choose self-serve or Concierge` : 'Pay cash or send the itinerary to Concierge'}</h3><p>{award ? 'Both execution paths use the same bounded itinerary and wallet snapshot.' : 'No award match was returned for this itinerary.'}</p></div>
                        <div><small>Award price</small><b>{award ? `${award.mileageCost.toLocaleString('en-IN')} miles` : 'No award'}</b></div>
                        <div><small>Card points</small><b>{selfServe.pointsNeeded ? selfServe.pointsNeeded.toLocaleString('en-IN') : 'Not mapped'}</b></div>
                        <div><small>Status</small><b>{selfServe.executable ? 'Self-serve ready' : award ? 'Verify / Concierge' : 'Cash only'}</b></div>
                      </div>

                      <div className="approved-decision-tabs" role="tablist">
                        <button type="button" className={detailTab === 'compare' ? 'active' : undefined} onClick={() => setDetailTab('compare')}>Points vs cash</button>
                        <button type="button" className={detailTab === 'book' ? 'active' : undefined} onClick={() => setDetailTab('book')}>Redemption path</button>
                        <button type="button" className={detailTab === 'sources' ? 'active' : undefined} onClick={() => setDetailTab('sources')}>Source & safety</button>
                      </div>

                      <div className="approved-decision-panel">
                        {detailTab === 'compare' && (
                          <div className="approved-path-grid">
                            <article className={`approved-path-choice${award && selfServe.executable ? ' winner' : ''}`}><span>{award && selfServe.executable ? 'Mapped self-serve route' : 'Award route'}</span><b>{award ? programme : 'No award match'}</b><strong>{selfServe.pointsNeeded ? `${selfServe.pointsNeeded.toLocaleString('en-IN')} card pts` : award ? `${award.mileageCost.toLocaleString('en-IN')} miles` : 'Unavailable'}</strong><small>{selfServe.ratioLabel ? `Ratio ${selfServe.ratioLabel} · ${selfServe.durationLabel}` : taxes ? `Cached taxes ${taxes}` : 'Verify programme terms'}</small></article>
                            <article className={`approved-path-choice${!award && row.price > 0 ? ' winner' : ''}`}><span>Cash alternative</span><b>Pay airline directly</b><strong>{row.price > 0 ? `₹${row.price.toLocaleString('en-IN')}` : 'Fare unavailable'}</strong><small>{row.price > 0 ? 'Keep all reward points' : 'No live cash number returned'}</small></article>
                            <article className="approved-path-choice"><span>Keep your points</span><b>Wait for a better option</b><strong>0 points</strong><small>Useful when award availability or transfer timing is uncertain.</small></article>
                          </div>
                        )}

                        {detailTab === 'book' && (
                          <div className="approved-execution-split">
                            <article className="approved-execution-card self-serve">
                              <span className="approved-section-kicker">Individual · do it yourself</span>
                              <h3>Clear redemption path</h3>
                              {selfServe.reason && <div className="approved-path-reason">{selfServe.reason}</div>}
                              {selfServe.steps.length > 0 ? (
                                <ol className="approved-self-serve-steps">
                                  {selfServe.steps.map(step => <li key={step.title}><b>{step.title}</b><span>{step.detail}</span></li>)}
                                </ol>
                              ) : (
                                <p className="approved-execution-copy">This result does not yet have a safe mapped transfer instruction. Do not manufacture a ratio; use cash or Concierge.</p>
                              )}

                              {award && selfServe.pointsNeeded && (
                                <div className="approved-transfer-facts">
                                  <div><small>Card</small><b>{selfServe.cardLabel}</b></div>
                                  <div><small>Transfer</small><b>{selfServe.pointsNeeded.toLocaleString('en-IN')} pts</b></div>
                                  <div><small>Ratio</small><b>{selfServe.ratioLabel || 'Verify'}</b></div>
                                  <div><small>Timing</small><b>{selfServe.durationLabel || 'Verify'}</b></div>
                                </div>
                              )}

                              <div className="approved-execution-actions">
                                {selfServe.programmeUrl && <a className="approved-primary" href={selfServe.programmeUrl} target="_blank" rel="noopener noreferrer">Open {programme} ↗</a>}
                                {!award && row.bookingLink && <a className="approved-primary" href={row.bookingLink} target="_blank" rel="noopener noreferrer">Open cash booking ↗</a>}
                              </div>
                              <div className="approved-transfer-warning"><b>Important:</b> {selfServe.warning}</div>
                            </article>

                            <article className="approved-execution-card concierge-path">
                              <span className="approved-section-kicker">Corporate / HNI · assisted</span>
                              <h3>Pass it to CreditIQ Concierge</h3>
                              <p className="approved-execution-copy">We pass the selected flight, award source, wallet candidates and cash/tax snapshot into a Concierge case. The operator re-verifies the live seat, transfer facts and final price before asking for approval.</p>
                              <div className="approved-concierge-checklist">
                                <span>✓ Re-check live award availability</span>
                                <span>✓ Verify transfer ratio and timing</span>
                                <span>✓ Prepare the final booking option</span>
                                <span>✓ No irreversible transfer without approval</span>
                              </div>
                              <div className="approved-concierge-path">
                                <ConciergeRequestButton request={conciergeRequest} label="Pass to CreditIQ Concierge" />
                              </div>
                              <small className="approved-concierge-note">Designed for corporate travel desks and users who want CreditIQ to manage the verification workflow.</small>
                            </article>
                          </div>
                        )}

                        {detailTab === 'sources' && (
                          <div className="approved-source-grid">
                            <article><b>Award price</b><p>{award ? `Discovery source: ${award.source}. Treat as guidance until the selected programme is verified.` : 'No award source matched this cash itinerary.'}</p></article>
                            <article><b>Wallet path</b><p>{award ? (selfServe.pointsNeeded ? `Mapped card requirement: ${selfServe.pointsNeeded.toLocaleString('en-IN')} points${selfServe.ratioLabel ? ` at ${selfServe.ratioLabel}` : ''}. Transfer state: ${selfServe.transferState || 'unverified'}${selfServe.transferAsOf ? ` as of ${selfServe.transferAsOf}` : ''}.` : 'No safe mapped wallet route is promoted.') : 'Keeping points is the default when only cash inventory is available.'}</p></article>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              )
            })}
          </section>
        </>
      )}
    </div>
  )
}

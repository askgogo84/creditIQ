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
import type { TravelDecisionContract } from '@/lib/travel/decision-contract'
import type { SearchRedemptionOption } from '@/lib/travel/search-redemption-summary'
import '@/components/ciq/fly-points/fly-points.css'

type SearchCabin = 'economy' | 'business'
type CabinFilter = 'any' | SearchCabin
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
  awardEvidenceProvider?: string | null
  redemption: RedemptionOption[]
  bestOption: RedemptionOption | null
  decision?: TravelDecisionContract
  searchCabin?: SearchCabin
}

type FusionCounts = {
  cashFlights: number
  awards: number
  awardsEnriched: number
  awardOnlyCards: number
  cards: number
}

type AwardAttempt = {
  source?: string
  state?: string
  freshness?: string | null
}

type AwardMeta = {
  authority: string
  searchMode: string
  reason: string
  attempts: AwardAttempt[]
}

type DecisionExecutionPlan = {
  id: string
  label: string
  amount: string
  state: string
  steps: string[]
  bookingUrl: string | null
  warning: string
}

const SEARCH_STAGES = [
  ['Searching available flights', 'Checking cash and award inventory for the selected route…'],
  ['Checking award programmes', 'Comparing connected loyalty programmes and cabin pricing…'],
  ['Comparing your wallet', 'Testing mapped card and programme paths against your balances…'],
  ['Building redemption paths', 'Preparing exact self-serve steps and the Concierge handoff snapshot…'],
] as const

function isoPlusDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
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

function moneyMinor(value: number | null | undefined, currency: string | null | undefined) {
  if (value == null || !currency) return null
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value / 100)
  } catch {
    return `${currency} ${Math.round(value / 100).toLocaleString('en-IN')}`
  }
}

function nativeTaxes(trip: AwardView['trip']) {
  if (!trip || !(trip.totalTaxes > 0)) return null
  const amount = Math.round(trip.totalTaxes / 100)
  return trip.taxesCurrency === 'INR' ? `₹${amount.toLocaleString('en-IN')}` : `${trip.taxesCurrency} ${amount.toLocaleString('en-IN')}`
}

function programmeMark(name: string) {
  const parts = name.replace(/[^A-Za-z0-9 ]/g, ' ').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'CI'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function authorityLabel(authority: string | null | undefined) {
  if (authority === 'DATE_SPECIFIC_LIVE') return 'Date-specific live award evidence'
  if (authority === 'CACHED_DISCOVERY') return 'Cached discovery only · seat not verified'
  if (authority === 'PUBLISHED_GUIDE_DISCOVERY') return 'Published award guide · seat not verified'
  if (authority === 'DIRECT_ONLY') return 'Direct programme verification required'
  if (authority === 'MIXED') return 'Mixed award evidence · inspect each option'
  return 'No award pricing authority established'
}

function evidenceProviderLabel(provider: string | null | undefined) {
  if (provider === 'awardtool-realtime') return 'AwardTool Real-Time'
  if (provider?.startsWith('awardwallet')) return 'AwardWallet live search'
  if (provider === 'seats-aero-cached') return 'Seats.aero cached discovery'
  return provider || 'Award provider not labelled'
}

function cabinLabel(cabin: CabinFilter | SearchCabin) {
  if (cabin === 'any') return 'Any cabin'
  return cabin === 'business' ? 'Business' : 'Economy'
}

function cabinForRow(row: FusionRow): SearchCabin {
  if (row.searchCabin) return row.searchCabin
  return row.award?.cabin === 'business' ? 'business' : 'economy'
}

function cabinCost(row: FusionRow, rowCabin: SearchCabin, targetCabin: SearchCabin) {
  if (rowCabin !== targetCabin) return { value: '—', label: `see ${targetCabin} option` }
  if (row.award) {
    return {
      value: row.award.mileageCost.toLocaleString('en-IN'),
      label: row.price > 0 ? `miles · cash ₹${row.price.toLocaleString('en-IN')}` : 'award miles',
    }
  }
  if (row.price > 0) return { value: `₹${row.price.toLocaleString('en-IN')}`, label: 'cash fare' }
  return { value: '—', label: 'fare unavailable' }
}

function resultDate(row: FusionRow) {
  return (row.award?.date || row.departure || '').slice(0, 10)
}

function flightResultPriority(row: FusionRow, targetDate: string) {
  const isTargetDate = resultDate(row) === targetDate
  const hasLiveCash = row.price > 0 && !row.cashUnavailable
  if (isTargetDate && hasLiveCash) return 0
  if (isTargetDate) return 1
  if (hasLiveCash) return 2
  return 3
}

function rowStops(row: FusionRow) {
  return row.award?.trip?.stops ?? (row.award?.isDirect ? 0 : Math.max(0, row.stops))
}

function rowDurationMinutes(row: FusionRow) {
  const minutes = row.award?.trip?.durationMinutes ?? (row.duration > 0 ? row.duration * 60 : 0)
  return minutes > 0 ? minutes : Number.MAX_SAFE_INTEGER
}

function isExactAirportRow(row: FusionRow, from: string, to: string) {
  return String(row.from || '').toUpperCase() === from && String(row.to || '').toUpperCase() === to
}

function rowReachable(row: FusionRow) {
  const summary = row.decision?.searchSummary
  if (summary) return summary.alternatives.some(option => option.state === 'EXECUTABLE' || option.state === 'PROJECTED_NEEDS_VERIFICATION')
  return row.redemption.some(option => option.status === 'ok')
}

function optionAmount(option: SearchRedemptionOption) {
  const cash = moneyMinor(option.cashPayableMinor, option.cashCurrency)
  if (option.bankPointsRequired != null) return `${option.bankPointsRequired.toLocaleString('en-IN')} pts${cash ? ` + ${cash}` : ''}`
  return cash || 'Verify at checkout'
}

function buildDecisionExecutionPlan(row: FusionRow, option: SearchRedemptionOption): DecisionExecutionPlan {
  const decision = row.decision!
  const candidate = decision.wallet.ranking.candidates.find(item => item.id === option.id) ?? null
  const rail = candidate && candidate.railType !== 'CASH_RETAIN'
    ? decision.wallet.matrix.cards.flatMap(card => card.rails).find(item => item.id === candidate.railId) ?? null
    : null
  const bookingUrl = rail?.bookingUrl || (option.railType === 'CASH_RETAIN' ? row.bookingLink || null : null)
  const amount = optionAmount(option)
  const routeDate = fmtDate(resultDate(row))

  if (option.railType === 'CASH_RETAIN') {
    return {
      id: option.id,
      label: option.label,
      amount,
      state: option.isBestExecutable ? 'Best executable path' : 'Cash fallback',
      steps: [
        `Open the cash booking for ${row.from} → ${row.to} on ${routeDate}.`,
        `Confirm the final fare is still ${amount}.`,
        'Pay cash and keep all wallet points for a higher-value redemption.',
      ],
      bookingUrl,
      warning: 'Cash fares can move before checkout; re-check the final airline or portal price before payment.',
    }
  }

  if (option.railType === 'BANK_TRAVEL_PORTAL' || option.railType === 'MERCHANT_PAY_WITH_POINTS') {
    const portal = rail?.portal?.portalName || rail?.bookingDestination || option.label
    return {
      id: option.id,
      label: option.label,
      amount,
      state: option.isBestProjected ? 'Best projected path' : option.state.replaceAll('_', ' ').toLowerCase(),
      steps: [
        `Open ${portal}.`,
        `Search the exact ${row.from} → ${row.to} flight for ${routeDate} and match the same cabin.`,
        `Apply the shown wallet mix: ${amount}.`,
        'Re-check the live fare, portal cap, fees and final points/cash split at checkout before paying.',
      ],
      bookingUrl,
      warning: option.state === 'PROJECTED_NEEDS_VERIFICATION'
        ? 'This portal path is projected from sourced rules; checkout is the authority for the final points/cash mix.'
        : 'Confirm the final portal price before completing payment.',
    }
  }

  if (option.railType === 'LOYALTY_TRANSFER') {
    const transfer = rail?.transfer
    const programme = transfer?.programmeName || option.label.split('→').pop()?.trim() || 'loyalty programme'
    const awardPoints = decision.awardState.pointsRequired
    const ratio = transfer ? `${transfer.ratio.fromUnits}:${transfer.ratio.toUnits}` : 'verify current issuer ratio'
    const timing = transfer?.durationText || 'transfer time not fully sourced — verify before moving points'
    const discovery = decision.awardState.status === 'DISCOVERY_ONLY'
    return {
      id: option.id,
      label: option.label,
      amount,
      state: option.isBestProjected ? 'Best projected path' : option.state.replaceAll('_', ' ').toLowerCase(),
      steps: [
        discovery
          ? `First verify live ${programme} award space for the exact flight. The ${awardPoints ? `${awardPoints.toLocaleString('en-IN')}-point` : 'published'} figure is discovery guidance, not a confirmed seat.`
          : `Confirm the exact ${programme} award and current price${awardPoints ? ` of ${awardPoints.toLocaleString('en-IN')} points` : ''} before transferring anything.`,
        `Transfer ${option.bankPointsRequired != null ? option.bankPointsRequired.toLocaleString('en-IN') : 'the verified number of'} card points to ${programme}. Current mapped ratio: ${ratio}.`,
        `Allow for ${timing}. Do not assume the transfer is instant; re-check award space after the points arrive.`,
        `Book directly with ${programme} and pay the final taxes/fees shown at checkout.`,
      ],
      bookingUrl,
      warning: transfer?.irreversible === false
        ? 'Re-check the award before moving points and confirm all issuer terms.'
        : 'Points transfers can be irreversible. Do not transfer until the live seat, current award price, ratio and timing are verified.',
    }
  }

  return {
    id: option.id,
    label: option.label,
    amount,
    state: option.state.replaceAll('_', ' ').toLowerCase(),
    steps: [
      `Open the mapped redemption destination for ${option.label}.`,
      `Match the exact ${row.from} → ${row.to} itinerary for ${routeDate}.`,
      `Apply ${amount}.`,
      'Verify all live terms and the final payable amount before completing the booking.',
    ],
    bookingUrl,
    warning: option.reasons[0] || 'Verify the final redemption terms before committing points or cash.',
  }
}

export function GlobalFlightWorkspace() {
  const params = useSearchParams()
  const qTo = resolveCity(params.get('q') || '') || ''
  const [from, setFrom] = useState('BLR')
  const [to, setTo] = useState(qTo)
  const [date, setDate] = useState(isoPlusDays(7))
  const [flexDays, setFlexDays] = useState<0 | 3 | 7>(0)
  const [cabin, setCabin] = useState<CabinFilter>('any')
  const [scope, setScope] = useState<'all' | 'mine'>('all')
  const [nonStop, setNonStop] = useState(false)
  const [rows, setRows] = useState<FusionRow[] | null>(null)
  const [counts, setCounts] = useState<FusionCounts | null>(null)
  const [awardMeta, setAwardMeta] = useState<AwardMeta | null>(null)
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
    const timer = window.setInterval(() => setLoadingStage(current => Math.min(current + 1, SEARCH_STAGES.length - 1)), 900)
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
    setAwardMeta(null)
    setSelectedId(null)
    setDetailTab('compare')

    try {
      const cabinQueries: SearchCabin[] = cabin === 'any' ? ['economy', 'business'] : [cabin]
      const responses = await Promise.all(cabinQueries.map(async searchCabin => {
        const res = await authedFetch('/api/flights/fusion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from,
            to: destination,
            date_from: shiftDate(date, -flexDays),
            date_to: shiftDate(date, flexDays),
            cash_date: date,
            cabin: searchCabin,
          }),
        })
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error || `${searchCabin} search failed`)
        return { searchCabin, data }
      }))

      const combinedRows = responses
        .flatMap(({ searchCabin, data }) => ((data.flights || []) as FusionRow[]).map(row => ({ ...row, id: `${searchCabin}:${row.id}`, searchCabin })))
        .filter(row => isExactAirportRow(row, from, destination))
        .sort((a, b) => {
          const priority = flightResultPriority(a, date) - flightResultPriority(b, date)
          if (priority) return priority
          const stopPriority = rowStops(a) - rowStops(b)
          if (stopPriority) return stopPriority
          const durationPriority = rowDurationMinutes(a) - rowDurationMinutes(b)
          if (durationPriority) return durationPriority
          return resultDate(a).localeCompare(resultDate(b))
            || a.price - b.price
            || (a.departure || '').localeCompare(b.departure || '')
            || (a.airline || '').localeCompare(b.airline || '')
        })

      const combinedCounts = responses.reduce<FusionCounts>((sum, { data }) => ({
        cashFlights: sum.cashFlights + Number(data.counts?.cashFlights || 0),
        awards: sum.awards + Number(data.counts?.awards || 0),
        awardsEnriched: sum.awardsEnriched + Number(data.counts?.awardsEnriched || 0),
        awardOnlyCards: sum.awardOnlyCards + Number(data.counts?.awardOnlyCards || 0),
        cards: Math.max(sum.cards, Number(data.counts?.cards || 0)),
      }), { cashFlights: 0, awards: 0, awardsEnriched: 0, awardOnlyCards: 0, cards: 0 })

      const authorities = [...new Set(responses.map(({ data }) => String(data.awardPricingAuthority || 'NONE')))]
      const attempts = responses.flatMap(({ data }) => Array.isArray(data.awardAttempts) ? data.awardAttempts : []) as AwardAttempt[]
      setRows(combinedRows)
      setCounts(combinedCounts)
      setAwardMeta({
        authority: authorities.length === 1 ? authorities[0] : 'MIXED',
        searchMode: cabin === 'any' ? 'ANY_ECONOMY_BUSINESS' : String(responses[0]?.data.awardSearchMode || 'UNKNOWN'),
        reason: cabin === 'any'
          ? 'Economy and Business are priced separately. Identical flight times can appear once per cabin, and every row keeps its own returned fare and award evidence.'
          : String(responses[0]?.data.awardReason || ''),
        attempts,
      })
    } catch {
      setError('Couldn’t complete the provider search just now — try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    if (!rows) return []
    return rows.filter(row => {
      const stops = rowStops(row)
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
  const evidenceNote = awardMeta?.authority === 'DATE_SPECIFIC_LIVE'
    ? 'Award search returned date-specific live evidence. Direct programme checkout still remains the final verification before an irreversible transfer.'
    : awardMeta?.authority === 'CACHED_DISCOVERY'
      ? 'Award results are cached discovery only. They are useful for finding opportunities, but CreditIQ will not treat them as a confirmed seat or recommend an irreversible transfer without live verification.'
      : awardMeta?.reason || 'Open a result before transferring points; CreditIQ keeps provider authority and irreversible-transfer warnings in the decision flow.'

  return (
    <div className="approved-flight-workspace">
      <section className="approved-flight-search" aria-label="Search flight awards">
        <AirportSelect label="From" value={from} exclude={to} onChange={setFrom} />
        <button className="fp-swap" type="button" title="Swap" aria-label="Swap airports" onClick={() => { setFrom(to); setTo(from) }}>⇄</button>
        <AirportSelect label="To" value={to} exclude={from} onChange={setTo} />
        <div className="fp-fld"><label className="fp-fld-label" htmlFor="approved-global-date">Date</label><input id="approved-global-date" type="date" min={isoPlusDays(0)} className="fp-fld-val fp-mono" value={date} onChange={event => setDate(event.target.value)} /></div>
        <div className="fp-fld"><label className="fp-fld-label" htmlFor="approved-global-flex">Dates</label><select id="approved-global-flex" className="fp-fld-val" value={flexDays} onChange={event => setFlexDays(Number(event.target.value) as 0 | 3 | 7)}><option value={0}>Exact</option><option value={3}>±3 days</option><option value={7}>±7 days</option></select></div>
        <div className="fp-fld"><label className="fp-fld-label" htmlFor="approved-global-cabin">Cabin</label><select id="approved-global-cabin" className="fp-fld-val" value={cabin} onChange={event => setCabin(event.target.value as CabinFilter)}><option value="any">Any cabin</option><option value="economy">Economy</option><option value="business">Business</option></select></div>
        <button className="fp-btn" type="button" onClick={() => void search()} disabled={loading || !from || !to || from === to}>{loading ? 'Searching…' : 'Search flights'}</button>
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
          <p>{cabin === 'any' && loadingStage === 0 ? 'Checking Economy and Business cash and award inventory for the selected route…' : loadingCopy[1]}</p>
          <div className="approved-search-stage-dots" aria-hidden="true">{SEARCH_STAGES.map((_, index) => <i key={index} className={index <= loadingStage ? 'active' : undefined} />)}</div>
        </div>
      )}

      {error && !loading && <div className="approved-flight-empty" role="alert">{error}</div>}
      {!rows && !loading && !error && <div className="approved-flight-empty"><b>{to ? `Ready to search ${from} → ${to}` : 'Choose a destination to start.'}</b><br />Search once, then open any result to compare points, cash and the safe booking path.</div>}

      {rows && !loading && (
        <>
          <div className="approved-flight-toolbar">
            <div><b>{filtered.length} {cabin === 'any' ? 'cabin-priced options' : 'flight options'}</b><span>{labelFor(from)} → {labelFor(to)} · {fmtDate(date)}{flexDays ? ` ±${flexDays} days` : ''} · {cabinLabel(cabin)}{counts ? ` · ${counts.cashFlights} target-date cash rows · ${counts.awards} award records` : ''}{awardMeta ? ` · ${authorityLabel(awardMeta.authority)}` : ''}</span></div>
            <div className="approved-flight-filters" role="group" aria-label="Flight result filters"><button type="button" aria-pressed={scope === 'all'} onClick={() => setScope('all')}>All options</button><button type="button" aria-pressed={scope === 'mine'} onClick={() => setScope('mine')}>My wallet</button><button type="button" aria-pressed={nonStop} onClick={() => setNonStop(value => !value)}>Non-stop</button></div>
          </div>
          {flexDays > 0 && <div className="approved-flight-note">Exact-date live cash fares for {fmtDate(date)} are shown first. Nearby-date results are clearly secondary. Cached or guide-based awards remain discovery-only until live verification.</div>}
          {cabin === 'any' && <div className="approved-flight-note">Any cabin runs separate Economy and Business pricing. The same flight time can appear twice when both cabins were returned; each row shows the actual returned cost for that cabin.</div>}
          <div className="approved-flight-note">{evidenceNote}</div>

          <section className="approved-award-list" aria-label="Flight award results">
            <div className="approved-award-head"><span>Date</span><span>Flight & route</span><span>Economy cost</span><span>Business cost</span><span>Best wallet path</span><span /></div>
            {filtered.length === 0 ? <div className="approved-flight-empty">No loaded option matches this filter.</div> : filtered.map(row => {
              const award = row.award
              const trip = award?.trip ?? null
              const rowCabin = cabinForRow(row)
              const stops = rowStops(row)
              const active = selectedId === row.id
              const reachable = rowReachable(row)
              const taxes = nativeTaxes(trip)
              const programme = award?.program || row.airline || 'Cash itinerary'
              const carrier = row.airline || programme
              const depart = fmtTime(trip?.departsAt || row.departure)
              const arrive = fmtTime(trip?.arrivesAt || row.arrival)
              const duration = fmtDuration(trip?.durationMinutes || row.duration * 60)
              const economyCost = cabinCost(row, rowCabin, 'economy')
              const businessCost = cabinCost(row, rowCabin, 'business')
              const rankedOptions = rankWalletOptions(row.redemption)
              const selectedWalletOption = row.bestOption ?? rankedOptions.find(option => option.status === 'ok') ?? null
              const selfServe = buildFlightSelfServePlan({ award: award ? { source: award.source, program: award.program, mileageCost: award.mileageCost } : null, option: selectedWalletOption, taxesLabel: taxes })
              const conciergeRequest = buildFlightConciergeRequest(row, rankedOptions, selectedWalletOption)
              const summary = row.decision?.searchSummary ?? null
              const usableSummaryPaths = summary?.alternatives.filter(option => option.state !== 'NOT_COMPARABLE') ?? []
              const executionPlans = summary && row.decision ? usableSummaryPaths.map(option => buildDecisionExecutionPlan(row, option)) : []
              const bestSummaryPath = summary?.bestPath ?? null
              const rowSummaryDetail = bestSummaryPath ? optionAmount(bestSummaryPath) : null
              const decisionAwardPoints = summary?.award.pointsRequired ?? row.decision?.awardState.pointsRequired ?? null
              const decisionAwardStatus = summary?.award.status ?? row.decision?.awardState.status ?? null
              const awardPrefix = award && award.program !== carrier ? `${award.program} award · ` : ''

              return (
                <article className={`approved-award-item${active ? ' open' : ''}`} key={row.id}>
                  <button type="button" className="approved-award-row" aria-expanded={active} onClick={() => { setSelectedId(current => current === row.id ? null : row.id); setDetailTab('compare') }}>
                    <span><b>{fmtDate(award?.date || row.departure)}</b><small>{fmtWeekday(award?.date || row.departure)} {depart}</small></span>
                    <span className="approved-award-programme"><i className="approved-airline-logo">{programmeMark(carrier)}</i><span><b>{carrier}</b><small>{awardPrefix}{row.from} {depart || ''} → {row.to} {arrive || ''} · {duration} · {fmtStops(stops)} · {cabinLabel(rowCabin)}</small></span></span>
                    <span><b>{economyCost.value}</b><small>{economyCost.label}</small></span>
                    <span><b>{businessCost.value}</b><small>{businessCost.label}</small></span>
                    <span className="approved-wallet-path"><b>{summary?.verdictLabel || (award ? (selfServe.executable ? 'Ready to verify' : reachable ? 'Wallet route' : 'Verify route') : `Cash · ${cabinLabel(rowCabin)}`)}</b><small>{rowSummaryDetail || (award ? (selfServe.pointsNeeded ? `${selfServe.pointsNeeded.toLocaleString('en-IN')} card pts` : 'needs verification') : row.price > 0 ? `₹${row.price.toLocaleString('en-IN')}` : 'fare unavailable')}</small></span>
                    <ChevronDown className="approved-row-chevron" size={16} />
                  </button>

                  {active && (
                    <div className="approved-award-detail">
                      <div className="approved-decision-hero">
                        <div><span className="approved-section-kicker">CreditIQ recommendation</span><h3>{summary?.headline || (award ? `Verify ${programme}, then choose self-serve or Concierge` : 'Pay cash or send the itinerary to Concierge')}</h3><p>{summary ? 'Cash, every sourced wallet rail, affordability and verification state are ranked from the same server decision.' : award ? 'Both execution paths use the same bounded itinerary and wallet snapshot.' : 'No award match was returned for this itinerary.'}</p></div>
                        <div><small>Cabin</small><b>{cabinLabel(rowCabin)}</b></div>
                        <div><small>Award price</small><b>{award ? `${award.mileageCost.toLocaleString('en-IN')} miles` : decisionAwardPoints ? `${decisionAwardPoints.toLocaleString('en-IN')} pts · ${decisionAwardStatus === 'DISCOVERY_ONLY' ? 'guide' : 'verify'}` : 'No airline award'}</b></div>
                        <div><small>Status</small><b>{summary?.verdictLabel || (selfServe.executable ? 'Self-serve ready' : award ? 'Verify / Concierge' : 'Cash only')}</b></div>
                      </div>

                      <div className="approved-decision-tabs" role="tablist"><button type="button" className={detailTab === 'compare' ? 'active' : undefined} onClick={() => setDetailTab('compare')}>Points vs cash</button><button type="button" className={detailTab === 'book' ? 'active' : undefined} onClick={() => setDetailTab('book')}>Redemption path</button><button type="button" className={detailTab === 'sources' ? 'active' : undefined} onClick={() => setDetailTab('sources')}>Source & safety</button></div>

                      <div className="approved-decision-panel">
                        {detailTab === 'compare' && (summary ? (
                          <div className="approved-path-grid">{usableSummaryPaths.map(option => {
                            const savings = option.savingsVsCashMinor != null && option.savingsVsCashMinor > 0 ? moneyMinor(option.savingsVsCashMinor, summary.cash.currency) : null
                            const stateLabel = option.isBestProjected ? 'Best projected path' : option.isBestExecutable ? 'Best executable path' : option.state.replaceAll('_', ' ').toLowerCase()
                            return <article className={`approved-path-choice${option.id === summary.bestPath?.id ? ' winner' : ''}`} key={option.id}><span>{stateLabel}</span><b>{option.label}</b><strong>{optionAmount(option)}</strong><small>{savings ? `${savings} less cash than the matched fare` : option.reasons[0] || 'Sourced wallet path'}</small></article>
                          })}{usableSummaryPaths.length === 0 && <article className="approved-path-choice winner"><span>CreditIQ verdict</span><b>{summary.verdictLabel}</b><strong>{moneyMinor(summary.cash.amountMinor, summary.cash.currency) || 'No comparable amount'}</strong><small>{summary.blockedReasons[0] || 'No safe wallet route can be promoted.'}</small></article>}</div>
                        ) : (
                          <div className="approved-path-grid"><article className={`approved-path-choice${award && selfServe.executable ? ' winner' : ''}`}><span>Award route</span><b>{award ? programme : 'No award match'}</b><strong>{selfServe.pointsNeeded ? `${selfServe.pointsNeeded.toLocaleString('en-IN')} card pts` : award ? `${award.mileageCost.toLocaleString('en-IN')} miles` : 'Unavailable'}</strong><small>{selfServe.ratioLabel ? `Ratio ${selfServe.ratioLabel} · ${selfServe.durationLabel}` : taxes ? `Returned taxes ${taxes}` : 'Verify programme terms'}</small></article><article className={`approved-path-choice${!award && row.price > 0 ? ' winner' : ''}`}><span>Cash alternative</span><b>Pay airline directly</b><strong>{row.price > 0 ? `₹${row.price.toLocaleString('en-IN')}` : 'Fare unavailable'}</strong><small>{row.price > 0 ? 'Keep all reward points' : 'No live cash number returned'}</small></article></div>
                        ))}

                        {detailTab === 'book' && (
                          <div className="approved-execution-split">
                            <article className="approved-execution-card self-serve">
                              <span className="approved-section-kicker">Individual · do it yourself</span><h3>Clear redemption path</h3>
                              {executionPlans.length > 0 ? executionPlans.map(plan => (
                                <section key={plan.id} className="approved-path-choice">
                                  <span>{plan.state}</span><b>{plan.label}</b><strong>{plan.amount}</strong>
                                  <ol className="approved-self-serve-steps">{plan.steps.map((step, index) => <li key={`${plan.id}:${index}`}><b>{index + 1}.</b><span>{step}</span></li>)}</ol>
                                  {plan.bookingUrl && <div className="approved-execution-actions"><a className="approved-primary" href={plan.bookingUrl} target="_blank" rel="noopener noreferrer">Open booking path ↗</a></div>}
                                  <div className="approved-transfer-warning"><b>Important:</b> {plan.warning}</div>
                                </section>
                              )) : (
                                <><>{selfServe.reason && <div className="approved-path-reason">{selfServe.reason}</div>}</>{selfServe.steps.length > 0 ? <ol className="approved-self-serve-steps">{selfServe.steps.map(step => <li key={step.title}><b>{step.title}</b><span>{step.detail}</span></li>)}</ol> : <p className="approved-execution-copy">No safe mapped redemption instruction is available yet. Use the cash booking path or Concierge; CreditIQ will not manufacture a ratio.</p>}{selfServe.programmeUrl && <div className="approved-execution-actions"><a className="approved-primary" href={selfServe.programmeUrl} target="_blank" rel="noopener noreferrer">Open {programme} ↗</a></div>}{!award && row.bookingLink && <div className="approved-execution-actions"><a className="approved-primary" href={row.bookingLink} target="_blank" rel="noopener noreferrer">Open cash booking ↗</a></div>}<div className="approved-transfer-warning"><b>Important:</b> {selfServe.warning}</div></>
                              )}
                            </article>

                            <article className="approved-execution-card concierge-path"><span className="approved-section-kicker">Corporate / HNI · assisted</span><h3>Pass it to CreditIQ Concierge</h3><p className="approved-execution-copy">We pass the selected flight, award source, wallet candidates and cash/tax snapshot into a Concierge case. The operator re-verifies the live seat, transfer facts and final price before asking for approval.</p><div className="approved-concierge-checklist"><span>✓ Re-check live award availability</span><span>✓ Verify transfer ratio and timing</span><span>✓ Prepare the final booking option</span><span>✓ No irreversible transfer without approval</span></div><div className="approved-concierge-path"><ConciergeRequestButton request={conciergeRequest} label="Pass to CreditIQ Concierge" /></div><small className="approved-concierge-note">Designed for corporate travel desks and users who want CreditIQ to manage the verification workflow.</small></article>
                          </div>
                        )}

                        {detailTab === 'sources' && (
                          <div className="approved-source-grid"><article><b>Award evidence</b><p>{award ? `${evidenceProviderLabel(row.awardEvidenceProvider)}. ${authorityLabel(awardMeta?.authority)}. ${awardMeta?.reason || 'Direct programme checkout remains the final execution check.'}` : decisionAwardPoints ? `${authorityLabel(row.decision?.sourceAuthority.awardPricingAuthority)}. Published or mapped award guidance is visible, but live seat availability must still be verified before any transfer.` : 'No airline award source matched this cash itinerary. Card travel-portal redemption paths can still exist independently.'}</p></article><article><b>Wallet path</b><p>{summary ? `${summary.alternatives.length} sourced candidate${summary.alternatives.length === 1 ? '' : 's'} were evaluated. ${summary.bestPath ? `Current verdict: ${summary.bestPath.label}.` : 'No safe path is currently promoted.'}` : award ? 'Legacy award mapping is being used for this result.' : 'Keeping points is the default when only cash inventory is available.'}</p></article><article><b>Execution boundary</b><p>{summary?.requiresLiveReverification || awardMeta?.authority !== 'DATE_SPECIFIC_LIVE' ? 'Cached, projected, guide-based or incomplete evidence stays non-executable until the required live checks are completed. CreditIQ will not tell you to move points before that.' : 'Date-specific live evidence improves confidence, but the selected programme checkout is still re-verified immediately before any irreversible points transfer.'}</p></article></div>
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
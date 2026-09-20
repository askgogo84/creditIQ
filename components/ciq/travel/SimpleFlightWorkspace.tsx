'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, ChevronDown, Plane, ShieldCheck, Sparkles } from 'lucide-react'
import { authedFetch } from '@/lib/authed-fetch'
import { AirportSelect } from '@/components/ciq/fly-points/AirportSelect'
import { resolveCity } from '@/lib/data/airports'
import type { RedemptionOption } from '@/lib/fusion-core'
import type { TravelDecisionContract } from '@/lib/travel/decision-contract'
import type { SearchRedemptionOption } from '@/lib/travel/search-redemption-summary'
import { rankWalletOptions } from '@/components/ciq/travel/flight-wallet-comparison'
import { ConciergeRequestButton } from '@/components/ciq/concierge/ConciergeRequestButton'
import { buildFlightConciergeRequest } from '@/components/ciq/concierge/travel-requests'

type Cabin = 'economy' | 'business'

type Row = {
  id: string
  airline?: string
  from: string
  to: string
  departure: string
  arrival?: string
  price: number
  cashUnavailable?: boolean
  award?: {
    program?: string
    source?: string
    mileageCost?: number
    seats?: number
    date?: string
    cabin?: string
    trip?: {
      flightNumbers?: string
      carriers?: string
      departsAt?: string
      arrivesAt?: string
      totalTaxes?: number
      taxesCurrency?: string
      stops?: number
    } | null
  } | null
  bookingLink?: string
  redemption?: RedemptionOption[]
  bestOption?: RedemptionOption | null
  decision?: TravelDecisionContract
}

type ExecutionPlan = {
  title: string
  amount: string | null
  steps: string[]
  warning: string
  bookingUrl: string | null
}

function plusDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function shift(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

function money(amountMinor?: number | null, currency = 'INR') {
  if (amountMinor == null) return null
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'INR',
      maximumFractionDigits: 0,
    }).format(amountMinor / 100)
  } catch {
    return `${currency} ${Math.round(amountMinor / 100).toLocaleString('en-IN')}`
  }
}

function cashPrice(row: Row) {
  return row.price > 0 ? `₹${Math.round(row.price).toLocaleString('en-IN')}` : 'Not available'
}

function friendlyAction(row: Row) {
  const verdict = row.decision?.searchSummary?.verdict
  switch (verdict) {
    case 'USE_POINTS': return { label: 'Use points', tone: '#166534' }
    case 'POINTS_PLUS_CASH': return { label: 'Use points + cash', tone: '#166534' }
    case 'VERIFY_AWARD': return { label: 'Check award first', tone: '#9A6700' }
    case 'VERIFY_REDEMPTION': return { label: 'Check redemption first', tone: '#9A6700' }
    case 'PAY_CASH': return { label: 'Pay cash', tone: '#142335' }
    default: return { label: 'Compare before booking', tone: '#6B6457' }
  }
}

function optionAmount(option: SearchRedemptionOption | null | undefined) {
  if (!option) return null
  const parts: string[] = []
  if (option.bankPointsRequired != null) parts.push(`${option.bankPointsRequired.toLocaleString('en-IN')} points`)
  const cash = money(option.cashPayableMinor, option.cashCurrency || 'INR')
  if (cash) parts.push(cash)
  return parts.join(' + ') || null
}

function findRail(decision: TravelDecisionContract, option: SearchRedemptionOption) {
  const candidate = decision.wallet.ranking.candidates.find(item => item.id === option.id) ?? null
  if (!candidate || candidate.railType === 'CASH_RETAIN') return { candidate, rail: null as any }

  const rail = decision.wallet.matrix.cards
    .flatMap(card => card.rails)
    .find(item => item.id === candidate.railId) ?? null

  return { candidate, rail: rail as any }
}

function buildExecutionPlan(row: Row): ExecutionPlan {
  const decision = row.decision
  const option = decision?.searchSummary?.bestPath ?? null
  const routeDate = (row.award?.date || row.departure || '').slice(0, 10)

  if (!decision || !option) {
    return {
      title: 'Pay cash and keep your points',
      amount: row.price > 0 ? cashPrice(row) : null,
      steps: [
        'Open the cash booking for this exact flight.',
        'Confirm the fare, cabin and baggage terms are still the same.',
        'Pay cash and keep your points for a better redemption.',
      ],
      warning: 'Cash fares can move before checkout. Re-check the final amount before payment.',
      bookingUrl: row.bookingLink || null,
    }
  }

  const { candidate, rail } = findRail(decision, option)
  const amount = optionAmount(option)

  if (option.railType === 'CASH_RETAIN') {
    return {
      title: 'Pay cash and keep your points',
      amount,
      steps: [
        `Open the cash booking for ${row.from} → ${row.to} on ${routeDate}.`,
        `Confirm the final fare is still ${amount || cashPrice(row)}.`,
        'Pay cash and keep your wallet points for a higher-value redemption.',
      ],
      warning: 'Cash fares can change before checkout. Re-check the final price before paying.',
      bookingUrl: row.bookingLink || null,
    }
  }

  if (option.railType === 'BANK_TRAVEL_PORTAL' || option.railType === 'MERCHANT_PAY_WITH_POINTS') {
    const portal = rail?.portal?.portalName || rail?.bookingDestination || option.label
    return {
      title: `Book through ${portal}`,
      amount,
      steps: [
        `Open ${portal}.`,
        `Search the exact ${row.from} → ${row.to} flight for ${routeDate} and match the same cabin.`,
        `Apply the CreditIQ wallet mix: ${amount || 'verify the points + cash split at checkout'}.`,
        'Before paying, re-check the live fare, portal cap, fees and final points/cash split.',
      ],
      warning: option.state === 'PROJECTED_NEEDS_VERIFICATION'
        ? 'This portal path is projected from sourced rules. Checkout is the authority for the final points/cash mix.'
        : 'Confirm the final portal price before completing payment.',
      bookingUrl: rail?.bookingUrl || null,
    }
  }

  if (option.railType === 'LOYALTY_TRANSFER') {
    const transfer = rail?.transfer
    const programme = transfer?.programmeName || row.award?.program || option.label.split('→').pop()?.trim() || 'loyalty programme'
    const awardPoints = decision.awardState.pointsRequired
    const bankPoints = candidate?.bankPointsToTransferExact
      ?? candidate?.bankPointsTargetMinimum
      ?? option.bankPointsRequired
    const ratio = transfer ? `${transfer.ratio.fromUnits}:${transfer.ratio.toUnits}` : 'verify current issuer ratio'
    const timing = transfer?.durationText || 'transfer timing not fully sourced'
    const discovery = decision.awardState.status === 'DISCOVERY_ONLY'

    return {
      title: `Transfer to ${programme}, then book`,
      amount,
      steps: [
        discovery
          ? `First verify live ${programme} award space for this exact flight. The current ${awardPoints ? `${awardPoints.toLocaleString('en-IN')}-point` : 'award'} figure is discovery guidance, not a confirmed seat.`
          : `Confirm the exact ${programme} award and current price${awardPoints ? ` of ${awardPoints.toLocaleString('en-IN')} points` : ''} before transferring anything.`,
        `Transfer ${bankPoints != null ? bankPoints.toLocaleString('en-IN') : 'the verified number of'} card points to ${programme}. Current mapped ratio: ${ratio}.`,
        `Allow for ${timing}. Do not assume the transfer is instant; re-check award space after the points arrive.`,
        `Book directly with ${programme} and pay the final taxes/fees shown at checkout.`,
      ],
      warning: transfer?.irreversible === false
        ? 'Re-check the award and issuer terms before moving points.'
        : 'Points transfers can be irreversible. Do not transfer until the live seat, current award price, ratio and timing are verified.',
      bookingUrl: rail?.bookingUrl || null,
    }
  }

  return {
    title: option.label,
    amount,
    steps: [
      `Open the mapped redemption destination for ${option.label}.`,
      `Match the exact ${row.from} → ${row.to} itinerary for ${routeDate}.`,
      `Apply ${amount || 'the verified wallet amount'}.`,
      'Verify all live terms and the final payable amount before completing the booking.',
    ],
    warning: option.reasons?.[0] || 'Verify the final redemption terms before committing points or cash.',
    bookingUrl: rail?.bookingUrl || row.bookingLink || null,
  }
}

function FlightCard({ row }: { row: Row }) {
  const summary = row.decision?.searchSummary
  const action = friendlyAction(row)
  const amount = optionAmount(summary?.bestPath)
  const date = (row.award?.date || row.departure || '').slice(0, 10)
  const live = row.decision?.awardState?.status === 'LIVE_OR_PROVIDER_RETURNED'
  const discovery = row.decision?.awardState?.status === 'DISCOVERY_ONLY'
  const plan = buildExecutionPlan(row)
  const ranked = rankWalletOptions(row.redemption || [])
  const bestLegacy = row.bestOption ?? null
  const conciergeRequest = buildFlightConciergeRequest(row, ranked, bestLegacy)

  return (
    <article style={{ border: '1px solid var(--line)', borderRadius: 18, background: 'var(--surface)', overflow: 'hidden' }}>
      <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(150px,.55fr) minmax(220px,.8fr)', gap: 16, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{date}</div>
          <strong style={{ display: 'block', fontSize: 16, marginTop: 3 }}>{row.airline || 'Flight option'}</strong>
          <span style={{ display: 'block', marginTop: 4, color: 'var(--ink-2)', fontSize: 12 }}>{row.from} → {row.to}</span>
        </div>

        <div>
          <small style={{ color: 'var(--ink-3)' }}>Cash fare</small>
          <strong style={{ display: 'block', fontSize: 19, marginTop: 3 }}>{cashPrice(row)}</strong>
        </div>

        <div style={{ borderLeft: '1px solid var(--line)', paddingLeft: 16 }}>
          <small style={{ color: action.tone, fontWeight: 800 }}>CREDITIQ SAYS</small>
          <strong style={{ display: 'block', fontSize: 16, marginTop: 4 }}>{action.label}</strong>
          {summary?.bestPath?.label && <span style={{ display: 'block', fontSize: 12, marginTop: 4, color: 'var(--ink-2)' }}>{summary.bestPath.label}</span>}
          {amount && <span style={{ display: 'block', marginTop: 3, fontWeight: 750 }}>{amount}</span>}
        </div>
      </div>

      {(discovery || live || summary?.blockedReasons?.length) && (
        <div style={{ padding: '10px 16px', background: discovery ? '#fff8e8' : live ? '#eef8f1' : 'var(--surface-2)', borderTop: '1px solid var(--line)', fontSize: 11.5, color: 'var(--ink-2)' }}>
          {live && 'Live award evidence returned. Re-check the final programme checkout immediately before transferring points.'}
          {discovery && 'This is a possible redemption, not a confirmed seat. Check the airline programme first; do not transfer points yet.'}
          {!live && !discovery && summary?.blockedReasons?.[0]}
        </div>
      )}

      <section style={{ padding: 16, borderTop: '1px solid var(--line)', background: 'var(--surface-2)' }}>
        <div style={{ marginBottom: 11 }}>
          <small style={{ color: 'var(--copper)', fontWeight: 850, letterSpacing: '.06em' }}>REDEMPTION PATH</small>
          <strong style={{ display: 'block', fontSize: 17, marginTop: 4 }}>{plan.title}</strong>
          {plan.amount && <span style={{ display: 'block', marginTop: 3, fontSize: 13, color: 'var(--ink-2)' }}>{plan.amount}</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 12 }}>
          <div style={{ border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)', padding: 14 }}>
            <small style={{ color: 'var(--ink-3)', fontWeight: 800 }}>DO IT YOURSELF</small>
            <ol style={{ paddingLeft: 20, margin: '10px 0 0', display: 'grid', gap: 8 }}>
              {plan.steps.map((step, index) => (
                <li key={index} style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--ink-2)' }}>{step}</li>
              ))}
            </ol>

            {plan.bookingUrl && (
              <a
                href={plan.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', marginTop: 12, padding: '9px 12px', borderRadius: 9, background: 'var(--ink)', color: 'var(--surface)', textDecoration: 'none', fontSize: 11.5, fontWeight: 800 }}
              >
                Open booking path <ArrowRight size={13} style={{ marginLeft: 5 }} />
              </a>
            )}

            <div style={{ marginTop: 12, padding: 10, borderRadius: 10, background: '#fff8e8', color: '#7b5a12', fontSize: 10.5, lineHeight: 1.5 }}>
              <b>Important:</b> {plan.warning}
            </div>
          </div>

          <div style={{ border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)', padding: 14 }}>
            <small style={{ color: 'var(--copper)', fontWeight: 800 }}>CREDITIQ CONCIERGE</small>
            <strong style={{ display: 'block', fontSize: 15, marginTop: 5 }}>Prefer us to handle the verification?</strong>
            <p style={{ margin: '7px 0 12px', fontSize: 11.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>
              We pass this exact itinerary, wallet comparison, award source, transfer facts and cash/tax snapshot into a Concierge case. The operator re-checks everything before asking you to approve an irreversible action.
            </p>
            <div style={{ display: 'grid', gap: 7, marginBottom: 12, fontSize: 11, color: 'var(--ink-2)' }}>
              <span>✓ Re-check live award availability</span>
              <span>✓ Verify transfer ratio and timing</span>
              <span>✓ Reconfirm taxes and final cash price</span>
              <span>✓ No points transfer or payment without your approval</span>
            </div>
            <ConciergeRequestButton request={conciergeRequest} label="Pass to CreditIQ Concierge" />
          </div>
        </div>
      </section>

      <details style={{ borderTop: '1px solid var(--line)' }}>
        <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 750 }}>
          Why this recommendation
          <ChevronDown size={15} />
        </summary>
        <div style={{ padding: '0 16px 15px', color: 'var(--ink-2)', fontSize: 12, lineHeight: 1.6 }}>
          {row.award ? (
            <p style={{ margin: 0 }}>Award found: {Number(row.award.mileageCost || 0).toLocaleString('en-IN')} points via {row.award.program || 'loyalty programme'}. {summary?.requiresLiveReverification ? 'Live verification is required before any transfer.' : ''}</p>
          ) : (
            <p style={{ margin: 0 }}>No airline award was attached to this itinerary. CreditIQ can still use a bank travel portal or cash route when that path is supported by your wallet.</p>
          )}
          {summary?.bestPath?.state && <p style={{ margin: '8px 0 0' }}>Path status: {summary.bestPath.state.replaceAll('_', ' ').toLowerCase()}.</p>}
        </div>
      </details>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
        <a href={`/cira?q=${encodeURIComponent(`Explain this ${row.from} to ${row.to} flight and tell me exactly what to do next`)}`} style={{ padding: '9px 13px', borderRadius: 10, background: 'var(--ink)', color: 'var(--surface)', textDecoration: 'none', fontSize: 12, fontWeight: 800 }}>
          <Sparkles size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} /> Ask CIRA
        </a>
      </div>
    </article>
  )
}

export function SimpleFlightWorkspace() {
  const params = useSearchParams()
  const qTo = resolveCity(params.get('q') || '') || 'DEL'
  const [from, setFrom] = useState('BLR')
  const [to, setTo] = useState(qTo)
  const [date, setDate] = useState(plusDays(7))
  const [flex, setFlex] = useState<0 | 3 | 7>(0)
  const [cabin, setCabin] = useState<Cabin>('economy')
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  const uniqueRows = useMemo(() => {
    const seen = new Set<string>()
    return rows.filter(row => {
      const summary = row.decision?.searchSummary
      const key = [
        row.airline || '',
        (row.award?.date || row.departure || '').slice(0, 10),
        row.price || 0,
        summary?.verdict || '',
        summary?.bestPath?.label || '',
        summary?.bestPath?.bankPointsRequired || 0,
        summary?.bestPath?.cashPayableMinor || 0,
      ].join('|')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [rows])

  const sorted = useMemo(() => [...uniqueRows].sort((a, b) => {
    const rank = (r: Row) => {
      const v = r.decision?.searchSummary?.verdict
      if (v === 'USE_POINTS' || v === 'POINTS_PLUS_CASH') return 0
      if (v === 'VERIFY_AWARD' || v === 'VERIFY_REDEMPTION') return 1
      if (v === 'PAY_CASH') return 2
      return 3
    }
    return rank(a) - rank(b) || (a.price || Number.MAX_SAFE_INTEGER) - (b.price || Number.MAX_SAFE_INTEGER)
  }), [uniqueRows])

  async function search() {
    if (!from || !to || from === to || !date) return
    setLoading(true)
    setError('')
    setRows([])
    setSearched(true)
    try {
      const res = await authedFetch('/api/flights/fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from,
          to,
          date_from: shift(date, -flex),
          date_to: shift(date, flex),
          cash_date: date,
          cabin,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Flight search failed')
      setRows(Array.isArray(data.flights) ? data.flights : [])
    } catch (e: any) {
      setError(e?.message || 'Could not search flights.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '22px 18px 60px' }}>
      <div style={{ marginBottom: 18 }}>
        <div className="ciq-editorial-kicker">Travel</div>
        <h1 style={{ margin: '5px 0 6px', fontSize: 30 }}>Find the flight. CreditIQ tells you how to book it.</h1>
        <p style={{ margin: 0, color: 'var(--ink-2)', maxWidth: 760 }}>See the simple verdict first, then the exact redemption steps or hand the same itinerary to CreditIQ Concierge.</p>
      </div>

      <section style={{ border: '1px solid var(--line)', borderRadius: 18, background: 'var(--surface)', padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 160px 130px 130px auto', gap: 9, alignItems: 'end' }}>
        <AirportSelect label="From" value={from} exclude={to} onChange={setFrom} />
        <AirportSelect label="To" value={to} exclude={from} onChange={setTo} />
        <label><small>Date</small><input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', height: 42, border: '1px solid var(--line)', borderRadius: 10, padding: '0 10px', background: 'var(--surface)' }} /></label>
        <label><small>Dates</small><select value={flex} onChange={e => setFlex(Number(e.target.value) as 0 | 3 | 7)} style={{ width: '100%', height: 42, border: '1px solid var(--line)', borderRadius: 10, background: 'var(--surface)', padding: '0 8px' }}><option value={0}>Exact</option><option value={3}>±3 days</option><option value={7}>±7 days</option></select></label>
        <label><small>Cabin</small><select value={cabin} onChange={e => setCabin(e.target.value as Cabin)} style={{ width: '100%', height: 42, border: '1px solid var(--line)', borderRadius: 10, background: 'var(--surface)', padding: '0 8px' }}><option value="economy">Economy</option><option value="business">Business</option></select></label>
        <button onClick={search} disabled={loading} style={{ height: 42, border: 0, borderRadius: 10, padding: '0 16px', background: 'var(--copper)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>{loading ? 'Searching…' : 'Search'}</button>
      </section>

      <div style={{ marginTop: 14, padding: '11px 13px', borderRadius: 12, background: 'var(--surface-2)', display: 'flex', gap: 9, alignItems: 'center', color: 'var(--ink-2)', fontSize: 11.5 }}>
        <ShieldCheck size={17} />
        <span><b>Safe by default:</b> “Check award first” means CreditIQ found a promising path but will not tell you to transfer points until availability is live-verified.</span>
      </div>

      {error && <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#fff1ee', color: '#8a2e1d' }}>{error}</div>}

      {loading && <div style={{ padding: 42, textAlign: 'center', color: 'var(--ink-3)' }}><Plane size={26} style={{ marginBottom: 8 }} /><div>Checking fares, awards and your wallet…</div></div>}

      {!loading && searched && !error && (
        <section style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 10 }}>
            <div><strong style={{ fontSize: 18 }}>Best options</strong><span style={{ display: 'block', marginTop: 2, color: 'var(--ink-3)', fontSize: 11 }}>{sorted.length} unique result{sorted.length === 1 ? '' : 's'} · best decision first</span></div>
          </div>
          {sorted.length ? <div style={{ display: 'grid', gap: 12 }}>{sorted.slice(0, 10).map(row => <FlightCard key={row.id} row={row} />)}</div> : <div style={{ padding: 24, border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)' }}>No safe result returned. Try another date or a ±3 day search.</div>}
        </section>
      )}
    </div>
  )
}

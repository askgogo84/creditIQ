'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, ChevronDown, Plane, ShieldCheck } from 'lucide-react'
import { authedFetch } from '@/lib/authed-fetch'
import { AirportSelect } from '@/components/ciq/fly-points/AirportSelect'
import { resolveCity } from '@/lib/data/airports'

type Cabin = 'economy' | 'business'
type Summary = {
  verdict?: string
  verdictLabel?: string
  headline?: string
  bestPath?: {
    label?: string
    bankPointsRequired?: number | null
    cashPayableMinor?: number | null
    cashCurrency?: string | null
    state?: string
  } | null
  award?: {
    status?: string
    pointsRequired?: number | null
    programmeId?: string | null
  }
  cash?: { amountMinor?: number | null; currency?: string | null }
  requiresLiveReverification?: boolean
  blockedReasons?: string[]
}

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
    mileageCost?: number
    date?: string
    cabin?: string
    trip?: { totalTaxes?: number; taxesCurrency?: string } | null
  } | null
  bookingLink?: string
  decision?: { searchSummary?: Summary; awardState?: { status?: string }; sourceAuthority?: { award?: string | null } }
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
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: currency || 'INR', maximumFractionDigits: 0 }).format(amountMinor / 100)
  } catch {
    return `${currency} ${Math.round(amountMinor / 100).toLocaleString('en-IN')}`
  }
}

function cashPrice(row: Row) {
  return row.price > 0 ? `₹${Math.round(row.price).toLocaleString('en-IN')}` : 'Not available'
}

function friendlyAction(summary: Summary | undefined) {
  switch (summary?.verdict) {
    case 'USE_POINTS': return { label: 'Use points', tone: '#166534' }
    case 'POINTS_PLUS_CASH': return { label: 'Use points + cash', tone: '#166534' }
    case 'VERIFY_AWARD': return { label: 'Check award first', tone: '#9A6700' }
    case 'VERIFY_REDEMPTION': return { label: 'Check redemption first', tone: '#9A6700' }
    case 'PAY_CASH': return { label: 'Pay cash', tone: '#142335' }
    default: return { label: 'Compare before booking', tone: '#6B6457' }
  }
}

function pathAmount(summary?: Summary) {
  const best = summary?.bestPath
  if (!best) return null
  const parts: string[] = []
  if (best.bankPointsRequired != null) parts.push(`${best.bankPointsRequired.toLocaleString('en-IN')} points`)
  const cash = money(best.cashPayableMinor, best.cashCurrency || 'INR')
  if (cash) parts.push(cash)
  return parts.join(' + ') || null
}

function FlightCard({ row }: { row: Row }) {
  const summary = row.decision?.searchSummary
  const action = friendlyAction(summary)
  const amount = pathAmount(summary)
  const date = (row.award?.date || row.departure || '').slice(0, 10)
  const live = row.decision?.awardState?.status === 'LIVE_OR_PROVIDER_RETURNED'
  const discovery = row.decision?.awardState?.status === 'DISCOVERY_ONLY'

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

      <details style={{ borderTop: '1px solid var(--line)' }}>
        <summary style={{ cursor: 'pointer', listStyle: 'none', padding: '11px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 750 }}>
          Why this recommendation
          <ChevronDown size={15} />
        </summary>
        <div style={{ padding: '0 16px 15px', color: 'var(--ink-2)', fontSize: 12, lineHeight: 1.6 }}>
          {row.award ? (
            <p style={{ margin: 0 }}>Award found: {Number(row.award.mileageCost || 0).toLocaleString('en-IN')} points via {row.award.program || 'loyalty programme'}. {summary?.requiresLiveReverification ? 'Live verification is required before any transfer.' : ''}</p>
          ) : (
            <p style={{ margin: 0 }}>No safe award match was attached to this itinerary. CreditIQ keeps the cash option visible instead of inventing a points price.</p>
          )}
          {summary?.bestPath?.state && <p style={{ margin: '8px 0 0' }}>Path status: {summary.bestPath.state.replaceAll('_', ' ').toLowerCase()}.</p>}
        </div>
      </details>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--line)', display: 'flex', gap: 9, justifyContent: 'flex-end' }}>
        {row.bookingLink && <a href={row.bookingLink} target="_blank" rel="noopener noreferrer" style={{ padding: '9px 13px', borderRadius: 10, border: '1px solid var(--line)', textDecoration: 'none', color: 'var(--ink)', fontSize: 12, fontWeight: 750 }}>Open cash booking</a>}
        <a href={`/cira?q=${encodeURIComponent(`Explain this ${row.from} to ${row.to} flight and tell me exactly what to do next`)}`} style={{ padding: '9px 13px', borderRadius: 10, background: 'var(--ink)', color: 'var(--surface)', textDecoration: 'none', fontSize: 12, fontWeight: 800 }}>Ask CIRA <ArrowRight size={13} style={{ verticalAlign: 'middle' }} /></a>
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

  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const rank = (r: Row) => {
      const v = r.decision?.searchSummary?.verdict
      if (v === 'USE_POINTS' || v === 'POINTS_PLUS_CASH') return 0
      if (v === 'VERIFY_AWARD' || v === 'VERIFY_REDEMPTION') return 1
      if (v === 'PAY_CASH') return 2
      return 3
    }
    return rank(a) - rank(b) || (a.price || Number.MAX_SAFE_INTEGER) - (b.price || Number.MAX_SAFE_INTEGER)
  }), [rows])

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
    <div style={{ maxWidth: 980, margin: '0 auto', padding: '22px 18px 60px' }}>
      <div style={{ marginBottom: 18 }}>
        <div className="ciq-editorial-kicker">Travel</div>
        <h1 style={{ margin: '5px 0 6px', fontSize: 30 }}>Find the flight. CreditIQ tells you how to pay.</h1>
        <p style={{ margin: 0, color: 'var(--ink-2)', maxWidth: 720 }}>No redemption jargon. Every result ends in one clear action: <b>Pay cash</b>, <b>Use points</b>, or <b>Check award first</b>.</p>
      </div>

      <section style={{ border: '1px solid var(--line)', borderRadius: 18, background: 'var(--surface)', padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 160px 130px 130px auto', gap: 9, alignItems: 'end' }}>
        <label><small>From</small><AirportSelect value={from} onChange={setFrom} /></label>
        <label><small>To</small><AirportSelect value={to} onChange={setTo} /></label>
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
            <div><strong style={{ fontSize: 18 }}>Best options</strong><span style={{ display: 'block', marginTop: 2, color: 'var(--ink-3)', fontSize: 11 }}>{sorted.length} result{sorted.length === 1 ? '' : 's'} · best decision first</span></div>
          </div>
          {sorted.length ? <div style={{ display: 'grid', gap: 10 }}>{sorted.slice(0, 12).map(row => <FlightCard key={row.id} row={row} />)}</div> : <div style={{ padding: 24, border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surface)' }}>No safe result returned. Try another date or a ±3 day search.</div>}
        </section>
      )}
    </div>
  )
}

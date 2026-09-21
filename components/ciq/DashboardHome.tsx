'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Bell, ChevronRight, Plane, Sparkles, WalletCards } from 'lucide-react'
import { authedFetch } from '@/lib/authed-fetch'
import './creditiq-cockpit.css'

type Card = {
  id: string
  bank: string
  cardName: string
  last4: string | null
  points: number
  verified: boolean
  selfEntered: boolean
  color: string
}

type Summary = {
  cards: Card[]
  summary: {
    total: number
    verified: number
    selfEntered: number
    verifiedPercent: number
    cardCount: number
    transferPathCount: number
  }
}

function fmt(n: number | null | undefined) {
  return Math.round(Number(n || 0)).toLocaleString('en-IN')
}

function plusDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function shortName(name: string) {
  return String(name || '')
    .replace(/Credit Card/gi, '')
    .replace(/Metal Edition/gi, '')
    .replace(/American Express/gi, 'Amex')
    .trim()
}

export function DashboardHome({ displayName }: { displayName: string; cards: any[]; totalPoints: number; primaryBank: string }) {
  const [data, setData] = useState<Summary | null>(null)
  const [trip, setTrip] = useState<any>(null)
  const [tripLoading, setTripLoading] = useState(true)

  useEffect(() => {
    authedFetch('/api/cockpit/summary')
      .then(async r => {
        if (!r.ok) throw new Error('summary failed')
        return r.json()
      })
      .then(setData)
      .catch(() => setData({
        cards: [],
        summary: { total: 0, verified: 0, selfEntered: 0, verifiedPercent: 0, cardCount: 0, transferPathCount: 0 },
      }))
  }, [])

  useEffect(() => {
    const date = plusDays(21)
    authedFetch('/api/flights/fusion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'BLR', to: 'SIN', date_from: date, date_to: date, cash_date: date, cabin: 'economy' }),
    })
      .then(async r => {
        if (!r.ok) throw new Error('trip failed')
        return r.json()
      })
      .then(json => {
        const rows = Array.isArray(json.flights) ? json.flights : []
        setTrip(rows.find((row: any) => row?.decision?.searchSummary?.bestPath) || rows[0] || null)
      })
      .catch(() => setTrip(null))
      .finally(() => setTripLoading(false))
  }, [])

  const summary = data?.summary ?? { total: 0, verified: 0, selfEntered: 0, verifiedPercent: 0, cardCount: 0, transferPathCount: 0 }
  const cards = data?.cards ?? []
  const firstName = (displayName || 'there').trim().split(/\s+/)[0]
  const bestPath = trip?.decision?.searchSummary?.bestPath
  const verdict = trip?.decision?.searchSummary?.verdictLabel
    || (trip?.decision?.searchSummary?.verdict === 'VERIFY_AWARD' ? 'Verify redemption'
      : trip?.decision?.searchSummary?.verdict === 'PAY_CASH' ? 'Pay cash'
      : bestPath ? 'Best path found' : 'Check live options')
  const cash = trip?.price > 0 ? `₹${fmt(trip.price)}` : 'Live fare unavailable'
  const points = bestPath?.bankPointsRequired != null
    ? `${fmt(bestPath.bankPointsRequired)} points`
    : trip?.award?.mileageCost
      ? `${fmt(trip.award.mileageCost)} points`
      : 'No verified points quote'

  const walletRange = useMemo(() => {
    if (!summary.total) return '₹0'
    const floor = Math.round(summary.total * .25)
    const ceil = Math.round(summary.total * 1.8)
    return `₹${fmt(floor)}–₹${fmt(ceil)}`
  }, [summary.total])

  return (
    <main className="ciq-home-latest">
      <header className="ciq-home-head">
        <div>
          <span className="ciq-home-kicker">CreditIQ · {summary.verifiedPercent}% verified</span>
          <h1>{firstName ? `Hi ${firstName}.` : 'Your money position.'}</h1>
          <p>See what matters first. Then act with live evidence.</p>
        </div>
        <Link href="/notifications" className="ciq-home-icon" aria-label="Notifications"><Bell size={19} /></Link>
      </header>

      <section className="ciq-home-position">
        <div className="ciq-home-position-top">
          <div><small>Your rewards position</small><strong>{fmt(summary.total)} <em>points</em></strong></div>
          <span>{summary.cardCount} cards</span>
        </div>
        <div className="ciq-home-value">Honest value <b>{walletRange}</b></div>
        <div className="ciq-home-split">
          <div><small>Verified</small><b>{fmt(summary.verified)} pts</b></div>
          <div><small>Estimated</small><b>{fmt(summary.selfEntered)} pts</b></div>
        </div>
        <p>Self-entered balances stay separate from statement-verified balances.</p>
      </section>

      <div className="ciq-home-section-title">
        <div><strong>Do this now</strong><span>Ranked by value at stake</span></div>
      </div>

      <Link href="/trip-planner" className="ciq-home-action-card">
        <div className="ciq-home-action-top">
          <span>BEST REDEMPTION</span>
          <b>{tripLoading ? 'Checking live…' : verdict}</b>
        </div>
        <h2>{tripLoading ? 'Checking your wallet against live travel inventory…' : trip ? 'BLR → Singapore' : 'Find your best travel path'}</h2>
        <p>Compare live cash, award inventory and your wallet before moving any points.</p>
        <div className="ciq-home-action-metrics">
          <div><small>Cash</small><strong>{tripLoading ? '—' : cash}</strong></div>
          <div><small>Best wallet path</small><strong>{tripLoading ? '—' : points}</strong></div>
        </div>
        <div className="ciq-home-action-foot"><span>Open Travel</span><ChevronRight size={18} /></div>
      </Link>

      <Link href="/wallet" className="ciq-home-row-card">
        <span className="ciq-home-row-icon"><WalletCards size={19} /></span>
        <div><strong>{summary.selfEntered > 0 ? 'One balance needs verification' : 'Your wallet is verified'}</strong><p>{summary.selfEntered > 0 ? 'Verify self-entered points to tighten your wallet value range.' : 'Your current balances are evidence-backed.'}</p></div>
        <ChevronRight size={18} />
      </Link>

      <div className="ciq-home-section-title"><strong>Plan a redemption</strong></div>
      <div className="ciq-home-quick-grid">
        <Link href="/trip-planner"><Plane size={20} /><span>Flights</span></Link>
        <Link href="/hotels"><span className="ciq-home-hotel-glyph">⌂</span><span>Hotels</span></Link>
        <Link href="/cira"><Sparkles size={20} /><span>Ask CIRA</span></Link>
      </div>

      <div className="ciq-home-section-title"><strong>Your wallet</strong><Link href="/wallet">Open wallet</Link></div>
      <div className="ciq-home-card-strip">
        {cards.slice(0, 3).map(card => (
          <Link href="/wallet" key={card.id} className="ciq-home-mini-card" style={{ background: `linear-gradient(145deg,${card.color || '#142335'},#111820)` }}>
            <div><span>{card.bank}</span><b>{shortName(card.cardName)}</b></div>
            <strong>{fmt(card.points)}</strong>
            <small>{card.verified ? 'Verified' : 'Self-entered'}</small>
          </Link>
        ))}
        {!cards.length && <Link href="/wallet" className="ciq-home-empty-card">Add your first card</Link>}
      </div>

      <Link href="/statement-truth" className="ciq-home-statement">
        <div><span>STATEMENT TRUTH</span><strong>See what your latest statement proves.</strong><p>Verified earnings, missed rewards and the routing changes that matter.</p></div>
        <ChevronRight size={19} />
      </Link>
    </main>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Bot, ChevronRight, Zap } from 'lucide-react'
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

export function DashboardHome({ displayName }: { displayName: string; cards: any[]; totalPoints: number; primaryBank: string }) {
  const [data, setData] = useState<Summary | null>(null)
  const [trip, setTrip] = useState<any>(null)
  const [tripLoading, setTripLoading] = useState(true)

  useEffect(() => {
    authedFetch('/api/cockpit/summary')
      .then(async r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setData)
      .catch(() => setData({ cards: [], summary: { total: 0, verified: 0, selfEntered: 0, verifiedPercent: 0, cardCount: 0, transferPathCount: 0 } }))
  }, [])

  useEffect(() => {
    const date = plusDays(21)
    authedFetch('/api/flights/fusion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'BLR', to: 'SIN', date_from: date, date_to: date, cash_date: date, cabin: 'economy' }),
    })
      .then(async r => { if (!r.ok) throw new Error(); return r.json() })
      .then(json => {
        const rows = Array.isArray(json.flights) ? json.flights : []
        setTrip(rows.find((row: any) => row?.decision?.searchSummary?.bestPath) || rows[0] || null)
      })
      .catch(() => setTrip(null))
      .finally(() => setTripLoading(false))
  }, [])

  const summary = data?.summary ?? { total: 0, verified: 0, selfEntered: 0, verifiedPercent: 0, cardCount: 0, transferPathCount: 0 }
  const firstName = (displayName || 'there').trim().split(/\s+/)[0]
  const walletValue = useMemo(() => Math.round(summary.total * 1.1), [summary.total])
  const bestPath = trip?.decision?.searchSummary?.bestPath
  const bestAction = bestPath?.label
    ? bestPath.label
    : summary.selfEntered > 0
      ? 'Verify your largest self-entered balance'
      : 'Review your highest-value redemption'
  const bestActionSub = bestPath?.bankPointsRequired
    ? `${fmt(bestPath.bankPointsRequired)} points needed for the current best path.`
    : summary.selfEntered > 0
      ? 'Tighten your wallet value before making a transfer.'
      : 'CreditIQ will compare cash, portals and transfer partners.'

  return (
    <main className="ciq-sub-home">
      <div className="ciq-sub-home-top">
        <div className="ciq-sub-bot"><Bot size={19} /></div>
        <span className="ciq-sub-unlocked">₹{fmt(Math.max(0, walletValue - Math.round(summary.total * .8)))} unlocked</span>
      </div>

      <h1>Good morning,<br />{firstName}</h1>

      <Link href="/trip-planner" className="ciq-sub-best-action">
        <div>
          <small>Today&apos;s best action</small>
          <strong>{tripLoading ? 'Checking your wallet…' : bestAction}</strong>
          <p>{tripLoading ? 'Comparing your cards with live and cached travel paths.' : bestActionSub}</p>
        </div>
        <span><Zap size={22} /></span>
      </Link>

      <div className="ciq-sub-stat-grid">
        <div><small>Total points value</small><strong>₹{fmt(walletValue)}</strong></div>
        <div><small>Upcoming dues</small><strong>₹0</strong></div>
      </div>

      <div className="ciq-sub-section-head">
        <strong>Action Center</strong>
        <Link href="/intelligence">View all</Link>
      </div>

      <Link href={summary.selfEntered > 0 ? '/wallet' : '/intelligence'} className="ciq-sub-action-row">
        <span className="ciq-sub-alert-icon"><AlertTriangle size={18} /></span>
        <div>
          <strong>{summary.selfEntered > 0 ? 'Wallet verification needed' : 'HDFC SmartBuy change detected'}</strong>
          <small>{summary.selfEntered > 0 ? `${fmt(summary.selfEntered)} points are still self-entered.` : 'CIRA found new reward signals worth reviewing.'}</small>
        </div>
        <ChevronRight size={19} />
      </Link>

      <div className="ciq-sub-proof">
        <span>{summary.cardCount || 0} cards</span>
        <span>{summary.verifiedPercent}% verified</span>
        <span>{summary.transferPathCount || 0} transfer paths</span>
      </div>
    </main>
  )
}

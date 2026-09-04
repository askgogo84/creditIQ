'use client'

import Link from 'next/link'
import {
  ArrowRight,
  CreditCard as CreditCardIcon,
  Plane,
  Receipt,
  ShieldCheck,
  Upload,
  Wallet,
} from 'lucide-react'
import { CardRow } from './CardRow'
import type { CreditCard } from '@/lib/types'

type WalletCard = {
  id: string
  bank: string
  card_name?: string
  cardName?: string
  card_last4?: string
  points_balance: number
  points_currency?: string
  source: 'statement' | 'manual'
  self_entered?: boolean
  catalogue?: Pick<CreditCard, 'slug' | 'name' | 'bank' | 'color'>
}

const barHeights = [34, 49, 43, 67, 58, 88]

export function DashboardHome({
  displayName,
  cards,
  totalPoints,
  primaryBank,
}: {
  displayName: string
  cards: WalletCard[]
  totalPoints: number
  primaryBank: string
}) {
  const verified = cards.filter(card => card.source === 'statement' && !card.self_entered)
  const verifiedPoints = verified.reduce((sum, card) => sum + (card.points_balance || 0), 0)
  const verification = totalPoints > 0 ? Math.round((verifiedPoints / totalPoints) * 100) : 0
  const low = Math.round(totalPoints * .25)
  const high = Math.round(totalPoints * 1.8)
  const firstName = (displayName || 'there').trim().split(/\s+/)[0]
  const today = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())

  return (
    <main className="ciq-approved-dashboard">
      <section className="dashboard-hero">
        <div className="hero-copy">
          <div className="eyebrow"><time suppressHydrationWarning>{today}</time></div>
          <h1>Good morning, {firstName}.</h1>
          <p>Your cards can unlock more value this month. Here is what deserves attention first.</p>
          <div className="hero-actions">
            <Link className="button primary" href="/spend-optimizer">Optimise a purchase <ArrowRight size={15} /></Link>
            <Link className="button ghost" href={`/trip-planner?points=${totalPoints}&bank=${primaryBank}`}>Plan a trip</Link>
          </div>
        </div>
        <div className="hero-orbit" aria-label="Rewards overview">
          <div className="orbit orbit-a" /><div className="orbit orbit-b" />
          <div className="orbit-plane"><Plane size={17} /></div>
          <div className="orbit-core"><small>Wallet value</small><strong>₹{low.toLocaleString('en-IN')}</strong><span>estimated floor</span></div>
          <div className="orbit-tag tag-a">{totalPoints.toLocaleString('en-IN')} pts</div>
          <div className="orbit-tag tag-b">{cards.length} {cards.length === 1 ? 'card' : 'cards'}</div>
        </div>
      </section>

      <section className="metric-row" aria-label="Rewards summary">
        <article className="metric-card">
          <div className="metric-icon copper"><Wallet size={19} /></div>
          <div><small>Total points</small><strong>{totalPoints.toLocaleString('en-IN')}</strong><span className="positive">Across {cards.length} tracked cards</span></div>
          <div className="micro-bars" aria-hidden>{barHeights.map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div>
        </article>
        <article className="metric-card">
          <div className="metric-icon blue"><Receipt size={19} /></div>
          <div><small>Estimated value range</small><strong>₹{low.toLocaleString('en-IN')}</strong><span>up to ₹{high.toLocaleString('en-IN')}</span></div>
          <div className="ring mini" style={{ '--value': Math.max(2, verification) } as React.CSSProperties}><b>{verification}%</b></div>
        </article>
        <article className="metric-card">
          <div className="metric-icon green"><Plane size={19} /></div>
          <div><small>Travel readiness</small><strong>{verified.length} verified</strong><span>Search executable routes live</span></div>
          <div className="flight-mini"><Plane size={16} /><i /><b>GO</b></div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="surface opportunity-panel">
          <div className="section-head">
            <div><span className="section-kicker">Your next best moves</span><h2>Three priorities for your wallet</h2></div>
            <Link className="text-button" href="/spend-optimizer">See all <ArrowRight size={13} /></Link>
          </div>
          <div className="opportunity-list">
            <Link className="opportunity" href="/spend-optimizer">
              <span className="merchant-logo amazon">a</span>
              <span className="op-copy"><b>Use the right card before you pay</b><small>Compare every tracked card for your next purchase.</small></span>
              <span className="op-value"><b>Live comparison</b><small>not sponsored</small></span><ArrowRight size={13} />
            </Link>
            <Link className="opportunity" href={`/trip-planner?points=${totalPoints}&bank=${primaryBank}`}>
              <span className="merchant-logo flight"><Plane size={17} /></span>
              <span className="op-copy"><b>See where your points can take you</b><small>Compare award inventory with routes your wallet can fund.</small></span>
              <span className="op-value"><b>{totalPoints.toLocaleString('en-IN')} pts</b><small>available</small></span><ArrowRight size={13} />
            </Link>
            <Link className="opportunity" href="/upload-statement">
              <span className="merchant-logo statement"><Upload size={17} /></span>
              <span className="op-copy"><b>Improve wallet confidence</b><small>{verified.length} of {cards.length} balances are statement verified.</small></span>
              <span className="op-value"><b>{verification}%</b><small>verified</small></span><ArrowRight size={13} />
            </Link>
          </div>
        </article>

        <article className="surface spend-chart-card">
          <div className="section-head compact"><div><span className="section-kicker">Balance composition</span><h2>{verifiedPoints.toLocaleString('en-IN')} verified</h2></div><ShieldCheck size={17} /></div>
          <div className="spend-chart" aria-label="Wallet balance composition">
            {barHeights.map((height, index) => <div key={index} className={index === barHeights.length - 1 ? 'current' : undefined}><i style={{ height: `${height}%` }} /><small>{index + 1}</small></div>)}
          </div>
          <div className="chart-legend"><span><i className="dot copper-dot" />Statement verified {verification}%</span><span><i className="dot grey-dot" />Self-entered {100 - verification}%</span></div>
        </article>
      </section>

      <div className="section-head page-section-head">
        <div><span className="section-kicker">Wallet snapshot</span><h2>Cards working for you</h2></div>
        <Link className="text-button" href="/wallet">Manage wallet <ArrowRight size={13} /></Link>
      </div>
      <section className="mini-card-grid">
        {cards.slice(0, 3).map(card => (
          <article className="dashboard-wallet-card" key={card.id}>
            <CardRow bank={card.bank} cardName={card.card_name || card.cardName || card.bank} last4={card.card_last4}
              points={card.points_balance} currency={card.points_currency} source={card.source} selfEntered={card.self_entered}
              variant="light" card={card.catalogue} flat />
          </article>
        ))}
        {cards.length === 0 && <div className="dashboard-empty"><CreditCardIcon size={20} /> Your first card will appear here. <Link href="/wallet">Add a card</Link>.</div>}
      </section>
    </main>
  )
}

'use client'

import Link from 'next/link'
import { ArrowRight, CreditCard as CreditCardIcon, Plane, Receipt, ShieldCheck, Sparkles, Upload } from 'lucide-react'
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

  return (
    <main className="ciq-home">
      <section className="ciq-home-hero">
        <div className="ciq-home-copy">
          <div className="ciq-home-kicker">Your rewards intelligence</div>
          <h1>Good to see you,<br /><em>{displayName || 'there'}.</em></h1>
          <p>{totalPoints > 0
            ? `Your ${totalPoints.toLocaleString('en-IN')} points are organised, labelled and ready for smarter decisions.`
            : 'Add your cards or upload a statement to turn scattered balances into useful decisions.'}</p>
          <div className="ciq-home-actions">
            <Link href="/spend-optimizer">Optimise a purchase <ArrowRight size={15} /></Link>
            <Link href={`/trip-planner?points=${totalPoints}&bank=${primaryBank}`}>Plan a trip</Link>
          </div>
        </div>
        <div className="ciq-orbit" aria-label={`${totalPoints.toLocaleString('en-IN')} total reward points`}>
          <div className="ciq-orbit-ring outer" /><div className="ciq-orbit-ring inner" />
          <span className="ciq-orbit-plane"><Plane size={19} /></span>
          <span className="ciq-orbit-tag one">{cards.length} cards linked</span>
          <span className="ciq-orbit-tag two">{verification}% verified</span>
          <div className="ciq-orbit-core"><small>Total points</small><strong>{totalPoints.toLocaleString('en-IN')}</strong><span>≈ ₹{low.toLocaleString('en-IN')}–₹{high.toLocaleString('en-IN')}</span></div>
        </div>
      </section>

      <section className="ciq-home-metrics" aria-label="Rewards summary">
        <article><span className="copper"><Sparkles size={19} /></span><div><small>Total rewards</small><strong>{totalPoints.toLocaleString('en-IN')}</strong><p>across {cards.length} cards</p></div></article>
        <article><span className="green"><ShieldCheck size={19} /></span><div><small>Statement verified</small><strong>{verifiedPoints.toLocaleString('en-IN')}</strong><p>{verification}% of your balance</p></div></article>
        <article><span className="blue"><CreditCardIcon size={19} /></span><div><small>Cards working</small><strong>{cards.length}</strong><p>{verified.length} verified</p></div></article>
      </section>

      <section className="ciq-home-grid">
        <article className="ciq-home-surface ciq-next-moves">
          <header><div><small>Your next best moves</small><h2>Three useful actions, right now</h2></div></header>
          <Link href={`/trip-planner?points=${totalPoints}&bank=${primaryBank}`}><span className="blue"><Plane size={17} /></span><div><b>See where your points can take you</b><small>Compare award inventory and wallet transfer routes.</small></div><ArrowRight size={16} /></Link>
          <Link href="/spend-optimizer"><span className="copper"><Receipt size={17} /></span><div><b>Choose the best card before you pay</b><small>Model your spend across the cards CreditIQ tracks.</small></div><ArrowRight size={16} /></Link>
          <Link href="/upload-statement"><span className="green"><Upload size={17} /></span><div><b>Improve wallet confidence</b><small>{verified.length} of {cards.length} card balances are statement verified.</small></div><ArrowRight size={16} /></Link>
        </article>
        <article className="ciq-home-surface ciq-confidence-card">
          <small>Wallet confidence</small>
          <div className="ciq-confidence-ring" style={{ '--value': `${verification * 3.6}deg` } as React.CSSProperties}><span><strong>{verification}%</strong><small>verified</small></span></div>
          <p>Verified values come from statements. Self-entered balances stay clearly labelled.</p>
          <Link href="/wallet">Open full wallet <ArrowRight size={14} /></Link>
        </article>
      </section>

      <section className="ciq-home-wallet">
        <header><div><small>Wallet snapshot</small><h2>Cards working for you</h2></div><Link href="/wallet">Manage wallet <ArrowRight size={14} /></Link></header>
        <div className="ciq-home-card-grid">
          {cards.slice(0, 3).map(card => (
            <article className="ciq-home-card" key={card.id}>
              <CardRow bank={card.bank} cardName={card.card_name || card.cardName || card.bank} last4={card.card_last4}
                points={card.points_balance} currency={card.points_currency} source={card.source} selfEntered={card.self_entered}
                variant="light" card={card.catalogue} flat />
            </article>
          ))}
          {cards.length === 0 && <div className="ciq-home-empty">Your first card will appear here. <Link href="/wallet">Add a card</Link>.</div>}
        </div>
      </section>
    </main>
  )
}

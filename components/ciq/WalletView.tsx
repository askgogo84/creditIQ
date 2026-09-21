'use client'

import { useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Gift, Plus, Sparkles, FileSearch, ArrowRight } from 'lucide-react'
import { SEED_CARDS } from '@/lib/data/seed-cards'
import { CardArt } from '@/components/cards/CardArt'
import { CardMockup } from '@/components/cards/CardMockup'
import type { CreditCard } from '@/lib/types'
import { DashboardHome } from './DashboardHome'
import './wallet-full-width.css'

type Card = {
  id: string
  bank: string
  card_name?: string
  cardName?: string
  card_last4?: string
  points_balance: number
  points_currency?: string
  source: 'statement' | 'manual'
  self_entered?: boolean
}

const normalise = (value: string) => value.toLowerCase()
  .replace(/\b(bank|credit|card|metal|edition|signature|world)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ').trim()

function catalogueCard(card: Card) {
  const held = normalise(`${card.bank} ${card.card_name || card.cardName || ''}`)
  const heldName = normalise(card.card_name || card.cardName || '')
  return SEED_CARDS.find(candidate => {
    const seed = normalise(`${candidate.bank} ${candidate.name}`)
    const seedName = normalise(candidate.name)
    return seed === held || seed.includes(held) || held.includes(seed) ||
      (heldName.length >= 5 && (seedName.includes(heldName) || heldName.includes(seedName)))
  })
}

function fmt(n: number) {
  return Math.round(n).toLocaleString('en-IN')
}

export function WalletView({
  displayName,
  cards,
  totalPoints,
  primaryBank,
  onAddCard,
  onRefresh,
  refreshing,
  onEditPoints,
  onDeleteCard,
}: {
  displayName: string
  email?: string
  cards: Card[]
  totalPoints: number
  primaryBank: string
  onAddCard: () => void
  onRefresh: () => void
  refreshing?: boolean
  onEditPoints?: (card: Card, points: number) => Promise<boolean>
  onDeleteCard?: (card: Card) => void
}) {
  const pathname = usePathname()
  const [selectedId, setSelectedId] = useState(cards[0]?.id || '')
  const selected = cards.find(c => c.id === selectedId) || cards[0] || null
  const selectedCatalogue = selected ? catalogueCard(selected) : null
  const verifiedPoints = cards.filter(c => c.source === 'statement' && !c.self_entered).reduce((sum, c) => sum + (c.points_balance || 0), 0)
  const portfolioValue = useMemo(() => Math.round(totalPoints * 1.1), [totalPoints])
  const health = selected?.source === 'statement' && !selected?.self_entered ? 'A' : 'B+'

  if (pathname === '/dashboard') {
    return <DashboardHome displayName={displayName} cards={cards} totalPoints={totalPoints} primaryBank={primaryBank} />
  }

  return (
    <main className="ciq-sub-cards">
      <header className="ciq-sub-cards-head">
        <h1>Cards</h1>
        <button type="button" onClick={onAddCard} aria-label="Add card"><Plus size={24} /></button>
      </header>

      <section className="ciq-sub-portfolio">
        <div>
          <small>Portfolio value</small>
          <strong>₹{portfolioValue >= 100000 ? (portfolioValue / 100000).toFixed(1) + 'L' : (portfolioValue / 1000).toFixed(1) + 'K'}</strong>
          <span>{fmt(totalPoints)} reward points</span>
        </div>
        <span className="ciq-sub-portfolio-icon"><FileSearch size={25} /></span>
      </section>

      {selected ? (
        <>
          <div className="ciq-sub-card-art">
            {selectedCatalogue ? (
              <CardArt card={selectedCatalogue}>
                <CardMockup card={selectedCatalogue as CreditCard} size="lg" interactive={false} />
              </CardArt>
            ) : (
              <div className="ciq-sub-card-fallback" style={{ background: 'linear-gradient(135deg,#24161B,#B5811E)' }}>
                <b>{selected.bank}</b><span>{selected.card_name || selected.cardName || 'Credit card'}</span>
              </div>
            )}
          </div>

          {cards.length > 1 && (
            <div className="ciq-sub-card-picker">
              {cards.map(card => (
                <button key={card.id} onClick={() => setSelectedId(card.id)} className={card.id === selected.id ? 'active' : undefined}>
                  {card.bank}<span>{fmt(card.points_balance)}</span>
                </button>
              ))}
            </div>
          )}

          <div className="ciq-sub-card-actions">
            <Link href="/intelligence"><Gift size={19} /><span>Offers</span><small>294 offers</small></Link>
            <Link href="/spend-optimizer"><Sparkles size={19} /><span>Earn more</span><small>Optimize spend</small></Link>
            <Link href="/statement-truth"><FileSearch size={19} /><span>Statement</span><small>Verify rewards</small></Link>
          </div>

          <Link href="/intelligence" className="ciq-sub-health">
            <div>
              <strong>Card health: {health}</strong>
              <span>{selected.source === 'statement' && !selected.self_entered ? 'Strong for travel. Review category gaps.' : 'Verify the balance to improve confidence.'}</span>
            </div>
            <ArrowRight size={20} />
          </Link>

          <section className="ciq-sub-balance-card">
            <div><small>Points balance</small><strong>{fmt(selected.points_balance)}</strong></div>
            <div><small>Source</small><strong>{selected.source === 'statement' && !selected.self_entered ? 'Verified' : 'Self-entered'}</strong></div>
          </section>

          <div className="ciq-sub-card-utility">
            {onEditPoints && <button type="button" onClick={async () => {
              const raw = window.prompt('Update points balance', String(selected.points_balance))
              if (raw == null) return
              const value = Number(raw.replace(/[^0-9]/g, ''))
              if (Number.isFinite(value)) await onEditPoints(selected, value)
            }}>Edit balance</button>}
            <button type="button" onClick={onRefresh}>{refreshing ? 'Refreshing…' : 'Refresh cards'}</button>
            {onDeleteCard && <button type="button" className="danger" onClick={() => onDeleteCard(selected)}>Remove card</button>}
          </div>
        </>
      ) : (
        <button type="button" onClick={onAddCard} className="ciq-sub-empty-card">
          <Plus size={24} />
          <strong>Add your first card</strong>
          <span>Manual entry is enough to unlock card health and redemption intelligence.</span>
        </button>
      )}

      <div className="ciq-sub-card-footnote">{fmt(verifiedPoints)} verified points across {cards.length} card{cards.length === 1 ? '' : 's'}.</div>
    </main>
  )
}

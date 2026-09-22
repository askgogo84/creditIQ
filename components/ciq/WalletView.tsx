'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Check, Upload } from 'lucide-react'
import { SEED_CARDS } from '@/lib/data/seed-cards'
import { CardRow } from './CardRow'
import { Tour, type TourStep } from './Tour'
import { DashboardHome } from './DashboardHome'
import './wallet-full-width.css'

const WALLET_TOUR: TourStep[] = [
  { title: 'Your points, verified vs self-entered', body: 'The verified share comes from statements. Self-entered balances always stay clearly labelled.', anchor: '#wallet-gauge' },
  { title: 'Add a card', body: 'Enter a card manually or upload a statement to add a verified balance.', anchor: '#wallet-add' },
]
const TOUR_SEEN_KEY = 'ciq_wallet_tour_v1'

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

const normaliseCardName = (value: string) => value.toLowerCase()
  .replace(/\b(bank|credit|card|metal|edition|signature|world)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ').trim()

function catalogueCard(card: Card) {
  const held = normaliseCardName(`${card.bank} ${card.card_name || card.cardName || ''}`)
  const heldName = normaliseCardName(card.card_name || card.cardName || '')
  return SEED_CARDS.find(candidate => {
    const seed = normaliseCardName(`${candidate.bank} ${candidate.name}`)
    const seedName = normaliseCardName(candidate.name)
    return seed === held || seed.includes(held) || held.includes(seed) ||
      (heldName.length >= 5 && (seedName.includes(heldName) || heldName.includes(seedName)))
  })
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
  const isVerified = (card: Card) => card.source === 'statement' && !card.self_entered
  const verifiedPoints = cards.filter(isVerified).reduce((sum, card) => sum + (card.points_balance || 0), 0)
  const estimatedFloor = Math.round(totalPoints * .25)
  const estimatedCeiling = Math.round(totalPoints * 1.8)
  const selfEnteredPoints = Math.max(0, totalPoints - verifiedPoints)
  const verification = totalPoints > 0 ? Math.round(verifiedPoints / totalPoints * 100) : 0
  const [tourOpen, setTourOpen] = useState(false)
  const [balancesHidden, setBalancesHidden] = useState(false)
  const bankTotals = Object.entries(cards.reduce<Record<string, number>>((totals, item) => {
    totals[item.bank] = (totals[item.bank] || 0) + (item.points_balance || 0)
    return totals
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const closeTour = (reason: 'skip' | 'done') => {
    setTourOpen(false)
    try { localStorage.setItem(TOUR_SEEN_KEY, '1') } catch {}
    if (reason === 'done') onAddCard()
  }

  if (pathname === '/dashboard') {
    return <DashboardHome displayName={displayName} cards={cards.map(card => ({ ...card, catalogue: catalogueCard(card) }))} totalPoints={totalPoints} primaryBank={primaryBank} />
  }

  return (
    <main className="ciq-approved-wallet" id="wallet-gauge">
      <header className="approved-page-header">
        <div><span className="approved-eyebrow">Your rewards portfolio</span><h1>Wallet</h1><p>Balances, card benefits and transfer readiness in one place.</p></div>
        <div className="approved-header-actions">
          <button type="button" className="approved-secondary" aria-pressed={balancesHidden} onClick={() => setBalancesHidden(hidden => !hidden)}>{balancesHidden ? 'Show balances' : 'Hide balances'}</button>
          <Link className="approved-primary" href="/upload-statement"><Upload size={15} /> Add statement</Link>
        </div>
      </header>

      <section className="approved-wallet-summary">
        <div>
          <small>Estimated wallet value</small>
          <strong>{balancesHidden ? '••••' : `≈ ₹${estimatedFloor.toLocaleString('en-IN')}–₹${estimatedCeiling.toLocaleString('en-IN')}`}</strong>
          {!balancesHidden && <em className="approved-estimate-badge">estimate</em>}
          <span>Across <b>{balancesHidden ? '••••' : totalPoints.toLocaleString('en-IN')}</b> reward points</span>
          <span className="approved-wallet-point-split">Verified <b>{balancesHidden ? '••••' : verifiedPoints.toLocaleString('en-IN')}</b> · Self-entered <b>{balancesHidden ? '••••' : selfEnteredPoints.toLocaleString('en-IN')}</b></span>
          {cards.length > 0 && verifiedPoints === 0 && <span className="approved-wallet-verify-note"><b>All self-entered.</b> Upload a statement to verify this wallet.</span>}
        </div>
        <div className="approved-value-ring"><div style={{ '--value': Math.max(2, verification) } as React.CSSProperties}><span><b>{verification}%</b><small>verified</small></span></div></div>
        <div className="approved-wallet-breakdown">
          {bankTotals.map(([bank, points]) => <div key={bank}><span>{bank}</span><b>{balancesHidden ? '••••' : `${points.toLocaleString('en-IN')} pts`}</b><i><em style={{ width: `${totalPoints ? Math.max(8, Math.round(points / totalPoints * 100)) : 0}%` }} /></i></div>)}
          {bankTotals.length === 0 && <p>Add a card to see your wallet composition.</p>}
        </div>
      </section>

      <div className="approved-section-head approved-wallet-cards-head">
        <div><span className="approved-section-kicker">My cards</span><h2>{cards.length} active {cards.length === 1 ? 'card' : 'cards'}</h2></div>
        <div className="approved-view-toggle"><button className="active">Cards</button><button onClick={onRefresh}>{refreshing ? 'Refreshing…' : 'Refresh'}</button></div>
      </div>

      <section className="approved-wallet-card-grid">
        {cards.map((card, index) => (
          <article className={`approved-wallet-card${index === 0 ? ' selected' : ''}`} key={card.id}>
            <CardRow bank={card.bank} cardName={card.card_name || card.cardName || card.bank} last4={card.card_last4}
              points={card.points_balance} currency={card.points_currency} source={card.source} selfEntered={card.self_entered}
              variant="light" flat card={catalogueCard(card)} balancesHidden={balancesHidden}
              onSavePoints={onEditPoints ? points => onEditPoints(card, points) : undefined}
              onDelete={onDeleteCard ? () => onDeleteCard(card) : undefined} />
            <footer><span className={isVerified(card) ? 'good' : 'neutral'}>{isVerified(card) && <Check size={11} />}{isVerified(card) ? 'Statement verified' : 'Self-entered'}</span></footer>
          </article>
        ))}
        {cards.length === 0 && <button id="wallet-add" onClick={onAddCard} className="approved-wallet-empty">＋ Add a card</button>}
      </section>
      {cards.length > 0 && <button id="wallet-add" onClick={onAddCard} className="approved-add-card">＋ Add another card</button>}

      <section className="approved-wallet-lower-grid">
        <article className="approved-surface approved-transfer-readiness">
          <div className="approved-section-head"><div><span className="approved-section-kicker">Transfer readiness</span><h2>Where your points can go</h2></div><Link href={`/trip-planner?points=${totalPoints}&bank=${primaryBank}`}>Explore travel</Link></div>
          <div className="approved-partner-flow"><div className="approved-flow-bank">{primaryBank}<br /><b>{balancesHidden ? '••••' : `${Math.round(totalPoints / 100) / 10}K`}</b></div><div className="approved-flow-lines"><i /><i /><i /></div><div className="approved-flow-partners"><span>SQ<br /><b>KrisFlyer</b></span><span>AI<br /><b>Maharaja</b></span><span>ALL<br /><b>Accor</b></span></div></div>
        </article>
        <Link className="approved-surface approved-statement-drop" href="/upload-statement"><span><Upload size={20} /></span><h3>{verifiedPoints === 0 && cards.length > 0 ? 'Get your verified points' : 'Refresh your wallet'}</h3><p>Upload a statement to update balances and unlock personalised recommendations.</p><b>Choose statement</b><small>Your values remain clearly sourced.</small></Link>
      </section>

      <button className="approved-tour-link" onClick={() => setTourOpen(true)}>Take a tour <ArrowRight size={13} /></button>
      <Tour steps={WALLET_TOUR} open={tourOpen} onClose={closeTour} labelPrefix="WALLET" variant="light" finalLabel="Add a card" />
    </main>
  )
}

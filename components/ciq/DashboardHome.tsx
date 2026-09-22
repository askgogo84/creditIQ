'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CreditCard, Home, Plane, Sparkles, WalletCards, Zap } from 'lucide-react'
import { authedFetch } from '@/lib/authed-fetch'
import { cockpitDisplay, cockpitBody } from './cockpit-fonts'
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
function compact(n: number) {
  if (n >= 100000) return (n / 100000).toFixed(n % 100000 ? 1 : 0) + 'L'
  if (n >= 1000) return Math.round(n / 1000) + 'K'
  return String(n)
}
function plusDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
function cardTone(card: Card, index: number) {
  if (card.color) return card.color
  return ['#142950', '#7A1632', '#9298A3'][index % 3]
}

export function DashboardHome({
  displayName,
  cards: propCards,
  totalPoints: propTotal,
  primaryBank,
}: {
  displayName: string
  cards: any[]
  totalPoints: number
  primaryBank: string
}) {
  const router = useRouter()
  const [data, setData] = useState<Summary | null>(null)
  const [trip, setTrip] = useState<any>(null)
  const [tripLoading, setTripLoading] = useState(true)
  const [ask, setAsk] = useState('')

  useEffect(() => {
    authedFetch('/api/cockpit/summary')
      .then(async r => {
        if (!r.ok) throw new Error('summary failed')
        return r.json()
      })
      .then(setData)
      .catch(() => {
        const total = Number(propTotal || 0)
        setData({
          cards: (propCards || []).map((c: any, i: number) => ({
            id: c.id || String(i),
            bank: c.bank || '',
            cardName: c.card_name || c.cardName || c.bank || 'Card',
            last4: c.card_last4 || c.last4 || null,
            points: Number(c.points_balance ?? c.points ?? 0),
            verified: c.source === 'statement' && !c.self_entered,
            selfEntered: c.source !== 'statement' || !!c.self_entered,
            color: c.catalogue?.color || c.color || '',
          })),
          summary: { total, verified: 0, selfEntered: total, verifiedPercent: 0, cardCount: propCards?.length || 0, transferPathCount: 0 },
        })
      })
  }, [propCards, propTotal])

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

  const summary = data?.summary ?? {
    total: Number(propTotal || 0),
    verified: 0,
    selfEntered: Number(propTotal || 0),
    verifiedPercent: 0,
    cardCount: propCards?.length || 0,
    transferPathCount: 0,
  }
  const cards = data?.cards ?? []
  const bestPath = trip?.decision?.searchSummary?.bestPath
  const cash = trip?.price > 0 ? '₹' + fmt(trip.price) : 'Live fare'
  const pathPoints = bestPath?.bankPointsRequired ?? trip?.award?.mileageCost
  const pointsLabel = pathPoints ? fmt(pathPoints) + ' points + taxes' : 'Compare live paths'
  const sourceLabel =
    bestPath?.sourceCardName ||
    bestPath?.cardName ||
    bestPath?.bank ||
    primaryBank ||
    cards[0]?.bank ||
    'Your wallet'
  const programme =
    bestPath?.programName ||
    bestPath?.program ||
    bestPath?.loyaltyProgram ||
    bestPath?.partner ||
    'best transfer partner'

  const topCards = cards.slice(0, 3)
  const question = 'What do you want to do with your money or points today?'
  const submitAsk = (e: FormEvent) => {
    e.preventDefault()
    const q = ask.trim()
    router.push(q ? '/cira?seed=' + encodeURIComponent(q) : '/cira')
  }

  const selfEntered = summary.selfEntered || 0
  const transferCount = summary.transferPathCount || 0
  const total = summary.total || propTotal || 0
  const firstName = (displayName || '').trim().split(/\s+/)[0] || 'there'

  const suggestedTitle = useMemo(
    () => total ? `Your ${fmt(total)} points could fund part of a Singapore trip.` : 'Find the smartest way to use your points.',
    [total],
  )

  return (
    <div className={`ciq-cockpit ${cockpitDisplay.variable} ${cockpitBody.variable}`}>
      <div className="cq-shell">
        <nav className="cq-rail" aria-label="CreditIQ">
          <Link className="cq-logo" href="/dashboard" aria-label="CreditIQ">IQ</Link>
          <div className="cq-nav">
            <Link className="active" href="/dashboard" aria-label="Home"><Home /><span>Home</span></Link>
            <Link href="/wallet" aria-label="Wallet"><WalletCards /><span>Wallet</span></Link>
            <Link href="/spend-optimizer" aria-label="Spend"><Zap /><span>Spend</span></Link>
            <Link href="/trip-planner" aria-label="Travel"><Plane /><span>Travel</span></Link>
            <Link href="/cira" aria-label="CIRA"><Sparkles /><span>CIRA</span></Link>
          </div>
          <div className="cq-avatar" aria-label={displayName || 'G'}>{firstName.charAt(0).toUpperCase()}</div>
        </nav>

        <main className="cq-main">
          <div className="cq-top">
            <div className="cq-greeting-row">
              <span>Good evening, {firstName}</span>
              <div className="cq-wallet-chips">
                {topCards.map((card, i) => (
                  <Link href="/wallet" className="cq-wallet-chip" key={card.id}>
                    <span className="cq-chip-swatch" style={{ background: cardTone(card, i) }} />
                    <b>{compact(card.points)}</b>
                    <span className="cq-dot" style={{ background: card.verified ? '#2E7D4F' : '#B9BCC6' }} />
                  </Link>
                ))}
                <Link href="/wallet" className="cq-wallet-chip cq-wallet-total">
                  <b>{fmt(total)} pts</b>
                  <span>{summary.verifiedPercent}% verified</span>
                </Link>
              </div>
            </div>

            <section className="cq-hero">
              <div className="cq-eyebrow">CreditIQ Intelligence</div>
              <h1>{question}</h1>

              <form className="cq-cmd" onSubmit={submitAsk}>
                <Sparkles size={17} />
                <input
                  value={ask}
                  onChange={e => setAsk(e.target.value)}
                  placeholder={'Ask CIRA anything… “Can I fly business class with my points?”'}
                  aria-label="Ask CIRA anything"
                />
                <button type="submit">Ask CIRA</button>
              </form>

              <div className="cq-suggest" aria-label="Suggested actions">
                <Link className="primary" href="/trip-planner">✈ Plan a trip with my points</Link>
                <Link href="/spend-optimizer">Which card should I use?</Link>
                <Link href="/trip-planner">Find my best redemption</Link>
                <Link href="/statement-truth">Analyse my statement</Link>
                <Link href="/hotels">Book a hotel with points</Link>
              </div>
            </section>

            <section className="cq-work">
              <article className="cq-panel-dark">
                <div className="cq-kicker">Your smartest move right now</div>
                <h2 className="cq-title">{tripLoading ? 'Checking your wallet against live travel options…' : suggestedTitle}</h2>
                <div className="cq-trip-sub">Suggested trip · Bengaluru → Singapore</div>

                <div className="cq-trip-grid">
                  <div><div className="cq-mini-label">Cash</div><div className="cq-mini-value">{tripLoading ? '—' : cash}</div></div>
                  <div><div className="cq-mini-label">Points path</div><div className="cq-mini-value">{tripLoading ? '—' : pointsLabel}</div></div>
                  <div><div className="cq-mini-label">From wallet</div><div className="cq-mini-value">{tripLoading ? '—' : sourceLabel + ' → ' + programme}</div></div>
                </div>

                <div className="cq-smart-line" />

                <div className="cq-actions">
                  <span className="cq-verdict">● CreditIQ verdict · {bestPath ? 'Check award first' : 'Compare before transferring'}</span>
                  <div className="cq-action-buttons">
                    <Link className="cq-btn dark" href="/cira">Ask CIRA</Link>
                    <Link className="cq-btn gold" href="/trip-planner">See redemption path →</Link>
                  </div>
                </div>
              </article>

              <aside className="cq-live">
                <small>Live from your wallet</small>
                <Link className="cq-insight" href="/spend-optimizer">
                  <span><small>Planning a large purchase?</small><strong>Find the best card</strong></span><ArrowRight size={16} />
                </Link>
                <Link className="cq-insight" href="/wallet">
                  <span><small>{fmt(selfEntered)} points are self-entered</small><strong>Verify balance</strong></span><ArrowRight size={16} />
                </Link>
                <Link className="cq-insight" href="/transfer-partners">
                  <span><small>{transferCount} transfer paths available</small><strong>Explore</strong></span><ArrowRight size={16} />
                </Link>
              </aside>
            </section>
          </div>

          <section className="cq-lower">
            <div>
              <div className="cq-section-head"><span>Your wallet · tap a card</span><Link href="/wallet">Open wallet</Link></div>
              <div className="cq-deck">
                {cards.slice(0, 3).map((card, i) => (
                  <Link
                    href="/wallet"
                    key={card.id}
                    className={'cq-card ' + (i === 0 ? 'selected' : i === 1 ? 'stack1' : 'stack2')}
                    style={{ background: `linear-gradient(140deg,${cardTone(card, i)},#111722)` }}
                  >
                    <div><small>{card.bank}</small><h3>{card.cardName}</h3></div>
                    <div className="cq-card-chip" />
                    <div className="cq-card-bottom">
                      <span>{card.last4 ? '•••• ' + card.last4 : 'Reward card'}</span>
                      <strong>{fmt(card.points)}</strong>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="cq-section-head"><span>Rewards orbit · where your points can go</span></div>
              <div className="cq-orbit">
                <div className="cq-orbit-ring2" />
                <div className="cq-orbit-ring1" />
                <div className="cq-orbit-center"><small>Your wallet</small><strong>{compact(total)}</strong><span>points</span></div>
                {cards.slice(0, 3).map((card, i) => (
                  <Link href="/wallet" className={'cq-node ' + (i === 0 ? 'selected' : '')} key={card.id}>
                    <CreditCard size={16} /><span>{card.bank}<br /><b>{compact(card.points)}</b></span>
                  </Link>
                ))}
                <div className="cq-programmes">
                  <span className="cq-programme">KrisFlyer</span>
                  <span className="cq-programme">Maharaja</span>
                  <span className="cq-programme">Accor ALL</span>
                  <span className="cq-programme">Marriott</span>
                </div>
                <div className="cq-orbit-note">Explore transfer routes only after checking live award availability.</div>
              </div>
            </div>
          </section>

          <Link className="cq-cirabar" href="/cira">
            <Sparkles size={15} color="#C9A86A" />
            <span>Ask CIRA anything…</span>
            <b>Open</b>
          </Link>
        </main>
      </div>
    </div>
  )
}

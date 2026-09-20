
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authedFetch } from '@/lib/authed-fetch'
import { buildFlightConciergeRequest } from '@/components/ciq/concierge/travel-requests'
import { rankWalletOptions } from '@/components/ciq/travel/flight-wallet-comparison'
import './creditiq-cockpit.css'

type CockpitCard = {
  id: string
  bank: string
  cardName: string
  last4: string | null
  points: number
  pointsCurrency: string
  verified: boolean
  selfEntered: boolean
  source: string
  color: string
  bestUse: string
  partners: string[]
  catalogueId: string | null
}

type CockpitSummary = {
  cards: CockpitCard[]
  summary: {
    total: number
    verified: number
    selfEntered: number
    verifiedPercent: number
    cardCount: number
    transferPathCount: number
  }
  insights: Array<{ kicker: string; action: string; intent: string }>
}

type SpendRow = {
  id: string
  bank: string
  cardName: string
  color: string
  value: number
  note?: string | null
}

type ThreadItem = { role: 'user' | 'ai'; text: string }

function plusDays(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function fmt(n: number | null | undefined) {
  return Math.round(Number(n || 0)).toLocaleString('en-IN')
}

function moneyMinor(value: number | null | undefined, currency = 'INR') {
  if (value == null) return null
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value / 100)
  } catch {
    return currency + ' ' + fmt(value / 100)
  }
}

function cardGradient(color: string, index: number) {
  const fallback = ['#1C2B4B', '#7B263E', '#697486'][index % 3]
  const base = color || fallback
  return 'linear-gradient(135deg,' + base + ',#101722)'
}

function shortName(name: string) {
  return name
    .replace(/Credit Card/gi, '')
    .replace(/Metal Edition/gi, 'Infinia')
    .replace(/American Express/gi, 'Amex')
    .trim()
}

function pathAmount(path: any) {
  if (!path) return ''
  const parts: string[] = []
  if (path.bankPointsRequired != null) parts.push(fmt(path.bankPointsRequired) + ' points')
  const cash = moneyMinor(path.cashPayableMinor, path.cashCurrency || 'INR')
  if (cash) parts.push(cash)
  return parts.join(' + ')
}

function tripSteps(row: any) {
  const decision = row?.decision
  const path = decision?.searchSummary?.bestPath
  if (!path) {
    return [
      'Open the cash booking for this exact flight.',
      'Confirm the fare, cabin and baggage terms.',
      'Pay cash and keep your points for a better redemption.',
    ]
  }

  if (path.railType === 'LOYALTY_TRANSFER') {
    const candidate = decision.wallet?.ranking?.candidates?.find((item: any) => item.id === path.id)
    const rail = decision.wallet?.matrix?.cards?.flatMap((card: any) => card.rails || []).find((item: any) => item.id === candidate?.railId)
    const programme = rail?.transfer?.programmeName || row.award?.program || 'the loyalty programme'
    const bankPoints = candidate?.bankPointsToTransferExact ?? candidate?.bankPointsTargetMinimum ?? path.bankPointsRequired
    const timing = rail?.transfer?.durationText || 'the issuer-published transfer time'
    return [
      'Verify live ' + programme + ' award space for this exact flight before transferring anything.',
      'Transfer ' + (bankPoints != null ? fmt(bankPoints) : 'the verified number of') + ' card points after checking the current ratio.',
      'Allow for ' + timing + ', re-check the award after the points arrive, then book directly with ' + programme + '.',
    ]
  }

  if (path.railType === 'BANK_TRAVEL_PORTAL' || path.railType === 'MERCHANT_PAY_WITH_POINTS') {
    return [
      'Open ' + (path.label || 'the mapped bank travel portal') + '.',
      'Match this exact flight, date and cabin.',
      'Apply ' + (pathAmount(path) || 'the verified points + cash mix') + ' and confirm the final portal cap, fees and fare before paying.',
    ]
  }

  return [
    'Open the mapped booking route for this recommendation.',
    'Match the exact flight and confirm all live terms.',
    'Complete the booking only after the final points and cash amount are verified.',
  ]
}

export function DashboardHome({
  displayName,
}: {
  displayName: string
  cards: any[]
  totalPoints: number
  primaryBank: string
}) {
  const router = useRouter()
  const firstName = (displayName || 'there').trim().split(/\s+/)[0]
  const [data, setData] = useState<CockpitSummary | null>(null)
  const [mode, setMode] = useState<'trip' | 'card' | 'redeem' | 'statement' | 'hotel'>('trip')
  const [selected, setSelected] = useState<string | null>(null)
  const [orbitSelected, setOrbitSelected] = useState<string | null>(null)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [cmd, setCmd] = useState('')
  const [amount, setAmount] = useState(25000)
  const [merchant, setMerchant] = useState('Apple')
  const [spendRows, setSpendRows] = useState<SpendRow[]>([])
  const [spendLoading, setSpendLoading] = useState(false)
  const [tripLoading, setTripLoading] = useState(false)
  const [tripRow, setTripRow] = useState<any>(null)
  const [tripOpen, setTripOpen] = useState(false)
  const [hotelLoading, setHotelLoading] = useState(false)
  const [hotelCash, setHotelCash] = useState<any>(null)
  const [hotelLoyalty, setHotelLoyalty] = useState<any>(null)
  const [ciraOpen, setCiraOpen] = useState(false)
  const [ciraDraft, setCiraDraft] = useState('')
  const [thread, setThread] = useState<ThreadItem[]>([])
  const [ciraBusy, setCiraBusy] = useState(false)
  const [conciergeState, setConciergeState] = useState<string>('')

  useEffect(() => {
    authedFetch('/api/cockpit/summary')
      .then(async res => {
        if (!res.ok) throw new Error('summary failed')
        return res.json()
      })
      .then((json: CockpitSummary) => {
        setData(json)
        if (json.cards[0]) {
          setSelected(json.cards[0].id)
          setOrbitSelected(json.cards[0].id)
        }
      })
      .catch(() => setData({
        cards: [],
        summary: { total: 0, verified: 0, selfEntered: 0, verifiedPercent: 0, cardCount: 0, transferPathCount: 0 },
        insights: [],
      }))
  }, [])

  const cards = data?.cards || []
  const summary = data?.summary || { total: 0, verified: 0, selfEntered: 0, verifiedPercent: 0, cardCount: 0, transferPathCount: 0 }
  const selectedCard = cards.find(card => card.id === selected) || cards[0] || null
  const orbitCard = cards.find(card => card.id === orbitSelected) || null
  const shownTotal = verifiedOnly ? summary.verified : summary.total

  async function askCira(question: string) {
    const q = question.trim()
    if (!q || ciraBusy) return
    setCiraOpen(true)
    setCiraDraft('')
    setCmd('')
    setThread(prev => [...prev, { role: 'user', text: q }])
    setCiraBusy(true)
    try {
      const res = await authedFetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          history: thread.slice(-6).map(item => ({ role: item.role === 'user' ? 'user' : 'assistant', content: item.text })),
        }),
      })
      const json = await res.json().catch(() => ({}))
      setThread(prev => [...prev, { role: 'ai', text: json.message || 'CIRA could not prepare an answer right now.' }])
    } catch {
      setThread(prev => [...prev, { role: 'ai', text: 'CIRA could not prepare an answer right now.' }])
    } finally {
      setCiraBusy(false)
    }
  }

  async function loadSpend(nextAmount = amount, nextMerchant = merchant) {
    if (!(nextAmount > 0) || spendLoading) return
    setSpendLoading(true)
    const category = nextMerchant === 'MakeMyTrip' ? 'travel' : nextMerchant === 'Tax payment' ? 'utilities' : 'shopping'
    try {
      const res = await authedFetch('/api/cockpit/spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: nextAmount, merchant: nextMerchant, category }),
      })
      const json = await res.json()
      setSpendRows(Array.isArray(json.cards) ? json.cards : [])
    } catch {
      setSpendRows([])
    } finally {
      setSpendLoading(false)
    }
  }

  useEffect(() => {
    if (mode !== 'card') return
    const timer = window.setTimeout(() => { void loadSpend() }, 300)
    return () => window.clearTimeout(timer)
  }, [mode, amount, merchant])

  async function loadTrip() {
    if (tripLoading) return
    setTripLoading(true)
    setTripOpen(false)
    setConciergeState('')
    try {
      const date = plusDays(21)
      const res = await authedFetch('/api/flights/fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: 'BLR', to: 'SIN', date_from: date, date_to: date, cash_date: date, cabin: 'economy' }),
      })
      const json = await res.json()
      const flights = Array.isArray(json.flights) ? json.flights : []
      const row = flights.find((flight: any) => flight.decision?.searchSummary?.bestPath) || flights[0] || null
      setTripRow(row)
    } catch {
      setTripRow(null)
    } finally {
      setTripLoading(false)
    }
  }

  useEffect(() => {
    if (mode === 'trip' && !tripRow && !tripLoading) void loadTrip()
  }, [mode])

  async function loadHotel() {
    if (hotelLoading) return
    setHotelLoading(true)
    try {
      const checkin = plusDays(30)
      const checkout = plusDays(33)
      const [cashRes, loyaltyRes] = await Promise.allSettled([
        authedFetch('/api/hotels/search', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination: 'Singapore', checkin, checkout, adults: 2, rooms: 1, limit: 12 }),
        }).then(async res => ({ ok: res.ok, data: await res.json().catch(() => ({})) })),
        authedFetch('/api/hotels/award-discovery', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ destination: 'Singapore', checkInDate: checkin, checkOutDate: checkout, adults: 2 }),
        }).then(async res => ({ ok: res.ok || res.status === 503, data: await res.json().catch(() => ({})) })),
      ])
      const cashData: any = cashRes.status === 'fulfilled' ? cashRes.value.data : {}
      const loyaltyData: any = loyaltyRes.status === 'fulfilled' ? loyaltyRes.value.data : {}
      setHotelCash((cashData.offers || cashData.hotels || [])[0] || null)
      setHotelLoyalty((loyaltyData.properties || [])[0] || null)
    } finally {
      setHotelLoading(false)
    }
  }

  useEffect(() => {
    if (mode === 'hotel' && !hotelLoading && !hotelCash && !hotelLoyalty) void loadHotel()
  }, [mode])

  async function passToConcierge() {
    if (!tripRow || conciergeState) return
    setConciergeState('Creating case…')
    try {
      const ranked = rankWalletOptions(tripRow.redemption || [])
      const request = buildFlightConciergeRequest(tripRow, ranked, tripRow.bestOption || null)
      const res = await authedFetch('/api/concierge/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          context: request.context || 'HNI',
          currency: request.currency || 'INR',
          contactChannel: request.contactChannel || 'BOTH',
          notes: request.notes || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error('case failed')
      setConciergeState('Concierge case created')
    } catch {
      setConciergeState('Could not create case')
    }
  }

  function setIntent(intent: string) {
    if (intent === 'statement') setMode('statement')
    else if (intent === 'redeem') setMode('redeem')
    else if (intent === 'spend') setMode('card')
    else if (intent === 'cira') setCiraOpen(true)
    else if (intent === 'wallet') router.push('/wallet')
  }

  const tripSummary = tripRow?.decision?.searchSummary
  const tripPath = tripSummary?.bestPath
  const tripCash = tripRow?.price > 0 ? '₹' + fmt(tripRow.price) : (moneyMinor(tripSummary?.cash?.amountMinor, tripSummary?.cash?.currency || 'INR') || 'Not returned')
  const tripPoints = pathAmount(tripPath) || (tripRow?.award?.mileageCost ? fmt(tripRow.award.mileageCost) + ' ' + (tripRow.award.program || 'award') + ' miles' : 'No safe points price')
  const tripVerdict = tripSummary?.verdictLabel || (tripSummary?.verdict === 'VERIFY_AWARD' ? 'Check award first' : tripSummary?.verdict === 'PAY_CASH' ? 'Pay cash' : 'Compare before booking')
  const steps = tripSteps(tripRow)

  return (
    <div className="ciq-cockpit">
      <div className="cq-shell">
        <aside className="cq-rail">
          <Link className="cq-logo" href="/dashboard">IQ</Link>
          <nav className="cq-nav" aria-label="CreditIQ cockpit">
            <Link className="active" href="/dashboard"><span>⌂</span><span>Home</span></Link>
            <Link href="/wallet"><span>▣</span><span>Wallet</span></Link>
            <button type="button" onClick={() => setMode('card')}><span>ϟ</span><span>Spend</span></button>
            <button type="button" onClick={() => setMode('trip')}><span>✈</span><span>Travel</span></button>
            <button type="button" onClick={() => setCiraOpen(true)}><span>✦</span><span>CIRA</span></button>
          </nav>
          <div className="cq-avatar">{firstName.slice(0, 1).toUpperCase()}</div>
        </aside>

        <main className="cq-main">
          <div className="cq-top">
            <div className="cq-wallet-chips">
              {cards.slice(0, 3).map((card, index) => (
                <button className="cq-wallet-chip" key={card.id} onClick={() => { setSelected(card.id); setOrbitSelected(card.id) }}>
                  <span className="cq-dot" style={{ background: card.verified ? '#2E7D4F' : '#B9BCC6' }} />
                  <span>{shortName(card.cardName)}</span>
                  <b>{fmt(card.points)}</b>
                </button>
              ))}
              <button className="cq-wallet-chip" onClick={() => setVerifiedOnly(value => !value)}>
                {verifiedOnly ? 'All points' : 'Verified only'} · {fmt(shownTotal)}
              </button>
            </div>

            <section className="cq-hero">
              <div className="cq-eyebrow">CreditIQ cockpit · {summary.verifiedPercent}% verified</div>
              <h1>What do you want to do with your money or points today?</h1>
              <form className="cq-cmd" onSubmit={event => { event.preventDefault(); void askCira(cmd || 'Can my points cover Singapore?') }}>
                <span style={{ color: '#B08D57' }}>✦</span>
                <input value={cmd} onChange={event => setCmd(event.target.value)} placeholder="Ask CIRA anything… “Can I fly business class with my points?”" />
                <button type="submit">Ask CIRA</button>
              </form>
              <div className="cq-suggest">
                <button className={'cq-chip ' + (mode === 'trip' ? 'active' : '')} onClick={() => setMode('trip')}>Plan a trip with my points</button>
                <button className={'cq-chip ' + (mode === 'card' ? 'active' : '')} onClick={() => setMode('card')}>Which card should I use?</button>
                <button className={'cq-chip ' + (mode === 'redeem' ? 'active' : '')} onClick={() => setMode('redeem')}>Find my best redemption</button>
                <button className={'cq-chip ' + (mode === 'statement' ? 'active' : '')} onClick={() => setMode('statement')}>Analyse my statement</button>
                <button className={'cq-chip ' + (mode === 'hotel' ? 'active' : '')} onClick={() => setMode('hotel')}>Book a hotel with points</button>
              </div>
            </section>

            <section className="cq-work">
              <div>
                {mode === 'trip' && (
                  <div className="cq-panel-dark">
                    <div className="cq-kicker">Your smartest move right now</div>
                    <div className="cq-title">{tripLoading ? 'Checking your wallet against live travel inventory…' : tripRow ? 'BLR → Singapore · ' + tripVerdict : 'No safe live trip result returned yet.'}</div>
                    {tripRow && (
                      <>
                        <div className="cq-trip-grid">
                          <div><div className="cq-mini-label">Cash</div><div className="cq-mini-value">{tripCash}</div></div>
                          <div><div className="cq-mini-label">Best wallet path</div><div className="cq-mini-value">{tripPoints}</div></div>
                          <div><div className="cq-mini-label">CreditIQ verdict</div><div className="cq-mini-value">{tripVerdict}</div></div>
                        </div>
                        {tripOpen && (
                          <div className="cq-path">
                            <div className="cq-kicker">Redemption path</div>
                            {steps.map((step, index) => <div className="cq-step" key={index}><b>{index + 1}</b><div>{step}<span>{index === 0 && tripSummary?.requiresLiveReverification ? 'Live verification is required before an irreversible transfer.' : ''}</span></div></div>)}
                          </div>
                        )}
                        <div className="cq-actions">
                          <span style={{ color: '#C9A86A', fontSize: 13 }}>● CreditIQ verdict · {tripVerdict}</span>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button className="cq-btn" onClick={() => void askCira('Explain my BLR to Singapore redemption path and tell me exactly what to verify before booking.')}>Ask CIRA</button>
                            <button className="cq-btn" onClick={() => void passToConcierge()}>{conciergeState || 'Pass to Concierge'}</button>
                            <button className="cq-btn gold" onClick={() => setTripOpen(value => !value)}>{tripOpen ? 'Hide path' : 'See redemption path →'}</button>
                          </div>
                        </div>
                      </>
                    )}
                    {!tripLoading && !tripRow && <button className="cq-btn gold" onClick={() => void loadTrip()}>Try live search again</button>}
                  </div>
                )}

                {mode === 'card' && (
                  <div className="cq-panel">
                    <div className="cq-kicker">Spend Smart</div>
                    <div className="cq-title">You're spending <u>₹{fmt(amount)}</u> at {merchant}.</div>
                    <div className="cq-spend-controls">
                      <label className="cq-amount"><span style={{ color: '#6B6F7B' }}>₹</span><input type="number" min="0" value={amount} onChange={event => setAmount(Math.max(0, Number(event.target.value) || 0))} /></label>
                      {['Apple', 'MakeMyTrip', 'Amazon', 'Tax payment'].map(name => <button key={name} className={'cq-chip ' + (merchant === name ? 'active' : '')} onClick={() => setMerchant(name)}>{name}</button>)}
                    </div>
                    <div className="cq-spend-grid">
                      {spendLoading && <span className="cq-loading">Comparing cards in your wallet…</span>}
                      {!spendLoading && spendRows.slice(0, 3).map((row, index) => (
                        <div className={'cq-spend-card ' + (index === 0 ? 'best' : '')} key={row.id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 13, color: '#6B6F7B' }}>{shortName(row.cardName)}</span><span style={{ width: 20, height: 14, borderRadius: 3, background: row.color }} /></div>
                          <strong>₹{fmt(row.value)}</strong>
                          <div style={{ fontSize: 12, color: index === 0 ? '#B08D57' : '#6B6F7B', marginTop: 4 }}>{index === 0 ? 'Recommended' : 'estimated reward value'}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ color: '#6B6F7B', fontSize: 13, marginTop: 18 }}>Estimated from CreditIQ's curated earn-rate data for cards you actually hold. Verify merchant exclusions and current issuer terms before paying.</div>
                  </div>
                )}

                {mode === 'redeem' && (
                  <div className="cq-panel">
                    <div className="cq-kicker">Best redemption</div>
                    <div className="cq-title">{cards.length ? 'Explore the real transfer and portal paths in your wallet.' : 'No points to redeem yet.'}</div>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {cards.map((card, index) => (
                        <button className="cq-redeem-row" key={card.id} onClick={() => { setSelected(card.id); setOrbitSelected(card.id) }}>
                          <span style={{ width: 34, height: 24, borderRadius: 5, background: cardGradient(card.color, index), flex: '0 0 auto' }} />
                          <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}><b>{shortName(card.cardName)} → {card.partners.slice(0, 2).join(' / ') || 'issuer redemption'}</b><span style={{ display: 'block', fontSize: 13, color: '#6B6F7B', marginTop: 2 }}>{card.bestUse}</span></span>
                          <span style={{ color: '#B08D57' }}>→</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {mode === 'statement' && (
                  <div className="cq-panel cq-statement">
                    <div className="cq-kicker">Statement Truth</div>
                    <div className="cq-title">Drop a statement PDF to replace estimates with verified balances.</div>
                    <div style={{ color: '#6B6F7B', maxWidth: 440, margin: '0 auto 20px' }}>{summary.selfEntered ? fmt(summary.selfEntered) + ' of your ' + fmt(summary.total) + ' points are self-entered.' : 'Your currently tracked point balances are verified.'}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Link className="cq-btn dark" href="/upload-statement">Upload statement</Link>
                      <button className="cq-btn" onClick={() => void askCira('What exactly do you read from my credit card statement and how do you verify my points?')}>What does CIRA read from it?</button>
                    </div>
                  </div>
                )}

                {mode === 'hotel' && (
                  <div className="cq-panel">
                    <div className="cq-kicker">Hotel with points</div>
                    <div className="cq-title">Singapore, 3 nights — cash or points?</div>
                    {hotelLoading && <div className="cq-loading">Checking live cash hotels and loyalty programmes…</div>}
                    {!hotelLoading && (
                      <div style={{ display: 'grid', gap: 10 }}>
                        {hotelLoyalty && <div className="cq-hotel-row" style={{ borderColor: '#B08D57', background: '#FBF6EC' }}><span style={{ width: 34, height: 24, borderRadius: 5, background: '#1C2B4B' }} /><span style={{ flex: 1 }}><b>{hotelLoyalty.name}</b><span style={{ display: 'block', fontSize: 13, color: '#6B6F7B' }}>{hotelLoyalty.programmeId || 'Loyalty programme'} · {hotelLoyalty.observedPointsMedian ? '~' + fmt(hotelLoyalty.observedPointsMedian) + ' observed points' : 'live points verification required'}</span></span><span style={{ color: '#B08D57', fontSize: 12 }}>Verify first</span></div>}
                        {hotelCash && <div className="cq-hotel-row"><span style={{ width: 34, height: 24, borderRadius: 5, background: '#9AA3B3' }} /><span style={{ flex: 1 }}><b>{hotelCash.hotelName || hotelCash.name}</b><span style={{ display: 'block', fontSize: 13, color: '#6B6F7B' }}>Live cash option · {hotelCash.totalPrice != null ? (hotelCash.currency || 'INR') + ' ' + fmt(hotelCash.totalPrice) : 'open provider for price'}</span></span></div>}
                        {!hotelLoyalty && !hotelCash && <div className="cq-loading">No production hotel result returned. CreditIQ will not substitute test inventory.</div>}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
                      <button className="cq-btn dark" onClick={() => void askCira('Compare my best Singapore hotel options using cash and points. Keep live availability separate from cached points observations.')}>Compare with CIRA →</button>
                      <Link className="cq-btn" href="/hotels">Open full hotel search</Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="cq-live">
                <small>Live from your wallet</small>
                {(data?.insights || []).map((insight, index) => (
                  <button className="cq-insight" key={index} onClick={() => setIntent(insight.intent)}>
                    <span><small>{insight.kicker}</small><strong>{insight.action}</strong></span><span style={{ color: '#B08D57', fontSize: 18 }}>→</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="cq-lower">
              <div>
                <div className="cq-section-head"><span>Your wallet · tap a card</span><Link href="/wallet">View wallet →</Link></div>
                {cards.length ? (
                  <>
                    <div className="cq-deck">
                      {cards.slice(0, 3).map((card, index) => {
                        const isSelected = card.id === selected
                        const nonSelectedIndex = cards.filter(item => item.id !== selected).findIndex(item => item.id === card.id)
                        const stackClass = isSelected ? 'selected' : nonSelectedIndex === 0 ? 'stack1' : 'stack2'
                        return (
                          <button className={'cq-card ' + stackClass} key={card.id} onClick={() => { setSelected(card.id); setOrbitSelected(card.id) }} style={{ background: cardGradient(card.color, index) }}>
                            <span style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, letterSpacing: '.08em', color: 'rgba(255,255,255,.85)' }}><span>{card.bank.toUpperCase()}</span><span style={{ color: '#E9D7AC' }}>{shortName(card.cardName)}</span></span>
                            <span className="cq-card-chip" />
                            <span className="cq-card-bottom"><span style={{ letterSpacing: '.12em' }}>•••• {card.last4 || '—'}</span><span style={{ fontFamily: 'Georgia,serif', fontSize: 24 }}>{fmt(card.points)}</span></span>
                          </button>
                        )
                      })}
                    </div>
                    {selectedCard && (
                      <div className="cq-card-detail">
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><h3>{selectedCard.cardName}</h3><span style={{ color: selectedCard.verified ? '#2E7D4F' : '#8A8F9E', fontSize: 13 }}>● {selectedCard.verified ? 'Verified' : 'Self-entered'}</span></div>
                        <div style={{ fontFamily: 'Georgia,serif', fontSize: 30, marginTop: 4 }}>{fmt(selectedCard.points)} <span style={{ font: '13px Avenir, sans-serif', color: '#6B6F7B' }}>{selectedCard.pointsCurrency}</span></div>
                        <div style={{ color: '#6B6F7B', marginTop: 8 }}>Best use: {selectedCard.bestUse}</div>
                        <div className="cq-tags">{selectedCard.partners.map(partner => <span className="cq-tag" key={partner}>{partner}</span>)}</div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}><button className="cq-btn dark" onClick={() => setMode('card')}>Use this card</button><button className="cq-btn" onClick={() => void askCira('What is the best use of my ' + selectedCard.cardName + ' points right now?')}>Ask CIRA about it</button></div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="cq-panel cq-statement"><div className="cq-title">No cards yet</div><div style={{ color: '#6B6F7B', marginBottom: 18 }}>Add a card or upload a statement and CIRA starts working immediately.</div><div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}><Link className="cq-btn dark" href="/wallet">Add a card</Link><Link className="cq-btn" href="/upload-statement">Upload statement</Link></div></div>
                )}
              </div>

              <div>
                <div className="cq-section-head"><span>Rewards orbit · where your points can go</span><button onClick={() => setOrbitSelected(null)}>Reset</button></div>
                <div className="cq-orbit">
                  <div className="cq-orbit-ring1" /><div className="cq-orbit-ring2" />
                  <div className="cq-orbit-center"><strong>{fmt(summary.total)}</strong><span style={{ fontSize: 11, color: '#6B6F7B', marginTop: 5 }}>reward points</span><div style={{ marginTop: 8, height: 3, width: 90, background: '#EBE6DB' }}><div style={{ width: summary.verifiedPercent + '%', height: '100%', background: '#B08D57' }} /></div><span style={{ fontSize: 11, color: '#6B6F7B', marginTop: 5 }}>{summary.verifiedPercent}% verified</span></div>
                  {cards.slice(0, 3).map((card, index) => <button key={card.id} className={'cq-node ' + (orbitSelected === card.id ? 'selected' : '')} onClick={() => setOrbitSelected(card.id)}><span style={{ width: 26, height: 18, borderRadius: 4, background: cardGradient(card.color, index) }} /><span style={{ textAlign: 'left' }}><b style={{ display: 'block', fontSize: 12 }}>{shortName(card.cardName)}</b><span style={{ fontSize: 11, color: '#6B6F7B' }}>{fmt(card.points)} <i className="cq-dot" style={{ background: card.verified ? '#2E7D4F' : '#B9BCC6' }} /></span></span></button>)}
                  {orbitCard && <div className="cq-programmes">{orbitCard.partners.slice(0, 4).map(partner => <span className="cq-programme" key={partner}>{partner}</span>)}</div>}
                  <div className="cq-orbit-note">{orbitCard ? shortName(orbitCard.cardName) + ' → ' + (orbitCard.partners.join(' · ') || 'no mapped transfer partners') : (cards.length ? 'Tap a card to see its mapped redemption rails.' : 'Add a card to build your orbit.')}</div>
                </div>
              </div>
            </section>
          </div>

          <button className="cq-cirabar" onClick={() => setCiraOpen(true)}><span>✦</span><span>Ask CIRA anything…</span><b>Open</b></button>
        </main>
      </div>

      {ciraOpen && (
        <>
          <div className="cq-overlay" onClick={() => setCiraOpen(false)} />
          <aside className="cq-cira">
            <div className="cq-cira-head"><div style={{ display: 'flex', gap: 9, alignItems: 'center' }}><span style={{ width: 28, height: 28, borderRadius: 8, background: '#C9A86A', color: '#12151F', display: 'grid', placeItems: 'center' }}>✦</span><b style={{ fontFamily: 'Georgia,serif', fontSize: 22 }}>CIRA</b><span style={{ color: '#9EA2AE', fontSize: 12 }}>rewards concierge</span></div><button className="cq-btn" style={{ background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,.12)' }} onClick={() => setCiraOpen(false)}>×</button></div>
            <div className="cq-cira-body">
              {!thread.length && <div style={{ color: '#A9ADB8', fontSize: 14 }}>I know your wallet: {fmt(summary.total)} points across {summary.cardCount} cards, {summary.verifiedPercent}% verified. Ask about a purchase, route or programme.</div>}
              {!thread.length && ['Can I fly business class with my points?', 'Best card for my next tax payment?', 'Should I transfer my HDFC points?'].map(prompt => <button className="cq-cira-prompt" key={prompt} onClick={() => void askCira(prompt)}>{prompt}</button>)}
              {thread.map((item, index) => <div className={'cq-msg ' + item.role} key={index}>{item.text}</div>)}
              {ciraBusy && <div className="cq-msg ai">Checking your wallet and CreditIQ intelligence…</div>}
            </div>
            <form className="cq-cira-form" onSubmit={event => { event.preventDefault(); void askCira(ciraDraft) }}><input value={ciraDraft} onChange={event => setCiraDraft(event.target.value)} placeholder="Ask CIRA anything…" /><button className="cq-btn gold" type="submit">Ask</button></form>
          </aside>
        </>
      )}
    </div>
  )
}

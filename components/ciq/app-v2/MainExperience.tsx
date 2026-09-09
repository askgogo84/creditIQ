'use client'

import Image from 'next/image'
import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Compass,
  CreditCard,
  Gift,
  Home,
  Hotel,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plane,
  ScanLine,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UserRound,
  WalletCards,
  Zap,
  type LucideIcon,
} from 'lucide-react'

type Tab = 'home' | 'wallet' | 'spend' | 'cira' | 'travel' | 'cards' | 'menu'
type TravelMode = 'flights' | 'hotels' | 'dream'

const nav: Array<[Exclude<Tab, 'spend'>, string, LucideIcon]> = [
  ['home', 'Home', Home],
  ['wallet', 'Wallet', WalletCards],
  ['cira', 'CIRA', Sparkles],
  ['travel', 'Travel', Plane],
  ['cards', 'Cards', CreditCard],
  ['menu', 'Menu', MoreHorizontal],
]

const cardArt: Record<string, string> = {
  'HDFC Infinia Metal': '/card-art/hdfc-infinia.webp',
  'Axis Atlas': '/card-art/axis-atlas.webp',
  'AmEx Platinum Travel': '/card-art/amex-platinum-travel.webp',
}

export function MainExperience({ onReset }: { onReset: () => void }) {
  const [tab, setTab] = useState<Tab>('home')
  const [showAlerts, setShowAlerts] = useState(false)

  return (
    <div className="ciq-v2-app-shell ciq-luxe-shell">
      <div className="ciq-v2-app-bg" />
      <header className="ciq-v2-app-header ciq-luxe-header">
        <div>
          <p className="ciq-v2-kicker">GOOD MORNING, GOGO</p>
          <h1>{titleFor(tab)}</h1>
        </div>
        <button className="ciq-v2-iconbtn ciq-v2-bell" onClick={() => setShowAlerts(!showAlerts)} aria-label="Smart alerts">
          <Bell size={20} /><i />
        </button>
      </header>

      {showAlerts && <Alerts />}

      <main className="ciq-v2-app-content">
        {tab === 'home' && <HomeScreen onNavigate={setTab} />}
        {tab === 'wallet' && <WalletScreen />}
        {tab === 'spend' && <SpendSmartScreen onBack={() => setTab('home')} />}
        {tab === 'cira' && <CiraScreen />}
        {tab === 'travel' && <TravelScreen />}
        {tab === 'cards' && <CardsScreen />}
        {tab === 'menu' && <MenuScreen onReset={onReset} onNavigate={setTab} />}
      </main>

      <nav className="ciq-v2-bottomnav ciq-luxe-bottomnav" aria-label="CreditIQ main navigation">
        {nav.map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)} className={`${tab === id ? 'active' : ''} ${id === 'cira' ? 'cira' : ''}`}>
            <span><Icon size={id === 'cira' ? 23 : 20} /></span>
            <small>{label}</small>
          </button>
        ))}
      </nav>
    </div>
  )
}

function titleFor(tab: Tab) {
  return ({
    home: 'Smarter today. Brighter tomorrow.',
    wallet: 'Your reward universe.',
    spend: 'Spend smart.',
    cira: 'Ask. Plan. Go further.',
    travel: 'Smarter ways to get there.',
    cards: 'Find your next card.',
    menu: 'More control. More clarity.',
  } satisfies Record<Tab, string>)[tab]
}

function HomeScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [merchant, setMerchant] = useState('Swiggy')
  const bestCard = merchant === 'Marriott' ? 'HDFC Infinia Metal' : merchant === 'Amazon' ? 'AmEx Platinum Travel' : 'Axis Atlas'
  const cardImage = cardArt[bestCard]

  return (
    <div className="ciq-v2-screen-stack ciq-luxe-screen-stack">
      <section className="ciq-v2-hero-dashboard ciq-luxe-home-hero">
        <div className="ciq-luxe-photo-overlay" />
        <div className="ciq-v2-hero-top">
          <span className="ciq-v2-live-pill"><i /> LIVE WALLET</span>
          <button onClick={() => onNavigate('wallet')}>151.7K pts <ChevronRight size={15} /></button>
        </div>
        <div className="ciq-v2-hero-copy">
          <p>Today’s highest-impact move</p>
          <h2>Use Axis Atlas for your next food order.</h2>
          <span>Projected reward value <b>₹185</b> on a ₹1,850 spend.</span>
        </div>
        <div className="ciq-luxe-hero-cardart">
          <Image src="/card-art/axis-atlas.webp" alt="Axis Atlas" width={190} height={120} priority />
          <span>4.2× demo fit</span>
        </div>
        <div className="ciq-v2-hero-actions">
          <button onClick={() => onNavigate('cira')}><Sparkles size={16} /> Why this card?</button>
          <button onClick={() => onNavigate('spend')}><ScanLine size={16} /> Check another spend</button>
        </div>
      </section>

      <section>
        <div className="ciq-v2-section-head">
          <div><p className="ciq-v2-kicker">QUICK CHECK</p><h3>What are you paying for?</h3></div>
          <button onClick={() => onNavigate('spend')} aria-label="Open Spend Smart"><Search size={17} /></button>
        </div>
        <div className="ciq-v2-merchant-strip ciq-luxe-merchant-strip">
          {['Swiggy', 'Amazon', 'Marriott', 'MakeMyTrip'].map((m, i) => (
            <button key={m} onClick={() => setMerchant(m)} className={merchant === m ? 'active' : ''}>
              <span>{['S', 'A', 'M', '✈'][i]}</span><small>{m}</small>
            </button>
          ))}
        </div>
        <div className="ciq-v2-swipe-card ciq-luxe-best-card-row">
          <div className="ciq-luxe-best-card-thumb"><Image src={cardImage} alt={bestCard} width={92} height={58} /></div>
          <div className="ciq-luxe-best-card-copy">
            <span>BEST CARD FOR {merchant.toUpperCase()}</span>
            <h4>{bestCard}</h4>
            <p>Exact-card rules · projected reward · checkout verification</p>
          </div>
          <div className="ciq-v2-score-ring"><b>{merchant === 'Marriott' ? '96' : '92'}</b><span>fit</span></div>
        </div>
      </section>

      <section className="ciq-v2-bento ciq-luxe-bento">
        <button onClick={() => onNavigate('travel')} className="large domestic-tile">
          <Plane /><span>Domestic demo route</span><b>BLR → DEL</b><small>India-first investor flow</small><ArrowRight />
        </button>
        <button onClick={() => onNavigate('wallet')}><TrendingUp /><span>Wallet value</span><b>₹1.50L</b><small>demo estimate</small></button>
        <button><Gift /><span>Expiring soon</span><b>8,500 pts</b><small>in 43 days</small></button>
      </section>

      <section>
        <div className="ciq-v2-section-head"><div><p className="ciq-v2-kicker">FOR YOU TODAY</p><h3>Worth your attention</h3></div><button>See all</button></div>
        <Feed icon={Hotel} tone="gold" title="Goa stay opportunity" text="Compare cash vs hotel points for a 3-night domestic stay." />
        <Feed icon={Target} tone="green" title="Your Atlas milestone is 72% complete" text="₹28,000 spend to next milestone · 18 days left." />
        <Feed icon={Plane} tone="blue" title="BLR → DEL demo flow is ready to review" text="Domestic flight cards show cash, points and verification states separately." />
      </section>
    </div>
  )
}

function SpendSmartScreen({ onBack }: { onBack: () => void }) {
  const [merchant, setMerchant] = useState('Starbucks')
  const [amount, setAmount] = useState('1200')
  const [checked, setChecked] = useState(true)

  return (
    <div className="ciq-v2-screen-stack ciq-luxe-screen-stack">
      <button className="ciq-luxe-back" onClick={onBack}><ArrowLeft size={17} /> Back to Home</button>
      <section className="ciq-luxe-spend-hero">
        <p className="ciq-v2-kicker">SPEND SMART</p>
        <h2>Get the best card for every spend.</h2>
        <div className="ciq-luxe-spend-tabs"><button className="active">Single purchase</button><button>Monthly spend</button><button>Travel booking</button></div>
        <label><span>Where are you spending?</span><input value={merchant} onChange={e => setMerchant(e.target.value)} /></label>
        <label><span>Enter amount</span><input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" /></label>
        <button className="ciq-v2-primary" onClick={() => setChecked(true)}>Find best card <ArrowRight size={17} /></button>
      </section>

      {checked && <>
        <DecisionCard title="Best card for this spend" card="HDFC Infinia Metal" image="/card-art/hdfc-infinia.webp" reward="720 points" value="₹360 est. value" badge="Recommended" />
        <DecisionCard title="Second best option" card="AmEx Platinum Travel" image="/card-art/amex-platinum-travel.webp" reward="480 points" value="4× demo earn" />
        <section className="ciq-luxe-why-card"><h3>Why this card?</h3><p>✓ Highest demo reward for this merchant/category</p><p>✓ Keeps projected value separate from issuer-confirmed value</p><p>✓ Exact-card logic only — no bank-level inheritance</p></section>
      </>}
    </div>
  )
}

function DecisionCard({ title, card, image, reward, value, badge }: { title: string; card: string; image: string; reward: string; value: string; badge?: string }) {
  return <section className="ciq-luxe-decision-card">
    <div className="ciq-luxe-decision-title"><span>{title}</span>{badge && <b>{badge}</b>}</div>
    <div className="ciq-luxe-decision-main"><Image src={image} alt={card} width={112} height={70} /><div><strong>{card}</strong><span>{reward}</span><small>{value}</small></div><ChevronRight size={18} /></div>
  </section>
}

function WalletScreen() {
  const [selected, setSelected] = useState(0)
  const cards = [
    { bank: 'HDFC', name: 'Infinia Metal', pts: '68,500', value: '₹68.5K', grade: 'A', image: '/card-art/hdfc-infinia.webp' },
    { bank: 'Axis', name: 'Atlas', pts: '31,200', value: '₹42.1K', grade: 'A-', image: '/card-art/axis-atlas.webp' },
    { bank: 'AmEx', name: 'Platinum Travel', pts: '52,000', value: '₹39.0K', grade: 'B+', image: '/card-art/amex-platinum-travel.webp' },
  ]
  const c = cards[selected]
  return <div className="ciq-v2-screen-stack ciq-luxe-screen-stack">
    <section className="ciq-v2-wallet-summary ciq-luxe-wallet-summary"><div><span>TOTAL TRACKED VALUE</span><b>₹1,49,600</b><small>151,700 points across 3 cards</small></div><div className="ciq-v2-wallet-ring"><strong>87</strong><span>wallet IQ</span></div></section>
    <div className="ciq-v2-card-carousel ciq-luxe-card-carousel">
      {cards.map((card, i) => <button key={card.name} onClick={() => setSelected(i)} className={`ciq-luxe-real-card ${selected === i ? 'selected' : ''}`}><Image src={card.image} alt={card.name} width={240} height={150} /><span>{card.name}</span></button>)}
    </div>
    <section className="ciq-v2-card-detail-panel ciq-luxe-card-detail">
      <div className="ciq-v2-section-head"><div><p className="ciq-v2-kicker">{c.bank.toUpperCase()}</p><h3>{c.name}</h3></div><span className="ciq-v2-grade">{c.grade}</span></div>
      <div className="ciq-v2-metric-row"><div><span>Balance</span><b>{c.pts}</b></div><div><span>Best demo value</span><b>{c.value}</b></div><div><span>Renewal</span><b>74 days</b></div></div>
      <div className="ciq-v2-healthbar"><span style={{ width: selected === 0 ? '91%' : selected === 1 ? '86%' : '72%' }} /></div>
      <div className="ciq-v2-benefit-grid"><button><Gift /><b>Benefits</b><small>5 tracked</small></button><button><Target /><b>Milestones</b><small>2 active</small></button><button><Plane /><b>Transfers</b><small>6 paths</small></button><button><BadgeCheck /><b>Verify</b><small>1 item</small></button></div>
    </section>
    <section><div className="ciq-v2-section-head"><h3>Loyalty accounts</h3><button>Manage</button></div><Loyalty name="KrisFlyer" value="42,300" expiry="No expiry alert" /><Loyalty name="Marriott Bonvoy" value="18,900" expiry="43 days to activity review" /><Loyalty name="Air India Maharaja" value="12,500" expiry="Tracked" /></section>
  </div>
}

function CiraScreen() {
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'cira'; text: string }>>([
    { role: 'cira', text: 'What are you deciding? I can compare a purchase, explain your points, or build a domestic or international travel path.' },
  ])
  const send = (text = draft) => {
    if (!text.trim()) return
    setMessages(m => [...m, { role: 'user', text: text.trim() }, { role: 'cira', text: 'I would compare your exact-card rules, wallet balance and source authority first, then show projected and executable choices separately.' }])
    setDraft('')
  }
  return <div className="ciq-v2-cira-screen ciq-luxe-cira-screen">
    <section className="ciq-v2-cira-hero ciq-luxe-cira-hero">
      <div className="ciq-v2-cira-orbit"><Sparkles size={28} /><i /><i /><i /></div>
      <p className="ciq-v2-kicker">CIRA · PERSONAL CARD & TRAVEL INTELLIGENCE</p>
      <h2>Ask. Plan. Go further.</h2>
      <div className="ciq-v2-prompt-chips">{['Best card for ₹25K?', 'Plan BLR → DEL', 'Maximise my points', 'Goa hotel on points?'].map(x => <button key={x} onClick={() => send(x)}>{x}</button>)}</div>
    </section>
    <div className="ciq-v2-chat">{messages.map((m, i) => <div key={i} className={m.role}><span>{m.text}</span></div>)}</div>
    <div className="ciq-v2-chatbox"><input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Ask CIRA anything…" onKeyDown={e => e.key === 'Enter' && send()} /><button onClick={() => send()}><Send size={17} /></button></div>
  </div>
}

function TravelScreen() {
  const [mode, setMode] = useState<TravelMode>('flights')
  const [flightTo, setFlightTo] = useState('DEL')
  const [hotelCity, setHotelCity] = useState('Goa')
  const [searched, setSearched] = useState(false)

  return <div className="ciq-v2-screen-stack ciq-luxe-screen-stack">
    <div className="ciq-v2-segment ciq-luxe-segment">{(['flights', 'hotels', 'dream'] as const).map(x => <button key={x} onClick={() => { setMode(x); setSearched(false) }} className={mode === x ? 'active' : ''}>{x === 'dream' ? 'Dream Trip' : x[0].toUpperCase() + x.slice(1)}</button>)}</div>

    {mode === 'flights' && <>
      <section className="ciq-v2-travel-search ciq-luxe-travel-search flights">
        <div className="ciq-luxe-photo-overlay" />
        <div className="ciq-luxe-demo-badge">INDIA DOMESTIC · DEMO</div>
        <div className="ciq-v2-route"><div><small>FROM</small><b>BLR</b><span>Bengaluru</span></div><Plane /><div><small>TO</small><b>{flightTo}</b><span>{cityForAirport(flightTo)}</span></div></div>
        <div className="ciq-luxe-route-chips">{['DEL', 'BOM', 'GOI', 'HYD', 'MAA'].map(code => <button key={code} className={flightTo === code ? 'active' : ''} onClick={() => setFlightTo(code)}>{code}</button>)}</div>
        <div className="ciq-v2-travel-options"><button><CalendarDays /> 20 Sep</button><button>Economy</button><button>1 adult</button></div>
        <button className="ciq-v2-primary" onClick={() => setSearched(true)}>Search domestic flights <Search size={17} /></button>
      </section>
      {searched && <DomesticFlightResults to={flightTo} />}
    </>}

    {mode === 'hotels' && <>
      <section className="ciq-v2-travel-search ciq-luxe-travel-search hotels">
        <div className="ciq-luxe-photo-overlay" />
        <div className="ciq-luxe-demo-badge">INDIA STAYS · DEMO</div>
        <div className="ciq-v2-hotel-search"><MapPin /><div><small>DESTINATION</small><b>{hotelCity}, India</b></div></div>
        <div className="ciq-luxe-route-chips">{['Goa', 'Mumbai', 'Delhi', 'Bengaluru'].map(city => <button key={city} className={hotelCity === city ? 'active' : ''} onClick={() => setHotelCity(city)}>{city}</button>)}</div>
        <div className="ciq-v2-travel-options"><button>20–23 Sep</button><button>2 guests</button></div>
        <button className="ciq-v2-primary" onClick={() => setSearched(true)}>Search domestic stays <Search size={17} /></button>
      </section>
      {searched && <DomesticHotelResults city={hotelCity} />}
    </>}

    {mode === 'dream' && <section className="ciq-v2-dream ciq-luxe-dream"><div className="ciq-v2-dream-glow" /><Sparkles /><p className="ciq-v2-kicker">DREAM TRIP</p><h2>“Give me 4 nights in Goa using my points, with a cash fallback.”</h2><p>CIRA starts from the real wallet, then separates live inventory, projected transfers and executable booking options.</p><button>Build my trip <ArrowRight /></button></section>}
  </div>
}

function DomesticFlightResults({ to }: { to: string }) {
  const rows = [
    { airline: 'IndiGo', time: '08:00 → 10:45', cash: '₹5,980', points: '3,200 pts', note: 'cash + demo points view' },
    { airline: 'Air India', time: '09:15 → 12:00', cash: '₹6,450', points: '3,500 pts', note: 'award guide / verify inventory' },
    { airline: 'Akasa Air', time: '14:20 → 17:10', cash: '₹5,750', points: '—', note: 'cash-only demo path' },
  ]
  return <section className="ciq-luxe-results"><div className="ciq-v2-section-head"><div><p className="ciq-v2-kicker">BLR → {to}</p><h3>Domestic flight results</h3></div><span className="ciq-luxe-demo-pill">DEMO DATA</span></div>{rows.map(row => <button className="ciq-luxe-flight-row" key={row.airline}><div className="ciq-luxe-airline-mark"><Plane size={18} /></div><div><b>{row.airline}</b><span>{row.time}</span><small>{row.note}</small></div><div className="ciq-luxe-price-col"><strong>{row.cash}</strong><span>{row.points}</span></div><ChevronRight size={17} /></button>)}</section>
}

function DomesticHotelResults({ city }: { city: string }) {
  const rows = city === 'Goa'
    ? [
      ['Taj Exotica Resort & Spa', 'Benaulim', '₹18,000', '42,000 pts'],
      ['ITC Grand Goa', 'Cansaulim', '₹15,500', '38,000 pts'],
      ['Novotel Goa Resort', 'Candolim', '₹8,500', '20,000 pts'],
    ]
    : [
      [`Premium ${city} stay`, city, '₹12,500', '30,000 pts'],
      [`Business ${city} hotel`, city, '₹8,900', '—'],
      [`Independent ${city} stay`, city, '₹6,800', 'cash only'],
    ]
  return <section className="ciq-luxe-results"><div className="ciq-v2-section-head"><div><p className="ciq-v2-kicker">{city.toUpperCase()}</p><h3>Domestic stay results</h3></div><span className="ciq-luxe-demo-pill">DEMO DATA</span></div>{rows.map(([name, area, cash, points], i) => <button className="ciq-luxe-hotel-row" key={name}><div className="ciq-luxe-hotel-image"><Hotel size={23} /></div><div className="ciq-luxe-hotel-copy"><b>{name}</b><span><MapPin size={12} /> {area}</span><small>{i === 2 ? 'Independent / cash path' : 'Mapped loyalty path · verify live availability'}</small></div><div className="ciq-luxe-price-col"><strong>{cash}</strong><span>{points}</span></div><ChevronRight size={17} /></button>)}</section>
}

function CardsScreen() {
  const [goal, setGoal] = useState('Travel')
  return <div className="ciq-v2-screen-stack ciq-luxe-screen-stack">
    <section className="ciq-v2-cardfinder-hero ciq-luxe-cardfinder-hero"><p className="ciq-v2-kicker">PERSONALISED CARD FINDER</p><h2>Don’t add another card. Add a capability.</h2><p>CreditIQ scores new cards against what your current wallet already does.</p></section>
    <div className="ciq-v2-goal-pills">{['Travel', 'Cashback', 'Lifestyle', 'Low fee'].map(x => <button key={x} onClick={() => setGoal(x)} className={goal === x ? 'active' : ''}>{x}</button>)}</div>
    <section className="ciq-v2-reco-card ciq-luxe-reco-card"><div className="ciq-v2-reco-score"><b>91</b><span>fit</span></div><div className="ciq-luxe-reco-art"><Image src="/card-art/axis-atlas.webp" alt="Axis Atlas" width={170} height={106} /></div><p className="ciq-v2-kicker">BEST ADDITION FOR {goal.toUpperCase()}</p><h3>Axis Atlas</h3><p>Fills a transfer-flexibility gap without duplicating your strongest premium-card role.</p><div className="ciq-v2-reco-tags"><span>Low overlap</span><span>Strong travel</span><span>Milestone upside</span></div><button>See why it fits <ChevronRight /></button></section>
    <div className="ciq-v2-compare-row"><button><Star /><b>Compare cards</b><small>Fees, earn rates, lounge, transfers</small></button><button><Target /><b>Switch wizard</b><small>Find cards not earning their keep</small></button></div>
  </div>
}

function MenuScreen({ onReset, onNavigate }: { onReset: () => void; onNavigate: (t: Tab) => void }) {
  return <div className="ciq-v2-screen-stack ciq-luxe-screen-stack"><section className="ciq-v2-profile-card ciq-luxe-profile-card"><div className="ciq-v2-avatar">G</div><div><b>Goverdhan M D</b><span>CreditIQ Pro · India</span></div><button><Settings2 /></button></section><section className="ciq-luxe-concierge-card"><Sparkles /><div><span>CIRA Concierge</span><b>Always on your side.</b></div><button>Chat now <ArrowRight size={15} /></button></section><div className="ciq-v2-menu-grid"><button><Gift /><b>Offers & benefits</b><small>Credits, perks, renewals</small></button><button><MessageCircle /><b>Concierge</b><small>Human help when needed</small></button><button><BadgeCheck /><b>Statement Truth</b><small>Verify rewards and fees</small></button><button><Compass /><b>Explore</b><small>Discover point opportunities</small></button></div><section className="ciq-v2-menu-list"><button onClick={() => onNavigate('wallet')}>Connected wallet <ChevronRight /></button><button>Notifications <ChevronRight /></button><button>Privacy & permissions <ChevronRight /></button><button>Security & passkeys <ChevronRight /></button><button>Help & feedback <ChevronRight /></button></section><button className="ciq-v2-reset" onClick={onReset}>Replay onboarding</button></div>
}

function Alerts() {
  return <div className="ciq-v2-alerts ciq-luxe-alerts"><div className="ciq-v2-section-head"><h3>Smart alerts</h3><span>3 new</span></div><Feed icon={Gift} tone="gold" title="8,500 points expire in 43 days" text="Review redemption options before the expiry window closes." /><Feed icon={Plane} tone="blue" title="Domestic demo route ready" text="BLR → DEL review path now includes cash and points decision states." /><Feed icon={ShieldCheck} tone="green" title="Verification reminder" text="Projected travel paths stay blocked until live pricing and inventory are confirmed." /></div>
}

function Feed({ icon: Icon, title, text, tone }: { icon: LucideIcon; title: string; text: string; tone: 'gold' | 'green' | 'blue' }) {
  return <button className={`ciq-v2-feed ${tone}`}><span><Icon size={18} /></span><div><b>{title}</b><small>{text}</small></div><ChevronRight size={16} /></button>
}

function Loyalty({ name, value, expiry }: { name: string; value: string; expiry: string }) {
  return <button className="ciq-v2-loyalty"><span className="ciq-v2-loyalty-mark">{name.slice(0, 1)}</span><div><b>{name}</b><small>{expiry}</small></div><strong>{value}</strong><ChevronRight size={16} /></button>
}

function cityForAirport(code: string) {
  return ({ DEL: 'Delhi', BOM: 'Mumbai', GOI: 'Goa', HYD: 'Hyderabad', MAA: 'Chennai' } as Record<string, string>)[code] ?? code
}

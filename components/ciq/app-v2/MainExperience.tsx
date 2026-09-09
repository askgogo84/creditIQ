'use client'

import { useMemo, useState } from 'react'
import {
  ArrowRight, BadgeCheck, Bell, CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign,
  Compass, CreditCard, Gift, Home, Hotel, MapPin, MessageCircle, MoreHorizontal, Plane,
  ScanLine, Search, Send, Settings2, ShoppingBag, Sparkles, Star, Target, TrendingUp,
  UserRound, WalletCards, Zap
} from 'lucide-react'

type Tab = 'home' | 'wallet' | 'cira' | 'travel' | 'cards' | 'menu'

const nav = [
  ['home','Home',Home], ['wallet','Wallet',WalletCards], ['cira','CIRA',Sparkles],
  ['travel','Travel',Plane], ['cards','Cards',CreditCard], ['menu','Menu',MoreHorizontal]
] as const

export function MainExperience({ onReset }: { onReset: () => void }) {
  const [tab, setTab] = useState<Tab>('home')
  const [showAlerts, setShowAlerts] = useState(false)
  return (
    <div className="ciq-v2-app-shell">
      <div className="ciq-v2-app-bg" />
      <header className="ciq-v2-app-header">
        <div><p className="ciq-v2-kicker">GOOD MORNING, GOGO</p><h1>{titleFor(tab)}</h1></div>
        <button className="ciq-v2-iconbtn ciq-v2-bell" onClick={() => setShowAlerts(!showAlerts)}><Bell size={20} /><i /></button>
      </header>
      {showAlerts && <Alerts />}
      <main className="ciq-v2-app-content">
        {tab === 'home' && <HomeScreen onNavigate={setTab} />}
        {tab === 'wallet' && <WalletScreen />}
        {tab === 'cira' && <CiraScreen />}
        {tab === 'travel' && <TravelScreen />}
        {tab === 'cards' && <CardsScreen />}
        {tab === 'menu' && <MenuScreen onReset={onReset} onNavigate={setTab} />}
      </main>
      <nav className="ciq-v2-bottomnav" aria-label="CreditIQ main navigation">
        {nav.map(([id,label,Icon]) => <button key={id} onClick={() => setTab(id)} className={`${tab===id?'active':''} ${id==='cira'?'cira':''}`}><span><Icon size={id==='cira'?23:20} /></span><small>{label}</small></button>)}
      </nav>
    </div>
  )
}

function titleFor(tab: Tab) {
  return ({home:'Make your next move count.', wallet:'Your reward universe.', cira:'Ask before you act.', travel:'Travel smarter with points.', cards:'Make your wallet better.', menu:'Everything else.'} as Record<Tab,string>)[tab]
}

function HomeScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [merchant, setMerchant] = useState('Swiggy')
  return <div className="ciq-v2-screen-stack">
    <section className="ciq-v2-hero-dashboard">
      <div className="ciq-v2-hero-top"><span className="ciq-v2-live-pill"><i /> LIVE WALLET</span><button onClick={() => onNavigate('wallet')}>151.7K pts <ChevronRight size={15} /></button></div>
      <div className="ciq-v2-hero-copy"><p>Today’s highest-impact move</p><h2>Use Axis Atlas for your next food order.</h2><span>Projected reward value <b>₹185</b> on a ₹1,850 spend.</span></div>
      <div className="ciq-v2-bestcard-visual"><small>AXIS</small><b>ATLAS</b><span>Travel card</span><em>4.2×</em></div>
      <div className="ciq-v2-hero-actions"><button onClick={() => onNavigate('cira')}><Sparkles size={16}/> Why this card?</button><button><ScanLine size={16}/> Check another spend</button></div>
    </section>

    <section>
      <div className="ciq-v2-section-head"><div><p className="ciq-v2-kicker">QUICK CHECK</p><h3>What are you paying for?</h3></div><button><Search size={17}/></button></div>
      <div className="ciq-v2-merchant-strip">
        {['Swiggy','Amazon','Marriott','MakeMyTrip'].map((m,i)=><button key={m} onClick={()=>setMerchant(m)} className={merchant===m?'active':''}><span>{['S','A','M','✈'][i]}</span><small>{m}</small></button>)}
      </div>
      <div className="ciq-v2-swipe-card"><div><span>BEST CARD FOR {merchant.toUpperCase()}</span><h4>{merchant==='Marriott'?'HDFC Infinia Metal':merchant==='Amazon'?'AmEx Platinum Travel':'Axis Atlas'}</h4><p>Exact-card rules · projected reward · checkout verification</p></div><div className="ciq-v2-score-ring"><b>{merchant==='Marriott'?'96':'92'}</b><span>fit</span></div></div>
    </section>

    <section className="ciq-v2-bento">
      <button onClick={()=>onNavigate('travel')} className="large"><Plane/><span>Travel opportunity</span><b>BLR → SIN</b><small>2 wallet-aware paths</small><ArrowRight/></button>
      <button onClick={()=>onNavigate('wallet')}><TrendingUp/><span>Wallet value</span><b>₹1.50L</b><small>demo estimate</small></button>
      <button><Gift/><span>Expiring soon</span><b>8,500 pts</b><small>in 43 days</small></button>
    </section>

    <section>
      <div className="ciq-v2-section-head"><div><p className="ciq-v2-kicker">SMART FEED</p><h3>Things worth your attention</h3></div><button>See all</button></div>
      <Feed icon={Gift} tone="gold" title="Your Atlas milestone is 72% complete" text="₹28,000 spend to next milestone · 18 days left" />
      <Feed icon={CircleDollarSign} tone="green" title="You may be overpaying for one card" text="Annual fee is due soon; benefits used so far look weak." />
      <Feed icon={Plane} tone="blue" title="Singapore looks unusually points-friendly" text="A projected transfer path beats simple cashback in the demo." />
    </section>
  </div>
}

function WalletScreen() {
  const [selected, setSelected] = useState(0)
  const cards = [
    {bank:'HDFC',name:'Infinia Metal',pts:'68,500',value:'₹68.5K',grade:'A',tone:'black'},
    {bank:'Axis',name:'Atlas',pts:'31,200',value:'₹42.1K',grade:'A-',tone:'blue'},
    {bank:'AmEx',name:'Platinum Travel',pts:'52,000',value:'₹39.0K',grade:'B+',tone:'rose'},
  ]
  const c = cards[selected]
  return <div className="ciq-v2-screen-stack">
    <section className="ciq-v2-wallet-summary"><div><span>TOTAL TRACKED VALUE</span><b>₹1,49,600</b><small>151,700 points across 3 cards</small></div><div className="ciq-v2-wallet-ring"><strong>87</strong><span>wallet IQ</span></div></section>
    <div className="ciq-v2-card-carousel">{cards.map((card,i)=><button key={card.name} onClick={()=>setSelected(i)} className={`ciq-v2-credit-card ${card.tone} ${selected===i?'selected':''}`}><small>{card.bank}</small><b>{card.name}</b><span>•• {4821+i*2313}</span><div><em>{card.pts} pts</em><i>{card.grade}</i></div></button>)}</div>
    <section className="ciq-v2-card-detail-panel"><div className="ciq-v2-section-head"><div><p className="ciq-v2-kicker">{c.bank.toUpperCase()}</p><h3>{c.name}</h3></div><span className="ciq-v2-grade">{c.grade}</span></div>
      <div className="ciq-v2-metric-row"><div><span>Balance</span><b>{c.pts}</b></div><div><span>Best demo value</span><b>{c.value}</b></div><div><span>Renewal</span><b>74 days</b></div></div>
      <div className="ciq-v2-healthbar"><span style={{width:selected===0?'91%':selected===1?'86%':'72%'}} /></div>
      <div className="ciq-v2-benefit-grid"><button><Gift/><b>Benefits</b><small>5 tracked</small></button><button><Target/><b>Milestones</b><small>2 active</small></button><button><Plane/><b>Transfers</b><small>6 paths</small></button><button><BadgeCheck/><b>Verify</b><small>1 item</small></button></div>
    </section>
    <section><div className="ciq-v2-section-head"><h3>Reward balances</h3><button>Manage</button></div><Loyalty name="KrisFlyer" value="42,300" expiry="No expiry alert" /><Loyalty name="Marriott Bonvoy" value="18,900" expiry="43 days to activity review" /><Loyalty name="Air India Maharaja" value="12,500" expiry="Tracked" /></section>
  </div>
}

function CiraScreen() {
  const [draft,setDraft]=useState('')
  const [messages,setMessages]=useState([{role:'cira',text:'What are you deciding? I can compare a purchase, explain your points, or build a travel path.'}])
  const send=(text=draft)=>{if(!text.trim())return;setMessages(m=>[...m,{role:'user',text:text.trim()},{role:'cira',text:'For this prototype I would compare the exact card rules, source authority and wallet balance first — then show the best projected and executable choices separately.'}]);setDraft('')}
  return <div className="ciq-v2-cira-screen">
    <section className="ciq-v2-cira-hero"><div className="ciq-v2-cira-orbit"><Sparkles size={28}/><i/><i/><i/></div><p className="ciq-v2-kicker">CIRA · WALLET-AWARE AI</p><h2>Ask before you spend, transfer or book.</h2><div className="ciq-v2-prompt-chips">{['Best card for ₹25K?','Explain my Infinia points','Plan BLR → SIN'].map(x=><button key={x} onClick={()=>send(x)}>{x}</button>)}</div></section>
    <div className="ciq-v2-chat">{messages.map((m:any,i)=><div key={i} className={m.role}><span>{m.text}</span></div>)}</div>
    <div className="ciq-v2-chatbox"><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Ask CIRA anything…" onKeyDown={e=>e.key==='Enter'&&send()} /><button onClick={()=>send()}><Send size={17}/></button></div>
  </div>
}

function TravelScreen() {
  const [mode,setMode]=useState<'flights'|'hotels'|'dream'>('flights')
  const [searched,setSearched]=useState(false)
  return <div className="ciq-v2-screen-stack">
    <div className="ciq-v2-segment">{(['flights','hotels','dream'] as const).map(x=><button key={x} onClick={()=>setMode(x)} className={mode===x?'active':''}>{x==='dream'?'Dream Trip':x[0].toUpperCase()+x.slice(1)}</button>)}</div>
    {mode==='flights' && <><section className="ciq-v2-travel-search"><div className="ciq-v2-route"><div><small>FROM</small><b>BLR</b><span>Bengaluru</span></div><Plane/><div><small>TO</small><b>SIN</b><span>Singapore</span></div></div><div className="ciq-v2-travel-options"><button><CalendarDays/> 15 Oct</button><button>Business</button><button>1 adult</button></div><button className="ciq-v2-primary" onClick={()=>setSearched(true)}>Compare cash + points <Search size={17}/></button></section>{searched&&<TravelResults/>}</>}
    {mode==='hotels' && <><section className="ciq-v2-travel-search"><div className="ciq-v2-hotel-search"><MapPin/><div><small>DESTINATION</small><b>Bangkok</b></div></div><div className="ciq-v2-travel-options"><button>15–18 Oct</button><button>2 guests</button></div><button className="ciq-v2-primary" onClick={()=>setSearched(true)}>Search stays <Search size={17}/></button></section><HotelResult /></>}
    {mode==='dream' && <section className="ciq-v2-dream"><div className="ciq-v2-dream-glow"/><Sparkles/><p className="ciq-v2-kicker">DREAM TRIP</p><h2>“Take me to Japan for 5 nights using my points.”</h2><p>CIRA starts from your real wallet, then builds flights, stays and fallback cash options around it.</p><button>Build my trip <ArrowRight/></button></section>}
  </div>
}

function CardsScreen() {
  const [goal,setGoal]=useState('Travel')
  return <div className="ciq-v2-screen-stack">
    <section className="ciq-v2-cardfinder-hero"><p className="ciq-v2-kicker">NEXT CARD</p><h2>Don’t add another card. Add a capability.</h2><p>CreditIQ scores new cards against what your current wallet already does.</p></section>
    <div className="ciq-v2-goal-pills">{['Travel','Cashback','Lifestyle','Low fee'].map(x=><button key={x} onClick={()=>setGoal(x)} className={goal===x?'active':''}>{x}</button>)}</div>
    <section className="ciq-v2-reco-card"><div className="ciq-v2-reco-score"><b>91</b><span>fit</span></div><p className="ciq-v2-kicker">BEST ADDITION FOR {goal.toUpperCase()}</p><h3>Axis Atlas</h3><p>Fills a transfer-flexibility gap without duplicating your strongest premium-card role.</p><div className="ciq-v2-reco-tags"><span>Low overlap</span><span>Strong travel</span><span>Milestone upside</span></div><button>See why it fits <ChevronRight/></button></section>
    <div className="ciq-v2-compare-row"><button><Star/><b>Compare cards</b><small>Fees, earn rates, lounge, transfers</small></button><button><Target/><b>Switch wizard</b><small>Find cards not earning their keep</small></button></div>
  </div>
}

function MenuScreen({onReset,onNavigate}:{onReset:()=>void;onNavigate:(t:Tab)=>void}) {
  return <div className="ciq-v2-screen-stack"><section className="ciq-v2-profile-card"><div className="ciq-v2-avatar">G</div><div><b>Gogo</b><span>CreditIQ Pro · India</span></div><button><Settings2/></button></section><div className="ciq-v2-menu-grid"><button><Gift/><b>Offers & benefits</b><small>Credits, perks, renewals</small></button><button><MessageCircle/><b>Concierge</b><small>Human help when needed</small></button><button><BadgeCheck/><b>Statement Truth</b><small>Verify rewards and fees</small></button><button><Compass/><b>Explore</b><small>Discover point opportunities</small></button></div><section className="ciq-v2-menu-list"><button onClick={()=>onNavigate('wallet')}>Connected wallet <ChevronRight/></button><button>Notifications <ChevronRight/></button><button>Privacy & permissions <ChevronRight/></button><button>Security & passkeys <ChevronRight/></button><button>Help & feedback <ChevronRight/></button></section><button className="ciq-v2-reset" onClick={onReset}>Replay first-run experience</button></div>
}

function Alerts(){return <div className="ciq-v2-alerts"><div className="ciq-v2-section-head"><h3>Smart alerts</h3><span>3 new</span></div><Feed icon={Gift} tone="gold" title="8,500 points need attention" text="One tracked balance has an upcoming activity review."/><Feed icon={Plane} tone="blue" title="Your Singapore route changed" text="Recheck award availability before any transfer."/><Feed icon={CircleDollarSign} tone="green" title="Renewal check" text="Review one annual fee in the next 74 days."/></div>}

function Feed({icon:Icon,tone,title,text}:{icon:any;tone:string;title:string;text:string}){return <button className={`ciq-v2-feed ${tone}`}><span><Icon size={19}/></span><div><b>{title}</b><small>{text}</small></div><ChevronRight size={17}/></button>}
function Loyalty({name,value,expiry}:{name:string;value:string;expiry:string}){return <button className="ciq-v2-loyalty"><span>{name.slice(0,2).toUpperCase()}</span><div><b>{name}</b><small>{expiry}</small></div><strong>{value}</strong></button>}
function TravelResults(){return <section className="ciq-v2-travel-results"><div className="ciq-v2-result-head"><span className="ciq-v2-live-pill"><i/> DEMO DECISION</span><b>2 paths</b></div><button className="winner"><div><small>BEST PROJECTED VALUE</small><b>Transfer → KrisFlyer</b><span>43,000 miles + taxes · verify award first</span></div><em>1.8×</em></button><button><div><small>EXECUTABLE FALLBACK</small><b>Pay cash & keep points</b><span>Shown only when INR cash pricing is verified</span></div><ChevronRight/></button></section>}
function HotelResult(){return <section className="ciq-v2-hotel-result"><div className="ciq-v2-hotel-img"><Hotel size={35}/><span>Bangkok</span></div><div><p className="ciq-v2-kicker">MAPPED PROPERTY</p><h3>Marriott · Demo stay</h3><p>Cash + award join + exact wallet rails.</p><div><span>Cash</span><b>₹18.4K</b><span>Points</span><b>42K</b></div></div></section>}

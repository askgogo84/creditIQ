'use client'

import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft, ArrowRight, BadgeCheck, Bell, BellRing, CalendarDays, Check, ChevronRight,
  CircleDollarSign, Compass, CreditCard, Gift, Home, Hotel, LockKeyhole, Mail, MapPin,
  MessageCircle, MoreHorizontal, Plane, Search, Send, Settings2, ShieldCheck, Sparkles,
  Star, Target, TrendingUp, Upload, UserRound, WalletCards, Zap, ScanLine, RefreshCw,
  SlidersHorizontal, Heart, Clock3, Trophy, CircleHelp, Headphones, FileCheck2, Eye,
  Fingerprint, Smartphone, CheckCircle2, X, Building2, Globe2
} from 'lucide-react'

type MainTab = 'home' | 'wallet' | 'cira' | 'travel' | 'cards' | 'menu'
type DetailView =
  | 'spend'
  | 'flight-results'
  | 'flight-decision'
  | 'hotel-results'
  | 'hotel-decision'
  | 'card-detail'
  | 'benefits'
  | 'milestones'
  | 'transfers'
  | 'compare'
  | 'switch'
  | 'roast'
  | 'statement'
  | 'concierge'
  | 'offers'
  | 'profile'
  | 'privacy'
  | 'notifications'
  | 'help'
  | null

type TravelMode = 'flights' | 'hotels' | 'dream'

const cards = [
  { id: 'infinia', bank: 'HDFC', name: 'Infinia Metal', art: '/card-art/hdfc-infinia.webp', points: '68,500', value: '₹68.5K', grade: 'A', tail: '4821' },
  { id: 'atlas', bank: 'Axis', name: 'Atlas', art: '/card-art/axis-atlas.webp', points: '31,200', value: '₹42.1K', grade: 'A-', tail: '9134' },
  { id: 'amex', bank: 'AmEx', name: 'Platinum Travel', art: '/card-art/amex-platinum-travel.webp', points: '52,000', value: '₹39.0K', grade: 'B+', tail: '1447' },
]

const domesticRoutes = [
  { code: 'DEL', city: 'Delhi', cash: '₹5,980', points: '3,200', airline: 'IndiGo' },
  { code: 'BOM', city: 'Mumbai', cash: '₹4,650', points: '3,000', airline: 'Air India' },
  { code: 'GOI', city: 'Goa', cash: '₹4,180', points: '2,800', airline: 'Akasa Air' },
  { code: 'HYD', city: 'Hyderabad', cash: '₹3,690', points: '2,450', airline: 'IndiGo' },
  { code: 'MAA', city: 'Chennai', cash: '₹3,420', points: '2,300', airline: 'Air India Express' },
]

const domesticStays = [
  { city: 'Goa', hotel: 'Taj Exotica Resort & Spa', cash: '₹18,000', points: '42,000', loyalty: 'Taj / demo' },
  { city: 'Mumbai', hotel: 'ITC Maratha', cash: '₹16,500', points: '38,000', loyalty: 'ITC / demo' },
  { city: 'Delhi', hotel: 'Andaz Delhi', cash: '₹14,200', points: '30,000', loyalty: 'Hyatt / demo' },
  { city: 'Bengaluru', hotel: 'JW Marriott Bengaluru', cash: '₹15,800', points: '34,000', loyalty: 'Marriott / demo' },
]

export function ReferenceApp() {
  const [ready, setReady] = useState(false)
  const [onboarded, setOnboarded] = useState(false)
  const [setupStep, setSetupStep] = useState(0)
  const [tab, setTab] = useState<MainTab>('home')
  const [detail, setDetail] = useState<DetailView>(null)
  const [alertsOpen, setAlertsOpen] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const review = params.get('review')
    if (review === 'app') setOnboarded(true)
    else if (review === 'setup') setOnboarded(false)
    else setOnboarded(localStorage.getItem('creditiq-reference-onboarded') === '1')
    setReady(true)
  }, [])

  if (!ready) return <div className="ref-loading" />

  const completeSetup = () => {
    localStorage.setItem('creditiq-reference-onboarded', '1')
    setOnboarded(true)
    setSetupStep(0)
  }
  const resetSetup = () => {
    localStorage.removeItem('creditiq-reference-onboarded')
    setOnboarded(false)
    setSetupStep(0)
    setTab('home')
    setDetail(null)
  }
  const goTab = (next: MainTab) => {
    setDetail(null)
    setTab(next)
    setAlertsOpen(false)
  }

  return (
    <div className="ref-stage">
      <div className="ref-phone">
        {!onboarded ? (
          <Onboarding step={setupStep} setStep={setSetupStep} onComplete={completeSetup} onSkip={completeSetup} />
        ) : (
          <MainApp
            tab={tab}
            detail={detail}
            alertsOpen={alertsOpen}
            setAlertsOpen={setAlertsOpen}
            setDetail={setDetail}
            goTab={goTab}
            onReplay={resetSetup}
          />
        )}
      </div>
      <div className="ref-desktop-note">Interactive prototype · reference-board visual parity · demo data unless labelled live</div>
    </div>
  )
}

function Onboarding({ step, setStep, onComplete, onSkip }: { step: number; setStep: (n: number) => void; onComplete: () => void; onSkip: () => void }) {
  const next = () => setStep(Math.min(7, step + 1))
  const back = () => setStep(Math.max(0, step - 1))
  return (
    <div className={`ref-setup ref-setup-${step}`}>
      {step > 0 && (
        <div className="ref-setup-progress">
          <button onClick={back} aria-label="Back"><ArrowLeft size={18} /></button>
          <div><span style={{ width: `${Math.round(((step + 1) / 8) * 100)}%` }} /></div>
          <small>{step + 1} of 8</small>
        </div>
      )}
      {step < 7 && step > 0 && <button className="ref-skip" onClick={onSkip}>Skip to app</button>}
      {step === 0 && <SetupSplash onNext={next} onSkip={onSkip} />}
      {step === 1 && <SetupStory onNext={next} />}
      {step === 2 && <SetupSignIn onNext={next} />}
      {step === 3 && <SetupPrivacy onNext={next} />}
      {step === 4 && <SetupCards onNext={next} />}
      {step === 5 && <SetupBalances onNext={next} />}
      {step === 6 && <SetupGoals onNext={next} />}
      {step === 7 && <SetupInsight onComplete={onComplete} />}
    </div>
  )
}

function SetupSplash({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return <div className="ref-splash">
    <div className="ref-splash-photo" />
    <div className="ref-splash-ring"><span>Credit<span>IQ</span></span></div>
    <div className="ref-splash-copy">
      <h1>Make every card<br />work harder.</h1>
      <p>Smarter cards. Brighter journeys.</p>
    </div>
    <div className="ref-splash-benefits">
      <div><Gift/><b>More rewards</b></div>
      <div><Plane/><b>Better travel</b></div>
      <div><TrendingUp/><b>Smarter spending</b></div>
      <div><Sparkles/><b>A brighter you</b></div>
    </div>
    <div className="ref-splash-bottom">
      <span>INTELLIGENCE TURNS SPENDING INTO OPPORTUNITIES</span>
      <button className="ref-gold-btn" onClick={onNext}>Get started <ArrowRight size={18}/></button>
      <button className="ref-ghost-link" onClick={onSkip}>I already have an account</button>
    </div>
  </div>
}

function SetupStory({ onNext }: { onNext: () => void }) {
  return <div className="ref-cream-screen ref-scrollable">
    <div className="ref-cream-head">
      <p className="ref-kicker">POINTS · REWARDS · TRAVEL</p>
      <h2>Your wallet should tell you what to do next.</h2>
      <p>Get the best-card guidance, rewards intelligence and personalised insights — powered by CIRA.</p>
    </div>
    <div className="ref-story-visual">
      <div className="ref-story-sky" />
      <CardFan />
      <span className="ref-story-script">More than spending.</span>
    </div>
    <div className="ref-story-features">
      <div><Compass/><b>Right card</b><span>for every spend</span></div>
      <div><Gift/><b>Maximise</b><span>rewards & cashback</span></div>
      <div><Plane/><b>Turn points</b><span>into unforgettable trips</span></div>
    </div>
    <div className="ref-bottom-pad"><button className="ref-dark-btn" onClick={onNext}>Next <ArrowRight size={18}/></button></div>
  </div>
}

function SetupSignIn({ onNext }: { onNext: () => void }) {
  return <div className="ref-dark-screen ref-photo-top ref-scrollable">
    <div className="ref-sign-photo" />
    <div className="ref-overlay-copy">
      <LogoWordmark />
      <h2>A smarter financial journey starts here.</h2>
      <p>Sign in to unlock personalised insights with CIRA.</p>
    </div>
    <div className="ref-provider-stack">
      <button className="ref-provider white"><span className="google-dot">G</span>Continue with Google</button>
      <button className="ref-provider"><span>●</span>Continue with Apple</button>
      <button className="ref-provider"><Mail size={17}/>Continue with Email</button>
      <div className="ref-or"><span/>OR<span/></div>
      <label className="ref-input"><Mail size={16}/><input defaultValue="gogo@example.com" aria-label="Email" /></label>
      <label className="ref-input"><LockKeyhole size={16}/><input defaultValue="••••••••" aria-label="Password" /></label>
      <button className="ref-gold-btn" onClick={onNext}>Sign In <ArrowRight size={18}/></button>
    </div>
  </div>
}

function SetupPrivacy({ onNext }: { onNext: () => void }) {
  return <div className="ref-dark-screen ref-scrollable ref-content-screen">
    <HeaderCopy kicker="YOUR DATA. YOUR ADVANTAGE." title="Your privacy comes first." body="We only access what’s needed to give you smarter insights. You’re always in control." />
    <div className="ref-permission-list">
      <ToggleRow icon={BellRing} title="Notifications" text="Important updates, reward alerts and personalised tips." on />
      <ToggleRow icon={MessageCircle} title="SMS Insights" text="Supported reward, spend and offer messages." on />
      <ToggleRow icon={Upload} title="Card Statements" text="Import statements for deeper analysis when you choose." on />
      <ToggleRow icon={ShieldCheck} title="Security Controls" text="Sensitive fields stay private and never auto-reveal." on />
    </div>
    <div className="ref-trust-card"><LockKeyhole/><div><b>Your trust powers a smarter you.</b><span>No bank password or full card number is requested in this prototype.</span></div></div>
    <div className="ref-bottom-pad"><button className="ref-gold-btn" onClick={onNext}>Continue <ArrowRight size={18}/></button></div>
  </div>
}

function SetupCards({ onNext }: { onNext: () => void }) {
  const [selected, setSelected] = useState(['infinia','atlas'])
  const toggle=(id:string)=>setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id])
  return <div className="ref-dark-screen ref-scrollable ref-content-screen">
    <HeaderCopy kicker="ADD YOUR CARDS" title="Connect the cards you already use." body="Search your card product. No full card number needed." />
    <label className="ref-input ref-search"><Search size={16}/><input placeholder="Search for your card (e.g. Infinia, Atlas)" /></label>
    <div className="ref-category-tabs"><button className="active">Popular</button><button>Travel</button><button>Cashback</button><button>Shopping</button></div>
    <div className="ref-card-list">
      {cards.map(card=><button className={`ref-card-row ${selected.includes(card.id)?'selected':''}`} key={card.id} onClick={()=>toggle(card.id)}>
        <Image src={card.art} alt={card.name} width={110} height={70}/>
        <div><b>{card.name}</b><span>{card.bank} · Premium rewards</span><small>Travel · Rewards · Benefits</small></div>
        <em>{selected.includes(card.id)?<Check/>:<span>+ Add</span>}</em>
      </button>)}
    </div>
    <div className="ref-bottom-pad"><button className="ref-gold-btn" disabled={!selected.length} onClick={onNext}>Add selected cards <ArrowRight size={18}/></button></div>
  </div>
}

function SetupBalances({ onNext }: { onNext: () => void }) {
  return <div className="ref-cream-screen ref-scrollable ref-content-screen">
    <HeaderCopy kicker="BRING IN YOUR DETAILS" title="Bring your existing card details." body="Let CIRA find your balances, spending and rewards — securely and privately." />
    <div className="ref-import-stack">
      <ImportRow icon={MessageCircle} title="Scan SMS" text="Detect supported card spends and reward events." />
      <ImportRow icon={Upload} title="Upload statement" text="Upload a statement and extract key details." />
      <ImportRow icon={WalletCards} title="Enter manually" text="Add cards and point balances yourself." />
    </div>
    <div className="ref-detected-card">
      <span>Detected for demo</span>
      <div><b>3</b><small>cards found</small></div><div><b>151.7K</b><small>points tracked</small></div><div><b>₹1.50L</b><small>est. value</small></div>
    </div>
    <div className="ref-bottom-pad"><button className="ref-gold-btn" onClick={onNext}>Continue <ArrowRight size={18}/></button></div>
  </div>
}

function SetupGoals({ onNext }: { onNext: () => void }) {
  const [goals,setGoals]=useState(['Travel better'])
  const defs=[['Travel better',Plane,'Maximise travel rewards, redemptions and airport perks.'],['Earn more',TrendingUp,'Get higher rewards on everyday spend.'],['Save money',Gift,'Avoid unnecessary fees and find better value.'],['Simplify wallet',WalletCards,'Organise, track and get more from your cards.']] as const
  return <div className="ref-dark-screen ref-scrollable ref-content-screen">
    <HeaderCopy kicker="YOUR GOALS" title="What are your goals with CreditIQ?" body="Tell us what matters most. CIRA will personalise your insights, recommendations and rewards." />
    <div className="ref-goal-grid">
      {defs.map(([title,Icon,text])=><button key={title} onClick={()=>setGoals(v=>v.includes(title)?v.filter(x=>x!==title):[...v,title])} className={goals.includes(title)?'selected':''}><Icon/><b>{title}</b><span>{text}</span><i>{goals.includes(title)?<Check/>:null}</i></button>)}
    </div>
    <button className="ref-other-goal"><Target/>Any other goals? <ChevronRight/></button>
    <div className="ref-bottom-pad"><button className="ref-gold-btn" onClick={onNext}>Continue <ArrowRight size={18}/></button></div>
  </div>
}

function SetupInsight({ onComplete }: { onComplete: () => void }) {
  return <div className="ref-dark-screen ref-scrollable ref-content-screen ref-insight-screen">
    <div className="ref-cira-mini"><span><Sparkles/></span><div><b>Hi, I’m CIRA</b><small>I find opportunities your cards miss.</small></div></div>
    <HeaderCopy kicker="YOUR FIRST OPPORTUNITY" title="CIRA found your first opportunity." body="Here’s how you can get more from everyday spending." />
    <div className="ref-insight-card">
      <div className="ref-insight-merchant"><div className="merchant-logo">S</div><div><b>Swiggy</b><span>Food & Dining</span></div><strong>₹1,850</strong></div>
      <div className="ref-insight-reco"><Image src="/card-art/axis-atlas.webp" alt="Axis Atlas" width={105} height={68}/><div><small>Recommended by CIRA</small><b>Use Axis Atlas</b><span>Projected value ₹185</span></div></div>
      <div className="ref-insight-compare"><div><span>Your usual card</span><b>~₹23 value</b></div><div><span>With Atlas</span><b>~₹185 value</b></div></div>
      <div className="ref-insight-upside"><TrendingUp/><span>You could get up to 5× more projected value on this spend.</span></div>
    </div>
    <div className="ref-bottom-pad"><button className="ref-gold-btn" onClick={onComplete}>Open my CreditIQ <ArrowRight size={18}/></button></div>
  </div>
}

function MainApp({ tab, detail, alertsOpen, setAlertsOpen, setDetail, goTab, onReplay }: {
  tab: MainTab; detail: DetailView; alertsOpen: boolean; setAlertsOpen:(v:boolean)=>void; setDetail:(v:DetailView)=>void; goTab:(t:MainTab)=>void; onReplay:()=>void
}) {
  const title = detail ? detailTitle(detail) : tabTitle(tab)
  return <div className="ref-app">
    <div className="ref-app-header">
      <div className="ref-wordmark">Credit<span>IQ</span></div>
      <div className="ref-app-title"><small>{detail ? 'CREDITIQ' : greetingFor(tab)}</small><h1>{title}</h1></div>
      <button className="ref-round-icon" onClick={()=>setAlertsOpen(!alertsOpen)}><Bell size={18}/><i/></button>
    </div>
    {detail && <button className="ref-back" onClick={()=>setDetail(null)}><ArrowLeft size={17}/> Back</button>}
    {alertsOpen && <AlertsPanel onClose={()=>setAlertsOpen(false)} setDetail={setDetail} />}
    <main className="ref-main-scroll">
      {!detail && tab==='home' && <HomeScreen setDetail={setDetail} goTab={goTab} />}
      {!detail && tab==='wallet' && <WalletScreen setDetail={setDetail} />}
      {!detail && tab==='cira' && <CiraScreen setDetail={setDetail} />}
      {!detail && tab==='travel' && <TravelScreen setDetail={setDetail} />}
      {!detail && tab==='cards' && <CardsScreen setDetail={setDetail} />}
      {!detail && tab==='menu' && <MenuScreen setDetail={setDetail} goTab={goTab} onReplay={onReplay} />}
      {detail==='spend' && <SpendSmart />}
      {detail==='flight-results' && <FlightResults setDetail={setDetail} />}
      {detail==='flight-decision' && <FlightDecision />}
      {detail==='hotel-results' && <HotelResults setDetail={setDetail} />}
      {detail==='hotel-decision' && <HotelDecision />}
      {detail==='card-detail' && <CardDetail setDetail={setDetail} />}
      {detail==='benefits' && <Benefits />}
      {detail==='milestones' && <Milestones />}
      {detail==='transfers' && <Transfers />}
      {detail==='compare' && <CompareCards />}
      {detail==='switch' && <SwitchWizard />}
      {detail==='roast' && <CardRoast />}
      {detail==='statement' && <StatementTruth />}
      {detail==='concierge' && <Concierge />}
      {detail==='offers' && <Offers />}
      {detail==='profile' && <Profile />}
      {detail==='privacy' && <Privacy />}
      {detail==='notifications' && <Notifications />}
      {detail==='help' && <Help />}
    </main>
    {!detail && <BottomNav tab={tab} goTab={goTab} />}
  </div>
}

function HomeScreen({ setDetail, goTab }: { setDetail:(v:DetailView)=>void; goTab:(t:MainTab)=>void }) {
  return <div className="ref-stack">
    <section className="ref-home-hero">
      <div className="ref-home-photo" />
      <div className="ref-home-hero-copy"><span>BEST MOVE NOW</span><h2>You’re on track for a bigger tomorrow.</h2><p>Your wallet could earn <b>+28,400 pts</b> on upcoming spends.</p><button onClick={()=>setDetail('spend')}>See recommendation <ArrowRight/></button></div>
    </section>
    <div className="ref-home-duo"><button onClick={()=>goTab('travel')}><Plane/><div><span>BLR → DEL</span><b>Domestic travel ready</b></div><ChevronRight/></button><button onClick={()=>goTab('wallet')}><Clock3/><div><span>8,500 pts</span><b>expiring soon</b></div><ChevronRight/></button></div>
    <SectionTitle title="For you today" action="See all" />
    <button className="ref-feed-media" onClick={()=>goTab('travel')}><div className="ref-feed-image travel"/><div><small>TRAVEL</small><b>Use your wallet smarter on domestic trips</b><span>Compare cash and points before booking.</span></div><ChevronRight/></button>
    <button className="ref-feed-media" onClick={()=>setDetail('spend')}><div className="ref-feed-image spend"/><div><small>SPENDING INSIGHT</small><b>You can save more on your next online spend</b><span>Check your best exact card before you pay.</span></div><ChevronRight/></button>
    <div className="ref-quick-grid"><button onClick={()=>setDetail('spend')}><ScanLine/><b>Spend Smart</b><span>Best card now</span></button><button onClick={()=>goTab('cira')}><Sparkles/><b>Ask CIRA</b><span>Plan anything</span></button><button onClick={()=>setDetail('offers')}><Gift/><b>Offers</b><span>Wallet-relevant</span></button><button onClick={()=>setDetail('statement')}><FileCheck2/><b>Statement Truth</b><span>Verify rewards</span></button></div>
  </div>
}

function WalletScreen({ setDetail }: { setDetail:(v:DetailView)=>void }) {
  const [index,setIndex]=useState(0); const c=cards[index]
  return <div className="ref-stack">
    <section className="ref-wallet-card-stack">
      <div className="ref-card-shadow left"><Image src={cards[2].art} alt="AmEx Platinum Travel" width={126} height={80}/></div>
      <button className="ref-wallet-main-card" onClick={()=>setDetail('card-detail')}><Image src={c.art} alt={c.name} width={240} height={150}/></button>
      <div className="ref-card-shadow right"><Image src={cards[1].art} alt="Axis Atlas" width={126} height={80}/></div>
      <div className="ref-carousel-dots">{cards.map((_,i)=><button key={i} onClick={()=>setIndex(i)} className={i===index?'active':''}/>)}</div>
    </section>
    <section className="ref-wallet-total"><div><span>Total tracked value</span><b>₹1,49,600</b><small>151,700 points across 3 cards</small></div><div className="ref-growth">↗ 18%<span>demo</span></div></section>
    <div className="ref-wallet-metrics"><div><b>151.7K</b><span>Total points</span></div><div><b>₹1.50L</b><span>Est. value</span></div><div><b>3</b><span>Active cards</span></div><div><b>12</b><span>Partners</span></div></div>
    <section className="ref-wallet-iq"><div><Sparkles/><span><b>Wallet IQ · 87</b><small>You may be underusing one premium benefit.</small></span><ChevronRight/></div></section>
    <div className="ref-subtabs"><button className="active">Balances</button><button onClick={()=>setDetail('benefits')}>Benefits</button><button onClick={()=>setDetail('milestones')}>Milestones</button><button onClick={()=>setDetail('transfers')}>Transfers</button></div>
    <div className="ref-balance-list">{cards.map(card=><button key={card.id} onClick={()=>setDetail('card-detail')}><Image src={card.art} alt={card.name} width={58} height={38}/><div><b>{card.name}</b><span>{card.bank} rewards</span></div><strong>{card.points} pts</strong></button>)}</div>
  </div>
}

function SpendSmart() {
  const [merchant,setMerchant]=useState('Starbucks'); const [amount,setAmount]=useState('1200'); const [searched,setSearched]=useState(true)
  return <div className="ref-stack ref-detail-screen">
    <div className="ref-segment"><button className="active">Single purchase</button><button>Monthly spend</button><button>Travel booking</button></div>
    <section className="ref-form-panel"><label><span>Where are you spending?</span><div className="ref-input"><MapPin/><input value={merchant} onChange={e=>setMerchant(e.target.value)}/></div></label><label><span>Enter amount</span><div className="ref-input"><CircleDollarSign/><input value={amount} onChange={e=>setAmount(e.target.value)}/></div></label><button className="ref-gold-btn" onClick={()=>setSearched(true)}>Find best card <ArrowRight/></button></section>
    {searched && <><SectionTitle title="Best card for this spend" /><RecommendationCard primary /><SectionTitle title="Second best option" /><RecommendationCard /></>}
    <section className="ref-explain-box"><b>Why this card?</b><span><CheckCircle2/>Highest projected value for this merchant</span><span><CheckCircle2/>Exact-card rules, no bank-level inheritance</span><span><CheckCircle2/>Milestone timing included where known</span></section>
  </div>
}

function CiraScreen({ setDetail }: { setDetail:(v:DetailView)=>void }) {
  const [draft,setDraft]=useState(''); const [messages,setMessages]=useState<string[]>([])
  const send=(txt=draft)=>{if(!txt.trim())return;setMessages(v=>[...v,txt.trim()]);setDraft('')}
  return <div className="ref-cira-screen">
    <div className="ref-cira-orb"><span><Sparkles/></span></div>
    <p className="ref-cira-sub">Your personal card & travel intelligence</p><h2>Ask. Plan. Go further.</h2><p>CIRA helps you make every spend, trip and card decision more rewarding.</p>
    <div className="ref-cira-chips">{['Best card for ₹25K?','Plan BLR → DEL','Maximise my points','Lounge access options','Should I upgrade?'].map(x=><button key={x} onClick={()=>send(x)}>{x}</button>)}</div>
    <div className="ref-chat-area">{messages.map((m,i)=><div key={i}><div className="user">{m}</div><div className="bot"><b>CIRA</b><span>I’d compare exact card rules, wallet balance, source authority and executable paths first. For travel, I’ll keep cash and points decisions separate.</span></div></div>)}</div>
    <div className="ref-cira-actions"><button onClick={()=>setDetail('spend')}>Check a spend</button><button onClick={()=>setDetail('concierge')}>Concierge</button></div>
    <div className="ref-chat-input"><input value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Ask CIRA anything…" onKeyDown={e=>e.key==='Enter'&&send()}/><button onClick={()=>send()}><Send/></button></div>
  </div>
}

function TravelScreen({ setDetail }: { setDetail:(v:DetailView)=>void }) {
  const [mode,setMode]=useState<TravelMode>('flights'); const [to,setTo]=useState('DEL'); const [hotelCity,setHotelCity]=useState('Goa')
  const selectedRoute=domesticRoutes.find(x=>x.code===to) || domesticRoutes[0]
  return <div className="ref-stack">
    <div className="ref-segment"><button className={mode==='flights'?'active':''} onClick={()=>setMode('flights')}>Flights</button><button className={mode==='hotels'?'active':''} onClick={()=>setMode('hotels')}>Hotels</button><button className={mode==='dream'?'active':''} onClick={()=>setMode('dream')}>Dream Trip</button></div>
    {mode==='flights' && <><section className="ref-travel-hero flight"><div className="ref-travel-photo flight"/><div className="ref-travel-copy"><span>INDIA-FIRST SEARCH</span><h2>Smarter ways to get there.</h2><p>Compare cash and points for domestic routes.</p></div></section><section className="ref-route-box"><div><small>FROM</small><b>BLR</b><span>Bengaluru</span></div><Plane/><div><small>TO</small><b>{selectedRoute.code}</b><span>{selectedRoute.city}</span></div></section><div className="ref-destination-pills">{domesticRoutes.map(r=><button key={r.code} className={to===r.code?'active':''} onClick={()=>setTo(r.code)}>{r.code}</button>)}</div><div className="ref-travel-options"><button><CalendarDays/>20 Sep</button><button>Economy</button><button>1 adult</button></div><button className="ref-gold-btn" onClick={()=>setDetail('flight-results')}>Search domestic flights <Search/></button></>}
    {mode==='hotels' && <><section className="ref-travel-hero hotel"><div className="ref-travel-photo hotel"/><div className="ref-travel-copy"><span>DOMESTIC STAYS</span><h2>Extraordinary stays. Smarter choices.</h2><p>Compare cash, points and loyalty paths.</p></div></section><label className="ref-input ref-search"><MapPin/><input value={hotelCity} onChange={e=>setHotelCity(e.target.value)} /></label><div className="ref-destination-pills">{domesticStays.map(h=><button key={h.city} className={hotelCity===h.city?'active':''} onClick={()=>setHotelCity(h.city)}>{h.city}</button>)}</div><div className="ref-travel-options"><button>20–24 Sep</button><button>2 guests</button></div><button className="ref-gold-btn" onClick={()=>setDetail('hotel-results')}>Search domestic stays <Search/></button></>}
    {mode==='dream' && <section className="ref-dream-card"><div className="ref-cira-orb small"><span><Sparkles/></span></div><span>DREAM TRIP</span><h2>“Take me to Rajasthan for 5 nights using my points.”</h2><p>CIRA starts with your wallet, then builds flights, stays and fallback cash options around it.</p><button className="ref-gold-btn">Build my trip <ArrowRight/></button></section>}
  </div>
}

function FlightResults({ setDetail }: { setDetail:(v:DetailView)=>void }) {
  return <div className="ref-stack ref-detail-screen">
    <div className="ref-route-result-head"><div><b>BLR → DEL</b><span>20 Sep · 1 adult · Economy</span></div><button><SlidersHorizontal/></button></div>
    <div className="ref-subtabs"><button className="active">Best options</button><button>Cash</button><button>Points</button><button>Fastest</button></div>
    <div className="ref-status-good"><BadgeCheck/>Demo route cards below. Live provider verification is required before investor use.</div>
    {domesticRoutes.slice(0,4).map((r,i)=><button className="ref-flight-row" key={r.code} onClick={()=>setDetail('flight-decision')}><div className={`airline-dot a${i}`}>{i===0?'6E':i===1?'AI':i===2?'QP':'IX'}</div><div><b>{r.airline}</b><span>{i===0?'08:00 – 10:45':'12:20 – 15:05'} · nonstop</span></div><div><strong>{r.cash}</strong><em>{r.points} pts</em></div><ChevronRight/></button>)}
    <div className="ref-demo-disclaimer">Prototype values only. Do not present these as live fares until the domestic provider gate is green.</div>
  </div>
}

function FlightDecision() {
  return <div className="ref-stack ref-detail-screen">
    <section className="ref-decision-hero"><span>BLR → DEL · INDIGO</span><h2>Pick the path that is actually executable.</h2><p>Cash and points stay separated until availability and wallet requirements are confirmed.</p></section>
    <DecisionOption title="Cash price" value="₹5,980" text="Demo fare · live verification required" recommended />
    <DecisionOption title="Points option" value="3,200 pts + taxes unknown" text="Projected only · award availability must be verified" />
    <section className="ref-value-callout"><CheckCircle2/><div><b>Good demo value</b><span>Execution remains blocked until the live domestic providers confirm inventory and taxes.</span></div></section>
    <div className="ref-dual-actions"><button>Ask CIRA</button><button className="gold">Send to Concierge</button></div>
  </div>
}

function HotelResults({ setDetail }: { setDetail:(v:DetailView)=>void }) {
  return <div className="ref-stack ref-detail-screen">
    <div className="ref-route-result-head"><div><b>Goa, India</b><span>20–24 Sep · 2 guests</span></div><button><SlidersHorizontal/></button></div>
    <div className="ref-subtabs"><button className="active">Popular</button><button>Price</button><button>Points</button><button>Rating</button></div>
    {domesticStays.map((h,i)=><button className="ref-hotel-row" key={h.hotel} onClick={()=>setDetail('hotel-decision')}><div className={`ref-hotel-thumb h${i}`}/><div><b>{h.hotel}</b><span>{h.city} · {h.loyalty}</span><small>Demo stay · verify live availability</small></div><div><strong>{h.cash}</strong><em>{h.points} pts</em></div><Heart/></button>)}
  </div>
}

function HotelDecision() {
  return <div className="ref-stack ref-detail-screen"><section className="ref-hotel-decision-photo"/><HeaderCopy kicker="TAJ EXOTICA RESORT & SPA" title="Cash or points? Make the trade-off obvious." body="This decision screen keeps projected loyalty value separate from a verified bookable rate." /><DecisionOption title="Cash path" value="₹72,000" text="4 nights · demo total" recommended/><DecisionOption title="Points path" value="168,000 points" text="Projected demo only · live inventory and taxes must be confirmed"/><section className="ref-value-callout"><BadgeCheck/><div><b>Investor-demo rule</b><span>Only label a stay bookable when the live domestic hotel source confirms it.</span></div></section></div>
}

function CardsScreen({ setDetail }: { setDetail:(v:DetailView)=>void }) {
  const [goal,setGoal]=useState('Recommended')
  return <div className="ref-stack"><section className="ref-cards-intro"><span>NEXT CARD</span><h2>Find your next card.</h2><p>Personalised recommendations based on your wallet, spending and goals.</p></section><div className="ref-subtabs">{['Recommended','Travel','Cashback','Luxury'].map(x=><button key={x} className={goal===x?'active':''} onClick={()=>setGoal(x)}>{x}</button>)}</div><section className="ref-reco-card"><div className="ref-fit-ring"><b>92</b><span>fit</span></div><Image src="/card-art/hdfc-infinia.webp" alt="HDFC Infinia" width={150} height={96}/><div><span>BEST FOR YOU</span><h3>HDFC Infinia</h3><p>Premium travel. Elevated everyday value.</p></div><div className="ref-reco-feature-grid"><span><Plane/>Strong travel</span><span><Star/>Premium benefits</span><span><Gift/>Reward flexibility</span><span><BadgeCheck/>Low overlap</span></div><div className="ref-dual-actions"><button onClick={()=>setDetail('compare')}>Compare</button><button className="gold" onClick={()=>setDetail('card-detail')}>View details</button></div></section><div className="ref-quick-grid"><button onClick={()=>setDetail('switch')}><RefreshCw/><b>Switch Wizard</b><span>Fix weak cards</span></button><button onClick={()=>setDetail('roast')}><Zap/><b>Card Roast</b><span>Evidence, with attitude</span></button></div></div>
}

function MenuScreen({ setDetail, goTab, onReplay }: { setDetail:(v:DetailView)=>void; goTab:(t:MainTab)=>void; onReplay:()=>void }) {
  return <div className="ref-stack"><section className="ref-profile-card"><div className="ref-avatar">G</div><div><b>Goverdhan M D</b><span>CreditIQ Pro · India</span></div><button onClick={()=>setDetail('profile')}><ChevronRight/></button></section><button className="ref-concierge-banner" onClick={()=>setDetail('concierge')}><div className="ref-cira-orb tiny"><span><Sparkles/></span></div><div><b>CIRA Concierge</b><span>Always on your side.</span></div><em>Chat now</em></button><div className="ref-menu-list"><MenuRow icon={FileCheck2} title="Statement Truth" text="Turn statements into insights" onClick={()=>setDetail('statement')}/><MenuRow icon={Gift} title="Offers & Benefits" text="Curated for your cards" onClick={()=>setDetail('offers')}/><MenuRow icon={WalletCards} title="My Connected Wallet" text="Cards, points and loyalty" onClick={()=>goTab('wallet')}/><MenuRow icon={ShieldCheck} title="Privacy & Security" text="Your data stays private" onClick={()=>setDetail('privacy')}/><MenuRow icon={Bell} title="Notifications" text="Alerts, updates and opportunities" onClick={()=>setDetail('notifications')}/><MenuRow icon={CircleHelp} title="Help & Feedback" text="Support and data corrections" onClick={()=>setDetail('help')}/><MenuRow icon={RefreshCw} title="Replay Onboarding" text="Take the tour again" onClick={onReplay}/></div></div>
}

function CardDetail({ setDetail }: { setDetail:(v:DetailView)=>void }) { return <div className="ref-stack ref-detail-screen"><section className="ref-card-detail-hero"><Image src="/card-art/hdfc-infinia.webp" alt="HDFC Infinia" width={250} height={160}/><span>HDFC</span><h2>Infinia Metal</h2><p>Premium travel · exact-card rewards intelligence</p></section><div className="ref-wallet-metrics"><div><b>68,500</b><span>Points</span></div><div><b>₹68.5K</b><span>Est. value</span></div><div><b>74 days</b><span>Renewal</span></div><div><b>A</b><span>Wallet grade</span></div></div><div className="ref-quick-grid"><button onClick={()=>setDetail('benefits')}><Gift/><b>Benefits</b><span>5 tracked</span></button><button onClick={()=>setDetail('milestones')}><Trophy/><b>Milestones</b><span>2 active</span></button><button onClick={()=>setDetail('transfers')}><Plane/><b>Transfers</b><span>6 paths</span></button><button><BadgeCheck/><b>Verify</b><span>1 item</span></button></div><SectionTitle title="Why this card matters"/><div className="ref-explain-box"><span><CheckCircle2/>Strong travel redemption flexibility</span><span><CheckCircle2/>Premium lounge and hotel benefits</span><span><CheckCircle2/>Exact-card rules enforced in recommendations</span></div></div> }
function Benefits(){return <GenericDetail kicker="BENEFITS" title="Use the perks you already paid for." rows={[['Lounge access','2 visits tracked this quarter'],['Hotel benefit','Premium stay benefit available'],['Dining credit','1 benefit still unused'],['Renewal review','74 days until renewal']]}/>}
function Milestones(){return <GenericDetail kicker="MILESTONES" title="Chase only the milestones worth it." rows={[['Axis Atlas','72% complete · ₹28K remaining'],['AmEx Platinum Travel','Milestone review in 18 days'],['HDFC Infinia','No forced spend recommendation']]}/>}
function Transfers(){return <GenericDetail kicker="TRANSFER PARTNERS" title="Know the route before moving points." rows={[['KrisFlyer','Exact-card ratio verified in transfer graph'],['Air India Maharaja','Published programme guidance'],['Marriott Bonvoy','Projected until transfer economics verified'],['Safety','Irreversible transfer always requires explicit confirmation']]}/>}
function CompareCards(){return <GenericDetail kicker="COMPARE" title="Compare the capability, not just the annual fee." rows={[['HDFC Infinia','Premium travel · strong reward flexibility'],['Axis Atlas','Transfer-focused · milestone structure'],['AmEx Platinum Travel','Milestone-led Membership Rewards'],['Recommendation','Show incremental value vs cards already owned']]}/>}
function SwitchWizard(){return <GenericDetail kicker="SWITCH WIZARD" title="Find cards that are not earning their keep." rows={[['Card 1','Keep · benefits justify the fee'],['Card 2','Review · renewal in 32 days'],['Card 3','Possible downgrade · low benefit usage'],['Rule','Never recommend closure from incomplete usage data']]}/>}
function CardRoast(){return <GenericDetail kicker="CARD ROAST" title="Useful criticism, backed by the numbers." rows={[['What it does well','Strong rewards in the right use case'],['Where it hurts','Annual fee requires active benefit usage'],['Who should avoid it','Low spend / low travel users'],['Verdict','Keep only when the wallet maths supports it']]}/>}
function StatementTruth(){return <GenericDetail kicker="STATEMENT TRUTH" title="Turn statement lines into reward truth." rows={[['Upload','PDF or image statement'],['Expected rewards','Compute from exact-card earn rules'],['Actual rewards','Compare against statement credits'],['Flags','Missed points, fees, exclusions and anomalies']] action="Upload demo statement"/>}
function Concierge(){return <GenericDetail kicker="CIRA CONCIERGE" title="Hand off a decision without losing context." rows={[['Travel brief','Route, cabin, wallet, cash fallback'],['Card brief','Current wallet and recommendation rationale'],['Safety','No sensitive card data in the handoff'],['Status','Prototype request builder']] action="Start concierge request"/>}
function Offers(){return <GenericDetail kicker="OFFERS & BENEFITS" title="Only show offers that fit the wallet." rows={[['Axis Atlas','Travel-category opportunity'],['HDFC Infinia','Premium merchant benefit'],['AmEx Platinum Travel','Milestone reminder'],['Filter rule','Hide offers for cards the user does not own']]}/>}
function Profile(){return <GenericDetail kicker="MY ACCOUNT" title="Your profile, preferences and travel style." rows={[['Name','Goverdhan M D'],['Country','India'],['Currency','INR'],['Home airport','BLR · Bengaluru'],['Travel style','Value-aware premium travel']]}/>}
function Privacy(){return <GenericDetail kicker="PRIVACY & SECURITY" title="Control every data surface." rows={[['Biometrics','Enabled in production app design'],['Sensitive fields','Explicit reveal only'],['SMS access','Optional and revocable'],['Statements','User-initiated import only'],['Delete data','Account control']]}/>}
function Notifications(){return <GenericDetail kicker="SMART ALERTS" title="Choose what deserves your attention." rows={[['Point expiry','On'],['Annual fee review','On'],['Milestone deadline','On'],['Travel watch','On'],['Merchant better-card alert','Optional']]}/>}
function Help(){return <GenericDetail kicker="HELP & FEEDBACK" title="Correct data fast and keep trust high." rows={[['Report card data issue','Send exact field correction'],['Travel result issue','Flag provider/source mismatch'],['Rewards question','Ask CIRA'],['Human support','Escalate when needed']]}/>}

function AlertsPanel({ onClose, setDetail }: { onClose:()=>void; setDetail:(v:DetailView)=>void }) { return <div className="ref-alert-panel"><div><b>Smart alerts</b><button onClick={onClose}><X/></button></div><button onClick={()=>setDetail('milestones')}><Trophy/><span><b>Atlas milestone</b><small>18 days left</small></span></button><button onClick={()=>setDetail('benefits')}><Gift/><span><b>Benefit expiring</b><small>Review before renewal</small></span></button><button onClick={()=>setDetail('flight-results')}><Plane/><span><b>Domestic route watch</b><small>Needs live provider verification</small></span></button></div> }

function BottomNav({ tab, goTab }: { tab:MainTab; goTab:(t:MainTab)=>void }) {
  const defs=[[Home,'home','Home'],[WalletCards,'wallet','Wallet'],[Sparkles,'cira','CIRA'],[Plane,'travel','Travel'],[CreditCard,'cards','Cards'],[MoreHorizontal,'menu','Menu']] as const
  return <nav className="ref-bottom-nav">{defs.map(([Icon,id,label])=><button key={id} className={`${tab===id?'active':''} ${id==='cira'?'cira':''}`} onClick={()=>goTab(id)}><span><Icon/></span><small>{label}</small></button>)}</nav>
}

function HeaderCopy({ kicker, title, body }: { kicker:string; title:string; body:string }) { return <div className="ref-header-copy"><p>{kicker}</p><h2>{title}</h2><span>{body}</span></div> }
function LogoWordmark(){return <div className="ref-wordmark large">Credit<span>IQ</span></div>}
function ToggleRow({ icon:Icon, title, text, on }: { icon:any; title:string; text:string; on:boolean }) { const [enabled,setEnabled]=useState(on);return <button className="ref-toggle-row" onClick={()=>setEnabled(!enabled)}><span><Icon/></span><div><b>{title}</b><small>{text}</small></div><i className={enabled?'on':''}><em/></i></button> }
function ImportRow({ icon:Icon, title, text }: { icon:any; title:string; text:string }) { return <button className="ref-import-row"><span><Icon/></span><div><b>{title}</b><small>{text}</small></div><ChevronRight/></button> }
function CardFan(){return <div className="ref-card-fan"><Image className="fan-a" src="/card-art/hdfc-infinia.webp" alt="HDFC Infinia" width={180} height={115}/><Image className="fan-b" src="/card-art/axis-atlas.webp" alt="Axis Atlas" width={180} height={115}/><Image className="fan-c" src="/card-art/amex-platinum-travel.webp" alt="AmEx Platinum Travel" width={180} height={115}/></div>}
function SectionTitle({ title, action }: { title:string; action?:string }){return <div className="ref-section-title"><h3>{title}</h3>{action&&<button>{action}</button>}</div>}
function RecommendationCard({ primary=false }: { primary?:boolean }){return <button className={`ref-recommendation ${primary?'primary':''}`}><Image src={primary?'/card-art/hdfc-infinia.webp':'/card-art/amex-platinum-travel.webp'} alt={primary?'HDFC Infinia':'AmEx Platinum Travel'} width={92} height={58}/><div><small>{primary?'RECOMMENDED':'SECOND BEST'}</small><b>{primary?'HDFC Infinia':'AmEx Platinum Travel'}</b><span>{primary?'Earn 720 points · projected value ₹360':'Earn 480 points · projected value ₹240'}</span></div><ChevronRight/></button>}
function DecisionOption({ title, value, text, recommended=false }: { title:string; value:string; text:string; recommended?:boolean }){return <section className={`ref-decision-option ${recommended?'recommended':''}`}><div><span>{title}</span><b>{value}</b><small>{text}</small></div><button>Select</button></section>}
function MenuRow({ icon:Icon, title, text, onClick }: { icon:any; title:string; text:string; onClick:()=>void }){return <button onClick={onClick}><Icon/><div><b>{title}</b><span>{text}</span></div><ChevronRight/></button>}
function GenericDetail({ kicker, title, rows, action }: { kicker:string; title:string; rows:Array<[string,string]>; action?:string }){return <div className="ref-stack ref-detail-screen"><HeaderCopy kicker={kicker} title={title} body="Reference-board visual system · financial values remain demo unless explicitly verified live."/><div className="ref-generic-list">{rows.map(([a,b])=><div key={a}><b>{a}</b><span>{b}</span><ChevronRight/></div>)}</div>{action&&<button className="ref-gold-btn">{action}<ArrowRight/></button>}</div>}

function tabTitle(tab:MainTab){return ({home:'A brighter financial day.',wallet:'Your Wallet',cira:'CIRA',travel:'Travel',cards:'Cards',menu:'My Account'} as Record<MainTab,string>)[tab]}
function greetingFor(tab:MainTab){return tab==='home'?'GOOD MORNING, GOGO':tab==='cira'?'YOUR PERSONAL CARD & TRAVEL INTELLIGENCE':'SMARTER CARDS. BRIGHTER JOURNEYS.'}
function detailTitle(detail:Exclude<DetailView,null>){return ({spend:'Spend Smart','flight-results':'Domestic Flight Results','flight-decision':'Flight Decision','hotel-results':'Domestic Stay Results','hotel-decision':'Stay Decision','card-detail':'Card Detail',benefits:'Benefits',milestones:'Milestones',transfers:'Transfer Partners',compare:'Compare Cards',switch:'Switch Wizard',roast:'Card Roast',statement:'Statement Truth',concierge:'Concierge',offers:'Offers & Benefits',profile:'My Account',privacy:'Privacy & Security',notifications:'Notifications',help:'Help & Feedback'} as Record<Exclude<DetailView,null>,string>)[detail]}

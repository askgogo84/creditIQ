'use client'

import Image from 'next/image'
import { useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Compass,
  CreditCard,
  EyeOff,
  FileText,
  Fingerprint,
  Gift,
  Headphones,
  Home,
  Hotel,
  KeyRound,
  Landmark,
  Lightbulb,
  LockKeyhole,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plane,
  Plus,
  Receipt,
  RotateCcw,
  ScanLine,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  TrendingUp,
  UserRound,
  WalletCards,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'

type Section = 'home' | 'wallet' | 'spend' | 'travel' | 'cards' | 'cira' | 'profile'
type TravelTab = 'flights' | 'hotels' | 'dream' | 'explore'
type CardId = 'infinia' | 'atlas' | 'amex'

type CardDef = {
  id: CardId
  bank: string
  name: string
  points: string
  value: string
  grade: string
  note: string
  tone: string
}

const cards: CardDef[] = [
  { id: 'infinia', bank: 'HDFC', name: 'Infinia Metal', points: '68,500 pts', value: '₹68.5K demo value', grade: 'A', note: 'Strong for flights, hotels and premium redemptions.', tone: 'from-[#24241f] via-[#35342c] to-[#9a7a39]' },
  { id: 'atlas', bank: 'Axis', name: 'Atlas', points: '31,200 miles', value: '₹42.1K demo value', grade: 'A-', note: 'Strong transfer flexibility and travel earning.', tone: 'from-[#0f2234] via-[#183d5f] to-[#477d9e]' },
  { id: 'amex', bank: 'AmEx', name: 'Platinum Travel', points: '52,000 MR', value: '₹39.0K demo value', grade: 'B+', note: 'Best around milestones and selected transfer partners.', tone: 'from-[#4a321e] via-[#8b6537] to-[#d5b178]' },
]

const sectionMeta: Record<Section, { title: string; eyebrow: string }> = {
  home: { title: 'Your money, clearer.', eyebrow: 'Today' },
  wallet: { title: 'Your cards & points.', eyebrow: 'Wallet' },
  spend: { title: 'Use the right card.', eyebrow: 'Spend Smart' },
  travel: { title: 'Book travel smarter.', eyebrow: 'Travel' },
  cards: { title: 'Find your next card.', eyebrow: 'Cards' },
  cira: { title: 'Ask CIRA anything.', eyebrow: 'Concierge AI' },
  profile: { title: 'Your CreditIQ.', eyebrow: 'Profile' },
}

function AppCard({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`w-full rounded-[22px] border border-[#dcd7cb] bg-white p-4 text-left shadow-[0_8px_24px_rgba(30,28,23,0.045)] ${onClick ? 'active:scale-[0.99] transition-transform' : ''} ${className}`}
    >
      {children}
    </Tag>
  )
}

function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'gold' | 'green' | 'red' | 'dark' }) {
  const toneClass = {
    neutral: 'border-[#d7d2c7] bg-[#f7f4ed] text-[#66645d]',
    gold: 'border-[#dcc79a] bg-[#f7edd7] text-[#7f5e20]',
    green: 'border-[#b9d6c7] bg-[#eaf4ee] text-[#2f6b50]',
    red: 'border-[#e2c0bc] bg-[#f8ecea] text-[#9c4b42]',
    dark: 'border-[#3c3d36] bg-[#24251f] text-white',
  }[tone]
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-[0.06em] uppercase ${toneClass}`}>{children}</span>
}

function CiraOrb({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`relative grid shrink-0 place-items-center rounded-[18px] bg-[#1c1d18] shadow-[0_10px_28px_rgba(27,28,24,.18)] ${compact ? 'h-10 w-10' : 'h-14 w-14'}`}>
      <Image src="/creditiq_logo_512.png" alt="CreditIQ" width={compact ? 28 : 38} height={compact ? 28 : 38} className="rounded-[11px]" />
      <span className="absolute right-1 top-1 h-2 w-2 rounded-full border border-white bg-emerald-400" />
    </div>
  )
}

function Header({ section, onNotifications }: { section: Section; onNotifications: () => void }) {
  const meta = sectionMeta[section]
  return (
    <header className="px-5 pb-4 pt-[calc(14px+env(safe-area-inset-top))]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CiraOrb compact />
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#98702b]">{meta.eyebrow}</p>
            <h1 className="mt-0.5 font-serif text-[25px] leading-none tracking-[-0.035em] text-[#1b1c18]">{meta.title}</h1>
          </div>
        </div>
        <button aria-label="Notifications" onClick={onNotifications} className="relative grid h-11 w-11 place-items-center rounded-full border border-[#d8d4ca] bg-white text-[#1b1c18] shadow-sm active:scale-95">
          <Bell size={18} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#bd913d]" />
        </button>
      </div>
    </header>
  )
}

function BottomNav({ section, onNavigate, onMore }: { section: Section; onNavigate: (section: Section) => void; onMore: () => void }) {
  const items: Array<{ id: Section | 'more'; label: string; Icon: LucideIcon }> = [
    { id: 'home', label: 'Home', Icon: Home },
    { id: 'wallet', label: 'Wallet', Icon: WalletCards },
    { id: 'travel', label: 'Travel', Icon: Plane },
    { id: 'cira', label: 'CIRA', Icon: Sparkles },
    { id: 'more', label: 'More', Icon: MoreHorizontal },
  ]
  return (
    <nav className="absolute inset-x-0 bottom-0 z-30 border-t border-[#d8d3c8] bg-[#fbf9f4]/95 px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl" aria-label="Prototype primary navigation">
      <div className="grid grid-cols-5">
        {items.map(({ id, label, Icon }) => {
          const selected = id === section || (id === 'more' && ['spend', 'cards', 'profile'].includes(section))
          if (id === 'cira') {
            return (
              <button key={id} onClick={() => onNavigate('cira')} className="flex min-h-[58px] flex-col items-center justify-end gap-1 text-[10px] font-bold">
                <span className={`grid h-11 w-11 place-items-center rounded-[16px] border shadow-sm transition ${selected ? 'border-[#bd913d] bg-[#1b1c18] text-white' : 'border-[#d8d3c8] bg-white text-[#98702b]'}`}><Icon size={18} /></span>
                <span className={selected ? 'text-[#1b1c18]' : 'text-[#77746c]'}>{label}</span>
              </button>
            )
          }
          return (
            <button key={id} onClick={() => id === 'more' ? onMore() : onNavigate(id)} className={`flex min-h-[58px] flex-col items-center justify-end gap-1 rounded-[16px] text-[10px] font-bold ${selected ? 'text-[#1b1c18]' : 'text-[#89867e]'}`}>
              <Icon size={20} strokeWidth={selected ? 2.5 : 1.9} />
              <span>{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function SectionTabs({ tabs, active, onChange }: { tabs: Array<{ id: string; label: string }>; active: string; onChange: (id: string) => void }) {
  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-2">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => onChange(tab.id)} className={`min-h-10 rounded-full border px-4 text-xs font-bold transition ${active === tab.id ? 'border-[#1b1c18] bg-[#1b1c18] text-white' : 'border-[#d8d3c8] bg-white text-[#6f6c64]'}`}>{tab.label}</button>
        ))}
      </div>
    </div>
  )
}

function HomeScreen({ onNavigate, onCard }: { onNavigate: (section: Section) => void; onCard: (id: CardId) => void }) {
  return (
    <div className="space-y-4 px-5 pb-5">
      <div className="overflow-hidden rounded-[28px] border border-[#383a32] bg-[#1b1c18] p-5 text-white shadow-[0_18px_50px_rgba(23,24,20,.18)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Pill tone="gold"><Zap size={11} /> Best move</Pill>
            <h2 className="mt-4 max-w-[270px] font-serif text-[31px] leading-[1.02] tracking-[-0.04em]">Your next decision is worth checking.</h2>
            <p className="mt-3 text-sm leading-6 text-[#b9b5aa]">Demo wallet shows a better travel path than simple cashback. CIRA keeps projected and executable actions separate.</p>
          </div>
          <CiraOrb />
        </div>
        <button onClick={() => onNavigate('cira')} className="mt-5 flex min-h-12 w-full items-center justify-between rounded-[16px] bg-[#f1ece1] px-4 text-sm font-extrabold text-[#1b1c18] active:scale-[0.99]">
          Ask CIRA to explain <ArrowRight size={17} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AppCard><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#77746d]">Demo points</p><p className="mt-1 text-2xl font-black tracking-[-.04em] text-[#1b1c18]">151.7K</p><p className="mt-1 text-xs text-[#77746d]">Across 3 cards</p></AppCard>
        <AppCard><p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#77746d]">Tracked value</p><p className="mt-1 text-2xl font-black tracking-[-.04em] text-[#1b1c18]">₹1.50L</p><p className="mt-1 text-xs text-[#77746d]">Prototype estimate</p></AppCard>
      </div>

      <div>
        <div className="mb-2 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#98702b]">Action center</p><h3 className="mt-1 text-lg font-extrabold text-[#1b1c18]">What needs attention</h3></div><button onClick={() => onNavigate('wallet')} className="text-xs font-bold text-[#98702b]">View wallet</button></div>
        <div className="space-y-2">
          <AppCard onClick={() => onCard('infinia')}>
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#f6ecd6] text-[#98702b]"><TrendingUp size={18} /></span><div className="min-w-0 flex-1"><p className="font-bold text-[#1b1c18]">Infinia has your strongest travel path</p><p className="mt-0.5 text-xs text-[#77746d]">Open the card to compare redemption rails.</p></div><ChevronRight size={18} className="text-[#8d8a82]" /></div>
          </AppCard>
          <AppCard onClick={() => onNavigate('spend')}>
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#eaf1eb] text-[#356b50]"><ShoppingBag size={18} /></span><div className="min-w-0 flex-1"><p className="font-bold text-[#1b1c18]">Before you pay, check the merchant</p><p className="mt-0.5 text-xs text-[#77746d]">Spend Smart picks the best card for the purchase.</p></div><ChevronRight size={18} className="text-[#8d8a82]" /></div>
          </AppCard>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between"><h3 className="text-lg font-extrabold text-[#1b1c18]">Quick actions</h3><Pill>Demo</Pill></div>
        <div className="grid grid-cols-4 gap-2">
          {[
            ['Spend', ScanLine, 'spend' as Section],
            ['Travel', Plane, 'travel' as Section],
            ['Cards', CreditCard, 'cards' as Section],
            ['CIRA', Sparkles, 'cira' as Section],
          ].map(([label, Icon, target]) => (
            <button key={label as string} onClick={() => onNavigate(target as Section)} className="flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-[18px] border border-[#dad5ca] bg-white text-[11px] font-bold text-[#36362f] shadow-sm active:scale-[.98]">
              <Icon size={20} className="text-[#98702b]" /><span>{label as string}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function WalletScreen({ onCard }: { onCard: (id: CardId) => void }) {
  return (
    <div className="space-y-4 px-5 pb-5">
      <div className="rounded-[26px] bg-[#1b1c18] p-5 text-white">
        <div className="flex items-start justify-between"><div><p className="text-xs text-[#aaa79c]">Demo wallet value</p><p className="mt-1 text-[38px] font-black tracking-[-.055em]">₹1,49,600</p><p className="text-xs text-[#aaa79c]">Value depends on redemption path and verification.</p></div><WalletCards className="text-[#bd913d]" size={30} /></div>
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center"><div><b className="text-lg">3</b><span className="block text-[10px] text-[#aaa79c]">Cards</span></div><div><b className="text-lg">151.7K</b><span className="block text-[10px] text-[#aaa79c]">Points</span></div><div><b className="text-lg">2</b><span className="block text-[10px] text-[#aaa79c]">Verify</span></div></div>
      </div>

      <div className="flex items-center justify-between"><h3 className="text-lg font-extrabold text-[#1b1c18]">Your cards</h3><button className="flex min-h-10 items-center gap-1 rounded-full border border-[#d8d3c8] bg-white px-3 text-xs font-bold"><Plus size={14} /> Add</button></div>
      <div className="space-y-3">
        {cards.map(card => <WalletCard key={card.id} card={card} onClick={() => onCard(card.id)} />)}
      </div>

      <AppCard>
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#f2eee5] text-[#98702b]"><FileText size={18} /></span><div><p className="font-bold text-[#1b1c18]">Statement Truth</p><p className="mt-1 text-xs leading-5 text-[#77746d]">Upload a statement to verify points, fees and transaction-level reward accuracy without changing your manually entered wallet.</p></div></div>
      </AppCard>
    </div>
  )
}

function WalletCard({ card, onClick }: { card: CardDef; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full overflow-hidden rounded-[24px] bg-gradient-to-br ${card.tone} p-5 text-left text-white shadow-[0_14px_36px_rgba(28,29,25,.14)] active:scale-[.99]`}>
      <div className="flex items-start justify-between"><div><p className="text-xs font-bold text-white/65">{card.bank}</p><h4 className="mt-1 text-xl font-extrabold">{card.name}</h4></div><span className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-sm font-black text-[#1b1c18]">{card.grade}</span></div>
      <div className="mt-8 flex items-end justify-between"><div><p className="text-xs text-white/60">Balance</p><p className="mt-1 text-lg font-bold">{card.points}</p></div><div className="text-right"><p className="text-xs text-white/60">Best demo value</p><p className="mt-1 text-sm font-bold">{card.value}</p></div></div>
    </button>
  )
}

function SpendScreen() {
  const [merchant, setMerchant] = useState('Swiggy')
  const [amount, setAmount] = useState('1,850')
  const suggestions = ['Swiggy', 'Amazon', 'Marriott', 'MakeMyTrip']
  const recommendation = merchant === 'Marriott' || merchant === 'MakeMyTrip' ? 'HDFC Infinia Metal' : merchant === 'Amazon' ? 'AmEx Platinum Travel' : 'Axis Atlas'
  return (
    <div className="space-y-4 px-5 pb-5">
      <AppCard className="border-[#d7c49a] bg-[#fffaf0]">
        <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-[16px] bg-[#1b1c18] text-[#d5b56b]"><ScanLine size={22} /></span><div><p className="font-extrabold text-[#1b1c18]">Before you pay</p><p className="mt-1 text-xs leading-5 text-[#77746d]">Search the merchant and CreditIQ shows the best card from your wallet.</p></div></div>
      </AppCard>

      <div className="grid grid-cols-[1fr_108px] gap-2">
        <label className="rounded-[18px] border border-[#d8d3c8] bg-white px-4 py-3"><span className="block text-[9px] font-bold uppercase tracking-[.11em] text-[#8b887f]">Merchant</span><input value={merchant} onChange={e => setMerchant(e.target.value)} className="mt-1 w-full bg-transparent text-base font-bold outline-none" /></label>
        <label className="rounded-[18px] border border-[#d8d3c8] bg-white px-4 py-3"><span className="block text-[9px] font-bold uppercase tracking-[.11em] text-[#8b887f]">Amount</span><input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" className="mt-1 w-full bg-transparent text-base font-bold outline-none" /></label>
      </div>
      <div className="flex flex-wrap gap-2">{suggestions.map(s => <button key={s} onClick={() => setMerchant(s)} className={`rounded-full border px-3 py-2 text-xs font-bold ${merchant === s ? 'border-[#1b1c18] bg-[#1b1c18] text-white' : 'border-[#d8d3c8] bg-white text-[#77746d]'}`}>{s}</button>)}</div>

      <div className="rounded-[26px] border border-[#c6d9ce] bg-[#edf6f0] p-5">
        <div className="flex items-center justify-between"><Pill tone="green"><CheckCircle2 size={11} /> Best match</Pill><span className="text-xs font-bold text-[#356b50]">Demo result</span></div>
        <h3 className="mt-4 font-serif text-[29px] leading-none tracking-[-.04em] text-[#1b1c18]">Use {recommendation}</h3>
        <p className="mt-3 text-sm leading-6 text-[#5f6e64]">For ₹{amount || '0'} at {merchant || 'this merchant'}, this wallet path is currently strongest in the prototype.</p>
        <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-[16px] bg-white/70 p-3"><span className="text-[10px] text-[#718176]">Projected reward</span><b className="mt-1 block text-lg text-[#2f6b50]">₹185</b></div><div className="rounded-[16px] bg-white/70 p-3"><span className="text-[10px] text-[#718176]">Runner-up</span><b className="mt-1 block text-lg text-[#1b1c18]">₹122</b></div></div>
      </div>

      <div><h3 className="mb-2 text-lg font-extrabold text-[#1b1c18]">Why this card?</h3><AppCard><div className="space-y-3 text-sm text-[#66645d]"><div className="flex gap-3"><BadgeCheck size={18} className="mt-0.5 shrink-0 text-[#98702b]" /><p>Uses exact-card rules from the selected wallet card, not a generic bank assumption.</p></div><div className="flex gap-3"><CircleDollarSign size={18} className="mt-0.5 shrink-0 text-[#98702b]" /><p>Shows reward value as a projection until the final merchant/issuer checkout confirms it.</p></div></div></AppCard></div>
    </div>
  )
}

function TravelScreen() {
  const [tab, setTab] = useState<TravelTab>('flights')
  const tabs = [{ id: 'flights', label: 'Flights' }, { id: 'hotels', label: 'Hotels' }, { id: 'dream', label: 'Dream Trip' }, { id: 'explore', label: 'Explore' }]
  return (
    <div className="space-y-4 px-5 pb-5">
      <SectionTabs tabs={tabs} active={tab} onChange={id => setTab(id as TravelTab)} />
      {tab === 'flights' && <FlightPrototype />}
      {tab === 'hotels' && <HotelPrototype />}
      {tab === 'dream' && <DreamTripPrototype />}
      {tab === 'explore' && <ExplorePrototype />}
    </div>
  )
}

function FlightPrototype() {
  const [searched, setSearched] = useState(false)
  return (
    <>
      <div className="rounded-[26px] bg-[#1b1c18] p-5 text-white">
        <div className="flex items-center justify-between"><Pill tone="gold">Flight planner</Pill><Plane size={25} className="text-[#d5b56b]" /></div>
        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-end gap-3"><div><span className="text-[10px] text-[#a9a69c]">FROM</span><b className="mt-1 block text-3xl">BLR</b><small className="text-[#a9a69c]">Bengaluru</small></div><ArrowRight className="mb-3 text-[#d5b56b]" /><div className="text-right"><span className="text-[10px] text-[#a9a69c]">TO</span><b className="mt-1 block text-3xl">SIN</b><small className="text-[#a9a69c]">Singapore</small></div></div>
        <div className="mt-5 grid grid-cols-2 gap-2"><button className="min-h-12 rounded-[15px] border border-white/10 bg-white/5 px-3 text-left"><span className="block text-[9px] text-[#a9a69c]">DATE</span><b className="text-xs">8 Oct 2026</b></button><button className="min-h-12 rounded-[15px] border border-white/10 bg-white/5 px-3 text-left"><span className="block text-[9px] text-[#a9a69c]">CABIN</span><b className="text-xs">Business</b></button></div>
        <button onClick={() => setSearched(true)} className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-[15px] bg-[#f0ebe0] text-sm font-extrabold text-[#1b1c18]"><Search size={16} /> Compare cash + points</button>
      </div>
      {searched ? (
        <div className="space-y-3">
          <AppCard className="border-[#d7c49a] bg-[#fffaf0]"><div className="flex items-start gap-3"><AlertTriangle size={19} className="mt-0.5 shrink-0 text-[#98702b]" /><div><p className="font-bold text-[#1b1c18]">Prototype safety state</p><p className="mt-1 text-xs leading-5 text-[#706a5d]">No live INR Business cash provider is assumed here. The full product should show verified provider data only when currency and cabin match.</p></div></div></AppCard>
          <AppCard><div className="flex items-center justify-between"><div><Pill tone="green">Projected</Pill><p className="mt-3 font-extrabold text-[#1b1c18]">Transfer → KrisFlyer</p><p className="mt-1 text-xs leading-5 text-[#77746d]">Demo: 43,000 programme miles + taxes. Reconfirm award first.</p></div><ChevronRight size={18} /></div></AppCard>
          <AppCard><div className="flex items-center justify-between"><div><Pill>Executable</Pill><p className="mt-3 font-extrabold text-[#1b1c18]">Pay cash & retain points</p><p className="mt-1 text-xs text-[#77746d]">Shown only when comparable cash pricing is verified.</p></div><ChevronRight size={18} /></div></AppCard>
        </div>
      ) : <AppCard><p className="text-sm font-bold text-[#1b1c18]">Wallet-aware by design</p><p className="mt-1 text-xs leading-5 text-[#77746d]">Search results compare exact card rails, live/cached award authority, transfer timing and irreversible steps.</p></AppCard>}
    </>
  )
}

function HotelPrototype() {
  return (
    <>
      <AppCard className="overflow-hidden bg-[linear-gradient(145deg,#fff,#f6efe2)]">
        <div className="flex items-center justify-between"><div><Pill tone="gold">Bangkok</Pill><h3 className="mt-3 font-serif text-[29px] leading-none tracking-[-.04em] text-[#1b1c18]">A smarter stay search.</h3></div><Hotel size={32} className="text-[#98702b]" /></div>
        <div className="mt-5 grid grid-cols-2 gap-2"><div className="rounded-[16px] border border-[#ddd6c8] bg-white p-3"><CalendarDays size={16} className="text-[#98702b]" /><b className="mt-2 block text-xs">15–18 Oct</b></div><div className="rounded-[16px] border border-[#ddd6c8] bg-white p-3"><UserRound size={16} className="text-[#98702b]" /><b className="mt-2 block text-xs">2 guests</b></div></div>
      </AppCard>
      <AppCard><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-[16px] bg-[#f0eadf] text-[#98702b]"><Building2 size={21} /></span><div className="flex-1"><div className="flex items-center gap-2"><p className="font-bold text-[#1b1c18]">Marriott · Demo property</p><Pill tone="green">Mapped</Pill></div><p className="mt-1 text-xs text-[#77746d]">Cash + award join + wallet rail comparison.</p></div><ChevronRight size={18} /></div></AppCard>
      <AppCard><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-[16px] bg-[#f0eadf] text-[#98702b]"><Landmark size={21} /></span><div className="flex-1"><div className="flex items-center gap-2"><p className="font-bold text-[#1b1c18]">Independent Hotel</p><Pill>Unmapped</Pill></div><p className="mt-1 text-xs text-[#77746d]">Cash can remain visible without inventing a loyalty programme.</p></div><ChevronRight size={18} /></div></AppCard>
    </>
  )
}

function DreamTripPrototype() {
  return (
    <>
      <div className="rounded-[28px] border border-[#3b3c35] bg-[#1b1c18] p-5 text-white"><Pill tone="gold"><Sparkles size={11} /> AI itinerary</Pill><h3 className="mt-4 font-serif text-[31px] leading-[1.02] tracking-[-.04em]">“Plan me 5 nights in Japan using my points.”</h3><p className="mt-3 text-sm leading-6 text-[#aaa79c]">CreditIQ can turn your wallet, dates and travel preference into a redemption-first trip plan.</p><button className="mt-5 min-h-12 w-full rounded-[15px] bg-[#efeadd] text-sm font-extrabold text-[#1b1c18]">Build demo itinerary</button></div>
      <AppCard><div className="flex items-start gap-3"><MapPin className="mt-1 text-[#98702b]" size={19} /><div><p className="font-bold text-[#1b1c18]">Tokyo → Kyoto → Osaka</p><p className="mt-1 text-xs leading-5 text-[#77746d]">Flights, hotels and transfer paths remain separate until inventory is confirmed.</p></div></div></AppCard>
    </>
  )
}

function ExplorePrototype() {
  const rows = [['Singapore', 'Strong KrisFlyer options', Plane], ['Paris', 'Hotel transfer opportunity', Hotel], ['Dubai', 'Short-haul cash + points mix', Compass]] as const
  return <div className="space-y-3">{rows.map(([city, note, Icon]) => <AppCard key={city}><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#f2eee5] text-[#98702b]"><Icon size={19} /></span><div className="flex-1"><p className="font-bold text-[#1b1c18]">{city}</p><p className="mt-1 text-xs text-[#77746d]">{note}</p></div><ArrowUpRight size={17} className="text-[#98702b]" /></div></AppCard>)}</div>
}

function CardsScreen() {
  const [goal, setGoal] = useState('Travel')
  return (
    <div className="space-y-4 px-5 pb-5">
      <div className="rounded-[28px] bg-[#1b1c18] p-5 text-white"><div className="flex items-start justify-between"><div><Pill tone="gold">Card Finder</Pill><h2 className="mt-4 font-serif text-[31px] leading-none tracking-[-.04em]">One recommendation, with reasons.</h2><p className="mt-3 text-sm leading-6 text-[#aaa79c]">Choose what matters and the prototype narrows the market around your current wallet.</p></div><CreditCard size={29} className="text-[#d5b56b]" /></div></div>
      <div><p className="mb-2 text-xs font-bold text-[#67645c]">What matters most?</p><div className="flex gap-2 overflow-x-auto [scrollbar-width:none]">{['Travel', 'Cashback', 'Lifestyle', 'No fee'].map(item => <button key={item} onClick={() => setGoal(item)} className={`min-h-10 shrink-0 rounded-full border px-4 text-xs font-bold ${goal === item ? 'border-[#1b1c18] bg-[#1b1c18] text-white' : 'border-[#d8d3c8] bg-white text-[#77746d]'}`}>{item}</button>)}</div></div>
      <AppCard className="border-[#d6c49b] bg-[#fffaf0]"><div className="flex items-start justify-between"><div><Pill tone="gold">Best fit · Demo</Pill><h3 className="mt-3 text-xl font-extrabold text-[#1b1c18]">Axis Atlas</h3><p className="mt-2 text-sm leading-6 text-[#706a5d]">For the selected {goal.toLowerCase()} goal, this prototype scores Atlas highest after considering your current cards.</p></div><span className="grid h-11 w-11 place-items-center rounded-full bg-[#1b1c18] text-sm font-black text-white">91</span></div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><div className="rounded-[14px] bg-white/70 p-2"><Star size={15} className="mx-auto text-[#98702b]" /><span className="mt-1 block text-[9px]">Fit</span><b className="text-xs">High</b></div><div className="rounded-[14px] bg-white/70 p-2"><Gift size={15} className="mx-auto text-[#98702b]" /><span className="mt-1 block text-[9px]">Rewards</span><b className="text-xs">Strong</b></div><div className="rounded-[14px] bg-white/70 p-2"><BarChart3 size={15} className="mx-auto text-[#98702b]" /><span className="mt-1 block text-[9px]">Overlap</span><b className="text-xs">Low</b></div></div></AppCard>
      <AppCard><div className="flex items-center justify-between"><div><p className="font-bold text-[#1b1c18]">Compare shortlisted cards</p><p className="mt-1 text-xs text-[#77746d]">Fees, earn rates, lounge rules and redemption paths.</p></div><ChevronRight size={18} /></div></AppCard>
      <AppCard><div className="flex items-center justify-between"><div><p className="font-bold text-[#1b1c18]">Switch Wizard</p><p className="mt-1 text-xs text-[#77746d]">Find cards you may be overpaying to keep.</p></div><ChevronRight size={18} /></div></AppCard>
    </div>
  )
}

function CiraScreen() {
  const [messages, setMessages] = useState<Array<{ from: 'user' | 'cira'; text: string }>>([
    { from: 'cira', text: 'I can compare your exact cards, explain a redemption path, or help plan a trip. What are you deciding?' },
  ])
  const [draft, setDraft] = useState('')
  const quick = ['Best card for ₹25K travel?', 'Explain my Infinia points', 'Plan BLR → SIN in Business']
  function send(text = draft) {
    const clean = text.trim()
    if (!clean) return
    setMessages(prev => [...prev, { from: 'user', text: clean }, { from: 'cira', text: 'Prototype answer: I would first verify the exact card, price source and redemption authority, then show projected versus executable options without inventing missing values.' }])
    setDraft('')
  }
  return (
    <div className="flex min-h-full flex-col px-5 pb-5">
      <div className="mb-4 rounded-[24px] border border-[#3a3b34] bg-[#1b1c18] p-4 text-white"><div className="flex items-center gap-3"><CiraOrb /><div><p className="font-extrabold">CIRA</p><p className="mt-1 text-xs text-[#aaa79c]">Wallet-aware · source-aware · verification-first</p></div></div></div>
      <div className="space-y-3">
        {messages.map((message, index) => <div key={`${message.from}-${index}`} className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[84%] rounded-[20px] px-4 py-3 text-sm leading-6 ${message.from === 'user' ? 'rounded-br-[6px] bg-[#1b1c18] text-white' : 'rounded-bl-[6px] border border-[#ddd8cd] bg-white text-[#4e4d47]'}`}>{message.text}</div></div>)}
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">{quick.map(item => <button key={item} onClick={() => send(item)} className="min-h-10 shrink-0 rounded-full border border-[#d8d3c8] bg-white px-3 text-[11px] font-bold text-[#65635c]">{item}</button>)}</div>
      <div className="mt-4 flex items-end gap-2 rounded-[20px] border border-[#d7d2c8] bg-white p-2 shadow-sm"><textarea value={draft} onChange={e => setDraft(e.target.value)} rows={1} placeholder="Ask CIRA…" className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none" /><button onClick={() => send()} className="grid h-11 w-11 shrink-0 place-items-center rounded-[15px] bg-[#1b1c18] text-white active:scale-95"><Send size={17} /></button></div>
    </div>
  )
}

function ProfileScreen() {
  return (
    <div className="space-y-4 px-5 pb-5">
      <AppCard><div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-full bg-[#1b1c18] text-xl font-black text-white">G</div><div className="flex-1"><p className="text-lg font-extrabold text-[#1b1c18]">Gogo</p><p className="mt-1 text-xs text-[#77746d]">Prototype account · India</p></div><Pill tone="gold">Pro</Pill></div></AppCard>
      <div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#98702b]">Security & privacy</p><div className="overflow-hidden rounded-[22px] border border-[#d8d3c8] bg-white">{[
        ['App lock', Fingerprint, 'Face / fingerprint ready'],
        ['Sensitive fields', EyeOff, 'Reveal only after confirmation'],
        ['Data controls', ShieldCheck, 'Review connected sources'],
        ['Passkeys', KeyRound, 'Stronger sign-in'],
      ].map(([label, Icon, desc], index) => <button key={label as string} className={`flex w-full items-center gap-3 px-4 py-4 text-left ${index ? 'border-t border-[#eeeae2]' : ''}`}><span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#f3efe7] text-[#98702b]"><Icon size={18} /></span><div className="flex-1"><p className="text-sm font-bold text-[#1b1c18]">{label as string}</p><p className="mt-0.5 text-[11px] text-[#77746d]">{desc as string}</p></div><ChevronRight size={16} className="text-[#8d8a82]" /></button>)}</div></div>
      <div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.13em] text-[#98702b]">Help</p><div className="overflow-hidden rounded-[22px] border border-[#d8d3c8] bg-white"><button className="flex w-full items-center gap-3 px-4 py-4 text-left"><Headphones size={19} className="text-[#98702b]" /><span className="flex-1 text-sm font-bold">Concierge support</span><ChevronRight size={16} /></button><button className="flex w-full items-center gap-3 border-t border-[#eeeae2] px-4 py-4 text-left"><Trash2 size={19} className="text-[#9c4b42]" /><span className="flex-1 text-sm font-bold text-[#9c4b42]">Delete demo data</span><ChevronRight size={16} /></button></div></div>
    </div>
  )
}

function CardDetail({ card, onClose }: { card: CardDef; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 bg-[#f7f3e9]">
      <div className="h-full overflow-y-auto pb-8">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ddd8ce] bg-[#f7f3e9]/95 px-5 pb-3 pt-[calc(14px+env(safe-area-inset-top))] backdrop-blur-xl"><button onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full border border-[#d7d2c8] bg-white"><X size={18} /></button><Pill>Card detail</Pill><button className="grid h-11 w-11 place-items-center rounded-full border border-[#d7d2c8] bg-white"><MoreHorizontal size={18} /></button></div>
        <div className="space-y-4 px-5 pt-5">
          <WalletCard card={card} onClick={() => {}} />
          <div className="grid grid-cols-2 gap-3"><AppCard><p className="text-[10px] uppercase tracking-[.1em] text-[#77746d]">Balance</p><b className="mt-2 block text-xl">{card.points}</b></AppCard><AppCard><p className="text-[10px] uppercase tracking-[.1em] text-[#77746d]">Card health</p><b className="mt-2 block text-xl">Grade {card.grade}</b></AppCard></div>
          <AppCard className="border-[#d5c499] bg-[#fffaf0]"><Pill tone="gold">Best projected use</Pill><h3 className="mt-3 text-xl font-extrabold text-[#1b1c18]">Travel redemption</h3><p className="mt-2 text-sm leading-6 text-[#706a5d]">{card.note}</p></AppCard>
          <div><h3 className="mb-2 text-lg font-extrabold">Redemption paths</h3><div className="space-y-2">{[['Transfer partner', 'Projected · verify first'], ['Issuer travel portal', 'Checkout verification'], ['Cash / statement credit', 'Executable when issuer value known']].map(([title, state]) => <AppCard key={title}><div className="flex items-center justify-between gap-3"><div><p className="font-bold">{title}</p><p className="mt-1 text-xs text-[#77746d]">{state}</p></div><ChevronRight size={17} /></div></AppCard>)}</div></div>
          <AppCard><div className="flex items-start gap-3"><LockKeyhole size={19} className="mt-0.5 text-[#98702b]" /><div><p className="font-bold">Sensitive information stays gated</p><p className="mt-1 text-xs leading-5 text-[#77746d]">The production app should never expose full identifiers or an irreversible transfer action without a deliberate confirmation boundary.</p></div></div></AppCard>
        </div>
      </div>
    </div>
  )
}

function MoreSheet({ onClose, onNavigate, section }: { onClose: () => void; onNavigate: (section: Section) => void; section: Section }) {
  const items: Array<{ id: Section; label: string; desc: string; Icon: LucideIcon }> = [
    { id: 'spend', label: 'Spend Smart', desc: 'Best card before you pay', Icon: ShoppingBag },
    { id: 'cards', label: 'Cards', desc: 'Find, compare and switch', Icon: CreditCard },
    { id: 'profile', label: 'Profile', desc: 'Security, data and account', Icon: UserRound },
  ]
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-black/30 p-2 backdrop-blur-[2px]" onClick={onClose}>
      <div className="w-full rounded-[28px] border border-[#d8d3c8] bg-[#fbf9f4] p-4 pb-[calc(14px+env(safe-area-inset-bottom))] shadow-[0_-18px_60px_rgba(20,20,16,.18)]" onClick={e => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#ccc6ba]" />
        <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#98702b]">More</p><h3 className="mt-1 text-xl font-extrabold">Everything else</h3></div><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-[#d8d3c8] bg-white"><X size={17} /></button></div>
        <div className="mt-4 space-y-2">{items.map(({ id, label, desc, Icon }) => <button key={id} onClick={() => { onNavigate(id); onClose() }} className={`flex w-full items-center gap-3 rounded-[18px] border p-3 text-left ${section === id ? 'border-[#c8b27f] bg-[#fff9eb]' : 'border-[#ded9cf] bg-white'}`}><span className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#f1ede4] text-[#98702b]"><Icon size={19} /></span><div className="flex-1"><p className="font-bold">{label}</p><p className="mt-0.5 text-[11px] text-[#77746d]">{desc}</p></div><ChevronRight size={17} /></button>)}</div>
        <div className="mt-3 grid grid-cols-2 gap-2"><button className="min-h-12 rounded-[16px] border border-[#d8d3c8] bg-white text-xs font-bold"><Receipt size={15} className="mr-1 inline" /> Statements</button><button className="min-h-12 rounded-[16px] border border-[#d8d3c8] bg-white text-xs font-bold"><MessageCircle size={15} className="mr-1 inline" /> Concierge</button></div>
      </div>
    </div>
  )
}

function NotificationSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex items-start justify-center bg-black/20 px-3 pt-[calc(70px+env(safe-area-inset-top))] backdrop-blur-[2px]" onClick={onClose}><div className="w-full max-w-[390px] rounded-[24px] border border-[#d8d3c8] bg-[#fbf9f4] p-4 shadow-[0_22px_60px_rgba(20,20,17,.2)]" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between"><h3 className="font-extrabold">Notifications</h3><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full border border-[#d8d3c8] bg-white"><X size={15} /></button></div><div className="mt-3 space-y-2"><AppCard className="p-3"><p className="text-sm font-bold">Travel provider check</p><p className="mt-1 text-[11px] leading-5 text-[#77746d]">Prototype reminder: only currency-verified cash pricing should enter comparison.</p></AppCard><AppCard className="p-3"><p className="text-sm font-bold">Wallet review</p><p className="mt-1 text-[11px] leading-5 text-[#77746d]">Two demo cards have projected paths that still require verification.</p></AppCard></div></div></div>
  )
}

export function MobileAppPrototype() {
  const [section, setSection] = useState<Section>('home')
  const [moreOpen, setMoreOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [cardDetail, setCardDetail] = useState<CardId | null>(null)
  const selectedCard = useMemo(() => cards.find(card => card.id === cardDetail) ?? null, [cardDetail])

  function navigate(next: Section) {
    setSection(next)
    setCardDetail(null)
  }

  let content: ReactNode
  if (section === 'home') content = <HomeScreen onNavigate={navigate} onCard={setCardDetail} />
  else if (section === 'wallet') content = <WalletScreen onCard={setCardDetail} />
  else if (section === 'spend') content = <SpendScreen />
  else if (section === 'travel') content = <TravelScreen />
  else if (section === 'cards') content = <CardsScreen />
  else if (section === 'cira') content = <CiraScreen />
  else content = <ProfileScreen />

  return (
    <main className="min-h-screen bg-[#e7e1d5] md:grid md:place-items-center md:p-6">
      <div className="relative mx-auto h-[100dvh] w-full overflow-hidden bg-[#f7f3e9] text-[#1b1c18] md:h-[calc(100vh-48px)] md:max-h-[900px] md:max-w-[430px] md:rounded-[40px] md:border md:border-white/60 md:shadow-[0_30px_90px_rgba(42,38,29,.28)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-48 bg-[radial-gradient(circle_at_70%_0%,rgba(189,145,61,.14),transparent_55%)]" />
        <div className="relative flex h-full flex-col">
          <div className="z-10 shrink-0"><Header section={section} onNotifications={() => setNotificationsOpen(true)} /></div>
          <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[92px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{content}</div>
          <BottomNav section={section} onNavigate={navigate} onMore={() => setMoreOpen(true)} />
          {moreOpen && <MoreSheet onClose={() => setMoreOpen(false)} onNavigate={navigate} section={section} />}
          {notificationsOpen && <NotificationSheet onClose={() => setNotificationsOpen(false)} />}
          {selectedCard && <CardDetail card={selectedCard} onClose={() => setCardDetail(null)} />}
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1 z-50 hidden h-6 w-28 -translate-x-1/2 rounded-full bg-[#11120f] md:block" />
      </div>
      <div className="fixed bottom-3 right-3 z-[60] hidden items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3 py-2 text-[10px] font-bold text-[#6d6a62] shadow-lg backdrop-blur md:flex"><BadgeCheck size={13} className="text-[#98702b]" /> Interactive prototype · demo data</div>
    </main>
  )
}

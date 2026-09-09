'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import {
  ArrowRight, BadgeCheck, BellRing, Check, ChevronLeft, CreditCard, Fingerprint,
  Gift, LockKeyhole, Mail, MessageCircle, Plane, Plus, ShieldCheck, Sparkles,
  Target, Upload, WalletCards, Zap
} from 'lucide-react'

type Props = { onComplete: () => void }
type Goal = 'earn' | 'travel' | 'save' | 'simplify'

const stories = [
  {
    eyebrow: 'KNOW BEFORE YOU PAY',
    title: 'Your wallet should tell you what to do next.',
    body: 'CreditIQ turns your cards, points and benefits into one clear decision — before you spend.',
    accent: 'BEST CARD · RIGHT NOW',
    icon: CreditCard,
  },
  {
    eyebrow: 'POINTS, MADE USEFUL',
    title: 'Stop counting points. Start seeing possibilities.',
    body: 'Know what your points can realistically unlock, what needs verification and when cash is smarter.',
    accent: 'VALUE · EXPIRY · TRANSFERS',
    icon: Gift,
  },
  {
    eyebrow: 'TRAVEL WITHOUT GUESSING',
    title: 'Cash or points? CreditIQ shows the trade-off.',
    body: 'Compare wallet-aware travel paths while keeping projected and executable options clearly separate.',
    accent: 'CASH VS POINTS · VERIFIED',
    icon: Plane,
  },
]

const demoCards = [
  { id: 'infinia', bank: 'HDFC', name: 'Infinia Metal', tail: '•• 4821', tone: 'from-[#0b1014] via-[#1e2a32] to-[#9e7b3d]' },
  { id: 'atlas', bank: 'Axis', name: 'Atlas', tail: '•• 9134', tone: 'from-[#101c36] via-[#172d58] to-[#4d74a8]' },
  { id: 'amex', bank: 'AmEx', name: 'Platinum Travel', tail: '•• 1447', tone: 'from-[#292328] via-[#60454a] to-[#b48669]' },
]

export function OnboardingJourney({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [story, setStory] = useState(0)
  const [selectedCards, setSelectedCards] = useState<string[]>(['infinia', 'atlas'])
  const [goals, setGoals] = useState<Goal[]>(['travel', 'earn'])
  const total = 8
  const progress = Math.round(((step + 1) / total) * 100)

  const next = () => setStep(s => Math.min(total - 1, s + 1))
  const back = () => setStep(s => Math.max(0, s - 1))

  const toggleCard = (id: string) => setSelectedCards(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id])
  const toggleGoal = (id: Goal) => setGoals(v => v.includes(id) ? v.filter(x => x !== id) : [...v, id])

  const top = step === 0 ? null : (
    <div className="ciq-v2-toprow">
      <button className="ciq-v2-iconbtn" onClick={back} aria-label="Back"><ChevronLeft size={20} /></button>
      <div className="ciq-v2-progress"><span style={{ width: `${progress}%` }} /></div>
      <span className="ciq-v2-step">{step}/{total - 1}</span>
    </div>
  )

  if (step === 0) {
    return (
      <div className="ciq-v2-onboarding ciq-v2-splash">
        <div className="ciq-v2-aurora ciq-v2-aurora-a" />
        <div className="ciq-v2-aurora ciq-v2-aurora-b" />
        <div className="ciq-v2-splash-inner">
          <div className="ciq-v2-logo-wrap"><Image src="/creditiq_logo_512.png" alt="CreditIQ" width={80} height={80} /></div>
          <p className="ciq-v2-kicker">CREDIT INTELLIGENCE</p>
          <h1>Make every card<br />work harder.</h1>
          <p className="ciq-v2-lead">Your cards, rewards and travel decisions — finally in one place.</p>
          <div className="ciq-v2-splash-orbits">
            <span>₹</span><span>✦</span><span>↗</span>
          </div>
        </div>
        <div className="ciq-v2-bottom-cta">
          <button className="ciq-v2-primary" onClick={next}>Get started <ArrowRight size={18} /></button>
          <button className="ciq-v2-textbtn" onClick={next}>I already have an account</button>
        </div>
      </div>
    )
  }

  if (step === 1) {
    const s = stories[story]
    const Icon = s.icon
    return (
      <div className="ciq-v2-onboarding">
        {top}
        <div className="ciq-v2-story-wrap">
          <div className="ciq-v2-story-art">
            <div className="ciq-v2-story-glow" />
            <div className="ciq-v2-story-card"><Icon size={34} /><span>{s.accent}</span></div>
            <div className="ciq-v2-story-chip chip-a">+4.2×</div>
            <div className="ciq-v2-story-chip chip-b">₹1.50L</div>
          </div>
          <p className="ciq-v2-kicker">{s.eyebrow}</p>
          <h2>{s.title}</h2>
          <p className="ciq-v2-copy">{s.body}</p>
          <div className="ciq-v2-dots">{stories.map((_, i) => <button key={i} className={i === story ? 'active' : ''} onClick={() => setStory(i)} />)}</div>
        </div>
        <div className="ciq-v2-bottom-cta">
          <button className="ciq-v2-primary" onClick={() => story < 2 ? setStory(story + 1) : next}>{story < 2 ? 'Next' : 'Set up my CreditIQ'} <ArrowRight size={18} /></button>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="ciq-v2-onboarding">{top}
        <div className="ciq-v2-formhead"><p className="ciq-v2-kicker">YOUR ACCOUNT</p><h2>Start with the basics.</h2><p className="ciq-v2-copy">This prototype does not create a real account.</p></div>
        <div className="ciq-v2-stack">
          <button className="ciq-v2-provider"><span className="provider-g">G</span><b>Continue with Google</b><ArrowRight size={18} /></button>
          <button className="ciq-v2-provider"><span className="provider-a">A</span><b>Continue with Apple</b><ArrowRight size={18} /></button>
          <div className="ciq-v2-divider"><span />or<span /></div>
          <label className="ciq-v2-field"><Mail size={17} /><input defaultValue="gogo@example.com" aria-label="Email" /></label>
          <label className="ciq-v2-field"><Fingerprint size={17} /><input defaultValue="••••••••••" aria-label="Password" /></label>
        </div>
        <div className="ciq-v2-bottom-cta"><button className="ciq-v2-primary" onClick={next}>Continue <ArrowRight size={18} /></button></div>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="ciq-v2-onboarding">{top}
        <div className="ciq-v2-formhead"><p className="ciq-v2-kicker">YOUR CONTROL</p><h2>Private by design.</h2><p className="ciq-v2-copy">Choose what CreditIQ can use. You can change this later.</p></div>
        <div className="ciq-v2-permissions">
          <Permission icon={BellRing} title="Smart alerts" text="Renewals, expiries and better-card reminders." on />
          <Permission icon={MessageCircle} title="SMS insights" text="Detect card spends and reward events from supported messages." on={false} />
          <Permission icon={Upload} title="Statements" text="Import statements when you choose — never automatically." on={false} />
          <Permission icon={LockKeyhole} title="Sensitive fields" text="Always hidden until you explicitly reveal them." on />
        </div>
        <div className="ciq-v2-trust"><ShieldCheck size={18} /><span>Demo only. No bank login or card credentials are collected here.</span></div>
        <div className="ciq-v2-bottom-cta"><button className="ciq-v2-primary" onClick={next}>Looks good <ArrowRight size={18} /></button></div>
      </div>
    )
  }

  if (step === 4) {
    return (
      <div className="ciq-v2-onboarding">{top}
        <div className="ciq-v2-formhead"><p className="ciq-v2-kicker">BUILD YOUR WALLET</p><h2>Add the cards you already use.</h2><p className="ciq-v2-copy">We only need the card product — not the full card number.</p></div>
        <div className="ciq-v2-card-picker">
          {demoCards.map(card => {
            const selected = selectedCards.includes(card.id)
            return <button key={card.id} onClick={() => toggleCard(card.id)} className={`ciq-v2-pick-card bg-gradient-to-br ${card.tone} ${selected ? 'selected' : ''}`}>
              <div><small>{card.bank}</small><strong>{card.name}</strong><span>{card.tail}</span></div>
              <i>{selected ? <Check size={16} /> : <Plus size={16} />}</i>
            </button>
          })}
          <button className="ciq-v2-add-more"><Plus size={18} /> Search 90+ Indian cards</button>
        </div>
        <div className="ciq-v2-bottom-cta"><button className="ciq-v2-primary" disabled={!selectedCards.length} onClick={next}>Add {selectedCards.length} card{selectedCards.length === 1 ? '' : 's'} <ArrowRight size={18} /></button></div>
      </div>
    )
  }

  if (step === 5) {
    return (
      <div className="ciq-v2-onboarding">{top}
        <div className="ciq-v2-formhead"><p className="ciq-v2-kicker">MAKE IT SMARTER</p><h2>Bring your points to life.</h2><p className="ciq-v2-copy">Pick how you want to seed your balances. Manual is always available.</p></div>
        <div className="ciq-v2-import-grid">
          <button><span className="import-icon"><MessageCircle /></span><div><b>Scan SMS</b><small>Find recent spends & points</small></div><BadgeCheck size={18} /></button>
          <button><span className="import-icon"><Upload /></span><div><b>Upload statement</b><small>Verify transactions and rewards</small></div><ArrowRight size={18} /></button>
          <button><span className="import-icon"><WalletCards /></span><div><b>Enter manually</b><small>Fastest for a demo wallet</small></div><ArrowRight size={18} /></button>
        </div>
        <div className="ciq-v2-mini-preview"><span>Detected for demo</span><strong>151,700 pts</strong><small>Across HDFC, Axis and AmEx</small></div>
        <div className="ciq-v2-bottom-cta"><button className="ciq-v2-primary" onClick={next}>Use demo balances <ArrowRight size={18} /></button></div>
      </div>
    )
  }

  if (step === 6) {
    const goalDefs: Array<[Goal, string, string, any]> = [
      ['earn', 'Earn more', 'Use the best card every time', Zap],
      ['travel', 'Travel better', 'Turn points into better trips', Plane],
      ['save', 'Save money', 'Catch fees, benefits and offers', Gift],
      ['simplify', 'Simplify', 'Know which cards to keep or close', Target],
    ]
    return (
      <div className="ciq-v2-onboarding">{top}
        <div className="ciq-v2-formhead"><p className="ciq-v2-kicker">YOUR PRIORITIES</p><h2>What should CreditIQ optimize first?</h2><p className="ciq-v2-copy">Choose as many as you like.</p></div>
        <div className="ciq-v2-goals">
          {goalDefs.map(([id,title,text,Icon]) => <button key={id} className={goals.includes(id) ? 'selected' : ''} onClick={() => toggleGoal(id)}><span><Icon size={20} /></span><div><b>{title}</b><small>{text}</small></div>{goals.includes(id) ? <Check size={18} /> : <Plus size={18} />}</button>)}
        </div>
        <div className="ciq-v2-bottom-cta"><button className="ciq-v2-primary" onClick={next}>Personalize CreditIQ <Sparkles size={18} /></button></div>
      </div>
    )
  }

  return (
    <div className="ciq-v2-onboarding ciq-v2-reveal">
      <div className="ciq-v2-aurora ciq-v2-aurora-a" />
      <div className="ciq-v2-reveal-inner">
        <div className="ciq-v2-checkburst"><Sparkles size={34} /></div>
        <p className="ciq-v2-kicker">YOUR FIRST CREDITIQ INSIGHT</p>
        <h2>Your wallet already has a better move.</h2>
        <div className="ciq-v2-aha-card">
          <div className="ciq-v2-aha-top"><span>SWIGGY · ₹1,850</span><BadgeCheck size={17} /></div>
          <div className="ciq-v2-aha-main"><div className="ciq-v2-mini-card">AXIS<br /><b>ATLAS</b></div><div><small>Best card now</small><strong>Axis Atlas</strong><span>Projected value ₹185</span></div></div>
          <div className="ciq-v2-aha-delta"><span>vs your usual card</span><b>+₹63</b></div>
        </div>
        <div className="ciq-v2-aha-stats"><div><b>151.7K</b><span>points tracked</span></div><div><b>3</b><span>cards optimized</span></div><div><b>2</b><span>travel paths</span></div></div>
      </div>
      <div className="ciq-v2-bottom-cta"><button className="ciq-v2-primary" onClick={onComplete}>Open my CreditIQ <ArrowRight size={18} /></button></div>
    </div>
  )
}

function Permission({ icon: Icon, title, text, on: initial }: { icon: any; title: string; text: string; on: boolean }) {
  const [on, setOn] = useState(initial)
  return <button className="ciq-v2-permission" onClick={() => setOn(!on)}><span className="permission-icon"><Icon size={19} /></span><div><b>{title}</b><small>{text}</small></div><i className={on ? 'on' : ''}><em /></i></button>
}

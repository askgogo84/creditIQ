'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const SCENES = {
  roast: {
    label: 'Roast my card', emoji: '🔥', accent: '#C46A52', bg: 'rgba(196,106,82,0.10)',
    intro: "Drop your card. I'll tell you the truth.",
    placeholder: 'Try: "I have SBI SimplyCLICK"',
    href: '/card-roast',
    messages: [
      { role: 'user', text: 'I have HDFC Regalia. ₹2,500 fee.' },
      { role: 'bot',  text: 'Oof. Sweetie.' },
      { role: 'bot',  text: "Your Regalia earns 1.4% effective.\n\nOn ₹8L/yr spend: ₹11,200 back.\nHDFC Infinia: ₹26,400 back.\n\nGap: ₹15,200/yr you're handing back." },
      { role: 'bot',  text: 'Grade: D−' },
      { role: 'user', text: 'What should I switch to?' },
      { role: 'bot',  text: "Tell me your monthly spend and I'll match you. ✨" },
    ],
  },
  match: {
    label: 'Find my card', emoji: '🎯', accent: '#D89B2A', bg: 'rgba(212,163,115,0.12)',
    intro: "Tell me how you spend. I'll pick one card.",
    placeholder: 'Try: "₹8L spend, 50% online"',
    href: '/smart-match',
    messages: [
      { role: 'user', text: '₹12L/yr. Mostly travel, online, dining.' },
      { role: 'bot',  text: 'OK travel girlie. Working on it...' },
      { role: 'bot',  text: "Top match: HDFC Infinia (94/100)\n\n• 3.3% effective on your profile\n• Unlimited Priority Pass\n• ₹47,000/yr back after fees\n\nBreak-even: ₹6.2L. You're way past it." },
      { role: 'user', text: 'What about Magnus?' },
      { role: 'bot',  text: 'Magnus earns ₹19k less. Recent devaluation crushed it. Skip.' },
    ],
  },
  optimize: {
    label: 'Use my points', emoji: '✨', accent: '#7C8970', bg: 'rgba(124,137,112,0.14)',
    intro: "Got points sitting there? Let's use them.",
    placeholder: 'Try: "I have 80k Axis Edge points"',
    href: '/points-optimizer',
    messages: [
      { role: 'user', text: 'I have 150,000 HDFC points.' },
      { role: 'bot',  text: 'Excellent. Time to make them work.' },
      { role: 'bot',  text: "Best path:\n\n→ Transfer to Turkish Miles&Smiles (1:1)\n→ Book DEL-IST-NRT in business\n→ Cost: 90,000 miles + ₹18,000 taxes\n→ Cash price: ₹3,40,000\n\nValue: ₹5.30 per point. Elite." },
      { role: 'user', text: 'Business class?? With 90k miles??' },
      { role: 'bot',  text: 'Welcome to the sweet spot 🌶' },
    ],
  },
} as const
type SceneKey = keyof typeof SCENES
type Msg = { role: string; text: string; delay?: number }

function Bubble({ role, text, delay = 0 }: { role: string; text: string; delay?: number }) {
  const [on, setOn] = useState(delay === 0)
  useEffect(() => {
    if (delay === 0) return
    const t = setTimeout(() => setOn(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  if (!on) return null
  const u = role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: u ? 'flex-end' : 'flex-start', marginBottom: 6, animation: 'bIn 0.3s ease' }}>
      <div style={{ maxWidth: '82%', padding: '9px 13px', borderRadius: u ? '16px 16px 3px 16px' : '16px 16px 16px 3px', background: u ? '#142950' : '#F4EFE7', color: u ? '#FFF' : '#142950', fontSize: 13.5, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
        {text}
      </div>
    </div>
  )
}

function Dots({ delay = 0 }: { delay?: number }) {
  const [on, setOn] = useState(false)
  useEffect(() => { const t = setTimeout(() => setOn(true), delay); return () => clearTimeout(t) }, [delay])
  if (!on) return null
  return (
    <div style={{ display: 'flex', marginBottom: 6 }}>
      <div style={{ padding: '10px 13px', background: '#F4EFE7', borderRadius: '16px 16px 16px 3px', display: 'flex', gap: 4 }}>
        {[0, 1, 2].map(i => <span key={i} style={{ width: 5, height: 5, borderRadius: 999, background: '#142950', opacity: 0.4, display: 'inline-block', animation: `dots 1.2s ${i * 0.15}s infinite` }} />)}
      </div>
    </div>
  )
}

function Phone({ scene, msgs }: { scene: SceneKey; msgs: Msg[] }) {
  const d = SCENES[scene]
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const t = setInterval(() => ref.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 1200)
    return () => clearInterval(t)
  }, [scene, msgs])
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg,#FBF7F0,#F2EAD8)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '52px 16px 10px', borderBottom: '1px solid rgba(20,41,80,0.08)', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(251,247,240,0.95)', position: 'sticky', top: 0, zIndex: 5 }}>
        <div style={{ width: 34, height: 34, borderRadius: 999, background: 'linear-gradient(135deg,#D89B2A,#B5811E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 15, color: '#142950', fontWeight: 800 }}>C</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#142950' }}>CreditIQ</div>
          <div style={{ fontSize: 10, color: '#7C8990', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: '#4F8C58', display: 'inline-block' }} />Online
          </div>
        </div>
        <span style={{ fontSize: 18 }}>{d.emoji}</span>
      </div>
      <div style={{ padding: '8px 12px 2px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ padding: '4px 10px', background: d.bg, color: d.accent, borderRadius: 999, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{d.label}</div>
      </div>
      <div ref={ref} style={{ flex: 1, padding: '8px 12px 80px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#7C8990', fontStyle: 'italic', marginBottom: 12 }}>{d.intro}</div>
        {msgs.map((m, i) => m.text === '...' ? <Dots key={i} delay={m.delay} /> : <Bubble key={i} role={m.role} text={m.text} delay={m.delay} />)}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 12px 22px', background: 'rgba(251,247,240,0.96)', borderTop: '1px solid rgba(20,41,80,0.06)', display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ flex: 1, padding: '8px 13px', borderRadius: 999, background: '#FFF', border: '1px solid rgba(20,41,80,0.10)', fontSize: 12, color: '#9A95AE' }}>Ask anything...</div>
        <div style={{ width: 32, height: 32, borderRadius: 999, background: '#142950', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>↑</div>
      </div>
    </div>
  )
}

export function CleoHero() {
  const [mode, setMode] = useState<SceneKey>('roast')
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [sent, setSent] = useState(false)
  const router = useRouter()

  // Animate demo messages
  useEffect(() => {
    if (sent) return
    setMsgs(SCENES[mode].messages.map((m, i) => ({ ...m, delay: i * 1100 })))
  }, [mode, sent])

  // Auto-rotate mode every 9s
  useEffect(() => {
    if (sent) return
    const keys = Object.keys(SCENES) as SceneKey[]
    const t = setTimeout(() => setMode(k => keys[(keys.indexOf(k) + 1) % keys.length]), 9000)
    return () => clearTimeout(t)
  }, [mode, sent])

  const send = () => {
    // Always navigate to the dedicated tool page — clean, no broken inline experience
    const destinations: Record<SceneKey, string> = {
      roast: '/card-roast',
      match: '/smart-match',
      optimize: '/points-optimizer',
    }
    router.push(destinations[mode])
  }

  const d = SCENES[mode]

  return (
    <section style={{ position: 'relative', paddingTop: 'clamp(110px,14vw,140px)', paddingBottom: 60, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -120, right: -100, width: 540, height: 540, borderRadius: '50%', background: `radial-gradient(circle,${d.accent}40,transparent 60%)`, filter: 'blur(80px)', opacity: 0.6, pointerEvents: 'none', transition: 'background 0.8s' }} />
      <div style={{ position: 'absolute', top: 200, left: -120, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(212,163,115,0.30),transparent 60%)', filter: 'blur(80px)', opacity: 0.6, pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(20px,5vw,80px)', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)', gap: 'clamp(40px,6vw,80px)', alignItems: 'center' }} className="grid-1-mobile">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 999, background: d.bg, border: `1px solid ${d.accent}40`, marginBottom: 28, transition: 'all 0.6s' }}>
              <span>{d.emoji}</span>
              <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, letterSpacing: '0.1em', color: d.accent, textTransform: 'uppercase', fontWeight: 600 }}>Live · India's smartest card AI</span>
            </div>

            <h1 style={{ fontSize: 'clamp(36px,6vw,82px)', letterSpacing: '-0.035em', lineHeight: 1.02, fontWeight: 800, marginBottom: 24, color: 'var(--ink,#142950)' }}>
              India's smartest{' '}
              <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontStyle: 'italic', fontWeight: 400, color: d.accent, transition: 'color 0.6s' }}> credit card AI</span>
              {' '}— built to earn you more.
            </h1>

            <p style={{ fontSize: 'clamp(15px,1.3vw,18px)', color: 'var(--ink-2,#2A3F6B)', maxWidth: 520, lineHeight: 1.55, marginBottom: 32 }}>
              Compare 100+ cards with{' '}
              <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontStyle: 'italic', color: 'var(--ink,#142950)' }}>zero affiliate bias</span>.{' '}
              Our AI finds every rupee you're leaving on the table — smarter points, better matches, live devaluation alerts.
            </p>

            {/* Mode selector buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {(Object.entries(SCENES) as [SceneKey, typeof d][]).map(([k, s]) => (
                <button key={k} onClick={() => { setMode(k); setSent(false); setInput('') }}
                  style={{ padding: '10px 18px', borderRadius: 999, border: `1px solid ${mode === k ? s.accent : 'var(--line-strong,rgba(20,41,80,0.2))'}`, background: mode === k ? s.bg : 'transparent', color: mode === k ? s.accent : 'var(--ink-2,#2A3F6B)', fontSize: 14, fontWeight: mode === k ? 600 : 500, cursor: 'pointer', transition: 'all 0.3s', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span>{s.emoji}</span>{s.label}
                </button>
              ))}
            </div>

            {/* Ask bar — tapping always goes to the right tool page */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 6px 6px 18px', background: 'var(--surface,#fff)', border: '1px solid var(--line-strong,rgba(20,41,80,0.2))', borderRadius: 999, boxShadow: '0 4px 14px rgba(20,41,80,0.07)', maxWidth: 520 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder={d.placeholder}
                style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: 'var(--ink,#142950)', fontSize: 15, padding: '12px 0', fontFamily: 'inherit' }}
              />
              <button onClick={send}
                style={{ padding: '12px 20px', borderRadius: 999, background: 'var(--ink,#142950)', color: 'var(--bg,#F5EFE6)', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Ask →
              </button>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-3,#5A6A8A)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span>⚡ Live AI · responses in seconds</span>
              <span>🔒 No login · No data stored</span>
            </div>
          </div>

          {/* Phone mockup — desktop only */}
          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }} className="hide-mobile">
            <div style={{ fontFamily: 'var(--font-serif,Georgia,serif)', position: 'absolute', top: 50, left: -80, transform: 'rotate(-8deg)', zIndex: 5, fontSize: 19, fontStyle: 'italic', color: 'var(--ink-2,#2A3F6B)', maxWidth: 130, lineHeight: 1.1 }}>it actually talks back ↘</div>
            <div style={{ width: 290, height: 600, background: '#0F0F0F', borderRadius: 50, padding: 8, boxShadow: `${d.accent}55 -25px 60px 60px,0 40px 80px -30px rgba(20,41,80,0.45),inset 0 0 0 1.5px rgba(255,255,255,0.06)`, position: 'relative', transition: 'box-shadow 0.8s', transform: 'scale(0.92)', transformOrigin: 'center top' }}>
              <div style={{ position: 'absolute', top: 13, left: '50%', transform: 'translateX(-50%)', width: 80, height: 24, background: '#000', borderRadius: 999, zIndex: 10 }} />
              <div style={{ width: '100%', height: '100%', borderRadius: 42, overflow: 'hidden', background: '#FFF', position: 'relative' }}>
                <Phone key={`${mode}-${sent}`} scene={mode} msgs={msgs} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bIn { from { opacity:0; transform:translateY(8px) scale(0.96) } to { opacity:1; transform:none } }
        @keyframes dots { 0%,60%,100% { transform:translateY(0); opacity:0.4 } 30% { transform:translateY(-4px); opacity:1 } }
        @media(max-width:768px) { .hide-mobile { display:none!important } }
      `}</style>
    </section>
  )
}

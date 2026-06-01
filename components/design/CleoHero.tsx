'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type SceneKey = 'roast' | 'match' | 'points'
type Msg = { role: 'user' | 'bot'; text: string }

const SCENES: Record<SceneKey, {
  label: string; emoji: string; accent: string; bg: string;
  intro: string; placeholder: string; messages: Msg[];
}> = {
  roast: {
    label: 'Roast my card', emoji: '\U0001f525', accent: '#C46A52', bg: 'rgba(196,106,82,0.10)',
    intro: "Drop your card. I'll tell you the truth.",
    placeholder: 'Try: "I have SBI SimplyCLICK"',
    messages: [
      { role: 'user', text: 'I have HDFC Regalia. \u20b92,500 fee.' },
      { role: 'bot',  text: 'Grade: C+\n\nYou\u2019re earning ~1.2% effective on your spend. For \u20b92,500/yr, you need \u20b92L+ monthly to break even.\n\nVerdict: Overpriced for your profile. You\u2019d do better with Axis Magnus or IDFC Wealth.' },
    ],
  },
  match: {
    label: 'Find my card', emoji: '\U0001f3af', accent: '#1B3A5C', bg: 'rgba(27,58,92,0.10)',
    intro: 'Tell me how you spend. I find the right card.',
    placeholder: 'Try: "I spend \u20b980K/mo, travel twice a year"',
    messages: [
      { role: 'user', text: 'I spend \u20b980K/mo. Travel twice a year. No annual fee preference.' },
      { role: 'bot',  text: 'Top match: HDFC Infinia (94/100)\n\n\u2022 3.3% effective on your profile\n\u2022 Unlimited Priority Pass\n\u2022 \u20b947,000/yr back after fees\n\nBreak-even: \u20b96.2L. You\u2019re way past it.' },
    ],
  },
  points: {
    label: 'Use my points', emoji: '\U0001f48e', accent: '#7C5CBF', bg: 'rgba(124,92,191,0.10)',
    intro: 'Tell me your points. I find the sweet spot.',
    placeholder: 'Try: "I have 80K Axis Edge points"',
    messages: [
      { role: 'user', text: 'I have 80,000 Axis Edge points. Best use?' },
      { role: 'bot',  text: 'Best path: Transfer to KrisFlyer at 2:1\n\nYou get 40,000 KrisFlyer miles.\nRedemption: BLR\u2192SIN economy = 17,500 miles.\nThat\u2019s 2 flights \u2014 worth \u20b928,000 in cash.\n\nEffective rate: \u20b90.70/Axis point vs \u20b90.20 on vouchers.' },
    ],
  },
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', marginBottom: 6 }}>
      <div style={{ padding: '10px 13px', background: '#F4EFE7', borderRadius: '16px 16px 16px 3px', display: 'flex', gap: 4 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#C46A52', opacity: 0.7, animation: 'dots 1.2s infinite', animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  )
}

function Bubble({ msg }: { msg: Msg }) {
  const u = msg.role === 'user'
  return (
    <div style={{ display: 'flex', justifyContent: u ? 'flex-end' : 'flex-start', marginBottom: 6, animation: 'bIn 0.3s ease' }}>
      <div style={{ maxWidth: '82%', padding: '9px 13px', borderRadius: u ? '16px 16px 3px 16px' : '16px 16px 16px 3px', background: u ? '#142950' : '#F4EFE7', color: u ? '#FFF' : '#142950', fontSize: 13.5, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
        {msg.text}
      </div>
    </div>
  )
}

function Phone({ scene, msgs }: { scene: SceneKey; msgs: Msg[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const d = SCENES[scene]
  useEffect(() => {
    const t = setInterval(() => ref.current?.scrollTo({ top: 99999, behavior: 'smooth' }), 1200)
    return () => clearInterval(t)
  }, [msgs])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '52px 16px 10px', borderBottom: '1px solid rgba(20,41,80,0.08)', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(251,247,240,0.95)', position: 'sticky', top: 0, zIndex: 5 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#D89B2A,#8C5F12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', fontWeight: 800, flexShrink: 0 }}>C</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#142950' }}>CIRA</div>
          <div style={{ fontSize: 10, color: '#22C55E', fontWeight: 500 }}>Online</div>
        </div>
      </div>
      <div style={{ padding: '8px 12px 2px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ padding: '4px 10px', background: d.bg, color: d.accent, borderRadius: 999, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{d.label}</div>
      </div>
      <div ref={ref} style={{ flex: 1, padding: '8px 12px 80px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', fontSize: 11, color: '#7C8990', fontStyle: 'italic', marginBottom: 12 }}>{d.intro}</div>
        {msgs.map((m, i) => <Bubble key={i} msg={m} />)}
        {msgs.length === 1 && <TypingDots />}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 12px 22px', background: 'rgba(251,247,240,0.96)', borderTop: '1px solid rgba(20,41,80,0.06)', display: 'flex', gap: 6, alignItems: 'center' }}>
        <div style={{ flex: 1, padding: '8px 13px', borderRadius: 999, background: '#FFF', border: '1px solid rgba(20,41,80,0.10)', fontSize: 12, color: '#9A95AE' }}>Ask CIRA anything...</div>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#142950', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>
    </div>
  )
}

export function CleoHero() {
  const router = useRouter()
  const [mode, setMode] = useState<SceneKey>('roast')
  const [input, setInput] = useState('')
  const [sent, setSent] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])

  useEffect(() => {
    setMsgs([SCENES[mode].messages[0]])
    const t = setTimeout(() => setMsgs(SCENES[mode].messages), 1800)
    return () => clearTimeout(t)
  }, [mode, sent])

  const send = () => {
    if (!input.trim()) return
    const routes: Record<SceneKey, string> = { roast: '/card-roast', match: '/smart-match', points: '/points-optimizer' }
    router.push(`${routes[mode]}?q=${encodeURIComponent(input)}`)
  }

  const d = SCENES[mode]

  return (
    <section style={{ position: 'relative', paddingTop: 'clamp(72px,10vw,140px)', paddingBottom: 60, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -120, right: -100, width: 540, height: 540, borderRadius: '50%', background: `radial-gradient(circle,${d.accent}40,transparent 60%)`, filter: 'blur(80px)', opacity: 0.6, pointerEvents: 'none', transition: 'background 0.8s' }} />
      <div style={{ position: 'absolute', top: 200, left: -120, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(212,163,115,0.30),transparent 60%)', filter: 'blur(80px)', opacity: 0.6, pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(20px,5vw,80px)', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)', gap: 'clamp(40px,6vw,80px)', alignItems: 'center' }} className="grid-1-mobile">
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 999, background: d.bg, border: `1px solid ${d.accent}40`, marginBottom: 28, transition: 'all 0.6s' }}>
              <span>{d.emoji}</span>
              <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, letterSpacing: '0.1em', color: d.accent, textTransform: 'uppercase', fontWeight: 600 }}>Live &middot; India&apos;s smartest card AI</span>
            </div>

            <h1 style={{ fontSize: 'clamp(36px,6vw,82px)', letterSpacing: '-0.035em', lineHeight: 1.02, fontWeight: 800, marginBottom: 24, color: 'var(--ink,#142950)' }}>
              India&apos;s smartest{' '}
              <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontStyle: 'italic', fontWeight: 400, color: d.accent, transition: 'color 0.6s' }}>credit card AI</span>
              {' '}&mdash; built to earn you more.
            </h1>

            <p style={{ fontSize: 'clamp(15px,1.3vw,18px)', color: 'var(--ink-2,#2A3F6B)', maxWidth: 520, lineHeight: 1.55, marginBottom: 32 }}>
              Compare 100+ cards with{' '}
              <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontStyle: 'italic', color: 'var(--ink,#142950)' }}>zero affiliate bias</span>.{' '}
              Our AI finds every rupee you&apos;re leaving on the table &mdash; smarter points, better matches, live devaluation alerts.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {(Object.entries(SCENES) as [SceneKey, typeof d][]).map(([k, s]) => (
                <button key={k} onClick={() => { setMode(k); setSent(false); setInput('') }}
                  style={{ padding: '10px 18px', borderRadius: 999, border: `1px solid ${mode === k ? s.accent : 'var(--line-strong,rgba(20,41,80,0.2))'}`, background: mode === k ? s.bg : 'transparent', color: mode === k ? s.accent : 'var(--ink-2,#2A3F6B)', fontSize: 14, fontWeight: mode === k ? 600 : 500, cursor: 'pointer', transition: 'all 0.3s', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span>{s.emoji}</span>{s.label}
                </button>
              ))}
            </div>

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
                Ask CIRA &rarr;
              </button>
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-3,#5A6A8A)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span>&#9889; Live AI &middot; responses in seconds</span>
              <span>&#128274; No login &middot; No data stored</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }} className="hide-mobile">
            <div style={{ fontFamily: 'var(--font-serif,Georgia,serif)', position: 'absolute', top: 50, left: -80, transform: 'rotate(-8deg)', zIndex: 5, fontSize: 19, fontStyle: 'italic', color: 'var(--ink-2,#2A3F6B)', maxWidth: 130, lineHeight: 1.1 }}>it actually talks back &#8600;</div>
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

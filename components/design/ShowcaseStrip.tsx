'use client'

import Link from 'next/link'
import { Reveal } from '@/components/design/Reveal'

type Scene = 'roast' | 'match' | 'optimize'

const SCENES: Record<Scene, { accent: string; bg: string; emoji: string; label: string; intro: string; messages: { role: string; text: string }[] }> = {
  roast: {
    accent: '#C46A52', bg: 'rgba(196,106,82,0.10)', emoji: '🔥', label: 'roast',
    intro: "Drop your card. I'll tell you the truth.",
    messages: [
      { role: 'user', text: 'I have HDFC Regalia. Rs.2,500 fee.' },
      { role: 'bot', text: 'Oof. Sweetie.' },
      { role: 'bot', text: "Your Regalia earns 1.4% effective.\n\nOn Rs.8L/yr spend: Rs.11,200 back.\nHDFC Infinia: Rs.26,400 back.\n\nGap: Rs.15,200/yr you're handing back." },
      { role: 'bot', text: 'Grade: D-' },
    ],
  },
  match: {
    accent: '#D89B2A', bg: 'rgba(212,163,115,0.12)', emoji: '🎯', label: 'match',
    intro: "Tell me how you spend. I'll pick one card.",
    messages: [
      { role: 'user', text: 'Rs.12L/yr. Mostly travel, online, dining.' },
      { role: 'bot', text: 'OK travel girlie. Working on it...' },
      { role: 'bot', text: "Top match: HDFC Infinia (94/100)\n\n- 3.3% effective on your profile\n- Unlimited Priority Pass\n- Rs.47,000/yr back after fees\n\nBreak-even: Rs.6.2L. You're past it." },
      { role: 'user', text: 'What about Magnus?' },
    ],
  },
  optimize: {
    accent: '#7C8970', bg: 'rgba(124,137,112,0.14)', emoji: '✨', label: 'optimize',
    intro: "Got points sitting there? Let's use them.",
    messages: [
      { role: 'user', text: 'I have 150,000 HDFC points.' },
      { role: 'bot', text: 'Excellent. Time to make them work.' },
      { role: 'bot', text: "Best path:\n\nTransfer to Turkish Miles&Smiles (1:1)\nBook DEL-NRT in business class\nCost: 90k miles + Rs.18,000 taxes\nCash price: Rs.3,40,000\n\nValue: Rs.5.30 per point. Elite." },
      { role: 'user', text: 'Business class?? With 90k miles??' },
      { role: 'bot', text: 'Welcome to the sweet spot!' },
    ],
  },
}

function PhoneScreen({ scene }: { scene: Scene }) {
  const d = SCENES[scene]
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg,#FBF7F0 0%,#F2EAD8 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'var(--font-body,Inter,sans-serif)' }}>
      <div style={{ padding: '54px 16px 12px', borderBottom: '1px solid rgba(20,41,80,0.08)', display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(251,247,240,0.95)', position: 'sticky', top: 0, zIndex: 5 }}>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: 'linear-gradient(135deg,#D89B2A,#B5811E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 16, color: '#142950', fontWeight: 800 }}>C</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#142950' }}>CreditIQ</div>
          <div style={{ fontSize: 10, color: '#7C8990', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: '#4F8C58', display: 'inline-block' }} />Online
          </div>
        </div>
        <div style={{ padding: '4px 10px', background: d.bg, color: d.accent, borderRadius: 999, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{d.label}</div>
      </div>
      <div style={{ flex: 1, padding: '12px 14px 80px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ textAlign: 'center', fontSize: 12, color: '#7C8990', fontStyle: 'italic', marginBottom: 12 }}>{d.intro}</div>
        {d.messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
            <div style={{ maxWidth: '82%', padding: '9px 13px', borderRadius: m.role === 'user' ? '16px 16px 3px 16px' : '16px 16px 16px 3px', background: m.role === 'user' ? '#142950' : '#FFF', color: m.role === 'user' ? '#FFF' : '#142950', fontSize: 13, lineHeight: 1.4, whiteSpace: 'pre-wrap', boxShadow: '0 1px 2px rgba(20,41,80,0.08)' }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 14px 24px', background: 'rgba(251,247,240,0.96)', borderTop: '1px solid rgba(20,41,80,0.06)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <div style={{ flex: 1, padding: '9px 14px', borderRadius: 999, background: '#FFF', border: '1px solid rgba(20,41,80,0.10)', fontSize: 13, color: '#9A95AE' }}>Ask anything...</div>
        <div style={{ width: 34, height: 34, borderRadius: 999, background: '#142950', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>↑</div>
      </div>
    </div>
  )
}

const SHOWCASES = [
  { scene: 'roast' as Scene, title: 'Card Roast', desc: 'A brutal A-F grade on your current card. Shareable. Probably mean. Definitely accurate.', cta: 'Roast my card', href: '/card-roast' },
  { scene: 'match' as Scene, title: 'Smart Match', desc: 'Tell me how you spend. I pick one card. Just one. No lists, no commissions.', cta: 'Find my card', href: '/smart-match' },
  { scene: 'optimize' as Scene, title: 'Points Optimizer', desc: 'I find the redemption that earns Rs.1+/pt instead of Rs.0.30. Transfer partners, sweet spots.', cta: 'Optimize points', href: '/points-optimizer' },
]

export function ShowcaseStrip() {
  return (
    <section style={{ background: '#0A0E1C', position: 'relative', padding: 'clamp(80px,12vw,140px) 0', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '20%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(216,155,42,0.40),transparent 60%)', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(196,106,82,0.30),transparent 60%)', filter: 'blur(100px)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(20px,5vw,80px)', position: 'relative', zIndex: 2 }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 'clamp(48px,8vw,80px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 999, background: 'rgba(216,155,42,0.18)', border: '1px solid rgba(216,155,42,0.4)', marginBottom: 28 }}>
            <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, letterSpacing: '0.18em', color: '#F2C658', textTransform: 'uppercase', fontWeight: 600 }}>SEE IT IN ACTION - 3 TOOLS</span>
          </div>
          <h2 style={{ fontSize: 'clamp(42px,7vw,96px)', letterSpacing: '-0.04em', lineHeight: 1.0, fontWeight: 800, color: '#F5EFE6', maxWidth: 900, margin: '0 auto' }}>
            Three AIs. One{' '}
            <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontStyle: 'italic', fontWeight: 400, color: '#F2C658' }}>obsession</span>: getting you paid.
          </h2>
          <p style={{ marginTop: 24, fontSize: 'clamp(15px,1.3vw,19px)', color: 'rgba(245,239,230,0.65)', maxWidth: 600, margin: '24px auto 0', lineHeight: 1.5 }}>
            Pick a tool below. Tap the phone. Try it. Real responses, no signup.
          </p>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(24px,4vw,56px)' }} className="grid-1-mobile">
          {SHOWCASES.map((s, i) => (
            <Reveal key={s.scene} delay={i * 120}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', height: '100%' }}>
                <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%) rotate(-6deg)', zIndex: 10, width: 56, height: 56, borderRadius: 999, background: '#F2C658', color: '#142950', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24, border: '4px solid #142950' }}>{i + 1}</div>
                <div style={{ height: 484, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflow: 'visible' }}>
                <div
                  style={{ transform: 'scale(0.78)', transformOrigin: 'top center', cursor: 'pointer', transition: 'transform 0.4s cubic-bezier(0.2,0.8,0.2,1)', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'scale(0.82) translateY(-8px)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'scale(0.78)'}
                >
                  <div style={{ width: 300, height: 620, background: '#0F0F0F', borderRadius: 56, padding: 10, boxShadow: 'rgba(216,155,42,0.30) -40px 90px 90px 0px, 0 50px 90px -30px rgba(0,0,0,0.70), inset 0 0 0 2px rgba(255,255,255,0.06)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', width: 100, height: 28, background: '#000', borderRadius: 999, zIndex: 10 }} />
                    <div style={{ width: '100%', height: '100%', borderRadius: 48, overflow: 'hidden', background: '#FFF', position: 'relative' }}>
                      <PhoneScreen scene={s.scene} />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: -50, textAlign: 'center', maxWidth: 280, position: 'relative', zIndex: 1 }}>
                  <h3 style={{ fontSize: 28, fontWeight: 800, color: '#F5EFE6', letterSpacing: '-0.02em', marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ color: 'rgba(245,239,230,0.65)', fontSize: 14.5, lineHeight: 1.5, marginBottom: 18 }}>{s.desc}</p>
                  <Link href={s.href}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 999, border: '1px solid rgba(216,155,42,0.4)', background: 'rgba(216,155,42,0.10)', color: '#F2C658', fontWeight: 600, fontSize: 14, textDecoration: 'none', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#D89B2A'; (e.currentTarget as HTMLElement).style.color = '#142950' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(216,155,42,0.10)'; (e.currentTarget as HTMLElement).style.color = '#F2C658' }}
                  >
                    {s.cta} →
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}





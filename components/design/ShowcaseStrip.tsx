'use client'

import Link from 'next/link'
import { Reveal } from '@/components/design/Reveal'

const SHOWCASES = [
  { title: 'Card Roast', desc: 'A brutal A-F grade on your current card. Shareable. Probably mean. Definitely accurate.', cta: 'Roast my card', href: '/card-roast', accent: '#C46A52', messages: [{ role: 'user', text: 'I have HDFC Regalia. Rs.2,500 fee.' },{ role: 'bot', text: 'Oof. Sweetie.' },{ role: 'bot', text: "Your Regalia earns 1.4% effective.\n\nOn Rs.8L/yr spend: Rs.11,200 back.\nHDFC Infinia: Rs.26,400 back.\n\nGap: Rs.15,200/yr you're handing back." },{ role: 'bot', text: 'Grade: D-' }] },
  { title: 'Smart Match', desc: 'Tell me how you spend. I pick one card. Just one. No lists, no commissions.', cta: 'Find my card', href: '/smart-match', accent: '#D89B2A', messages: [{ role: 'user', text: 'Rs.12L/yr. Mostly travel, online, dining.' },{ role: 'bot', text: 'OK travel girlie. Working on it...' },{ role: 'bot', text: "Top match: HDFC Infinia (94/100)\n\n- 3.3% effective on your profile\n- Unlimited Priority Pass\n- Rs.47,000/yr back after fees" }] },
  { title: 'Points Optimizer', desc: 'I find the redemption that earns Rs.1+/pt instead of Rs.0.30. Transfer partners, sweet spots.', cta: 'Optimize points', href: '/points-optimizer', accent: '#7C8970', messages: [{ role: 'user', text: 'I have 150,000 HDFC points.' },{ role: 'bot', text: 'Excellent. Time to make them work.' },{ role: 'bot', text: "Best path:\n\nTransfer to Turkish Miles&Smiles (1:1)\nBook DEL-NRT in business class\nValue: Rs.5.30 per point. Elite." },{ role: 'user', text: 'Business class?? With 90k miles??' },{ role: 'bot', text: 'Welcome to the sweet spot!' }] },
]

export function ShowcaseStrip() {
  return (
    <section style={{ background: '#0A0E1C', position: 'relative', padding: 'clamp(72px,10vw,120px) 0', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '20%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(216,155,42,0.35),transparent 60%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(196,106,82,0.25),transparent 60%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(20px,5vw,80px)', position: 'relative', zIndex: 2 }}>
        <Reveal style={{ textAlign: 'center', marginBottom: 'clamp(48px,7vw,80px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 999, background: 'rgba(216,155,42,0.15)', border: '1px solid rgba(216,155,42,0.35)', marginBottom: 24 }}>
            <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, letterSpacing: '0.18em', color: '#F2C658', textTransform: 'uppercase', fontWeight: 600 }}>SEE IT IN ACTION - 3 TOOLS</span>
          </div>
          <h2 style={{ fontSize: 'clamp(40px,7vw,92px)', letterSpacing: '-0.04em', lineHeight: 1.0, fontWeight: 800, color: '#F5EFE6', maxWidth: 900, margin: '0 auto' }}>
            Three AIs. One{' '}
            <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontStyle: 'italic', fontWeight: 400, color: '#F2C658' }}>obsession</span>: getting you paid.
          </h2>
          <p style={{ marginTop: 20, fontSize: 'clamp(14px,1.2vw,18px)', color: 'rgba(245,239,230,0.60)', maxWidth: 560, margin: '20px auto 0', lineHeight: 1.5 }}>Pick a tool below. Tap the phone. Try it. Real responses, no signup.</p>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'clamp(20px,3.5vw,48px)' }} className="grid-1-mobile">
          {SHOWCASES.map((s, i) => (
            <Reveal key={s.title} delay={i * 120}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%) rotate(-6deg)', zIndex: 10, width: 52, height: 52, borderRadius: 999, background: '#D89B2A', color: '#142950', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, border: '3px solid #0A0E1C' }}>{i + 1}</div>
                <div style={{ width: '100%', background: '#0F0F0F', borderRadius: 36, padding: 7, boxShadow: `${s.accent}44 -20px 50px 50px, 0 30px 60px -20px rgba(0,0,0,0.6), inset 0 0 0 1.5px rgba(255,255,255,0.06)`, cursor: 'pointer', transition: 'transform 0.3s ease', position: 'relative' }} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.transform='translateY(-8px)'} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.transform='none'}>
                  <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 60, height: 18, background: '#000', borderRadius: 999, zIndex: 10 }} />
                  <div style={{ borderRadius: 30, overflow: 'hidden', background: 'linear-gradient(180deg,#FBF7F0,#F2EAD8)', padding: '36px 12px 12px', minHeight: 280 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid rgba(20,41,80,0.08)' }}>
                      <div style={{ width: 24, height: 24, borderRadius: 999, background: 'linear-gradient(135deg,#D89B2A,#B5811E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: 11, color: '#142950', fontWeight: 800 }}>C</span></div>
                      <span style={{ fontWeight: 700, fontSize: 11, color: '#142950' }}>CreditIQ</span>
                      <span style={{ marginLeft: 'auto', padding: '2px 6px', background: `${s.accent}22`, color: s.accent, borderRadius: 999, fontSize: 8, fontWeight: 700, textTransform: 'uppercase' }}>{i === 0 ? 'roast' : i === 1 ? 'match' : 'optimize'}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {s.messages.map((m, j) => (
                        <div key={j} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                          <div style={{ maxWidth: '85%', padding: '6px 9px', borderRadius: m.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px', background: m.role === 'user' ? '#142950' : '#FFF', color: m.role === 'user' ? '#FFF' : '#142950', fontSize: 10, lineHeight: 1.4, whiteSpace: 'pre-wrap', boxShadow: '0 1px 2px rgba(20,41,80,0.08)' }}>{m.text}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 24, textAlign: 'center', maxWidth: 260 }}>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: '#F5EFE6', letterSpacing: '-0.02em', marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ color: 'rgba(245,239,230,0.60)', fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>{s.desc}</p>
                  <Link href={s.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 999, border: `1px solid ${s.accent}66`, background: `${s.accent}18`, color: s.accent, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>{s.cta}</Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

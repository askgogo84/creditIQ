'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STEPS = [
  {
    num: 1,
    label: 'You tell us',
    title1: 'Drop your card.',
    title2: 'Or describe how you',
    titleAccent: 'spend.',
    desc: 'Your current card, your monthly spend buckets  --  or just what you\'re trying to do. 60 seconds flat.',
    exLabel: 'Example',
    exText: '"HDFC Regalia. Rs.80K/month  --  mostly dining and travel."',
    exResult: '',
  },
  {
    num: 2,
    label: 'We analyse',
    title1: 'AI reads every MITC',
    title2: 'so you',
    titleAccent: "don't have to.",
    desc: '100+ cards cross-referenced with your spend, live devaluation history, and break-even point  --  in real time.',
    exLabel: 'What happens',
    exText: 'Effective rate calculated. Devaluations checked. Break-even verified.',
    exResult: 'Regalia: 1.4% effective -> Infinia: 3.3% on your profile.',
  },
  {
    num: 3,
    label: 'You earn more',
    title1: 'One answer.',
    title2: 'Real rupees',
    titleAccent: 'back.',
    desc: 'Not a top-10 list. One card, one number  --  with exactly what you\'re losing by staying put.',
    exLabel: 'Your result',
    exText: 'Switch to Infinia -> Rs.15,200 more this year.',
    exResult: 'Grade: D -> A+ potential. Your move.',
  },
]

export function HowItWorks() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setActive(a => (a + 1) % 3), 3200)
    return () => clearInterval(t)
  }, [paused])

  return (
    <section style={{
      background: 'var(--bg-2, #EFE7D8)',
      borderTop: '1px solid var(--line, rgba(20,41,80,0.08))',
      borderBottom: '1px solid var(--line, rgba(20,41,80,0.08))',
      padding: 'clamp(56px, 8vw, 96px) 0',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(20px, 5vw, 80px)' }}>

        {/* Header */}
        <div style={{ marginBottom: 'clamp(36px, 5vw, 52px)' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase' as const, color: 'var(--copper, #8C5F12)',
          }}>
            <span style={{ width: 20, height: 1, background: 'var(--copper, #8C5F12)', display: 'inline-block' }} />
            How it works
          </div>
          <h2 style={{
            fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 800,
            color: 'var(--ink, #142950)', lineHeight: 1.05,
            letterSpacing: '-0.03em', marginBottom: 10,
          }}>
            Three steps to earning{' '}
            <span style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontStyle: 'italic', fontWeight: 400, color: 'var(--copper-3, #D89B2A)' }}>
              more
            </span>.
          </h2>
          <p style={{ fontSize: 'clamp(14px, 1.2vw, 17px)', color: 'var(--ink-3, #5A6A8A)', maxWidth: 480, lineHeight: 1.6 }}>
            Pick where you are. Takes 90 seconds. No sign-up required.
          </p>
        </div>

        {/* Steps grid */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}
          className="hiw-grid"
        >
          {STEPS.map((step, i) => (
            <div
              key={i}
              onClick={() => { setActive(i); setPaused(true) }}
              style={{
                background: 'var(--surface, #fff)',
                border: `1px solid ${active === i ? 'rgba(216,155,42,0.4)' : 'var(--line, rgba(20,41,80,0.08))'}`,
                borderRadius: 20, padding: 'clamp(20px, 2.5vw, 28px)',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                transform: active === i ? 'translateY(-4px)' : 'none',
                boxShadow: active === i ? '0 16px 32px -12px rgba(20,41,80,0.10)' : '0 1px 3px rgba(20,41,80,0.04)',
                display: 'flex', flexDirection: 'column' as const,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%', marginBottom: 18, flexShrink: 0,
                background: active === i ? 'var(--copper-3, #D89B2A)' : 'var(--navy, #142950)',
                color: active === i ? 'var(--navy, #142950)' : 'var(--copper-3, #D89B2A)',
                fontSize: 16, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s',
              }}>{step.num}</div>

              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase' as const, color: 'var(--copper, #8C5F12)', marginBottom: 6 }}>
                {step.label}
              </div>

              <h3 style={{ fontSize: 'clamp(15px, 1.3vw, 19px)', fontWeight: 700, color: 'var(--ink, #142950)', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 10 }}>
                {step.title1}<br />
                {step.title2}{' '}
                <span style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontStyle: 'italic', fontWeight: 400, color: 'var(--copper-3, #D89B2A)' }}>
                  {step.titleAccent}
                </span>
              </h3>

              <p style={{ fontSize: 'clamp(12px, 1vw, 14px)', color: 'var(--ink-3, #5A6A8A)', lineHeight: 1.55, flex: 1 }}>
                {step.desc}
              </p>

              <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--bg-2, #EFE7D8)', borderRadius: 10, borderLeft: '2px solid var(--copper-3, #D89B2A)' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const, color: 'var(--copper, #8C5F12)', marginBottom: 3 }}>
                  {step.exLabel}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink, #142950)', lineHeight: 1.4 }}>{step.exText}</div>
                {step.exResult && (
                  <div style={{ fontSize: 12, color: 'var(--green, #2E7D32)', fontWeight: 600, marginTop: 3 }}>{step.exResult}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
          {[0,1,2].map(i => (
            <button key={i} onClick={() => { setActive(i); setPaused(true) }} aria-label={`Step ${i + 1}`}
              style={{ width: active === i ? 20 : 6, height: 6, borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer', transition: 'all 0.3s',
                background: active === i ? 'var(--copper-3, #D89B2A)' : 'var(--line-strong, rgba(20,41,80,0.2))' }} />
          ))}
        </div>

        {/* Bottom CTA strip */}
        <div style={{
          marginTop: 32, padding: 'clamp(16px, 2vw, 22px) clamp(20px, 3vw, 28px)',
          background: 'var(--navy, #142950)', borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' as const,
        }}>
          <div style={{ color: 'var(--bg, #F5EFE6)', fontSize: 'clamp(14px, 1.2vw, 16px)', fontWeight: 600, letterSpacing: '-0.01em' }}>
            Ready? Your result is{' '}
            <span style={{ fontFamily: 'var(--font-serif, Georgia, serif)', fontStyle: 'italic', fontWeight: 400, color: 'var(--copper-3, #D89B2A)' }}>
              90 seconds
            </span>{' '}away.
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
            {['No sign-up', 'No commissions', 'Just maths'].map(c => (
              <span key={c} style={{ padding: '5px 12px', borderRadius: 100, border: '1px solid rgba(245,239,230,0.18)', color: 'rgba(245,239,230,0.6)', fontSize: 11, fontWeight: 500 }}>{c}</span>
            ))}
          </div>
          <Link href="/card-roast" style={{ padding: '10px 22px', background: 'var(--copper-3, #D89B2A)', color: 'var(--navy, #142950)', borderRadius: 100, fontSize: 14, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' as const }}>
            Get roasted →
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) { .hiw-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}


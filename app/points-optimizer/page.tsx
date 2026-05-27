'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { DesignFooter } from '@/components/design/Footer'
import { Reveal } from '@/components/design/Reveal'
import { StatNumber } from '@/components/design/StatNumber'

const CARDS_LIST = [
  { id: 'hdfc-infinia', label: 'HDFC - Infinia' },
  { id: 'hdfc-regalia-gold', label: 'HDFC - Regalia Gold' },
  { id: 'axis-magnus', label: 'Axis - Magnus' },
  { id: 'sbi-cashback', label: 'SBI - Cashback' },
  { id: 'icici-amazon-pay', label: 'ICICI - Amazon Pay' },
  { id: 'amex-mrcc', label: 'Amex - MRCC' },
]

const PATHS = {
  flights: [
    { what: 'Turkish Air - Miles&Smiles', route: 'DEL to IST (R/T)', cost: '60,000 pts', value: 64000, rate: 'Rs.1.07/pt' },
    { what: 'Singapore - KrisFlyer', route: 'BOM to SIN (R/T)', cost: '70,000 pts', value: 58000, rate: 'Rs.0.83/pt' },
    { what: 'British Airways - Avios', route: 'DEL to DOH (R/T)', cost: '46,000 pts', value: 32000, rate: 'Rs.0.70/pt' },
  ],
  hotels: [
    { what: 'Marriott Bonvoy', route: '5 nights - St. Regis Goa', cost: '1,20,000 pts', value: 92000, rate: 'Rs.0.77/pt' },
    { what: 'Accor ALL', route: '4 nights - Raffles Udaipur', cost: '80,000 pts', value: 56000, rate: 'Rs.0.70/pt' },
    { what: 'IHG One Rewards', route: '6 nights - InterCont Mumbai', cost: '95,000 pts', value: 60000, rate: 'Rs.0.63/pt' },
  ],
  value: [
    { what: 'SmartBuy vouchers', route: 'Amazon / Flipkart', cost: '50,000 pts', value: 25000, rate: 'Rs.0.50/pt' },
    { what: 'Statement credit', route: 'Cashback rebate', cost: '50,000 pts', value: 17500, rate: 'Rs.0.35/pt' },
    { what: 'Cleartrip vouchers', route: 'Flights & hotels', cost: '50,000 pts', value: 22000, rate: 'Rs.0.44/pt' },
  ],
} as const
type PrefKey = keyof typeof PATHS

export default function PointsOptimizerPage() {
  const [pickedCard, setPickedCard] = useState('hdfc-infinia')
  const [points, setPoints] = useState(150000)
  const [pref, setPref] = useState<PrefKey>('flights')

  const paths = PATHS[pref]
  const card = CARDS_LIST.find(c => c.id === pickedCard)

  return (
    <>
      <Header />
      <div className="page-fade">
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 40 }}>
          <div className="aurora" style={{ top: -100, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.35),transparent 60%)' }} />
          <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
            <Reveal style={{ textAlign: 'center', marginBottom: 'clamp(40px,6vw,64px)', maxWidth: 800, margin: '0 auto clamp(40px,6vw,64px)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 999, background: 'rgba(212,163,115,0.12)', border: '1px solid rgba(212,163,115,0.30)', marginBottom: 28 }}>
                <span>✨</span>
                <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--copper,#8C5F12)', textTransform: 'uppercase', fontWeight: 600 }}>AI TOOL - POINTS OPTIMIZER</span>
              </div>
              <h1 style={{ fontSize: 'clamp(40px,7vw,96px)', letterSpacing: '-0.04em', lineHeight: 1.0, fontWeight: 800, color: 'var(--ink,#142950)' }}>
                Your points are worth{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>more</span>{' '}
                than you think.
              </h1>
              <p style={{ maxWidth: 560, margin: '20px auto 0', color: 'var(--ink-2,#2A3F6B)', fontSize: 'clamp(15px,1.3vw,18px)', lineHeight: 1.55 }}>
                Most people redeem at Rs.0.25/pt. We find paths worth Rs.3-5/pt. Pick a bank, tell me your goal.
              </p>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.2fr', gap: 24 }} className="grid-1-mobile">
              <Reveal>
                <div style={{ padding: 28, background: 'var(--paper,#FAF5EB)', borderRadius: 20, border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 14 }}>YOUR CARD</div>
                  <select value={pickedCard} onChange={e => setPickedCard(e.target.value)}
                    style={{ width: '100%', padding: '14px 18px', borderRadius: 12, background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', color: 'var(--ink,#142950)', fontSize: 15, fontFamily: 'inherit' }}>
                    {CARDS_LIST.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>

                  <div style={{ marginTop: 28 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)' }}>POINTS TO REDEEM</span>
                      <span style={{ fontFamily: 'var(--font-mono,monospace)', color: 'var(--copper-3,#D89B2A)', fontSize: 15, fontWeight: 600 }}>{points.toLocaleString('en-IN')}</span>
                    </div>
                    <input type="range" min="10000" max="500000" step="5000" value={points} onChange={e => setPoints(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--copper-3,#D89B2A)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)' }}>10K</span>
                      <span style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)' }}>5L</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 28 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 14 }}>OPTIMIZE FOR</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(['flights', 'hotels', 'value'] as PrefKey[]).map(p => (
                        <button key={p} onClick={() => setPref(p)} style={{ padding: '8px 16px', borderRadius: 999, border: `1px solid ${pref === p ? 'var(--copper-3,#D89B2A)' : 'var(--line,rgba(20,41,80,0.12))'}`, background: pref === p ? 'rgba(212,163,115,0.15)' : 'transparent', color: pref === p ? 'var(--copper,#8C5F12)' : 'var(--ink-2,#2A3F6B)', fontSize: 14, fontWeight: pref === p ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 32, padding: 22, borderRadius: 16, background: 'linear-gradient(135deg,rgba(212,163,115,0.14),rgba(212,163,115,0.04))', border: '1px solid rgba(184,116,58,0.3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 18, color: 'var(--copper-3,#D89B2A)' }}>✦</span>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)' }}>AI STRATEGY</span>
                    </div>
                    <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ink-2,#2A3F6B)' }}>
                      Transfer to{' '}
                      <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic' }}>Turkish Miles&Smiles</span>{' '}
                      within 30 days. Highest-leverage path on {card?.label.split(' - ')[1] || 'your card'}.
                    </p>
                  </div>
                </div>
              </Reveal>

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 14 }}>REDEMPTION PATHS - RANKED</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {paths.map((path, i) => (
                    <Reveal key={i} delay={i * 80}>
                      <div style={{ padding: 24, borderRadius: 20, background: 'var(--surface,#fff)', border: `${i === 0 ? 2 : 1}px solid ${i === 0 ? 'var(--copper-3,#D89B2A)' : 'var(--line,rgba(20,41,80,0.08))'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 16, flexWrap: 'wrap' }}>
                          <div>
                            {i === 0 && <div style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, background: 'rgba(212,163,115,0.15)', color: 'var(--copper,#8C5F12)', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>BEST VALUE</div>}
                            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 6 }}>{path.what}</div>
                            <h3 style={{ fontSize: 22, letterSpacing: '-0.02em', fontWeight: 600, color: 'var(--ink,#142950)' }}>{path.route}</h3>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-3,#5A6A8A)' }}>VALUE</div>
                            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--green,#4F8C58)', marginTop: 4, letterSpacing: '-0.02em' }}>
                              Rs.<StatNumber value={path.value} />
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                          <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 12, color: 'var(--ink-3,#5A6A8A)' }}>{path.cost} - {path.rate}</div>
                          <div style={{ width: 120, height: 6, background: 'var(--bg-2,#EFE7D8)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ width: `${(path.value / paths[0].value) * 100}%`, height: '100%', background: i === 0 ? 'var(--copper-3,#D89B2A)' : 'var(--ink-3,#5A6A8A)', borderRadius: 999 }} />
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        <DesignFooter />
      </div>
    </>
  )
}

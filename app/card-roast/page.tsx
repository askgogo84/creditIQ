'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { DesignFooter } from '@/components/design/Footer'
import { Reveal } from '@/components/design/Reveal'
import { StatNumber } from '@/components/design/StatNumber'
import { CopperCTA, GhostCTA } from '@/components/design/CTAs'
import { CreditCard3D } from '@/components/design/CreditCard3D'
import Link from 'next/link'
import { SEED_CARDS } from '@/lib/data/seed-cards'

const PRESETS = {
  balanced: { label: 'Balanced', desc: 'Rs.8L - mixed spend', monthly: 5640, potential: 14820 },
  travel:   { label: 'Travel junkie', desc: 'Rs.12L - 40% travel', monthly: 7200, potential: 22400 },
  online:   { label: 'Online stan', desc: 'Rs.6L - 60% online', monthly: 3120, potential: 9800 },
  rent:     { label: 'Pays rent', desc: 'Rs.9L - 40% rent + utility', monthly: 1280, potential: 6300 },
} as const
type PresetKey = keyof typeof PRESETS

const GRADE_COLORS = { A: '#4F8C58', B: '#7C8970', C: '#B97C2C', D: '#C46A52', F: '#B84230' }
const GRADE_TAGLINES = {
  A: 'Frankly, we have nothing to say.',
  B: 'Solid. Could be better. Not a tragedy.',
  C: "Mid. You're leaving money on the table.",
  D: 'My friend. What are you doing.',
  F: 'This is financial self-harm. Please stop.',
}

const CARDS_LIST = [
  { id: 'hdfc-infinia', bank: 'HDFC', name: 'Infinia', fee: 12500, variant: 'obsidian' as const },
  { id: 'hdfc-regalia-gold', bank: 'HDFC', name: 'Regalia Gold', fee: 2500, variant: 'navy' as const },
  { id: 'axis-magnus', bank: 'AXIS', name: 'Magnus', fee: 12500, variant: 'plum' as const },
  { id: 'sbi-cashback', bank: 'SBI', name: 'Cashback', fee: 999, variant: 'gold' as const },
  { id: 'icici-amazon-pay', bank: 'ICICI', name: 'Amazon Pay', fee: 0, variant: 'iris' as const },
  { id: 'idfc-first-wow', bank: 'IDFC', name: 'WOW', fee: 0, variant: 'mint' as const },
]

const ISSUES = [
  { tag: '-Rs.3,200/mo', issue: 'Fuel earns nothing on this card', fix: 'Add BPCL SBI Octane as a stacker' },
  { tag: '-Rs.1,800/mo', issue: 'Forex markup is 3.5% — high for tier', fix: 'Switch to a 0% forex card for international' },
  { tag: '-Rs.2,400/mo', issue: 'Lounge program got nerfed in March 2026', fix: 'AU Zenith+ now has unlimited Priority Pass' },
  { tag: '-Rs.1,000/mo', issue: 'Welcome benefit already expired', fix: 'Apply for a card with active welcome to stack' },
]

export default function CardRoastPage() {
  const [step, setStep] = useState<'input' | 'rolling' | 'result'>('input')
  const [selectedCard, setSelectedCard] = useState('hdfc-regalia-gold')
  const [preset, setPreset] = useState<PresetKey>('balanced')

  const card = CARDS_LIST.find(c => c.id === selectedCard) || CARDS_LIST[0]
  const p = PRESETS[preset]
  const ratio = p.monthly / p.potential
  const grade = ratio > 0.85 ? 'A' : ratio > 0.65 ? 'B' : ratio > 0.45 ? 'C' : ratio > 0.30 ? 'D' : 'F'
  const gradeColor = GRADE_COLORS[grade as keyof typeof GRADE_COLORS]
  const annualLost = (p.potential - p.monthly) * 12

  const handleRoast = () => {
    setStep('rolling')
    setTimeout(() => setStep('result'), 1800)
  }

  return (
    <>
      <Header />
      <div className="page-fade">
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)' }}>
          <div className="aurora" style={{ top: -100, left: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(196,106,82,0.35),transparent 60%)' }} />
          <div className="aurora" style={{ bottom: -150, right: -100, width: 600, height: 600, background: 'radial-gradient(circle,rgba(212,163,115,0.35),transparent 60%)' }} />

          <div className="shell" style={{ position: 'relative', zIndex: 2, paddingBottom: 60 }}>
            <Reveal style={{ textAlign: 'center', marginBottom: 'clamp(40px,6vw,64px)', maxWidth: 880, margin: '0 auto clamp(40px,6vw,64px)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 999, background: 'rgba(196,106,82,0.12)', border: '1px solid rgba(196,106,82,0.30)', marginBottom: 28 }}>
                <span style={{ fontSize: 14 }}>🔥</span>
                <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--terracotta,#C46A52)', textTransform: 'uppercase', fontWeight: 600 }}>AI TOOL - CARD ROAST</span>
              </div>
              <h1 style={{ fontSize: 'clamp(44px,8vw,108px)', letterSpacing: '-0.04em', lineHeight: 1.0, fontWeight: 800, color: 'var(--ink,#142950)' }}>
                Is your card{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--terracotta,#C46A52)', fontStyle: 'italic', fontWeight: 400 }}>wasting</span>{' '}
                your money?
              </h1>
              <p style={{ maxWidth: 580, margin: '24px auto 0', color: 'var(--ink-2,#2A3F6B)', fontSize: 'clamp(16px,1.4vw,19px)', lineHeight: 1.55 }}>
                Drop your card and a month of spending. We grade it brutally — and tell you exactly{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--ink,#142950)' }}>what you are losing</span>.
              </p>
            </Reveal>

            {step === 'input' && (
              <Reveal>
                <div style={{ padding: 'clamp(28px,4vw,48px)', maxWidth: 1080, margin: '0 auto', background: 'var(--paper,#FAF5EB)', borderRadius: 24, border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                  <div style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 999, background: 'var(--copper-3,#D89B2A)', color: '#FFF', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)' }}>PICK YOUR CARD</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }} className="grid-1-mobile">
                      {CARDS_LIST.map(c => (
                        <div key={c.id} onClick={() => setSelectedCard(c.id)} style={{ padding: 16, borderRadius: 16, border: `1px solid ${selectedCard === c.id ? 'var(--copper-3,#D89B2A)' : 'var(--line,rgba(20,41,80,0.08))'}`, background: selectedCard === c.id ? 'rgba(212,163,115,0.10)' : 'var(--surface,#fff)', cursor: 'pointer', transition: 'all 0.25s', display: 'flex', gap: 14, alignItems: 'center' }}>
                          <div style={{ width: 64, flexShrink: 0 }}>
                            <CreditCard3D variant={c.variant} name={c.name.toUpperCase()} bank={c.bank} tagline="" network="VISA" small interactive={false} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)' }}>{c.bank}</div>
                            <div style={{ fontWeight: 600, fontSize: 15, marginTop: 2, letterSpacing: '-0.01em', color: 'var(--ink,#142950)' }}>{c.name}</div>
                            <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--ink-3,#5A6A8A)', marginTop: 3 }}>Rs.{c.fee.toLocaleString('en-IN')}/yr</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 999, background: 'var(--copper-3,#D89B2A)', color: '#FFF', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)' }}>PICK YOUR SPEND VIBE</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }} className="grid-2-mobile">
                      {(Object.entries(PRESETS) as [PresetKey, typeof PRESETS[PresetKey]][]).map(([k, v]) => (
                        <div key={k} onClick={() => setPreset(k)} style={{ padding: 18, borderRadius: 16, border: `1px solid ${preset === k ? 'var(--copper-3,#D89B2A)' : 'var(--line,rgba(20,41,80,0.08))'}`, background: preset === k ? 'rgba(212,163,115,0.10)' : 'var(--surface,#fff)', cursor: 'pointer', transition: 'all 0.25s' }}>
                          <div style={{ fontWeight: 600, fontSize: 17, color: 'var(--ink,#142950)' }}>{v.label}</div>
                          <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10.5, color: 'var(--ink-3,#5A6A8A)', marginTop: 6 }}>{v.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', paddingTop: 24, borderTop: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                    <p style={{ color: 'var(--ink-3,#5A6A8A)', fontSize: 13.5, marginBottom: 18 }}>
                      By clicking below, you consent to having your financial choices questioned.
                    </p>
                    <CopperCTA onClick={handleRoast}>Roast my card</CopperCTA>
                  </div>
                </div>
              </Reveal>
            )}

            {step === 'rolling' && (
              <div style={{ textAlign: 'center', padding: '80px 0', maxWidth: 600, margin: '0 auto' }}>
                <div style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontSize: 80, color: 'var(--copper-3,#D89B2A)', lineHeight: 1, fontStyle: 'italic' }}>...</div>
                <div style={{ marginTop: 20, color: 'var(--ink-3,#5A6A8A)', fontSize: 12, letterSpacing: '0.15em', fontFamily: 'var(--font-mono,monospace)' }}>
                  ANALYSING 47 CATEGORIES - 12 PARTNER LISTS - YOUR LIFE CHOICES
                </div>
                <div style={{ marginTop: 28, height: 2, background: 'var(--line,rgba(20,41,80,0.08))', borderRadius: 999, overflow: 'hidden', maxWidth: 320, margin: '28px auto 0' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg,var(--copper,#8C5F12),var(--copper-3,#D89B2A))', animation: 'rollbar 1.8s cubic-bezier(0.65,0,0.35,1) forwards' }} />
                  <style>{`@keyframes rollbar { from { transform: translateX(-100%); } to { transform: translateX(0); } }`}</style>
                </div>
              </div>
            )}

            {step === 'result' && (
              <div className="page-fade">
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 'clamp(32px,5vw,64px)', alignItems: 'center', marginBottom: 'clamp(48px,7vw,80px)' }} className="grid-1-mobile">
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 14 }}>{card.bank} {card.name.toUpperCase()} - {p.label.toUpperCase()}</div>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <div style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontSize: 'clamp(200px,36vw,400px)', lineHeight: 0.78, fontStyle: 'italic', color: gradeColor, textShadow: `0 0 80px ${gradeColor}55`, fontWeight: 400, letterSpacing: '-0.04em' }}>{grade}</div>
                      <div style={{ position: 'absolute', top: 24, right: -16, padding: '8px 14px', borderRadius: 999, background: 'var(--surface,#fff)', border: '1px solid var(--line-strong,rgba(20,41,80,0.2))', boxShadow: '0 2px 8px rgba(20,41,80,0.08)' }}>
                        <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--ink-2,#2A3F6B)' }}>FINAL GRADE</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 'clamp(24px,3.5vw,44px)', lineHeight: 1.08, letterSpacing: '-0.02em', fontWeight: 600, color: 'var(--ink,#142950)' }}>
                      <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: gradeColor }}>"</span>
                      {GRADE_TAGLINES[grade as keyof typeof GRADE_TAGLINES]}
                      <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: gradeColor }}>"</span>
                    </p>
                    <p style={{ marginTop: 20, color: 'var(--ink-3,#5A6A8A)', fontSize: 12, letterSpacing: '0.1em', fontFamily: 'var(--font-mono,monospace)' }}>
                      CREDITIQ ENGINE - v2.1
                    </p>
                    <div style={{ marginTop: 32, padding: 24, borderRadius: 18, background: 'rgba(184,66,48,0.08)', border: '1px solid rgba(184,66,48,0.25)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B84230', marginBottom: 8 }}>ANNUAL OPPORTUNITY COST</div>
                      <div style={{ fontSize: 'clamp(40px,5.5vw,64px)', fontWeight: 800, color: '#B84230', letterSpacing: '-0.03em' }}>
                        Rs.<StatNumber value={annualLost} />
                      </div>
                      <p style={{ marginTop: 10, color: 'var(--ink-3,#5A6A8A)', fontSize: 13.5 }}>What you could have earned on the right card this year.</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 48 }} className="grid-1-mobile">
                  <div style={{ padding: 32, borderRadius: 20, background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 12 }}>YOUR MONTHLY EARN</div>
                    <div style={{ fontSize: 'clamp(42px,6vw,84px)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--ink,#142950)' }}>Rs.<StatNumber value={p.monthly} /></div>
                  </div>
                  <div style={{ padding: 32, borderRadius: 20, background: 'linear-gradient(180deg,rgba(212,163,115,0.10),transparent)', border: '1px solid rgba(184,116,58,0.3)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 12 }}>POTENTIAL - RIGHT CARD</div>
                    <div style={{ fontSize: 'clamp(42px,6vw,84px)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--copper-3,#D89B2A)' }}>Rs.<StatNumber value={p.potential} /></div>
                  </div>
                </div>

                <div style={{ padding: 32, borderRadius: 20, background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', marginBottom: 48 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 22 }}>WHAT IS DRAGGING YOU DOWN</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {ISSUES.map((it, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr', gap: 20, paddingBottom: 14, borderBottom: i < ISSUES.length - 1 ? '1px solid var(--line,rgba(20,41,80,0.08))' : 'none', alignItems: 'center' }} className="grid-1-mobile">
                        <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 15, color: '#B84230', fontWeight: 500 }}>{it.tag}</div>
                        <div style={{ fontSize: 15, color: 'var(--ink,#142950)' }}>{it.issue}</div>
                        <div style={{ fontSize: 14, color: 'var(--ink-3,#5A6A8A)' }}>
                          <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)' }}>→</span> {it.fix}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }} className="grid-1-mobile">
                  <div style={{ padding: 32, borderRadius: 20, background: 'linear-gradient(135deg,rgba(212,163,115,0.10),rgba(124,137,112,0.06))', border: '1px solid rgba(184,116,58,0.3)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 14 }}>OUR ALTERNATIVE</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, alignItems: 'center' }} className="grid-1-mobile">
                      <div>
                        <h3 style={{ fontSize: 30, letterSpacing: '-0.02em', marginBottom: 10, color: 'var(--ink,#142950)', fontWeight: 800 }}>
                          HDFC <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>Infinia</span>
                        </h3>
                        <p style={{ color: 'var(--ink-3,#5A6A8A)', fontSize: 14, lineHeight: 1.55 }}>On your profile: 3.3% effective, unlimited lounges, 1:1 airline transfers. Break-even Rs.6.2L.</p>
                        <div style={{ marginTop: 18 }}>
                          <Link href="/card/hdfc-infinia" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 999, background: 'var(--copper-3,#D89B2A)', color: 'var(--ink,#142950)', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>See full breakdown</Link>
                        </div>
                      </div>
                      <div style={{ maxWidth: 200 }}>
                        <CreditCard3D variant="obsidian" name="INFINIA" bank="HDFC BANK" tagline="Reserve metal" network="VISA" />
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: 32, borderRadius: 20, background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 14 }}>SHARE THE ROAST</div>
                      <h3 style={{ fontSize: 24, lineHeight: 1.1, fontWeight: 400, color: 'var(--ink,#142950)' }}>Receipts for the group chat.</h3>
                      <p style={{ marginTop: 12, color: 'var(--ink-3,#5A6A8A)', fontSize: 14 }}>Generate a shareable card with your grade and the savings number.</p>
                    </div>
                    <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <GhostCTA href="#">Share to Instagram</GhostCTA>
                      <GhostCTA href="#">Copy roast link</GhostCTA>
                      <button onClick={() => setStep('input')} style={{ color: 'var(--ink-3,#5A6A8A)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, marginTop: 4 }}>Roast another card</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
        <DesignFooter />
      </div>
    </>
  )
}

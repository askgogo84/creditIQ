'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { DesignFooter } from '@/components/design/Footer'
import { Reveal } from '@/components/design/Reveal'
import { StatNumber } from '@/components/design/StatNumber'
import { CopperCTA } from '@/components/design/CTAs'
import { CreditCard3D, type CardVariant } from '@/components/design/CreditCard3D'
import { SEED_CARDS, cardPageExists } from '@/lib/data/seed-cards'
import { authedFetch } from '@/lib/authed-fetch'

// Presets prefill an editable monthly-spend field (user can override).
const PRESETS = {
  balanced: { label: 'Balanced', desc: 'Rs.8L/yr - mixed spend', spend: 66000 },
  travel:   { label: 'Travel junkie', desc: 'Rs.12L/yr - 40% travel', spend: 100000 },
  online:   { label: 'Online stan', desc: 'Rs.6L/yr - 60% online', spend: 50000 },
  rent:     { label: 'Pays rent', desc: 'Rs.9L/yr - 40% rent + utility', spend: 75000 },
} as const
type PresetKey = keyof typeof PRESETS

type Step = 'input' | 'rolling' | 'result' | 'error' | 'limited'

interface RoastResult {
  grade: string
  gradeColor?: string
  roast: string
  monthlyEarnings: number
  monthlyPotential: number
  moneyLeft: number
  improvements: string[]
  betterCard?: string
  betterCardId?: string
  shareText?: string
}

// Card picker is populated from SEED_CARDS (canonical) so every id resolves — the
// Supabase cards table has dupes/null slugs/UUID ids and can't be trusted for this.
const CARD_OPTIONS = [...SEED_CARDS].sort((a: any, b: any) =>
  (a.bank + ' ' + a.name).localeCompare(b.bank + ' ' + b.name),
)

// Curated visual grid — popular cards, all valid SEED_CARDS ids. Full 49 live in
// the "more cards" select underneath.
const CURATED: { id: string; bank: string; name: string; variant: CardVariant }[] = [
  { id: 'hdfc-infinia',        bank: 'HDFC',  name: 'Infinia',         variant: 'obsidian' },
  { id: 'hdfc-regalia-gold',   bank: 'HDFC',  name: 'Regalia Gold',    variant: 'navy' },
  { id: 'axis-atlas',          bank: 'AXIS',  name: 'Atlas',           variant: 'plum' },
  { id: 'icici-amazon-pay',    bank: 'ICICI', name: 'Amazon Pay',      variant: 'iris' },
  { id: 'sbi-cashback',        bank: 'SBI',   name: 'Cashback',        variant: 'gold' },
  { id: 'amex-platinum-travel', bank: 'AMEX', name: 'Platinum Travel', variant: 'cream' },
]
const feeOf = (id: string) => ((SEED_CARDS.find((c: any) => c.id === id) as any)?.annual_fee_inr ?? 0)

export default function CardRoastPage() {
  const [step, setStep] = useState<Step>('input')
  const [selectedCard, setSelectedCard] = useState('hdfc-regalia-gold')
  const [preset, setPreset] = useState<PresetKey>('balanced')
  const [monthlySpend, setMonthlySpend] = useState<number>(PRESETS.balanced.spend)
  const [result, setResult] = useState<RoastResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)

  const selName = (SEED_CARDS.find((c: any) => c.id === selectedCard) as any)?.name || selectedCard

  const pickPreset = (k: PresetKey) => { setPreset(k); setMonthlySpend(PRESETS[k].spend) }

  const handleRoast = async () => {
    setStep('rolling'); setErrorMsg(''); setResult(null)
    try {
      const res = await authedFetch('/api/card-roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: selectedCard, monthlySpend, spendProfile: PRESETS[preset].label }),
      })
      if (res.status === 429) {
        let scope = ''
        try { scope = (await res.json())?.scope || '' } catch {}
        setErrorMsg(scope === 'per_day'
          ? 'You’ve hit today’s roast limit. Come back tomorrow.'
          : 'Too many roasts in a minute — give it ~a minute and try again.')
        setStep('limited'); return
      }
      const data = await res.json().catch(() => null)
      if (!res.ok || !data || data.ok === false || data.error || typeof data.grade !== 'string') {
        setErrorMsg(data?.error === 'Card not found'
          ? 'We couldn’t grade that card yet. Try another one.'
          : 'The roast engine choked. Give it another go.')
        setStep('error'); return
      }
      setResult(data as RoastResult)
      setStep('result')
    } catch {
      setErrorMsg('Network hiccup — check your connection and try again.')
      setStep('error')
    }
  }

  const gradeColor = result?.gradeColor || '#B97C2C'
  const annualLeft = result ? Math.max(0, result.moneyLeft) * 12 : 0
  const betterLinkable = !!result?.betterCardId && cardPageExists(result.betterCardId)

  const share = async () => {
    const text = (result?.shareText || 'My card got graded on CreditIQ.') + ' https://creditiq.app/card-roast'
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {}
  }

  const inputCardStyle: CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: 14, fontSize: 15,
    border: '1px solid var(--line,rgba(20,41,80,0.14))', background: 'var(--surface,#fff)',
    color: 'var(--ink,#142950)', fontFamily: 'inherit',
  }

  return (
    <>
      <div>
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)' }}>
          <div className="aurora" style={{ top: -100, left: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(196,106,82,0.35),transparent 60%)' }} />
          <div className="aurora" style={{ bottom: -150, right: -100, width: 600, height: 600, background: 'radial-gradient(circle,rgba(212,163,115,0.35),transparent 60%)' }} />

          <div className="shell" style={{ position: 'relative', zIndex: 2, paddingBottom: 60 }}>
            <Reveal style={{ textAlign: 'center', marginBottom: 'clamp(40px,6vw,64px)', maxWidth: 880, margin: '0 auto clamp(40px,6vw,64px)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 999, background: 'rgba(196,106,82,0.12)', border: '1px solid rgba(196,106,82,0.30)', marginBottom: 28 }}>
                <span style={{ fontSize: 14 }}>&#128293;</span>
                <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--terracotta,#C46A52)', textTransform: 'uppercase', fontWeight: 600 }}>AI TOOL - CARD ROAST</span>
              </div>
              <h1 style={{ fontSize: 'clamp(44px,8vw,108px)', letterSpacing: '-0.04em', lineHeight: 1.0, fontWeight: 800, color: 'var(--ink,#142950)' }}>
                Is your card{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--terracotta,#C46A52)', fontStyle: 'italic', fontWeight: 400 }}>wasting</span>{' '}
                your money?
              </h1>
              <p style={{ maxWidth: 580, margin: '24px auto 0', color: 'var(--ink-2,#2A3F6B)', fontSize: 'clamp(16px,1.4vw,19px)', lineHeight: 1.55 }}>
                Pick your card and your monthly spend. We grade it brutally &mdash; and tell you exactly{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--ink,#142950)' }}>what you are losing</span>.
              </p>
            </Reveal>

            {step === 'input' && (
              <Reveal>
                <div style={{ padding: 'clamp(28px,4vw,48px)', maxWidth: 900, margin: '0 auto', background: 'var(--paper,#FAF5EB)', borderRadius: 24, border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                  {/* 1. card */}
                  <div style={{ marginBottom: 36 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 999, background: 'var(--copper-3,#D89B2A)', color: '#FFF', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)' }}>PICK YOUR CARD</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }} className="grid-1-mobile">
                      {CURATED.map(c => {
                        const fee = feeOf(c.id)
                        const active = selectedCard === c.id
                        return (
                          <div key={c.id} onClick={() => setSelectedCard(c.id)} style={{ padding: 14, borderRadius: 16, border: `1px solid ${active ? 'var(--copper-3,#D89B2A)' : 'var(--line,rgba(20,41,80,0.08))'}`, background: active ? 'rgba(212,163,115,0.10)' : 'var(--surface,#fff)', cursor: 'pointer', transition: 'all 0.25s', display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{ width: 58, flexShrink: 0 }}>
                              <CreditCard3D variant={c.variant} name={c.name.toUpperCase()} bank={c.bank} tagline="" network="VISA" small interactive={false} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)' }}>{c.bank}</div>
                              <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2, letterSpacing: '-0.01em', color: 'var(--ink,#142950)' }}>{c.name}</div>
                              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10.5, color: 'var(--ink-3,#5A6A8A)', marginTop: 3 }}>{fee === 0 ? 'Lifetime free' : 'Rs.' + fee.toLocaleString('en-IN') + '/yr'}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 8 }}>Or pick from all {CARD_OPTIONS.length} cards</label>
                      <select value={selectedCard} onChange={e => setSelectedCard(e.target.value)} style={inputCardStyle}>
                        {CARD_OPTIONS.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.bank} &mdash; {c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 2. spend vibe -> prefills editable spend */}
                  <div style={{ marginBottom: 36 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <span style={{ width: 26, height: 26, borderRadius: 999, background: 'var(--copper-3,#D89B2A)', color: '#FFF', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)' }}>PICK A SPEND VIBE</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 18 }} className="grid-2-mobile">
                      {(Object.entries(PRESETS) as [PresetKey, typeof PRESETS[PresetKey]][]).map(([k, v]) => (
                        <div key={k} onClick={() => pickPreset(k)} style={{ padding: 16, borderRadius: 16, border: `1px solid ${preset === k ? 'var(--copper-3,#D89B2A)' : 'var(--line,rgba(20,41,80,0.08))'}`, background: preset === k ? 'rgba(212,163,115,0.10)' : 'var(--surface,#fff)', cursor: 'pointer', transition: 'all 0.25s' }}>
                          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink,#142950)' }}>{v.label}</div>
                          <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: 'var(--ink-3,#5A6A8A)', marginTop: 6 }}>{v.desc}</div>
                        </div>
                      ))}
                    </div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 8 }}>
                      Monthly spend (Rs.)
                    </label>
                    <input
                      type="number" min={0} step={1000} value={monthlySpend}
                      onChange={e => setMonthlySpend(Math.max(0, parseInt(e.target.value) || 0))}
                      style={inputCardStyle}
                    />
                  </div>

                  <div style={{ textAlign: 'center', paddingTop: 8 }}>
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
                  GRADING {selName.toUpperCase()} AGAINST YOUR SPEND
                </div>
                <div style={{ marginTop: 28, height: 2, background: 'var(--line,rgba(20,41,80,0.08))', borderRadius: 999, overflow: 'hidden', maxWidth: 320, margin: '28px auto 0' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg,var(--copper,#8C5F12),var(--copper-3,#D89B2A))', animation: 'rollbar 1.6s ease-in-out infinite' }} />
                  <style>{`@keyframes rollbar { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
                </div>
              </div>
            )}

            {step === 'limited' && (
              <div style={{ textAlign: 'center', padding: '60px 0', maxWidth: 520, margin: '0 auto' }}>
                <div style={{ fontSize: 44 }}>&#9203;</div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink,#142950)', margin: '12px 0 8px' }}>Easy, tiger.</h2>
                <p style={{ color: 'var(--ink-2,#2A3F6B)', fontSize: 15, lineHeight: 1.6, marginBottom: 22 }}>{errorMsg}</p>
                <button onClick={() => setStep('input')} style={{ background: 'none', border: '1.5px solid var(--ink,#142950)', color: 'var(--ink,#142950)', padding: '10px 22px', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Back</button>
              </div>
            )}

            {step === 'error' && (
              <div style={{ textAlign: 'center', padding: '60px 0', maxWidth: 520, margin: '0 auto' }}>
                <div style={{ fontSize: 44 }}>&#128533;</div>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink,#142950)', margin: '12px 0 8px' }}>That didn&rsquo;t work</h2>
                <p style={{ color: 'var(--ink-2,#2A3F6B)', fontSize: 15, lineHeight: 1.6, marginBottom: 22 }}>{errorMsg}</p>
                <CopperCTA onClick={handleRoast}>Try again</CopperCTA>
              </div>
            )}

            {step === 'result' && result && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 'clamp(32px,5vw,64px)', alignItems: 'center', marginBottom: 'clamp(48px,7vw,80px)' }} className="grid-1-mobile">
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 14 }}>{selName.toUpperCase()} - {PRESETS[preset].label.toUpperCase()}</div>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <div style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontSize: 'clamp(180px,32vw,360px)', lineHeight: 0.78, fontStyle: 'italic', color: gradeColor, textShadow: `0 0 80px ${gradeColor}55`, fontWeight: 400, letterSpacing: '-0.04em' }}>{result.grade}</div>
                      <div style={{ position: 'absolute', top: 24, right: -16, padding: '8px 14px', borderRadius: 999, background: 'var(--surface,#fff)', border: '1px solid var(--line-strong,rgba(20,41,80,0.2))', boxShadow: '0 2px 8px rgba(20,41,80,0.08)' }}>
                        <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--ink-2,#2A3F6B)' }}>FINAL GRADE</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 'clamp(20px,2.6vw,30px)', lineHeight: 1.25, letterSpacing: '-0.01em', fontWeight: 500, color: 'var(--ink,#142950)' }}>
                      <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: gradeColor }}>&ldquo;</span>
                      {result.roast}
                      <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: gradeColor }}>&rdquo;</span>
                    </p>
                    <p style={{ marginTop: 20, color: 'var(--ink-3,#5A6A8A)', fontSize: 12, letterSpacing: '0.1em', fontFamily: 'var(--font-mono,monospace)' }}>CREDITIQ ENGINE - v2.1</p>
                    <div style={{ marginTop: 28, padding: 24, borderRadius: 18, background: 'rgba(184,66,48,0.08)', border: '1px solid rgba(184,66,48,0.25)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#B84230', marginBottom: 8 }}>ANNUAL OPPORTUNITY COST</div>
                      <div style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 800, color: '#B84230', letterSpacing: '-0.03em' }}>
                        Rs.<StatNumber value={annualLeft} />
                      </div>
                      <p style={{ marginTop: 10, color: 'var(--ink-3,#5A6A8A)', fontSize: 13.5 }}>At this spend, you&rsquo;re leaving Rs.{annualLeft.toLocaleString('en-IN')} on the table a year.</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 48 }} className="grid-1-mobile">
                  <div style={{ padding: 32, borderRadius: 20, background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 12 }}>YOUR MONTHLY EARN</div>
                    <div style={{ fontSize: 'clamp(42px,6vw,84px)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--ink,#142950)' }}>Rs.<StatNumber value={result.monthlyEarnings} /></div>
                  </div>
                  <div style={{ padding: 32, borderRadius: 20, background: 'linear-gradient(180deg,rgba(212,163,115,0.10),transparent)', border: '1px solid rgba(184,116,58,0.3)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 12 }}>POTENTIAL - RIGHT CARD</div>
                    <div style={{ fontSize: 'clamp(42px,6vw,84px)', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--copper-3,#D89B2A)' }}>Rs.<StatNumber value={result.monthlyPotential} /></div>
                  </div>
                </div>

                {result.improvements?.length > 0 && (
                  <div style={{ padding: 32, borderRadius: 20, background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', marginBottom: 48 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 22 }}>WHAT IS DRAGGING YOU DOWN</div>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {result.improvements.map((it, i) => (
                        <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: 14, borderBottom: i < result.improvements.length - 1 ? '1px solid var(--line,rgba(20,41,80,0.08))' : 'none' }}>
                          <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontSize: 20, lineHeight: 1, flexShrink: 0 }}>&rarr;</span>
                          <span style={{ fontSize: 15, color: 'var(--ink,#142950)', lineHeight: 1.55 }}>{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }} className="grid-1-mobile">
                  {result.betterCard && (
                    <div style={{ padding: 32, borderRadius: 20, background: 'linear-gradient(135deg,rgba(212,163,115,0.10),rgba(124,137,112,0.06))', border: '1px solid rgba(184,116,58,0.3)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 14 }}>OUR ALTERNATIVE</div>
                      <h3 style={{ fontSize: 28, letterSpacing: '-0.02em', marginBottom: 10, color: 'var(--ink,#142950)', fontWeight: 800 }}>{result.betterCard}</h3>
                      <p style={{ color: 'var(--ink-3,#5A6A8A)', fontSize: 14, lineHeight: 1.55, marginBottom: 18 }}>Based on your {PRESETS[preset].label.toLowerCase()} spend of Rs.{monthlySpend.toLocaleString('en-IN')}/mo, this earns you meaningfully more.</p>
                      {betterLinkable ? (
                        <Link href={`/card/${result.betterCardId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 999, background: 'var(--copper-3,#D89B2A)', color: 'var(--ink,#142950)', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>See full breakdown</Link>
                      ) : (
                        <span style={{ fontSize: 13, color: 'var(--ink-3,#5A6A8A)', fontStyle: 'italic' }}>Consider {result.betterCard} for your spend pattern.</span>
                      )}
                    </div>
                  )}
                  <div style={{ padding: 32, borderRadius: 20, background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 14 }}>SHARE THE ROAST</div>
                      <h3 style={{ fontSize: 24, lineHeight: 1.1, fontWeight: 400, color: 'var(--ink,#142950)' }}>Receipts for the group chat.</h3>
                    </div>
                    <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <button onClick={share} style={{ padding: '12px 22px', borderRadius: 100, background: 'var(--ink,#142950)', color: 'var(--bg,#fff)', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{copied ? 'Copied!' : 'Copy roast link'}</button>
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

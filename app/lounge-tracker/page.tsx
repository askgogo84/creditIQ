'use client'
import { useState } from 'react'
import { Header } from '@/components/Header'
import { DesignFooter } from '@/components/design/Footer'
import { Reveal } from '@/components/design/Reveal'

const MY_CARDS = [
  { name: 'HDFC Infinia', bank: 'HDFC', domestic: 'Unlimited', international: 'Unlimited', network: 'Priority Pass', used: 2, total: 999, color: '#142950' },
  { name: 'Axis Magnus', bank: 'AXIS', domestic: '8/year', international: '4/year', network: 'Priority Pass', used: 4, total: 8, color: '#4A1A6B' },
  { name: 'SBI Elite', bank: 'SBI', domestic: '2/quarter', international: '6/year', network: 'Dreamfolks', used: 1, total: 2, color: '#1A3A6B' },
]

const LOUNGES = [
  { airport: 'BLR - Bengaluru', name: 'Plaza Premium Lounge', terminal: 'T2 Domestic', network: 'Priority Pass', cards: ['HDFC Infinia', 'Axis Magnus'] },
  { airport: 'BLR - Bengaluru', name: 'BIAL Lounge', terminal: 'T1 Domestic', network: 'Dreamfolks', cards: ['SBI Elite'] },
  { airport: 'DEL - Delhi', name: 'Encalm Privaté', terminal: 'T3 International', network: 'Priority Pass', cards: ['HDFC Infinia'] },
  { airport: 'BOM - Mumbai', name: 'GVK Lounge', terminal: 'T2 International', network: 'Priority Pass', cards: ['HDFC Infinia', 'Axis Magnus'] },
]

export default function LoungeTrackerPage() {
  const [airport, setAirport] = useState('')

  const filtered = airport ? LOUNGES.filter(l => l.airport.toLowerCase().includes(airport.toLowerCase())) : LOUNGES

  return (
    <>
      <Header />
      <div className="page-fade">
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 80 }}>
          <div className="aurora" style={{ top: -100, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(124,137,112,0.30),transparent 60%)' }} />
          <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
            <Reveal style={{ textAlign: 'center', marginBottom: 'clamp(40px,6vw,64px)', maxWidth: 800, margin: '0 auto clamp(40px,6vw,64px)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 999, background: 'rgba(124,137,112,0.12)', border: '1px solid rgba(124,137,112,0.25)', marginBottom: 28 }}>
                <span>🛋</span>
                <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--sage,#7C8970)', textTransform: 'uppercase', fontWeight: 600 }}>TRAVEL TOOL - LOUNGE TRACKER</span>
              </div>
              <h1 style={{ fontSize: 'clamp(40px,7vw,96px)', letterSpacing: '-0.04em', lineHeight: 1.0, fontWeight: 800, color: 'var(--ink,#142950)' }}>
                Never get turned away{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--sage,#7C8970)', fontStyle: 'italic', fontWeight: 400 }}>at the gate</span>.
              </h1>
              <p style={{ maxWidth: 560, margin: '20px auto 0', color: 'var(--ink-2,#2A3F6B)', fontSize: 'clamp(15px,1.3vw,18px)', lineHeight: 1.55 }}>
                Track free visits across every card you carry. Know before you go.
              </p>
            </Reveal>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 32, alignItems: 'flex-start' }} className="grid-1-mobile">
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 16 }}>YOUR CARDS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {MY_CARDS.map((card, i) => (
                    <Reveal key={i} delay={i * 80}>
                      <div style={{ padding: 20, borderRadius: 18, background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)' }}>{card.bank}</div>
                            <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink,#142950)', marginTop: 2 }}>{card.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)', marginTop: 3 }}>{card.network}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: card.total === 999 ? 'var(--green,#4F8C58)' : 'var(--ink-3,#5A6A8A)' }}>
                              {card.total === 999 ? 'UNLIMITED' : `${card.total - card.used} LEFT`}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--bg-2,#EFE7D8)' }}>
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', letterSpacing: '0.1em' }}>Domestic</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#142950)', marginTop: 3 }}>{card.domestic}</div>
                          </div>
                          <div style={{ padding: '8px 12px', borderRadius: 10, background: 'var(--bg-2,#EFE7D8)' }}>
                            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', letterSpacing: '0.1em' }}>International</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink,#142950)', marginTop: 3 }}>{card.international}</div>
                          </div>
                        </div>
                        {card.total !== 999 && (
                          <div style={{ marginTop: 12, height: 4, background: 'var(--bg-2,#EFE7D8)', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{ width: `${(card.used / card.total) * 100}%`, height: '100%', background: card.used / card.total > 0.75 ? '#B84230' : 'var(--copper-3,#D89B2A)', borderRadius: 999 }} />
                          </div>
                        )}
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 12 }}>FIND LOUNGES AT YOUR AIRPORT</div>
                  <input value={airport} onChange={e => setAirport(e.target.value)} placeholder="Type airport name or code (e.g. BLR, DEL, BOM...)"
                    style={{ width: '100%', padding: '14px 18px', borderRadius: 14, border: '1px solid var(--line,rgba(20,41,80,0.12))', background: 'var(--surface,#fff)', color: 'var(--ink,#142950)', fontSize: 15, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filtered.map((lounge, i) => (
                    <Reveal key={i} delay={i * 60}>
                      <div style={{ padding: 20, borderRadius: 18, background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 4 }}>{lounge.airport} - {lounge.terminal}</div>
                            <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--ink,#142950)' }}>{lounge.name}</div>
                          </div>
                          <div style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(124,137,112,0.12)', color: 'var(--sage,#7C8970)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' as const }}>{lounge.network}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                          {lounge.cards.map(c => (
                            <span key={c} style={{ padding: '3px 10px', borderRadius: 999, background: 'var(--bg-2,#EFE7D8)', color: 'var(--ink-2,#2A3F6B)', fontSize: 11, fontWeight: 500 }}>{c}</span>
                          ))}
                        </div>
                      </div>
                    </Reveal>
                  ))}
                  {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-3,#5A6A8A)', fontSize: 15 }}>No lounges found for that airport.</div>
                  )}
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

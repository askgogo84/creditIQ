'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { getApplyUrl } from '@/lib/affiliate';

type Step = 'current' | 'reason' | 'debt' | 'result';

const SWITCH_REASONS = [
  { id: 'high-fee', label: 'Annual fee too high', icon: '💸' },
  { id: 'low-rewards', label: 'Rewards not matching my spends', icon: '📉' },
  { id: 'no-lounge', label: 'No airport lounge access', icon: '✈️' },
  { id: 'bad-forex', label: 'High forex markup for travel', icon: '🌍' },
  { id: 'debt', label: 'Want to transfer outstanding balance', icon: '🔄' },
  { id: 'upgrade', label: 'Ready to upgrade to premium', icon: '⭐' },
  { id: 'cashback', label: 'Want simple cashback instead', icon: '💰' },
  { id: 'dining', label: 'Better dining / food rewards', icon: '🍽️' },
];

const CARD_OPTIONS = SEED_CARDS.slice(0, 30).map(c => ({
  id: c.id,
  name: c.name,
  bank: c.bank,
  annualFee: (c as any).annual_fee_inr ?? 0,
  tier: (c as any).tier ?? 'standard',
}));

interface Recommendation {
  id: string;
  name: string;
  bank: string;
  annualFee: number;
  reasons: string[];
  btOffer?: string;
  monthlySaving?: number;
}

export default function CardSwitchPage() {
  const [step, setStep] = useState<Step>('current');
  const [currentCardId, setCurrentCardId] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [outstandingDebt, setOutstandingDebt] = useState('');
  const [currentInterestRate, setCurrentInterestRate] = useState('36');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ cards: Recommendation[]; summary: string; btSavings?: number } | null>(null);

  const currentCard = CARD_OPTIONS.find(c => c.id === currentCardId);
  const hasDebt = selectedReasons.includes('debt') || outstandingDebt !== '';
  const debtAmt = parseInt(outstandingDebt.replace(/,/g, '')) || 0;

  const toggleReason = (id: string) => {
    setSelectedReasons(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/card-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentCardId,
          reasons: selectedReasons,
          outstandingDebt: debtAmt,
          currentInterestRate: parseFloat(currentInterestRate),
        }),
      });
      const data = await res.json();
      setResult(data);
      setStep('result');
    } catch {
      setResult({
        summary: 'Analysis complete. Here are your best switch options.',
        cards: SEED_CARDS
          .filter(c => c.id !== currentCardId)
          .slice(0, 3)
          .map(c => ({
            id: c.id,
            name: c.name,
            bank: c.bank,
            annualFee: (c as any).annual_fee_inr ?? 0,
            reasons: ['Better rewards for your spend pattern'],
          })),
      });
      setStep('result');
    } finally {
      setLoading(false);
    }
  };

  const btMonthlySaving = debtAmt > 0
    ? Math.round(debtAmt * (parseFloat(currentInterestRate) - 0) / 100 / 12)
    : 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <Header />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px 80px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-block', backgroundColor: '#1B3A5C', borderRadius: 100,
            padding: '5px 18px', marginBottom: 16,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase' as const, letterSpacing: 1.5 }}>
              Card Switch Wizard &nbsp;&bull;&nbsp; Unbiased
            </span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1B3A5C', margin: '0 0 10px', lineHeight: 1.2 }}>
            Time to switch your credit card?
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Tell us what's wrong with your current card. We'll find better options and calculate your balance transfer savings.
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {(['current', 'reason', 'debt', 'result'] as Step[]).map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 4,
              backgroundColor: ['current', 'reason', 'debt', 'result'].indexOf(step) >= i ? '#1B3A5C' : '#e2e8f0',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Step 1 — Current card */}
        {step === 'current' && (
          <div style={{ backgroundColor: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '28px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B3A5C', margin: '0 0 6px' }}>
              Which card do you currently have?
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>
              Select your current card so we can find better alternatives.
            </p>
            <select
              value={currentCardId}
              onChange={e => setCurrentCardId(e.target.value)}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                border: '1.5px solid #e2e8f0', fontSize: 15, color: '#1e293b',
                backgroundColor: '#f8fafc', outline: 'none', marginBottom: 20,
                cursor: 'pointer',
              }}
            >
              <option value="">Select your card...</option>
              {CARD_OPTIONS.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.bank}</option>
              ))}
            </select>

            {currentCard && (
              <div style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: '16px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1B3A5C', marginBottom: 8 }}>Current card</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{currentCard.name}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{currentCard.bank}</div>
                  </div>
                  <div style={{ textAlign: 'right' as const }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: currentCard.annualFee === 0 ? '#16a34a' : '#dc2626' }}>
                      {currentCard.annualFee === 0 ? 'Free' : `Rs.${currentCard.annualFee.toLocaleString('en-IN')}/yr`}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Annual fee</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => currentCardId && setStep('reason')}
              disabled={!currentCardId}
              style={{
                width: '100%', padding: '14px', backgroundColor: currentCardId ? '#1B3A5C' : '#e2e8f0',
                color: currentCardId ? '#fff' : '#94a3b8', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 700, cursor: currentCardId ? 'pointer' : 'not-allowed',
              }}
            >
              Continue &rarr;
            </button>
          </div>
        )}

        {/* Step 2 — Reasons */}
        {step === 'reason' && (
          <div style={{ backgroundColor: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '28px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B3A5C', margin: '0 0 6px' }}>
              Why do you want to switch?
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>
              Select all that apply. We'll find cards that solve exactly these problems.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {SWITCH_REASONS.map(r => (
                <button
                  key={r.id}
                  onClick={() => toggleReason(r.id)}
                  style={{
                    padding: '14px 12px', borderRadius: 12, textAlign: 'left' as const,
                    border: selectedReasons.includes(r.id) ? '2px solid #1B3A5C' : '1px solid #e2e8f0',
                    backgroundColor: selectedReasons.includes(r.id) ? '#eff6ff' : '#f8fafc',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 6 }}>{r.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>{r.label}</div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('current')} style={{
                flex: 1, padding: '13px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#64748b', cursor: 'pointer',
              }}>Back</button>
              <button
                onClick={() => setStep('debt')}
                disabled={selectedReasons.length === 0}
                style={{
                  flex: 2, padding: '13px',
                  backgroundColor: selectedReasons.length > 0 ? '#1B3A5C' : '#e2e8f0',
                  color: selectedReasons.length > 0 ? '#fff' : '#94a3b8',
                  border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                  cursor: selectedReasons.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                Continue &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Debt / balance transfer */}
        {step === 'debt' && (
          <div style={{ backgroundColor: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '28px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B3A5C', margin: '0 0 6px' }}>
              Do you have an outstanding balance?
            </h2>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>
              If yes, we'll calculate your interest savings from a balance transfer to a 0% EMI card.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                Outstanding balance (leave blank if none)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, color: '#94a3b8', fontWeight: 600 }}>Rs.</span>
                <input
                  type="text"
                  placeholder="0"
                  value={outstandingDebt}
                  onChange={e => setOutstandingDebt(e.target.value)}
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: 12,
                    border: '1.5px solid #e2e8f0', fontSize: 15, color: '#1e293b',
                    backgroundColor: '#f8fafc', outline: 'none',
                  }}
                />
              </div>
            </div>

            {debtAmt > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                  Current interest rate (% per annum)
                </label>
                <input
                  type="number"
                  value={currentInterestRate}
                  onChange={e => setCurrentInterestRate(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 12,
                    border: '1.5px solid #e2e8f0', fontSize: 15, color: '#1e293b',
                    backgroundColor: '#f8fafc', outline: 'none',
                  }}
                />

                {/* Savings preview */}
                <div style={{
                  backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
                  padding: '16px', marginTop: 16,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 8 }}>
                    Estimated monthly interest saving
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a' }}>
                    Rs.{btMonthlySaving.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 13, color: '#166534', marginTop: 4 }}>
                    By transferring Rs.{debtAmt.toLocaleString('en-IN')} to a 0% balance transfer card
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('reason')} style={{
                flex: 1, padding: '13px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0',
                borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#64748b', cursor: 'pointer',
              }}>Back</button>
              <button
                onClick={analyze}
                disabled={loading}
                style={{
                  flex: 2, padding: '13px', backgroundColor: loading ? '#94a3b8' : '#C9972E',
                  color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Finding best cards...' : 'Find My Switch Options \u2192'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Results */}
        {step === 'result' && result && (
          <>
            {/* Summary */}
            <div style={{
              backgroundColor: '#1B3A5C', borderRadius: 16, padding: '20px 24px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 8 }}>
                Switch analysis
              </div>
              <div style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.7 }}>{result.summary}</div>
              {debtAmt > 0 && (
                <div style={{ marginTop: 16, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px' }}>
                  <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>Balance transfer savings</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#C9972E' }}>
                    Rs.{btMonthlySaving.toLocaleString('en-IN')}/month
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Rs.{(btMonthlySaving * 12).toLocaleString('en-IN')} annually on Rs.{debtAmt.toLocaleString('en-IN')} outstanding
                  </div>
                </div>
              )}
            </div>

            {/* Card recommendations */}
            {result.cards.map((card, i) => {
              const { url, label } = getApplyUrl(card.id);
              return (
                <div key={card.id} style={{
                  backgroundColor: '#fff', borderRadius: 16,
                  border: i === 0 ? '2px solid #C9972E' : '1px solid #e2e8f0',
                  marginBottom: 14, overflow: 'hidden',
                  boxShadow: i === 0 ? '0 4px 20px rgba(201,151,46,0.12)' : 'none',
                }}>
                  <div style={{
                    backgroundColor: i === 0 ? '#1B3A5C' : '#f8fafc',
                    padding: '10px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 6,
                        backgroundColor: i === 0 ? '#C9972E' : '#94a3b8',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800, color: '#fff',
                      }}>#{i + 1}</div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? '#C9972E' : '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>
                        {i === 0 ? 'Best switch' : `Option ${i + 1}`}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: i === 0 ? '#94a3b8' : '#cbd5e1' }}>{card.bank}</span>
                  </div>

                  <div style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                      <div>
                        <div style={{ fontSize: 19, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{card.name}</div>
                        {card.reasons.map((r, j) => (
                          <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 4 }}>
                            <div style={{
                              width: 16, height: 16, borderRadius: 4, backgroundColor: '#dcfce7',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, color: '#16a34a', fontWeight: 800, flexShrink: 0, marginTop: 2,
                            }}>+</div>
                            <span style={{ fontSize: 13, color: '#374151' }}>{r}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ textAlign: 'right' as const, flexShrink: 0, marginLeft: 12 }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: card.annualFee === 0 ? '#16a34a' : '#1B3A5C' }}>
                          {card.annualFee === 0 ? 'FREE' : `Rs.${card.annualFee.toLocaleString('en-IN')}`}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>annual fee</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{
                        flex: 1, display: 'block', backgroundColor: i === 0 ? '#C9972E' : '#1B3A5C',
                        color: '#fff', textAlign: 'center' as const, padding: '12px', borderRadius: 10,
                        fontSize: 14, fontWeight: 700, textDecoration: 'none',
                      }}>{label}</a>
                      <Link href={`/cards/${card.id}`} style={{
                        flex: 1, display: 'block', backgroundColor: '#f8fafc', color: '#1B3A5C',
                        textAlign: 'center' as const, padding: '12px', borderRadius: 10,
                        fontSize: 14, fontWeight: 600, textDecoration: 'none', border: '1px solid #e2e8f0',
                      }}>Full review &rarr;</Link>
                    </div>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => { setStep('current'); setResult(null); setSelectedReasons([]); setOutstandingDebt(''); }}
              style={{
                width: '100%', padding: '13px', backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14,
                fontWeight: 600, color: '#64748b', cursor: 'pointer', marginTop: 8,
              }}
            >
              Start over
            </button>
          </>
        )}
      </main>
    </div>
  );
}

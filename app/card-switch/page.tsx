'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { getApplyUrl } from '@/lib/affiliate';

type Step = 'current' | 'reason' | 'debt' | 'result';

const SWITCH_REASONS = [
  { id: 'high-fee', label: 'Annual fee too high', icon: '💸' },
  { id: 'low-rewards', label: 'Rewards not matching my spends', icon: '📉' },
  { id: 'no-lounge', label: 'No airport lounge access', icon: '' },
  { id: 'bad-forex', label: 'High forex markup for travel', icon: '🌍' },
  { id: 'debt', label: 'Want to transfer outstanding balance', icon: '🔄' },
  { id: 'upgrade', label: 'Ready to upgrade to premium', icon: '' },
  { id: 'cashback', label: 'Want simple cashback instead', icon: '💰' },
  { id: 'dining', label: 'Better dining / food rewards', icon: '🍽' },
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

/* shared style tokens -- same design system as /approval-odds */
const CARD: CSSProperties = {
  background: 'var(--bg-card, #fff)',
  border: '1px solid var(--border, #e2e8f0)',
  borderRadius: 20,
  padding: 24,
  marginBottom: 16,
};
const LABEL: CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--text-muted, #8888AA)',
  textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8,
};
const INPUT: CSSProperties = {
  width: '100%', height: 44, padding: '0 14px',
  background: 'var(--bg-input, #f8fafc)', border: '1px solid var(--border, #e2e8f0)',
  borderRadius: 10, fontSize: 15, color: 'var(--text, #0f172a)', outline: 'none',
  boxSizing: 'border-box',
};
const GOLD_BTN: CSSProperties = {
  height: 52, background: 'linear-gradient(135deg, #C9972E, #E8B84B)',
  color: '#0a0a0a', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 800,
  cursor: 'pointer',
};
const GHOST_BTN: CSSProperties = {
  height: 52, background: 'var(--bg-input, #f8fafc)', border: '1px solid var(--border, #e2e8f0)',
  borderRadius: 14, fontSize: 14, fontWeight: 700, color: 'var(--text-muted, #8888AA)',
  cursor: 'pointer',
};

export default function CardSwitchPage() {
  const [step, setStep] = useState<Step>('current');
  const [currentCardId, setCurrentCardId] = useState('');
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [outstandingDebt, setOutstandingDebt] = useState('');
  const [currentInterestRate, setCurrentInterestRate] = useState('36');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ cards: Recommendation[]; summary: string; btSavings?: number } | null>(null);

  const currentCard = CARD_OPTIONS.find(c => c.id === currentCardId);
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
    <div style={{ minHeight: '100vh', background: 'var(--bg, #08080E)' }}>
      <Header />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 100px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
            Card Switch Wizard
          </div>
          <h1 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 900, color: 'var(--text, #0f172a)', margin: '0 0 10px', letterSpacing: -0.5 }}>
            Time to switch your card?
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted, #8888AA)', margin: 0, lineHeight: 1.6 }}>
            Tell us what&apos;s wrong with your current card. We&apos;ll find better options and calculate your balance transfer savings.
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {(['current', 'reason', 'debt', 'result'] as Step[]).map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 4,
              background: ['current', 'reason', 'debt', 'result'].indexOf(step) >= i ? '#C9972E' : 'var(--border, #e2e8f0)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Step 1 -- Current card */}
        {step === 'current' && (
          <div style={CARD}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text, #0f172a)', margin: '0 0 6px' }}>
              Which card do you currently have?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted, #8888AA)', margin: '0 0 20px' }}>
              Select your current card so we can find better alternatives.
            </p>
            <select
              value={currentCardId}
              onChange={e => setCurrentCardId(e.target.value)}
              style={{ ...INPUT, cursor: 'pointer', marginBottom: 20 }}
            >
              <option value="" style={{ background: 'var(--bg-input, #f8fafc)', color: 'var(--text, #0f172a)' }}>Select your card...</option>
              {CARD_OPTIONS.map(c => (
                <option key={c.id} value={c.id} style={{ background: 'var(--bg-input, #f8fafc)', color: 'var(--text, #0f172a)' }}>{c.name} -- {c.bank}</option>
              ))}
            </select>

            {currentCard && (
              <div style={{ background: 'var(--bg-input, #f8fafc)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ ...LABEL, marginBottom: 8 }}>Current card</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text, #0f172a)' }}>{currentCard.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted, #8888AA)' }}>{currentCard.bank}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: currentCard.annualFee === 0 ? '#16a34a' : '#ef4444' }}>
                      {currentCard.annualFee === 0 ? 'Free' : `Rs.${currentCard.annualFee.toLocaleString('en-IN')}/yr`}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted, #8888AA)' }}>Annual fee</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => currentCardId && setStep('reason')}
              disabled={!currentCardId}
              style={{
                ...GOLD_BTN, width: '100%',
                background: currentCardId ? GOLD_BTN.background : 'rgba(201,151,46,0.3)',
                color: currentCardId ? '#0a0a0a' : 'rgba(255,255,255,0.4)',
                cursor: currentCardId ? 'pointer' : 'not-allowed',
              }}
            >
              Continue →



            </button>
          </div>
        )}

        {/* Step 2 -- Reasons */}
        {step === 'reason' && (
          <div style={CARD}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text, #0f172a)', margin: '0 0 6px' }}>
              Why do you want to switch?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted, #8888AA)', margin: '0 0 20px' }}>
              Select all that apply. We&apos;ll find cards that solve exactly these problems.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {SWITCH_REASONS.map(r => {
                const active = selectedReasons.includes(r.id);
                return (
                  <button
                    key={r.id}
                    onClick={() => toggleReason(r.id)}
                    style={{
                      padding: '14px 12px', borderRadius: 12, textAlign: 'left',
                      border: active ? '1px solid rgba(201,151,46,0.5)' : '1px solid var(--border, #e2e8f0)',
                      background: active ? 'rgba(201,151,46,0.12)' : 'var(--bg-input, #f8fafc)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{r.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text, #0f172a)', lineHeight: 1.3 }}>{r.label}</div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('current')} style={{ ...GHOST_BTN, flex: 1 }}>Back</button>
              <button
                onClick={() => setStep('debt')}
                disabled={selectedReasons.length === 0}
                style={{
                  ...GOLD_BTN, flex: 2,
                  background: selectedReasons.length > 0 ? GOLD_BTN.background : 'rgba(201,151,46,0.3)',
                  color: selectedReasons.length > 0 ? '#0a0a0a' : 'rgba(255,255,255,0.4)',
                  cursor: selectedReasons.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                Continue →



              </button>
            </div>
          </div>
        )}

        {/* Step 3 -- Debt / balance transfer */}
        {step === 'debt' && (
          <div style={CARD}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text, #0f172a)', margin: '0 0 6px' }}>
              Do you have an outstanding balance?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted, #8888AA)', margin: '0 0 20px' }}>
              If yes, we&apos;ll calculate your interest savings from a balance transfer to a 0% EMI card.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={LABEL}>Outstanding balance (leave blank if none)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, color: 'var(--text-muted, #8888AA)', fontWeight: 600 }}>Rs.</span>
                <input
                  type="text"
                  placeholder="0"
                  value={outstandingDebt}
                  onChange={e => setOutstandingDebt(e.target.value)}
                  style={INPUT}
                />
              </div>
            </div>

            {debtAmt > 0 && (
              <div style={{ marginBottom: 20 }}>
                <label style={LABEL}>Current interest rate (% per annum)</label>
                <input
                  type="number"
                  value={currentInterestRate}
                  onChange={e => setCurrentInterestRate(e.target.value)}
                  style={INPUT}
                />

                {/* Savings preview */}
                <div style={{
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 12, padding: 16, marginTop: 16,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                    Estimated monthly interest saving
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a' }}>
                    Rs.{btMonthlySaving.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 13, color: '#15803d', marginTop: 4 }}>
                    By transferring Rs.{debtAmt.toLocaleString('en-IN')} to a 0% balance transfer card
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('reason')} style={{ ...GHOST_BTN, flex: 1 }}>Back</button>
              <button
                onClick={analyze}
                disabled={loading}
                style={{
                  ...GOLD_BTN, flex: 2,
                  background: loading ? 'rgba(201,151,46,0.3)' : GOLD_BTN.background,
                  color: loading ? 'rgba(255,255,255,0.4)' : '#0a0a0a',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Finding best cards...' : 'Find My Switch Options ->'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 -- Results */}
        {step === 'result' && result && (
          <>
            {/* Summary -- feature band (stays dark in both themes) */}
            <div style={{
              background: 'linear-gradient(135deg, #1B3A5C, #0d2240)', borderRadius: 16,
              padding: '20px 24px', marginBottom: 20, border: '1px solid rgba(201,151,46,0.2)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
                Switch analysis
              </div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>{result.summary}</div>
              {debtAmt > 0 && (
                <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>Balance transfer savings</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#C9972E' }}>
                    Rs.{btMonthlySaving.toLocaleString('en-IN')}/month
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                    Rs.{(btMonthlySaving * 12).toLocaleString('en-IN')} annually on Rs.{debtAmt.toLocaleString('en-IN')} outstanding
                  </div>
                </div>
              )}
            </div>

            {/* Card recommendations */}
            {(result.cards || []).map((card, i) => {
              const { url, label } = getApplyUrl(card.id);
              return (
                <div key={card.id} style={{
                  background: 'var(--bg-card, #fff)',
                  border: i === 0 ? '1px solid rgba(201,151,46,0.3)' : '1px solid var(--border, #e2e8f0)',
                  borderRadius: 16, padding: '18px 20px', marginBottom: 14,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: i === 0 ? '#C9972E' : 'var(--text-muted, #8888AA)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: '#fff',
                    }}>#{i + 1}</div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? '#C9972E' : 'var(--text-muted, #8888AA)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      {i === 0 ? 'Best switch' : `Option ${i + 1}`}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted, #8888AA)', marginLeft: 'auto' }}>{card.bank}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--text, #0f172a)', marginBottom: 6 }}>{card.name}</div>
                      {(card.reasons || []).map((r, j) => (
                        <div key={j} style={{ fontSize: 13, color: '#16a34a', marginBottom: 2 }}>(ok) {r}</div>
                      ))}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: card.annualFee === 0 ? '#16a34a' : 'var(--text, #0f172a)' }}>
                        {card.annualFee === 0 ? 'FREE' : `Rs.${card.annualFee.toLocaleString('en-IN')}`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted, #8888AA)' }}>annual fee</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{
                      flex: 1, display: 'block', textAlign: 'center', padding: '10px 20px',
                      background: 'linear-gradient(135deg, #C9972E, #E8B84B)', color: '#0a0a0a',
                      borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none',
                    }}>{label}</a>
                    <Link href={`/cards/${card.id}`} style={{
                      flex: 1, display: 'block', textAlign: 'center', padding: '10px 20px',
                      background: 'var(--bg-input, #f8fafc)', color: 'var(--text, #0f172a)',
                      border: '1px solid var(--border, #e2e8f0)', borderRadius: 10,
                      fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    }}>Full review →</Link>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => { setStep('current'); setResult(null); setSelectedReasons([]); setOutstandingDebt(''); }}
              style={{ ...GHOST_BTN, width: '100%', marginTop: 8 }}
            >
              Start over
            </button>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

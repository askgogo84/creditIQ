'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { DesignFooter } from '@/components/design/Footer';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { getApplyUrl } from '@/lib/affiliate';
import { authedFetch } from '@/lib/authed-fetch';
import { useScrollToResults } from '@/lib/hooks/useScrollToResults';
import { StatusGlyph } from '@/components/ciq/StatusGlyph';

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
  slug?: string;
  name: string;
  bank: string;
  annualFee: number;
  reasons: string[];
  btOffer?: string;
  monthlySaving?: number;
}

/* Shared style tokens — white/copper light system (retired the slate --text/--border +
   gold-gradient third token system this page used to carry). Copper is the accent/CTA;
   verified-green (#4FBF87 / --prov-verified) is reserved for statements, so positives
   here use the neutral --green. */
const CARD: CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--line-strong)',
  borderRadius: 20,
  padding: 24,
  marginBottom: 16,
};
const LABEL: CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--ink-3)',
  textTransform: 'uppercase', letterSpacing: 1, display: 'block', marginBottom: 8,
};
const INPUT: CSSProperties = {
  width: '100%', height: 44, padding: '0 14px',
  background: 'var(--surface-2)', border: '1px solid var(--line-strong)',
  borderRadius: 10, fontSize: 15, color: 'var(--ink)', outline: 'none',
  boxSizing: 'border-box',
};
const COPPER_BTN: CSSProperties = {
  height: 52, background: 'var(--copper)',
  color: 'var(--surface)', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 800,
  cursor: 'pointer',
};
const GHOST_BTN: CSSProperties = {
  height: 52, background: 'var(--surface-2)', border: '1px solid var(--line-strong)',
  borderRadius: 14, fontSize: 14, fontWeight: 700, color: 'var(--ink-2)',
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
  const { ref: stepRef, scrollToResults } = useScrollToResults();
  // Advance (or go back) a wizard step and bring the new step into view — the
  // step content renders below the fold on mobile, so a plain setStep left the
  // viewport parked on the old step.
  const goStep = (s: Step) => { setStep(s); scrollToResults(); };

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
      const res = await authedFetch('/api/card-switch', {
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
      goStep('result');
    } catch {
      // Error/fallback path: still show fallback cards, but do NOT auto-scroll.
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
    <div>
      {/* Panel-only in the (cards) layout: dropped the redundant minHeight:100vh + near-black
          --bg-fallback wrapper. Tokens migrated to the white/copper light system (was slate
          --text/--border + a gold gradient). The 720 form measure is kept (matches /statement-truth). */}
      <main style={{ maxWidth: 1120, margin: 0, padding: '28px 0 100px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--copper)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
            Card Switch Wizard
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(38px, 4vw, 62px)', fontWeight: 400, color: 'var(--ink)', margin: '0 0 12px', letterSpacing: '-.04em', lineHeight: .98 }}>
            Is your current card still earning its place?
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ink-3)', margin: 0, lineHeight: 1.6 }}>
            Tell us what&apos;s wrong with your current card. We&apos;ll find better options and calculate your balance transfer savings.
          </p>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {(['current', 'reason', 'debt', 'result'] as Step[]).map((s, i) => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 4,
              background: ['current', 'reason', 'debt', 'result'].indexOf(step) >= i ? 'var(--copper)' : 'var(--line-strong)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* Wizard steps — one ref for the whole step region; goStep() scrolls here
            on every advance so the new step is in view (offset 16: shell has no
            fixed top header). */}
        <div ref={stepRef} style={{ scrollMarginTop: 16 }}>

        {/* Step 1 -- Current card */}
        {step === 'current' && (
          <div style={CARD}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px' }}>
              Which card do you currently have?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 20px' }}>
              Select your current card so we can find better alternatives.
            </p>
            <select
              value={currentCardId}
              onChange={e => setCurrentCardId(e.target.value)}
              style={{ ...INPUT, cursor: 'pointer', marginBottom: 20 }}
            >
              <option value="" style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}>Select your card...</option>
              {CARD_OPTIONS.map(c => (
                <option key={c.id} value={c.id} style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}>{c.name} -- {c.bank}</option>
              ))}
            </select>

            {currentCard && (
              <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line-strong)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ ...LABEL, marginBottom: 8 }}>Current card</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{currentCard.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>{currentCard.bank}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: currentCard.annualFee === 0 ? 'var(--green)' : 'var(--red)' }}>
                      {currentCard.annualFee === 0 ? 'Free' : `Rs.${currentCard.annualFee.toLocaleString('en-IN')}/yr`}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Annual fee</div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => currentCardId && goStep('reason')}
              disabled={!currentCardId}
              style={{
                ...COPPER_BTN, width: '100%',
                background: currentCardId ? COPPER_BTN.background : 'var(--line-strong)',
                color: currentCardId ? 'var(--surface)' : 'var(--ink-4)',
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
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px' }}>
              Why do you want to switch?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 20px' }}>
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
                      border: active ? '1px solid var(--copper)' : '1px solid var(--line-strong)',
                      background: active ? 'color-mix(in srgb, var(--copper) 12%, transparent)' : 'var(--surface-2)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 6 }}>{r.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3 }}>{r.label}</div>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => goStep('current')} style={{ ...GHOST_BTN, flex: 1 }}>Back</button>
              <button
                onClick={() => goStep('debt')}
                disabled={selectedReasons.length === 0}
                style={{
                  ...COPPER_BTN, flex: 2,
                  background: selectedReasons.length > 0 ? COPPER_BTN.background : 'var(--line-strong)',
                  color: selectedReasons.length > 0 ? 'var(--surface)' : 'var(--ink-4)',
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
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px' }}>
              Do you have an outstanding balance?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 20px' }}>
              If yes, we&apos;ll calculate your interest savings from a balance transfer to a 0% EMI card.
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={LABEL}>Outstanding balance (leave blank if none)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, color: 'var(--ink-3)', fontWeight: 600 }}>Rs.</span>
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
                  background: 'var(--green-soft)', border: '1px solid color-mix(in srgb, var(--green) 30%, transparent)',
                  borderRadius: 12, padding: 16, marginTop: 16,
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                    Estimated monthly interest saving
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--green)' }}>
                    Rs.{btMonthlySaving.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--green)', marginTop: 4 }}>
                    By transferring Rs.{debtAmt.toLocaleString('en-IN')} to a 0% balance transfer card
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => goStep('reason')} style={{ ...GHOST_BTN, flex: 1 }}>Back</button>
              <button
                onClick={analyze}
                disabled={loading}
                style={{
                  ...COPPER_BTN, flex: 2,
                  background: loading ? 'var(--line-strong)' : COPPER_BTN.background,
                  color: loading ? 'var(--ink-4)' : 'var(--surface)',
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
            {/* Summary — copper-accented emphasis panel (token-based, adapts to both themes;
                was a hardcoded dark navy slab under the retired gold system). */}
            <div style={{
              background: 'var(--surface-2)', borderRadius: 16,
              padding: '20px 24px', marginBottom: 20, border: '1px solid var(--line-strong)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--copper)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
                Switch analysis
              </div>
              <div style={{ fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.7 }}>{result.summary}</div>
              {debtAmt > 0 && (
                <div style={{ marginTop: 16, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: 14 }}>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 4 }}>Balance transfer savings</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--copper)' }}>
                    Rs.{btMonthlySaving.toLocaleString('en-IN')}/month
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
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
                  background: 'var(--surface)',
                  border: i === 0 ? '1px solid var(--copper)' : '1px solid var(--line-strong)',
                  borderRadius: 16, padding: '18px 20px', marginBottom: 14,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: i === 0 ? 'var(--copper)' : 'var(--ink-3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: 'var(--surface)',
                    }}>#{i + 1}</div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? 'var(--copper)' : 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      {i === 0 ? 'Best switch' : `Option ${i + 1}`}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)', marginLeft: 'auto' }}>{card.bank}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>{card.name}</div>
                      {(card.reasons || []).map((r, j) => (
                        <div key={j} style={{ fontSize: 13, color: 'var(--green)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}><StatusGlyph kind="check" color="var(--green)" size={13} /> {r}</div>
                      ))}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: card.annualFee === 0 ? 'var(--green)' : 'var(--ink)' }}>
                        {card.annualFee === 0 ? 'FREE' : `Rs.${card.annualFee.toLocaleString('en-IN')}`}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>annual fee</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    {url && <a href={url} target="_blank" rel="noopener noreferrer" style={{
                      flex: 1, display: 'block', textAlign: 'center', padding: '10px 20px',
                      background: 'var(--copper)', color: 'var(--surface)',
                      borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none',
                    }}>{label}</a>}
                    <Link href={`/card/${card.slug || card.id || ""}`} style={{
                      flex: 1, display: 'block', textAlign: 'center', padding: '10px 20px',
                      background: 'var(--surface-2)', color: 'var(--ink)',
                      border: '1px solid var(--line-strong)', borderRadius: 10,
                      fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    }}>Full review →</Link>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => { setResult(null); setSelectedReasons([]); setOutstandingDebt(''); goStep('current'); }}
              style={{ ...GHOST_BTN, width: '100%', marginTop: 8 }}
            >
              Start over
            </button>
          </>
        )}
        </div>
      </main>
      <DesignFooter />
    </div>
  );
}

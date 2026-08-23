'use client';

import { useState } from 'react';
import { authedFetch } from '@/lib/authed-fetch';
import { PageHeader } from '@/components/ciq/PageHeader';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { useScrollToResults } from '@/lib/hooks/useScrollToResults';

// Card-count claim is COMPUTED from the canonical catalogue, never typed — so it can't
// drift from reality the way the old hardcoded "93+" did. The engine (RAG) is grounded
// strictly on this database ("use ONLY these cards"), so the honest claim is our real
// catalogue size, not an inflated marketing figure.
const CARD_COUNT = SEED_CARDS.length;

const CATEGORIES = [
  { id: 'dining', label: 'Dining & Restaurants', placeholder: '5000', icon: '🍽️' },
  { id: 'travel', label: 'Travel & Hotels', placeholder: '10000', icon: '✈️' },
  { id: 'fuel', label: 'Fuel', placeholder: '4000', icon: '⛽' },
  { id: 'shopping', label: 'Online Shopping', placeholder: '8000', icon: '🛍️' },
  { id: 'grocery', label: 'Grocery & Supermarket', placeholder: '6000', icon: '🛒' },
  { id: 'ott', label: 'OTT & Subscriptions', placeholder: '1500', icon: '📺' },
  { id: 'utilities', label: 'Utilities & Bills', placeholder: '3000', icon: '💡' },
  { id: 'international', label: 'International Spends', placeholder: '0', icon: '🌍' },
];

interface SpendData { [key: string]: string; }

interface CardResult {
  name: string;
  bank: string;
  monthlyEarnings: number;
  annualEarnings: number;
  annualFee: number;
  netAnnualValue: number;
  highlights: string[];
  bestFor: string;
  rank: number;
}

interface AIResult {
  cards: CardResult[];
  topPickReason: string;
  totalSpend: number;
  insight: string;
}

function fmt(n: number) {
  return 'Rs. ' + Math.round(n).toLocaleString('en-IN');
}

const RANK_LABELS = ['🥇 Best Pick', '🥈 Runner Up', '🥉 Third Pick'];
// Rank accents on the white/copper system: copper for the winner, muted ink for the
// runner-up, a lighter copper for third — no gold/bronze literals.
const RANK_COLORS = ['var(--copper)', 'var(--ink-3)', 'var(--copper-2)'];

export default function SpendOptimizerPage() {
  const [spends, setSpends] = useState<SpendData>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'result'>('input');
  const { ref: resultsRef, scrollToResults } = useScrollToResults();

  const totalSpend = Object.values(spends).reduce((sum, v) => sum + (parseInt(v) || 0), 0);

  const handleAnalyze = async () => {
    const hasSpend = Object.values(spends).some(v => parseInt(v) > 0);
    if (!hasSpend) { setError('Please enter at least one spend category.'); return; }
    setError('');
    setLoading(true);
    try {
      const spendSummary = CATEGORIES
        .filter(c => parseInt(spends[c.id] || '0') > 0)
        .map(c => `${c.label}: Rs.${parseInt(spends[c.id]).toLocaleString('en-IN')}/month`)
        .join(', ');

      const prompt = `You are CreditIQ's unbiased card recommendation engine for India. User monthly spends: ${spendSummary}. Total: Rs.${totalSpend}/month.

Recommend TOP 5 Indian credit cards that maximize rewards for this spend pattern. Consider all major Indian banks: HDFC, SBI, ICICI, Axis, Amex, IDFC First, Kotak, Yes Bank, AU Small Finance, IndusInd, Standard Chartered, Citi (now Axis), RBL.

Use realistic reward rates. Be comprehensive — do not limit to just premium cards if the spend profile doesn't justify the fee.

Respond ONLY with valid JSON (no markdown, no backticks, no explanation outside the JSON):
{
  "cards": [
    {
      "name": "HDFC Regalia Gold",
      "bank": "HDFC Bank",
      "monthlyEarnings": 2340,
      "annualEarnings": 28080,
      "annualFee": 2500,
      "netAnnualValue": 25580,
      "highlights": ["5X points on dining worth Rs.250/month", "2X on all spends", "Free airport lounge 4x/year"],
      "bestFor": "Best for heavy dining and travel spends with solid base rewards",
      "rank": 1
    }
  ],
  "topPickReason": "2-3 sentences on why card 1 is the best pick for this specific spend pattern",
  "totalSpend": ${totalSpend},
  "insight": "One surprising insight about their spend pattern or a card opportunity they might not know"
}`;

      const response = await authedFetch('/api/spend-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, spends, totalSpend }),
      });
      if (!response.ok) throw new Error('failed');
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setStep('result');
      if (data?.cards?.length > 0) scrollToResults();
    } catch (e: unknown) {
      setError('Analysis failed. Please try again. ' + (e instanceof Error ? e.message : ''));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setResult(null);
    setError('');
  };

  return (
    <>
      {/* Section name + SectionTabs live in the (spend) layout above this panel. This
          panel owns the page's own display headline + subtitle (eyebrow dropped as
          redundant with the section name) and the tool. The tool keeps its 700 reading
          measure but left-aligns (no margin:0 auto) so its left edge sits flush under
          the headline in the shared 1100 container. */}
      <PageHeader
        title="Which card earns you the most money?"
        subtitle={`Enter your monthly spends — our AI picks from our ${CARD_COUNT} tracked cards by what each earns.`}
        maxWidth={1100}
        showTabs={false}
      />

      {/* The tool, on its own reading measure beneath the headline. */}
      <div style={{ maxWidth: 700, marginTop: 24 }}>

          {step === 'input' && (
            <>
              {/* Input card */}
              <div style={{
                background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--line)',
                boxShadow: '0 1px 3px color-mix(in srgb, var(--ink) 6%, transparent), 0 8px 24px color-mix(in srgb, var(--ink) 4%, transparent)',
                overflow: 'hidden', marginBottom: 20,
              }}>
                <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--line)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: 1.5, margin: 0 }}>
                    Monthly Spends
                  </p>
                </div>

                {CATEGORIES.map((cat, i) => (
                  <div key={cat.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 24px',
                    borderBottom: i < CATEGORIES.length - 1 ? '1px solid var(--line-soft)' : 'none',
                  }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{cat.icon}</span>
                    <div style={{ flex: 1, fontSize: 14, color: 'var(--ink-2)', fontWeight: 500 }}>
                      {cat.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, color: 'var(--ink-4)', fontWeight: 500 }}>Rs.</span>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        placeholder={cat.placeholder}
                        value={spends[cat.id] || ''}
                        onChange={e => setSpends(prev => ({ ...prev, [cat.id]: e.target.value }))}
                        style={{
                          width: 90, padding: '8px 10px', borderRadius: 10,
                          border: spends[cat.id] ? '1.5px solid var(--copper)' : '1px solid var(--line-strong)',
                          fontSize: 14, textAlign: 'right', color: 'var(--ink)',
                          background: spends[cat.id] ? 'color-mix(in srgb, var(--copper) 8%, transparent)' : 'var(--surface-2)',
                          outline: 'none', fontWeight: spends[cat.id] ? 600 : 400,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Total bar */}
              {totalSpend > 0 && (
                <div style={{
                  background: 'var(--navy)', borderRadius: 14, padding: '14px 24px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 16,
                }}>
                  <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 500 }}>Total monthly spend</span>
                  <span style={{ color: 'var(--copper-3)', fontSize: 20, fontWeight: 800 }}>{fmt(totalSpend)}</span>
                </div>
              )}

              {error && (
                <div style={{
                  background: 'rgba(184,66,48,0.08)', border: '1px solid rgba(184,66,48,0.25)',
                  borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                  color: '#B84230', fontSize: 14,
                }}>{error}</div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={loading || totalSpend === 0}
                style={{
                  width: '100%', padding: '16px 24px', borderRadius: 14,
                  background: totalSpend > 0 ? 'var(--copper)' : 'var(--ink-5)',
                  color: 'var(--paper)', fontSize: 16, fontWeight: 700, border: 'none',
                  cursor: totalSpend > 0 && !loading ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'all 0.2s',
                }}
              >
                {loading ? (
                  <>
                    <span style={{
                      width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff', borderRadius: '50%',
                      display: 'inline-block', animation: 'spin 0.8s linear infinite',
                    }} />
                    Analysing {CARD_COUNT} cards...
                  </>
                ) : (
                  <>✨ Find My Best Card</>
                )}
              </button>

              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </>
          )}

          {step === 'result' && result && (
            <div ref={resultsRef} style={{ scrollMarginTop: 16 }}>
              {/* Insight banner — informational (amber), a semantic feedback tint kept
                  as an intentional literal (no on-system token for info states). */}
              {result.insight && (
                <div style={{
                  background: 'rgba(212,163,115,0.12)', border: '1px solid rgba(212,163,115,0.30)',
                  borderRadius: 14, padding: '14px 18px', marginBottom: 20,
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>{result.insight}</p>
                </div>
              )}

              {/* Top-pick reasoning */}
              {result.topPickReason && (
                <div style={{
                  background: 'color-mix(in srgb, var(--copper) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--copper) 22%, transparent)',
                  borderRadius: 14, padding: '14px 18px', marginBottom: 20,
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>🏆</span>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>{result.topPickReason}</p>
                </div>
              )}

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                {result.cards.map((card, idx) => (
                  <div key={idx} style={{
                    background: 'var(--surface)', borderRadius: 20,
                    boxShadow: idx === 0
                      ? '0 0 0 2px var(--copper), 0 8px 24px color-mix(in srgb, var(--copper) 12%, transparent)'
                      : '0 1px 3px color-mix(in srgb, var(--ink) 6%, transparent), 0 4px 12px color-mix(in srgb, var(--ink) 4%, transparent)',
                    border: idx === 0 ? 'none' : '1px solid var(--line)',
                    overflow: 'hidden',
                  }}>
                    {/* Card header */}
                    <div style={{
                      background: idx === 0 ? 'var(--ink)' : 'var(--surface-2)',
                      padding: '14px 20px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <span style={{
                          fontSize: 11, fontWeight: 700, letterSpacing: 1,
                          color: RANK_COLORS[idx] || 'var(--ink-3)',
                          textTransform: 'uppercase',
                        }}>
                          {RANK_LABELS[idx] || `#${card.rank}`}
                        </span>
                        <p style={{
                          margin: '2px 0 0', fontWeight: 800,
                          fontSize: 17, color: idx === 0 ? 'var(--paper)' : 'var(--ink)',
                        }}>{card.name}</p>
                        <p style={{ margin: 0, fontSize: 12, color: idx === 0 ? 'rgba(255,255,255,0.55)' : 'var(--ink-3)' }}>{card.bank}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: 11, color: idx === 0 ? 'rgba(255,255,255,0.55)' : 'var(--ink-3)', fontWeight: 600 }}>NET ANNUAL VALUE</p>
                        {/* AI ESTIMATE — copper, never verified-green (green is reserved
                            for statement-verified figures, DESIGN.md §Provenance). */}
                        <p style={{
                          margin: 0, fontSize: 22, fontWeight: 800,
                          color: idx === 0 ? 'var(--copper-3)' : 'var(--copper)',
                        }}>
                          {fmt(card.netAnnualValue)}
                        </p>
                      </div>
                    </div>

                    {/* Earnings breakdown */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 1, background: 'var(--line)',
                    }}>
                      {[
                        { label: 'Monthly Earn', value: fmt(card.monthlyEarnings) },
                        { label: 'Annual Earn', value: fmt(card.annualEarnings) },
                        { label: 'Annual Fee', value: card.annualFee === 0 ? 'FREE' : fmt(card.annualFee) },
                      ].map((stat, i) => (
                        <div key={i} style={{
                          background: 'var(--surface)', padding: '12px 14px', textAlign: 'center',
                        }}>
                          <p style={{ margin: 0, fontSize: 10, color: 'var(--ink-4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{stat.label}</p>
                          <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: stat.label === 'Annual Fee' && card.annualFee === 0 ? 'var(--copper)' : 'var(--ink)' }}>{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Highlights */}
                    <div style={{ padding: '14px 20px' }}>
                      <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: 1 }}>Why this card</p>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {card.highlights.map((h, i) => (
                          <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                            <span style={{ color: 'var(--copper)', fontWeight: 700, flexShrink: 0 }}>→</span>
                            {h}
                          </li>
                        ))}
                      </ul>
                      {card.bestFor && (
                        <div style={{
                          marginTop: 10, padding: '8px 12px',
                          background: 'var(--surface-2)', borderRadius: 8,
                          fontSize: 12, color: 'var(--ink-2)',
                        }}>
                          {card.bestFor}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Spend summary */}
              <div style={{
                background: 'var(--navy)', borderRadius: 14, padding: '14px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 20,
              }}>
                <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 500 }}>Monthly spend analysed</span>
                <span style={{ color: 'var(--copper-3)', fontSize: 18, fontWeight: 800 }}>{fmt(result.totalSpend)}</span>
              </div>

              <button
                onClick={handleReset}
                style={{
                  width: '100%', padding: '14px 24px', borderRadius: 14,
                  background: 'transparent', color: 'var(--ink)',
                  fontSize: 15, fontWeight: 600, border: '2px solid var(--ink)',
                  cursor: 'pointer',
                }}
              >
                ← Try Different Spends
              </button>
            </div>
          )}
      </div>
    </>
  );
}

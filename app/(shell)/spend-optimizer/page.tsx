'use client';

import { useState } from 'react';
import { authedFetch } from '@/lib/authed-fetch';

const CATEGORIES = [
  { id: 'dining', label: 'Dining & Restaurants', color: '#e11d48', placeholder: '5000', icon: '🍽️' },
  { id: 'travel', label: 'Travel & Hotels', color: '#0ea5e9', placeholder: '10000', icon: '✈️' },
  { id: 'fuel', label: 'Fuel', color: '#f59e0b', placeholder: '4000', icon: '⛽' },
  { id: 'shopping', label: 'Online Shopping', color: '#8b5cf6', placeholder: '8000', icon: '🛍️' },
  { id: 'grocery', label: 'Grocery & Supermarket', color: '#10b981', placeholder: '6000', icon: '🛒' },
  { id: 'ott', label: 'OTT & Subscriptions', color: '#6366f1', placeholder: '1500', icon: '📺' },
  { id: 'utilities', label: 'Utilities & Bills', color: '#f97316', placeholder: '3000', icon: '💡' },
  { id: 'international', label: 'International Spends', color: '#14b8a6', placeholder: '0', icon: '🌍' },
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
const RANK_COLORS = ['#C9972E', '#64748b', '#cd7f32'];

export default function SpendOptimizerPage() {
  const [spends, setSpends] = useState<SpendData>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'input' | 'result'>('input');

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
    <div className="min-h-screen" style={{ backgroundColor: '#f1f5f9' }}>
      <main className="mx-auto px-4 pb-28" style={{ maxWidth: 700, paddingTop: 40 }}>

        {/* Hero */}
        <div className="text-center mb-8">
          <span style={{
            display: 'inline-block', backgroundColor: '#1B3A5C', color: '#C9972E',
            fontSize: 11, fontWeight: 700, letterSpacing: 1.5, padding: '5px 16px',
            borderRadius: 100, marginBottom: 20, textTransform: 'uppercase',
          }}>
            No affiliate bias &nbsp;•&nbsp; Pure AI
          </span>
          <h1 style={{
            fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, color: '#1B3A5C',
            margin: '0 0 14px', lineHeight: 1.15, letterSpacing: '-0.5px',
          }}>
            Which card earns you<br />the most money?
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', margin: 0, lineHeight: 1.7, maxWidth: 480, marginInline: 'auto' }}>
            Enter your monthly spends. Our AI scans 93+ Indian credit cards and shows exactly how much each card earns you — with zero bank bias.
          </p>
        </div>

        {step === 'input' && (
          <>
            {/* Input card */}
            <div style={{
              backgroundColor: '#fff', borderRadius: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
              overflow: 'hidden', marginBottom: 20,
            }}>
              <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #f1f5f9' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, margin: 0 }}>
                  Monthly Spends
                </p>
              </div>

              {CATEGORIES.map((cat, i) => (
                <div key={cat.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 24px',
                  borderBottom: i < CATEGORIES.length - 1 ? '1px solid #f8fafc' : 'none',
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{cat.icon}</span>
                  <div style={{ flex: 1, fontSize: 14, color: '#334155', fontWeight: 500 }}>
                    {cat.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Rs.</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      placeholder={cat.placeholder}
                      value={spends[cat.id] || ''}
                      onChange={e => setSpends(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      style={{
                        width: 90, padding: '8px 10px', borderRadius: 10,
                        border: spends[cat.id] ? '1.5px solid #1B3A5C' : '1px solid #e2e8f0',
                        fontSize: 14, textAlign: 'right', color: '#1e293b',
                        backgroundColor: spends[cat.id] ? '#f0f4ff' : '#f8fafc',
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
                backgroundColor: '#1B3A5C', borderRadius: 14, padding: '14px 24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 16,
              }}>
                <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>Total monthly spend</span>
                <span style={{ color: '#C9972E', fontSize: 20, fontWeight: 800 }}>{fmt(totalSpend)}</span>
              </div>
            )}

            {error && (
              <div style={{
                backgroundColor: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 12, padding: '12px 16px', marginBottom: 16,
                color: '#dc2626', fontSize: 14,
              }}>{error}</div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading || totalSpend === 0}
              style={{
                width: '100%', padding: '16px 24px', borderRadius: 14,
                backgroundColor: totalSpend > 0 ? '#1B3A5C' : '#cbd5e1',
                color: '#fff', fontSize: 16, fontWeight: 700, border: 'none',
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
                  Analysing 93+ cards...
                </>
              ) : (
                <>✨ Find My Best Card</>
              )}
            </button>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {step === 'result' && result && (
          <>
            {/* Insight banner */}
            {result.insight && (
              <div style={{
                backgroundColor: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 14, padding: '14px 18px', marginBottom: 20,
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
                <p style={{ margin: 0, fontSize: 14, color: '#78350f', lineHeight: 1.6 }}>{result.insight}</p>
              </div>
            )}

            {/* Top pick reason */}
            {result.topPickReason && (
              <div style={{
                backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 14, padding: '14px 18px', marginBottom: 20,
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>🏆</span>
                <p style={{ margin: 0, fontSize: 14, color: '#14532d', lineHeight: 1.6 }}>{result.topPickReason}</p>
              </div>
            )}

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {result.cards.map((card, idx) => (
                <div key={idx} style={{
                  backgroundColor: '#fff', borderRadius: 20,
                  boxShadow: idx === 0
                    ? '0 0 0 2px #C9972E, 0 8px 24px rgba(201,151,46,0.12)'
                    : '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                }}>
                  {/* Card header */}
                  <div style={{
                    backgroundColor: idx === 0 ? '#1B3A5C' : '#f8fafc',
                    padding: '14px 20px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, letterSpacing: 1,
                        color: RANK_COLORS[idx] || '#64748b',
                        textTransform: 'uppercase',
                      }}>
                        {RANK_LABELS[idx] || `#${card.rank}`}
                      </span>
                      <p style={{
                        margin: '2px 0 0', fontWeight: 800,
                        fontSize: 17, color: idx === 0 ? '#fff' : '#1B3A5C',
                      }}>{card.name}</p>
                      <p style={{ margin: 0, fontSize: 12, color: idx === 0 ? '#94a3b8' : '#64748b' }}>{card.bank}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: 11, color: idx === 0 ? '#94a3b8' : '#64748b', fontWeight: 600 }}>NET ANNUAL VALUE</p>
                      <p style={{
                        margin: 0, fontSize: 22, fontWeight: 800,
                        color: idx === 0 ? '#C9972E' : '#10b981',
                      }}>
                        {fmt(card.netAnnualValue)}
                      </p>
                    </div>
                  </div>

                  {/* Earnings breakdown */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 1, backgroundColor: '#f1f5f9',
                  }}>
                    {[
                      { label: 'Monthly Earn', value: fmt(card.monthlyEarnings) },
                      { label: 'Annual Earn', value: fmt(card.annualEarnings) },
                      { label: 'Annual Fee', value: card.annualFee === 0 ? 'FREE' : fmt(card.annualFee) },
                    ].map((stat, i) => (
                      <div key={i} style={{
                        backgroundColor: '#fff', padding: '12px 14px', textAlign: 'center',
                      }}>
                        <p style={{ margin: 0, fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>{stat.label}</p>
                        <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 700, color: stat.label === 'Annual Fee' && card.annualFee === 0 ? '#10b981' : '#1e293b' }}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Highlights */}
                  <div style={{ padding: '14px 20px' }}>
                    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Why this card</p>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {card.highlights.map((h, i) => (
                        <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                          <span style={{ color: '#C9972E', fontWeight: 700, flexShrink: 0 }}>→</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                    {card.bestFor && (
                      <div style={{
                        marginTop: 10, padding: '8px 12px',
                        backgroundColor: '#f8fafc', borderRadius: 8,
                        fontSize: 12, color: '#475569', fontStyle: 'italic',
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
              backgroundColor: '#1B3A5C', borderRadius: 14, padding: '14px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 20,
            }}>
              <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 500 }}>Monthly spend analysed</span>
              <span style={{ color: '#C9972E', fontSize: 18, fontWeight: 800 }}>{fmt(result.totalSpend)}</span>
            </div>

            <button
              onClick={handleReset}
              style={{
                width: '100%', padding: '14px 24px', borderRadius: 14,
                backgroundColor: 'transparent', color: '#1B3A5C',
                fontSize: 15, fontWeight: 600, border: '2px solid #1B3A5C',
                cursor: 'pointer',
              }}
            >
              ← Try Different Spends
            </button>
          </>
        )}
      </main>
    </div>
  );
}

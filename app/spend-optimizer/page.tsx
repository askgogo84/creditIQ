'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';

const CATEGORIES = [
  { id: 'dining', label: 'Dining & Restaurants', color: '#e11d48', placeholder: '5000' },
  { id: 'travel', label: 'Travel & Hotels', color: '#0ea5e9', placeholder: '10000' },
  { id: 'fuel', label: 'Fuel', color: '#f59e0b', placeholder: '4000' },
  { id: 'shopping', label: 'Online Shopping', color: '#8b5cf6', placeholder: '8000' },
  { id: 'grocery', label: 'Grocery & Supermarket', color: '#10b981', placeholder: '6000' },
  { id: 'ott', label: 'OTT & Subscriptions', color: '#6366f1', placeholder: '1500' },
  { id: 'utilities', label: 'Utilities & Bills', color: '#f97316', placeholder: '3000' },
  { id: 'international', label: 'International Spends', color: '#14b8a6', placeholder: '0' },
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

Recommend TOP 3 Indian credit cards that maximize rewards for this spend pattern. Use realistic reward rates.

Respond ONLY with valid JSON, no markdown, no explanation:
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

      const response = await fetch('/api/spend-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, spends, totalSpend }),
      });
      if (!response.ok) throw new Error('failed');
      const data = await response.json();
      setResult(data);
      setStep('result');
    } catch {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <Header />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px 100px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{
            display: 'inline-block', backgroundColor: '#1B3A5C', color: '#C9972E',
            fontSize: 11, fontWeight: 700, letterSpacing: 1.5, padding: '5px 16px',
            borderRadius: 100, marginBottom: 20, textTransform: 'uppercase',
          }}>
            No affiliate bias &nbsp;&bull;&nbsp; Pure AI
          </span>
          <h1 style={{
            fontSize: 36, fontWeight: 800, color: '#1B3A5C',
            margin: '0 0 14px', lineHeight: 1.15, letterSpacing: '-0.5px',
          }}>
            Which card earns you<br />the most money?
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', margin: 0, lineHeight: 1.7, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto' }}>
            Enter your monthly spends. Our AI scans 93 Indian credit cards and shows exactly how much each card earns you &mdash; with zero bank bias.
          </p>
        </div>

        {step === 'input' && (
          <>
            {/* Input card */}
            <div style={{
              backgroundColor: '#ffffff', borderRadius: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.04)',
              overflow: 'hidden', marginBottom: 20,
            }}>
              <div style={{ padding: '20px 28px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  Monthly spends
                </div>
              </div>

              {CATEGORIES.map((cat, i) => (
                <div key={cat.id} style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '13px 28px',
                  borderBottom: i < CATEGORIES.length - 1 ? '1px solid #f8fafc' : 'none',
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    backgroundColor: cat.color, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, fontSize: 14, color: '#334155', fontWeight: 500 }}>
                    {cat.label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Rs.</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      placeholder={cat.placeholder}
                      value={spends[cat.id] || ''}
                      onChange={e => setSpends(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      style={{
                        width: 90, padding: '8px 12px', borderRadius: 10,
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
                backgroundColor: '#1B3A5C', borderRadius: 14, padding: '16px 28px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 16,
              }}>
                <span style={{ color: '#94a3b8', fontSize: 14 }}>Total monthly spend</span>
                <span style={{ color: '#C9972E', fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px' }}>
                  {fmt(totalSpend)}
                </span>
              </div>
            )}

            {error && (
              <p style={{ color: '#dc2626', fontSize: 13, textAlign: 'center', marginBottom: 12 }}>{error}</p>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              style={{
                width: '100%', padding: '17px', borderRadius: 14,
                backgroundColor: loading ? '#94a3b8' : '#C9972E',
                color: '#fff', border: 'none', fontSize: 16, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: 0.2,
              }}
            >
              {loading ? 'Analyzing 93 cards...' : 'Find My Best Card'}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 10 }}>
              No login &nbsp;&bull;&nbsp; No data stored &nbsp;&bull;&nbsp; 100% unbiased
            </p>
          </>
        )}

        {step === 'result' && result && (
          <>
            {/* Insight */}
            <div style={{
              backgroundColor: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 14, padding: '16px 20px', marginBottom: 20,
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, backgroundColor: '#fcd34d',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: 16,
              }}>*</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>AI Insight</div>
                <div style={{ fontSize: 14, color: '#78350f', lineHeight: 1.6 }}>{result.insight}</div>
              </div>
            </div>

            {/* Top pick reason */}
            <div style={{ backgroundColor: '#1B3A5C', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
                Why this is your best card
              </div>
              <div style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.7 }}>{result.topPickReason}</div>
            </div>

            {/* Cards */}
            {result.cards.map((card, i) => (
              <div key={i} style={{
                backgroundColor: '#ffffff', borderRadius: 18, overflow: 'hidden',
                border: i === 0 ? '2px solid #C9972E' : '1px solid #e2e8f0',
                marginBottom: 16,
                boxShadow: i === 0 ? '0 4px 20px rgba(201,151,46,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                {/* Card header */}
                <div style={{
                  backgroundColor: i === 0 ? '#1B3A5C' : '#f8fafc',
                  padding: '12px 22px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6,
                      backgroundColor: ['#C9972E', '#94a3b8', '#cd7c54'][i],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: '#fff',
                    }}>{i + 1}</div>
                    <span style={{
                      fontSize: 12, fontWeight: 700, color: ['#C9972E', '#64748b', '#cd7c54'][i],
                      textTransform: 'uppercase', letterSpacing: 0.8,
                    }}>
                      {['Best pick', '2nd choice', '3rd choice'][i]}
                    </span>
                  </div>
                  <span style={{ fontSize: 13, color: i === 0 ? '#94a3b8' : '#cbd5e1', fontWeight: 500 }}>{card.bank}</span>
                </div>

                <div style={{ padding: '22px 24px' }}>
                  {/* Name + monthly */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 5 }}>{card.name}</div>
                      <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, maxWidth: 320 }}>{card.bestFor}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontSize: 26, fontWeight: 800, color: '#16a34a', letterSpacing: '-0.5px' }}>
                        {fmt(card.monthlyEarnings)}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>per month</div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                    backgroundColor: '#f8fafc', borderRadius: 12,
                    padding: '14px 0', marginBottom: 18,
                  }}>
                    {[
                      { label: 'Annual earnings', value: fmt(card.annualEarnings), color: '#16a34a' },
                      { label: 'Annual fee', value: fmt(card.annualFee), color: '#dc2626' },
                      { label: 'Net value', value: fmt(card.netAnnualValue), color: '#1B3A5C' },
                    ].map((s, j) => (
                      <div key={j} style={{
                        textAlign: 'center',
                        borderLeft: j > 0 ? '1px solid #e2e8f0' : 'none',
                        padding: '0 8px',
                      }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Highlights */}
                  <div style={{ marginBottom: 18 }}>
                    {card.highlights.map((h, j) => (
                      <div key={j} style={{ display: 'flex', gap: 10, marginBottom: 7, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 5,
                          backgroundColor: '#dcfce7', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, color: '#16a34a', fontWeight: 800, marginTop: 1,
                        }}>+</div>
                        <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{h}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <a
                    href={`/api/apply/${card.name.toLowerCase().replace(/\s+/g, '-')}`}
                    style={{
                      display: 'block', textAlign: 'center', padding: '13px',
                      backgroundColor: i === 0 ? '#C9972E' : '#1B3A5C',
                      color: '#ffffff', borderRadius: 12, fontSize: 14,
                      fontWeight: 700, textDecoration: 'none', letterSpacing: 0.2,
                    }}
                  >
                    Apply &amp; Earn &mdash; {i === 0 ? 'Top pick' : `Option ${i + 1}`}
                  </a>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button
                onClick={() => { setStep('input'); setResult(null); }}
                style={{
                  flex: 1, padding: '13px', backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14,
                  fontWeight: 600, color: '#64748b', cursor: 'pointer',
                }}
              >
                Adjust spends
              </button>
              <a href="/compare" style={{
                flex: 1, padding: '13px', backgroundColor: '#1B3A5C',
                borderRadius: 12, fontSize: 14, fontWeight: 600,
                color: '#ffffff', textAlign: 'center', textDecoration: 'none',
              }}>
                Compare cards
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

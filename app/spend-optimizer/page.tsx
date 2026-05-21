'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';

const CATEGORIES = [
  { id: 'dining', label: 'Dining & Restaurants', icon: 'ðŸ½ï¸', placeholder: '5000' },
  { id: 'travel', label: 'Travel & Hotels', icon: 'âœˆï¸', placeholder: '10000' },
  { id: 'fuel', label: 'Fuel', icon: 'â›½', placeholder: '4000' },
  { id: 'shopping', label: 'Online Shopping', icon: 'ðŸ›ï¸', placeholder: '8000' },
  { id: 'grocery', label: 'Grocery & Supermarket', icon: 'ðŸ›’', placeholder: '6000' },
  { id: 'ott', label: 'OTT & Subscriptions', icon: 'ðŸ“º', placeholder: '1500' },
  { id: 'utilities', label: 'Utilities & Bills', icon: 'ðŸ’¡', placeholder: '3000' },
  { id: 'international', label: 'International Spends', icon: 'ðŸŒ', placeholder: '0' },
];

interface SpendData {
  [key: string]: string;
}

interface CardResult {
  name: string;
  bank: string;
  monthlyEarnings: number;
  annualEarnings: number;
  annualFee: number;
  netAnnualValue: number;
  highlights: string[];
  bestFor: string;
  applyUrl: string;
  rank: number;
}

interface AIResult {
  cards: CardResult[];
  topPickReason: string;
  totalSpend: number;
  insight: string;
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
    if (!hasSpend) {
      setError('Please enter at least one spend category.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const spendSummary = CATEGORIES
        .filter(c => parseInt(spends[c.id] || '0') > 0)
        .map(c => `${c.label}: â‚¹${parseInt(spends[c.id]).toLocaleString('en-IN')}/month`)
        .join(', ');

      const prompt = `You are CreditIQ's unbiased card recommendation engine for India. A user has the following monthly spends: ${spendSummary}. Total monthly spend: â‚¹${totalSpend.toLocaleString('en-IN')}.

Analyze these spends and recommend the TOP 3 credit cards from Indian banks (HDFC, Axis, SBI, ICICI, Amex, IDFC First, Kotak, Yes Bank, AU, RBL, IndusInd) that will maximize their rewards.

For each card provide realistic estimates based on actual card reward rates.

Respond ONLY with valid JSON in this exact format, no markdown, no explanation outside JSON:
{
  "cards": [
    {
      "name": "Card Name",
      "bank": "Bank Name",
      "monthlyEarnings": 2340,
      "annualEarnings": 28080,
      "annualFee": 2500,
      "netAnnualValue": 25580,
      "highlights": ["5X points on dining", "2X on travel", "Free airport lounge"],
      "bestFor": "One line on why this card wins for this user's spend pattern",
      "applyUrl": "https://creditiq.app/cards",
      "rank": 1
    }
  ],
  "topPickReason": "2-3 sentence explanation of why card #1 is the best pick for this specific spend pattern",
  "totalSpend": ${totalSpend},
  "insight": "One surprising insight about their spend pattern or card opportunity they might not know"
}`;

      const response = await fetch('/api/spend-optimizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, spends, totalSpend }),
      });

      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();
      setResult(data);
      setStep('result');
    } catch (err) {
      setError('Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const rankColors = ['#C9972E', '#94a3b8', '#cd7c54'];
  const rankLabels = ['Best pick', '2nd place', '3rd place'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f8f9fa)' }}>
      <Header />

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 80px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-block',
            background: '#1B3A5C',
            color: '#C9972E',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 1,
            padding: '4px 14px',
            borderRadius: 20,
            marginBottom: 16,
            textTransform: 'uppercase',
          }}>No affiliate bias Â· Pure AI analysis</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1B3A5C', margin: '0 0 12px', lineHeight: 1.2 }}>
            Which card earns you<br />the most money?
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Tell us how you spend. Our AI analyzes 93 cards and shows you<br />
            exactly how much each card earns â€” no bank bias, no hidden agenda.
          </p>
        </div>

        {step === 'input' && (
          <>
            {/* Spend inputs */}
            <div style={{
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              marginBottom: 24,
            }}>
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1B3A5C', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Your monthly spends
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Enter approximate amounts Â· Leave 0 if not applicable</div>
              </div>

              {CATEGORIES.map((cat, i) => (
                <div key={cat.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 24px',
                  borderBottom: i < CATEGORIES.length - 1 ? '1px solid #f8fafc' : 'none',
                  transition: 'background 0.15s',
                }}>
                  <span style={{ fontSize: 22, minWidth: 28 }}>{cat.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>{cat.label}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14, color: '#94a3b8' }}>â‚¹</span>
                    <input
                      type="number"
                      placeholder={cat.placeholder}
                      value={spends[cat.id] || ''}
                      onChange={e => setSpends(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      style={{
                        width: 100,
                        padding: '7px 10px',
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 14,
                        textAlign: 'right',
                        color: '#1e293b',
                        background: '#f8fafc',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            {totalSpend > 0 && (
              <div style={{
                background: '#1B3A5C',
                borderRadius: 12,
                padding: '16px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}>
                <span style={{ color: '#94a3b8', fontSize: 14 }}>Total monthly spend</span>
                <span style={{ color: '#C9972E', fontSize: 22, fontWeight: 700 }}>
                  â‚¹{totalSpend.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {error && (
              <div style={{ color: '#dc2626', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>{error}</div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? '#94a3b8' : '#1B3A5C',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                letterSpacing: 0.3,
              }}
            >
              {loading ? (
                <span>Analyzing 93 cards â€” this takes ~10 seconds âš¡</span>
              ) : (
                <span>Find My Perfect Card â†’</span>
              )}
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 12 }}>
              No login required Â· No data stored Â· 100% unbiased
            </p>
          </>
        )}

        {step === 'result' && result && (
          <>
            {/* Insight banner */}
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fcd34d',
              borderRadius: 12,
              padding: '14px 20px',
              marginBottom: 24,
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 20 }}>ðŸ’¡</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 2 }}>AI insight</div>
                <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.5 }}>{result.insight}</div>
              </div>
            </div>

            {/* Top pick explanation */}
            <div style={{
              background: '#1B3A5C',
              borderRadius: 12,
              padding: '20px 24px',
              marginBottom: 24,
            }}>
              <div style={{ fontSize: 11, color: '#C9972E', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                Why this is your best card
              </div>
              <div style={{ fontSize: 15, color: '#e2e8f0', lineHeight: 1.6 }}>{result.topPickReason}</div>
            </div>

            {/* Card results */}
            {result.cards.map((card, i) => (
              <div key={i} style={{
                background: '#fff',
                borderRadius: 16,
                border: i === 0 ? '2px solid #C9972E' : '1px solid #e2e8f0',
                marginBottom: 16,
                overflow: 'hidden',
              }}>
                {/* Rank header */}
                <div style={{
                  background: i === 0 ? '#1B3A5C' : '#f8fafc',
                  padding: '10px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: rankColors[i],
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>{rankLabels[i]}</span>
                  <span style={{
                    fontSize: 12,
                    color: i === 0 ? '#94a3b8' : '#cbd5e1',
                    fontWeight: 500,
                  }}>{card.bank}</span>
                </div>

                <div style={{ padding: '20px 24px' }}>
                  {/* Card name + earnings */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{card.name}</div>
                      <div style={{ fontSize: 13, color: '#64748b' }}>{card.bestFor}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a' }}>
                        â‚¹{card.monthlyEarnings.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>per month</div>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: 12,
                    marginBottom: 16,
                    background: '#f8fafc',
                    borderRadius: 10,
                    padding: '14px 16px',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>â‚¹{card.annualEarnings.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Annual earnings</div>
                    </div>
                    <div style={{ textAlign: 'center', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626' }}>â‚¹{card.annualFee.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Annual fee</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#1B3A5C' }}>â‚¹{card.netAnnualValue.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>Net value</div>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div style={{ marginBottom: 16 }}>
                    {card.highlights.map((h, j) => (
                      <div key={j} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 13,
                        color: '#374151',
                        marginBottom: 6,
                      }}>
                        <span style={{ color: '#16a34a', fontWeight: 700, fontSize: 16 }}>âœ“</span>
                        {h}
                      </div>
                    ))}
                  </div>

                  {/* Apply button */}
                  <a
                    href={`/api/apply/${card.name.toLowerCase().replace(/\s+/g, '-')}`}
                    style={{
                      display: 'block',
                      background: i === 0 ? '#C9972E' : '#1B3A5C',
                      color: '#fff',
                      textAlign: 'center',
                      padding: '12px',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    Apply & Earn â€” {i === 0 ? 'Best match' : `Option ${i + 1}`} â†’
                  </a>
                </div>
              </div>
            ))}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={() => { setStep('input'); setResult(null); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#64748b',
                  cursor: 'pointer',
                }}
              >
                â† Adjust my spends
              </button>
              <a
                href="/compare"
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#1B3A5C',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'center',
                  textDecoration: 'none',
                }}
              >
                Compare these cards â†’
              </a>
            </div>
          </>
        )}
      </main>
    </div>
  );
}


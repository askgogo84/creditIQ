'use client';

import { useState, type CSSProperties } from 'react';
import { authedFetch } from '@/lib/authed-fetch';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { useScrollToResults } from '@/lib/hooks/useScrollToResults';

const CARD_COUNT = SEED_CARDS.length;

// Keep the visible v3 category rail identical to the approved mock. The engine can
// still reason across the full card catalogue; these are the six purchase entry points.
const CATEGORIES = [
  { id: 'shopping', label: 'Online shopping', promptLabel: 'Online Shopping', icon: 'a' },
  { id: 'travel', label: 'Travel', promptLabel: 'Travel & Hotels', icon: '✈' },
  { id: 'dining', label: 'Dining', promptLabel: 'Dining & Restaurants', icon: 'D' },
  { id: 'utilities', label: 'Bills', promptLabel: 'Utilities & Bills', icon: '₹' },
  { id: 'fuel', label: 'Fuel', promptLabel: 'Fuel', icon: 'F' },
  { id: 'international', label: 'International', promptLabel: 'International Spends', icon: '◎' },
] as const;

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
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

const RANK_LABELS = ['Best', 'Runner up', 'Third'];

export default function SpendOptimizerPage() {
  const [spends, setSpends] = useState<SpendData>({});
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['id']>('shopping');
  const [merchant, setMerchant] = useState('Amazon India');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState('');
  const { ref: resultsRef, scrollToResults } = useScrollToResults();

  const totalSpend = Object.values(spends).reduce((sum, value) => sum + (parseInt(value) || 0), 0);
  const activeCategory = CATEGORIES.find(item => item.id === category) || CATEGORIES[0];

  const handleAnalyze = async () => {
    if (totalSpend <= 0) {
      setError('Please enter a purchase amount.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const spendSummary = `${activeCategory.promptLabel}: Rs.${totalSpend.toLocaleString('en-IN')}/month`;
      const prompt = `You are CreditIQ's unbiased card recommendation engine for India. Merchant: ${merchant || 'not specified'}. User spend: ${spendSummary}. Total: Rs.${totalSpend}.

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
      if (data?.cards?.length > 0) scrollToResults();
    } catch (e: unknown) {
      setError('Analysis failed. Please try again. ' + (e instanceof Error ? e.message : ''));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError('');
  };

  return (
    <main className="ciq-approved-spend">
      <header className="approved-page-header">
        <div>
          <span className="approved-eyebrow">Merchant-level intelligence</span>
          <h1>Spend Smart</h1>
          <p>Know the best card, route and expected reward before you pay.</p>
        </div>
      </header>

      <div className="approved-spend-tool">
        {/* The approved v3 mock keeps this search surface visible before AND after
            a result. Do not conditionally remove it when analysis completes. */}
        <section className="approved-smart-search surface">
          <div className="approved-category-strip" aria-label="Purchase categories">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={category === cat.id ? 'active' : undefined}
                onClick={() => {
                  setCategory(cat.id);
                  setSpends({ [cat.id]: spends[cat.id] || '' });
                  setResult(null);
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="approved-merchant-form">
            <label>
              <span>Merchant</span>
              <div>
                <i className={category === 'shopping' ? 'merchant-logo amazon' : undefined}>{activeCategory.icon}</i>
                <input value={merchant} onChange={event => setMerchant(event.target.value)} placeholder="e.g. Amazon India" />
              </div>
            </label>
            <label>
              <span>Purchase amount</span>
              <div className="approved-amount-input">
                <b>₹</b>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={spends[category] || ''}
                  onChange={event => {
                    setSpends({ [category]: event.target.value });
                    setResult(null);
                  }}
                  placeholder="20,000"
                />
              </div>
            </label>
            <button type="button" className="approved-primary" onClick={handleAnalyze} disabled={loading || totalSpend === 0}>
              {loading ? <><i className="approved-spinner" /> Analysing {CARD_COUNT} cards…</> : <>✦ Find my best card</>}
            </button>
          </div>
          {error && <div className="approved-spend-error">{error}</div>}
        </section>

        {result && (
          <div ref={resultsRef} className="approved-spend-results">
            {result.cards[0] && (
              <div className="smart-result">
                <article className="winner-card surface">
                  <div className="winner-glow" />
                  <div className="winner-top">
                    <span className="winner-badge">✦ Best way to pay</span>
                    <span className="confidence">AI estimate · verify issuer terms</span>
                  </div>
                  <div className="winner-main">
                    <div className="winner-card-art infinia">
                      <span>{result.cards[0].bank}</span>
                      <b>{result.cards[0].name}</b>
                      <small>TOP MATCH</small>
                    </div>
                    <div>
                      <span className="overline">Best match for {merchant || 'this purchase'}</span>
                      <h2>Use {result.cards[0].name}</h2>
                      <p>{result.topPickReason || result.cards[0].bestFor}</p>
                    </div>
                    <div className="winner-value">
                      <small>Expected value</small>
                      <strong>{fmt(result.cards[0].monthlyEarnings)}</strong>
                      <span>{totalSpend > 0 ? `${((result.cards[0].monthlyEarnings / totalSpend) * 100).toFixed(1)}% effective return` : 'estimated'}</span>
                    </div>
                  </div>
                  <div className="winner-steps">
                    <div><b>1</b><span>Review the route</span></div><i />
                    <div><b>2</b><span>Confirm issuer terms</span></div><i />
                    <div><b>3</b><span>Pay with this card</span></div>
                    <button type="button" className="button primary">Show exact steps →</button>
                  </div>
                </article>

                <aside className="surface value-meter">
                  <div className="section-kicker">Value comparison</div>
                  <div className="meter-ring">
                    <div className="ring" style={{ '--value': 88 } as CSSProperties}>
                      <span><b>#1</b><small>wallet match</small></span>
                    </div>
                  </div>
                  <div className="meter-row best"><span>Best route</span><b>{fmt(result.cards[0].monthlyEarnings)}</b></div>
                  <div className="meter-row"><span>Annual earn</span><b>{fmt(result.cards[0].annualEarnings)}</b></div>
                  <div className="meter-row"><span>Annual fee</span><b>{result.cards[0].annualFee === 0 ? 'Free' : fmt(result.cards[0].annualFee)}</b></div>
                  <div className="meter-save"><small>Net annual value</small><strong>{fmt(result.cards[0].netAnnualValue)}</strong></div>
                </aside>
              </div>
            )}

            {result.insight && <div className="approved-result-insight"><b>CreditIQ insight</b><span>{result.insight}</span></div>}

            <div className="section-head page-section-head">
              <div><span className="section-kicker">All wallet options</span><h2>Why this card wins</h2></div>
              <button type="button" className="text-button" onClick={handleReset}>Reward assumptions ▾</button>
            </div>

            <div className="comparison-table surface">
              <div className="compare-head"><span>Card & route</span><span>Reward earned</span><span>Estimated value</span><span>Effective return</span><span></span></div>
              {result.cards.map((card, index) => {
                const effectiveReturn = totalSpend > 0 ? (card.monthlyEarnings / totalSpend) * 100 : 0;
                return (
                  <div className={`compare-row${index === 0 ? ' highlighted' : ''}`} key={`${card.bank}-${card.name}`}>
                    <span><i className={`card-swatch ${index % 2 === 0 ? 'infinia' : 'magnus'}`} /><span><b>{card.name}</b><small>{index === 0 ? `Best for ${merchant || 'this purchase'}` : card.bestFor}</small></span></span>
                    <b>{fmt(card.monthlyEarnings)}</b>
                    <b>{fmt(card.netAnnualValue)}</b>
                    <strong>{effectiveReturn.toFixed(1)}%</strong>
                    <span className={index === 0 ? 'status good' : 'status neutral'}>{RANK_LABELS[index] || `#${card.rank}`}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

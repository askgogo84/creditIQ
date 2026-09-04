'use client';

import { useState, type CSSProperties } from 'react';
import { authedFetch } from '@/lib/authed-fetch';
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

export default function SpendOptimizerPage() {
  const [spends, setSpends] = useState<SpendData>({});
  const [category, setCategory] = useState('shopping');
  const [merchant, setMerchant] = useState('Amazon India');
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
    <main className="ciq-approved-spend">
      <header className="approved-page-header">
        <div><span className="approved-eyebrow">Merchant-level intelligence</span><h1>Spend Smart</h1><p>Know the best card, route and expected reward before you pay.</p></div>
      </header>

      <div className="approved-spend-tool">

          {step === 'input' && (
            <>
            <section className="approved-smart-search">
              <div className="approved-category-strip" aria-label="Purchase categories">
                {CATEGORIES.map(cat => <button key={cat.id} type="button" className={category === cat.id ? 'active' : undefined} onClick={() => setCategory(cat.id)}>{cat.label.replace(' & Restaurants','').replace(' & Hotels','').replace(' Spends','')}</button>)}
              </div>
              <div className="approved-merchant-form">
                <label><span>Merchant</span><div><i>{CATEGORIES.find(item => item.id === category)?.icon}</i><input value={merchant} onChange={event => setMerchant(event.target.value)} placeholder="e.g. Amazon India" /></div></label>
                <label><span>Purchase amount</span><div className="approved-amount-input"><b>₹</b><input type="number" min="0" step="500" value={spends[category] || ''} onChange={event => setSpends({ [category]: event.target.value })} placeholder="20,000" /></div></label>
                <button type="button" className="approved-primary" onClick={handleAnalyze} disabled={loading || totalSpend === 0}>{loading ? <><i className="approved-spinner" /> Analysing {CARD_COUNT} cards…</> : <>✦ Find my best card</>}</button>
              </div>
              {error && <div className="approved-spend-error">{error}</div>}
            </section>

            <section className="approved-spend-preview" aria-live="polite">
              <div><span className="approved-section-kicker">Before you pay</span><h2>{merchant || 'Your next purchase'}</h2><p>CreditIQ will compare the selected category and amount across {CARD_COUNT} tracked cards.</p></div>
              <div><small>Purchase amount</small><strong>{totalSpend > 0 ? fmt(totalSpend) : 'Add amount'}</strong><span>No sponsored ranking</span></div>
              <div className="approved-preview-steps"><span><b>1</b>Choose category</span><i /><span><b>2</b>Add merchant</span><i /><span><b>3</b>Compare routes</span></div>
            </section>
            </>
          )}

          {step === 'result' && result && (
            <div ref={resultsRef} className="approved-spend-results">
              {result.cards[0] && <div className="smart-result">
                <article className="winner-card surface">
                  <div className="winner-glow" />
                  <div className="winner-top"><span className="winner-badge">✦ Best way to pay</span><span className="confidence">AI estimate · review issuer terms</span></div>
                  <div className="winner-main">
                    <div className="winner-card-art infinia"><span>{result.cards[0].bank}</span><b>{result.cards[0].name}</b><small>TOP MATCH</small></div>
                    <div><span className="overline">Best match for {merchant || 'this purchase'}</span><h2>Use {result.cards[0].name}</h2><p>{result.topPickReason || result.cards[0].bestFor}</p></div>
                    <div className="winner-value"><small>Estimated monthly value</small><strong>{fmt(result.cards[0].monthlyEarnings)}</strong><span>net annual {fmt(result.cards[0].netAnnualValue)}</span></div>
                  </div>
                  <div className="winner-steps"><div><b>1</b><span>Review the route</span></div><i /><div><b>2</b><span>Confirm issuer terms</span></div><i /><div><b>3</b><span>Pay with this card</span></div><button type="button" className="button primary">Show exact steps</button></div>
                </article>
                <aside className="surface value-meter">
                  <div className="section-kicker">Value comparison</div>
                  <div className="meter-ring"><div className="ring" style={{ '--value': 88 } as CSSProperties}><span><b>#1</b><small>wallet match</small></span></div></div>
                  <div className="meter-row best"><span>Monthly earn</span><b>{fmt(result.cards[0].monthlyEarnings)}</b></div>
                  <div className="meter-row"><span>Annual earn</span><b>{fmt(result.cards[0].annualEarnings)}</b></div>
                  <div className="meter-row"><span>Annual fee</span><b>{result.cards[0].annualFee === 0 ? 'Free' : fmt(result.cards[0].annualFee)}</b></div>
                  <div className="meter-save"><small>Net annual value</small><strong>{fmt(result.cards[0].netAnnualValue)}</strong></div>
                </aside>
              </div>}

              {result.insight && <div className="approved-result-insight"><b>CreditIQ insight</b><span>{result.insight}</span></div>}

              <div className="section-head page-section-head"><div><span className="section-kicker">All wallet options</span><h2>Why this card wins</h2></div><button type="button" className="text-button" onClick={handleReset}>Try a different purchase</button></div>
              <div className="comparison-table surface">
                <div className="compare-head"><span>Card</span><span>Monthly earn</span><span>Annual earn</span><span>Net annual value</span><span>Rank</span></div>
                {result.cards.map((card, index) => <div className={`compare-row${index === 0 ? ' highlighted' : ''}`} key={`${card.bank}-${card.name}`}><span><i className={`card-swatch ${index % 2 === 0 ? 'infinia' : 'magnus'}`} /><span><b>{card.name}</b><small>{card.bank}</small></span></span><b>{fmt(card.monthlyEarnings)}</b><b>{fmt(card.annualEarnings)}</b><strong>{fmt(card.netAnnualValue)}</strong><span className={index === 0 ? 'status good' : 'status neutral'}>{RANK_LABELS[index] || `#${card.rank}`}</span></div>)}
              </div>
            </div>
          )}
      </div>
    </main>
  );
}

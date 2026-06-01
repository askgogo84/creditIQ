'use client';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';

const CATEGORIES = [
  { key: 'online', label: 'Online Shopping', icon: '??', default: 10000 },
  { key: 'dining', label: 'Dining & Food', icon: '???', default: 8000 },
  { key: 'travel', label: 'Travel & Hotels', icon: '??', default: 5000 },
  { key: 'fuel', label: 'Fuel', icon: '?', default: 4000 },
  { key: 'groceries', label: 'Groceries', icon: '???', default: 8000 },
  { key: 'utilities', label: 'Bills & Utilities', icon: '??', default: 5000 },
];

export default function RewardsCalculator() {
  const [cards, setCards] = useState<any[]>([]);
  const [banks, setBanks] = useState<string[]>([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [spends, setSpends] = useState<Record<string, number>>(
    Object.fromEntries(CATEGORIES.map(c => [c.key, c.default]))
  );
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cards').then(r => r.json()).then((data: any) => {
      const cardList = Array.isArray(data) ? data : (data.cards || []);
      setCards(cardList);
      const uniqueBanks = [...new Set(cardList.map((c: any) => c.bank))].sort() as string[];
      setBanks(uniqueBanks);
      setCardsLoading(false);
    });
  }, []);

  const filteredCards = selectedBank ? cards.filter(c => c.bank === selectedBank) : cards;
  const totalSpend = Object.values(spends).reduce((a, b) => a + b, 0);

  const calculate = async () => {
    if (!selectedCard) return;
    setLoading(true);
    try {
      const res = await fetch('/api/rewards-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: selectedCard, spends }),
      });
      const data = await res.json();
      setResult(data);
    } finally { setLoading(false); }
  };

  const fmt = (n: number) => 'Rs.' + n.toLocaleString('en-IN');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface,#F8F9FC)' }}>
      <Header />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 16px 80px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--copper,#8C5F12)', letterSpacing: '0.12em', marginBottom: 8 }}>REWARDS CALCULATOR</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--ink,#142950)', margin: '0 0 12px', lineHeight: 1.2 }}>How much are you leaving on the table?</h1>
          <p style={{ fontSize: 16, color: 'var(--ink-2,#2A3F6B)', margin: 0 }}>Enter your card and monthly spend. We'll show you exactly what you're missing.</p>
        </div>

        {/* Card selector */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 2px 12px rgba(20,41,80,0.08)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 16, letterSpacing: '0.08em' }}>YOUR CURRENT CARD</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)', display: 'block', marginBottom: 6 }}>Bank</label>
              <select value={selectedBank} onChange={e => { setSelectedBank(e.target.value); setSelectedCard(''); setResult(null); }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line,rgba(20,41,80,0.12))', fontSize: 14, color: 'var(--ink,#142950)', background: 'white' }}>
                <option value=''>All Banks</option>
                {banks.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)', display: 'block', marginBottom: 6 }}>Card</label>
              <select value={selectedCard} onChange={e => { setSelectedCard(e.target.value); setResult(null); }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line,rgba(20,41,80,0.12))', fontSize: 14, color: 'var(--ink,#142950)', background: 'white' }}>
                <option value=''>Select card</option>
                {filteredCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Spend sliders */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 20, boxShadow: '0 2px 12px rgba(20,41,80,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink,#142950)', letterSpacing: '0.08em' }}>MONTHLY SPEND</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--copper,#8C5F12)' }}>{fmt(totalSpend)}/mo</div>
          </div>
          {CATEGORIES.map(cat => (
            <div key={cat.key} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: 'var(--ink-2,#2A3F6B)' }}>{cat.icon} {cat.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink,#142950)' }}>{fmt(spends[cat.key])}</span>
              </div>
              <input type='range' min={0} max={100000} step={500}
                value={spends[cat.key]}
                onChange={e => setSpends(prev => ({ ...prev, [cat.key]: parseInt(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--navy,#1B3A5C)' }} />
            </div>
          ))}
        </div>

        {/* Calculate button */}
        <button onClick={calculate} disabled={!selectedCard || loading}
          style={{ width: '100%', padding: '16px', borderRadius: 12, background: selectedCard ? 'var(--navy,#1B3A5C)' : '#ccc',
            color: 'white', fontSize: 16, fontWeight: 700, border: 'none', cursor: selectedCard ? 'pointer' : 'not-allowed', marginBottom: 24 }}>
          {loading ? 'Calculating...' : 'Calculate My Rewards ?'}
        </button>

        {/* Results */}
        {result && (
          <div>
            {/* Shock number */}
            {!result.is_best && result.annual_gap > 0 && (
              <div style={{ background: 'var(--navy,#1B3A5C)', borderRadius: 16, padding: 28, marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#A0BADC', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>YOU ARE LEAVING ON THE TABLE EVERY YEAR</div>
                <div style={{ fontSize: 48, fontWeight: 900, color: 'var(--copper,#C9972E)', lineHeight: 1 }}>{fmt(result.annual_gap)}</div>
                <div style={{ fontSize: 14, color: '#A0BADC', marginTop: 8 }}>Just by using the wrong credit card</div>
              </div>
            )}
            {result.is_best && (
              <div style={{ background: '#065F46', borderRadius: 16, padding: 28, marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>?? You have the best card for your spend!</div>
                <div style={{ fontSize: 14, color: '#A7F3D0', marginTop: 8 }}>Earning {fmt(result.current_card.rewards_monthly)}/month in rewards</div>
              </div>
            )}

            {/* Comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(20,41,80,0.08)' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>YOUR CARD</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 4 }}>{result.current_card.name}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--ink-2,#2A3F6B)' }}>{fmt(result.current_card.rewards_monthly)}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)' }}>per month</div>
              </div>
              <div style={{ background: 'var(--navy,#1B3A5C)', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--copper,#C9972E)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>BEST FOR YOU</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 4 }}>{result.best_card.name}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--copper,#C9972E)' }}>{fmt(result.best_card.rewards_monthly)}</div>
                <div style={{ fontSize: 12, color: '#A0BADC' }}>per month</div>
              </div>
            </div>

            {/* AI explanation */}
            {result.ai_explanation && (
              <div style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 16, boxShadow: '0 2px 8px rgba(20,41,80,0.08)', borderLeft: '3px solid var(--copper,#C9972E)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--copper,#8C5F12)', letterSpacing: '0.1em', marginBottom: 8 }}>?? CIRA INTELLIGENCE</div>
                <div style={{ fontSize: 14, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.6 }}>{result.ai_explanation}</div>
              </div>
            )}

            {/* CTA */}
            {!result.is_best && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {result.best_card.apply_url && (
                  <a href={result.best_card.apply_url} target='_blank' rel='noopener noreferrer'
                    style={{ display: 'block', padding: '14px', borderRadius: 10, background: 'var(--copper,#C9972E)', color: 'white', textAlign: 'center', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                    Apply for {result.best_card.name} ?
                  </a>
                )}
                <a href='/trip-planner'
                  style={{ display: 'block', padding: '14px', borderRadius: 10, background: 'var(--navy,#1B3A5C)', color: 'white', textAlign: 'center', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                  Plan a trip with points ?
                </a>
              </div>
            )}
          </div>
        )}
      </div>
      <DesignFooter />
    </div>
  );
}

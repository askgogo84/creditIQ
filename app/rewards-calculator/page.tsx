'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { SavePromptBanner } from '@/components/design/SavePromptBanner';

const CATEGORIES = [
  { key: 'online',    label: 'Online Shopping',  default: 10000 },
  { key: 'dining',    label: 'Dining and Food',   default: 8000  },
  { key: 'travel',    label: 'Travel and Hotels', default: 5000  },
  { key: 'fuel',      label: 'Fuel',              default: 4000  },
  { key: 'groceries', label: 'Groceries',         default: 8000  },
  { key: 'utilities', label: 'Bills and Utilities',default: 5000 },
];

function RewardsCalculatorInner() {
  const searchParams = useSearchParams();
  const [cards, setCards] = useState<any[]>([]);
  const [banks, setBanks] = useState<string[]>([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [spends, setSpends] = useState<Record<string, number>>(
    Object.fromEntries(CATEGORIES.map(c => [c.key, c.default]))
  );
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [autoCalculated, setAutoCalculated] = useState(false);

  useEffect(() => {
    fetch('/api/cards').then(r => r.json()).then((data: any) => {
      const list = Array.isArray(data) ? data : (data.cards || []);
      setCards(list);
      const ub = [...new Set(list.map((c: any) => c.bank))].sort() as string[];
      setBanks(ub);

      // Read URL params from widget
      const paramBank = searchParams.get('bank');
      const paramCardId = searchParams.get('card_id');
      const paramSpend = searchParams.get('spend');

      if (paramBank) setSelectedBank(paramBank);
      if (paramCardId) setSelectedCard(paramCardId);

      if (paramSpend) {
        const total = parseInt(paramSpend);
        setSpends({
          online:    Math.round(total * 0.30),
          dining:    Math.round(total * 0.15),
          travel:    Math.round(total * 0.10),
          fuel:      Math.round(total * 0.10),
          groceries: Math.round(total * 0.20),
          utilities: Math.round(total * 0.15),
        });
      }
    });
  }, []);

  // Auto-calculate once cards + params are loaded
  useEffect(() => {
    if (autoCalculated) return;
    const paramCardId = searchParams.get('card_id');
    if (paramCardId && selectedCard === paramCardId && cards.length > 0) {
      setAutoCalculated(true);
      handleCalculate(paramCardId);
    }
  }, [selectedCard, cards]);

  const filteredCards = selectedBank ? cards.filter(c => c.bank === selectedBank) : cards;
  const totalSpend = Object.values(spends).reduce((a, b) => a + b, 0);

  const handleCalculate = async (overrideCard?: string) => {
    const cardToUse = overrideCard || selectedCard;
    if (!cardToUse) return;
    setLoading(true);
    try {
      const res = await fetch('/api/rewards-calculator', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: cardToUse, spends }),
      });
      setResult(await res.json());
    } finally { setLoading(false); }
  };

  const fmt = (n: number) => 'Rs.' + Math.round(n).toLocaleString('en-IN');

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4F8' }}>
      <Header />
      <div style={{ background: 'linear-gradient(135deg,#1B3A5C 0%,#0D2240 100%)', padding: 'clamp(40px,6vw,72px) 0 clamp(48px,6vw,72px)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 999, background: 'rgba(201,151,46,0.18)', border: '1px solid rgba(201,151,46,0.4)', fontSize: 11, fontWeight: 700, color: '#C9972E', letterSpacing: '0.14em', marginBottom: 18 }}>REWARDS CALCULATOR</div>
          <h1 style={{ fontSize: 'clamp(28px,4.5vw,46px)', fontWeight: 900, color: 'white', margin: '0 0 14px', lineHeight: 1.1, letterSpacing: '-0.03em' }}>How much are you leaving on the table?</h1>
          <p style={{ fontSize: 'clamp(14px,1.6vw,17px)', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>Select your card and monthly spend. We calculate your exact reward gap in seconds.</p>
        </div>
      </div>
      <div style={{ maxWidth: 760, margin: '-36px auto 80px', padding: '0 16px' }}>

        <div style={{ background: 'white', borderRadius: 20, padding: 28, marginBottom: 14, boxShadow: '0 4px 32px rgba(20,41,80,0.10)', border: '1px solid rgba(20,41,80,0.06)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#1B3A5C', letterSpacing: '0.16em', marginBottom: 18 }}>YOUR CURRENT CARD</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: '#5A6A8A', fontWeight: 600, display: 'block', marginBottom: 6 }}>Bank</label>
              <select value={selectedBank} onChange={e => { setSelectedBank(e.target.value); setSelectedCard(''); setResult(null); }}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, color: '#142950', background: 'white' }}>
                <option value=''>All Banks</option>
                {banks.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#5A6A8A', fontWeight: 600, display: 'block', marginBottom: 6 }}>Card</label>
              <select value={selectedCard} onChange={e => { setSelectedCard(e.target.value); setResult(null); }}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 14, color: '#142950', background: 'white' }}>
                <option value=''>Select your card</option>
                {filteredCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 20, padding: 28, marginBottom: 14, boxShadow: '0 4px 32px rgba(20,41,80,0.10)', border: '1px solid rgba(20,41,80,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#1B3A5C', letterSpacing: '0.16em' }}>MONTHLY SPEND</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#C9972E' }}>{fmt(totalSpend)}<span style={{ fontSize: 13, color: '#5A6A8A', fontWeight: 600 }}>/mo</span></div>
          </div>
          {CATEGORIES.map(cat => (
            <div key={cat.key} style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, color: '#2A3F6B', fontWeight: 500 }}>{cat.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#142950' }}>{fmt(spends[cat.key])}</span>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ height: 5, background: '#E8EDF5', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'linear-gradient(90deg,#1B3A5C,#C9972E)', width: (spends[cat.key] / 100000 * 100) + '%', transition: 'width 0.1s', borderRadius: 99 }} />
                </div>
                <input type='range' min={0} max={100000} step={500} value={spends[cat.key]}
                  onChange={e => { setSpends(prev => ({ ...prev, [cat.key]: parseInt(e.target.value) })); setResult(null); }}
                  style={{ position: 'absolute', top: -8, left: 0, width: '100%', opacity: 0, height: 22, cursor: 'pointer' }} />
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => handleCalculate()} disabled={!selectedCard || loading}
          style={{ width: '100%', padding: '18px', borderRadius: 14, background: selectedCard ? 'linear-gradient(135deg,#1B3A5C,#2A5A8C)' : '#CBD5E0', color: 'white', fontSize: 16, fontWeight: 800, border: 'none', cursor: selectedCard ? 'pointer' : 'not-allowed', marginBottom: 20, boxShadow: selectedCard ? '0 8px 24px rgba(27,58,92,0.25)' : 'none', letterSpacing: '-0.01em' }}>
          {loading ? 'Calculating your gap...' : 'Calculate My Rewards'}
        </button>

        {result && (
          <div>
            {!result.is_best && result.annual_gap > 0 && (
              <div style={{ background: 'linear-gradient(135deg,#1B3A5C,#0D2240)', borderRadius: 20, padding: '32px 28px', marginBottom: 14, textAlign: 'center', boxShadow: '0 8px 40px rgba(27,58,92,0.22)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.18em', marginBottom: 10 }}>YOU ARE LEAVING ON THE TABLE EVERY YEAR</div>
                <div style={{ fontSize: 'clamp(44px,9vw,68px)', fontWeight: 900, color: '#C9972E', lineHeight: 1, letterSpacing: '-0.04em' }}>{fmt(result.annual_gap)}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 12 }}>Just by using the wrong credit card</div>
              </div>
            )}
            {result.is_best && (
              <div style={{ background: 'linear-gradient(135deg,#065F46,#047857)', borderRadius: 20, padding: 28, marginBottom: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>You have the best card for your spend</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>Earning {fmt(result.current_card.rewards_monthly)} in rewards every month</div>
              </div>
            )}
            {!result.is_best && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div style={{ background: 'white', borderRadius: 16, padding: 22, boxShadow: '0 2px 16px rgba(20,41,80,0.08)', border: '1.5px solid #E8EDF5' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#5A6A8A', letterSpacing: '0.14em', marginBottom: 10 }}>YOUR CARD</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#142950', marginBottom: 8, lineHeight: 1.3 }}>{result.current_card.name}</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: '#2A3F6B' }}>{fmt(result.current_card.rewards_monthly)}</div>
                  <div style={{ fontSize: 11, color: '#5A6A8A', marginTop: 3 }}>per month</div>
                </div>
                <div style={{ background: 'linear-gradient(145deg,#1B3A5C,#0D2240)', borderRadius: 16, padding: 22, boxShadow: '0 4px 24px rgba(27,58,92,0.18)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(201,151,46,0.12)' }} />
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#C9972E', letterSpacing: '0.14em', marginBottom: 10 }}>BEST FOR YOU</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 8, lineHeight: 1.3 }}>{result.best_card.name}</div>
                  <div style={{ fontSize: 34, fontWeight: 900, color: '#C9972E' }}>{fmt(result.best_card.rewards_monthly)}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>per month</div>
                </div>
              </div>
            )}
            {result.ai_explanation && (
              <div style={{ background: 'white', borderRadius: 16, padding: 22, marginBottom: 14, boxShadow: '0 2px 16px rgba(20,41,80,0.08)', borderLeft: '4px solid #C9972E' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#8C5F12', letterSpacing: '0.14em', marginBottom: 10 }}>CIRA INTELLIGENCE</div>
                <div style={{ fontSize: 14, color: '#2A3F6B', lineHeight: 1.75 }}>{result.ai_explanation}</div>
              </div>
            )}
            {!result.is_best && (
              <div style={{ display: 'grid', gridTemplateColumns: result.best_card.apply_url ? '1fr 1fr' : '1fr', gap: 12 }}>
                {result.best_card.apply_url && (
                  <a href={result.best_card.apply_url} target='_blank' rel='noopener noreferrer'
                    style={{ display: 'block', padding: '16px', borderRadius: 12, background: '#C9972E', color: 'white', textAlign: 'center', fontWeight: 800, fontSize: 14, textDecoration: 'none', boxShadow: '0 4px 16px rgba(201,151,46,0.28)' }}>
                    Apply for {result.best_card.name.split(' ').slice(0, 3).join(' ')} +
                  </a>
                )}
                <a href='/trip-planner'
                  style={{ display: 'block', padding: '16px', borderRadius: 12, background: '#1B3A5C', color: 'white', textAlign: 'center', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
                  Plan a trip with points +
                </a>
              </div>
            )}
            {!result.is_best && <SavePromptBanner feature='calculator' />}
          </div>
        )}
      </div>
      <DesignFooter />
    </div>
  );
}

export default function RewardsCalculator() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F0F4F8' }} />}>
      <RewardsCalculatorInner />
    </Suspense>
  );
}

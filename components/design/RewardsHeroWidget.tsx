'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function BankBadge({ name, bank, imageUrl }: { name: string; bank: string; imageUrl?: string }) {
  const initial = (bank || name || '?')[0].toUpperCase();
  const colors: Record<string, string> = {
    HDFC: '#004C8F', AXIS: '#97144D', ICICI: '#F58220', SBI: '#22409A',
    AMEX: '#016FD0', IDFC: '#9B2335', RBL: '#E31837', YES: '#00518A',
    AU: '#E4A115', BOB: '#F7A800', KOTAK: '#EF1923', INDUSIND: '#1B3A5C',
  };
  const bg = colors[bank?.toUpperCase?.() || ''] || '#1B3A5C';
  if (imageUrl) {
    return (
      <img src={imageUrl} alt={name}
        style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }
  return (
    <div style={{ width: 44, height: 44, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'white', border: '2px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>
      {initial}
    </div>
  );
}

export function RewardsHeroWidget() {
  const [cards, setCards] = useState<any[]>([]);
  const [banks, setBanks] = useState<string[]>([]);
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [selectedCard, setSelectedCard] = useState('');
  const [spend, setSpend] = useState(50000);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/cards').then(r => r.json()).then((data: any) => {
      const list = Array.isArray(data) ? data : (data.cards || []);
      setCards(list);
      const ub = [...new Set(list.map((c: any) => c.bank))].sort() as string[];
      setBanks(ub);
      const first = list.find((c: any) => c.bank === 'HDFC');
      if (first) setSelectedCard(first.id);
    });
  }, []);

  useEffect(() => {
    const first = cards.find(c => c.bank === selectedBank);
    setSelectedCard(first?.id || '');
    setResult(null);
  }, [selectedBank, cards]);

  const filteredCards = cards.filter(c => c.bank === selectedBank);

  const calculate = async () => {
    if (!selectedCard) return;
    setLoading(true);
    const spends = { online: spend * 0.3, dining: spend * 0.15, travel: spend * 0.1, fuel: spend * 0.1, groceries: spend * 0.2, utilities: spend * 0.15 };
    try {
      const res = await fetch('/api/rewards-calculator', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: selectedCard, spends }),
      });
      setResult(await res.json());
    } finally { setLoading(false); }
  };

  const fmt = (n: number) => 'Rs.' + Math.round(n).toLocaleString('en-IN');

  const goToFullCalculator = () => {
    const card = cards.find(c => c.id === selectedCard);
    const params = new URLSearchParams({
      bank: selectedBank,
      card_id: selectedCard,
      card_name: card?.name || '',
      spend: spend.toString(),
    });
    router.push('/rewards-calculator?' + params.toString());
  };

  return (
    <div style={{ background: 'var(--surface,#F8F9FC)', borderTop: '1px solid var(--line,rgba(20,41,80,0.08))', padding: 'clamp(32px,5vw,56px) 0' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 clamp(16px,4vw,40px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8C5F12', letterSpacing: '0.14em', marginBottom: 8 }}>REWARDS CALCULATOR</div>
          <h2 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: '#142950', margin: '0 0 8px', lineHeight: 1.2 }}>Are you leaving money on the table?</h2>
          <p style={{ fontSize: 15, color: '#5A6A8A', margin: 0 }}>Pick your card and monthly spend. See what you are missing in 5 seconds.</p>
        </div>

        <div style={{ background: 'white', borderRadius: 20, padding: 'clamp(20px,4vw,32px)', boxShadow: '0 4px 24px rgba(20,41,80,0.10)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#5A6A8A', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>YOUR BANK</label>
              <select value={selectedBank} onChange={e => setSelectedBank(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(20,41,80,0.15)', fontSize: 14, color: '#142950', background: 'white' }}>
                {banks.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#5A6A8A', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>YOUR CARD</label>
              <select value={selectedCard} onChange={e => { setSelectedCard(e.target.value); setResult(null); }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(20,41,80,0.15)', fontSize: 14, color: '#142950', background: 'white' }}>
                {filteredCards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#5A6A8A', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>MONTHLY SPEND</label>
              <select value={spend} onChange={e => { setSpend(parseInt(e.target.value)); setResult(null); }}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(20,41,80,0.15)', fontSize: 14, color: '#142950', background: 'white' }}>
                {[10000,25000,50000,75000,100000,150000,200000].map(v => <option key={v} value={v}>{fmt(v)}/mo</option>)}
              </select>
            </div>
          </div>

          <button onClick={calculate} disabled={!selectedCard || loading}
            style={{ width: '100%', padding: '14px', borderRadius: 10, background: '#1B3A5C', color: 'white', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', marginBottom: result ? 20 : 0 }}>
            {loading ? 'Calculating...' : 'Show me what I am missing'}
          </button>

          {result && !result.is_best && result.annual_gap > 0 && (
            <div style={{ borderTop: '1px solid rgba(20,41,80,0.08)', paddingTop: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12, marginBottom: 16 }}>

                {/* YOUR CARD */}
                <div style={{ background: '#F8F9FC', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#5A6A8A', fontWeight: 700, marginBottom: 8 }}>YOUR CARD</div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <BankBadge name={result.current_card.name} bank={result.current_card.bank} imageUrl={result.current_card.image_url} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#2A3F6B', marginBottom: 4, lineHeight: 1.2 }}>{result.current_card.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#2A3F6B' }}>{fmt(result.current_card.rewards_monthly)}</div>
                  <div style={{ fontSize: 11, color: '#5A6A8A' }}>per month</div>
                </div>

                <div style={{ fontSize: 16, color: '#5A6A8A', fontWeight: 400, textAlign: 'center' }}>vs</div>

                {/* BEST CARD */}
                <div style={{ background: '#1B3A5C', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#C9972E', fontWeight: 700, marginBottom: 8 }}>BEST FOR YOU</div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                    <BankBadge name={result.best_card.name} bank={result.best_card.bank} imageUrl={result.best_card.image_url} />
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 4, lineHeight: 1.2 }}>{result.best_card.name}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#C9972E' }}>{fmt(result.best_card.rewards_monthly)}</div>
                  <div style={{ fontSize: 11, color: '#A0BADC' }}>per month</div>
                </div>
              </div>

              {/* GAP */}
              <div style={{ background: '#1B3A5C', borderRadius: 12, padding: '16px 20px', textAlign: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#A0BADC', marginBottom: 4 }}>You are leaving on the table every year</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#C9972E' }}>{fmt(result.annual_gap)}</div>
              </div>

              {/* BUTTONS — explicit colors, no CSS vars */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button onClick={goToFullCalculator}
                  style={{ padding: '12px', borderRadius: 8, background: '#C9972E', color: '#FFFFFF', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>
                  See full breakdown
                </button>
                <button onClick={() => router.push('/cards/' + (result.best_card.slug || result.best_card.id))}
                  style={{ padding: '12px', borderRadius: 8, background: '#F8F9FC', color: '#1B3A5C', fontWeight: 700, fontSize: 13, border: '1px solid rgba(20,41,80,0.20)', cursor: 'pointer' }}>
                  View {result.best_card.name.split(' ').slice(0,3).join(' ')} +
                </button>
              </div>
            </div>
          )}

          {result && result.is_best && (
            <div style={{ borderTop: '1px solid rgba(20,41,80,0.08)', paddingTop: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#065F46' }}>Great choice! You have the best card for your spend.</div>
              <div style={{ fontSize: 14, color: '#5A6A8A', marginTop: 8 }}>Earning {fmt(result.current_card.rewards_monthly)}/month in rewards.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

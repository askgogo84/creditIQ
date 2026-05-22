'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { SEED_CARDS } from '@/lib/data/seed-cards';

interface RoastResult {
  grade: string;
  gradeColor: string;
  roast: string;
  monthlyEarnings: number;
  monthlyPotential: number;
  moneyLeft: number;
  improvements: string[];
  betterCard: string;
  betterCardId: string;
  shareText: string;
}

const SPEND_PRESETS = [
  { label: 'Student / Low spender', dining: 3000, shopping: 5000, travel: 2000, fuel: 2000, total: 12000 },
  { label: 'Salaried professional', dining: 8000, shopping: 15000, travel: 10000, fuel: 4000, total: 37000 },
  { label: 'Frequent traveler', dining: 10000, shopping: 10000, travel: 40000, fuel: 5000, total: 65000 },
  { label: 'High spender', dining: 20000, shopping: 30000, travel: 50000, fuel: 8000, total: 108000 },
];

export default function CardRoastPage() {
  const [selectedCardId, setSelectedCardId] = useState('');
  const [monthlySpend, setMonthlySpend] = useState(50000);
  const [spendProfile, setSpendProfile] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RoastResult | null>(null);
  const [copied, setCopied] = useState(false);

  const cards = SEED_CARDS.slice(0, 40).map(c => ({
    id: c.id,
    name: c.name,
    bank: c.bank,
    fee: (c as any).annual_fee_inr ?? 0,
  }));

  const roast = async () => {
    if (!selectedCardId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/card-roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: selectedCardId, monthlySpend, spendProfile }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({
        grade: 'C',
        gradeColor: '#f59e0b',
        roast: 'Your card is doing okay, but you could be earning significantly more with a better match for your spend pattern.',
        monthlyEarnings: Math.round(monthlySpend * 0.01),
        monthlyPotential: Math.round(monthlySpend * 0.025),
        moneyLeft: Math.round(monthlySpend * 0.015),
        improvements: ['Switch to a card with higher base reward rate', 'Look for cards with category multipliers for your top spends'],
        betterCard: 'Axis Magnus or HDFC Regalia Gold',
        betterCardId: 'axis-magnus',
        shareText: `My credit card got a C grade on CreditIQ. I'm leaving Rs.${Math.round(monthlySpend * 0.015).toLocaleString('en-IN')}/month on the table! Check yours at creditiq.app/card-roast`,
      });
    } finally {
      setLoading(false);
    }
  };

  const share = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const gradeColors: Record<string, { bg: string; text: string; border: string }> = {
    'A+': { bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
    'A': { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    'B': { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    'C': { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    'D': { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    'F': { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  };

  const gradeStyle = result ? (gradeColors[result.grade] || gradeColors['C']) : gradeColors['C'];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9' }}>
      <Header />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 16px 80px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>&#128293;</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1B3A5C', margin: '0 0 10px', lineHeight: 1.2 }}>
            Roast my credit card
          </h1>
          <p style={{ fontSize: 15, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
            Get an honest A–F grade on your card. Find out how much money you're leaving on the table every month.
          </p>
        </div>

        {!result ? (
          <div style={{ backgroundColor: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', padding: '28px' }}>

            {/* Card selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                Which card do you want roasted?
              </label>
              <select
                value={selectedCardId}
                onChange={e => setSelectedCardId(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12,
                  border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b',
                  backgroundColor: '#f8fafc', outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="">Select your card...</option>
                {cards.map(c => (
                  <option key={c.id} value={c.id}>{c.name} — {c.bank}</option>
                ))}
              </select>
            </div>

            {/* Spend profile */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 }}>
                Your spend profile
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {SPEND_PRESETS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => { setSpendProfile(p.label); setMonthlySpend(p.total); }}
                    style={{
                      padding: '12px', borderRadius: 10, textAlign: 'left' as const,
                      border: spendProfile === p.label ? '2px solid #1B3A5C' : '1px solid #e2e8f0',
                      backgroundColor: spendProfile === p.label ? '#eff6ff' : '#f8fafc',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1B3A5C', marginBottom: 2 }}>{p.label}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Rs.{p.total.toLocaleString('en-IN')}/mo</div>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: '#94a3b8', whiteSpace: 'nowrap' as const }}>Or enter monthly spend:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>Rs.</span>
                  <input
                    type="number"
                    value={monthlySpend}
                    onChange={e => setMonthlySpend(parseInt(e.target.value) || 0)}
                    style={{
                      flex: 1, padding: '10px 12px', borderRadius: 10,
                      border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b',
                      backgroundColor: '#f8fafc', outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={roast}
              disabled={loading || !selectedCardId}
              style={{
                width: '100%', padding: '16px', borderRadius: 14,
                backgroundColor: loading || !selectedCardId ? '#94a3b8' : '#1B3A5C',
                color: '#fff', border: 'none', fontSize: 16, fontWeight: 700,
                cursor: loading || !selectedCardId ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Roasting your card... &#128293;' : '&#128293; Roast My Card'}
            </button>
          </div>
        ) : (
          <>
            {/* Grade card — shareable */}
            <div style={{
              backgroundColor: gradeStyle.bg, border: `2px solid ${gradeStyle.border}`,
              borderRadius: 20, padding: '32px', textAlign: 'center' as const, marginBottom: 20,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 12 }}>
                CreditIQ Card Grade
              </div>
              <div style={{
                fontSize: 96, fontWeight: 900, color: gradeStyle.text, lineHeight: 1,
                marginBottom: 8, fontFamily: 'serif',
              }}>
                {result.grade}
              </div>
              <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, maxWidth: 400, margin: '0 auto 16px' }}>
                {result.roast}
              </div>

              {/* Money stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 12, padding: '14px' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>
                    Rs.{result.monthlyEarnings.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Currently earning/mo</div>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 12, padding: '14px' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>
                    Rs.{result.moneyLeft.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Left on table/mo</div>
                </div>
              </div>
            </div>

            {/* Improvements */}
            <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '20px 24px', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1B3A5C', marginBottom: 14 }}>What would earn you more</div>
              {result.improvements.map((imp, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6, backgroundColor: '#fef3c7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#d97706', fontWeight: 800, flexShrink: 0, marginTop: 1,
                  }}>!</div>
                  <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{imp}</span>
                </div>
              ))}
            </div>

            {/* Better card CTA */}
            <div style={{ backgroundColor: '#1B3A5C', borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase' as const, letterSpacing: 1.2, marginBottom: 8 }}>
                Better alternative
              </div>
              <div style={{ fontSize: 15, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 16 }}>
                {result.betterCard} would earn you <strong style={{ color: '#C9972E' }}>Rs.{result.monthlyPotential.toLocaleString('en-IN')}/month</strong> — Rs.{result.moneyLeft.toLocaleString('en-IN')} more than your current card.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <a href={`/cards/${result.betterCardId}`} style={{
                  flex: 1, display: 'block', backgroundColor: '#C9972E', color: '#fff',
                  textAlign: 'center' as const, padding: '12px', borderRadius: 10,
                  fontSize: 14, fontWeight: 700, textDecoration: 'none',
                }}>See {result.betterCard}</a>
                <a href="/spend-optimizer" style={{
                  flex: 1, display: 'block', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff',
                  textAlign: 'center' as const, padding: '12px', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, textDecoration: 'none',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}>Full analysis</a>
              </div>
            </div>

            {/* Share */}
            <button onClick={share} style={{
              width: '100%', padding: '14px', backgroundColor: copied ? '#16a34a' : '#fff',
              border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 14,
              fontWeight: 700, color: copied ? '#fff' : '#1B3A5C', cursor: 'pointer',
              marginBottom: 10, transition: 'all 0.2s',
            }}>
              {copied ? '&#10003; Copied to clipboard!' : '&#128257; Share my card grade'}
            </button>

            <button onClick={() => setResult(null)} style={{
              width: '100%', padding: '13px', backgroundColor: 'transparent',
              border: 'none', fontSize: 13, color: '#94a3b8', cursor: 'pointer',
            }}>
              Roast a different card
            </button>
          </>
        )}
      </main>
    </div>
  );
}

'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { getApplyUrl } from '@/lib/affiliate';
import { X, Plus, ChevronRight } from 'lucide-react';

const ALL_CARDS = SEED_CARDS as any[];

interface CompareCard {
  id: string;
  name: string;
  bank: string;
  annual_fee_inr: number;
  base_reward_rate: number;
  forex_markup_percent: number;
  tier: string;
  category: string[];
  lounges: any[];
  fuel_surcharge_waiver: boolean;
  min_income_inr_monthly: number;
}

export default function ComparePage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const router = useRouter();

  const selectedCards = selected.map(id => ALL_CARDS.find(c => c.id === id)).filter(Boolean) as CompareCard[];

  const filtered = ALL_CARDS.filter(c =>
    (c.name.toLowerCase().includes(search.toLowerCase()) ||
     c.bank.toLowerCase().includes(search.toLowerCase())) &&
    !selected.includes(c.id)
  ).slice(0, 20);

  const addCard = (id: string) => {
    if (selected.length < 4 && !selected.includes(id)) {
      setSelected([...selected, id]);
    }
    setSearch('');
  };

  const removeCard = (id: string) => setSelected(selected.filter(s => s !== id));

  const ROWS = [
    { label: 'Annual fee', key: (c: CompareCard) => c.annual_fee_inr === 0 ? 'Lifetime Free' : `Rs.${(c.annual_fee_inr||0).toLocaleString('en-IN')}/yr`, best: (vals: any[]) => Math.min(...vals.map((v,i) => selectedCards[i]?.annual_fee_inr??999999)) },
    { label: 'Base reward rate', key: (c: CompareCard) => `${c.base_reward_rate||1}%`, best: null },
    { label: 'Forex markup', key: (c: CompareCard) => `${c.forex_markup_percent||3.5}%`, best: null },
    { label: 'Lounge access', key: (c: CompareCard) => c.lounges?.length > 0 ? (c.lounges.find((l:any) => l.notes?.includes('Unlimited')) ? 'Unlimited' : `${c.lounges.length} networks`) : 'None', best: null },
    { label: 'Fuel surcharge waiver', key: (c: CompareCard) => c.fuel_surcharge_waiver ? '✓ Yes' : '✗ No', best: null },
    { label: 'Min income (monthly)', key: (c: CompareCard) => c.min_income_inr_monthly ? `Rs.${Math.round(c.min_income_inr_monthly/1000)}K` : 'Not specified', best: null },
    { label: 'Card tier', key: (c: CompareCard) => c.tier || 'Standard', best: null },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f8f9fc)' }}>
      <Header />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px 80px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--copper, #C9972E)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>
            Compare
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, margin: '0 0 8px', letterSpacing: -0.5 }}>
            Pick cards to <span style={{ color: 'var(--copper, #C9972E)' }}>compare.</span>
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-muted, #64748b)', margin: 0 }}>
            Add up to 4 cards. See fees, rewards, lounge access side by side.
          </p>
        </div>

        {/* Card picker area */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(selected.length + (selected.length < 4 ? 1 : 0), 2)}, 1fr)`,
          gap: 12, marginBottom: 32,
        }}>
          {/* Selected cards */}
          {selectedCards.map(card => {
            const { url, label } = getApplyUrl(card.id);
            const fee = card.annual_fee_inr ?? 0;
            return (
              <div key={card.id} style={{
                background: 'var(--bg-card, #fff)',
                border: '2px solid var(--copper, #C9972E)',
                borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(201,151,46,0.1)',
              }}>
                {/* Card visual */}
                <div style={{
                  background: 'linear-gradient(135deg, #1B3A5C 0%, #0d2240 100%)',
                  padding: '20px', position: 'relative',
                }}>
                  <button onClick={() => removeCard(card.id)} style={{
                    position: 'absolute', top: 10, right: 10,
                    width: 24, height: 24, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)', border: 'none',
                    color: '#fff', cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 12,
                  }}><X size={12} /></button>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{card.bank}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 12, lineHeight: 1.2 }}>{card.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ width: 32, height: 24, background: 'linear-gradient(135deg, #E8B84B, #C9972E)', borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: 2 }}>VISA</div>
                  </div>
                </div>
                {/* Card info */}
                <div style={{ padding: '16px' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: fee === 0 ? '#16a34a' : 'var(--text, #0f172a)', marginBottom: 2 }}>
                    {fee === 0 ? 'FREE' : `Rs.${fee.toLocaleString('en-IN')}`}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)', marginBottom: 14 }}>annual fee</div>
                  <a href={url} target="_blank" rel="noopener noreferrer" style={{
                    display: 'block', textAlign: 'center', padding: '10px',
                    background: 'var(--copper, #C9972E)', color: '#fff',
                    borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none',
                    marginBottom: 8,
                  }}>{label}</a>
                  <Link href={`/cards/${card.id}`} style={{
                    display: 'block', textAlign: 'center', padding: '8px',
                    background: 'transparent', color: 'var(--navy, #1B3A5C)',
                    borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                    border: '1px solid var(--border, #e2e8f0)',
                  }}>Full review</Link>
                </div>
              </div>
            );
          })}

          {/* Add card slot */}
          {selected.length < 4 && (
            <div
              onClick={() => setShowPicker(true)}
              style={{
                background: 'var(--bg-card, #fff)',
                border: '2px dashed var(--border, #e2e8f0)',
                borderRadius: 16, padding: '32px 20px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 12, cursor: 'pointer', minHeight: 200,
                transition: 'border-color 0.2s',
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'var(--bg-surface, #f1f5f9)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Plus size={20} color="var(--navy, #1B3A5C)" />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text, #0f172a)' }}>Add a card</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted, #64748b)', textAlign: 'center' }}>
                {4 - selected.length} slot{4 - selected.length !== 1 ? 's' : ''} remaining
              </div>
            </div>
          )}
        </div>

        {/* Search picker */}
        {showPicker && (
          <div style={{
            background: 'var(--bg-card, #fff)', border: '1px solid var(--border, #e2e8f0)',
            borderRadius: 16, padding: 20, marginBottom: 24,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Search cards to add</div>
              <button onClick={() => setShowPicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #64748b)' }}>
                <X size={16} />
              </button>
            </div>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by card name or bank..."
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: '1.5px solid var(--border, #e2e8f0)', fontSize: 14,
                outline: 'none', marginBottom: 12, boxSizing: 'border-box' as const,
                background: 'var(--bg-surface, #f8fafc)',
              }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
              {filtered.map(card => (
                <button key={card.id} onClick={() => addCard(card.id)} style={{
                  padding: '10px 12px', borderRadius: 10, textAlign: 'left' as const,
                  background: 'var(--bg-surface, #f8fafc)', border: '1px solid var(--border, #e2e8f0)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)', marginBottom: 2 }}>{card.bank}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text, #0f172a)', lineHeight: 1.3 }}>{card.name}</div>
                  <div style={{ fontSize: 12, color: (card.annual_fee_inr ?? 0) === 0 ? '#16a34a' : 'var(--text-muted, #64748b)', marginTop: 4 }}>
                    {(card.annual_fee_inr ?? 0) === 0 ? 'Free' : `Rs.${(card.annual_fee_inr ?? 0).toLocaleString('en-IN')}/yr`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comparison table */}
        {selectedCards.length >= 2 && (
          <div style={{ background: 'var(--bg-card, #fff)', borderRadius: 16, border: '1px solid var(--border, #e2e8f0)', overflow: 'hidden', marginBottom: 24 }}>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${selectedCards.length}, 1fr)`, background: '#1B3A5C' }}>
              <div style={{ padding: '14px 20px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.8 }}>Feature</div>
              {selectedCards.map(card => (
                <div key={card.id} style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: '#C9972E', textAlign: 'center' as const }}>
                  {card.name.split(' ').slice(-2).join(' ')}
                </div>
              ))}
            </div>

            {ROWS.map((row, i) => {
              const values = selectedCards.map(row.key);
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: `180px repeat(${selectedCards.length}, 1fr)`,
                  borderBottom: i < ROWS.length - 1 ? '1px solid var(--border, #f8fafc)' : 'none',
                  background: i % 2 === 0 ? 'var(--bg-card, #fff)' : 'var(--bg-surface, #fafbfc)',
                }}>
                  <div style={{ padding: '14px 20px', fontSize: 13, color: 'var(--text-muted, #64748b)', fontWeight: 500 }}>{row.label}</div>
                  {values.map((val, j) => (
                    <div key={j} style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, textAlign: 'center' as const, color: 'var(--text, #1e293b)' }}>
                      {val}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state - goes to /cards not / */}
        {selected.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--bg-card, #fff)', borderRadius: 20, border: '1px solid var(--border, #e2e8f0)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚖️</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>No cards selected yet</h2>
            <p style={{ fontSize: 15, color: 'var(--text-muted, #64748b)', marginBottom: 24 }}>
              Add cards using the slot above, or browse our catalog to find cards to compare.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <button onClick={() => setShowPicker(true)} style={{
                padding: '12px 24px', background: '#1B3A5C', color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>Add a card to compare</button>
              <Link href="/cards" style={{
                padding: '12px 24px', background: 'transparent', color: '#1B3A5C',
                border: '1.5px solid #1B3A5C', borderRadius: 12, fontSize: 14, fontWeight: 600,
                textDecoration: 'none', display: 'inline-block',
              }}>Browse all 93 cards →</Link>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DesignFooter } from '@/components/design/Footer';
import { Reveal } from '@/components/design/Reveal';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { getApplyUrl } from '@/lib/affiliate';
import { X, Plus } from 'lucide-react';

const ALL_CARDS = SEED_CARDS as any[];

interface CompareCard {
  id: string; name: string; bank: string; annual_fee_inr: number;
  base_reward_rate: number; forex_markup_percent: number; tier: string;
  category: string[]; lounges: any[]; fuel_surcharge_waiver: boolean;
  min_income_inr_monthly: number;
}

export default function ComparePage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const selectedCards = selected.map(id => ALL_CARDS.find(c => c.id === id)).filter(Boolean) as CompareCard[];
  const filtered = ALL_CARDS.filter(c =>
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.bank.toLowerCase().includes(search.toLowerCase())) &&
    !selected.includes(c.id)
  ).slice(0, 20);

  const addCard = (id: string) => { if (selected.length < 4 && !selected.includes(id)) setSelected([...selected, id]); setSearch(''); };
  const removeCard = (id: string) => setSelected(selected.filter(s => s !== id));

  const ROWS = [
    { label: 'Annual fee', key: (c: CompareCard) => c.annual_fee_inr === 0 ? 'Lifetime Free' : `Rs.${(c.annual_fee_inr||0).toLocaleString('en-IN')}/yr` },
    { label: 'Base reward rate', key: (c: CompareCard) => `${c.base_reward_rate||1}%` },
    { label: 'Forex markup', key: (c: CompareCard) => `${c.forex_markup_percent||3.5}%` },
    { label: 'Lounge access', key: (c: CompareCard) => c.lounges?.length > 0 ? (c.lounges.find((l:any) => l.notes?.includes('Unlimited')) ? 'Unlimited' : `${c.lounges.length} networks`) : 'None' },
    { label: 'Fuel surcharge waiver', key: (c: CompareCard) => c.fuel_surcharge_waiver ? 'Yes' : 'No' },
    { label: 'Min income (monthly)', key: (c: CompareCard) => c.min_income_inr_monthly ? `Rs.${Math.round(c.min_income_inr_monthly/1000)}K` : 'Not specified' },
    { label: 'Card tier', key: (c: CompareCard) => c.tier || 'Standard' },
  ];

  return (
    <>
      <div className="page-fade">
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 40 }}>
          <div className="aurora" style={{ top: -80, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.20),transparent 60%)' }} />
          <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
            <Reveal>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', fontWeight: 700, marginBottom: 14 }}>Compare</div>
              <h1 style={{ fontSize: 'clamp(32px,5vw,72px)', fontWeight: 800, color: 'var(--ink,#142950)', lineHeight: 1.0, letterSpacing: '-0.04em', margin: '0 0 12px' }}>
                Pick cards to{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>compare</span>.
              </h1>
              <p style={{ fontSize: 'clamp(14px,1.3vw,17px)', color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.65, margin: 0 }}>
                Add up to 4 cards. See fees, rewards, and lounge access side by side.
              </p>
            </Reveal>
          </div>
        </section>

        <section style={{ paddingBottom: 60 }}>
          <div className="shell">
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.max(selected.length + (selected.length < 4 ? 1 : 0), 2)}, 1fr)`, gap: 12, marginBottom: 24 }} className="grid-2-mobile">
              {selectedCards.map(card => {
                const { url, label } = getApplyUrl(card.id);
                const fee = card.annual_fee_inr ?? 0;
                return (
                  <div key={card.id} style={{ background: 'var(--paper,#FAF5EB)', border: '2px solid var(--copper-3,#D89B2A)', borderRadius: 18, overflow: 'hidden' }}>
                    <div style={{ background: 'var(--ink,#142950)', padding: '18px 16px', position: 'relative' }}>
                      <button onClick={() => removeCard(card.id)} style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={11} />
                      </button>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>{card.bank}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>{card.name}</div>
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: fee === 0 ? '#2d7a56' : 'var(--ink,#142950)', marginBottom: 2 }}>
                        {fee === 0 ? 'FREE' : `Rs.${fee.toLocaleString('en-IN')}`}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, color: 'var(--ink-3,#5A6A8A)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.1em' }}>annual fee</div>
                      <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '10px', background: 'var(--copper-3,#D89B2A)', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none', marginBottom: 8 }}>{label}</a>
                      <Link href={`/cards/${card.id}`} style={{ display: 'block', textAlign: 'center', padding: '8px', background: 'transparent', color: 'var(--ink,#142950)', borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: 'none', border: '1.5px solid var(--line,rgba(20,41,80,0.12))' }}>Full review</Link>
                    </div>
                  </div>
                );
              })}
              {selected.length < 4 && (
                <div onClick={() => setShowPicker(true)} style={{ background: 'var(--paper,#FAF5EB)', border: '2px dashed var(--line,rgba(20,41,80,0.15))', borderRadius: 18, padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer', minHeight: 160 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--surface,#fff)', border: '1.5px solid var(--line,rgba(20,41,80,0.10))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={18} color="var(--ink,#142950)" />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink,#142950)' }}>Add a card</div>
                  <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: 'var(--ink-3,#5A6A8A)', textAlign: 'center' }}>{4 - selected.length} slot{4 - selected.length !== 1 ? 's' : ''} remaining</div>
                </div>
              )}
            </div>

            {showPicker && (
              <div style={{ background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 18, padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink,#142950)' }}>Search cards to add</div>
                  <button onClick={() => setShowPicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3,#5A6A8A)' }}><X size={16} /></button>
                </div>
                <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by card name or bank..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--line,rgba(20,41,80,0.12))', fontSize: 14, outline: 'none', marginBottom: 12, boxSizing: 'border-box' as const, background: 'var(--surface,#fff)', color: 'var(--ink,#142950)' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
                  {filtered.map(card => (
                    <button key={card.id} onClick={() => addCard(card.id)} style={{ padding: '10px 12px', borderRadius: 10, textAlign: 'left' as const, background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', cursor: 'pointer' }}>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, color: 'var(--ink-3,#5A6A8A)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{card.bank}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink,#142950)', lineHeight: 1.3 }}>{card.name}</div>
                      <div style={{ fontSize: 11, color: (card.annual_fee_inr ?? 0) === 0 ? '#2d7a56' : 'var(--ink-3,#5A6A8A)', marginTop: 4, fontWeight: 600 }}>
                        {(card.annual_fee_inr ?? 0) === 0 ? 'Free' : `Rs.${(card.annual_fee_inr ?? 0).toLocaleString('en-IN')}/yr`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedCards.length >= 2 && (
              <div style={{ background: 'var(--paper,#FAF5EB)', borderRadius: 18, border: '1px solid var(--line,rgba(20,41,80,0.08))', overflow: 'hidden', marginBottom: 24 }}>
                <div style={{ display: 'grid', gridTemplateColumns: `180px repeat(${selectedCards.length},1fr)`, background: 'var(--ink,#142950)' }}>
                  <div style={{ padding: '14px 20px', fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Feature</div>
                  {selectedCards.map(card => (
                    <div key={card.id} style={{ padding: '14px 16px', fontFamily: 'var(--font-mono,monospace)', fontSize: 10, fontWeight: 700, color: 'var(--copper-3,#D89B2A)', textAlign: 'center' }}>
                      {card.name.split(' ').slice(-2).join(' ')}
                    </div>
                  ))}
                </div>
                {ROWS.map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: `180px repeat(${selectedCards.length},1fr)`, borderBottom: i < ROWS.length - 1 ? '1px solid var(--line,rgba(20,41,80,0.06))' : 'none', background: i % 2 === 0 ? 'var(--paper,#FAF5EB)' : 'var(--surface,#fff)' }}>
                    <div style={{ padding: '13px 20px', fontSize: 13, color: 'var(--ink-3,#5A6A8A)', fontWeight: 500 }}>{row.label}</div>
                    {selectedCards.map((card, j) => (
                      <div key={j} style={{ padding: '13px 16px', fontSize: 13, fontWeight: 700, textAlign: 'center', color: 'var(--ink,#142950)' }}>{row.key(card)}</div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {selected.length === 0 && (
              <div style={{ textAlign: 'center', padding: '56px 20px', background: 'var(--paper,#FAF5EB)', borderRadius: 20, border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 8 }}>No cards selected yet</h2>
                <p style={{ fontSize: 14, color: 'var(--ink-3,#5A6A8A)', marginBottom: 24 }}>Add cards using the slot above to compare side by side.</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button onClick={() => setShowPicker(true)} style={{ padding: '12px 24px', background: 'var(--ink,#142950)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Add a card to compare</button>
                  <Link href="/cards" style={{ padding: '12px 24px', background: 'transparent', color: 'var(--ink,#142950)', border: '1.5px solid var(--ink,#142950)', borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>Browse all cards</Link>
                </div>
              </div>
            )}

            <div style={{ marginTop: 40 }}>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 14 }}>Popular comparisons</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 10 }}>
                {[
                  { slug: 'hdfc-infinia-vs-axis-magnus-burgundy', label: 'HDFC Infinia vs Axis Magnus' },
                  { slug: 'hdfc-regalia-gold-vs-axis-magnus-burgundy', label: 'HDFC Regalia Gold vs Axis Magnus' },
                  { slug: 'hdfc-infinia-vs-icici-emeralde-private-metal', label: 'HDFC Infinia vs ICICI Emeralde' },
                  { slug: 'sbi-cashback-vs-amazon-pay-icici', label: 'SBI Cashback vs Amazon Pay ICICI' },
                  { slug: 'hdfc-millennia-vs-axis-ace-credit-card', label: 'HDFC Millennia vs Axis ACE' },
                  { slug: 'amazon-pay-icici-vs-flipkart-axis-bank-credit-card', label: 'Amazon Pay ICICI vs Flipkart Axis' },
                ].map(({ slug, label }) => (
                  <Link key={slug} href={`/compare/${slug}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 12, textDecoration: 'none' }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink,#142950)' }}>{label}</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-3,#5A6A8A)' }}>&rarr;</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <DesignFooter />
      </div>
    </>
  );
}

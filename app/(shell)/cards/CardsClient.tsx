'use client';
import { useState } from 'react';
import { CardTile, type TileCard } from '@/components/design/CardTile';
import { type CardVariant } from '@/components/design/CreditCard3D';

const VARIANT_ROTATION: CardVariant[] = ['obsidian', 'navy', 'plum', 'gold', 'iris', 'mint'];
const NETWORK_BY_BANK: Record<string, string> = {
  HDFC: 'VISA', AXIS: 'MASTERCARD', ICICI: 'AMEX',
  SBI: 'VISA', AMEX: 'AMEX', AMERICAN: 'AMEX',
  IDFC: 'VISA', RBL: 'MASTERCARD', YES: 'VISA', AU: 'VISA',
};

function tagline(tier?: string) {
  switch (tier) {
    case 'ultra-premium': return 'Ultra Premium';
    case 'super-premium': return 'Super Premium';
    case 'premium': return 'Premium';
    case 'mid': return 'Mid Tier';
    default: return 'Entry Level';
  }
}

function toTileCard(c: any, idx: number): TileCard {
  const bankKey = (c.bank || '').toUpperCase().split(' ')[0];
  const highlights = Array.isArray(c.highlights) ? c.highlights : [];
  const category = Array.isArray(c.category) ? c.category : [];
  return {
    name: c.name,
    bank: c.bank,
    tier: tagline(c.tier),
    fee: c.annual_fee_inr ?? c.annual_fee ?? 0,
    iqScore: c.iq_score ?? 60,
    tags: category.slice(0, 2).map((t: string) => t.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())),
    tagline: highlights[0] || c.best_for || '',
    variant: VARIANT_ROTATION[idx % VARIANT_ROTATION.length],
    network: (c.network || NETWORK_BY_BANK[bankKey] || 'VISA').toUpperCase() as any,
  };
};

const CATEGORIES = [
  { key: 'all', label: 'All cards' },
  { key: 'travel', label: 'International Travel' },
  { key: 'domestic', label: 'Domestic Travel' },
  { key: 'forex', label: 'Forex 0%' },
  { key: 'lounge', label: 'Lounge Access' },
  { key: 'cashback', label: 'Cashback' },
  { key: 'shopping', label: 'Online Shopping' },
  { key: 'fuel', label: 'Fuel' },
  { key: 'dining', label: 'Dining' },
  { key: 'no-annual-fee', label: 'Lifetime Free' },
  { key: 'business', label: 'Business' },
  { key: 'metal', label: 'Metal' },
];

function matchCategory(card: any, key: string): boolean {
  if (key === 'all') return true;
  const cat = Array.isArray(card.category) ? card.category : [];
  const highlights = Array.isArray(card.highlights) ? card.highlights.join(' ').toLowerCase() : '';
  if (key === 'travel') return cat.includes('travel') || cat.includes('airline') || cat.includes('hotel');
  if (key === 'domestic') return cat.includes('travel') && !cat.includes('international');
  if (key === 'forex') return (card.forex_markup_percent ?? 99) === 0;
  if (key === 'lounge') return cat.includes('lounge') || highlights.includes('lounge');
  if (key === 'no-annual-fee') return (card.annual_fee_inr ?? card.annual_fee ?? 999) === 0;
  return cat.includes(key);
}

interface Props { initialCards: any[] }

export function CardsClient({ initialCards }: Props) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = initialCards.filter(c => {
    const matchesCat = matchCategory(c, activeCategory);
    const q = search.toLowerCase();
    const matchesSearch = !q || c.name?.toLowerCase().includes(q) || c.bank?.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  // Group by bank
  const byBank: Record<string, any[]> = {};
  filtered.forEach(c => {
    const b = c.bank || 'Other';
    if (!byBank[b]) byBank[b] = [];
    byBank[b].push(c);
  });
  const banks = Object.keys(byBank).sort();

  return (
    <div className="shell" style={{ paddingTop: 48, paddingBottom: 80 }}>
      {/* Count bar */}
      <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--ink-2)', fontWeight: 600 }}>
        Showing {filtered.length} of {initialCards.length} cards
      </div>
      {/* Search */}
      <input
        type="text"
        placeholder="Search cards or banks..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', maxWidth: 400, padding: '10px 16px', marginBottom: 24,
          border: '1px solid var(--ink-3)', borderRadius: 8, fontSize: 15,
          background: 'var(--surface)', color: 'var(--ink-1)',
        }}
      />

      {/* Category filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            style={{
              padding: '6px 16px', borderRadius: 20, fontSize: 14, cursor: 'pointer',
              border: activeCategory === cat.key ? '1.5px solid var(--copper)' : '1px solid var(--ink-3)',
              background: activeCategory === cat.key ? 'var(--copper)' : 'transparent',
              color: activeCategory === cat.key ? '#fff' : 'var(--ink-1)',
              fontWeight: activeCategory === cat.key ? 600 : 400,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Cards by bank */}
      {banks.length === 0 ? (
        <p style={{ color: 'var(--ink-2)', textAlign: 'center', padding: 40 }}>No cards found.</p>
      ) : (
        banks.map(bank => (
          <div key={bank} style={{ marginBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 'clamp(20px, 2vw, 26px)', fontWeight: 700, color: 'var(--ink-1)' }}>
                <span style={{ color: 'var(--copper)' }}>{bank}</span> Credit Cards
              </h2>
              <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{byBank[bank].length} CARDS</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {byBank[bank].map((card, idx) => (
                <CardTile key={card.slug} card={toTileCard(card, idx)} href={`/cards/${card.slug}`} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

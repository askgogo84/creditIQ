'use client';
import { useState } from 'react';
import { CardTile, type TileCard } from '@/components/design/CardTile';
import { type CardVariant } from '@/components/design/CreditCard3D';
import { isFieldUnknown } from '@/lib/data/unverified-cards';

// Category tags that assert "this card has no annual fee". Suppressed when the
// card's annual_fee_inr is an unknown placeholder — a "--" fee and a "No Annual
// Fee" pill can't both be true (the pill often rides in on the Supabase row's
// category array, which we can't edit here).
const FEE_FREE_TAGS = new Set(['no-annual-fee', 'zero-fee', 'no-fee', 'lifetime-free', 'free']);

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
  const slug = c.slug || c.id;
  // Drop "no fee" pills when the fee is an unknown placeholder (see FEE_FREE_TAGS).
  const tagSource = isFieldUnknown(slug, 'annual_fee_inr')
    ? category.filter((t: string) => !FEE_FREE_TAGS.has(t))
    : category;
  return {
    slug,
    name: c.name,
    bank: c.bank,
    tier: tagline(c.tier),
    fee: c.annual_fee_inr ?? c.annual_fee ?? 0,
    // The IQ score is NEVER computed — there is no scoring function; every stored
    // value is a seeded default (70/60) or an unverified scrape (0 of 51 cards carry
    // a real score; see lib/scripts/seed-supabase-cards.ts:38). We never present a
    // fabricated number as a computed assessment → null renders "--/100", like the
    // hand-set rating's "--" fallback. Restore a real value only if/when iq_score is
    // actually computed.
    iqScore: null,
    tags: tagSource.slice(0, 2).map((t: string) => t.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())),
    tagline: highlights[0] || c.best_for || '',
    variant: VARIANT_ROTATION[idx % VARIANT_ROTATION.length],
    color: c.color,
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

  return (
    <div style={{ paddingTop: 34, paddingBottom: 80 }}>
      <div className="ciq-workspace-surface" style={{ padding: 18, marginBottom: 34 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <div><div className="ciq-editorial-kicker">Curated catalogue</div><div style={{ marginTop: 5, fontSize: 13, color: 'var(--ink-3)' }}>Showing {filtered.length} of {initialCards.length} cards</div></div>
          <input
            type="search"
            aria-label="Search cards or banks"
            placeholder="Search card or bank"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', maxWidth: 390, minHeight: 44, padding: '10px 16px',
              border: '1px solid var(--line-strong)', borderRadius: 11, fontSize: 14,
              background: 'var(--surface)', color: 'var(--ink)', outline: 'none',
            }}
          />
        </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              border: activeCategory === cat.key ? '1px solid var(--ink)' : '1px solid var(--line-strong)',
              background: activeCategory === cat.key ? 'var(--ink)' : 'var(--surface)',
              color: activeCategory === cat.key ? '#fff' : 'var(--ink-1)',
              fontWeight: activeCategory === cat.key ? 600 : 400,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--ink-2)', textAlign: 'center', padding: 40 }}>No cards found.</p>
      ) : (
        <div className="ciq-card-explorer-grid">
          {filtered.map((card, idx) => (
            <CardTile key={card.slug || card.id} card={toTileCard(card, idx)} href={`/card/${card.slug || card.id}`} />
          ))}
        </div>
      )}

      <div className="ciq-card-compare-tray">
        <div><strong>Need a faster answer?</strong><span>Let CreditIQ shortlist cards for your real spending.</span></div>
        <a href="/smart-match">Find my card →</a><a href="/compare">Compare cards</a>
      </div>
    </div>
  );
}

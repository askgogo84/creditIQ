'use client';

import { useState, useRef } from 'react';
import { CardTile, type TileCard } from '@/components/design/CardTile';
import { type CardVariant } from '@/components/design/CreditCard3D';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import type { CreditCard } from '@/lib/types';

/* ============================================================
   seed-cards -> TileCard adapter  (shared with homepage)
   ============================================================ */
const VARIANT_ROTATION: CardVariant[] = ['obsidian', 'navy', 'plum', 'gold', 'iris', 'mint'];
const NETWORK_BY_BANK: Record<string, string> = {
  HDFC: 'VISA', AXIS: 'MASTERCARD', ICICI: 'AMEX',
  SBI: 'VISA', AMEX: 'AMEX', AMERICAN: 'AMEX',
  IDFC: 'VISA', RBL: 'MASTERCARD', YES: 'VISA', AU: 'VISA',
};

function tagline(tier?: string) {
  switch (tier) {
    case 'super-premium': return 'Reserve metal';
    case 'premium':       return 'Premium';
    case 'mid':           return 'Mid-tier';
    case 'entry':         return 'Entry';
    case 'starter':       return 'Starter';
    default:              return 'Standard';
  }
}

function toTileCard(c: CreditCard, i: number): TileCard {
  const bank = c.bank.toUpperCase();
  return {
    bank,
    name: c.name.replace(/^HDFC\s+|^AXIS\s+|^ICICI\s+|^SBI\s+|^AMEX\s+/i, '').replace(/ Credit Card$/i, ''),
    tagline: tagline(c.tier),
    tier: c.tier ? c.tier.toUpperCase().replace(/-/g, ' ') : 'CARD',
    network: NETWORK_BY_BANK[bank.split(' ')[0]] || 'VISA',
    variant: VARIANT_ROTATION[i % VARIANT_ROTATION.length],
    tags: (c.category || []).slice(0, 2).map(s => s.replace(/-/g, ' ')),
    fee: c.annual_fee_inr,
    iqScore: Math.round((c.expert_rating ?? 8) * 10),
  };
}

/* ============================================================
   Category filters -- label -> predicate over SEED_CARDS
   ============================================================ */
const CATEGORIES = [
  'International Travel', 'Domestic Travel', 'Forex 0%', 'Lounge Access',
  'Cashback', 'Online Shopping', 'Fuel', 'Dining',
  'First Card', 'Lifetime Free', 'Business', 'Metal',
];

const FILTERS: Record<string, (c: CreditCard) => boolean> = {
  'International Travel': c => c.category.includes('travel') && (c.forex_markup_percent ?? Infinity) <= 1.5,
  'Domestic Travel':      c => c.category.includes('travel'),
  'Forex 0%':             c => c.forex_markup_percent === 0,
  'Lounge Access':        c => (c.lounges?.length ?? 0) > 0,
  'Cashback':             c => c.category.includes('cashback'),
  'Online Shopping':      c => c.category.includes('shopping'),
  'Fuel':                 c => c.fuel_surcharge_waiver === true,
  'Dining':               c => c.category.includes('dining'),
  'First Card':           c => c.tier === 'entry' || (c.min_income_inr_monthly ?? Infinity) <= 25000,
  'Lifetime Free':        c => c.annual_fee_inr === 0,
  'Business':             c => c.tier === 'premium' || c.tier === 'super-premium',
  'Metal':                c => c.name.includes('Metal') || c.name.includes('Titanium'),
};

export function CardsClient() {
  const [activeCategory, setActiveCategory] = useState('all');
  const gridRef = useRef<HTMLDivElement>(null);

  const cards = SEED_CARDS.filter(c => c.active !== false);
  const banks = [...new Set(cards.map(c => c.bank))].sort();

  const filtered = activeCategory === 'all'
    ? cards
    : cards.filter(FILTERS[activeCategory] ?? (() => true));

  const onChip = (value: string) => {
    setActiveCategory(prev => (prev === value ? 'all' : value));
    requestAnimationFrame(() => {
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const chipStyle = (active: boolean) => ({
    fontSize: 14,
    ...(active
      ? { borderColor: 'var(--copper)', color: 'var(--copper)', background: 'rgba(212,163,115,0.08)' }
      : {}),
  });

  return (
    <>
      {/* ============================================
            CATEGORY PILLS
            ============================================ */}
      <section className="section" style={{ paddingTop: 'clamp(40px, 6vw, 64px)', paddingBottom: 0 }}>
        <div className="shell">
          <div className="label" style={{ marginBottom: 18 }}>BROWSE BY CATEGORY</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            <button
              type="button"
              onClick={() => onChip('all')}
              className="chip"
              style={chipStyle(activeCategory === 'all')}
            >
              All cards
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChip(c)}
                className="chip"
                style={chipStyle(activeCategory === c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
            CARDS
            ============================================ */}
      <section className="section">
        <div className="shell" ref={gridRef}>
          {activeCategory === 'all' ? (
            /* Grouped by bank */
            banks.map((bank) => {
              const bankCards = cards.filter(c => c.bank === bank);
              return (
                <div key={bank} style={{ marginBottom: 'clamp(48px, 7vw, 72px)' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                    gap: 24, marginBottom: 'clamp(24px, 3vw, 32px)',
                    paddingBottom: 16, borderBottom: '1px solid var(--line)',
                  }}>
                    <h2 style={{ fontSize: 'clamp(24px, 3vw, 34px)', letterSpacing: '-0.03em' }}>
                      {bank} <span className="serif" style={{ color: 'var(--copper)' }}>Credit Cards</span>
                    </h2>
                    <span className="label" style={{ whiteSpace: 'nowrap' }}>{bankCards.length} cards</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="grid-1-mobile">
                    {bankCards.map((c, i) => (
                      <CardTile key={c.id} card={toTileCard(c, i)} href={`/card/${c.slug}`} />
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            /* Filtered flat grid */
            <>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                gap: 24, marginBottom: 'clamp(24px, 3vw, 32px)',
                paddingBottom: 16, borderBottom: '1px solid var(--line)',
              }}>
                <h2 style={{ fontSize: 'clamp(24px, 3vw, 34px)', letterSpacing: '-0.03em' }}>
                  Showing {filtered.length} <span className="serif" style={{ color: 'var(--copper)' }}>{activeCategory.toLowerCase()}</span> {filtered.length === 1 ? 'card' : 'cards'}
                </h2>
                <button
                  type="button"
                  onClick={() => onChip('all')}
                  className="label"
                  style={{ whiteSpace: 'nowrap', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--copper)' }}
                >
                  CLEAR FILTER ✕
                </button>
              </div>

              {filtered.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }} className="grid-1-mobile">
                  {filtered.map((c, i) => (
                    <CardTile key={c.id} card={toTileCard(c, i)} href={`/card/${c.slug}`} />
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--ink-3)', fontSize: 16 }}>
                  No cards match this category yet. Try another filter.
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}

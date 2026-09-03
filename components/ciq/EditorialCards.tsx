// components/ciq/EditorialCards.tsx
'use client';
import Link from 'next/link';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { CardMockup } from '@/components/cards/CardMockup';
import { CardArt } from '@/components/cards/CardArt';

/**
 * EditorialCards — a hand-picked "Cards to know" strip.
 *
 * HONESTY: this is EDITORIAL curation, never "Trending". There is no honest
 * behavioural trending signal in the system (see docs/dashboard-data-audit.md
 * §4), so we do not pretend to rank by popularity. Card faces are rendered from
 * SEED_CARDS via CSS (card.color) — no external image dependency.
 */

// Curated ids — all valid SEED_CARDS entries (id === slug). Diverse across
// banks and tiers. Missing ids are filtered out defensively.
const EDITORIAL_IDS = [
  'hdfc-infinia',
  'axis-atlas',
  'icici-amazon-pay',
  'sbi-cashback',
  'amex-platinum-travel',
  'hdfc-regalia-gold',
];

export function EditorialCards({ variant = 'gold' }: { variant?: 'light' | 'gold' }) {
  const byId = new Map(SEED_CARDS.map((c) => [c.id, c]));
  const picks = EDITORIAL_IDS.map((id) => byId.get(id)).filter(Boolean) as typeof SEED_CARDS;
  if (picks.length === 0) return null;

  return (
    <section className={variant === 'light' ? 'wallet-editorial' : undefined} aria-labelledby="editorial-heading" style={{ marginTop: 28, paddingTop: 22, borderTop: `1px solid ${variant === 'light' ? 'var(--line)' : 'var(--ciq-line)'}` }}>
      <div style={{ padding: variant === 'light' ? 0 : '0 20px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <h2 id="editorial-heading" className={variant === 'light' ? 'w-display' : 'ciq-display'} style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-.01em', color: variant === 'light' ? 'var(--ink)' : undefined }}>
          Cards to know
        </h2>
        <span className={variant === 'light' ? 'mono' : 'ciq-mono'} style={{ fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: variant === 'light' ? 'var(--ink-3)' : 'var(--ciq-ink-3)' }}>
          Editorial
        </span>
      </div>
      <p style={{ padding: variant === 'light' ? '5px 0 0' : '5px 20px 0', margin: 0, fontSize: 12, lineHeight: 1.45, color: variant === 'light' ? 'var(--ink-3)' : 'var(--ciq-ink-3)' }}>
        Hand-picked by our team — not ranked by anyone&apos;s spending.
      </p>

      <div
        style={{
          display: variant === 'light' ? 'grid' : 'flex', gap: 14, overflowX: 'auto', padding: variant === 'light' ? '16px 0 6px' : '16px 20px 6px',
          gridTemplateColumns: variant === 'light' ? 'repeat(6, minmax(145px, 1fr))' : undefined,
          scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
        }}
      >
        {picks.map((card) => (
          <Link
            key={card.id}
            href={`/card/${card.slug}`}
            style={{ flex: '0 0 auto', width: variant === 'light' ? 'auto' : 150, minWidth: 145, scrollSnapAlign: 'start', textDecoration: 'none' }}
          >
            <CardArt card={card}>
              <CardMockup card={card} size="sm" interactive={false} />
            </CardArt>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: variant === 'light' ? 'var(--ink)' : 'var(--ciq-ink)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {card.name}
              </div>
              <p
                style={{
                  margin: '4px 0 0', fontSize: 11, lineHeight: 1.4, color: variant === 'light' ? 'var(--ink-2)' : 'var(--ciq-ink-2)',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}
              >
                {card.best_for}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

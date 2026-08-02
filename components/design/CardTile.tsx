'use client';

import Link from 'next/link';
import { Reveal } from './Reveal';
import { CreditCard3D, type CardVariant } from './CreditCard3D';
import { CardArt } from '../cards/CardArt';
import { EstimatedValue, UnverifiedRowBadge } from '../cards/Unverified';
import { RankBadge } from './RankBadge';

export interface TileCard {
  slug: string;
  bank: string;
  name: string;
  tagline?: string;
  tier?: string;
  network: string;
  variant: CardVariant;
  /** Real brand colour (hex) from SEED_CARDS. Passed to CreditCard3D so the
   *  fallback face matches every other surface, instead of the generic
   *  `variant` gradient. */
  color?: string;
  tags?: string[];
  fee: number;
  iqScore: number;
}

interface CardTileProps {
  card: TileCard;
  href: string;
  rank?: number;
}

export function CardTile({ card, href, rank }: CardTileProps) {
  return (
    <Reveal>
      <Link
        href={href}
        className="card-soft"
        style={{
          padding: 24,
          cursor: 'pointer',
          position: 'relative',
          display: 'block',
          textDecoration: 'none',
          color: 'var(--ink)',
        }}
      >
        {rank && (
          <div style={{ position: 'absolute', top: 18, right: 18, zIndex: 5 }}>
            <RankBadge rank={rank} />
          </div>
        )}

        <div style={{ marginBottom: 22, maxWidth: 280 }}>
          <CardArt card={{ slug: card.slug, name: card.name }}>
            <CreditCard3D
              name={card.name.toUpperCase()}
              bank={card.bank}
              tagline={card.tagline || card.tier}
              network={card.network}
              variant={card.variant}
              color={card.color}
              small
              interactive={false}
            />
          </CardArt>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <span className="label">{card.bank}</span>
          {rank != null && <UnverifiedRowBadge slug={card.slug} />}
        </div>
        <h3 style={{ fontSize: 26, marginBottom: 8 }}>{card.name}</h3>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 18, flexWrap: 'wrap' }}>
          {card.tags?.slice(0, 2).map(t => (
            <span
              key={t}
              className="badge"
              style={{ background: 'var(--bg-2)', color: 'var(--ink-2)' }}
            >
              {t}
            </span>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: 18,
            borderTop: '1px solid var(--line)',
          }}
        >
          <div>
            <div className="label" style={{ fontSize: 9 }}>Annual fee</div>
            <div className="mono" style={{ fontSize: 18, marginTop: 4 }}>
              <EstimatedValue slug={card.slug} field="annual_fee_inr" baseColor="var(--ink)">Rs.{card.fee.toLocaleString('en-IN')}</EstimatedValue>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="label" style={{ fontSize: 9 }}>IQ Score</div>
            <div
              style={{
                fontSize: 28,
                marginTop: 2,
                fontWeight: 500,
                color: 'var(--copper)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.02em',
              }}
            >
              {card.iqScore}
              <span style={{ fontSize: 14, color: 'var(--ink-4)' }}>/100</span>
            </div>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

'use client';

import Link from 'next/link';
import { Reveal } from './Reveal';
import { CreditCard3D, type CardVariant } from './CreditCard3D';
import { RankBadge } from './RankBadge';

export interface TileCard {
  bank: string;
  name: string;
  tagline?: string;
  tier?: string;
  network: string;
  variant: CardVariant;
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
          <CreditCard3D
            name={card.name.toUpperCase()}
            bank={card.bank}
            tagline={card.tagline || card.tier}
            network={card.network}
            variant={card.variant}
            small
            interactive={false}
          />
        </div>

        <div className="label" style={{ marginBottom: 6 }}>{card.bank}</div>
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
            <div className="mono" style={{ fontSize: 18, marginTop: 4, color: 'var(--ink)' }}>
              Rs.{card.fee.toLocaleString('en-IN')}
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

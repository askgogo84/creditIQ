'use client';

import { cn } from '@/lib/utils';
import type { CreditCard } from '@/lib/types';

interface CardMockupProps {
  card: CreditCard;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  interactive?: boolean;
}

export function CardMockup({ card, size = 'md', className, interactive = true }: CardMockupProps) {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <div
      className={cn('card-mockup', className)}
      style={{ '--card-color': card.color } as React.CSSProperties}
    >
      <div className="card-mockup-inner metallic" style={{ padding: isSmall ? '10px' : '16px' }}>

        {/* Top row: bank + tier */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{
            fontFamily: 'var(--font-geist), system-ui, sans-serif',
            color: 'rgba(255,255,255,0.9)',
            fontSize: isSmall ? '8px' : '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            {card.bank}
          </div>
          <div style={{
            fontFamily: 'var(--font-geist), system-ui, sans-serif',
            color: 'rgba(255,255,255,0.5)',
            fontSize: isSmall ? '7px' : '9px',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            {card.tier === 'super-premium' ? 'PRIVATE' : card.tier === 'premium' ? 'INFINITE' : card.tier === 'mid' ? 'SIGNATURE' : 'CLASSIC'}
          </div>
        </div>

        {/* Chip */}
        <div style={{
          marginTop: isSmall ? '8px' : '14px',
          width: isSmall ? '24px' : '36px',
          height: isSmall ? '18px' : '26px',
          borderRadius: '3px',
          background: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
          opacity: 0.9,
        }} />

        {/* Card number dots */}
        <div style={{
          marginTop: isSmall ? '6px' : '10px',
          fontFamily: 'monospace',
          color: 'rgba(255,255,255,0.7)',
          fontSize: isSmall ? '7px' : '11px',
          letterSpacing: isSmall ? '0.08em' : '0.15em',
        }}>
          •••• •••• •••• {card.id.slice(-4).toUpperCase()}
        </div>

        {/* Bottom: cardholder + card name */}
        <div style={{
          position: 'absolute',
          bottom: isSmall ? '8px' : '14px',
          left: isSmall ? '10px' : '16px',
          right: isSmall ? '10px' : '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}>
          <div>
            <div style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: isSmall ? '5px' : '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '2px',
            }}>
              {isSmall ? '' : 'CARDHOLDER'}
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: isSmall ? '6px' : '9px',
              fontWeight: 500,
              letterSpacing: '0.05em',
            }}>
              CREDITIQ MEMBER
            </div>
          </div>
          <div style={{
            fontFamily: "'Fraunces', Georgia, serif",
            color: 'rgba(255,255,255,0.95)',
            fontSize: isSmall ? '7px' : '11px',
            fontWeight: 600,
            textAlign: 'right',
            maxWidth: isSmall ? '80px' : '120px',
            lineHeight: 1.2,
            wordBreak: 'break-word',
          }}>
            {card.name.replace(card.bank, '').trim().split(' ').slice(0, 3).join(' ')}
          </div>
        </div>

        {/* Reflective sheen */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.25,
          pointerEvents: 'none',
          background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 70%)',
        }} />

      </div>
    </div>
  );
}

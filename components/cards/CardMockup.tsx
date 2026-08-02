'use client';

import { cn } from '@/lib/utils';
import type { CreditCard } from '@/lib/types';

interface CardMockupProps {
  card: CreditCard;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  interactive?: boolean;
}

// Face text base colour by card-colour luminance. Threshold is the exact
// black/white crossover (L≈0.179): above it black wins, below it white wins, so
// the picked ink at full opacity clears ≥4.58:1 on ANY card colour. (Face text
// was previously hardcoded white and vanished on light cards.)
function faceInk(hex: string): '0,0,0' | '255,255,255' {
  const h = (hex || '').replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (n.length < 6) return '255,255,255';
  const ch = (i: number) => parseInt(n.slice(i, i + 2), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const L = 0.2126 * lin(ch(0)) + 0.7152 * lin(ch(2)) + 0.0722 * lin(ch(4));
  return L > 0.1791 ? '0,0,0' : '255,255,255';
}

export function CardMockup({ card, size = 'md', className, interactive = true }: CardMockupProps) {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';
  // Meaningful face labels (bank, tier, name) must clear AA on any card colour.
  // Plain labels use full-opacity ink; the tier — dimmer by design for hierarchy —
  // sits on a scrim CHIP (opposite-ink fill) so its dimmed text still clears AA
  // without matching the bank's weight. Purely decorative skeuomorphism (fake card
  // number, "CARDHOLDER"/member line) stays low-contrast on purpose.
  const ink = faceInk(card.color);
  const opp = ink === '0,0,0' ? '255,255,255' : '0,0,0';

  return (
    <div
      className={cn('card-mockup', className)}
      style={{ '--card-color': card.color } as React.CSSProperties}
    >
      <div className="card-mockup-inner metallic" style={{ padding: isSmall ? '10px' : '16px' }}>

        {/* Top row: bank + tier */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
          <div style={{
            fontFamily: 'var(--font-geist), system-ui, sans-serif',
            color: `rgb(${ink})`,
            fontSize: isSmall ? '8px' : '11px',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            {card.bank}
          </div>
          {/* tier CHIP — scrim fill keeps the dimmed tier text legible on any colour */}
          <div style={{
            fontFamily: 'var(--font-geist), system-ui, sans-serif',
            color: `rgba(${ink},0.95)`,
            background: `rgba(${opp},0.5)`,
            padding: isSmall ? '1px 4px' : '2px 6px',
            borderRadius: 4,
            fontSize: isSmall ? '7px' : '9px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
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

        {/* Card number dots — decorative skeuomorphism (fake), intentionally faint */}
        <div style={{
          marginTop: isSmall ? '6px' : '10px',
          fontFamily: 'monospace',
          color: `rgba(${ink},0.7)`,
          fontSize: isSmall ? '7px' : '11px',
          letterSpacing: isSmall ? '0.08em' : '0.15em',
        }}>
          .... .... .... {card.id.slice(-4).toUpperCase()}
        </div>

        {/* Bottom: cardholder (decorative) + card name (meaningful) */}
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
              color: `rgba(${ink},0.55)`,
              fontSize: isSmall ? '5px' : '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '2px',
            }}>
              {isSmall ? '' : 'CARDHOLDER'}
            </div>
            <div style={{
              color: `rgba(${ink},0.9)`,
              fontSize: isSmall ? '6px' : '9px',
              fontWeight: 500,
              letterSpacing: '0.05em',
            }}>
              CREDITIQ MEMBER
            </div>
          </div>
          <div style={{
            fontFamily: "'Fraunces', Georgia, serif",
            color: `rgb(${ink})`,
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

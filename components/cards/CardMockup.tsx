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
  const sm = size === 'sm';

  return (
    <div
      className={cn('card-mockup w-full', className)}
      style={{ '--card-color': card.color } as React.CSSProperties}
    >
      <div
        className={cn(
          'card-mockup-inner metallic relative overflow-hidden grain',
          !interactive && 'transform-none hover:transform-none',
          sm ? 'p-2.5' : 'p-4'
        )}
      >
        {/* Bank + tier */}
        <div className="flex justify-between items-start">
          <div className={cn('text-white/90 font-bold uppercase tracking-widest', sm ? 'text-[7px]' : 'text-[10px]')}>
            {card.bank}
          </div>
          <div className={cn('text-white/50 uppercase tracking-widest', sm ? 'text-[6px]' : 'text-[8px]')}>
            {card.tier === 'super-premium' ? 'PRIVATE' : card.tier === 'premium' ? 'INFINITE' : card.tier === 'mid' ? 'SIGNATURE' : 'CLASSIC'}
          </div>
        </div>

        {/* Chip */}
        <div className={cn('rounded bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 opacity-90', sm ? 'mt-2 w-6 h-4' : 'mt-4 w-9 h-6')} />

        {/* Card number */}
        <div className={cn('font-mono text-white/70 tracking-wider', sm ? 'mt-2 text-[7px]' : 'mt-3 text-[10px]')}>
          •••• •••• •••• {card.id.slice(-4).toUpperCase()}
        </div>

        {/* Bottom row */}
        <div className={cn('absolute left-0 right-0 flex justify-between items-end px-2.5', sm ? 'bottom-2' : 'bottom-3 px-4')}>
          <div>
            <div className={cn('text-white/85 font-medium tracking-wide', sm ? 'text-[6px]' : 'text-[9px]')}>
              CARDIQ MEMBER
            </div>
          </div>
          <div className={cn('text-white font-semibold text-right leading-tight', sm ? 'text-[6px] max-w-[60px]' : 'text-[9px] max-w-[90px]')}>
            {card.name.replace(card.bank, '').trim().split(' ').slice(0, 3).join(' ')}
          </div>
        </div>

        {/* Sheen */}
        <div className="absolute inset-0 opacity-25 pointer-events-none"
          style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 55%, transparent 70%)' }}
        />
      </div>
    </div>
  );
}

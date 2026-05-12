'use client';

import { cn } from '@/lib/utils';
import type { CreditCard } from '@/lib/types';

interface CardMockupProps {
  card: CreditCard;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  interactive?: boolean;
}

const sizeClasses = {
  sm: 'w-48',
  md: 'w-80',
  lg: 'w-[28rem]',
};

export function CardMockup({ card, size = 'md', className, interactive = true }: CardMockupProps) {
  return (
    <div
      className={cn(
        'card-mockup',
        sizeClasses[size],
        !interactive && '[&_.card-mockup-inner]:transform-none [&_.card-mockup-inner]:hover:transform-none',
        className
      )}
      style={{ '--card-color': card.color } as React.CSSProperties}
    >
      <div className="card-mockup-inner metallic relative overflow-hidden p-5 grain">
        {/* Bank name */}
        <div className="flex justify-between items-start">
          <div className="font-display text-white/90 text-sm tracking-widest uppercase">
            {card.bank}
          </div>
          <div className="text-xs font-mono text-white/60 tracking-widest">
            {card.tier === 'super-premium' ? 'PRIVATE' : card.tier === 'premium' ? 'INFINITE' : card.tier === 'mid' ? 'SIGNATURE' : 'CLASSIC'}
          </div>
        </div>

        {/* Chip */}
        <div className="mt-6 w-10 h-7 rounded bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 opacity-90">
          <div className="w-full h-full flex flex-col justify-center gap-0.5 p-1">
            <div className="h-px bg-yellow-700/40" />
            <div className="h-px bg-yellow-700/40" />
            <div className="h-px bg-yellow-700/40" />
          </div>
        </div>

        {/* Card number */}
        <div className="mt-4 font-mono text-white/80 text-base tracking-wider tabular">
          •••• •••• •••• {card.id.slice(-4).toUpperCase()}
        </div>

        {/* Card name + holder */}
        <div className="absolute bottom-4 left-5 right-5 flex justify-between items-end">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/50 mb-0.5">Cardholder</div>
            <div className="text-xs font-medium text-white/90 tracking-wide">CARDIQ MEMBER</div>
          </div>
          <div className="text-right max-w-[55%]">
            <div className="font-display text-white text-sm leading-tight">
              {card.name.replace(card.bank, '').trim()}
            </div>
          </div>
        </div>

        {/* Reflective sheen */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background:
              'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.15) 55%, transparent 70%)',
          }}
        />
      </div>
    </div>
  );
}

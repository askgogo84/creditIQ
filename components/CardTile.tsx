'use client';

import Link from 'next/link';
import { CardMockup } from './cards/CardMockup';
import { useCompare } from '@/lib/store';
import { cn, formatINR } from '@/lib/utils';
import type { CreditCard } from '@/lib/types';
import { Plus, Check, Star, AlertTriangle } from 'lucide-react';

interface Props {
  card: CreditCard;
  annualValue?: number;
  reasoning?: string;
  rank?: number;
}

export function CardTile({ card, annualValue, reasoning, rank }: Props) {
  const { add, remove, isIn } = useCompare();
  const inCompare = isIn(card.id);
  const recentDevaluations = (card.devaluations ?? []).filter(
    (d) => new Date(d.date) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  );

  return (
    <article className="group relative bg-ink-900/40 border border-white/5 hover:border-copper-500/30 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-copper-500/5">
      {rank && rank <= 3 && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-copper-500/15 border border-copper-500/40 backdrop-blur-md rounded px-2 py-1">
          <Star className="w-3 h-3 text-copper-400 fill-copper-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-copper-300">
            Rank #{rank}
          </span>
        </div>
      )}

      <Link href={`/card/${card.slug}`} className="block">
        <div className="p-6 flex justify-center bg-gradient-to-b from-white/[0.03] to-transparent">
          <CardMockup card={card} size="md" />
        </div>
      </Link>

      <div className="p-5 pt-2 space-y-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-400 mb-1">
            {card.bank} · {card.tier.replace('-', ' ')}
          </div>
          <Link href={`/card/${card.slug}`}>
            <h3 className="font-display text-lg leading-tight text-ink-50 group-hover:text-copper-300 transition-colors">
              {card.name}
            </h3>
          </Link>
        </div>

        <p className="text-xs text-ink-300 leading-relaxed line-clamp-2 italic font-display">
          {card.best_for}
        </p>

        {/* Key metrics */}
        <div className="grid grid-cols-3 gap-px bg-white/5 rounded overflow-hidden">
          <div className="bg-ink-950 p-2.5">
            <div className="text-[9px] font-mono uppercase tracking-wider text-ink-400">
              Annual fee
            </div>
            <div className="font-display text-sm text-ink-100 tabular">
              {card.annual_fee_inr === 0 ? 'FREE' : formatINR(card.annual_fee_inr)}
            </div>
          </div>
          <div className="bg-ink-950 p-2.5">
            <div className="text-[9px] font-mono uppercase tracking-wider text-ink-400">Base rate</div>
            <div className="font-display text-sm text-copper-300 tabular">
              {card.base_reward_rate}%
            </div>
          </div>
          <div className="bg-ink-950 p-2.5">
            <div className="text-[9px] font-mono uppercase tracking-wider text-ink-400">Rating</div>
            <div className="font-display text-sm text-ink-100 tabular">
              {card.expert_rating?.toFixed(1) ?? '—'}
            </div>
          </div>
        </div>

        {annualValue !== undefined && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded p-2.5">
            <div className="text-[9px] font-mono uppercase tracking-wider text-emerald-400/70">
              Your est. annual value
            </div>
            <div className="font-display text-lg text-emerald-300 tabular glow-emerald">
              ₹{annualValue.toLocaleString('en-IN')}
            </div>
            {reasoning && <div className="text-[10px] text-ink-400 mt-1 line-clamp-1">{reasoning}</div>}
          </div>
        )}

        {recentDevaluations.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-crimson-400/80">
            <AlertTriangle className="w-3 h-3" />
            <span>
              {recentDevaluations.length} recent devaluation{recentDevaluations.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Link
            href={`/card/${card.slug}`}
            className="flex-1 text-center text-xs font-medium tracking-wide text-ink-200 hover:text-copper-300 border border-white/10 hover:border-copper-500/30 rounded py-2 transition-colors"
          >
            View details →
          </Link>
          <button
            onClick={() => (inCompare ? remove(card.id) : add(card.id))}
            className={cn(
              'shrink-0 w-9 h-9 rounded border flex items-center justify-center transition-all',
              inCompare
                ? 'bg-copper-500/15 border-copper-500/40 text-copper-300'
                : 'border-white/10 text-ink-300 hover:border-copper-500/30 hover:text-copper-300'
            )}
            aria-label={inCompare ? 'Remove from compare' : 'Add to compare'}
          >
            {inCompare ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </article>
  );
}

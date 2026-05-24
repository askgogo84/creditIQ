'use client';

import Link from 'next/link';
import { CardMockup } from './cards/CardMockup';
import { useCompare } from '@/lib/store';
import { StarRating } from './StarRating';
import { getApplyUrl } from '@/lib/affiliate';
import type { CreditCard } from '@/lib/types';
import { Plus, Check, Star, AlertTriangle, Zap, Shield, Plane, ShoppingBag, ExternalLink } from 'lucide-react';

interface Props {
  card: CreditCard;
  annualValue?: number;
  reasoning?: string;
  rank?: number;
}

function getKeyFeatures(card: CreditCard) {
  const features = [];
  if (card.annual_fee_inr === 0) {
    features.push({ icon: Shield, text: 'Zero annual fee', highlight: true });
  } else {
    features.push({ icon: Shield, text: `Rs.${card.annual_fee_inr.toLocaleString('en-IN')}/year` });
  }
  if (card.base_reward_rate >= 3) {
    features.push({ icon: Zap, text: `${card.base_reward_rate}% rewards`, highlight: true });
  } else {
    features.push({ icon: Zap, text: `${card.base_reward_rate}% rewards` });
  }
  const cats = card.category || [];
  if (cats.includes('travel')) features.push({ icon: Plane, text: 'Lounge access' });
  else if (cats.includes('cashback')) features.push({ icon: ShoppingBag, text: 'Cashback card' });
  else features.push({ icon: Star, text: `${card.tier} tier` });
  return features.slice(0, 3);
}

export function CardTile({ card, annualValue, reasoning, rank }: Props) {
  const { add, remove, isIn } = useCompare();
  const inCompare = isIn(card.id);
  const recentDevaluations = (card.devaluations ?? []).filter(
    d => new Date(d.date) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  );
  const features = getKeyFeatures(card);
  const apr = (card as any).apr_percent;
  const { url: applyUrl, type: affiliateType, label: applyLabel } = getApplyUrl(card);

  return (
    <article className="group relative flex flex-col bg-ink-900/40 border border-white/5 hover:border-copper-500/30 rounded-xl overflow-hidden transition-all duration-300">

      {rank && rank <= 3 && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-copper-500/15 border border-copper-500/40 rounded px-2 py-1">
          <Star className="w-3 h-3 text-copper-400 fill-copper-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-copper-300">#{rank}</span>
        </div>
      )}

      {recentDevaluations.length > 0 && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-crimson-500/15 border border-crimson-500/30 rounded px-2 py-1">
          <AlertTriangle className="w-3 h-3 text-crimson-400" />
          <span className="text-[10px] font-mono text-crimson-400">Devalued</span>
        </div>
      )}

      <Link href={`/card/${card.slug}`} className="block">
        <div className="px-6 pt-8 pb-4 flex justify-center" style={{ background: `linear-gradient(135deg, ${card.color}20 0%, transparent 100%)` }}>
          <div style={{ width: '75%', maxWidth: 220 }}>
            <CardMockup card={card} size="sm" />
          </div>
        </div>
      </Link>

      <div className="flex flex-col flex-1 p-4 space-y-3">
        <div className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
          {card.bank} . {card.tier.replace('-', ' ')}
        </div>

        <Link href={`/card/${card.slug}`}>
          <h3 className="font-display text-base leading-tight text-ink-50 group-hover:text-copper-300 transition-colors line-clamp-2">
            {card.name}
          </h3>
        </Link>

        <p className="text-xs text-ink-300 leading-relaxed line-clamp-2 italic font-display">
          {card.best_for}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium"
              style={{
                background: f.highlight ? 'color-mix(in srgb, var(--emerald) 12%, transparent)' : 'color-mix(in srgb, var(--text) 6%, transparent)',
                color: f.highlight ? 'var(--emerald)' : 'var(--text-muted)',
                border: f.highlight ? '1px solid color-mix(in srgb, var(--emerald) 25%, transparent)' : '1px solid var(--border)',
              }}>
              <f.icon className="w-3 h-3" />{f.text}
            </div>
          ))}
        </div>

        {apr && (
          <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: 'var(--text-dim)' }}>
            <span>APR if balance carried</span>
            <span style={{ color: '#ef4444' }}>{apr}%</span>
          </div>
        )}

        {annualValue !== undefined && (
          <div className="rounded-lg p-2.5" style={{ background: 'color-mix(in srgb, var(--emerald) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--emerald) 20%, transparent)' }}>
            <div className="text-[9px] font-mono uppercase tracking-wider" style={{ color: 'var(--emerald)' }}>Est. annual value</div>
            <div className="font-display text-lg tabular" style={{ color: 'var(--emerald)' }}>Rs.{annualValue.toLocaleString('en-IN')}</div>
            {reasoning && <div className="text-[10px] text-ink-400 mt-1 line-clamp-1">{reasoning}</div>}
          </div>
        )}

        <StarRating cardId={card.id} initialRating={card.expert_rating ? card.expert_rating / 2 : 0} size="sm" />

        <div className="flex gap-2 pt-1 mt-auto">
          <Link href={`/card/${card.slug}`} className="flex-1 text-center text-xs font-medium py-2.5 rounded transition-colors" style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            View details
          </Link>
          <a
            href={applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-bold py-2.5 rounded transition-all flex items-center justify-center gap-1"
            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
            onClick={() => {
              // Track affiliate click
              if (typeof window !== 'undefined') {
                fetch('/api/track-click', { method: 'POST', body: JSON.stringify({ cardId: card.id, type: affiliateType }), headers: { 'Content-Type': 'application/json' } }).catch(() => {});
              }
            }}
          >
            Apply <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={() => inCompare ? remove(card.id) : add(card.id)}
            className="shrink-0 w-9 h-9 rounded border flex items-center justify-center transition-all"
            style={{ background: inCompare ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'transparent', borderColor: inCompare ? 'color-mix(in srgb, var(--accent) 40%, transparent)' : 'var(--border)', color: inCompare ? 'var(--accent)' : 'var(--text-dim)' }}
          >
            {inCompare ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {/* Affiliate transparency note */}
        {affiliateType === 'paisabazaar' && (
          <div className="text-[9px] text-center" style={{ color: 'var(--text-dim)' }}>
            Via Paisabazaar . We may earn a commission
          </div>
        )}
      </div>
    </article>
  );
}

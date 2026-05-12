'use client';

import { SEED_CARDS } from '@/lib/data/seed-cards';
import { TrendingDown, AlertTriangle } from 'lucide-react';

export function DevaluationTicker() {
  const recentDevaluations = SEED_CARDS.flatMap((card) =>
    (card.devaluations ?? []).map((d) => ({ ...d, cardName: card.name, cardBank: card.bank }))
  )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  if (recentDevaluations.length === 0) return null;

  // Duplicate for seamless loop
  const items = [...recentDevaluations, ...recentDevaluations];

  return (
    <div className="border-y border-white/5 bg-ink-950/50 overflow-hidden">
      <div className="flex items-center">
        <div className="shrink-0 px-4 py-2.5 bg-crimson-500/10 border-r border-crimson-500/20 flex items-center gap-2">
          <TrendingDown className="w-3.5 h-3.5 text-crimson-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-crimson-300">
            Devaluation Watch
          </span>
        </div>
        <div className="ticker-container flex-1">
          <div className="ticker-track py-2.5">
            {items.map((d, i) => (
              <div key={i} className="flex items-center gap-3 px-6 text-xs whitespace-nowrap">
                <span className="font-mono text-ink-500 tabular">
                  {new Date(d.date).toLocaleDateString('en-IN', { month: 'short', day: '2-digit' })}
                </span>
                <span className="text-ink-100 font-medium">{d.cardName}</span>
                <span className="text-ink-300">·</span>
                <span className="text-ink-200">{d.description}</span>
                {d.impact === 'high' && (
                  <span className="text-crimson-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> high
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

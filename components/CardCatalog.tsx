'use client';

import { useState } from 'react';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { CardTile } from './CardTile';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: 'all', label: 'All cards', emoji: '◎' },
  { id: 'cashback', label: 'Cashback', emoji: '₹' },
  { id: 'travel', label: 'Travel', emoji: '✈' },
  { id: 'premium', label: 'Premium', emoji: '◆' },
  { id: 'rewards', label: 'Rewards', emoji: '★' },
  { id: 'shopping', label: 'Shopping', emoji: '⌘' },
  { id: 'zero-fee', label: 'Lifetime free', emoji: '∅' },
  { id: 'entry-level', label: 'Entry-level', emoji: '◊' },
];

export function CardCatalog() {
  const [filter, setFilter] = useState('all');

  const filtered = SEED_CARDS.filter(
    (c) => filter === 'all' || c.category.includes(filter as any)
  ).sort((a, b) => (b.expert_rating ?? 0) - (a.expert_rating ?? 0));

  return (
    <section className="py-24 lg:py-32" id="catalog">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <div className="divider-rule mb-4 max-w-xs">— The catalog</div>
            <h2 className="font-display text-4xl md:text-5xl text-ink-50 leading-[1.05]">
              Every card,{' '}
              <span className="display-italic text-copper-400">deeply scored</span>.
            </h2>
          </div>
          <p className="text-sm text-ink-400 max-w-xs">
            Hand-curated until our scraper takes over. Each card includes redemption paths and
            devaluation history.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-10 sticky top-16 z-30 py-3 -mx-2 px-2 bg-ink-950/80 backdrop-blur-xl border-b border-white/5">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={cn(
                'px-3.5 py-1.5 text-xs rounded-full border transition-all flex items-center gap-1.5',
                filter === c.id
                  ? 'bg-copper-500/15 border-copper-500/40 text-copper-300'
                  : 'border-white/10 text-ink-300 hover:border-white/20 hover:text-ink-100'
              )}
            >
              <span className="text-sm">{c.emoji}</span>
              <span className="tracking-wide">{c.label}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="popLayout">
          <motion.div
            key={filter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
            {filtered.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.03 }}
              >
                <CardTile card={card} rank={i + 1} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-ink-400 font-display italic">
            No cards in this category yet.
          </div>
        )}
      </div>
    </section>
  );
}

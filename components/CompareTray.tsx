'use client';

import { useCompare } from '@/lib/store';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { CardMockup } from './cards/CardMockup';
import Link from 'next/link';
import { X, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function CompareTray() {
  const { cards, remove, clear } = useCompare();
  const selected = cards.map((id) => SEED_CARDS.find((c) => c.id === id)).filter(Boolean);

  return (
    <AnimatePresence>
      {selected.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4"
        >
          <div className="max-w-5xl mx-auto bg-ink-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              <div className="text-xs font-mono tracking-widest text-ink-300 uppercase whitespace-nowrap">
                Comparing <span className="text-copper-400">{selected.length}</span>/4
              </div>
              <div className="flex-1 flex gap-3 overflow-x-auto">
                {selected.map((card) => (
                  <div key={card!.id} className="relative shrink-0 group">
                    <CardMockup card={card!} size="sm" interactive={false} />
                    <button
                      onClick={() => remove(card!.id)}
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-ink-950 border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-crimson-500 hover:text-crimson-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Link
                  href="/compare"
                  className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3"
                >
                  Compare <ArrowRight className="w-3 h-3" />
                </Link>
                <button
                  onClick={clear}
                  className="text-[10px] uppercase tracking-wider text-ink-400 hover:text-crimson-400 transition"
                >
                  Clear all
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

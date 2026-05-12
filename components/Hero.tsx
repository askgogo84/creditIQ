'use client';

import Link from 'next/link';
import { CardMockup } from './cards/CardMockup';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

const featuredCards = ['hdfc-infinia', 'axis-magnus-burgundy', 'hdfc-diners-black']
  .map((id) => SEED_CARDS.find((c) => c.id === id)!)
  .filter(Boolean);

export function Hero() {
  return (
    <section className="relative min-h-[90vh] pt-32 pb-20 overflow-hidden grain">
      {/* Background gradient atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-copper-500/10 blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[600px] h-[600px] rounded-full bg-copper-600/5 blur-[140px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-[1fr,1.1fr] gap-12 lg:gap-16 items-center">
          {/* Left: Editorial copy */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-copper-500/10 border border-copper-500/20">
                <ShieldCheck className="w-3.5 h-3.5 text-copper-400" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-copper-300">
                  Zero affiliate bias
                </span>
              </div>

              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[0.95] text-ink-50">
                The honest{' '}
                <span className="display-italic text-copper-400">credit card</span> intelligence
                India needed.
              </h1>

              <p className="text-lg text-ink-200 leading-relaxed max-w-xl font-display">
                Real annual value. Live devaluation tracking. Points redemption optimization.
                Built by people who refuse to be paid by banks to rank cards.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="flex flex-wrap gap-3"
            >
              <Link href="/smart-match" className="btn-primary inline-flex items-center gap-2 group">
                <Sparkles className="w-4 h-4" />
                Find my perfect card
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/optimize" className="btn-ghost inline-flex items-center gap-2">
                Optimize my points
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="grid grid-cols-3 gap-4 pt-8 border-t border-white/5"
            >
              {[
                { v: '60+', l: 'Cards tracked' },
                { v: '12', l: 'Banks covered' },
                { v: 'Weekly', l: 'Data refresh' },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-display text-3xl text-ink-50 tabular">{s.v}</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-ink-400 mt-1">
                    {s.l}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Stacked card showcase */}
          <div className="className="relative h-[280px] sm:h-[380px] lg:h-[520px] flex items-center justify-center overflow-hidden">
            {featuredCards.map((card, i) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, x: 100, rotate: 0 }}
                animate={{
                  opacity: 1,
                  x: i === 0 ? -60 : i === 1 ? 0 : 60,
                  y: i === 0 ? 40 : i === 1 ? 0 : -40,
                  rotate: i === 0 ? -8 : i === 1 ? 0 : 8,
                }}
                transition={{ duration: 1, delay: 0.2 + i * 0.15 }}
                className="absolute"
                style={{ zIndex: i === 1 ? 3 : 2 - Math.abs(i - 1) }}
              >
                <CardMockup card={card} size="md" />
              </motion.div>
            ))}

            {/* Decorative editorial element */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1 }}
              className="absolute -bottom-4 left-0 right-0 flex justify-center"
            >
              <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-ink-500">
                ↑ Tap to inspect
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

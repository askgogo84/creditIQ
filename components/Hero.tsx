'use client';

import Link from 'next/link';
import { CardMockup } from './cards/CardMockup';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

const totalCards = SEED_CARDS.filter(c => c.active).length;
const totalBanks = new Set(SEED_CARDS.filter(c => c.active).map(c => c.bank)).size;

const featuredCards = ['hdfc-infinia', 'axis-magnus-burgundy', 'hdfc-diners-black']
  .map((id) => SEED_CARDS.find((c) => c.id === id)!)
  .filter(Boolean);

export function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center pt-24 pb-16 grain overflow-hidden">
      {/* Background glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute rounded-full" style={{ width: 600, height: 600, top: '-20%', right: '-10%', background: 'radial-gradient(circle, rgba(212,163,115,0.08) 0%, transparent 70%)' }} />
        <div className="absolute rounded-full" style={{ width: 400, height: 400, bottom: '0%', left: '-10%', background: 'radial-gradient(circle, rgba(212,163,115,0.05) 0%, transparent 70%)' }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6"
              style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)' }}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Zero affiliate bias</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.0] mb-6"
              style={{ color: 'var(--text)' }}
            >
              The honest{' '}
              <em className="text-copper-400 not-italic display-italic">credit card</em>{' '}
              intelligence India needed.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-lg font-display leading-relaxed mb-8 max-w-xl"
              style={{ color: 'var(--text-muted)' }}
            >
              Real annual value. Live devaluation tracking. Points redemption
              optimization. Built by people who refuse to be paid by banks to rank cards.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-col sm:flex-row gap-3 mb-12"
            >
              <Link href="/smart-match" className="btn-primary text-base flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0" />
                Find my perfect card
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
              <Link href="/optimize" className="btn-ghost text-base flex items-center justify-center gap-2">
                Optimize my points
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-8 pt-8 border-t"
              style={{ borderColor: 'var(--border)' }}
            >
              {[
                { v: `${totalCards}+`, l: 'Cards tracked' },
                { v: `${totalBanks}`, l: 'Banks covered' },
                { v: 'Weekly', l: 'Data refresh' },
              ].map((s) => (
                <div key={s.l}>
                  <div className="font-display text-3xl tabular" style={{ color: 'var(--text)' }}>{s.v}</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest mt-1" style={{ color: 'var(--text-dim)' }}>{s.l}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — card showcase */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative hidden lg:flex items-center justify-center"
            style={{ minHeight: 400 }}
          >
            {/* Main card */}
            <div style={{ width: '60%', maxWidth: 280, position: 'relative', zIndex: 2 }}>
              <CardMockup card={featuredCards[1]} size="md" />
            </div>
            {/* Left card */}
            <div style={{ position: 'absolute', left: '0%', top: '10%', width: '45%', opacity: 0.7, transform: 'rotate(-8deg) scale(0.85)', zIndex: 1 }}>
              <CardMockup card={featuredCards[0]} size="sm" />
            </div>
            {/* Right card */}
            <div style={{ position: 'absolute', right: '0%', top: '10%', width: '45%', opacity: 0.7, transform: 'rotate(8deg) scale(0.85)', zIndex: 1 }}>
              <CardMockup card={featuredCards[2]} size="sm" />
            </div>
            {/* Tap hint */}
            <div className="absolute bottom-0 right-1/4 text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
              ↑ Tap to inspect
            </div>
          </motion.div>

          {/* Mobile card — single card centered */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="lg:hidden flex justify-center"
          >
            <div style={{ width: '70%', maxWidth: 260 }}>
              <CardMockup card={featuredCards[1]} size="md" />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

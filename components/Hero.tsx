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
    <section
      className="relative pt-20 pb-10 grain"
      style={{ overflow: 'hidden', width: '100%', maxWidth: '100vw' }}
    >
      {/* Glow bg */}
      <div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ overflow: 'hidden' }}
      >
        <div
          className="absolute rounded-full bg-copper-500/10"
          style={{ width: 300, height: 300, top: '10%', left: '-80px', filter: 'blur(80px)' }}
        />
      </div>

      <div className="relative px-4" style={{ width: '100%', maxWidth: '100%' }}>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-copper-500/10 border border-copper-500/20 mb-4"
        >
          <ShieldCheck className="w-3 h-3 text-copper-400 shrink-0" />
          <span className="text-[9px] font-mono uppercase tracking-widest text-copper-300">Zero affiliate bias</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="font-display text-[2.4rem] leading-[1.0] text-ink-50 mb-4"
          style={{ wordBreak: 'break-word', hyphens: 'auto' }}
        >
          The honest{' '}
          <em className="text-copper-400 not-italic display-italic">credit card</em>{' '}
          intelligence India needed.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-sm text-ink-200 leading-relaxed mb-6"
          style={{ maxWidth: '100%' }}
        >
          Real annual value. Live devaluation tracking. Points optimization. Built by people
          who refuse to be paid by banks to rank cards.
        </motion.p>

        {/* CTA buttons — stacked on mobile */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-col gap-3 mb-8"
          style={{ width: '100%' }}
        >
          <Link
            href="/smart-match"
            style={{
              background: '#d4a373',
              color: '#0a0a0b',
              fontWeight: 600,
              padding: '14px 20px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: '0.95rem',
              minHeight: 52,
              width: '100%',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <Sparkles style={{ width: 16, height: 16, flexShrink: 0 }} />
            Find my perfect card
            <ArrowRight style={{ width: 16, height: 16, flexShrink: 0 }} />
          </Link>
          <Link
            href="/optimize"
            style={{
              background: 'transparent',
              color: '#f5f5f6',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '14px 20px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: '0.95rem',
              minHeight: 52,
              width: '100%',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            Optimize my points
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 pb-8 border-b border-white/5 mb-8"
        >
          {[{ v: `${totalCards}+`, l: 'Cards tracked' }, { v: `${totalBanks}`, l: 'Banks' }, { v: 'Weekly', l: 'Refresh' }].map((s) => (
            <div key={s.l}>
              <div className="font-display text-2xl text-ink-50 tabular">{s.v}</div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-ink-400 mt-0.5">{s.l}</div>
            </div>
          ))}
        </motion.div>

        {/* Card showcase — NO absolute positioning, NO x translations, simple flex */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          style={{
            width: '100%',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Single card displayed prominently on mobile */}
          <div style={{ width: '75%', maxWidth: 280, margin: '0 auto' }}>
            <CardMockup card={featuredCards[1]} size="md" />
          </div>
          {/* Side cards — peeking, clipped */}
          <div
            style={{
              position: 'absolute',
              left: '-8%',
              top: '15%',
              width: '55%',
              opacity: 0.6,
              transform: 'rotate(-8deg) scale(0.85)',
              transformOrigin: 'center',
              overflow: 'hidden',
            }}
          >
            <CardMockup card={featuredCards[0]} size="sm" />
          </div>
          <div
            style={{
              position: 'absolute',
              right: '-8%',
              top: '15%',
              width: '55%',
              opacity: 0.6,
              transform: 'rotate(8deg) scale(0.85)',
              transformOrigin: 'center',
              overflow: 'hidden',
            }}
          >
            <CardMockup card={featuredCards[2]} size="sm" />
          </div>
        </motion.div>

      </div>
    </section>
  );
}

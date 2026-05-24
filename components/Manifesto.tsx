'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

export function Manifesto() {
  return (
    <section className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-copper-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <Quote className="w-12 h-12 text-copper-400/30 mx-auto mb-8" />

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-3xl md:text-5xl leading-[1.15] text-ink-50"
        >
          Every comparison site in India is a{' '}
          <span className="display-italic text-copper-400">card seller</span>, not a card{' '}
          <span className="display-italic text-copper-400">recommender</span>.
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ delay: 0.15 }}
          className="mt-8 text-lg text-ink-300 leading-relaxed max-w-3xl mx-auto font-display"
        >
          Paisabazaar, BankBazaar, CardInsider  --  they earn Rs.500 - 3,000 per approved application.
          Cards with higher affiliate payouts rank higher, even when they're objectively worse for you.
          We don't take affiliate commissions on rankings. We rank cards by your spending pattern alone.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid md:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-xl overflow-hidden"
        >
          {[
            {
              metric: '0',
              label: 'Banks paying for ranking',
              detail: 'Affiliate links are clearly marked. Rankings are pure value-based.',
            },
            {
              metric: '7 days',
              label: 'Data refresh cycle',
              detail: 'Weekly MITC scrapes catch devaluations within days, not months.',
            },
            {
              metric: '100%',
              label: 'Open methodology',
              detail: 'Our scoring engine is documented. Every recommendation shows its math.',
            },
          ].map((s, i) => (
            <div key={i} className="bg-ink-950 p-6 text-left">
              <div className="font-display text-4xl text-copper-400 tabular mb-2">{s.metric}</div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink-300 mb-3">
                {s.label}
              </div>
              <div className="text-sm text-ink-400 leading-relaxed">{s.detail}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

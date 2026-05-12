'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Calculator,
  TrendingDown,
  Sparkles,
  Layers,
  PieChart,
  ScanLine,
} from 'lucide-react';

const features = [
  {
    icon: Calculator,
    title: 'Real annual value',
    description:
      'Not headline reward rates. Our engine factors in monthly caps, fee waivers, milestone bonuses, and redemption haircuts to give you the actual rupee value per year for your spend.',
    href: '/smart-match',
    cta: 'Calculate mine',
  },
  {
    icon: TrendingDown,
    title: 'Devaluation tracker',
    description:
      'Every major Indian credit card was devalued in 2025-26. We track every MITC update, lounge cap, and reward rate cut — so you know when "your card" stops being worth holding.',
    href: '/about#devaluations',
    cta: 'See devaluations',
  },
  {
    icon: Sparkles,
    title: 'Points optimization',
    description:
      'Enter your card and points balance. We rank every redemption path — SmartBuy, Marriott Bonvoy, KrisFlyer transfers, statement credit — by INR value, with AI-generated sweet-spot advice.',
    href: '/optimize',
    cta: 'Optimize points',
  },
  {
    icon: Layers,
    title: 'Multi-card stack',
    description:
      'Most users hold 2-4 cards. No site recommends combinations. We do. Example: Amazon Pay ICICI (online) + HDFC MMT (travel) + Axis Atlas (premium) — covers 95% of spend optimally.',
    href: '/smart-match?mode=stack',
    cta: 'Build a stack',
  },
  {
    icon: ScanLine,
    title: 'Statement upload',
    description:
      'Upload your last credit card statement (PDF). We analyze your MCC categories and recommend cards that maximize YOUR actual spending pattern — not a generic profile.',
    href: '/smart-match?mode=upload',
    cta: 'Upload statement',
  },
  {
    icon: PieChart,
    title: 'Approval probability',
    description:
      'Stop applying blindly. Enter your income and credit score; we estimate approval odds for every card. Reduce hard inquiries on your bureau report.',
    href: '/smart-match?mode=approval',
    cta: 'Check approval',
  },
];

export function Features() {
  return (
    <section className="py-24 lg:py-32 relative">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-16 lg:mb-20">
          <div className="divider-rule mb-6 max-w-xs">— What no one else does</div>
          <h2 className="font-display text-4xl md:text-5xl leading-[1.05] text-ink-50">
            Six features that{' '}
            <span className="display-italic text-copper-400">cannot</span> be matched by sites paid to sell you cards.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 border border-white/5 rounded-xl overflow-hidden">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: (i % 3) * 0.1 }}
              className="bg-ink-950 p-8 group relative overflow-hidden"
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-copper-500/0 group-hover:bg-copper-500/5 blur-3xl transition-all duration-700" />

              <div className="relative space-y-4">
                <div className="w-10 h-10 rounded bg-copper-500/10 border border-copper-500/20 flex items-center justify-center text-copper-400">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display text-2xl text-ink-50 leading-tight">{f.title}</h3>
                <p className="text-sm text-ink-300 leading-relaxed">{f.description}</p>
                <Link
                  href={f.href}
                  className="link-underline inline-block text-xs font-mono uppercase tracking-widest text-copper-300 pt-2"
                >
                  {f.cta} →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

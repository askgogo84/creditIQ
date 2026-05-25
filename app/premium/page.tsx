'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Check, Zap, Shield, Star, CreditCard, TrendingUp, Bell, Plane, Building2, ChevronDown } from 'lucide-react';
import Link from 'next/link';

const FREE_FEATURES = [
  '100+ cards across 17 banks',
  'Smart Match card finder',
  'Points optimizer (basic)',
  'Devaluation tracker',
  'EMI & reward calculators',
  'Application status tracker',
  'Card comparison (up to 4)',
];

const PREMIUM_FEATURES = [
  { icon: CreditCard, text: 'Link your actual credit cards', highlight: true },
  { icon: TrendingUp, text: 'Live points balance -- all cards in one view', highlight: true },
  { icon: Zap, text: 'Multi-card point aggregator -- combine HDFC + Axis + Amex', highlight: true },
  { icon: Plane, text: 'Redeem points for flights directly', highlight: true },
  { icon: Building2, text: 'Redeem points for hotel stays directly', highlight: true },
  { icon: Bell, text: 'Instant devaluation alerts via WhatsApp + email', highlight: false },
  { icon: Star, text: 'AI strategy for your exact card portfolio', highlight: false },
  { icon: Shield, text: 'Approval odds for every card', highlight: false },
  { icon: TrendingUp, text: 'Spend tracker + best card per category', highlight: false },
  { icon: CreditCard, text: 'Unlimited card comparisons', highlight: false },
];

const FAQS = [
  { q: 'Is my card data safe?', a: 'Yes. We use the RBI-approved Account Aggregator framework -- the same technology used by Zerodha, CRED, and Perfios. We never see your card credentials. You authorise access directly through your bank.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your dashboard with one click. You keep access until the end of your billing period. No questions asked.' },
  { q: 'Which banks are supported for card linking?', a: 'Currently HDFC, Axis, ICICI, SBI, Kotak, IDFC FIRST, and AmEx. We are adding more banks monthly. UAE and Singapore banks coming in 2026.' },
  { q: 'What is the multi-card aggregator?', a: 'It combines points from all your linked cards into a single view and shows the optimal redemption strategy across your entire portfolio -- not just one card at a time. For example: use 30,000 HDFC points + 20,000 Axis EDGE miles together for a business class ticket.' },
  { q: 'How does direct booking work?', a: 'Once your cards are linked, you can search for flights and hotels directly on CreditIQ. We show options by points cost, not just cash price. We earn a small referral commission -- your points value is unaffected.' },
];

export default function PremiumPage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const price = billing === 'annual' ? 149 : 199;
  const saving = billing === 'annual' ? Math.round((199 - 149) * 12) : 0;

  return (
    <main className="min-h-screen" style={{ overflowX: 'hidden' }}>
      <Header />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6 grain relative" style={{ overflow: 'hidden' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 30%, rgba(212,163,115,0.08) 0%, transparent 60%)' }} />
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)' }}>
            <Zap className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: 'var(--accent)' }}>CreditIQ Premium</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl leading-tight mb-6" style={{ color: 'var(--text)' }}>
            Your cards, your points,{' '}
            <em className="text-copper-400 not-italic display-italic">one dashboard.</em>
          </h1>
          <p className="text-lg leading-relaxed max-w-2xl mx-auto mb-10" style={{ color: 'var(--text-muted)' }}>
            Link your HDFC, Axis, Amex and every other card. See all your points live. Combine them. Redeem directly for flights and hotels. No app switching. No points rotting.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-lg border mb-10" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
            <button
              onClick={() => setBilling('monthly')}
              className="px-4 py-2 rounded text-sm font-medium transition-all"
              style={{
                background: billing === 'monthly' ? 'var(--accent)' : 'transparent',
                color: billing === 'monthly' ? 'var(--accent-text)' : 'var(--text-muted)',
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className="px-4 py-2 rounded text-sm font-medium transition-all flex items-center gap-2"
              style={{
                background: billing === 'annual' ? 'var(--accent)' : 'transparent',
                color: billing === 'annual' ? 'var(--accent-text)' : 'var(--text-muted)',
              }}
            >
              Annual
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: billing === 'annual' ? 'rgba(0,0,0,0.2)' : 'color-mix(in srgb, var(--emerald) 15%, transparent)', color: billing === 'annual' ? 'white' : 'var(--emerald)' }}>
                SAVE 25%
              </span>
            </button>
          </div>

          {/* Price cards */}
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free */}
            <div className="rounded-2xl border p-8 text-left" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="text-sm font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--text-dim)' }}>Free forever</div>
              <div className="font-display text-5xl mb-1" style={{ color: 'var(--text)' }}>Rs.0</div>
              <div className="text-sm mb-8" style={{ color: 'var(--text-dim)' }}>No credit card required</div>
              <div className="space-y-3 mb-8">
                {FREE_FEATURES.map(f => (
                  <div key={f} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--text-dim)' }} />
                    {f}
                  </div>
                ))}
              </div>
              <Link href="/" className="block text-center py-3 rounded-lg border text-sm font-medium transition-all" style={{ borderColor: 'var(--border-strong)', color: 'var(--text-muted)' }}>
                Continue free
              </Link>
            </div>

            {/* Premium */}
            <div className="rounded-2xl p-8 text-left relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${billing === 'annual' ? '#1B3A5C' : '#1a1a1f'} 0%, #0a0a0b 100%)`, border: '1px solid rgba(212,163,115,0.3)' }}>
              <div className="absolute top-4 right-4 text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded" style={{ background: 'rgba(212,163,115,0.2)', color: '#d4a373' }}>
                Most popular
              </div>
              <div className="text-sm font-mono uppercase tracking-widest mb-4" style={{ color: '#d4a373' }}>Premium</div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display text-5xl text-white">Rs.{price}</span>
                <span className="text-white/60">/month</span>
              </div>
              {billing === 'annual' && (
                <div className="text-sm mb-1" style={{ color: '#34d399' }}>Save Rs.{saving}/year . billed Rs.{price * 12} annually</div>
              )}
              <div className="text-sm mb-8 text-white/50">Everything in free, plus:</div>
              <div className="space-y-3 mb-8">
                {PREMIUM_FEATURES.map(({ icon: Icon, text, highlight }) => (
                  <div key={text} className="flex items-start gap-2.5 text-sm" style={{ color: highlight ? '#f5f5f6' : 'rgba(255,255,255,0.65)' }}>
                    <Icon className="w-4 h-4 shrink-0 mt-0.5" style={{ color: highlight ? '#d4a373' : 'rgba(255,255,255,0.4)' }} />
                    {highlight ? <strong>{text}</strong> : text}
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard"
                className="block text-center py-3 rounded-lg text-sm font-bold transition-all"
                style={{ background: '#d4a373', color: '#0a0a0b' }}
              >
                Start free 7-day trial →




























              </Link>
              <div className="text-center text-xs mt-3 text-white/40">No payment needed to start trial</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature deep-dive */}
      <section className="py-20 px-4 sm:px-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl mb-4" style={{ color: 'var(--text)' }}>Features no other platform has</h2>
            <p style={{ color: 'var(--text-muted)' }}>Built for people who take their rewards seriously</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: Zap, title: 'Multi-card aggregator', desc: 'See all your points in one place. HDFC Reward Points + Axis EDGE miles + Amex MR -- combined, ranked, ready to redeem.', tag: 'Industry first in India' },
              { icon: Plane, title: 'Direct booking', desc: 'Search flights and hotels by points cost, not cash. Book directly. We handle the redemption path -- you get the seat.', tag: 'Coming soon' },
              { icon: TrendingUp, title: 'Portfolio optimizer', desc: 'Which card should you use for groceries? For dining? For fuel? AI analyses your full card portfolio and tells you the optimal card for every spend category.', tag: 'AI-powered' },
            ].map(({ icon: Icon, title, desc, tag }) => (
              <div key={title} className="rounded-xl p-6 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
                  <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <div className="inline-block text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded mb-3" style={{ background: 'color-mix(in srgb, var(--emerald) 12%, transparent)', color: 'var(--emerald)' }}>
                  {tag}
                </div>
                <h3 className="font-display text-xl mb-3" style={{ color: 'var(--text)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl mb-10 text-center" style={{ color: 'var(--text)' }}>Frequently asked questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                  style={{ color: 'var(--text)' }}
                >
                  <span className="font-medium">{faq.q}</span>
                  <ChevronDown className="w-4 h-4 shrink-0 transition-transform" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', color: 'var(--text-dim)' }} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                    <div className="pt-4">{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-4 sm:px-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-4xl mb-4" style={{ color: 'var(--text)' }}>Start your 7-day free trial</h2>
          <p className="mb-8" style={{ color: 'var(--text-muted)' }}>No payment needed. Cancel anytime. All premium features unlocked from day one.</p>
          <Link href="/dashboard" className="btn-primary text-base px-8 inline-flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Get started -- it's free for 7 days
          </Link>
          <div className="mt-4 text-xs" style={{ color: 'var(--text-dim)' }}>Then Rs.{price}/month . Cancel anytime</div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

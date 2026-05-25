import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { UAE_CARDS, UAE_BANKS } from '@/lib/data/uae-cards';
import Link from 'next/link';
import { Shield, Plane, CreditCard, ArrowRight, Star } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Best Credit Cards UAE 2026 | CreditIQ',
  description: 'Compare the best credit cards in UAE. ENBD, FAB, Mashreq, ADCB, Citi, HSBC -- honest rankings, zero affiliate bias. Find your perfect UAE credit card.',
  keywords: ['best credit card UAE 2026', 'UAE credit card comparison', 'ENBD credit card', 'FAB cashback card', 'best cashback card UAE'],
};

const TIER_ORDER = ['super-premium', 'premium', 'mid', 'entry'];

export default function UAEPage() {
  const totalCards = UAE_CARDS.filter(c => c.active).length;
  const totalBanks = UAE_BANKS.length;

  const featuredCards = UAE_CARDS.filter(c => ['enbd-beyond', 'fab-cashback', 'citibank-uae-prestige'].includes(c.id));

  return (
    <main className="min-h-screen" style={{ overflowX: 'hidden' }}>
      <Header />

      {/* Market switcher */}
      <div className="pt-20 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>Market:</span>
          {[
            { label: '🇮🇳 India', href: '/', active: false },
            { label: '🇦🇪 UAE', href: '/uae', active: true },
            { label: '🇸🇬 Singapore', href: '/sg', active: false, soon: true },
          ].map(m => (
            <Link key={m.href} href={m.href} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: m.active ? 'var(--accent)' : 'transparent', color: m.active ? 'var(--accent-text)' : 'var(--text-dim)', border: m.active ? 'none' : '1px solid var(--border)', opacity: m.soon ? 0.5 : 1, pointerEvents: m.soon ? 'none' : 'auto' }}>
              {m.label}{m.soon && ' (soon)'}
            </Link>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="pt-16 pb-16 px-4 sm:px-6 grain relative" style={{ overflow: 'hidden' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 60% 30%, rgba(212,163,115,0.07) 0%, transparent 60%)' }} />
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-6" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)' }}>
                <Shield className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                <span className="text-[11px] font-mono uppercase tracking-widest" style={{ color: 'var(--accent)' }}>Zero affiliate bias . UAE edition</span>
              </div>
              <h1 className="font-display text-5xl sm:text-6xl leading-tight mb-6" style={{ color: 'var(--text)' }}>
                The honest credit card guide for{' '}
                <em className="text-copper-400 not-italic display-italic">UAE residents</em>
              </h1>
              <p className="text-lg leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
                {totalCards} cards across {totalBanks} UAE banks. Real annual value. Cashback in AED. Built for Indian expats and UAE residents who refuse to be misled by commission-driven recommendations.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/uae#cards" className="btn-primary text-base flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" /> Browse UAE cards
                </Link>
                <Link href="/smart-match" className="btn-ghost text-base flex items-center justify-center gap-2">
                  Find my perfect card →


















                </Link>
              </div>
              <div className="flex items-center gap-8 mt-10 pt-8 border-t" style={{ borderColor: 'var(--border)' }}>
                {[{ v: `${totalCards}+`, l: 'UAE cards' }, { v: `${totalBanks}`, l: 'Banks' }, { v: 'AED', l: 'Pricing' }].map(s => (
                  <div key={s.l}>
                    <div className="font-display text-3xl" style={{ color: 'var(--text)' }}>{s.v}</div>
                    <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured cards */}
            <div className="hidden lg:block space-y-3">
              {featuredCards.map(card => (
                <div key={card.id} className="rounded-xl border p-4 flex items-center gap-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: card.color }}>
                    {card.bank.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{card.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{card.annual_fee_aed === 0 ? 'Zero annual fee' : `AED ${card.annual_fee_aed}/year`} . {card.base_reward_rate}% rewards</div>
                  </div>
                  <div className="text-xs font-mono px-2 py-1 rounded shrink-0" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                    {card.tier}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cards grid */}
      <section id="cards" className="py-16 px-4 sm:px-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="font-display text-3xl mb-2" style={{ color: 'var(--text)' }}>All UAE credit cards</h2>
          <p className="mb-10" style={{ color: 'var(--text-muted)' }}>Ranked by value -- not by what banks pay us.</p>

          {TIER_ORDER.map(tier => {
            const tierCards = UAE_CARDS.filter(c => c.tier === tier && c.active);
            if (tierCards.length === 0) return null;
            const tierLabel = { 'super-premium': 'Super Premium', 'premium': 'Premium', 'mid': 'Mid-tier', 'entry': 'Entry Level & Zero Fee' }[tier];

            return (
              <div key={tier} className="mb-12">
                <div className="text-[11px] font-mono uppercase tracking-widest mb-4" style={{ color: 'var(--text-dim)' }}>{tierLabel} -- {tierCards.length} cards</div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {tierCards.map(card => (
                    <div key={card.id} className="rounded-xl border overflow-hidden transition-all hover:border-copper-500/30" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                      {/* Color header */}
                      <div className="h-2" style={{ background: card.color }} />
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: card.color }}>
                            {card.bank.slice(0, 2)}
                          </div>
                          <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>{card.bank} . {card.tier.replace('-', ' ')}</div>
                        </div>
                        <h3 className="font-display text-base leading-tight mb-2" style={{ color: 'var(--text)' }}>{card.name}</h3>
                        <p className="text-xs mb-3 italic" style={{ color: 'var(--text-muted)' }}>{card.best_for}</p>

                        {/* Pills */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: card.annual_fee_aed === 0 ? 'color-mix(in srgb, var(--emerald) 12%, transparent)' : 'color-mix(in srgb, var(--text) 6%, transparent)', color: card.annual_fee_aed === 0 ? 'var(--emerald)' : 'var(--text-muted)', border: card.annual_fee_aed === 0 ? '1px solid color-mix(in srgb, var(--emerald) 25%, transparent)' : '1px solid var(--border)' }}>
                            {card.annual_fee_aed === 0 ? 'Zero fee' : `AED ${card.annual_fee_aed}/yr`}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'color-mix(in srgb, var(--text) 6%, transparent)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                            {card.base_reward_rate}% rewards
                          </span>
                        </div>

                        {/* Highlights */}
                        <div className="space-y-1 mb-4">
                          {card.highlights.slice(0, 2).map(h => (
                            <div key={h} className="flex items-start gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                              <span style={{ color: 'var(--accent)' }}>.</span> {h}
                            </div>
                          ))}
                        </div>

                        {/* APR */}
                        <div className="flex items-center justify-between text-[10px] font-mono mb-3" style={{ color: 'var(--text-dim)' }}>
                          <span>APR if balance carried</span>
                          <span style={{ color: '#ef4444' }}>{card.apr_percent}%</span>
                        </div>

                        <div className="flex gap-2">
                          <button className="flex-1 py-2 rounded text-xs font-medium" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
                            Apply now →


















                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Indian expat CTA */}
      <section className="py-16 px-4 sm:px-6" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <Plane className="w-8 h-8 mx-auto mb-4" style={{ color: 'var(--accent)' }} />
          <h2 className="font-display text-3xl mb-4" style={{ color: 'var(--text)' }}>Hold cards in India AND UAE?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            3.5 million Indians live in UAE. CreditIQ is the only platform that helps you optimize points across both your Indian and UAE credit cards -- combined, in one dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard" className="btn-primary flex items-center justify-center gap-2">
              <Star className="w-4 h-4" /> View my full portfolio
            </Link>
            <Link href="/" className="btn-ghost flex items-center justify-center gap-2">
              Browse India cards →


















            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

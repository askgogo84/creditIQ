'use client';

import { useCompare } from '@/lib/store';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CompareTray } from '@/components/CompareTray';
import { CardMockup } from '@/components/cards/CardMockup';
import { calculateAnnualValue } from '@/lib/engine';
import { formatINR } from '@/lib/utils';
import { useState } from 'react';
import Link from 'next/link';
import { X, Check, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function ComparePage() {
  const { cards, remove, clear } = useCompare();
  const selected = cards.map((id) => SEED_CARDS.find((c) => c.id === id)).filter(Boolean) as any[];
  const [monthlySpend, setMonthlySpend] = useState(50000);

  if (selected.length === 0) {
    return (
      <main className="min-h-screen">
        <Header />
        <section className="pt-40 pb-32 min-h-[70vh] flex items-center grain relative">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <div className="divider-rule mb-6 max-w-xs mx-auto">— Compare</div>
            <h1 className="font-display text-5xl text-ink-50 leading-[1.05] mb-6">
              Pick cards to{' '}
              <span className="display-italic text-copper-400">compare</span>.
            </h1>
            <p className="text-lg text-ink-300 font-display mb-8 leading-relaxed">
              Add up to 4 cards from the catalog to see them side-by-side: real annual value,
              fees, redemption paths, and devaluations.
            </p>
            <Link href="/" className="btn-primary inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Browse the catalog
            </Link>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  const valueCalcs = selected.map((c) =>
    calculateAnnualValue(c, { monthly_total_inr: monthlySpend })
  );

  const rows: { label: string; key: string; getValue: (card: any, idx: number) => any }[] = [
    {
      label: 'Annual fee',
      key: 'fee',
      getValue: (c) => (c.annual_fee_inr === 0 ? 'FREE' : formatINR(c.annual_fee_inr)),
    },
    {
      label: 'Fee waiver at',
      key: 'waiver',
      getValue: (c) => (c.fee_waiver_spend_inr ? formatINR(c.fee_waiver_spend_inr) : '—'),
    },
    {
      label: 'Joining fee',
      key: 'joining',
      getValue: (c) => (c.joining_fee_inr === 0 ? 'FREE' : formatINR(c.joining_fee_inr)),
    },
    {
      label: 'Base reward rate',
      key: 'base',
      getValue: (c) => `${c.base_reward_rate}%`,
    },
    {
      label: 'Welcome benefit',
      key: 'welcome',
      getValue: (c) => (c.welcome_benefit_inr ? formatINR(c.welcome_benefit_inr) : '—'),
    },
    {
      label: 'Domestic lounges',
      key: 'dom',
      getValue: (c) => {
        const l = c.lounges?.find((x: any) => x.type === 'domestic');
        if (!l) return '—';
        return l.visits_per_year ? `${l.visits_per_year}/yr` : l.visits_per_quarter ? `${l.visits_per_quarter}/qtr` : 'Unlimited';
      },
    },
    {
      label: 'International lounges',
      key: 'intl',
      getValue: (c) => {
        const l = c.lounges?.find((x: any) => x.type === 'international');
        if (!l) return '—';
        return l.visits_per_year ? `${l.visits_per_year}/yr` : 'Unlimited';
      },
    },
    {
      label: 'Forex markup',
      key: 'forex',
      getValue: (c) => (c.forex_markup_percent !== undefined ? `${c.forex_markup_percent}%` : '—'),
    },
    {
      label: 'Best redemption value',
      key: 'redeem',
      getValue: (c) => {
        const best = Math.max(...c.redemption_options.map((r: any) => r.value_per_point_inr), 0);
        return best ? `₹${best.toFixed(2)}/pt` : '—';
      },
    },
    {
      label: 'Expert rating',
      key: 'rating',
      getValue: (c) => (c.expert_rating ? `${c.expert_rating.toFixed(1)}/10` : '—'),
    },
    {
      label: 'Min income',
      key: 'income',
      getValue: (c) => (c.min_income_inr_monthly ? `${formatINR(c.min_income_inr_monthly)}/mo` : '—'),
    },
    {
      label: 'Recent devaluations',
      key: 'devalue',
      getValue: (c) => {
        const recent = (c.devaluations ?? []).filter(
          (d: any) => new Date(d.date) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        );
        return recent.length > 0 ? `${recent.length} in past year` : 'None';
      },
    },
  ];

  return (
    <main className="min-h-screen">
      <Header />

      <section className="pt-32 pb-12 grain">
        <div className="max-w-7xl mx-auto px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-ink-300 hover:text-copper-300 mb-6">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>

          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <div className="divider-rule mb-4 max-w-xs">— Side by side</div>
              <h1 className="font-display text-5xl text-ink-50 leading-[1.05]">
                Comparing{' '}
                <span className="display-italic text-copper-400">
                  {selected.length} card{selected.length !== 1 ? 's' : ''}
                </span>
              </h1>
            </div>
            <button
              onClick={clear}
              className="text-xs font-mono uppercase tracking-widest text-ink-400 hover:text-crimson-400"
            >
              Clear all
            </button>
          </div>

          {/* Spend slider */}
          <div className="bg-ink-900/40 border border-white/10 rounded-xl p-5 mb-8 flex flex-wrap items-center gap-6">
            <div className="flex-1 min-w-[200px]">
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-xs font-mono uppercase tracking-widest text-ink-400">
                  Your monthly spend (for live value calc)
                </label>
                <span className="font-display text-xl text-copper-300 tabular">
                  {formatINR(monthlySpend)}
                </span>
              </div>
              <input
                type="range"
                min={5000}
                max={500000}
                step={5000}
                value={monthlySpend}
                onChange={(e) => setMonthlySpend(parseInt(e.target.value))}
                className="w-full accent-copper-400"
              />
            </div>
          </div>

          {/* Card headers */}
          <div
            className="grid gap-4 mb-2"
            style={{ gridTemplateColumns: `220px repeat(${selected.length}, minmax(240px, 1fr))` }}
          >
            <div />
            {selected.map((card, i) => (
              <div key={card.id} className="bg-ink-900/40 border border-white/10 rounded-xl p-4 relative">
                <button
                  onClick={() => remove(card.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-ink-950 border border-white/10 flex items-center justify-center text-ink-400 hover:text-crimson-400 hover:border-crimson-500"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="flex justify-center mb-3">
                  <CardMockup card={card} size="sm" interactive={false} />
                </div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
                  {card.bank}
                </div>
                <div className="font-display text-base text-ink-50 leading-tight">{card.name}</div>
                <div
                  className={`font-display text-xl mt-2 tabular ${
                    valueCalcs[i].net_value_inr > 0 ? 'text-emerald-300' : 'text-crimson-400'
                  }`}
                >
                  {valueCalcs[i].net_value_inr > 0 ? '+' : ''}
                  ₹{Math.abs(valueCalcs[i].net_value_inr).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-ink-400">est. net value/yr</div>
                <Link
                  href={`/card/${card.slug}`}
                  className="mt-3 block text-xs font-mono uppercase tracking-widest text-copper-300 link-underline"
                >
                  Full details →
                </Link>
              </div>
            ))}
          </div>

          {/* Comparison rows */}
          <div className="bg-ink-900/40 border border-white/10 rounded-xl overflow-hidden">
            {rows.map((row, rIdx) => (
              <div
                key={row.key}
                className="grid gap-4 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                style={{ gridTemplateColumns: `220px repeat(${selected.length}, minmax(240px, 1fr))` }}
              >
                <div className="text-xs text-ink-300 font-medium self-center">{row.label}</div>
                {selected.map((card, i) => (
                  <div key={card.id} className="font-display text-base text-ink-100 tabular self-center">
                    {row.getValue(card, i)}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Highlights */}
          <div
            className="grid gap-4 mt-8"
            style={{ gridTemplateColumns: `220px repeat(${selected.length}, minmax(240px, 1fr))` }}
          >
            <div className="text-xs font-mono uppercase tracking-widest text-ink-400 self-start pt-2">
              Highlights
            </div>
            {selected.map((card) => (
              <div key={card.id} className="space-y-2">
                {card.highlights.map((h: string, i: number) => (
                  <div key={i} className="text-xs text-ink-200 flex items-start gap-2">
                    <Check className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                    {h}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Drawbacks if any */}
          {selected.some((c) => c.drawbacks && c.drawbacks.length > 0) && (
            <div
              className="grid gap-4 mt-8"
              style={{ gridTemplateColumns: `220px repeat(${selected.length}, minmax(240px, 1fr))` }}
            >
              <div className="text-xs font-mono uppercase tracking-widest text-ink-400 self-start pt-2">
                Drawbacks
              </div>
              {selected.map((card) => (
                <div key={card.id} className="space-y-2">
                  {(card.drawbacks ?? []).map((d: string, i: number) => (
                    <div key={i} className="text-xs text-ink-200 flex items-start gap-2">
                      <AlertTriangle className="w-3 h-3 text-crimson-400 shrink-0 mt-0.5" />
                      {d}
                    </div>
                  ))}
                  {(!card.drawbacks || card.drawbacks.length === 0) && (
                    <div className="text-xs text-ink-500 italic">No major drawbacks</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <CompareTray />
    </main>
  );
}

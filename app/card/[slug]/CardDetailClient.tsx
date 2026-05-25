'use client';

import { CardMockup } from '@/components/cards/CardMockup';
import { useCompare } from '@/lib/store';
import { calculateAnnualValue } from '@/lib/engine';
import { formatINR, formatINRFull } from '@/lib/utils';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Check, ExternalLink, Plane, ShoppingBag, CreditCard as CreditCardIcon,
  Hotel, Package, ArrowDownRight, AlertTriangle, Award, TrendingUp, Clock,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import type { CreditCard } from '@/lib/types';

const TYPE_ICONS: Record<string, any> = {
  flight: Plane, hotel: Hotel, transfer: ArrowDownRight,
  cashback: CreditCardIcon, voucher: ShoppingBag, product: Package, fuel: Package,
};

export function CardDetailClient({ card }: { card: CreditCard }) {
  const { add, remove, isIn } = useCompare();
  const inCompare = isIn(card.id);
  const [monthlySpend, setMonthlySpend] = useState(50000);

  const annualCalc = useMemo(
    () => calculateAnnualValue(card, { monthly_total_inr: monthlySpend }),
    [card, monthlySpend]
  );

  return (
    <>
      <section className="pt-28 pb-12 grain relative">
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background: `radial-gradient(circle at 50% 20%, ${card.color}40 0%, transparent 60%)`,
          }}
        />

        <div className="max-w-7xl mx-auto px-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-ink-300 hover:text-copper-300 mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to all cards
          </Link>

          <div className="grid lg:grid-cols-[1fr,1.1fr] gap-12 items-start">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-copper-400 mb-3">
                {card.bank} . {card.tier.replace('-', ' ')} tier
              </div>
              <h1 className="font-display text-5xl md:text-6xl text-ink-50 leading-[0.95] mb-4">
                {card.name}
              </h1>
              <p className="font-display italic text-xl text-ink-200 mb-8">{card.best_for}</p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <Metric label="Joining fee" value={card.joining_fee_inr === 0 ? 'FREE' : formatINR(card.joining_fee_inr)} />
                <Metric label="Annual fee" value={card.annual_fee_inr === 0 ? 'FREE' : formatINR(card.annual_fee_inr)} />
                <Metric label="Base rate" value={`${card.base_reward_rate}%`} highlight />
                <Metric label="Expert rating" value={`${card.expert_rating?.toFixed(1) ?? '--'}/10`} highlight />
              </div>

              <div className="flex gap-3">
                <a
                  href={`/api/apply/${card.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Apply Now <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => (inCompare ? remove(card.id) : add(card.id))}
                  className={`btn-ghost inline-flex items-center gap-2 ${
                    inCompare ? 'border-copper-500/40 text-copper-300' : ''
                  }`}
                >
                  {inCompare ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {inCompare ? 'In compare' : 'Add to compare'}
                </button>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <CardMockup card={card} size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Real Annual Value calculator */}
      <section className="py-16 bg-ink-900/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="divider-rule mb-6 max-w-xs">-- Real annual value</div>
          <h2 className="font-display text-3xl md:text-4xl text-ink-50 mb-8 max-w-2xl">
            What's it actually worth{' '}
            <span className="display-italic text-copper-400">for you</span>?
          </h2>

          <div className="grid lg:grid-cols-[400px,1fr] gap-8">
            <div className="bg-ink-950 border border-white/10 rounded-xl p-6 space-y-6">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-ink-400">
                    Your monthly spend
                  </label>
                  <span className="font-display text-2xl text-copper-300 tabular">
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

              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-ink-300">Gross rewards</span>
                  <span className="font-display text-xl text-ink-50 tabular">
                    {formatINRFull(annualCalc.gross_rewards_inr)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-ink-300">Fees</span>
                  <span className="font-display text-xl text-crimson-400 tabular">
                    -{formatINRFull(annualCalc.fee_inr)}
                  </span>
                </div>
                <div className="pt-3 border-t border-white/5 flex justify-between items-baseline">
                  <span className="text-sm text-ink-200 font-medium">Net annual value</span>
                  <span
                    className={`font-display text-3xl tabular ${
                      annualCalc.net_value_inr > 0 ? 'text-emerald-300 glow-emerald' : 'text-crimson-400'
                    }`}
                  >
                    {annualCalc.net_value_inr > 0 ? '+' : ''}{formatINRFull(annualCalc.net_value_inr)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-ink-400 mb-3">
                Value breakdown
              </div>
              <div className="space-y-2">
                {Object.entries(annualCalc.breakdown).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between items-center px-4 py-3 bg-ink-950 border border-white/5 rounded"
                  >
                    <span className="text-sm text-ink-200">{k}</span>
                    <span
                      className={`font-display text-base tabular ${
                        v < 0 ? 'text-crimson-400' : 'text-emerald-300'
                      }`}
                    >
                      {v < 0 ? '' : '+'}Rs.{Math.abs(v).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights & drawbacks */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-8">
          <div>
            <div className="divider-rule mb-4 max-w-xs">-- Highlights</div>
            <ul className="space-y-3">
              {card.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-ink-100">
                  <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  {h}
                </li>
              ))}
            </ul>
          </div>
          {card.drawbacks && card.drawbacks.length > 0 && (
            <div>
              <div className="divider-rule mb-4 max-w-xs">-- Drawbacks</div>
              <ul className="space-y-3">
                {card.drawbacks.map((d, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-ink-100">
                    <AlertTriangle className="w-4 h-4 text-crimson-400 shrink-0 mt-0.5" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Redemption table */}
      <section className="py-16 bg-ink-900/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="divider-rule mb-4 max-w-xs">-- Redemption paths</div>
          <h2 className="font-display text-3xl text-ink-50 mb-8">
            Every way to spend your {card.reward_currency.replace('-', ' ')}
          </h2>

          <div className="space-y-2">
            {card.redemption_options
              .sort((a, b) => b.value_per_point_inr - a.value_per_point_inr)
              .map((r, i) => {
                const Icon = TYPE_ICONS[r.type] ?? Package;
                return (
                  <div
                    key={i}
                    className="grid grid-cols-[auto,auto,1fr,auto] gap-4 items-center px-4 py-4 bg-ink-950 border border-white/5 rounded"
                  >
                    <div className="font-display text-xl text-ink-500 tabular w-8">{i + 1}</div>
                    <div className="w-9 h-9 rounded bg-white/5 border border-white/10 flex items-center justify-center text-copper-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-medium text-ink-100 capitalize">{r.partner || r.type}</div>
                      {(r.best_for || r.notes) && (
                        <div className="text-xs text-ink-400 mt-0.5">{r.best_for || r.notes}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg text-emerald-300 tabular">
                        Rs.{r.value_per_point_inr.toFixed(2)}
                      </div>
                      <div className="text-[10px] font-mono text-ink-500 uppercase tracking-widest">
                        per point
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          <Link
            href={`/optimize?card=${card.id}`}
            className="mt-8 btn-primary inline-flex items-center gap-2"
          >
            Optimize my balance →
















          </Link>
        </div>
      </section>

      {/* Category rewards */}
      {card.category_rewards.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="divider-rule mb-4 max-w-xs">-- Reward rates</div>
            <h2 className="font-display text-3xl text-ink-50 mb-8">Earn by category</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {card.category_rewards.map((cr, i) => (
                <div key={i} className="bg-ink-900/40 border border-white/10 rounded p-5">
                  <div className="text-xs font-mono uppercase tracking-widest text-ink-400 mb-1">
                    {cr.category}
                  </div>
                  <div className="font-display text-3xl text-copper-400 tabular">
                    {cr.rate}
                    <span className="text-base text-ink-300">
                      {cr.unit === 'percent' ? '%' : 'X'}
                    </span>
                  </div>
                  {cr.cap_inr_monthly && (
                    <div className="text-[11px] text-crimson-400/80 mt-2">
                      Capped at {formatINR(cr.cap_inr_monthly)}/month
                    </div>
                  )}
                  {cr.notes && (
                    <div className="text-xs text-ink-400 mt-2 leading-relaxed">{cr.notes}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Devaluations */}
      {card.devaluations && card.devaluations.length > 0 && (
        <section className="py-16 bg-crimson-500/[0.03] border-y border-crimson-500/10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5 text-crimson-400 rotate-180" />
              <div className="divider-rule max-w-xs">-- Devaluation history</div>
            </div>
            <h2 className="font-display text-3xl text-ink-50 mb-8">
              <span className="display-italic text-crimson-400">Beware</span> -- this card has been devalued.
            </h2>
            <div className="space-y-3">
              {card.devaluations.map((d, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[auto,auto,1fr,auto] gap-4 items-center px-4 py-4 bg-ink-950 border border-white/5 rounded"
                >
                  <Clock className="w-4 h-4 text-ink-400" />
                  <div className="font-mono text-sm text-ink-200 tabular">
                    {new Date(d.date).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: '2-digit',
                    })}
                  </div>
                  <div>
                    <div className="text-sm text-ink-100">{d.description}</div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-ink-500 mt-1">
                      {d.category.replace('-', ' ')}
                    </div>
                  </div>
                  <div
                    className={`text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded ${
                      d.impact === 'high'
                        ? 'bg-crimson-500/15 text-crimson-300'
                        : d.impact === 'medium'
                        ? 'bg-copper-500/15 text-copper-300'
                        : 'bg-white/5 text-ink-300'
                    }`}
                  >
                    {d.impact} impact
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-ink-950 border border-white/5 rounded px-4 py-3">
      <div className="text-[10px] font-mono uppercase tracking-widest text-ink-400 mb-1">
        {label}
      </div>
      <div className={`font-display text-2xl tabular ${highlight ? 'text-copper-300' : 'text-ink-50'}`}>
        {value}
      </div>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { CardTile } from '@/components/design/CardTile';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { matchCards, approvalProbability } from '@/lib/engine';
import { motion } from 'framer-motion';
import { Sliders, Sparkles, Upload, TrendingUp } from 'lucide-react';
import type { UserSpendProfile } from '@/lib/types';
import { formatINR } from '@/lib/utils';

const VARIANT_ROTATION = ['obsidian', 'navy', 'plum', 'gold', 'iris', 'mint'] as const
const NETWORK_BY_BANK: Record<string, string> = { HDFC: 'VISA', AXIS: 'MASTERCARD', ICICI: 'AMEX', SBI: 'VISA', AMEX: 'AMEX', IDFC: 'VISA' }
function toTileCard(c: any, i: number) {
  const bank = (c.bank || '').toUpperCase()
  return { bank, name: (c.name || '').replace(/^HDFC\s+|^AXIS\s+|^ICICI\s+|^SBI\s+/i, '').replace(/ Credit Card$/i, ''), tagline: c.tier || 'Standard', tier: (c.tier || 'CARD').toUpperCase().replace(/-/g, ' '), network: NETWORK_BY_BANK[bank.split(' ')[0]] || 'VISA', variant: VARIANT_ROTATION[i % VARIANT_ROTATION.length], tags: (c.category || []).slice(0, 2).map((s: string) => s.replace(/-/g, ' ')), fee: c.annual_fee_inr || 0, iqScore: Math.round((c.expert_rating ?? 8) * 10) }
}


export default function SmartMatchPage() {
  const [monthlyTotal, setMonthlyTotal] = useState(50000);
  const [onlineShare, setOnlineShare] = useState(40);
  const [diningShare, setDiningShare] = useState(15);
  const [fuelShare, setFuelShare] = useState(8);
  const [travelShare, setTravelShare] = useState(10);
  const [maxFee, setMaxFee] = useState(5000);
  const [creditScore, setCreditScore] = useState(750);
  const [income, setIncome] = useState(100000);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const spend: UserSpendProfile = useMemo(
    () => ({
      monthly_total_inr: monthlyTotal,
      online_inr: (monthlyTotal * onlineShare) / 100,
      dining_inr: (monthlyTotal * diningShare) / 100,
      fuel_inr: (monthlyTotal * fuelShare) / 100,
      travel_inr: (monthlyTotal * travelShare) / 100,
    }),
    [monthlyTotal, onlineShare, diningShare, fuelShare, travelShare]
  );

  const results = useMemo(() => {
    const matches = matchCards(SEED_CARDS, spend, {
      max_fee: maxFee,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    });
    return matches.slice(0, 12).map((m) => ({
      ...m,
      approval_prob: approvalProbability(m.card, income, creditScore),
    }));
  }, [spend, maxFee, selectedCategories, income, creditScore]);

  const toggleCategory = (c: string) => {
    setSelectedCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  return (
    <main className="page-fade">
      <Header />

      <section className="pt-32 pb-12 grain relative">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-copper-500/5 blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mb-12">
            <div className="divider-rule mb-6 max-w-xs">-- Smart Match</div>
            <h1 className="font-display text-5xl md:text-6xl leading-[1.05] text-ink-50">
              Tell us how you{' '}
              <span className="display-italic text-copper-400">spend</span>.
            </h1>
            <p className="text-ink-300 mt-6 text-lg font-display leading-relaxed">
              Results update live as you adjust. No "submit" button. No email gate. No bullshit.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[380px,1fr] gap-8">
          {/* Configurator */}
          <aside className="lg:sticky lg:top-24 lg:self-start space-y-6 bg-ink-900/40 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-2 text-ink-100">
              <Sliders className="w-4 h-4 text-copper-400" />
              <span className="font-display text-lg">Your profile</span>
            </div>

            <SliderField
              label="Monthly card spend"
              value={monthlyTotal}
              onChange={setMonthlyTotal}
              min={5000}
              max={500000}
              step={5000}
              format={formatINR}
            />

            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-widest text-ink-400">
                Spend allocation
              </div>
              <SliderField
                label="Online shopping"
                value={onlineShare}
                onChange={setOnlineShare}
                min={0}
                max={80}
                step={5}
                format={(v) => `${v}%`}
                compact
              />
              <SliderField
                label="Dining & food"
                value={diningShare}
                onChange={setDiningShare}
                min={0}
                max={50}
                step={5}
                format={(v) => `${v}%`}
                compact
              />
              <SliderField
                label="Fuel"
                value={fuelShare}
                onChange={setFuelShare}
                min={0}
                max={30}
                step={2}
                format={(v) => `${v}%`}
                compact
              />
              <SliderField
                label="Travel"
                value={travelShare}
                onChange={setTravelShare}
                min={0}
                max={50}
                step={5}
                format={(v) => `${v}%`}
                compact
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-widest text-ink-400">
                Constraints
              </div>
              <SliderField
                label="Max annual fee"
                value={maxFee}
                onChange={setMaxFee}
                min={0}
                max={20000}
                step={500}
                format={formatINR}
                compact
              />
              <SliderField
                label="Monthly income"
                value={income}
                onChange={setIncome}
                min={20000}
                max={500000}
                step={10000}
                format={formatINR}
                compact
              />
              <SliderField
                label="Credit score (CIBIL)"
                value={creditScore}
                onChange={setCreditScore}
                min={650}
                max={850}
                step={10}
                format={(v) => v.toString()}
                compact
              />
            </div>

            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-widest text-ink-400">
                Card type focus
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['cashback', 'travel', 'premium', 'zero-fee', 'rewards'].map((c) => (
                  <button
                    key={c}
                    onClick={() => toggleCategory(c)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition ${
                      selectedCategories.includes(c)
                        ? 'bg-copper-500/15 border-copper-500/40 text-copper-300'
                        : 'border-white/10 text-ink-300'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-ink-400">
                  Matched
                </div>
                <div className="font-display text-3xl text-ink-50 tabular">
                  {results.length} card{results.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-sm">
                <Sparkles className="w-4 h-4" />
                Updating live
              </div>
            </div>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {results.map((r, i) => (
                <motion.div
                  key={r.card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  className="relative"
                >
                  <CardTile
                    card={toTileCard(r.card, 0)} href={`/card/${r.card.slug}`}
                    rank={i + 1}
                  />
                  {r.approval_prob > 0 && (
                    <div className="absolute top-3 right-3 z-10 bg-ink-900/95 backdrop-blur border border-white/10 rounded px-2 py-1 text-[10px] font-mono">
                      <span className="text-ink-400">approval</span>{' '}
                      <span
                        className={
                          r.approval_prob >= 70
                            ? 'text-emerald-400'
                            : r.approval_prob >= 40
                            ? 'text-copper-400'
                            : 'text-crimson-400'
                        }
                      >
                        {r.approval_prob}%
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <DesignFooter />
      
    </main>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
  compact,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      <div className="flex justify-between items-baseline">
        <label className="text-xs text-ink-200">{label}</label>
        <span className="font-display text-sm text-copper-300 tabular">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-copper-400 cursor-pointer"
        style={{
          background: `linear-gradient(to right, rgb(212 163 115) 0%, rgb(212 163 115) ${
            ((value - min) / (max - min)) * 100
          }%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) 100%)`,
          height: 4,
          borderRadius: 2,
          appearance: 'none',
        }}
      />
    </div>
  );
}


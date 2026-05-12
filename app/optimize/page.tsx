'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CompareTray } from '@/components/CompareTray';
import { CardMockup } from '@/components/cards/CardMockup';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { optimizeRedemption } from '@/lib/redemption';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, Plane, ShoppingBag, CreditCard, Hotel, Package, ArrowDownRight } from 'lucide-react';
import { formatINR } from '@/lib/utils';

const TYPE_ICONS: Record<string, any> = {
  flight: Plane,
  hotel: Hotel,
  transfer: ArrowDownRight,
  cashback: CreditCard,
  voucher: ShoppingBag,
  product: Package,
  fuel: Package,
};

export default function OptimizePage() {
  const cardsWithRedemption = SEED_CARDS.filter((c) => c.redemption_options.length > 0);
  const [selectedCardId, setSelectedCardId] = useState(cardsWithRedemption[0].id);
  const [points, setPoints] = useState(50000);
  const [preference, setPreference] = useState<'any' | 'cash' | 'travel' | 'shopping'>('any');
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  const card = cardsWithRedemption.find((c) => c.id === selectedCardId)!;
  const recommendations = useMemo(
    () => optimizeRedemption(card, points, preference),
    [card, points, preference]
  );

  const bestValue = recommendations[0]?.inr_value ?? 0;
  const worstValue = recommendations[recommendations.length - 1]?.inr_value ?? 0;
  const valueRange = bestValue - worstValue;

  const fetchAIAdvice = async () => {
    setAiLoading(true);
    setAiAdvice('');
    try {
      const res = await fetch('/api/claude/redemption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, points, recommendations: recommendations.slice(0, 5) }),
      });
      const data = await res.json();
      setAiAdvice(data.advice || 'AI suggestion unavailable. Configure ANTHROPIC_API_KEY in environment.');
    } catch (e) {
      setAiAdvice('AI suggestion failed. Showing rule-based recommendations below.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="min-h-screen">
      <Header />

      <section className="pt-32 pb-8 grain relative">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-copper-500/8 blur-[120px] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <div className="divider-rule mb-6 max-w-xs">— Points optimizer</div>
            <h1 className="font-display text-5xl md:text-6xl leading-[1.05] text-ink-50">
              Don't let your points{' '}
              <span className="display-italic text-copper-400">rot</span> as statement credit.
            </h1>
            <p className="text-ink-300 mt-6 text-lg font-display leading-relaxed">
              Pick your card. Enter your balance. We rank every redemption path by rupee value —
              from the catalog haircut to KrisFlyer business class sweet spots.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[420px,1fr] gap-8">
          {/* Configurator */}
          <aside className="space-y-6">
            <div className="bg-ink-900/40 border border-white/10 rounded-xl p-6 space-y-6">
              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-ink-400 mb-2 block">
                  Select your card
                </label>
                <select
                  value={selectedCardId}
                  onChange={(e) => {
                    setSelectedCardId(e.target.value);
                    setAiAdvice('');
                  }}
                  className="w-full bg-ink-950 border border-white/10 rounded px-3 py-2.5 text-sm text-ink-100 focus:border-copper-500 outline-none cursor-pointer"
                >
                  {cardsWithRedemption.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="text-xs font-mono uppercase tracking-widest text-ink-400">
                    Points balance
                  </label>
                  <span className="font-display text-2xl text-copper-300 tabular">
                    {points.toLocaleString('en-IN')}
                  </span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={500000}
                  step={1000}
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value))}
                  className="w-full accent-copper-400 cursor-pointer"
                />
                <div className="flex justify-between mt-1.5 text-[10px] font-mono text-ink-500">
                  <span>1K</span>
                  <span>5L</span>
                </div>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                  className="w-full mt-3 bg-ink-950 border border-white/10 rounded px-3 py-2 text-sm text-ink-100 focus:border-copper-500 outline-none tabular"
                  placeholder="Exact points"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase tracking-widest text-ink-400 mb-2 block">
                  Preference
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['any', 'travel', 'cash', 'shopping'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPreference(p)}
                      className={`text-xs px-3 py-2 rounded border capitalize transition ${
                        preference === p
                          ? 'bg-copper-500/15 border-copper-500/40 text-copper-300'
                          : 'border-white/10 text-ink-300 hover:border-white/20'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={fetchAIAdvice}
                disabled={aiLoading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Strategizing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Get AI strategy
                  </>
                )}
              </button>
            </div>

            {/* Card preview */}
            <div className="flex justify-center">
              <CardMockup card={card} size="md" />
            </div>
          </aside>

          {/* Results */}
          <div className="space-y-6">
            {/* Value spread visualization */}
            <div className="bg-ink-900/40 border border-white/10 rounded-xl p-6">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-ink-400">
                    Best redemption
                  </div>
                  <div className="font-display text-4xl text-emerald-300 tabular glow-emerald">
                    {formatINR(bestValue)}
                  </div>
                  <div className="text-xs text-ink-400 mt-1">
                    {recommendations[0]?.option.partner ?? recommendations[0]?.option.type}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono uppercase tracking-widest text-ink-400">
                    Worst case
                  </div>
                  <div className="font-display text-2xl text-crimson-400 tabular">
                    {formatINR(worstValue)}
                  </div>
                  <div className="text-xs text-ink-400 mt-1">
                    Value gap:{' '}
                    <span className="text-copper-300 tabular">{formatINR(valueRange)}</span>
                  </div>
                </div>
              </div>
              <div className="h-1.5 bg-white/5 rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-crimson-500 via-copper-400 to-emerald-400"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="mt-2 text-[10px] font-mono uppercase tracking-widest text-ink-500">
                Your potential leverage by picking right
              </div>
            </div>

            {/* AI advice */}
            {aiAdvice && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-copper-500/10 to-copper-500/5 border border-copper-500/30 rounded-xl p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-copper-400" />
                  <span className="text-xs font-mono uppercase tracking-widest text-copper-300">
                    AI strategy
                  </span>
                </div>
                <div className="prose prose-invert prose-sm max-w-none text-ink-100 font-display leading-relaxed whitespace-pre-wrap">
                  {aiAdvice}
                </div>
              </motion.div>
            )}

            {/* Redemption options ranked */}
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase tracking-widest text-ink-400">
                All redemption paths · ranked by INR value
              </div>
              {recommendations.map((r, i) => {
                const Icon = TYPE_ICONS[r.option.type] ?? Package;
                const percent = (r.inr_value / bestValue) * 100;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-ink-900/40 border border-white/10 rounded-lg p-4 relative overflow-hidden"
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-copper-500/10 to-transparent pointer-events-none"
                      style={{ width: `${percent}%` }}
                    />
                    <div className="relative flex items-center gap-4">
                      <div className="font-display text-2xl text-ink-500 tabular w-8">
                        {i + 1}
                      </div>
                      <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center text-copper-400 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-ink-100 capitalize">
                          {r.option.partner || r.option.type}
                        </div>
                        <div className="text-xs text-ink-400 truncate">
                          {r.option.best_for ?? r.option.notes ?? `${r.option.type} redemption`}
                          {' · '}
                          <span className="font-mono tabular">
                            {r.option.value_per_point_inr.toFixed(2)}/pt
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display text-xl text-ink-50 tabular">
                          {formatINR(r.inr_value)}
                        </div>
                        {i === 0 ? (
                          <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                            best value
                          </div>
                        ) : (
                          <div className="text-[10px] font-mono text-ink-500">
                            -{formatINR(bestValue - r.inr_value)} vs best
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <CompareTray />
    </main>
  );
}

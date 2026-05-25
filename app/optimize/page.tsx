'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CompareTray } from '@/components/CompareTray';
import { CardMockup } from '@/components/cards/CardMockup';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { optimizeRedemption } from '@/lib/redemption';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Plane, ShoppingBag, CreditCard, Hotel, Package, ArrowDownRight } from 'lucide-react';
import { formatINR } from '@/lib/utils';

const TYPE_ICONS: Record<string, any> = {
  flight: Plane, hotel: Hotel, transfer: ArrowDownRight,
  cashback: CreditCard, voucher: ShoppingBag, product: Package, fuel: Package,
};

function OptimizeContent() {
  const allCards = SEED_CARDS.filter((c) => c.active).sort((a, b) => a.name.localeCompare(b.name));
  const [cardSearch, setCardSearch] = useState('');
  const filteredCards = cardSearch.trim() ? allCards.filter(c => c.name.toLowerCase().includes(cardSearch.toLowerCase()) || c.bank.toLowerCase().includes(cardSearch.toLowerCase())) : allCards;
  const defaultCard = allCards.find(c => c.id === 'hdfc-regalia-gold') ?? allCards.find(c => (c as any).bank === 'HDFC') ?? allCards[0];
  const [selectedCardId, setSelectedCardId] = useState(defaultCard.id);
  const [points, setPoints] = useState(50000);
  const [preference, setPreference] = useState<'any' | 'cash' | 'travel' | 'shopping'>('any');
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const urlPoints = searchParams.get('points');
    const urlBank = searchParams.get('bank');
    if (urlPoints) {
      const p = parseInt(urlPoints.replace(/,/g, ''), 10);
      if (!isNaN(p) && p > 0) setPoints(p);
    }
    if (urlBank) {
      const bankName = urlBank.replace(/-/g, ' ').replace(' Bank', '');
      const match = allCards.find(c =>
        c.bank.toLowerCase() === bankName.toLowerCase() ||
        c.name.toLowerCase().includes(bankName.toLowerCase())
      );
      if (match) setSelectedCardId(match.id);
    }
  }, [searchParams]);

  const card = allCards.find((c) => c.id === selectedCardId)!;
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
      setAiAdvice(data.advice || 'AI strategy unavailable. See redemption paths below.');
    } catch {
      setAiAdvice('AI suggestion failed. See redemption paths below.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="min-h-screen" style={{ overflowX: 'hidden' }}>
      <Header />

      {/* Hero */}
      <section className="pt-20 pb-6 px-4 grain relative" style={{ overflow: 'hidden' }}>
        <div className="divider-rule mb-4 max-w-xs">Points optimizer</div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl leading-[1.05] text-ink-50 mb-3">
          {"Don't let your points "}
          <em className="text-copper-400 not-italic display-italic">rot</em>
          {" as statement credit."}
        </h1>
        <p className="text-sm sm:text-base text-ink-300 font-display leading-relaxed max-w-2xl">
          Pick your card. Enter your balance. We rank every redemption path by rupee value.
        </p>
      </section>

      <section className="pb-16 px-4" style={{ maxWidth: '100vw', overflow: 'hidden' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:grid lg:grid-cols-[400px,1fr] gap-6">

            {/* CONFIGURATOR */}
            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              <div className="bg-ink-900/40 border border-white/10 rounded-xl p-4 space-y-5">

                {/* Card selector with search */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-ink-400 mb-1.5 block">
                    Select your card
                  </label>
                  <input
                    type="text"
                    value={cardSearch}
                    onChange={e => setCardSearch(e.target.value)}
                    placeholder="Search card or bank..."
                    style={{ width: '100%', padding: '8px 12px', marginBottom: 6, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }}
                  />
                  <select
                    value={selectedCardId}
                    onChange={(e) => { setSelectedCardId(e.target.value); setAiAdvice(''); }}
                    style={{
                      width: '100%',
                      background: '#0a0a0b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      padding: '10px 12px',
                      fontSize: 14,
                      color: '#f5f5f6',
                      outline: 'none',
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23888' d='M6 8L0 0h12z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      paddingRight: 36,
                      maxWidth: '100%',
                    }}
                  >
                    {filteredCards.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Points */}
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <label className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
                      Points balance
                    </label>
                    <span className="font-display text-xl text-copper-300 tabular">
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
                    style={{ width: '100%' }}
                  />
                  <div className="flex justify-between mt-1 text-[10px] font-mono text-ink-500">
                    <span>1K</span><span>5L</span>
                  </div>
                  <input
                    type="text"
                    value={points.toLocaleString('en-IN')}
                    onChange={(e) => { const v = parseInt(e.target.value.replace(/,/g, '')) || 0; setPoints(v); }}
                    style={{
                      width: '100%',
                      marginTop: 8,
                      background: '#0a0a0b',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      padding: '8px 12px',
                      fontSize: 14,
                      color: '#f5f5f6',
                      outline: 'none',
                    }}
                    placeholder="Or type exact points"
                  />
                </div>

                {/* Preference */}
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-widest text-ink-400 mb-2 block">
                    Redemption preference
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['any', 'travel', 'cash', 'shopping'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPreference(p)}
                        style={{
                          padding: '10px',
                          borderRadius: 6,
                          border: preference === p ? '1px solid rgba(212,163,115,0.5)' : '1px solid rgba(255,255,255,0.1)',
                          background: preference === p ? 'rgba(212,163,115,0.12)' : 'transparent',
                          color: preference === p ? '#d4a373' : '#9b9ba2',
                          fontSize: 13,
                          fontWeight: preference === p ? 600 : 400,
                          textTransform: 'capitalize',
                          cursor: 'pointer',
                          minHeight: 44,
                          touchAction: 'manipulation',
                          WebkitTapHighlightColor: 'transparent',
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI button */}
                <button
                  onClick={fetchAIAdvice}
                  disabled={aiLoading}
                  className="w-full btn-primary"
                  style={{ opacity: aiLoading ? 0.6 : 1 }}
                >
                  {aiLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Strategizing...</>
                    : <><Sparkles className="w-4 h-4" /> Get AI strategy</>
                  }
                </button>
              </div>

              {/* Card preview - hidden on mobile */}
              <div className="hidden sm:flex justify-center">
                <div style={{ width: '80%', maxWidth: 280 }}>
                  <CardMockup card={card} size="md" />
                </div>
              </div>
            </aside>

            {/* RESULTS */}
            <div className="space-y-4 min-w-0">

              {/* Value spread */}
              <div className="bg-ink-900/40 border border-white/10 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
                      Best redemption
                    </div>
                    <div className="font-display text-3xl sm:text-4xl text-emerald-300 tabular glow-emerald">
                      {formatINR(bestValue)}
                    </div>
                    <div className="text-xs text-ink-400 mt-0.5 truncate max-w-[200px]">
                      {recommendations[0]?.option.partner ?? recommendations[0]?.option.type}
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-ink-400">Worst case</div>
                    <div className="font-display text-xl text-crimson-400 tabular">{formatINR(worstValue)}</div>
                    <div className="text-[10px] text-ink-400">
                      Gap: <span className="text-copper-300">{formatINR(valueRange)}</span>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 bg-white/5 rounded overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-crimson-500 via-copper-400 to-emerald-400 w-full" />
                </div>
                <div className="mt-1.5 text-[10px] font-mono uppercase tracking-widest text-ink-500">
                  Your potential leverage by picking right
                </div>
              </div>

              {/* AI advice */}
              <AnimatePresence>
                {aiAdvice && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-copper-500/10 border border-copper-500/30 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-copper-400 shrink-0" />
                      <span className="text-[10px] font-mono uppercase tracking-widest text-copper-300">AI strategy</span>
                    </div>
                    <p className="text-sm text-ink-100 font-display leading-relaxed whitespace-pre-wrap">{aiAdvice}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Redemption paths */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-ink-400 mb-3">
                  All redemption paths &middot; ranked by value
                </div>
                <div className="space-y-2">
                  {recommendations.map((r, i) => {
                    const Icon = TYPE_ICONS[r.option.type] ?? Package;
                    const percent = bestValue > 0 ? (r.inr_value / bestValue) * 100 : 0;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="bg-ink-900/40 border border-white/10 rounded-lg overflow-hidden"
                        style={{ position: 'relative' }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            width: `${percent}%`,
                            background: 'linear-gradient(to right, rgba(212,163,115,0.08), transparent)',
                            pointerEvents: 'none',
                          }}
                        />
                        <div className="relative flex items-center gap-3 p-3">
                          <div className="font-display text-lg text-ink-500 tabular w-6 shrink-0 text-center">
                            {i + 1}
                          </div>
                          <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-copper-400 shrink-0">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-ink-100 truncate">
                              {r.option.partner || r.option.type}
                            </div>
                            <div className="text-[11px] text-ink-400 truncate">
                              {r.option.best_for ?? r.option.notes ?? `${r.option.type} redemption`}
                              {' . '}
                              <span className="font-mono">Rs.{r.option.value_per_point_inr.toFixed(2)}/pt</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-1">
                            <div className="font-display text-base sm:text-lg text-ink-50 tabular">
                              {formatINR(r.inr_value)}
                            </div>
                            {i === 0 ? (
                              <div className="text-[9px] font-mono uppercase text-emerald-400">best</div>
                            ) : (
                              <div className="text-[9px] font-mono text-ink-500">-{formatINR(bestValue - r.inr_value)}</div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


          {/* Trip Planner CTA */}
          {bestValue > 0 && (
            <div className="mt-6 rounded-2xl p-5 border" style={{ borderColor: 'rgba(201,151,46,0.3)', background: 'rgba(201,151,46,0.06)' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: '#C9972E' }}>
                    Next step
                  </div>
                  <div className="font-semibold text-base" style={{ color: 'var(--text, #0f172a)' }}>
                    Plan a trip with your {points.toLocaleString('en-IN')} points
                  </div>
                  <div className="text-sm mt-0.5" style={{ color: 'var(--text-muted, #64748b)' }}>
                    Best value: {formatINR(bestValue)} via travel redemption
                  </div>
                </div>
                <Link
                  href={`/trip-planner?points=${points}&bank=${card?.bank || ''}`}
                  className="shrink-0 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                  style={{ background: '#C9972E', color: '#fff', whiteSpace: 'nowrap' }}
                >
                  Plan my trip →























                </Link>
              </div>
            </div>
          )}

          {/* Trip Planner CTA */}
          {bestValue > 0 && (
            <div className="mt-6 rounded-2xl p-5 border" style={{ borderColor: 'rgba(201,151,46,0.3)', background: 'rgba(201,151,46,0.06)' }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: '#C9972E' }}>
                    Next step
                  </div>
                  <div className="font-semibold text-base" style={{ color: 'var(--text, #0f172a)' }}>
                    Plan a trip with your {points.toLocaleString('en-IN')} points
                  </div>
                  <div className="text-sm mt-0.5" style={{ color: 'var(--text-muted, #64748b)' }}>
                    Best value: {formatINR(bestValue)} via travel redemption
                  </div>
                </div>
                <Link
                  href={`/trip-planner?points=${points}&bank=${card?.bank || ''}`}
                  className="shrink-0 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                  style={{ background: '#C9972E', color: '#fff', whiteSpace: 'nowrap' }}
                >
                  Plan my trip →























                </Link>
              </div>
            </div>
          )}
      <Footer />
      <CompareTray />
    </main>
  );
}

export default function OptimizePage() {
  return <Suspense fallback={null}><OptimizeContent /></Suspense>;
}


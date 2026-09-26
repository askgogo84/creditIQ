'use client';

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { DesignFooter } from '@/components/design/Footer';
import { CreditCard3D } from '@/components/design/CreditCard3D';
import type { calculateAdvisor } from '@/lib/redemption-engine/advisor';
import { usableHotels } from '@/lib/data/hotel-seed';
import { authedFetch } from '@/lib/authed-fetch';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { formatINR } from '@/lib/utils';
import { SectionTabs } from '@/components/ciq/SectionTabs';
import './redemption-advisor.css';

function OptimizeContent() {
  const [allCards, setAllCards] = useState<Array<{ id: string; cardName: string; bank: string }>>([]);
  const [cardSearch, setCardSearch] = useState('');
  const filteredCards = allCards.filter(c => `${c.cardName} ${c.bank}`.toLowerCase().includes(cardSearch.toLowerCase()));
  const [selectedCardId, setSelectedCardId] = useState('');
  const [evidence, setEvidence] = useState<ReturnType<typeof calculateAdvisor> | null>(null);
  const [bookingId, setBookingId] = useState('');
  const points = evidence?.balance.points ?? null;
  const capturedHotels = usableHotels().filter(h => h.programme_id === 'accor-all');
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    let active = true;
    authedFetch('/api/cockpit/summary').then(async res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => { if (active) { setAllCards(data.cards); setSelectedCardId(data.cards[0]?.id ?? ''); if (!data.cards.length) setAiAdvice('No wallet cards yet. Add a card to check redemption readiness.'); } })
      .catch(() => { if (active) setAiAdvice('Wallet temporarily unavailable.'); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!selectedCardId) return;
    let active = true;
    setAiLoading(true); setAiAdvice(''); setEvidence(null);
    authedFetch('/api/claude/redemption', { method: 'POST', body: JSON.stringify({ walletCardId: selectedCardId, ...(bookingId ? { bookingId } : {}) }) })
      .then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Redemption evidence unavailable.'); return data; })
      .then(data => { if (active) { setEvidence(data); setAiAdvice(data.advice); } })
      .catch(error => { if (active) setAiAdvice(error.message); })
      .finally(() => { if (active) setAiLoading(false); });
    return () => { active = false; };
  }, [selectedCardId, bookingId]);

  return (
    <main className="min-h-screen redemption-advisor" style={{ overflowX: 'hidden' }}>
      {/* Hero */}
      <section className="pt-20 pb-6 px-4 grain relative" style={{ overflow: 'hidden' }}>
        <div className="divider-rule mb-4 max-w-xs">Points optimizer</div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl leading-[1.05] text-ink-50 mb-3">
          {"Explore your points with "}
          <span className="text-copper-400">sourced evidence.</span>
        </h1>
        <p className="text-sm sm:text-base text-ink-300 font-display leading-relaxed max-w-2xl">
          Select a card held in your wallet. Server evidence supplies your balance and booking comparisons.
        </p>
      </section>

      <section className="pb-16 px-4" style={{ maxWidth: '100vw', overflow: 'hidden' }}>
        <div className="max-w-7xl mx-auto">
          <SectionTabs />
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
                    style={{ width: '100%', minHeight: 44, padding: '8px 12px', marginBottom: 6, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text)', outline: 'none' }}
                  />
                  <select
                    value={selectedCardId}
                    onChange={(e) => { setSelectedCardId(e.target.value); setAiAdvice(''); }}
                    style={{
                      width: '100%',
                      minHeight: 44,
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
                      <option key={c.id} value={c.id}>{c.cardName}</option>
                    ))}
                  </select>
                </div>

                <div><label className="text-[10px] font-mono uppercase tracking-widest text-ink-400">Owned wallet balance</label><p className="font-display text-xl text-copper-300">{aiLoading ? 'Loading…' : points === null ? 'Unknown / unavailable' : points.toLocaleString('en-IN')}</p><p className="text-xs text-ink-400">{evidence ? `${evidence.balance.currency} · ${evidence.balance.source} · ${evidence.balance.observedAt ?? 'date unknown'}` : 'A matching owned wallet card is required.'}</p></div>
                <div><label htmlFor="booking" className="text-[10px] font-mono uppercase tracking-widest text-ink-400">Captured booking comparison (optional)</label><select id="booking" value={bookingId} onChange={e => setBookingId(e.target.value)} style={{ width: '100%', minHeight: 44, background: '#0a0a0b', color: '#f5f5f6', padding: 10, borderRadius: 6 }}><option value="">No booking — readiness only</option>{capturedHotels.map(h => <option key={h.id} value={h.id}>{h.name} · captured stay</option>)}</select><p className="text-xs text-ink-400 mt-2">Captured starting-from member rates for 12 Oct 2026, 3 nights, 2 adults, 1 room. Not live offers.</p></div>
                <div role="status" className="w-full btn-primary" style={{ minHeight: 44 }}>{aiLoading ? 'Loading server evidence…' : 'Server-calculated evidence'}</div>
              </div>

              {/* Card preview - hidden on mobile */}
              <div className="hidden sm:flex justify-center">
                <div style={{ width: '80%', maxWidth: 280 }}>
                  <CreditCard3D variant='obsidian' name={allCards.find(c => c.id === selectedCardId)?.cardName ?? 'Your card'} bank={allCards.find(c => c.id === selectedCardId)?.bank ?? ''} tagline='' />
                </div>
              </div>
            </aside>

            {/* RESULTS */}
            <div className="space-y-4 min-w-0">

              <div className="bg-ink-900/40 border border-white/10 rounded-xl p-4"><div className="text-[10px] font-mono uppercase tracking-widest text-ink-400">Wallet value unavailable</div><p className="font-display text-xl mt-2">Value depends on the redemption and booking.</p><p className="text-sm mt-2">{evidence?.readiness.reason ?? 'Select an owned card to load sourced readiness.'}</p></div>

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
                      <span className="text-[10px] font-mono uppercase tracking-widest text-copper-300">Server evidence</span>
                    </div>
                    <p className="text-sm text-ink-100 font-display leading-relaxed whitespace-pre-wrap">{aiAdvice}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div><div className="text-[10px] font-mono uppercase tracking-widest text-ink-400 mb-3">Booking-specific results</div>
                {evidence?.booking && <p className="text-sm mb-3">{evidence.booking.basis} Captured {evidence.booking.capturedAt} · {evidence.booking.source}</p>}
                {evidence?.fx && <p className="text-xs mb-3">FX: {evidence.fx.source} · rate date {evidence.fx.as_of ?? 'unavailable'} · retrieved {evidence.fx.fetched_at}</p>}
                <div className="space-y-2">{evidence?.plan?.candidates.map((candidate, i) => <div key={i} className="bg-ink-900/40 border border-white/10 rounded-lg p-3"><b>{candidate.kind === 'PROGRAMME' ? 'Programme scenario — conditional' : candidate.kind}</b><p className="text-sm">{candidate.kind === 'PROGRAMME' && candidate.instructionBlocked ? 'Exact programme payable amount and transfer instruction withheld.' : candidate.cashPayableMinor === null ? 'Payable amount unavailable.' : `Booking cash payable: ${formatINR(candidate.cashPayableMinor / 100)}`}</p>{candidate.instructionBlocked && <p className="text-xs">{candidate.instructionBlocked.replaceAll('_', ' ')}</p>}</div>) ?? <p className="text-sm">Select a supported card and captured booking for a server-calculated comparison.</p>}</div>
                {evidence?.readiness.ratio && <a href={evidence.readiness.ratio.source_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44 }} className="text-sm">Issuer ratio source · {evidence.readiness.ratio.as_of}</a>}
              </div>
            </div>
          </div>
        </div>
      </section>


          <div className="mt-6 rounded-2xl p-5 border"><Link href="/trip-planner" className="inline-flex items-center px-5 rounded-xl" style={{ minHeight: 44 }}>Plan a trip →</Link></div>
      <DesignFooter />
      
    </main>
  );
}

export default function OptimizePage() {
  return <Suspense fallback={null}><OptimizeContent /></Suspense>;
}


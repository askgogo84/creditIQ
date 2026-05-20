'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CreditCard, Plus, TrendingUp, Plane, Star, Bell, ArrowRight, Zap, RefreshCw, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { SEED_CARDS } from '@/lib/data/seed-cards';

interface LinkedCard {
  id: string;
  cardId: string;
  cardName: string;
  bank: string;
  color: string;
  maskedNumber: string;
  points: number;
  pointsValue: number;
  lastSynced: string;
  rewardCurrency: string;
}

// Mock data for demo — replaced by real AA data once integrated
const MOCK_LINKED_CARDS: LinkedCard[] = [
  { id: '1', cardId: 'hdfc-infinia', cardName: 'HDFC Infinia Metal Edition', bank: 'HDFC', color: '#1a1a1a', maskedNumber: '•••• 4821', points: 87500, pointsValue: 157500, lastSynced: '2 hours ago', rewardCurrency: 'Reward Points' },
  { id: '2', cardId: 'axis-magnus-burgundy', cardName: 'Axis Magnus for Burgundy', bank: 'Axis', color: '#7c1d3a', maskedNumber: '•••• 3345', points: 45200, pointsValue: 90400, lastSynced: '2 hours ago', rewardCurrency: 'EDGE Miles' },
  { id: '3', cardId: 'amex-platinum-travel', cardName: 'Amex Platinum Travel', bank: 'AmEx', color: '#006fcf', maskedNumber: '•••• 9012', points: 32000, pointsValue: 45000, lastSynced: '5 hours ago', rewardCurrency: 'Membership Rewards' },
];

const REDEMPTION_IDEAS = [
  { title: 'Singapore Business Class', points: '1,20,000 pts', value: '₹2.4L+', bank: 'HDFC → KrisFlyer', tag: 'Best value', color: '#059669' },
  { title: 'Marriott Jaipur (2 nights)', points: '60,000 pts', value: '₹18,000', bank: 'HDFC → Marriott', tag: 'Hotel', color: '#0473ea' },
  { title: 'Hyderabad → Dubai flight', points: '45,200 miles', value: '₹12,000', bank: 'Axis EDGE', tag: 'Flight', color: '#7c1d3a' },
  { title: 'Taj Mahal Palace Mumbai', points: '32,000 MR', value: '₹8,500', bank: 'Amex → Taj', tag: 'Hotel', color: '#d97706' },
];

export default function DashboardPage() {
  const [isPremium, setIsPremium] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(7);
  const [syncing, setSyncing] = useState(false);

  const totalPoints = MOCK_LINKED_CARDS.reduce((s, c) => s + c.points, 0);
  const totalValue = MOCK_LINKED_CARDS.reduce((s, c) => s + c.pointsValue, 0);

  const handleSync = async () => {
    setSyncing(true);
    await new Promise(r => setTimeout(r, 2000));
    setSyncing(false);
  };

  return (
    <main className="min-h-screen" style={{ overflowX: 'hidden' }}>
      <Header />
      <section className="pt-24 pb-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">

          {/* Trial banner */}
          {!isPremium && (
            <div className="rounded-xl p-4 mb-6 flex items-center justify-between flex-wrap gap-3" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  Free trial — <strong>{trialDaysLeft} days remaining</strong>. All premium features unlocked.
                </span>
              </div>
              <Link href="/premium" className="btn-primary text-xs py-2 px-4" style={{ minHeight: 32 }}>
                Upgrade to Premium →
              </Link>
            </div>
          )}

          {/* Header row */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="font-display text-3xl sm:text-4xl" style={{ color: 'var(--text)' }}>My Card Portfolio</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>All your cards. All your points. One view.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleSync} disabled={syncing} className="btn-ghost text-sm py-2 px-4 flex items-center gap-2" style={{ minHeight: 40 }}>
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync all'}
              </button>
              <Link href="/link-card" className="btn-primary text-sm py-2 px-4 flex items-center gap-2" style={{ minHeight: 40 }}>
                <Plus className="w-4 h-4" />
                Link a card
              </Link>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { l: 'Total points (combined)', v: totalPoints.toLocaleString('en-IN'), sub: 'across all cards', color: 'var(--accent)' },
              { l: 'Combined value', v: `₹${(totalValue/1000).toFixed(0)}K`, sub: 'at best redemption', color: 'var(--emerald)' },
              { l: 'Cards linked', v: `${MOCK_LINKED_CARDS.length}`, sub: 'of your cards', color: 'var(--text)' },
              { l: 'Best redemption', v: 'BOM-SIN Biz', sub: 'via KrisFlyer', color: 'var(--accent)' },
            ].map(s => (
              <div key={s.l} className="rounded-xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <div className="text-[10px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>{s.l}</div>
                <div className="font-display text-2xl" style={{ color: s.color }}>{s.v}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1fr,380px] gap-6">

            {/* Cards list */}
            <div className="space-y-4">
              <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
                Linked cards · {MOCK_LINKED_CARDS.length} active
              </div>

              {MOCK_LINKED_CARDS.map(card => (
                <div key={card.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                  <div className="flex items-center gap-4 p-4">
                    {/* Card color strip */}
                    <div className="w-12 h-12 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ background: card.color }}>
                      {card.bank.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate" style={{ color: 'var(--text)' }}>{card.cardName}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{card.maskedNumber} · Synced {card.lastSynced}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display text-xl tabular" style={{ color: 'var(--accent)' }}>
                        {card.points.toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{card.rewardCurrency}</div>
                    </div>
                  </div>
                  <div className="px-4 pb-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="text-xs pt-3" style={{ color: 'var(--emerald)' }}>
                      Best value: ₹{(card.pointsValue/1000).toFixed(0)}K at optimal redemption
                    </div>
                    <Link href={`/optimize?card=${card.cardId}&points=${card.points}`} className="text-xs pt-3 flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                      Optimize <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}

              {/* Add card CTA */}
              <Link href="/link-card" className="rounded-xl border-2 border-dashed p-6 flex items-center justify-center gap-3 transition-colors block" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
                <Plus className="w-5 h-5" />
                <span className="text-sm">Link another card</span>
              </Link>
            </div>

            {/* Right panel — redemption ideas */}
            <div className="space-y-4">
              <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
                Top redemption opportunities
              </div>
              {REDEMPTION_IDEAS.map((r, i) => (
                <div key={i} className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{r.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{r.bank}</div>
                    </div>
                    <div className="text-[10px] font-mono uppercase px-2 py-1 rounded shrink-0" style={{ background: `${r.color}20`, color: r.color }}>
                      {r.tag}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>{r.points}</div>
                    <div className="font-display text-base" style={{ color: 'var(--emerald)' }}>{r.value}</div>
                  </div>
                  <button className="w-full mt-3 py-2 rounded text-xs font-medium transition-colors" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
                    Book with points →
                  </button>
                </div>
              ))}

              {/* Portfolio optimizer CTA */}
              <div className="rounded-xl p-4 border" style={{ borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)', background: 'color-mix(in srgb, var(--accent) 6%, transparent)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Portfolio optimizer</span>
                </div>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                  Which card earns most on groceries? On dining? On fuel? AI analyses your full portfolio.
                </p>
                <Link href="/optimize" className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                  Run full analysis <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

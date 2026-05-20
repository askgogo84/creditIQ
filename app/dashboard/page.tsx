'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Plus, TrendingUp, Plane, ArrowRight, Zap, RefreshCw, Building2 } from 'lucide-react';
import Link from 'next/link';

const MOCK_LINKED_CARDS = [
  { id: '1', cardId: 'hdfc-infinia', cardName: 'HDFC Infinia Metal Edition', bank: 'HDFC', color: '#1a1a1a', maskedNumber: '•••• 4821', points: 87500, pointsValue: 157500, lastSynced: '2 hours ago', rewardCurrency: 'Reward Points' },
  { id: '2', cardId: 'axis-magnus-burgundy', cardName: 'Axis Magnus for Burgundy', bank: 'Axis', color: '#7c1d3a', maskedNumber: '•••• 3345', points: 45200, pointsValue: 90400, lastSynced: '2 hours ago', rewardCurrency: 'EDGE Miles' },
  { id: '3', cardId: 'amex-platinum-travel', cardName: 'Amex Platinum Travel', bank: 'AmEx', color: '#006fcf', maskedNumber: '•••• 9012', points: 32000, pointsValue: 45000, lastSynced: '5 hours ago', rewardCurrency: 'Membership Rewards' },
];

const REDEMPTION_IDEAS = [
  { title: 'Singapore Business Class', points: '1,20,000 pts', value: '₹2.4L+', bank: 'HDFC → KrisFlyer', tag: 'Best value', color: '#059669' },
  { title: 'Marriott Jaipur (2 nights)', points: '60,000 pts', value: '₹18,000', bank: 'HDFC → Marriott', tag: 'Hotel', color: '#0473ea' },
  { title: 'HYD → Dubai flight', points: '45,200 miles', value: '₹12,000', bank: 'Axis EDGE', tag: 'Flight', color: '#7c1d3a' },
  { title: 'Taj Mahal Palace Mumbai', points: '32,000 MR', value: '₹8,500', bank: 'Amex → Taj', tag: 'Hotel', color: '#d97706' },
];

export default function DashboardPage() {
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
      <section className="pt-20 pb-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          {/* Trial banner */}
          <div className="rounded-xl p-4 mb-5 flex items-start sm:items-center justify-between flex-wrap gap-3" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}>
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
              <span className="text-sm" style={{ color: 'var(--text)' }}>
                Free trial — <strong>7 days remaining.</strong> All premium features unlocked.
              </span>
            </div>
            <Link href="/premium" className="btn-primary text-xs py-2 px-4 shrink-0" style={{ minHeight: 36 }}>
              Upgrade to Premium →
            </Link>
          </div>

          {/* Page header */}
          <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl" style={{ color: 'var(--text)' }}>My Card Portfolio</h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>All your cards. All your points. One view.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSync} disabled={syncing} className="btn-ghost text-sm py-2 px-3 flex items-center gap-1.5" style={{ minHeight: 40 }}>
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync all'}</span>
              </button>
              <Link href="/link-card" className="btn-primary text-sm py-2 px-3 flex items-center gap-1.5" style={{ minHeight: 40 }}>
                <Plus className="w-3.5 h-3.5" />
                Link a card
              </Link>
            </div>
          </div>

          {/* Stats — 2x2 on mobile, 4-col on desktop */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>Total points (combined)</div>
              <div className="font-display text-2xl tabular" style={{ color: 'var(--accent)' }}>{totalPoints.toLocaleString('en-IN')}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>across all cards</div>
            </div>
            <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>Combined value</div>
              <div className="font-display text-2xl tabular" style={{ color: 'var(--emerald)' }}>₹{Math.round(totalValue / 1000)}K</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>at best redemption</div>
            </div>
            <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>Cards linked</div>
              <div className="font-display text-2xl tabular" style={{ color: 'var(--text)' }}>{MOCK_LINKED_CARDS.length}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>active accounts</div>
            </div>
            <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>Best redemption</div>
              <div className="font-display text-lg leading-tight" style={{ color: 'var(--accent)' }}>BOM→SIN Biz</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>via KrisFlyer</div>
            </div>
          </div>

          {/* Linked cards */}
          <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
            Linked cards · {MOCK_LINKED_CARDS.length} active
          </div>
          <div className="space-y-3 mb-6">
            {MOCK_LINKED_CARDS.map(card => (
              <div key={card.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <div className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ background: card.color }}>
                    {card.bank.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{card.cardName}</div>
                    <div className="text-xs" style={{ color: 'var(--text-dim)' }}>{card.maskedNumber} · {card.lastSynced}</div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="font-display text-lg tabular" style={{ color: 'var(--accent)' }}>{card.points.toLocaleString('en-IN')}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{card.rewardCurrency}</div>
                  </div>
                </div>
                <div className="px-4 pb-3 pt-2 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                  <div className="text-xs" style={{ color: 'var(--emerald)' }}>
                    Best value: ₹{(card.pointsValue / 1000).toFixed(0)}K
                  </div>
                  <Link href={`/optimize?card=${card.cardId}&points=${card.points}`} className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                    Optimize <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}

            <Link href="/link-card" className="rounded-xl border-2 border-dashed p-5 flex items-center justify-center gap-2 block" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
              <Plus className="w-4 h-4" />
              <span className="text-sm">Link another card</span>
            </Link>
          </div>

          {/* Redemption opportunities */}
          <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
            Top redemption opportunities
          </div>
          <div className="space-y-3 mb-6">
            {REDEMPTION_IDEAS.map((r, i) => (
              <div key={i} className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{r.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{r.bank}</div>
                  </div>
                  <div className="text-[10px] font-mono uppercase px-2 py-1 rounded shrink-0" style={{ background: `${r.color}20`, color: r.color }}>
                    {r.tag}
                  </div>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>{r.points}</div>
                  <div className="font-display text-base" style={{ color: 'var(--emerald)' }}>{r.value}</div>
                </div>
                <button className="w-full py-2.5 rounded-lg text-xs font-medium" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
                  Book with points →
                </button>
              </div>
            ))}
          </div>

          {/* Portfolio optimizer */}
          <div className="rounded-xl p-4 border" style={{ borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)', background: 'color-mix(in srgb, var(--accent) 6%, transparent)' }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>Portfolio optimizer</span>
            </div>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Which card earns most on groceries, dining, fuel, travel? AI analyses your full card mix.
            </p>
            <Link href="/optimize" className="text-sm font-medium flex items-center gap-1" style={{ color: 'var(--accent)' }}>
              Run full analysis <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </section>
      <Footer />
    </main>
  );
}

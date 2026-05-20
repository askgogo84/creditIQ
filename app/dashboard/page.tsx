'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Plus, TrendingUp, ArrowRight, Zap, RefreshCw, FileText, MessageSquare, LogOut } from 'lucide-react';
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
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/login');
      else { setUser(user); setLoading(false); }
    });
  }, []);

  const signOut = async () => {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
    await supabase.auth.signOut();
    router.replace('/');
  };

  const handleSync = async () => {
    setSyncing(true);
    await new Promise(r => setTimeout(r, 2000));
    setSyncing(false);
  };

  const totalPoints = MOCK_LINKED_CARDS.reduce((s, c) => s + c.points, 0);
  const totalValue = MOCK_LINKED_CARDS.reduce((s, c) => s + c.pointsValue, 0);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-copper-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Loading your portfolio...</p>
        </div>
      </main>
    );
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <main className="min-h-screen" style={{ overflowX: 'hidden' }}>
      <Header />
      <section className="pt-20 pb-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          {/* User greeting */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl" style={{ color: 'var(--text)' }}>
                Hey {firstName} 👋
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {user?.email} · Your card portfolio
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleSync} disabled={syncing} className="btn-ghost text-sm py-2 px-3 flex items-center gap-1.5" style={{ minHeight: 40 }}>
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sync</span>
              </button>
              <button onClick={signOut} className="btn-ghost text-sm py-2 px-3 flex items-center gap-1.5" style={{ minHeight: 40 }}>
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>

          {/* Import points options */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <Link href="/upload-statement" className="rounded-xl border p-4 flex items-center gap-3 transition-all" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
                <FileText className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>Upload statement</div>
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>PDF → instant points</div>
              </div>
            </Link>
            <Link href="/sms-import" className="rounded-xl border p-4 flex items-center gap-3 transition-all" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
                <MessageSquare className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>Paste SMS</div>
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Bank SMS → points</div>
              </div>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>Total points</div>
              <div className="font-display text-2xl tabular" style={{ color: 'var(--accent)' }}>{totalPoints.toLocaleString('en-IN')}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>across all cards</div>
            </div>
            <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>Combined value</div>
              <div className="font-display text-2xl tabular" style={{ color: 'var(--emerald)' }}>₹{Math.round(totalValue / 1000)}K</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>at best redemption</div>
            </div>
            <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>Cards tracked</div>
              <div className="font-display text-2xl tabular" style={{ color: 'var(--text)' }}>{MOCK_LINKED_CARDS.length}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>active accounts</div>
            </div>
            <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>Best redemption</div>
              <div className="font-display text-lg leading-tight" style={{ color: 'var(--accent)' }}>BOM→SIN Biz</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>via KrisFlyer</div>
            </div>
          </div>

          {/* Cards */}
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
                  <div className="text-xs" style={{ color: 'var(--emerald)' }}>Best value: ₹{(card.pointsValue / 1000).toFixed(0)}K</div>
                  <Link href={`/optimize?card=${card.cardId}&points=${card.points}`} className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                    Optimize <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
            <Link href="/link-card" className="rounded-xl border-2 border-dashed p-5 flex items-center justify-center gap-2 block" style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
              <Plus className="w-4 h-4" /><span className="text-sm">Link another card</span>
            </Link>
          </div>

          {/* Redemption */}
          <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>Top redemption opportunities</div>
          <div className="space-y-3 mb-6">
            {REDEMPTION_IDEAS.map((r, i) => (
              <div key={i} className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{r.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{r.bank}</div>
                  </div>
                  <div className="text-[10px] font-mono uppercase px-2 py-1 rounded shrink-0" style={{ background: `${r.color}20`, color: r.color }}>{r.tag}</div>
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
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Which card earns most on groceries, dining, fuel, travel? AI analyses your full card mix.</p>
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

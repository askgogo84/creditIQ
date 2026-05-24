'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Plus, TrendingUp, ArrowRight, Zap, RefreshCw, FileText, MessageSquare, LogOut, CreditCard, Upload, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const BANK_COLORS: Record<string, string> = {
  HDFC: '#004C8F', Axis: '#97144D', AmEx: '#006FCF', ICICI: '#F58220',
  SBI: '#2C4C9C', Kotak: '#EF3E23', IDFC: '#9B0C2C', Yes: '#0C2461',
  RBL: '#1D4ED8', IndusInd: '#312E81', SC: '#0473EA', AU: '#7C2D12',
};

const REDEMPTION_IDEAS = [
  { title: 'Singapore Business Class', points: '1,20,000 pts', value: 'Rs.2.4L+', bank: 'HDFC -> KrisFlyer', tag: 'Best value', color: '#059669' },
  { title: 'Marriott Jaipur (2 nights)', points: '60,000 pts', value: 'Rs.18,000', bank: 'HDFC -> Marriott', tag: 'Hotel', color: '#0473ea' },
  { title: 'Domestic flight (any route)', points: '15,000 pts', value: 'Rs.4,500', bank: 'Axis EDGE Miles', tag: 'Flight', color: '#7c1d3a' },
];

interface SavedCard {
  id: string;
  bank: string;
  card_name: string;
  card_last4: string;
  points_balance: number;
  points_currency: string;
  cashback_balance: number;
  statement_date: string;
  imported_at: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    sb.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return; }
      setUser(user);
      setLoading(false);
      loadCards(user.id);
    });
  }, []);

  const loadCards = async (userId: string) => {
    setCardsLoading(true);
    try {
      const res = await fetch(`/api/user-cards?userId=${userId}`);
      const data = await res.json();
      setCards(data.cards || []);
    } catch {}
    setCardsLoading(false);
  };

  const handleRefresh = async () => {
    if (!user) return;
    setRefreshing(true);
    await loadCards(user.id);
    setRefreshing(false);
  };

  const signOut = async () => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
    await sb.auth.signOut();
    router.replace('/');
  };

  const totalPoints = cards.reduce((s, c) => s + (c.points_balance || 0), 0);
  const bestValue = Math.round(totalPoints * 1.8); // optimistic Rs.1.8/pt via travel
  const conservativeValue = Math.round(totalPoints * 0.25); // Rs.0.25/pt statement credit
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Loading your portfolio...</p>
      </div>
    </main>
  );

  return (
    <main className="min-h-screen" style={{ overflowX: 'hidden' }}>
      <Header />
      <section className="pt-20 pb-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">

          {/* Top bar */}
          <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl" style={{ color: 'var(--text)' }}>
                Hey {firstName} 👋
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleRefresh} disabled={refreshing}
                className="btn-ghost text-sm py-2 px-3 flex items-center gap-1.5" style={{ minHeight: 40 }}>
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button onClick={signOut} className="btn-ghost text-sm py-2 px-3 flex items-center gap-1.5" style={{ minHeight: 40 }}>
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>

          {/* Empty state */}
          {!cardsLoading && cards.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed p-10 text-center mb-6" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <CreditCard className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-dim)' }} />
              <h2 className="font-display text-2xl mb-2" style={{ color: 'var(--text)' }}>No cards yet</h2>
              <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                Upload your bank statement once. Your points stay here every time you log in -- no re-upload needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/upload-statement" className="btn-primary flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> Upload statement PDF
                </Link>
                <Link href="/sms-import" className="btn-ghost flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Paste bank SMS
                </Link>
              </div>
            </div>
          )}

          {/* Cards loaded */}
          {cards.length > 0 && (
            <>
              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                  <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>Total points</div>
                  <div className="font-display text-2xl tabular" style={{ color: 'var(--accent)' }}>{totalPoints.toLocaleString('en-IN')}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{cards.length} card{cards.length !== 1 ? 's' : ''}</div>
                </div>
                <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                  <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>Best value</div>
                  <div className="font-display text-2xl tabular" style={{ color: 'var(--emerald)' }}>Rs.{(bestValue / 1000).toFixed(0)}K+</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>via travel redemption</div>
                </div>
                <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                  <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>Statement credit</div>
                  <div className="font-display text-2xl tabular" style={{ color: 'var(--text)' }}>Rs.{(conservativeValue / 1000).toFixed(0)}K</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>worst redemption</div>
                </div>
                <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                  <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>Value gap</div>
                  <div className="font-display text-2xl tabular" style={{ color: '#ef4444' }}>Rs.{((bestValue - conservativeValue) / 1000).toFixed(0)}K</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>don't leave this</div>
                </div>
              </div>

              {/* Card list */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
                  Your cards . {cards.length} saved
                </div>
                <Link href="/upload-statement" className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                  <Plus className="w-3 h-3" /> Add card
                </Link>
              </div>

              <div className="space-y-3 mb-6">
                {cards.map((card, idx) => (
                  <div key={card.id} className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: BANK_COLORS[card.bank] || '#333' }}>
                        {(card.bank || '??').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>
                          {card.card_name || `${card.bank} Card`}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                          {card.card_last4 ? `....${card.card_last4}` : card.bank}
                          {card.statement_date ? ` . ${new Date(card.statement_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : ''}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="font-display text-xl tabular" style={{ color: 'var(--accent)' }}>
                          {(card.points_balance || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{card.points_currency || 'Points'}</div>
                      </div>
                    </div>
                    <div className="px-4 pb-3 pt-2 flex items-center justify-between gap-3" style={{ borderTop: '1px solid var(--border)' }}>
                      <div className="text-xs" style={{ color: 'var(--text-dim)' }}>
                        Updated {new Date(card.imported_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex items-center gap-3">
                        <Link href={`/upload-statement`} className="text-xs" style={{ color: 'var(--text-dim)' }}>
                          Update
                        </Link>
                        <Link href={`/optimize?bank=${card.bank}&points=${card.points_balance}`}
                          className="text-xs flex items-center gap-1 font-medium" style={{ color: 'var(--accent)' }}>
                          Optimize <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                <Link href="/upload-statement"
                  className="rounded-xl border-2 border-dashed p-4 flex items-center justify-center gap-2 block transition-all"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Add another card</span>
                </Link>
              </div>

              {/* Redemption opportunities */}
              <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
                Top redemption opportunities
              </div>
              <div className="space-y-3 mb-6">
                {REDEMPTION_IDEAS.map((r, i) => (
                  <div key={i} className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{r.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{r.bank}</div>
                      </div>
                      <div className="text-[10px] font-mono uppercase px-2 py-1 rounded shrink-0"
                        style={{ background: `${r.color}20`, color: r.color }}>{r.tag}</div>
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>{r.points}</div>
                      <div className="font-display text-base" style={{ color: 'var(--emerald)' }}>{r.value}</div>
                    </div>
                    <Link href={`/optimize?points=${totalPoints}&bank=${cards[0]?.bank?.toLowerCase()?.replace(/ /g, '-')}`}
                      className="w-full py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                      style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
                      Check if my points cover this <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Add cards CTA always visible */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Link href="/upload-statement" className="rounded-xl border p-4 flex items-center gap-3 transition-all"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
                <FileText className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>Upload statement</div>
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>PDF → saved points</div>
              </div>
            </Link>
            <Link href="/sms-import" className="rounded-xl border p-4 flex items-center gap-3 transition-all"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
                <MessageSquare className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>Paste bank SMS</div>
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Bank SMS → points</div>
              </div>
            </Link>
          </div>

          {/* Portfolio optimizer CTA */}
          {cards.length > 0 && (
            <div className="rounded-xl p-5 border" style={{ borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)', background: 'color-mix(in srgb, var(--accent) 6%, transparent)' }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>Your {totalPoints.toLocaleString('en-IN')} points -- full analysis</span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Best redemption, transfer partners, expiry risk, category-wise card usage.
              </p>
              <Link href={`/optimize?points=${totalPoints}`}
                className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                Run full optimization <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

        </div>
      </section>
      <Footer />
    </main>
  );
}

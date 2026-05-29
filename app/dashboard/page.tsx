'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { Plus, TrendingUp, ArrowRight, Zap, RefreshCw, FileText, MessageSquare, LogOut, CreditCard, Upload, Trash2, X, Check } from 'lucide-react';
import Link from 'next/link';

const BANK_COLORS: Record<string, string> = {
  HDFC: '#004C8F', Axis: '#97144D', AmEx: '#006FCF', ICICI: '#F58220',
  SBI: '#2C4C9C', Kotak: '#EF3E23', IDFC: '#9B0C2C', Yes: '#0C2461',
  RBL: '#1D4ED8', IndusInd: '#312E81', SC: '#0473EA', AU: '#7C2D12',
};

const BANKS = ['HDFC', 'Axis', 'ICICI', 'SBI', 'AmEx', 'Kotak', 'IDFC', 'Yes', 'RBL', 'IndusInd', 'SC', 'AU', 'Other'];

const REDEMPTION_IDEAS = [
  { title: 'Singapore Business Class', points: 120000, value: 'Rs.2.4L+', bank: 'HDFC -> KrisFlyer', tag: 'Best value', color: '#059669' },
  { title: 'Marriott Jaipur (2 nights)', points: 60000, value: 'Rs.18,000', bank: 'HDFC -> Marriott', tag: 'Hotel', color: '#0473ea' },
  { title: 'Domestic flight (any route)', points: 15000, value: 'Rs.4,500', bank: 'Axis EDGE Miles', tag: 'Flight', color: '#7c1d3a' },
];

interface SavedCard {
  id: string;
  bank: string;
  card_name: string;
  card_last4: string;
  points_balance: number;
  points_currency: string;
  cashback_balance?: number;
  statement_date?: string;
  imported_at: string;
  source?: 'statement' | 'manual';
}

interface AddCardForm {
  bank: string;
  cardName: string;
  cardLast4: string;
  pointsBalance: string;
  pointsCurrency: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddCardForm>({
    bank: 'HDFC', cardName: '', cardLast4: '', pointsBalance: '', pointsCurrency: 'Points'
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editPoints, setEditPoints] = useState('');
  const [editSaving, setEditSaving] = useState(false);
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
      const [stmtRes, manualRes] = await Promise.all([
        fetch(`/api/user-cards?userId=${userId}`),
        fetch(`/api/manual-cards?userId=${userId}`)
      ]);
      const stmtData = await stmtRes.json();
      const manualData = await manualRes.json();
      const stmtCards = (stmtData.cards || []).map((c: SavedCard) => ({ ...c, source: 'statement' as const }));
      const manualCards = (manualData.cards || []).map((c: SavedCard) => ({ ...c, source: 'manual' as const }));
      setCards([...stmtCards, ...manualCards]);
    } catch {}
    setCardsLoading(false);
  };

  const handleAddCard = async () => {
    if (!user || !addForm.cardName || !addForm.pointsBalance) return;
    setAddLoading(true);
    try {
      const res = await fetch('/api/manual-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          bank: addForm.bank,
          cardName: addForm.cardName,
          cardLast4: addForm.cardLast4,
          pointsBalance: addForm.pointsBalance,
          pointsCurrency: addForm.pointsCurrency,
        })
      });
      if (res.ok) {
        setAddSuccess(true);
        await loadCards(user.id);
        setTimeout(() => {
          setShowAddModal(false);
          setAddSuccess(false);
          setAddForm({ bank: 'HDFC', cardName: '', cardLast4: '', pointsBalance: '', pointsCurrency: 'Points' });
        }, 1000);
      }
    } catch {}
    setAddLoading(false);
  };

  const handleDeleteCard = async (cardId: string, source: string) => {
    if (!user) return;
    if (source === 'manual') {
      await fetch('/api/manual-cards', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, cardId })
      });
    }
    await loadCards(user.id);
  };

  const handleUpdatePoints = async (card: SavedCard) => {
    const val = parseInt(editPoints);
    if (!val || val <= 0) return;
    setEditSaving(true);
    try {
      const sb = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );
      const res = await fetch('/api/update-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, source: card.source, points: val, userId: user.id }),
      });
      if (!res.ok) throw new Error('Update failed');
      setCards(cards.map(c => c.id === card.id ? { ...c, points_balance: val } : c));
      setEditingCardId(null);
      setEditPoints('');
    } catch {}
    setEditSaving(false);
  };

  const signOut = async () => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
    await sb.auth.signOut();
    router.replace('/');
  };

  const totalPoints = cards.reduce((s, c) => s + (c.points_balance || 0), 0);
  const bestValue = Math.round(totalPoints * 1.8);
  const conservativeValue = Math.round(totalPoints * 0.25);
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const primaryBank = cards[0]?.bank || 'HDFC';

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

      {/* Add Card Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6" style={{ background: 'var(--surface, #fff)', border: '1px solid var(--line, rgba(20,41,80,0.1))' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg" style={{ color: 'var(--ink, #142950)' }}>Add card manually</h3>
              <button onClick={() => setShowAddModal(false)} style={{ color: 'var(--ink-3)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--ink-3)' }}>Bank</label>
                <select value={addForm.bank} onChange={e => setAddForm(f => ({ ...f, bank: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ border: '1px solid var(--line)', background: 'var(--surface-2, #f8f9fc)', color: 'var(--ink)' }}>
                  {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--ink-3)' }}>Card name</label>
                <input type="text" placeholder="e.g. HDFC Regalia Gold" value={addForm.cardName}
                  onChange={e => setAddForm(f => ({ ...f, cardName: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ border: '1px solid var(--line)', background: 'var(--surface-2, #f8f9fc)', color: 'var(--ink)', outline: 'none' }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--ink-3)' }}>Last 4 digits (optional)</label>
                  <input type="text" placeholder="1234" maxLength={4} value={addForm.cardLast4}
                    onChange={e => setAddForm(f => ({ ...f, cardLast4: e.target.value.replace(/\D/g, '') }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ border: '1px solid var(--line)', background: 'var(--surface-2, #f8f9fc)', color: 'var(--ink)', outline: 'none' }} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--ink-3)' }}>Points currency</label>
                  <select value={addForm.pointsCurrency} onChange={e => setAddForm(f => ({ ...f, pointsCurrency: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ border: '1px solid var(--line)', background: 'var(--surface-2, #f8f9fc)', color: 'var(--ink)' }}>
                    <option>Points</option>
                    <option>Miles</option>
                    <option>Rewards</option>
                    <option>Cashback</option>
                    <option>EDGE Miles</option>
                    <option>InterMiles</option>
                    <option>KrisFlyer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--ink-3)' }}>Points balance</label>
                <input type="number" placeholder="e.g. 52164" value={addForm.pointsBalance}
                  onChange={e => setAddForm(f => ({ ...f, pointsBalance: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm" style={{ border: '1px solid var(--line)', background: 'var(--surface-2, #f8f9fc)', color: 'var(--ink)', outline: 'none' }} />
              </div>

              <button onClick={handleAddCard} disabled={addLoading || !addForm.cardName || !addForm.pointsBalance}
                className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                style={{ background: addSuccess ? '#059669' : '#C9972E', color: '#fff', opacity: addLoading ? 0.7 : 1 }}>
                {addSuccess ? <><Check className="w-4 h-4" /> Card added!</> : addLoading ? 'Adding...' : 'Add card'}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="section" style={{ paddingTop: "clamp(100px,14vw,140px)" }}>
        <div className="shell">

          {/* Top bar */}
          <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
            <div>
              <h1 style={{ fontSize: "clamp(32px,5vw,56px)", fontWeight: 800, letterSpacing: "-0.03em", color: "var(--ink,#142950)" }}>
                Hi, {firstName}.
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowAddModal(true)}
                className="btn-primary text-sm py-2 px-3 flex items-center gap-1.5" style={{ minHeight: 40 }}>
                <Plus className="w-3.5 h-3.5" /> Add card
              </button>
              <button onClick={async () => { setRefreshing(true); await loadCards(user.id); setRefreshing(false); }}
                className="btn-ghost text-sm py-2 px-3 flex items-center gap-1.5" style={{ minHeight: 40 }}>
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={signOut} className="btn-ghost text-sm py-2 px-3 flex items-center gap-1.5" style={{ minHeight: 40 }}>
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Empty state */}
          {!cardsLoading && cards.length === 0 && (
            <div style={{ borderRadius: 24, border: "2px dashed var(--line-strong,rgba(20,41,80,0.2))", padding: "clamp(40px,6vw,80px) 40px", textAlign: "center", marginBottom: 24 }}>
              <CreditCard className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-dim)' }} />
              <h2 className="font-display text-2xl mb-2" style={{ color: 'var(--text)' }}>No cards yet</h2>
              <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                Add your cards to see your combined points and plan trips.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center justify-center gap-2">
                  <Plus className="w-4 h-4" /> Add card manually
                </button>
                <Link href="/upload-statement" className="btn-ghost flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> Upload statement
                </Link>
              </div>
            </div>
          )}

          {/* Cards loaded */}
          {cards.length > 0 && (
            <>
              {/* Combined points hero */}
              <div style={{ borderRadius: 24, padding: "clamp(24px,3vw,40px)", marginBottom: 20 }}>
                <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: 'rgba(201,151,46,0.8)' }}>
                  Combined portfolio . {cards.length} card{cards.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <div className="font-display text-4xl font-bold mb-1" style={{ color: '#C9972E' }}>
                      {totalPoints.toLocaleString('en-IN')}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--ink-3, #5A6A8A)' }}>total points across all cards</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs mb-1" style={{ color: 'var(--ink-3, #5A6A8A)' }}>Best travel value</div>
                    <div className="font-display text-2xl" style={{ color: '#22c55e' }}>Rs.{(bestValue/1000).toFixed(0)}K+</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--ink-3, #5A6A8A)' }}>vs Rs.{(conservativeValue/1000).toFixed(0)}K statement credit</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 flex-wrap">
                  <Link href={`/optimize?points=${totalPoints}&bank=${primaryBank}`}
                    className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    style={{ background: '#C9972E', color: '#0a0a0a' }}>
                    <Zap className="w-3 h-3" /> Optimize all points
                  </Link>
                  <Link href={`/trip-planner?points=${totalPoints}&bank=${primaryBank}`}
                    className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    style={{ background: 'var(--bg-2, #EFE7D8)', color: 'var(--ink, #142950)', border: '1px solid var(--ink-3, #5A6A8A)' }}>
                    Plan a trip with all points
                  </Link>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                {[
                  { label: 'Total points', value: totalPoints.toLocaleString('en-IN'), color: 'var(--accent)', sub: `${cards.length} cards` },
                  { label: 'Best value', value: `Rs.${(bestValue/1000).toFixed(0)}K+`, color: 'var(--emerald)', sub: 'via travel' },
                  { label: 'Statement credit', value: `Rs.${(conservativeValue/1000).toFixed(0)}K`, color: 'var(--text)', sub: 'worst option' },
                  { label: 'Value gap', value: `Rs.${((bestValue-conservativeValue)/1000).toFixed(0)}K`, color: '#ef4444', sub: "don't leave this" },
                ].map((s, i) => (
                  <div key={i} style={{ padding: "20px 24px", borderRadius: 16, background: "var(--surface,#fff)", border: "1px solid var(--line,rgba(20,41,80,0.08))" }}>
                    <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>{s.label}</div>
                    <div className="font-display text-2xl tabular" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Card list */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-mono uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
                  Your cards . {cards.length} saved
                </div>
                <button onClick={() => setShowAddModal(true)} className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                  <Plus className="w-3 h-3" /> Add card
                </button>
              </div>

              <div className="space-y-3 mb-6">
                {cards.map((card) => (
                  <div key={card.id} className="rounded-xl border overflow-hidden">
                    <div className="flex items-center gap-3 p-4">
                      <div className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: BANK_COLORS[card.bank] || '#333' }}>
                        {(card.bank || '??').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>
                            {card.card_name || `${card.bank} Card`}
                          </div>
                          {card.source === 'manual' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase" style={{ background: 'rgba(201,151,46,0.1)', color: '#C9972E' }}>manual</span>
                          )}
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
                        {new Date(card.imported_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className="flex items-center gap-3">
                        {editingCardId === card.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={editPoints}
                              onChange={e => setEditPoints(e.target.value)}
                              placeholder="new points"
                              autoFocus
                              className="w-28 px-2 py-1 rounded-lg text-xs border"
                              style={{ background: 'var(--bg-elevated)', borderColor: 'var(--accent)', color: 'var(--text)', outline: 'none' }}
                            />
                            <button
                              onClick={() => handleUpdatePoints(card)}
                              disabled={editSaving || !editPoints || parseInt(editPoints) <= 0}
                              style={{ color: '#059669', opacity: editSaving ? 0.5 : 1 }}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingCardId(null); setEditPoints(''); }}
                              style={{ color: 'var(--text-dim)' }}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingCardId(card.id); setEditPoints(String(card.points_balance || '')); }}
                            className="text-xs"
                            style={{ color: 'var(--text-dim)' }}
                          >
                            Update
                          </button>
                        )}
                        {card.source === 'manual' && (
                          <button onClick={() => handleDeleteCard(card.id, card.source || 'manual')}
                            className="text-xs flex items-center gap-1" style={{ color: '#ef4444' }}>
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        )}
                        <Link href={`/optimize?bank=${card.bank}&points=${card.points_balance}`}
                          className="text-xs flex items-center gap-1 font-medium" style={{ color: 'var(--accent)' }}>
                          Optimize <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                <button onClick={() => setShowAddModal(true)}
                  className="w-full rounded-xl border-2 border-dashed p-4 flex items-center justify-center gap-2 transition-all"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-dim)' }}>
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Add another card</span>
                </button>
              </div>

              {/* Redemption opportunities */}
              <div className="text-[10px] font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
                Top redemption ideas for {totalPoints.toLocaleString('en-IN')} points
              </div>
              <div className="space-y-3 mb-6">
                {REDEMPTION_IDEAS.map((r, i) => {
                  const canAfford = totalPoints >= r.points;
                  return (
                    <div key={i} className="rounded-xl border p-4" style={{ borderColor: canAfford ? 'rgba(34,197,94,0.3)' : 'var(--border)', background: 'var(--bg-elevated)' }}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm" style={{ color: 'var(--text)' }}>{r.title}</div>
                            {canAfford && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase" style={{ background: 'rgba(34,197,94,0.1)', color: '#059669' }}>you can afford this</span>}
                          </div>
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{r.bank}</div>
                        </div>
                        <div className="text-[10px] font-mono uppercase px-2 py-1 rounded shrink-0"
                          style={{ background: `${r.color}20`, color: r.color }}>{r.tag}</div>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>{r.points.toLocaleString('en-IN')} pts needed</div>
                        <div className="font-display text-base" style={{ color: 'var(--emerald)' }}>{r.value}</div>
                      </div>
                      <Link href={`/trip-planner?points=${totalPoints}&bank=${primaryBank}`}
                        className="w-full py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                        style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}>
                        Plan this trip <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Add cards CTA */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Link href="/upload-statement" className="rounded-xl border p-4 flex items-center gap-3 transition-all">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
                <FileText className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>Upload statement</div>
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>PDF - saved points</div>
              </div>
            </Link>
            <Link href="/sms-import" className="rounded-xl border p-4 flex items-center gap-3 transition-all">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
                <MessageSquare className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>Paste bank SMS</div>
                <div className="text-xs" style={{ color: 'var(--text-dim)' }}>Bank SMS - points</div>
              </div>
            </Link>
          </div>

          {cards.length > 0 && (
            <div className="rounded-xl p-5 border" style={{ borderColor: 'color-mix(in srgb, var(--accent) 25%, transparent)', background: 'color-mix(in srgb, var(--accent) 6%, transparent)' }}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="font-medium text-sm" style={{ color: 'var(--text)' }}>Full analysis - {totalPoints.toLocaleString('en-IN')} combined points</span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                Best redemption path, transfer partners, expiry risk, category-wise card usage.
              </p>
              <Link href={`/optimize?points=${totalPoints}&bank=${primaryBank}`}
                className="text-sm font-medium flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                Run full optimization <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

        </div>
      </section>
      <DesignFooter />
    </main>
  );
}

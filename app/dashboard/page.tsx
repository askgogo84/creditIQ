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

      {/* ── PAGE CONTENT ── */}
      <div style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>

          {/* ── TOP BAR ── */}
          <div style={{ paddingTop: 28, paddingBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontSize: 'clamp(28px, 7vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--ink, #142950)', lineHeight: 1.1, margin: 0 }}>
                  Hi, {firstName}.
                </h1>
                <p style={{ fontSize: 13, marginTop: 4, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                  {user?.email}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button onClick={() => setShowAddModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: 'var(--ink, #142950)', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <Plus style={{ width: 14, height: 14 }} /> Add card
                </button>
                <button onClick={async () => { setRefreshing(true); await loadCards(user.id); setRefreshing(false); }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: 'var(--surface, #f5f0e8)', border: '1px solid var(--line)', cursor: 'pointer' }}>
                  <RefreshCw style={{ width: 14, height: 14, color: 'var(--ink)', animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                </button>
                <button onClick={signOut}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: 'var(--surface, #f5f0e8)', border: '1px solid var(--line)', cursor: 'pointer' }}>
                  <LogOut style={{ width: 14, height: 14, color: 'var(--ink)' }} />
                </button>
              </div>
            </div>
          </div>

          {/* ── EMPTY STATE ── */}
          {!cardsLoading && cards.length === 0 && (
            <div style={{ borderRadius: 20, border: '2px dashed var(--line-strong, rgba(20,41,80,0.2))', padding: '48px 24px', textAlign: 'center', marginBottom: 20 }}>
              <CreditCard style={{ width: 44, height: 44, margin: '0 auto 16px', color: 'var(--text-dim)' }} />
              <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>No cards yet</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24, maxWidth: 280, margin: '0 auto 24px' }}>
                Add your cards to see your combined points and plan trips.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={() => setShowAddModal(true)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, background: '#C9972E', color: '#fff', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                  <Plus style={{ width: 16, height: 16 }} /> Add card manually
                </button>
                <Link href="/upload-statement"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, background: 'var(--surface)', color: 'var(--ink)', fontSize: 14, fontWeight: 600, border: '1px solid var(--line)', textDecoration: 'none' }}>
                  <Upload style={{ width: 16, height: 16 }} /> Upload statement
                </Link>
              </div>
            </div>
          )}

          {/* ── CARDS LOADED ── */}
          {cards.length > 0 && (
            <>
              {/* ── POINTS HERO ── */}
              <div style={{ borderRadius: 20, background: 'var(--surface, #fff)', border: '1px solid var(--line)', padding: '20px 20px 16px', marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(201,151,46,0.9)', marginBottom: 8 }}>
                  Combined portfolio &bull; {cards.length} card{cards.length !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: 800, color: '#C9972E', lineHeight: 1, letterSpacing: '-0.02em' }}>
                      {totalPoints.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3, #5A6A8A)', marginTop: 4 }}>total points across all cards</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 2 }}>Best travel value</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#22c55e' }}>Rs.{(bestValue / 1000).toFixed(0)}K+</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>vs Rs.{(conservativeValue / 1000).toFixed(0)}K statement credit</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
                  <Link href={`/optimize?points=${totalPoints}&bank=${primaryBank}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: '#C9972E', color: '#0a0a0a', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    <Zap style={{ width: 12, height: 12 }} /> Optimize all points
                  </Link>
                  <Link href={`/trip-planner?points=${totalPoints}&bank=${primaryBank}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: 'var(--bg-2, #EFE7D8)', color: 'var(--ink, #142950)', border: '1px solid rgba(20,41,80,0.2)', fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Plan a trip
                  </Link>
                </div>
              </div>

              {/* ── STATS GRID — 2x2 on mobile, 4-col on desktop ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Total Points', value: totalPoints.toLocaleString('en-IN'), color: '#C9972E', sub: `${cards.length} cards` },
                  { label: 'Best Value', value: `Rs.${(bestValue / 1000).toFixed(0)}K+`, color: '#22c55e', sub: 'via travel' },
                  { label: 'Stmt Credit', value: `Rs.${(conservativeValue / 1000).toFixed(0)}K`, color: 'var(--ink)', sub: 'worst option' },
                  { label: 'Value Gap', value: `Rs.${((bestValue - conservativeValue) / 1000).toFixed(0)}K`, color: '#ef4444', sub: "don't leave this" },
                ].map((s, i) => (
                  <div key={i} style={{ padding: '14px 16px', borderRadius: 14, background: 'var(--surface, #fff)', border: '1px solid var(--line, rgba(20,41,80,0.08))' }}>
                    <div style={{ fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 'clamp(16px, 4.5vw, 22px)', fontWeight: 800, color: s.color, letterSpacing: '-0.02em', lineHeight: 1 }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── YOUR CARDS LIST ── */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)' }}>
                  Your cards &bull; {cards.length} saved
                </div>
                <button onClick={() => setShowAddModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  <Plus style={{ width: 12, height: 12 }} /> Add card
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {cards.map((card) => (
                  <div key={card.id} style={{ borderRadius: 14, border: '1px solid var(--line)', overflow: 'hidden', background: 'var(--surface, #fff)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, background: BANK_COLORS[card.bank] || '#333' }}>
                        {(card.bank || '??').slice(0, 2)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {card.card_name || `${card.bank} Card`}
                          </div>
                          {card.source === 'manual' && (
                            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', textTransform: 'uppercase', background: 'rgba(201,151,46,0.1)', color: '#C9972E', flexShrink: 0 }}>
                              manual
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                          {card.card_last4 ? `....${card.card_last4}` : card.bank}
                          {card.statement_date ? ` \u00b7 ${new Date(card.statement_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}` : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                        <div style={{ fontSize: 'clamp(16px, 4vw, 20px)', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                          {(card.points_balance || 0).toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{card.points_currency || 'Points'}</div>
                      </div>
                    </div>
                    <div style={{ padding: '10px 16px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        {new Date(card.imported_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {editingCardId === card.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input type="number" value={editPoints} onChange={e => setEditPoints(e.target.value)}
                              placeholder="new points" autoFocus
                              style={{ width: 96, padding: '4px 8px', borderRadius: 8, fontSize: 12, border: '1px solid var(--accent)', background: 'var(--bg-elevated)', color: 'var(--text)', outline: 'none' }} />
                            <button onClick={() => handleUpdatePoints(card)} disabled={editSaving || !editPoints || parseInt(editPoints) <= 0} style={{ color: '#059669', background: 'none', border: 'none', cursor: 'pointer', opacity: editSaving ? 0.5 : 1 }}>
                              <Check style={{ width: 16, height: 16 }} />
                            </button>
                            <button onClick={() => { setEditingCardId(null); setEditPoints(''); }} style={{ color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>
                              <X style={{ width: 16, height: 16 }} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingCardId(card.id); setEditPoints(String(card.points_balance || '')); }}
                            style={{ fontSize: 12, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>
                            Update
                          </button>
                        )}
                        {card.source === 'manual' && (
                          <button onClick={() => handleDeleteCard(card.id, card.source || 'manual')}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>
                            <Trash2 style={{ width: 12, height: 12 }} /> Remove
                          </button>
                        )}
                        <Link href={`/optimize?bank=${card.bank}&points=${card.points_balance}`}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                          Optimize <ArrowRight style={{ width: 12, height: 12 }} />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                <button onClick={() => setShowAddModal(true)}
                  style={{ width: '100%', borderRadius: 14, border: '2px dashed var(--line)', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: 13 }}>
                  <Plus style={{ width: 16, height: 16 }} />
                  Add another card
                </button>
              </div>

              {/* ── REDEMPTION IDEAS ── */}
              <div style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', marginBottom: 10 }}>
                Top redemption ideas for {totalPoints.toLocaleString('en-IN')} points
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {REDEMPTION_IDEAS.map((r, i) => {
                  const canAfford = totalPoints >= r.points;
                  return (
                    <div key={i} style={{ borderRadius: 14, border: `1px solid ${canAfford ? 'rgba(34,197,94,0.3)' : 'var(--line)'}`, padding: '14px 16px', background: 'var(--surface, #fff)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.title}</div>
                            {canAfford && (
                              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', textTransform: 'uppercase', background: 'rgba(34,197,94,0.1)', color: '#059669', whiteSpace: 'nowrap' }}>
                                can afford
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{r.bank}</div>
                        </div>
                        <div style={{ fontSize: 10, fontFamily: 'monospace', textTransform: 'uppercase', padding: '4px 8px', borderRadius: 6, background: `${r.color}20`, color: r.color, flexShrink: 0 }}>
                          {r.tag}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-dim)' }}>{r.points.toLocaleString('en-IN')} pts needed</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#22c55e' }}>{r.value}</div>
                      </div>
                      <Link href={`/trip-planner?points=${totalPoints}&bank=${primaryBank}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px', borderRadius: 10, fontSize: 12, fontWeight: 600, textDecoration: 'none', background: 'rgba(201,151,46,0.1)', color: 'var(--accent)', border: '1px solid rgba(201,151,46,0.2)' }}>
                        Plan this trip <ArrowRight style={{ width: 12, height: 12 }} />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ── IMPORT OPTIONS ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <Link href="/upload-statement"
              style={{ borderRadius: 14, border: '1px solid var(--line)', padding: '14px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', background: 'var(--surface, #fff)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(201,151,46,0.1)' }}>
                <FileText style={{ width: 16, height: 16, color: 'var(--accent)' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Upload statement</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>PDF &rarr; points</div>
              </div>
            </Link>
            <Link href="/sms-import"
              style={{ borderRadius: 14, border: '1px solid var(--line)', padding: '14px', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', background: 'var(--surface, #fff)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: 'rgba(201,151,46,0.1)' }}>
                <MessageSquare style={{ width: 16, height: 16, color: 'var(--accent)' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Paste bank SMS</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>SMS &rarr; points</div>
              </div>
            </Link>
          </div>

          {/* ── FULL ANALYSIS CTA ── */}
          {cards.length > 0 && (
            <div style={{ borderRadius: 14, padding: '16px', border: '1px solid rgba(201,151,46,0.25)', background: 'rgba(201,151,46,0.06)', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <TrendingUp style={{ width: 16, height: 16, color: 'var(--accent)' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Full analysis &mdash; {totalPoints.toLocaleString('en-IN')} combined points</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                Best redemption path, transfer partners, expiry risk, category-wise card usage.
              </p>
              <Link href={`/optimize?points=${totalPoints}&bank=${primaryBank}`}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                Run full optimization <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          )}

        </div>
      </div>

      <DesignFooter />
    </main>
  );
}

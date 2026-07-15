'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { authedFetch } from '@/lib/authed-fetch';
import { useRouter } from 'next/navigation';
import { DesignFooter } from '@/components/design/Footer';
import { Plus, TrendingUp, ArrowRight, Zap, RefreshCw, FileText, MessageSquare, LogOut, CreditCard, Upload, Trash2, X, Check, Building2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { WalletView } from '@/components/ciq/WalletView';
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
  const [wpLoading, setWpLoading] = useState(true);
  const [wp, setWp] = useState<{ linked: boolean; org_name?: string; org_id?: string }>({ linked: false });
  const [wpCode, setWpCode] = useState('');
  const [wpOpen, setWpOpen] = useState(false);
  const [wpBusy, setWpBusy] = useState(false);
  const [wpError, setWpError] = useState('');
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
      loadWorkplace();
    });
  }, []);
  const loadCards = async (userId: string) => {
    setCardsLoading(true);
    try {
      const [stmtRes, manualRes] = await Promise.all([
        authedFetch('/api/user-cards'),
        authedFetch('/api/manual-cards')
      ]);
      const stmtData = await stmtRes.json();
      const manualData = await manualRes.json();
      const stmtCards = (stmtData.cards || []).map((c: SavedCard) => ({ ...c, source: 'statement' as const }));
      const manualCards = (manualData.cards || []).map((c: SavedCard) => ({ ...c, source: 'manual' as const }));
      const combined = [...stmtCards, ...manualCards];
      setCards(combined);

      if (combined.length === 0) {
        try {
          const obRes = await authedFetch('/api/onboarding');
          const ob = await obRes.json();
          if (!ob?.onboarding_complete) { router.replace('/onboarding'); return; }
        } catch {}
      }
    } catch {}
    setCardsLoading(false);
  };

  const getToken = async (): Promise<string | null> => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
    const { data } = await sb.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const loadWorkplace = async () => {
    try {
      const token = await getToken();
      if (!token) { setWpLoading(false); return; }
      const res = await fetch('/api/employee/workplace', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data && typeof data.linked === 'boolean') setWp(data);
    } catch {}
    setWpLoading(false);
  };

  const joinWorkplace = async () => {
    if (!wpCode.trim()) { setWpError('Enter your company code.'); return; }
    setWpBusy(true); setWpError('');
    try {
      const token = await getToken();
      if (!token) { setWpError('Please sign in again.'); setWpBusy(false); return; }
      const res = await fetch('/api/employee/join-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: wpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs: Record<string, string> = {
          missing_code: 'Enter your company code.',
          invalid_code: 'That code did not match any company.',
          code_expired: 'That code has expired. Ask your admin for a new one.',
          email_domain_mismatch: 'This code is restricted to your company email.',
        };
        setWpError(msgs[data.error as string] || 'Could not link. Try again.');
        setWpBusy(false);
        return;
      }
      setWpCode('');
      setWpOpen(false);
      await loadWorkplace();
    } catch { setWpError('Network error. Try again.'); }
    setWpBusy(false);
  };

  const leaveWorkplace = async () => {
    setWpBusy(true);
    try {
      const token = await getToken();
      if (!token) { setWpBusy(false); return; }
      await fetch('/api/employee/workplace', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setWp({ linked: false });
    } catch {}
    setWpBusy(false);
  };

  const handleAddCard = async () => {
    // Points balance is OPTIONAL — a new user often doesn't know it yet.
    // Blank or 0 is valid; the card saves with 0 points (grey "Estimated").
    if (!user || !addForm.cardName) return;
    setAddLoading(true);
    try {
      const res = await authedFetch('/api/manual-cards', {
        method: 'POST',
        body: JSON.stringify({
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
      await authedFetch('/api/manual-cards', {
        method: 'DELETE',
        body: JSON.stringify({ cardId })
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
    <>
      <WalletView
        displayName={(user?.user_metadata?.name || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'there'))}
        email={user?.email}
        cards={cards as any}
        totalPoints={totalPoints}
        bestValue={bestValue}
        primaryBank={primaryBank}
        onAddCard={() => setShowAddModal(true)}
        onSignOut={signOut}
        onRefresh={() => { setRefreshing(true); loadCards(user.id).then(() => setRefreshing(false)); }}
        refreshing={refreshing}
      />

      {showAddModal && (
        <div data-ciq data-theme="dark" className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="w-full max-w-md rounded-2xl p-6"
               style={{ background: 'var(--ciq-panel)', border: '1px solid var(--ciq-gold-line)', color: 'var(--ciq-ink)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="ciq-display font-semibold text-lg">Add card manually</h3>
              <button onClick={() => setShowAddModal(false)} style={{ color: 'var(--ciq-ink-3)', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Bank (e.g. HDFC)" value={addForm.bank}
                onChange={e => setAddForm({ ...addForm, bank: e.target.value })}
                style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--ciq-panel-2)', border: '1px solid var(--ciq-line-2)', color: 'var(--ciq-ink)' }} />
              <input placeholder="Card name (e.g. Regalia Gold)" value={addForm.cardName}
                onChange={e => setAddForm({ ...addForm, cardName: e.target.value })}
                style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--ciq-panel-2)', border: '1px solid var(--ciq-line-2)', color: 'var(--ciq-ink)' }} />
              <input placeholder="Last 4 digits (optional)" value={addForm.cardLast4}
                onChange={e => setAddForm({ ...addForm, cardLast4: e.target.value })}
                style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--ciq-panel-2)', border: '1px solid var(--ciq-line-2)', color: 'var(--ciq-ink)' }} />
              <input placeholder="Points balance (optional)" type="number" value={addForm.pointsBalance}
                onChange={e => setAddForm({ ...addForm, pointsBalance: e.target.value })}
                style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--ciq-panel-2)', border: '1px solid var(--ciq-line-2)', color: 'var(--ciq-ink)' }} />
              <p style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--ciq-ink-3)', margin: '-4px 2px 0' }}>
                Don't know your balance?{' '}
                <Link href="/upload-statement" style={{ color: 'var(--ciq-gold-2)', fontWeight: 600, textDecoration: 'none' }}>
                  Upload a statement
                </Link>{' '}
                and we'll verify it.
              </p>
              <input placeholder="Currency (e.g. Points, EDGE Miles)" value={addForm.pointsCurrency}
                onChange={e => setAddForm({ ...addForm, pointsCurrency: e.target.value })}
                style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--ciq-panel-2)', border: '1px solid var(--ciq-line-2)', color: 'var(--ciq-ink)' }} />
              <button onClick={handleAddCard} disabled={addLoading}
                style={{ padding: 13, borderRadius: 12, background: 'linear-gradient(135deg,var(--ciq-gold-2),var(--ciq-gold))', color: '#1a1710', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 4 }}>
                {addLoading ? 'Adding…' : 'Add card'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

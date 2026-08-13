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
import { SEED_CARDS } from '@/lib/data/seed-cards';
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
  self_entered?: boolean;
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
  // Add-card picker (SEED_CARDS-backed, no free-text, no card numbers).
  const [cardQuery, setCardQuery] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ card: SavedCard; prev: SavedCard[]; timer: ReturnType<typeof setTimeout> } | null>(null);
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
          if (!ob?.onboarding_complete) {
            // Don't send a brand-new user to the onboarding wizard while the first-run
            // pricing modal still owes a choice — the modal comes first. Once plan_chosen
            // is stamped, the modal reloads /dashboard and this bounce proceeds. With
            // FIRST_RUN_MODAL off (prod default) enabled=false, so this is a no-op there.
            try {
              const fr = await (await authedFetch('/api/first-run')).json();
              if (fr?.enabled && !fr?.plan_chosen) return;
            } catch {}
            router.replace('/onboarding'); return;
          }
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
    // Blank or 0 is valid; the card saves with 0 points (grey "Self-entered").
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
          closeAddModal();
          setAddSuccess(false);
        }, 1000);
      }
    } catch {}
    setAddLoading(false);
  };

  // Close + fully reset the add-card modal (picker query, selection, form).
  const closeAddModal = () => {
    setShowAddModal(false);
    setCardQuery('');
    setSelectedCardId(null);
    setAddForm({ bank: 'HDFC', cardName: '', cardLast4: '', pointsBalance: '', pointsCurrency: 'Points' });
  };

  // Pick a card from the catalogue — this is the ONLY way bank + name get set,
  // so they always match SEED_CARDS (no "Amex" vs "American Express" drift). No
  // card number is ever collected (last4 optional only).
  const selectCard = (c: (typeof SEED_CARDS)[number]) => {
    setSelectedCardId(c.id);
    const currency = c.reward_currency
      ? c.reward_currency.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      : 'Points';
    setAddForm(f => ({ ...f, bank: c.bank, cardName: c.name, pointsCurrency: currency }));
  };

  // Delete a card with a ~5s UNDO window (deferred commit). Tap delete → the card
  // hides immediately and the window opens; the server DELETE fires only when the
  // window elapses. Undo restores the pre-delete snapshot with NO server call —
  // nothing was destroyed. Deleting a statement card is irreversible (drops
  // statement_date, points_expiry, provenance), which is exactly why the window exists.
  //
  // ⚠ INTENTIONAL FAIL-SAFE — DO NOT "FIX": close the tab mid-window and the timer
  // never fires, so the delete never commits. On a money surface, losing a delete is
  // the safe failure; losing the data is not. Do NOT add a pagehide/beacon flush to
  // commit-on-close — it would destroy data the user may not have meant to lose. (SPA
  // navigation still commits; only a real tab close kills the timer.)
  const UNDO_MS = 5000;

  const commitDelete = async (card: SavedCard) => {
    // No setState — the row is already hidden, and this can run after unmount.
    try {
      await authedFetch('/api/delete-card', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, source: card.source }),
      });
    } catch {}
  };

  // Any new mutation ends an open undo window by committing it, so at most one delete
  // is ever pending and its restore snapshot can't go stale.
  const flushPendingDelete = () => {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timer);
    void commitDelete(pendingDelete.card);
    setPendingDelete(null);
  };

  const onDeleteCard = (card: SavedCard) => {
    flushPendingDelete();
    const prev = cards;
    setCards(cs => cs.filter(c => c.id !== card.id)); // optimistic hide
    const timer = setTimeout(() => { void commitDelete(card); setPendingDelete(null); }, UNDO_MS);
    setPendingDelete({ card, prev, timer });
  };

  const undoDelete = () => {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timer);
    setCards(pendingDelete.prev); // restore exact pre-delete state/order; no server call
    setPendingDelete(null);
  };

  // Inline points edit (CardRow owns the input; this owns the write + state).
  // Optimistic: reflect the new balance immediately so the gauge and badge recompute,
  // then reconcile — revert to the pre-edit snapshot if the server rejects. A
  // hand-edited statement card also flips to self_entered (demotes off Verified).
  const onEditPoints = async (card: SavedCard, points: number): Promise<boolean> => {
    flushPendingDelete(); // editing ends any open undo window so its snapshot can't go stale
    const prev = cards;
    setCards(cs => cs.map(c => c.id === card.id
      ? { ...c, points_balance: points, self_entered: c.source === 'statement' ? true : c.self_entered }
      : c));
    try {
      const res = await authedFetch('/api/update-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, source: card.source, points }),
      });
      if (!res.ok) throw new Error('Update failed');
      return true;
    } catch {
      setCards(prev); // reconcile — undo the optimistic change
      return false;
    }
  };

  const totalPoints = cards.reduce((s, c) => s + (c.points_balance || 0), 0);
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const primaryBank = cards[0]?.bank || 'HDFC';

  // Add-card picker matches (bank + name, case-insensitive). Empty query = all.
  const q = cardQuery.trim().toLowerCase();
  const cardMatches = (q ? SEED_CARDS.filter(c => `${c.bank} ${c.name}`.toLowerCase().includes(q)) : SEED_CARDS).slice(0, 60);
  const selectedCard = selectedCardId ? SEED_CARDS.find(c => c.id === selectedCardId) ?? null : null;

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
        primaryBank={primaryBank}
        onAddCard={() => setShowAddModal(true)}
        onRefresh={() => { setRefreshing(true); loadCards(user.id).then(() => setRefreshing(false)); }}
        refreshing={refreshing}
        onEditPoints={onEditPoints as any}
        onDeleteCard={onDeleteCard as any}
      />

      {pendingDelete && (
        <div role="status" aria-live="polite" style={{
          position: 'fixed', left: '50%', transform: 'translateX(-50%)',
          bottom: 'calc(90px + env(safe-area-inset-bottom))', zIndex: 60,
          display: 'flex', alignItems: 'center', gap: 16, maxWidth: 'calc(100vw - 32px)',
          background: 'var(--ink)', color: 'var(--surface)',
          padding: '11px 16px', borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.28)',
          fontSize: 13.5, fontWeight: 500,
        }}>
          <span>Card removed</span>
          <button type="button" onClick={undoDelete} style={{
            background: 'none', border: 'none', color: 'var(--copper-4, #F2C658)',
            fontWeight: 700, fontSize: 13.5, cursor: 'pointer', padding: 0, letterSpacing: '.02em',
          }}>Undo</button>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(10,18,38,0.55)', backdropFilter: 'blur(6px)' }}
             onClick={closeAddModal}>
          <div className="w-full max-w-md rounded-2xl p-6" onClick={e => e.stopPropagation()}
               style={{ background: 'var(--surface)', border: '1px solid var(--line-strong)', color: 'var(--ink)', boxShadow: 'var(--shadow-xl)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="w-display" style={{ fontWeight: 600, fontSize: 18 }}>Add a card</h3>
              <button onClick={closeAddModal} aria-label="Close"
                style={{ color: 'var(--ink-3)', fontSize: 22, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            </div>

            {addSuccess ? (
              <div style={{ padding: '28px 8px', textAlign: 'center' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'color-mix(in srgb,var(--prov-verified) 15%,transparent)', color: 'var(--prov-verified)', fontSize: 22 }}>✓</div>
                <p style={{ color: 'var(--ink-2)', fontSize: 14 }}>Card added.</p>
              </div>
            ) : !selectedCard ? (
              <>
                <input autoFocus placeholder="Search your card — bank or name" value={cardQuery}
                  onChange={e => setCardQuery(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--line-strong)', color: 'var(--ink)', fontSize: 14 }} />
                <p className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', margin: '8px 2px 0' }}>
                  Pick from our catalogue — we never ask for your card number.
                </p>
                <div style={{ marginTop: 12, maxHeight: '46vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cardMatches.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--ink-3)', padding: '12px 2px' }}>No match. Try the bank name (e.g. “HDFC”).</p>
                  ) : cardMatches.map(c => (
                    <button key={c.id} type="button" onClick={() => selectCard(c)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', padding: '11px 12px', borderRadius: 12,
                        background: 'var(--surface-2)', border: '1px solid var(--line)', color: 'var(--ink)', cursor: 'pointer' }}>
                      <span style={{ width: 36, height: 36, borderRadius: 10, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 11, color: 'var(--copper)', background: 'color-mix(in srgb,var(--copper-3) 9%, var(--surface))', border: '1px solid color-mix(in srgb,var(--copper-3) 28%, transparent)' }}>
                        {c.bank.slice(0, 2).toUpperCase()}
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                        <span className="mono" style={{ display: 'block', fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1 }}>{c.bank}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* selected card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 12,
                  background: 'var(--surface-2)', border: '1px solid color-mix(in srgb,var(--copper-3) 28%, transparent)' }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 11, color: 'var(--copper)', background: 'color-mix(in srgb,var(--copper-3) 9%, var(--surface))', border: '1px solid color-mix(in srgb,var(--copper-3) 28%, transparent)' }}>
                    {selectedCard.bank.slice(0, 2).toUpperCase()}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedCard.name}</span>
                    <span className="mono" style={{ display: 'block', fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1 }}>{selectedCard.bank}</span>
                  </span>
                  <button type="button" onClick={() => setSelectedCardId(null)} className="mono"
                    style={{ fontSize: 11, color: 'var(--copper)', background: 'none', border: 'none', cursor: 'pointer', flex: '0 0 auto' }}>Change</button>
                </div>

                <input placeholder="Last 4 digits (optional)" inputMode="numeric" maxLength={4} value={addForm.cardLast4}
                  onChange={e => setAddForm({ ...addForm, cardLast4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--line-strong)', color: 'var(--ink)' }} />
                <input placeholder="Points balance (optional)" inputMode="numeric" value={addForm.pointsBalance}
                  onChange={e => setAddForm({ ...addForm, pointsBalance: e.target.value.replace(/\D/g, '') })}
                  style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--line-strong)', color: 'var(--ink)' }} />
                <p style={{ fontSize: 11.5, lineHeight: 1.45, color: 'var(--ink-3)', margin: '-4px 2px 0' }}>
                  Don't know your balance?{' '}
                  <Link href="/upload-statement" style={{ color: 'var(--copper)', fontWeight: 600, textDecoration: 'none' }}>
                    Upload a statement
                  </Link>{' '}
                  and we'll verify it.
                </p>
                <button onClick={handleAddCard} disabled={addLoading}
                  style={{ padding: 13, borderRadius: 12, background: 'var(--copper)', color: 'var(--surface)', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 4 }}>
                  {addLoading ? 'Adding…' : 'Add card'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

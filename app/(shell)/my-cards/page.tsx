'use client';
export const dynamic = 'force-dynamic';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { authedFetch } from '@/lib/authed-fetch';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CiqTheme, ThemeToggle } from '@/components/ciq/ThemeProvider';
import { CardRow } from '@/components/ciq/CardRow';
import { getSmartRedemptions } from '@/lib/redemptions';

type SavedCard = {
  id: string; bank: string; card_name?: string; card_last4?: string;
  points_balance: number; points_currency?: string; source: 'statement' | 'manual';
};

export default function MyCardsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
    sb.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/login'); return; }
      setUser(user);
      try {
        const [s, m] = await Promise.all([authedFetch('/api/user-cards'), authedFetch('/api/manual-cards')]);
        const sd = await s.json(); const md = await m.json();
        const sc = (sd.cards || []).map((c: SavedCard) => ({ ...c, source: 'statement' as const }));
        const mc = (md.cards || []).map((c: SavedCard) => ({ ...c, source: 'manual' as const }));
        setCards([...sc, ...mc]);
      } catch {}
      setLoading(false);
    });
  }, []);

  const totalPoints = cards.reduce((s, c) => s + (c.points_balance || 0), 0);
  const primaryBank = cards[0]?.bank || 'HDFC';
  const redemptions = totalPoints > 0 ? getSmartRedemptions(totalPoints, primaryBank) : [];

  return (
    <CiqTheme>
      <div style={{ maxWidth: 420, margin: '0 auto', paddingBottom: 104 }}>
        {/* masthead */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 8px' }}>
          <div className="ciq-display" style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-.02em' }}>
            Credit<span style={{ color: 'var(--ciq-gold-2)' }}>IQ</span>
          </div>
          <ThemeToggle />
        </div>

        <div style={{ padding: '10px 20px 0' }}>
          <h1 className="ciq-display" style={{ fontWeight: 600, fontSize: 28, letterSpacing: '-.02em' }}>Your cards</h1>
          <p style={{ fontSize: 13, color: 'var(--ciq-ink-3)', marginTop: 6 }}>
            {cards.length} card{cards.length !== 1 ? 's' : ''} · {totalPoints.toLocaleString('en-IN')} points to work with
          </p>
        </div>

        {/* cards list */}
        <div className="ciq-rise" style={{ padding: '18px 20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading ? (
            <div className="ciq-mono" style={{ color: 'var(--ciq-ink-3)', fontSize: 12, padding: 20, textAlign: 'center' }}>loading…</div>
          ) : cards.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', borderRadius: 16, border: '1px solid var(--ciq-line)', background: 'var(--ciq-panel)' }}>
              <p style={{ color: 'var(--ciq-ink-3)', fontSize: 13 }}>No cards yet.</p>
              <Link href="/dashboard" style={{ color: 'var(--ciq-gold-2)', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Add your first card →</Link>
            </div>
          ) : cards.map(c => (
            <CardRow key={c.id} bank={c.bank} cardName={c.card_name || c.bank}
              last4={c.card_last4} points={c.points_balance} currency={c.points_currency} source={c.source} />
          ))}
        </div>

        {/* WHAT YOUR POINTS UNLOCK — real redemption engine */}
        {redemptions.length > 0 && (
          <>
            <div style={{ padding: '30px 20px 12px' }}>
              <h2 className="ciq-display" style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>What your points unlock</h2>
              <p className="ciq-mono" style={{ fontSize: 10.5, color: 'var(--ciq-ink-3)', marginTop: 6, letterSpacing: '.03em' }}>
                AFFORDABLE FIRST · REAL AWARD VALUES
              </p>
            </div>
            <div className="ciq-rise d2" style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {redemptions.map((r, i) => (
                <Link key={i} href={`/trip-planner?points=${totalPoints}&bank=${primaryBank}&q=${encodeURIComponent(r.tripPlannerQuery)}`}
                  style={{ textDecoration: 'none', color: 'var(--ciq-ink)' }}>
                  <div style={{
                    borderRadius: 18, padding: 16, background: 'var(--ciq-panel)',
                    border: `1px solid ${r.canAfford ? 'var(--ciq-gold-line)' : 'var(--ciq-line)'}`,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, fontSize: 14.5 }}>{r.title}</span>
                          {r.canAfford && (
                            <span className="ciq-mono" style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 5, color: 'var(--ciq-verified)', background: 'color-mix(in srgb,var(--ciq-verified) 14%,transparent)' }}>
                              Can afford
                            </span>
                          )}
                        </div>
                        <div className="ciq-mono" style={{ fontSize: 10, color: 'var(--ciq-ink-3)', marginTop: 4 }}>{r.partner}</div>
                      </div>
                      <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                        <div className="ciq-display" style={{ fontWeight: 600, fontSize: 17, color: r.canAfford ? 'var(--ciq-verified)' : 'var(--ciq-ink-2)' }}>
                          ₹{r.cashValue.toLocaleString('en-IN')}
                        </div>
                        <div className="ciq-mono" style={{ fontSize: 9, color: 'var(--ciq-ink-3)', marginTop: 1 }}>value</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--ciq-line)' }}>
                      <span className="ciq-mono" style={{ fontSize: 10.5, color: 'var(--ciq-ink-3)' }}>
                        {r.pointsNeeded.toLocaleString('en-IN')} pts needed
                        {!r.canAfford && r.shortfall > 0 && <span style={{ color: 'var(--ciq-estimated)' }}> · {r.shortfall.toLocaleString('en-IN')} short</span>}
                      </span>
                      <span className="ciq-mono" style={{ fontSize: 11, color: 'var(--ciq-gold-2)', fontWeight: 700 }}>Plan →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </CiqTheme>
  );
}

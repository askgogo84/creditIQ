// components/ciq/WalletView.tsx
'use client';
import Link from 'next/link';
import { CiqTheme, ThemeToggle } from './ThemeProvider';
import { HeroGauge } from './HeroGauge';
import { CardRow } from './CardRow';
import { BestMove } from './BestMove';

type Card = {
  id: string; bank: string; card_name?: string; cardName?: string;
  card_last4?: string; points_balance: number; points_currency?: string;
  source: 'statement' | 'manual';
};

export function WalletView({
  displayName, email, cards, totalPoints, bestValue, primaryBank,
  onAddCard, onSignOut, onRefresh, refreshing,
}: {
  displayName: string; email?: string; cards: Card[];
  totalPoints: number; bestValue: number; primaryBank: string;
  onAddCard: () => void; onSignOut: () => void; onRefresh: () => void; refreshing?: boolean;
}) {
  // verified/estimated split from real source tags — flat rate for now (upgrade to per-program next)
  const RATE = 1.8;
  const vPoints = cards.filter(c => c.source === 'statement').reduce((s, c) => s + (c.points_balance || 0), 0);
  const ePoints = cards.filter(c => c.source === 'manual').reduce((s, c) => s + (c.points_balance || 0), 0);
  const verified = Math.round(vPoints * RATE);
  const estimated = Math.round(ePoints * RATE);
  const totalValue = verified + estimated;
  const hasVerified = vPoints > 0;

  return (
    <CiqTheme>
      <div className="max-w-[420px] md:max-w-[1100px] mx-auto pb-[104px] md:pb-16" style={{ position: 'relative' }}>
        {/* masthead — wordmark dropped (shell Header supplies the logo); keeps the
            wallet-specific ThemeToggle (ciq-theme) + sign out, right-aligned */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '18px 20px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ThemeToggle />
            <button onClick={onSignOut} className="ciq-mono" style={{
              fontSize: 10.5, color: 'var(--ciq-ink-2)', background: 'var(--ciq-line)',
              border: '1px solid var(--ciq-line-2)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
            }}>Sign out</button>
          </div>
        </div>

        {/* responsive body: single column on mobile, two columns >=768px */}
        <div className="md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-6 md:items-start md:px-2 md:pt-4">

          {/* LEFT column: identity — greeting + gauge + credo */}
          <div>
            <div style={{ padding: '10px 20px 0' }}>
              <div className="ciq-rise" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, letterSpacing: '.06em',
                textTransform: 'uppercase', color: 'var(--ciq-ink-2)', background: 'var(--ciq-line)',
                border: '1px solid var(--ciq-line-2)', padding: '5px 10px', borderRadius: 999, fontFamily: "'Space Mono',monospace",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ciq-verified)', animation: 'ciq-pulse 2s infinite' }} />
                Live · verified wallet
              </div>
              <h1 className="ciq-display ciq-rise d1" style={{ fontWeight: 600, fontSize: 30, letterSpacing: '-.02em', marginTop: 12, lineHeight: 1.02 }}>
                Hi, {displayName || 'there'}.
              </h1>
              {email && <div style={{ fontSize: 12.5, color: 'var(--ciq-ink-3)', marginTop: 4 }}>{email}</div>}
            </div>

            {/* HERO GAUGE — the signature */}
            <HeroGauge total={totalValue} verified={verified} estimated={estimated}
              bestValue={bestValue} points={totalPoints} cardCount={cards.length} />

            {/* honesty credo */}
            <div className="ciq-rise d2" style={{
              margin: '14px 20px 0', display: 'flex', gap: 10, alignItems: 'flex-start', padding: '13px 15px',
              borderRadius: 16, background: 'color-mix(in srgb,var(--ciq-verified) 7%,transparent)',
              border: '1px solid color-mix(in srgb,var(--ciq-verified) 18%,transparent)',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ marginTop: 1, flex: '0 0 auto' }}>
                <path d="M12 2 4 5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5l-8-3Z" stroke="var(--ciq-verified)" strokeWidth="1.7" />
                <path d="m9 12 2 2 4-4" stroke="var(--ciq-verified)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--ciq-ink-2)' }}>
                <b style={{ color: 'var(--ciq-verified)' }}>We don&apos;t guess your money.</b> Verified values come from your real statements. Estimates are flagged — never inflated.
              </p>
            </div>
          </div>

          {/* RIGHT column: action — best move + cards */}
          <div>
            {/* best move */}
            {totalPoints > 0 && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '26px 20px 12px' }}>
                  <h2 className="ciq-display" style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>Your best move</h2>
                </div>
                <BestMove
                  flag="Best value"
                  title={`Redeem your ${totalPoints.toLocaleString('en-IN')} points for travel`}
                  detail="Travel redemption unlocks far more than statement credit. Plan a trip to see live award options."
                  unlockedValue={`₹${bestValue.toLocaleString('en-IN')}`}
                  vsLabel={`vs ₹${Math.round(totalPoints * 0.25).toLocaleString('en-IN')} cashback`}
                  href={`/trip-planner?points=${totalPoints}&bank=${primaryBank}`}
                />
              </>
            )}

            {/* verified-points CTA — prominent for anyone with zero verified points.
                This is a gold ACTION (not verified data), so it uses gold, never green. */}
            {!hasVerified && (
              <div className="ciq-rise d3" style={{
                margin: '26px 20px 0', padding: 18, borderRadius: 18,
                background: 'var(--ciq-gold-soft)', border: '1px solid var(--ciq-gold-line)',
              }}>
                <div className="ciq-mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ciq-gold-2)' }}>
                  Your next step
                </div>
                <h3 className="ciq-display" style={{ fontWeight: 600, fontSize: 17, letterSpacing: '-.01em', marginTop: 8, color: 'var(--ciq-ink)' }}>
                  Get your verified points
                </h3>
                <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--ciq-ink-2)', marginTop: 6 }}>
                  Upload a bank statement and we read your real points balance in seconds. <b style={{ color: 'var(--ciq-ink)' }}>Verified from your statement — never guessed.</b>
                </p>
                <Link href="/upload-statement" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, padding: 13,
                  borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none',
                  background: 'linear-gradient(135deg,var(--ciq-gold-2),var(--ciq-gold))', color: '#1a1710',
                }}>↑ Upload a statement</Link>
              </div>
            )}

            {/* cards */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '26px 20px 12px' }}>
              <h2 className="ciq-display" style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>Your cards</h2>
              <button onClick={onRefresh} className="ciq-mono" style={{ fontSize: 11, color: 'var(--ciq-ink-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
                {refreshing ? 'refreshing…' : 'refresh'}
              </button>
            </div>
            <div className="ciq-rise d4" style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cards.map(c => (
                <CardRow key={c.id} bank={c.bank} cardName={c.card_name || c.cardName || c.bank}
                  last4={c.card_last4} points={c.points_balance} currency={c.points_currency}
                  source={c.source} />
              ))}
              <button onClick={onAddCard} style={{
                border: '1.5px dashed var(--ciq-gold-line)', borderRadius: 18, padding: 15, display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--ciq-gold-2)',
                fontWeight: 600, fontSize: 13.5, background: 'transparent', cursor: 'pointer',
              }}>＋ Add a card</button>
              {/* Upload entry stays reachable once the user already has verified points
                  (the prominent CTA above only shows while they have none). */}
              {hasVerified && (
                <Link href="/upload-statement" style={{
                  border: '1px solid var(--ciq-line-2)', borderRadius: 18, padding: 13, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--ciq-ink-2)',
                  fontWeight: 600, fontSize: 12.5, background: 'var(--ciq-panel)', textDecoration: 'none',
                }}>↑ Upload a statement to verify more</Link>
              )}
            </div>
          </div>

        </div>
      </div>
    </CiqTheme>
  );
}

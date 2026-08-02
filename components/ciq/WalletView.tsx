// components/ciq/WalletView.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CiqTheme } from './ThemeProvider';
import { HeroGauge } from './HeroGauge';
import { CardRow } from './CardRow';
import { BestMove } from './BestMove';
import { EditorialCards } from './EditorialCards';
import { Tour, type TourStep } from './Tour';

// Wallet walkthrough — the reusable <Tour> anchored to this surface's elements.
const WALLET_TOUR: TourStep[] = [
  {
    title: 'Your points, verified vs estimated',
    body: 'The green slice is read straight from your statements. Grey is your own estimate. We never dress one up as the other.',
    anchor: '#wallet-gauge',
  },
  {
    title: 'Add a card anytime',
    body: 'Enter a card by hand to keep an estimate in view, or upload a statement to add a verified one.',
    anchor: '#wallet-add',
  },
  {
    title: 'Cards to know',
    body: 'A hand-picked shortlist from our team — editorial, not ranked by anyone’s spending.',
    anchor: '#wallet-editorial',
  },
];
const TOUR_SEEN_KEY = 'ciq_wallet_tour_v1';

type Card = {
  id: string; bank: string; card_name?: string; cardName?: string;
  card_last4?: string; points_balance: number; points_currency?: string;
  source: 'statement' | 'manual';
};

export function WalletView({
  displayName, email, cards, totalPoints, primaryBank,
  onAddCard, onRefresh, refreshing,
}: {
  displayName: string; email?: string; cards: Card[];
  totalPoints: number; primaryBank: string;
  onAddCard: () => void; onRefresh: () => void; refreshing?: boolean;
}) {
  // Verified vs estimated split on REAL POINT COUNTS (statement vs manual).
  // Rupee figures are only ever an ESTIMATE RANGE, never a stated value:
  //  - low  = cashback floor (~0.25/pt)
  //  - high = travel ceiling (~1.8/pt)
  // See docs/dashboard-data-audit.md §1 — the point count is real; the ₹ is not.
  const LOW_RATE = 0.25;
  const HIGH_RATE = 1.8;
  const vPoints = cards.filter(c => c.source === 'statement').reduce((s, c) => s + (c.points_balance || 0), 0);
  const ePoints = cards.filter(c => c.source === 'manual').reduce((s, c) => s + (c.points_balance || 0), 0);
  const estLow = Math.round(totalPoints * LOW_RATE);
  const estHigh = Math.round(totalPoints * HIGH_RATE);
  const hasVerified = vPoints > 0;

  // First-run walkthrough: auto-open once, remembered in localStorage. Always
  // dismissable, and re-openable via the "Take a tour" affordance.
  const [tourOpen, setTourOpen] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_SEEN_KEY)) setTourOpen(true);
    } catch {}
  }, []);
  const closeTour = () => {
    setTourOpen(false);
    try { localStorage.setItem(TOUR_SEEN_KEY, '1'); } catch {}
  };

  return (
    <CiqTheme>
      <div className="max-w-[420px] md:max-w-[1100px] mx-auto pt-4 pb-[104px] md:pb-16" style={{ position: 'relative' }}>
        {/* Theme toggle + sign out moved to the TabBar "More" sheet (Settings +
            Sign out). The shell Header supplies the logo/top chrome. */}

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
              <button onClick={() => setTourOpen(true)} className="ciq-mono" style={{
                marginTop: 8, fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase',
                color: 'var(--ciq-ink-3)', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                textDecoration: 'underline', textUnderlineOffset: 3,
              }}>Take a tour</button>
            </div>

            {/* HERO GAUGE — the signature */}
            <div id="wallet-gauge">
              <HeroGauge points={totalPoints} verifiedPoints={vPoints} estimatedPoints={ePoints}
                estLow={estLow} estHigh={estHigh} cardCount={cards.length} />
            </div>

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
                  detail="Travel redemption typically unlocks far more than statement credit. Plan a trip to see live award options."
                  points={totalPoints}
                  estLow={estLow}
                  estHigh={estHigh}
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
              <button id="wallet-add" onClick={onAddCard} style={{
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

        {/* Editorial "Cards to know" — hand-picked, never "trending". Full-width below the grid. */}
        <div id="wallet-editorial"><EditorialCards /></div>

        {/* First-run walkthrough, anchored to the surface above. */}
        <Tour steps={WALLET_TOUR} open={tourOpen} onClose={closeTour} labelPrefix="WALLET" />
      </div>
    </CiqTheme>
  );
}

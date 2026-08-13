// components/ciq/WalletView.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HeroGauge } from './HeroGauge';
import { CardRow } from './CardRow';
import { BestMove } from './BestMove';
import { EditorialCards } from './EditorialCards';
import { Tour, type TourStep } from './Tour';
import { PageHeader } from './PageHeader';

// Wallet walkthrough — the reusable <Tour> anchored to this surface's elements.
// Two steps: what verification buys you, then adding a card. (The editorial strip
// is not toured; it moves to Home in Implementation-Plan Step 6.)
const WALLET_TOUR: TourStep[] = [
  {
    title: 'Your points, verified vs self-entered',
    body: 'The green slice is read straight from your statements. Grey is what you entered yourself. We never dress one up as the other.',
    anchor: '#wallet-gauge',
  },
  {
    title: 'Add a card',
    body: 'Enter a card by hand to keep a self-entered balance in view, or upload a statement to add a verified one.',
    anchor: '#wallet-add',
  },
];
const TOUR_SEEN_KEY = 'ciq_wallet_tour_v1';

type Card = {
  id: string; bank: string; card_name?: string; cardName?: string;
  card_last4?: string; points_balance: number; points_currency?: string;
  source: 'statement' | 'manual'; self_entered?: boolean;
};

export function WalletView({
  displayName, email, cards, totalPoints, primaryBank,
  onAddCard, onRefresh, refreshing, onEditPoints, onDeleteCard,
}: {
  displayName: string; email?: string; cards: Card[];
  totalPoints: number; primaryBank: string;
  onAddCard: () => void; onRefresh: () => void; refreshing?: boolean;
  onEditPoints?: (card: Card, points: number) => Promise<boolean>;
  onDeleteCard?: (card: Card) => void;
}) {
  // Verified vs estimated split on REAL POINT COUNTS (statement vs manual).
  // Rupee figures are only ever an ESTIMATE RANGE, never a stated value:
  //  - low  = cashback floor (~0.25/pt)
  //  - high = travel ceiling (~1.8/pt)
  // See docs/dashboard-data-audit.md §1 — the point count is real; the ₹ is not.
  const LOW_RATE = 0.25;
  const HIGH_RATE = 1.8;
  // Verified = read from a statement AND not since hand-edited. A hand-edited
  // statement card (self_entered) moves to the estimated/self-entered side.
  const isVerified = (c: Card) => c.source === 'statement' && !c.self_entered;
  const vPoints = cards.filter(isVerified).reduce((s, c) => s + (c.points_balance || 0), 0);
  const ePoints = cards.filter(c => !isVerified(c)).reduce((s, c) => s + (c.points_balance || 0), 0);
  const estLow = Math.round(totalPoints * LOW_RATE);
  const estHigh = Math.round(totalPoints * HIGH_RATE);
  const hasVerified = vPoints > 0;

  // Walkthrough is OPT-IN: it no longer auto-opens. A new user already meets the
  // first-run pricing modal and the onboarding wizard; a third forced full-screen
  // stop was too many. The Tour now opens only via the "Take a tour" affordance
  // below; closeTour still records that it was seen (TOUR_SEEN_KEY).
  const [tourOpen, setTourOpen] = useState(false);
  // Final step's button is "Add a card" and OPENS the modal (IA §6): on 'done'
  // set the seen-flag AND fire onAddCard; on 'skip' just remember it was seen.
  const closeTour = (reason: 'skip' | 'done') => {
    setTourOpen(false);
    try { localStorage.setItem(TOUR_SEEN_KEY, '1'); } catch {}
    if (reason === 'done') onAddCard();
  };

  // The transitional gold islands (BestMove + editorial) must FOLLOW the site
  // theme. If frozen to one theme they render pale-on-pale (dark mode) or
  // dark-on-dark, because the migrated wallet around them flips with the site
  // theme while [data-ciq] tokens would not. Track <html data-theme> live —
  // Header / AppRail / TabBar all set that attribute. Remove with the islands in
  // Step 6. (Default 'light' pre-hydration matches the site's default.)
  const [siteTheme, setSiteTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const read = () => setSiteTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);

  // WHITE/COPPER LIGHT SYSTEM. The wallet no longer wraps itself in <CiqTheme>
  // (the retired second theme key) — it renders on the single site theme
  // (creditiq-theme / data-theme on <html>). See docs/wallet/02-TRD §4.1.
  //
  // BestMove + the editorial strip are STILL rendered here (they move to Home in
  // Implementation-Plan Step 6, gated on Home importing them). They depend on the
  // retired [data-ciq] tokens/classes, so each is wrapped in a transitional
  // <div data-ciq data-theme="light"> island so it renders correctly until Step 6
  // removes the block AND the island together. Do not add new content to the islands.
  return (
    <div className="max-w-[420px] md:max-w-none mx-auto md:mx-0" style={{ position: 'relative' }}>
      {/* Theme toggle + sign out live in the TabBar "More" sheet (Settings +
          Sign out). The shell Header supplies the logo/top chrome. */}

      {/* Identity — the compact app template (shared <PageHeader>), lifted above the
          grid so the section tabs sit directly under it and span the full content width
          (docs/00-SIGNED-IN-IA.md §3a). Same eyebrow-pill + supporting-lines the header
          now models first-class, so dashboard is no longer bespoke. */}
      <div>
        <PageHeader
          eyebrow="Live · verified wallet"
          eyebrowPill
          pillDotColor="var(--prov-verified)"
          title={`Hi, ${displayName || 'there'}.`}
          supporting={
            <>
              {email && <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{email}</div>}
              <button onClick={() => setTourOpen(true)} className="mono" style={{
                marginTop: 8, fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase',
                color: 'var(--ink-3)', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                textDecoration: 'underline', textUnderlineOffset: 3,
              }}>Take a tour</button>
            </>
          }
          maxWidth={1100}
          showTabs={false}
        />
      </div>

      {/* responsive body: single column on mobile, two columns >=768px */}
      <div className="md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-6 md:items-start md:px-2 md:pt-4">

        {/* LEFT column: gauge + credo (greeting lifted out, above) */}
        <div>

          {/* HERO GAUGE — the signature */}
          <div id="wallet-gauge">
            <HeroGauge points={totalPoints} verifiedPoints={vPoints} estimatedPoints={ePoints}
              estLow={estLow} estHigh={estHigh} cardCount={cards.length} />
          </div>

          {/* honesty credo */}
          <div className="w-rise d2" style={{
            margin: '14px 0 0', display: 'flex', gap: 10, alignItems: 'flex-start', padding: '13px 15px',
            borderRadius: 16, background: 'color-mix(in srgb,var(--prov-verified) 7%,transparent)',
            border: '1px solid color-mix(in srgb,var(--prov-verified) 18%,transparent)',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ marginTop: 1, flex: '0 0 auto' }}>
              <path d="M12 2 4 5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5l-8-3Z" stroke="var(--prov-verified)" strokeWidth="1.7" />
              <path d="m9 12 2 2 4-4" stroke="var(--prov-verified)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>
              <b style={{ color: 'var(--prov-verified)' }}>We don&apos;t guess your money.</b> Verified values come from your real statements. Self-entered values are flagged — never inflated.
            </p>
          </div>
        </div>

        {/* RIGHT column: action — best move + cards */}
        <div>
          {/* best move — TRANSITIONAL gold island (moves to Home in Step 6).
              Follows the site theme + resets inherited ink to --ciq-ink so its
              text is legible in both themes. */}
          {totalPoints > 0 && (
            <div data-ciq data-theme={siteTheme} style={{ color: 'var(--ciq-ink)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '26px 0 12px' }}>
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
            </div>
          )}

          {/* verified-points CTA — prominent for anyone with zero verified points.
              This is a COPPER ACTION (not verified data), so it uses copper, never green. */}
          {!hasVerified && (
            <div className="w-rise d3" style={{
              margin: '26px 0 0', padding: 18, borderRadius: 18,
              background: 'color-mix(in srgb,var(--copper-3) 10%,transparent)', border: '1px solid color-mix(in srgb,var(--copper-3) 30%,transparent)',
            }}>
              <div className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--copper)' }}>
                Your next step
              </div>
              <h3 className="w-display" style={{ fontWeight: 600, fontSize: 17, letterSpacing: '-.01em', marginTop: 8, color: 'var(--ink)' }}>
                Get your verified points
              </h3>
              <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-2)', marginTop: 6 }}>
                Upload a bank statement and we read your real points balance in seconds. <b style={{ color: 'var(--ink)' }}>Verified from your statement — never guessed.</b>
              </p>
              <Link href="/upload-statement" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, padding: 13,
                borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none',
                background: 'var(--copper)', color: 'var(--surface)',
              }}>↑ Upload a statement</Link>
            </div>
          )}

          {/* cards */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '26px 0 12px' }}>
            <h2 className="w-display" style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' }}>Your cards</h2>
            <button onClick={onRefresh} className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
              {refreshing ? 'refreshing…' : 'refresh'}
            </button>
          </div>
          <div className="w-rise d4" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {cards.map(c => (
              <CardRow key={c.id} bank={c.bank} cardName={c.card_name || c.cardName || c.bank}
                last4={c.card_last4} points={c.points_balance} currency={c.points_currency}
                source={c.source} selfEntered={c.self_entered} variant="light"
                onSavePoints={onEditPoints ? (pts) => onEditPoints(c, pts) : undefined}
                onDelete={onDeleteCard ? () => onDeleteCard(c) : undefined} />
            ))}
            <button id="wallet-add" onClick={onAddCard} style={{
              border: '1.5px dashed color-mix(in srgb,var(--copper-3) 40%, var(--line))', borderRadius: 18, padding: 15, display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--copper)',
              fontWeight: 600, fontSize: 13.5, background: 'transparent', cursor: 'pointer',
            }}>＋ Add a card</button>
            {/* Upload entry stays reachable once the user already has verified points
                (the prominent CTA above only shows while they have none). */}
            {hasVerified && (
              <Link href="/upload-statement" style={{
                border: '1px solid var(--line-strong)', borderRadius: 18, padding: 13, display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--ink-2)',
                fontWeight: 600, fontSize: 12.5, background: 'var(--surface)', textDecoration: 'none',
              }}>↑ Upload a statement to verify more</Link>
            )}
          </div>
        </div>

      </div>

      {/* Editorial "Cards to know" — hand-picked, never "trending". Full-width below
          the grid. TRANSITIONAL gold island (moves to Home in Step 6); follows the
          site theme + resets inherited ink so headings/labels stay legible. */}
      <div data-ciq data-theme={siteTheme} id="wallet-editorial" style={{ color: 'var(--ciq-ink)' }}><EditorialCards /></div>

      {/* First-run walkthrough, anchored to the surface above. White/copper light
          variant; the final button reads "Add a card" and opens the modal. */}
      <Tour steps={WALLET_TOUR} open={tourOpen} onClose={closeTour} labelPrefix="WALLET"
        variant="light" finalLabel="Add a card" />
    </div>
  );
}

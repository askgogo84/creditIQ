// components/ciq/WalletView.tsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HeroGauge } from './HeroGauge';
import { CardRow } from './CardRow';
import { BestMove } from './BestMove';
import { EditorialCards } from './EditorialCards';
import { Tour, type TourStep } from './Tour';

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
  // Section eyebrow — ONE size/weight/letter-spacing for every row heading.
  const eyebrow = { fontSize: 18, fontWeight: 600, letterSpacing: '-.01em' } as const;

  // LAYOUT-ONLY restructure (rows 1–4), ONE FRAME PER GROUP: a bordered element
  // never contains another bordered one. HeroGauge (row 1) and the CardRows (row 3)
  // render with `flat` so the band / panel owns the single frame. Two paddings only —
  // 24 for the hero band, 18 for every other container — radius --r-lg on each
  // container, 24 section gap, 0 row gap (hairlines in --line instead). BestMove +
  // EditorialCards stay untouched transitional gold islands (move to Home in Step 6).
  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ROW 1 — hero band: greeting (left) + gauge (right) in ONE 24-padded card.
          Email line dropped. Collapses to greeting-over-gauge <768px. */}
      <section style={{
        borderRadius: 'var(--r-lg)', border: '1px solid var(--line-strong)',
        background: 'var(--surface)', boxShadow: 'var(--shadow-lg)', padding: 24,
      }}>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* greeting */}
          <div className="md:basis-2/5 md:shrink-0">
            <div style={{ marginBottom: 12 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px',
                borderRadius: 999, fontFamily: 'var(--font-mono, monospace)', fontSize: 10.5,
                fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: 'var(--ink-2)', background: 'var(--line)', border: '1px solid var(--line-strong)',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--prov-verified)', flex: '0 0 auto' }} />
                Live · verified wallet
              </span>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-display, inherit)', fontWeight: 600, fontSize: 30,
              letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--ink)', margin: 0,
            }}>
              Hi, {displayName || 'there'}.
            </h1>
            <button onClick={() => setTourOpen(true)} className="mono" style={{
              marginTop: 8, fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase',
              color: 'var(--ink-3)', background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              textDecoration: 'underline', textUnderlineOffset: 3,
            }}>Take a tour</button>
          </div>
          {/* gauge — flat inside the band (band owns the frame) */}
          <div id="wallet-gauge" className="md:flex-1 md:min-w-0">
            <HeroGauge points={totalPoints} verifiedPoints={vPoints} estimatedPoints={ePoints}
              estLow={estLow} estHigh={estHigh} cardCount={cards.length} flat />
          </div>
        </div>
      </section>

      {/* ROW 2 — upload CTA as its own full-width strip. ONE CTA, existing
          hasVerified conditional intact: copper "get verified" while none are
          verified, quiet "verify more" once some are. */}
      {!hasVerified ? (
        <div className="w-rise d3" style={{
          padding: 18, borderRadius: 'var(--r-lg)',
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
      ) : (
        <Link href="/upload-statement" style={{
          padding: 18, borderRadius: 'var(--r-lg)', border: '1px solid var(--line-strong)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--ink-2)',
          fontWeight: 600, fontSize: 12.5, background: 'var(--surface)', textDecoration: 'none',
        }}>↑ Upload a statement to verify more</Link>
      )}

      {/* ROW 3 — two columns, both starting at the same y. */}
      <div className="flex flex-col md:flex-row gap-6 md:items-start">

        {/* LEFT ~62% — Your cards: ONE panel, rows flat + hairline-separated,
            "+ Add a card" the final row inside the same panel. */}
        <div className="md:basis-[62%] md:shrink-0">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 className="w-display" style={eyebrow}>Your cards</h2>
            <button onClick={onRefresh} className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer' }}>
              {refreshing ? 'refreshing…' : 'refresh'}
            </button>
          </div>
          <div className="w-rise d4" style={{
            border: '1px solid var(--line-strong)', borderRadius: 'var(--r-lg)', overflow: 'hidden', background: 'var(--surface)',
          }}>
            {cards.map((c, i) => (
              <div key={c.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}>
                <CardRow bank={c.bank} cardName={c.card_name || c.cardName || c.bank}
                  last4={c.card_last4} points={c.points_balance} currency={c.points_currency}
                  source={c.source} selfEntered={c.self_entered} variant="light" flat
                  onSavePoints={onEditPoints ? (pts) => onEditPoints(c, pts) : undefined}
                  onDelete={onDeleteCard ? () => onDeleteCard(c) : undefined} />
              </div>
            ))}
            {/* final row inside the same panel — flat, hairline top, no dashed box */}
            <button id="wallet-add" onClick={onAddCard} style={{
              width: '100%', borderTop: cards.length ? '1px solid var(--line)' : 'none',
              padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              color: 'var(--copper)', fontWeight: 600, fontSize: 13.5, background: 'transparent',
              border: 'none', cursor: 'pointer',
            }}>＋ Add a card</button>
          </div>
        </div>

        {/* RIGHT ~38% — Your best move, then the credo beneath at reduced weight. */}
        <div className="md:flex-1 md:min-w-0">
          {/* best move — TRANSITIONAL gold island (moves to Home in Step 6). */}
          {totalPoints > 0 && (
            <div data-ciq data-theme={siteTheme} style={{ color: 'var(--ciq-ink)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 className="ciq-display" style={eyebrow}>Your best move</h2>
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

          {/* honesty credo — beneath best move, reduced weight */}
          <div className="w-rise d3" style={{
            marginTop: totalPoints > 0 ? 24 : 0, display: 'flex', gap: 10, alignItems: 'flex-start', padding: 18,
            borderRadius: 'var(--r-lg)', background: 'color-mix(in srgb,var(--prov-verified) 7%,transparent)',
            border: '1px solid color-mix(in srgb,var(--prov-verified) 18%,transparent)',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ marginTop: 1, flex: '0 0 auto' }}>
              <path d="M12 2 4 5v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V5l-8-3Z" stroke="var(--prov-verified)" strokeWidth="1.7" />
              <path d="m9 12 2 2 4-4" stroke="var(--prov-verified)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>
              <b style={{ color: 'var(--prov-verified)', fontWeight: 600 }}>We don&apos;t guess your money.</b> Verified values come from your real statements. Self-entered values are flagged — never inflated.
            </p>
          </div>
        </div>

      </div>

      {/* ROW 4 — "Cards to know", full width. TRANSITIONAL gold island (moves to
          Home in Step 6); follows the site theme so labels stay legible. */}
      <div data-ciq data-theme={siteTheme} id="wallet-editorial" style={{ color: 'var(--ciq-ink)' }}><EditorialCards /></div>

      {/* First-run walkthrough, anchored to the surface above. White/copper light
          variant; the final button reads "Add a card" and opens the modal. */}
      <Tour steps={WALLET_TOUR} open={tourOpen} onClose={closeTour} labelPrefix="WALLET"
        variant="light" finalLabel="Add a card" />
    </div>
  );
}

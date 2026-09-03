// components/ciq/WalletView.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { HeroGauge } from './HeroGauge';
import { CardRow } from './CardRow';
import { BestMove } from './BestMove';
import { EditorialCards } from './EditorialCards';
import { Tour, type TourStep } from './Tour';
import './wallet-full-width.css';

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

const normaliseCardName = (value: string) => value.toLowerCase()
  .replace(/\b(bank|credit|card|metal|edition|signature|world)\b/g, ' ')
  .replace(/[^a-z0-9]+/g, ' ').trim();

function catalogueCard(card: Card) {
  const held = normaliseCardName(`${card.bank} ${card.card_name || card.cardName || ''}`);
  const heldName = normaliseCardName(card.card_name || card.cardName || '');
  return SEED_CARDS.find((candidate) => {
    const seed = normaliseCardName(`${candidate.bank} ${candidate.name}`);
    const seedName = normaliseCardName(candidate.name);
    return seed === held || seed.includes(held) || held.includes(seed) ||
      (heldName.length >= 5 && (seedName.includes(heldName) || heldName.includes(seedName)));
  });
}

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

  const [balancesHidden, setBalancesHidden] = useState(false);
  const verifiedCards = cards.filter(isVerified).length;
  const selfEnteredCards = cards.length - verifiedCards;

  return (
    <div className="wallet-dashboard">
      <header className="wallet-page-head">
        <div>
          <div className="wallet-eyebrow"><i /> Live · verified wallet</div>
          <h1>Good to see you, <em>{displayName || 'there'}.</em></h1>
          <p>Your cards, verified balances and next best move — in one honest view.</p>
          <button className="wallet-tour-link" onClick={() => setTourOpen(true)}>Take a tour</button>
        </div>
        <div className="wallet-page-actions">
          <button type="button" className="wallet-secondary" aria-pressed={balancesHidden}
            onClick={() => setBalancesHidden((hidden) => !hidden)}>
            {balancesHidden ? 'Show balances' : 'Hide balances'}
          </button>
          <Link className="wallet-primary" href="/upload-statement">Verify more</Link>
        </div>
      </header>

      <div className="wallet-top-grid">
        <section className="wallet-surface wallet-portfolio" id="wallet-gauge">
          <div className="wallet-surface-label">Your rewards portfolio</div>
          <HeroGauge points={totalPoints} verifiedPoints={vPoints} estimatedPoints={ePoints}
            estLow={estLow} estHigh={estHigh} cardCount={cards.length} flat balancesHidden={balancesHidden} />
        </section>

        {totalPoints > 0 && (
          <section aria-labelledby="best-move-heading">
            <h2 id="best-move-heading" className="wallet-section-title">Your best move</h2>
            <BestMove flag="Best value"
              title={balancesHidden ? 'Put your points to work on travel' : `Redeem your ${totalPoints.toLocaleString('en-IN')} points for travel`}
              detail="Travel can unlock more value than statement credit. Search award options before you transfer."
              points={totalPoints} estLow={estLow} estHigh={estHigh}
              href={`/trip-planner?points=${totalPoints}&bank=${primaryBank}`}
              variant="light" balancesHidden={balancesHidden} />
          </section>
        )}

        <section className="wallet-surface wallet-insights" aria-label="Wallet insights">
          <div className="wallet-insight"><span className="green">✓</span><div><small>Verified points</small><b>{balancesHidden ? '••••' : vPoints.toLocaleString('en-IN')}</b></div></div>
          <div className="wallet-insight"><span>▰</span><div><small>Cards tracked</small><b>{cards.length}</b></div></div>
          <div className="wallet-insight"><span className="gold">↗</span><div><small>Verified cards</small><b>{verifiedCards} of {cards.length}</b></div></div>
          <div className="wallet-insight"><span>◎</span><div><small>Self-entered</small><b>{selfEnteredCards}</b></div></div>
        </section>
      </div>

      <div className="wallet-lower-grid">
        <section>
          <div className="wallet-section-head">
            <div><h2 className="wallet-section-title">Your cards</h2><p>Real balances, with their source shown clearly.</p></div>
            <button onClick={onRefresh} className="wallet-text-button">{refreshing ? 'Refreshing…' : 'Refresh'}</button>
          </div>
          <div className="wallet-surface wallet-card-list">
            {cards.map((c, i) => (
              <div key={c.id} className={i ? 'wallet-card-divider' : undefined}>
                <CardRow bank={c.bank} cardName={c.card_name || c.cardName || c.bank}
                  last4={c.card_last4} points={c.points_balance} currency={c.points_currency}
                  source={c.source} selfEntered={c.self_entered} variant="light" flat
                  card={catalogueCard(c)} balancesHidden={balancesHidden}
                  onSavePoints={onEditPoints ? (pts) => onEditPoints(c, pts) : undefined}
                  onDelete={onDeleteCard ? () => onDeleteCard(c) : undefined} />
              </div>
            ))}
            {cards.length === 0 && <p className="wallet-empty">No cards yet. Add one manually or verify a statement.</p>}
            <button id="wallet-add" onClick={onAddCard} className="wallet-add-card">＋ Add a card</button>
          </div>
        </section>

        <aside>
          <div className="wallet-section-head"><div><h2 className="wallet-section-title">Worth your attention</h2><p>Useful next steps based on this wallet.</p></div></div>
          <div className="wallet-surface wallet-attention">
            <Link href={`/trip-planner?points=${totalPoints}&bank=${primaryBank}`}><span className="gold">✈</span><div><b>Plan a trip with your points</b><small>Compare executable award paths before transferring.</small></div><strong>→</strong></Link>
            <Link href="/spend"><span>₹</span><div><b>Optimize your next purchase</b><small>See which tracked card should pay.</small></div><strong>→</strong></Link>
            <Link href="/upload-statement"><span className={hasVerified ? 'green' : 'gold'}>✓</span><div><b>{hasVerified ? 'Verify more balances' : 'Get your verified points'}</b><small>{hasVerified ? `${verifiedCards} card ${verifiedCards === 1 ? 'balance is' : 'balances are'} statement-verified.` : 'Upload a statement so estimates are never presented as facts.'}</small></div><strong>→</strong></Link>
          </div>
          <div className="wallet-credo"><b>We don&apos;t guess your money.</b><span>Verified values come from statements. Self-entered values stay labelled.</span></div>
        </aside>
      </div>

      <div id="wallet-editorial"><EditorialCards variant="light" /></div>

      <Tour steps={WALLET_TOUR} open={tourOpen} onClose={closeTour} labelPrefix="WALLET"
        variant="light" finalLabel="Add a card" />
    </div>
  );
}

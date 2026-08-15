'use client';
// Shared pricing grid — the single source of the plan-card visuals so the first-run
// modal and the on-demand /profile "Get a membership" modal render the SAME cards and
// can't drift. Card DATA and the grid MARKUP live here; each modal supplies its own
// shell + choose handler (first-run stamps plan_chosen and can pick Free; membership is
// paid-only and just buys-or-closes).
import { PLANS } from '@/lib/plans';
import type { CheckoutPlan } from '@/lib/checkout';

export type CardKey = 'free' | CheckoutPlan;
export interface PlanCard {
  key: CardKey;
  eyebrow: string;
  price: string;
  caption: string;
  cta: string;
  paid: boolean;
  features: string[];
}

// Paid prices derive from lib/plans so the shown price is the charged price.
const rupees = (paise: number) => '₹' + (paise / 100).toLocaleString('en-IN');

// Ticks list ONLY what code enforces today (shape (a)). Paid tiers are gated by
// requirePro on exactly three routes: statement-truth, optimize, points-optimizer.
// Free features are genuinely free (no per-day search meter is printed — it's UNBUILT;
// see docs/PRICING-METER-DECISIONS.md). The three paid tiers are feature-identical
// except 12-month adds early mobile-app access — the truth of what Pro unlocks in code.
const PRO_FEATURES = [
  'Statement Truth — verified points from your real statement',
  'Optimize — best redemption for your points balance',
  'Points Optimizer — 3-path redemption plan',
];
const FREE_FEATURES = [
  'Search and compare every card we track',
  'CIRA — your AI credit-card assistant',
  'Award-flight search',
  'Card Roast, Card Switch & Spend Optimizer',
];

// Order: Free FIRST (375-first; desktop renders 2×2, so Free is top-left, never orphaned).
export const CARDS: PlanCard[] = [
  {
    key: 'free', eyebrow: 'FREE', price: '₹0', caption: 'Always free', cta: 'Continue free', paid: false,
    features: FREE_FEATURES,
  },
  {
    key: 'monthly', eyebrow: PLANS.monthly.label.toUpperCase(), price: rupees(PLANS.monthly.amount), caption: 'one-time', cta: 'Get this plan', paid: true,
    features: [...FREE_FEATURES, ...PRO_FEATURES],
  },
  {
    key: 'sixmonth', eyebrow: PLANS.sixmonth.label.toUpperCase(), price: rupees(PLANS.sixmonth.amount), caption: 'one-time', cta: 'Get this plan', paid: true,
    features: [...FREE_FEATURES, ...PRO_FEATURES],
  },
  {
    key: 'twelvemonth', eyebrow: PLANS.twelvemonth.label.toUpperCase(), price: rupees(PLANS.twelvemonth.amount), caption: 'one-time', cta: 'Get this plan', paid: true,
    features: [...FREE_FEATURES, ...PRO_FEATURES, 'Early mobile-app access'],
  },
];

// Paid-only view for the on-demand membership modal (₹149 / ₹499 / ₹999, no Free).
export const PAID_CARDS: PlanCard[] = CARDS.filter((c) => c.paid);

// Copper tick, not verified-green: CLAUDE.md reserves #4FBF87 for verified-from-statement.
function Tick() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="m5 13 4 4L19 7" stroke="var(--copper)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Presentational grid. Column count adapts: 4 cards → 2×2, 3 cards → 3-across, so the
// paid-only view sits side by side (no 3+1 orphan). Mobile is always single-column.
export function PricingGrid({
  cards, busy, onChoose,
}: {
  cards: PlanCard[];
  busy: boolean;
  onChoose: (card: PlanCard) => void;
}) {
  const cols = cards.length >= 4 ? 2 : cards.length;
  return (
    <>
      <div className={`pg-grid pg-cols-${cols}`} style={{ marginTop: 20, display: 'grid', gap: 12 }}>
        {cards.map((card) => (
          <div
            key={card.key}
            className="pg-card"
            style={{
              display: 'flex', flexDirection: 'column',
              background: 'var(--surface-2, #fff)', border: '1px solid var(--line-strong)',
              borderRadius: 14, padding: '18px 16px',
            }}
          >
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--copper)' }}>
              {card.eyebrow}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 8 }}>
              <span className="w-display" style={{ fontSize: 30, fontWeight: 600, letterSpacing: '-.03em', color: 'var(--ink)' }}>
                {card.price}
              </span>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{card.caption}</span>
            </div>

            <ul style={{ listStyle: 'none', margin: '14px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {card.features.map((f, i) => (
                <li key={i} style={{ display: 'flex', gap: 8, fontSize: 13, lineHeight: 1.4, color: 'var(--ink-2)' }}>
                  <Tick />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              disabled={busy}
              onClick={() => onChoose(card)}
              style={{
                marginTop: 16, width: '100%', minHeight: 46, borderRadius: 11, cursor: busy ? 'default' : 'pointer',
                fontSize: 14, fontWeight: 600, letterSpacing: '-.01em',
                border: card.paid ? 'none' : '1px solid var(--copper)',
                background: card.paid ? 'var(--copper)' : 'transparent',
                color: card.paid ? 'var(--surface)' : 'var(--copper)',
                opacity: busy ? 0.6 : 1, transition: 'opacity 0.15s ease',
              }}
            >
              {card.cta}
            </button>
          </div>
        ))}
      </div>
      <style>{`
        .pg-grid { grid-template-columns: 1fr; }
        @media (min-width: 640px) {
          .pg-cols-2 { grid-template-columns: 1fr 1fr; }
          .pg-cols-3 { grid-template-columns: 1fr 1fr 1fr; }
        }
      `}</style>
    </>
  );
}

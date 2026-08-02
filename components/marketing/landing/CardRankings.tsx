'use client';

import { useMemo } from 'react';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { matchCards } from '@/lib/engine';
import { EstimatedValue, UnverifiedRowBadge } from '@/components/cards/Unverified';
import { useSpend, rupeeShort } from './SpendContext';

// Card rankings, computed live from the engine (matchCards over SEED_CARDS) — never
// a hardcoded leaderboard. Reads the ONE shared spend from SpendContext (the hero's
// slider), so it can never contradict the hero's leak range. Every value is a real
// net-annual figure; provenance is Estimated for all rows until a statement is linked.
// Rankings are a shortlist, not a verdict — the top rows sit inside modelling error.
//
// Type A: Fraunces headline; Inter labels; JetBrains Mono figures.

const FR = "'Fraunces', Georgia, serif";
const IN = "'Inter', system-ui, sans-serif";
const MO = "'JetBrains Mono', ui-monospace, monospace";

const TOP_N = 6;

const INR = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');

// One honest, real subtitle per card from published fields — base earn rate + fee.
const ruleLine = (card: (typeof SEED_CARDS)[number]) => {
  const fee = card.annual_fee_inr > 0 ? `fee ${INR(card.annual_fee_inr)}` : 'no annual fee';
  return `${card.bank} · ${card.base_reward_rate}% base · ${fee}`;
};

const estPill = (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: 'rgba(107,107,109,.1)', border: '1px solid rgba(107,107,109,.3)', fontFamily: IN, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5b6169', whiteSpace: 'nowrap' }}>
    Estimated
  </span>
);

export function CardRankings() {
  const { spend } = useSpend();
  const ranked = useMemo(
    () => matchCards(SEED_CARDS, { monthly_total_inr: spend }).slice(0, TOP_N),
    [spend]
  );

  return (
    <div>
      <h2 style={{ fontFamily: FR, fontWeight: 300, fontSize: 'clamp(30px,4vw,54px)', lineHeight: 1.08, letterSpacing: '-0.015em', color: '#142335', margin: '16px 0 0', maxWidth: '22ch', textWrap: 'pretty' }}>
        Computed at <em style={{ fontStyle: 'italic', color: '#c2871f' }}>{rupeeShort(spend)}</em>/mo.
      </h2>
      <p style={{ fontFamily: IN, fontSize: 17, lineHeight: 1.6, color: '#2b385c', maxWidth: '58ch', margin: '14px 0 0' }}>
        Net annual value = earn from published rules, valued at cached redemption rates, minus the published
        fee. Move the spend slider up in the hero and every row recomputes.
      </p>

      {/* Table — 1px sand-line border, no shadow. 1fr auto auto holds at 375px. */}
      <div style={{ marginTop: 30, border: '1px solid #e5d9cc', borderRadius: 18, background: '#ffffff', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, padding: '14px 24px', background: '#f1ece4', borderBottom: '1px solid #e5d9cc', fontFamily: IN, fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b6b6d' }}>
          <span>Card</span>
          <span style={{ textAlign: 'right' }}>Net annual value</span>
          <span style={{ textAlign: 'right' }}>Provenance</span>
        </div>

        {ranked.map((r, i) => (
          <div key={r.card.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, alignItems: 'center', padding: '18px 24px', borderBottom: i < ranked.length - 1 ? '1px solid #f1ece4' : 'none' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: IN, fontSize: 16, fontWeight: 600, color: '#142335', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {r.card.name}
              </div>
              <div style={{ fontFamily: IN, fontSize: 13, color: '#6b6b6d', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ruleLine(r.card)}
              </div>
              <UnverifiedRowBadge slug={r.card.slug} style={{ marginTop: 6 }} />
            </div>
            <div style={{ fontFamily: MO, fontSize: 19, whiteSpace: 'nowrap', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              <EstimatedValue slug={r.card.slug} baseColor="#142335" mark={false}>{INR(r.annual_value_inr)}</EstimatedValue>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{estPill}</div>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: IN, fontSize: 14, lineHeight: 1.6, color: '#6b6b6d', margin: '16px 0 0', maxWidth: '62ch' }}>
        We never name a single best card. The top rows sit inside our modelling error — treat the order as a
        shortlist, not a verdict. Link your statements and each row switches from{' '}
        <span style={{ color: '#5b6169', fontWeight: 600 }}>estimated</span> to{' '}
        <span style={{ color: '#0b7a47', fontWeight: 600 }}>verified</span> on your own spend.
      </p>
    </div>
  );
}

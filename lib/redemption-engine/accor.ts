// lib/redemption-engine/accor.ts
//
// Sourced Accor ALL + HDFC facts for the v3.1 engine. This is the source of
// record for the flagship case. It is deliberately NOT wired to any surface in
// this pass — /stay-on-points integration is out of scope (Pass 1). It exists so
// the engine's tests, and a later controlled cutover, share one honest fixture
// rather than duplicating unsourced numbers.
//
// The uncertainty is preserved exactly as v3.1 requires:
//   • permitted amounts carry a SOURCE_CONFLICT: every reading permits 2,000 and
//     its multiples; the 1,000 floor is DISPUTED and is NOT marked VERIFIED.
//   • programme-eligible basis is UNKNOWN until the logged-in checkout settles it.
//   • the HDFC → Accor route is RATIO_ONLY: the 2:1 ratio is represented as an
//     integer rational { fromUnits: 2, toUnits: 1 } (the old 1:0.5 float never
//     enters engine arithmetic), and the transfer minimum/increment are ABSENT
//     because they are not sourced — never invented as 0, 1 or anything else.

import type {
  FixedValueRules,
  ActiveTransferRoute,
  PermittedAmounts,
  Booking,
} from './types';

const ACCOR_TERMS = 'https://all.accor.com/'; // ALL T&C, EUR reference currency

/**
 * Accor's permitted redemption amounts. The conservative intersection is the
 * only thing every reading agrees on (§3.4):
 *   • Accor terms 21 Aug: minimum 2,000, in 2,000-point increments.
 *   • Handoff 31 Aug: 1,000 then increments of 2,000 (ambiguous).
 *   • ALL T&C eff. 13 Jul 2026: 1,000 = €20 or 2,000 = €40; above 2,000,
 *     multiples of 2,000.
 * Only the logged-in Accor checkout amount field can settle the 1,000 floor.
 */
export const ACCOR_PERMITTED: PermittedAmounts = {
  conservative: { min: 2000, increment: 2000 },
  disputed: [1000],
};

/**
 * The Accor FIXED_VALUE rule. fixed_value (2,000 pts = €40 = 4,000 cents) is
 * VERIFIED; permitted amounts are in SOURCE_CONFLICT; programme-eligible basis
 * is UNKNOWN. Programme-eligible bounds are booking-specific and are injected by
 * `withEligibilityBounds()` — never baked in.
 */
export const ACCOR_RULES: FixedValueRules = {
  programme_id: 'accor-all',
  currency_label: 'Accor ALL points',
  requires_direct_booking: {
    value: true,
    state: 'VERIFIED',
    source_url: ACCOR_TERMS,
    as_of: '2026-08-28',
  },
  booking_url: ACCOR_TERMS,
  pricing: 'FIXED_VALUE',
  mechanic: 'CASH_OFFSET',
  fixed_value: {
    value: { points: 2000, amount_minor: 4000, currency: 'EUR' },
    state: 'VERIFIED',
    source_url: ACCOR_TERMS,
    as_of: '2026-08-28',
  },
  permitted_amounts: {
    value: ACCOR_PERMITTED,
    state: 'SOURCE_CONFLICT',
    source_url: ACCOR_TERMS,
    as_of: '2026-08-28',
    conflict_note:
      'The 1,000-point floor is disputed across three published readings; only 2,000 and its multiples are common to all. Settle from the logged-in checkout amount field.',
    readings: [
      { conservative: { min: 2000, increment: 2000 }, disputed: [] },
      { conservative: { min: 1000, increment: 2000 }, disputed: [1000] },
    ],
  },
  programme_eligible: {
    value: { basis: 'TOTAL', excluded: [] },
    state: 'UNKNOWN',
    source_url: ACCOR_TERMS,
    as_of: '2026-08-28',
    conflict_note: 'Whether points offset the full bill or room-only is not directly sourced.',
  },
  min_booking_value_rule: {
    value: 'MUST_EXCEED_POINTS_VALUE',
    state: 'VERIFIED',
    source_url: ACCOR_TERMS,
    as_of: '2026-08-28',
  },
};

/**
 * §5.3 interim mitigation: bound the unknown eligible basis by room-only (lower)
 * and gross (upper), both already in the seed. This restores ranking under the
 * invariance test while leaving the EXACT instruction blocked.
 */
export function withEligibilityBounds(rules: FixedValueRules, booking: Booking): FixedValueRules {
  return {
    ...rules,
    programme_eligible_bounds: { minMinor: booking.roomOnlyMinor, maxMinor: booking.grossMinor },
  };
}

/**
 * HDFC Infinia → Accor ALL. RATIO_ONLY: ratio verified as the integer rational
 * { fromUnits: 2, toUnits: 1 } (2 bank points → 1 Accor point). Transfer minimum
 * and increment are ABSENT — they are not sourced, and are never invented. So
 * `bankPointsToTransferExact` is null on every path and the live route ships as a
 * target-plus-cautions, not "transfer exactly N".
 */
export const HDFC_ACCOR_ROUTE: ActiveTransferRoute = {
  status: 'ACTIVE',
  card_id: 'hdfc-infinia',
  programme_id: 'accor-all',
  ratio: {
    value: { fromUnits: 2, toUnits: 1 },
    state: 'VERIFIED',
    source_url: 'https://offers.smartbuy.hdfcbank.com/',
    as_of: '2026-08-28',
  },
  // min_transfer and transfer_increment intentionally ABSENT — not sourced.
  duration_hours: {
    value: { min: 48, max: 96 },
    state: 'VERIFIED',
    source_url: 'https://offers.smartbuy.hdfcbank.com/',
    as_of: '2026-08-28',
  },
  reversible: false,
};

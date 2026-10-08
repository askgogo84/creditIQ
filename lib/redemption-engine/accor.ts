// lib/redemption-engine/accor.ts
// Sourced Accor ALL + HDFC facts for the production v3.1 engine.
// Unknowns stay unknown; issuer/programme facts are never filled from inference.

import type { FixedValueRules, ActiveTransferRoute, PermittedAmounts, Booking } from './types';
import { HDFC_INFINIA_SOURCE, HDFC_INFINIA_AS_OF } from '@/lib/data/hdfc-transfer-partners';

const ACCOR_TERMS = 'https://all.accor.com/a/en/loyalty-program/legal/terms-and-conditions.html';
const ACCOR_AS_OF = '2026-10-04';

export const ACCOR_PERMITTED: PermittedAmounts = {
  conservative: { min: 2000, increment: 2000 },
  disputed: [1000],
  max_per_booking: 1_000_000,
};

export const ACCOR_RULES: FixedValueRules = {
  programme_id: 'accor-all',
  currency_label: 'Accor ALL points',
  requires_direct_booking: {
    value: true,
    state: 'VERIFIED',
    source_url: ACCOR_TERMS,
    as_of: '2026-08-28',
  },
  booking_url: 'https://all.accor.com/',
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
    as_of: ACCOR_AS_OF,
    conflict_note:
      'Section 10 allows an online 1,000-point exception followed by 2,000-point multiples, but also says online redemptions are multiples of 2,000. The same section caps an online booking at 1,000,000 points. Verify the 1,000-point exception in the selected checkout; do not infer 3,000 or 5,000-point amounts.',
    readings: [
      { conservative: { min: 2000, increment: 2000 }, disputed: [], max_per_booking: 1_000_000 },
      { conservative: { min: 2000, increment: 2000 }, disputed: [1000], max_per_booking: 1_000_000 },
    ],
  },
  programme_eligible: {
    value: { basis: 'TOTAL', excluded: [] },
    state: 'UNKNOWN',
    source_url: ACCOR_TERMS,
    as_of: ACCOR_AS_OF,
    conflict_note: 'Section 10 includes booked expenses but excludes some taxes online. The selected property, rate and checkout must supply the excluded amounts; at-hotel tax rules cannot be substituted.',
  },
  min_booking_value_rule: {
    value: 'MUST_EXCEED_POINTS_VALUE',
    state: 'VERIFIED',
    source_url: ACCOR_TERMS,
    as_of: '2026-08-28',
  },
};

export function withEligibilityBounds(rules: FixedValueRules, booking: Booking): FixedValueRules {
  return {
    ...rules,
    programme_eligible_bounds: { minMinor: booking.roomOnlyMinor, maxMinor: booking.grossMinor },
  };
}

/**
 * HDFC Infinia → Accor ALL. The issuer capture dated 31 Aug 2026 states a 1:0.5
 * transfer and "within 24 hours". Minimum/increment were not captured, so this
 * remains RATIO_ONLY and never emits an exact transfer instruction.
 */
export const HDFC_ACCOR_ROUTE: ActiveTransferRoute = {
  status: 'ACTIVE',
  card_id: 'hdfc-infinia',
  programme_id: 'accor-all',
  ratio: {
    value: { fromUnits: 2, toUnits: 1 },
    state: 'VERIFIED',
    source_url: HDFC_INFINIA_SOURCE,
    as_of: HDFC_INFINIA_AS_OF,
  },
  // min_transfer and transfer_increment intentionally ABSENT — not sourced.
  duration_hours: {
    value: { min: 24, max: 24 },
    state: 'VERIFIED',
    source_url: HDFC_INFINIA_SOURCE,
    as_of: HDFC_INFINIA_AS_OF,
  },
  reversible: false,
};

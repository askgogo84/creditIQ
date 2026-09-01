// lib/redemption-engine/accor.ts
// Sourced Accor ALL + HDFC facts for the v3.1 engine. Not wired to production yet.
// Unknowns stay unknown; issuer/programme facts are never filled from inference.

import type { FixedValueRules, ActiveTransferRoute, PermittedAmounts, Booking } from './types';
import { HDFC_INFINIA_SOURCE, HDFC_INFINIA_AS_OF } from '@/lib/data/hdfc-transfer-partners';

const ACCOR_TERMS = 'https://all.accor.com/';

export const ACCOR_PERMITTED: PermittedAmounts = {
  conservative: { min: 2000, increment: 2000 },
  disputed: [1000],
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
      'The 1,000-point floor is disputed across published readings; only 2,000 and its multiples are common to all. Settle from the logged-in checkout amount field.',
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

// lib/redemption-engine/types.ts
//
// The v3.1 type model (§2, §3). Impossible combinations are unconstructable
// rather than merely undocumented: the rules and transfer-route unions are
// discriminated, so e.g. a FIXED_VALUE rule paired with an AWARD_PRICE mechanic,
// or an UNAVAILABLE route carrying a fabricated ratio, will not typecheck.
//
// This is a NEW module (lib/redemption-engine/). The legacy lib/redemption.ts
// is untouched and unrelated; imports are unambiguous by directory.

import type { Rational } from './rational';

export type { Rational } from './rational';

// ── Provenance (carried from the v3 spec; v3.1 references Sourced<T>) ────────

export type RuleState = 'VERIFIED' | 'SOURCE_CONFLICT' | 'UNKNOWN';

export interface Sourced<T> {
  value: T;
  state: RuleState;
  source_url: string;
  as_of: string; // ISO date, re-captured before every release
  conflict_note?: string; // required in practice when state = 'SOURCE_CONFLICT'
  readings?: T[]; // every published reading, when they disagree
}

// ── 1.1 FX, stated once ─────────────────────────────────────────────────────

export interface FxRate {
  base: 'EUR';
  quote: 'INR';
  /** Paise per ONE WHOLE base unit. €1 = ₹110.50 → 11050. Integer. Never 110.5. */
  quoteMinorPerBaseUnit: number;
  as_of: string;
}

// ── 2.1 Rules — discriminated union on `pricing` ────────────────────────────

export type Mechanic = 'CASH_OFFSET' | 'AWARD_PRICE';

export interface EligibleBasis {
  basis: 'TOTAL' | 'ROOM_ONLY' | 'ROOM_PLUS_TAX';
  excluded: string[];
}

export interface PermittedAmounts {
  conservative: { min: number; increment: number };
  disputed: number[];
  max_per_booking?: number;
}

export interface RulesBase {
  programme_id: string;
  currency_label: string; // 'Accor ALL points' — never bare 'points'
  requires_direct_booking: Sourced<boolean>;
  booking_url: string;
}

export interface FixedValueRules extends RulesBase {
  pricing: 'FIXED_VALUE';
  mechanic: 'CASH_OFFSET';
  fixed_value: Sourced<{ points: number; amount_minor: number; currency: 'EUR' }>;
  permitted_amounts: Sourced<PermittedAmounts>;
  programme_eligible: Sourced<EligibleBasis>;
  /** §5.3 interim mitigation: room-only .. gross bracket, both already in seed. */
  programme_eligible_bounds?: { minMinor: number; maxMinor: number };
  min_booking_value_rule: Sourced<'MUST_EXCEED_POINTS_VALUE' | 'NONE'>;
}

export interface ChartAwardRules extends RulesBase {
  pricing: 'PUBLISHED_CHART';
  mechanic: 'AWARD_PRICE';
  award_chart: Sourced<{
    entries: Array<{
      zone_id: string;
      cabin: string;
      fare_tier: string; // Value | Prime
      points: number;
      taxes_minor?: number; // absent => UNKNOWN, suppresses the cash figure
    }>;
  }>;
}

export interface QuotedAwardRules extends RulesBase {
  pricing: 'QUOTE_REQUIRED';
  mechanic: 'AWARD_PRICE'; // CORRECTED — was CASH_OFFSET in v3
  quote?: AwardQuote; // absent => RecommendedPath 'QUOTE_REQUIRED'
}

export interface NotPricedRules extends RulesBase {
  pricing: 'NOT_PRICED';
  mechanic: null;
}

export type RedemptionRules =
  | FixedValueRules
  | ChartAwardRules
  | QuotedAwardRules
  | NotPricedRules;

export interface AwardQuote {
  programme_points: number;
  taxes_minor?: number; // absent => UNKNOWN
  captured_at: string;
  provenance: 'USER_ENTERED' | 'LIVE_LOOKUP';
}

// ── 2.2 Transfer route — absence is a variant, not a null-filled record ──────

export interface ActiveTransferRoute {
  status: 'ACTIVE';
  card_id: string;
  programme_id: string;
  ratio: Sourced<{ fromUnits: number; toUnits: number }>;
  min_transfer?: Sourced<number>; // BANK points; absent => RATIO_ONLY
  transfer_increment?: Sourced<number>; // BANK points; absent => RATIO_ONLY
  duration_hours: Sourced<{ min: number; max: number }>;
  reversible: false;
}

export interface EndedTransferRoute {
  status: 'ENDED';
  card_id: string;
  programme_id: string;
  ended_on: Sourced<string>; // Etihad Guest, 30 Jun 2026
  historic_ratio?: Sourced<{ fromUnits: number; toUnits: number }>; // preserved, unusable
}

export interface NoTransferRoute {
  status: 'UNAVAILABLE';
  card_id: string;
  programme_id: string;
  /** Sourced absence beats missing data (§2.2). No ratio or duration exists here. */
  absence_state: 'SOURCED_NONE' | 'NOT_CAPTURED';
}

export type TransferRoute = ActiveTransferRoute | EndedTransferRoute | NoTransferRoute;

// ── 2.3 Balances ────────────────────────────────────────────────────────────

export interface BankBalance {
  card_id: string;
  points: number;
  provenance: 'STATEMENT' | 'SELF_ENTERED';
  expires_on?: Sourced<string>; // absent = UNKNOWN. No "never expires" value exists.
}

export interface ProgrammeBalance {
  programme_id: string;
  points: number;
  provenance: 'PROGRAMME_LINKED' | 'STATEMENT' | 'SELF_ENTERED';
  expires_on?: Sourced<string>;
  inactivity_rule?: Sourced<{ months: number }>; // absent = unknown, never 'safe'
}

// ── Portal + booking inputs (INR-native; portal figures are FX-independent) ──

export interface PortalTerms {
  /** Paise per bank point in the portal. HDFC SmartBuy: 100 = ₹1. */
  value_paise_per_point: number;
  cap_bp: number; // 7000 = 70%
  fee_minor: number; // 9900 = ₹99, before tax
  fee_tax_bp: number; // 1800 = 18% GST
  eligible_basis: EligibleBasis;
  /** SOURCE_CONFLICT readings for the INVARIANCE_TEST (§3.3), when present. */
  value_readings?: number[];
  cap_readings?: number[];
  fee_readings?: number[];
}

export interface Booking {
  grossMinor: number; // total INR paise
  roomOnlyMinor: number; // INR paise — lower bound for eligibility (§5.3)
  roomPlusTaxMinor?: number;
  cashFareMinor?: number; // AWARD_PRICE benchmark, INR paise
  cabin?: string;
  fareTier?: string;
  zoneId?: string;
}

// ── 2.4 State axes ──────────────────────────────────────────────────────────

export type PricingState = 'FIXED_VALUE' | 'PUBLISHED_CHART' | 'QUOTE_REQUIRED' | 'NOT_PRICED';
export type TransferState = 'VERIFIED' | 'RATIO_ONLY' | 'UNAVAILABLE' | 'ENDED';
export type BalanceState =
  | 'SUFFICIENT'
  | 'SUFFICIENT_VIA_PROGRAMME_BALANCE'
  | 'PARTIAL'
  | 'BELOW_MINIMUM';

export type RecommendedPath =
  | 'TRANSFER_THEN_BOOK'
  | 'REDEEM_EXISTING_BALANCE'
  | 'PORTAL'
  | 'CASH_AND_RETAIN'
  | 'QUOTE_REQUIRED'
  | 'NO_RECOMMENDATION';

export type Objective =
  | 'MINIMISE_CASH_TODAY'
  | 'MAXIMISE_BANK_POINT_EFFICIENCY'; // divides by bank points ONLY; does not
// price the pre-existing programme points consumed.

export type InstructionBlocked =
  | 'TRANSFER_INCREMENT_UNVERIFIED'
  | 'TRANSFER_MINIMUM_UNVERIFIED'
  | 'PROGRAMME_ELIGIBLE_AMOUNT_UNKNOWN'
  | 'RATIO_SOURCE_CONFLICT'
  | null;

export interface RedemptionCandidate {
  kind: 'PROGRAMME' | 'PORTAL' | 'CASH';
  mechanic: Mechanic | null;

  programmePointsSpent: number;
  existingProgrammePointsConsumed: number;
  programmePointsReceived: number;
  residualProgrammeBalance: number;
  strandedResidualProgrammePoints: number;

  bankPointsRequiredMinimum: number; // pure arithmetic requirement
  bankPointsToTransferExact: number | null; // after min + increment; null if unverified
  bankPointsRetained: number;

  offsetMinor: number | null; // CASH_OFFSET only
  awardTaxesMinor: number | null; // AWARD_PRICE only
  benchmarkCashFareMinor: number | null; // AWARD_PRICE only — a comparison, not a bill
  benchmarkState: 'CAPTURED' | 'STALE' | 'UNAVAILABLE' | null;
  feeMinor: number;
  /** null only when AWARD_PRICE taxes are unknown and no cash figure may be emitted (§2, test 20). */
  cashPayableMinor: number | null;

  /** CASH_OFFSET only. Booking-specific. Never the programme-level comparison rate. */
  incrementalBookingOffsetPerTransferredBankPointPaise: Rational | null;

  /** AWARD_PRICE only. Inherits the benchmark fare's staleness. */
  cashAvoidedPerTransferredBankPointPaise: Rational | null;

  /** Diagnostic. NOT a pruning input (§0, §5). */
  marginalRateVsPreviousCandidate: Rational | null;

  instructionBlocked: InstructionBlocked;

  durationHours: { min: number; max: number } | null;
  irreversible: boolean;
  provenance: Sourced<unknown>[];
}

export interface ConflictReport {
  fact:
    | 'PERMITTED_AMOUNTS'
    | 'TRANSFER_RATIO'
    | 'FIXED_VALUE'
    | 'PORTAL_VALUE'
    | 'PORTAL_CAP'
    | 'FEE'
    | 'ELIGIBLE_BASIS';
  policy: 'INTERSECT' | 'INVARIANCE_TEST' | 'BLOCK';
  readings: unknown[];
  pathInvariant: boolean | null;
  effect: string;
}

export interface RedemptionPlan {
  pricingState: PricingState;
  transferState: TransferState;
  balanceState: BalanceState;
  ruleState: RuleState;
  recommendedPath: RecommendedPath;
  objective: Objective;

  /** Programme-level, property-independent for FIXED_VALUE. Decides transfer vs
   *  portal. Distinct from every per-candidate metric. */
  conversionValuePerBankPointPaise: Rational | null;
  fxState: 'LIVE' | 'UNAVAILABLE';

  candidates: RedemptionCandidate[];
  recommended: RedemptionCandidate | null;
  runnerUpUnderOtherObjective: RedemptionCandidate | null;

  balances: {
    bank: { points: number; expiresOn: string | null };
    programme: { points: number; expiresOn: string | null; latentPoints: number };
  };

  eliminated: Array<{
    reason:
      | 'UNAFFORDABLE'
      | 'UNAFFORDABLE_AFTER_INCREMENT'
      | 'ILLEGAL_AMOUNT'
      | 'DOMINATED'
      | 'TRANSFER_UNAVAILABLE'
      | 'RULE_UNKNOWN';
    wouldHaveSpent: number;
  }>;

  conflicts: ConflictReport[];
  blockedReason: string | null;
  provenance: Sourced<unknown>[];
}

// ── Engine input ────────────────────────────────────────────────────────────

export interface RedemptionInput {
  booking: Booking;
  bank: BankBalance;
  programmeBalance: ProgrammeBalance | null;
  rules: RedemptionRules;
  route: TransferRoute;
  portal: PortalTerms;
  /** External provider rate (EUR→INR decimal). Converted to integer paise ONCE
   *  at the engine boundary (§1.1). null when FX is unavailable — fail closed. */
  fxRate: number | null;
  objective?: Objective; // default MINIMISE_CASH_TODAY
}

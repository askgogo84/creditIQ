// lib/redemption-engine/types.ts

import type { Rational } from './rational';
export type { Rational } from './rational';

export type RuleState = 'VERIFIED' | 'SOURCE_CONFLICT' | 'UNKNOWN';

export interface Sourced<T> {
  value: T;
  state: RuleState;
  source_url: string;
  as_of: string;
  conflict_note?: string;
  readings?: T[];
}

export interface FxRate {
  base: 'EUR';
  quote: 'INR';
  quoteMinorPerBaseUnit: number;
  as_of: string;
}

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
  currency_label: string;
  requires_direct_booking: Sourced<boolean>;
  booking_url: string;
}

export interface FixedValueRules extends RulesBase {
  pricing: 'FIXED_VALUE';
  mechanic: 'CASH_OFFSET';
  fixed_value: Sourced<{ points: number; amount_minor: number; currency: 'EUR' }>;
  permitted_amounts: Sourced<PermittedAmounts>;
  programme_eligible: Sourced<EligibleBasis>;
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
      fare_tier: string;
      points: number;
      taxes_minor?: number;
    }>;
  }>;
}

export interface QuotedAwardRules extends RulesBase {
  pricing: 'QUOTE_REQUIRED';
  mechanic: 'AWARD_PRICE';
  quote?: AwardQuote;
}

export interface NotPricedRules extends RulesBase {
  pricing: 'NOT_PRICED';
  mechanic: null;
}

export type RedemptionRules = FixedValueRules | ChartAwardRules | QuotedAwardRules | NotPricedRules;

export interface AwardQuote {
  programme_points: number;
  taxes_minor?: number;
  captured_at: string;
  provenance: 'USER_ENTERED' | 'LIVE_LOOKUP';
}

export interface ActiveTransferRoute {
  status: 'ACTIVE';
  card_id: string;
  programme_id: string;
  ratio: Sourced<{ fromUnits: number; toUnits: number }>;
  min_transfer?: Sourced<number>;
  transfer_increment?: Sourced<number>;
  duration_hours: Sourced<{ min: number; max: number }>;
  reversible: false;
}

export interface EndedTransferRoute {
  status: 'ENDED';
  card_id: string;
  programme_id: string;
  ended_on: Sourced<string>;
  historic_ratio?: Sourced<{ fromUnits: number; toUnits: number }>;
}

export interface NoTransferRoute {
  status: 'UNAVAILABLE';
  card_id: string;
  programme_id: string;
  absence_state: 'SOURCED_NONE' | 'NOT_CAPTURED';
}

export type TransferRoute = ActiveTransferRoute | EndedTransferRoute | NoTransferRoute;

export interface BankBalance {
  card_id: string;
  points: number;
  provenance: 'STATEMENT' | 'SELF_ENTERED';
  expires_on?: Sourced<string>;
}

export interface ProgrammeBalance {
  programme_id: string;
  points: number;
  provenance: 'PROGRAMME_LINKED' | 'STATEMENT' | 'SELF_ENTERED';
  expires_on?: Sourced<string>;
  inactivity_rule?: Sourced<{ months: number }>;
}

export interface PortalTerms {
  value_paise_per_point: number;
  cap_bp: number;
  fee_minor: number;
  fee_tax_bp: number;
  eligible_basis: EligibleBasis;
  value_readings?: number[];
  cap_readings?: number[];
  fee_readings?: number[];
  /** Integration should populate this. Optional during isolated legacy-fixture tests. */
  provenance?: Sourced<unknown>[];
}

export interface Booking {
  grossMinor: number;
  roomOnlyMinor: number;
  roomPlusTaxMinor?: number;
  cashFareMinor?: number;
  /** Caller may label the benchmark stale; absent retains legacy fixture behaviour. */
  cashFareState?: 'CAPTURED' | 'STALE';
  cabin?: string;
  fareTier?: string;
  zoneId?: string;
}

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

export type Objective = 'MINIMISE_CASH_TODAY' | 'MAXIMISE_BANK_POINT_EFFICIENCY';

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
  bankPointsRequiredMinimum: number;
  bankPointsToTransferExact: number | null;
  bankPointsRetained: number;
  offsetMinor: number | null;
  awardTaxesMinor: number | null;
  benchmarkCashFareMinor: number | null;
  benchmarkState: 'CAPTURED' | 'STALE' | 'UNAVAILABLE' | null;
  feeMinor: number;
  cashPayableMinor: number | null;
  incrementalBookingOffsetPerTransferredBankPointPaise: Rational | null;
  cashAvoidedPerTransferredBankPointPaise: Rational | null;
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

export type EliminationReason =
  | 'UNAFFORDABLE'
  | 'UNAFFORDABLE_AFTER_INCREMENT'
  | 'ILLEGAL_AMOUNT'
  | 'DOMINATED'
  | 'TRANSFER_UNAVAILABLE'
  | 'RATIO_CONFLICT'
  | 'RULE_UNKNOWN';

export interface RedemptionPlan {
  pricingState: PricingState;
  transferState: TransferState;
  balanceState: BalanceState;
  ruleState: RuleState;
  recommendedPath: RecommendedPath;
  objective: Objective;
  conversionValuePerBankPointPaise: Rational | null;
  fxState: 'LIVE' | 'UNAVAILABLE';
  candidates: RedemptionCandidate[];
  recommended: RedemptionCandidate | null;
  runnerUpUnderOtherObjective: RedemptionCandidate | null;
  balances: {
    bank: { points: number; expiresOn: string | null; provenance: BankBalance['provenance'] };
    programme: {
      points: number;
      expiresOn: string | null;
      latentPoints: number;
      provenance: ProgrammeBalance['provenance'] | null;
    };
  };
  eliminated: Array<{ reason: EliminationReason; wouldHaveSpent: number }>;
  conflicts: ConflictReport[];
  blockedReason: string | null;
  provenance: Sourced<unknown>[];
}

export interface RedemptionInput {
  booking: Booking;
  bank: BankBalance;
  programmeBalance: ProgrammeBalance | null;
  rules: RedemptionRules;
  route: TransferRoute;
  portal: PortalTerms;
  fxRate: number | null;
  objective?: Objective;
}

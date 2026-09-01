// lib/redemption-engine/plan.ts
// Pure orchestrator for v3.1. Conflicts are evaluated fail-closed and executable
// recommendations must remain invariant across every accepted numeric reading.

import { rational, quoteMinorFromRate, offsetPaise, bankPointsForProgramme } from './rational';
import { findPermittedRedemptions, resolveEligible, type EngineContext } from './generate';
import { rankCandidates } from './rank';
import { validateRedemptionInput } from './validate';
import type {
  RedemptionInput,
  RedemptionPlan,
  RedemptionCandidate,
  RecommendedPath,
  TransferState,
  RuleState,
  PricingState,
  ConflictReport,
  Objective,
  Sourced,
} from './types';

const BASE_MINOR_PER_BASE_UNIT = 100;

interface Reading {
  fixedValue: { points: number; amount_minor: number } | null;
  portalValue: number;
  portalCap: number;
  fee: number;
  eligibleMinor: number | null;
}

interface VariantResult {
  candidates: RedemptionCandidate[];
  eliminated: RedemptionPlan['eliminated'];
  balanceState: RedemptionPlan['balanceState'];
  winner: RedemptionCandidate | null;
  runnerUp: RedemptionCandidate | null;
  path: RecommendedPath;
  quoteRequired: boolean;
}

interface TransferInfo {
  state: TransferState;
  ratio: { fromUnits: number; toUnits: number } | null;
  ratioConflict: boolean;
  minTransfer: number | null;
  transferIncrement: number | null;
  durationHours: { min: number; max: number } | null;
}

function sourcedList(input: RedemptionInput): Sourced<unknown>[] {
  const out: Sourced<unknown>[] = [
    input.rules.requires_direct_booking as Sourced<unknown>,
    ...input.portal.provenance,
  ];
  const { rules, route } = input;
  if (rules.pricing === 'FIXED_VALUE') {
    out.push(
      rules.fixed_value as Sourced<unknown>,
      rules.permitted_amounts as Sourced<unknown>,
      rules.programme_eligible as Sourced<unknown>,
      rules.min_booking_value_rule as Sourced<unknown>,
    );
  }
  if (rules.pricing === 'PUBLISHED_CHART') out.push(rules.award_chart as Sourced<unknown>);
  if (route.status === 'ACTIVE') {
    out.push(route.ratio as Sourced<unknown>, route.duration_hours as Sourced<unknown>);
    if (route.min_transfer) out.push(route.min_transfer as Sourced<unknown>);
    if (route.transfer_increment) out.push(route.transfer_increment as Sourced<unknown>);
  } else if (route.status === 'ENDED') {
    out.push(route.ended_on as Sourced<unknown>);
    if (route.historic_ratio) out.push(route.historic_ratio as Sourced<unknown>);
  }
  if (input.bank.expires_on) out.push(input.bank.expires_on as Sourced<unknown>);
  if (input.programmeBalance?.expires_on) out.push(input.programmeBalance.expires_on as Sourced<unknown>);
  if (input.programmeBalance?.inactivity_rule) out.push(input.programmeBalance.inactivity_rule as Sourced<unknown>);
  return out;
}

function transferInfo(input: RedemptionInput): TransferInfo {
  const { route } = input;
  if (route.status === 'UNAVAILABLE') {
    return {
      state: 'UNAVAILABLE',
      ratio: null,
      ratioConflict: false,
      minTransfer: null,
      transferIncrement: null,
      durationHours: null,
    };
  }
  if (route.status === 'ENDED') {
    return {
      state: 'ENDED',
      ratio: null,
      ratioConflict: false,
      minTransfer: null,
      transferIncrement: null,
      durationHours: null,
    };
  }
  const ratioConflict = route.ratio.state === 'SOURCE_CONFLICT';
  const minTransfer = route.min_transfer?.value ?? null;
  const transferIncrement = route.transfer_increment?.value ?? null;
  const state: TransferState =
    minTransfer !== null && transferIncrement !== null && !ratioConflict ? 'VERIFIED' : 'RATIO_ONLY';
  return {
    state,
    ratio: route.ratio.value,
    ratioConflict,
    minTransfer,
    transferIncrement,
    durationHours: route.duration_hours.value,
  };
}

function buildContext(
  input: RedemptionInput,
  reading: Reading,
  eligibilityUnknown: boolean,
  permitted: { min: number; increment: number; max_per_booking?: number } | null,
  transfer: TransferInfo,
  quoteMinor: number | null,
  provenance: Sourced<unknown>[],
): EngineContext {
  return {
    booking: input.booking,
    bank: input.bank,
    programmeBalance: input.programmeBalance,
    rules: input.rules,
    route: input.route,
    portal: {
      ...input.portal,
      value_paise_per_point: reading.portalValue,
      cap_bp: reading.portalCap,
      fee_minor: reading.fee,
    },
    quoteMinorPerBaseUnit: quoteMinor,
    ratio: transfer.ratio,
    ratioConflict: transfer.ratioConflict,
    minTransfer: transfer.minTransfer,
    transferIncrement: transfer.transferIncrement,
    durationHours: transfer.durationHours,
    permitted,
    fixedValue: reading.fixedValue,
    minBookingValueRule:
      input.rules.pricing === 'FIXED_VALUE' ? input.rules.min_booking_value_rule.value : 'NONE',
    programmeEligibleMinor: reading.eligibleMinor,
    eligibilityUnknown,
    provenance,
  };
}

function variantPath(
  input: RedemptionInput,
  gen: ReturnType<typeof findPermittedRedemptions>,
  winner: RedemptionCandidate | null,
  transferState: TransferState,
  eligibilityUnknownUnbounded: boolean,
): RecommendedPath {
  if (input.rules.pricing === 'NOT_PRICED') return 'NO_RECOMMENDATION';
  if (gen.quoteRequired) {
    return input.rules.pricing === 'QUOTE_REQUIRED' ? 'QUOTE_REQUIRED' : 'NO_RECOMMENDATION';
  }
  if (eligibilityUnknownUnbounded) return 'NO_RECOMMENDATION';
  if (
    (transferState === 'VERIFIED' || transferState === 'RATIO_ONLY') &&
    gen.legalSpendSet.length > 0 &&
    gen.balanceState === 'BELOW_MINIMUM'
  ) return 'NO_RECOMMENDATION';
  if (!winner) return 'NO_RECOMMENDATION';
  if (winner.kind === 'CASH') return 'CASH_AND_RETAIN';
  if (winner.kind === 'PORTAL') return 'PORTAL';
  return winner.bankPointsRequiredMinimum === 0 ? 'REDEEM_EXISTING_BALANCE' : 'TRANSFER_THEN_BOOK';
}

function evaluateVariant(
  input: RedemptionInput,
  reading: Reading,
  eligibilityUnknown: boolean,
  eligibilityUnbounded: boolean,
  permitted: { min: number; increment: number; max_per_booking?: number } | null,
  transfer: TransferInfo,
  quoteMinor: number | null,
  provenance: Sourced<unknown>[],
  objective: Objective,
): VariantResult {
  const gen = findPermittedRedemptions(
    buildContext(input, reading, eligibilityUnknown, permitted, transfer, quoteMinor, provenance),
  );
  const ranked = rankCandidates(gen.candidates, objective, transfer.state);
  return {
    candidates: ranked.ordered,
    eliminated: [...gen.eliminated, ...ranked.eliminated],
    balanceState: gen.balanceState,
    winner: ranked.winner,
    runnerUp: ranked.runnerUp,
    path: variantPath(input, gen, ranked.winner, transfer.state, eligibilityUnbounded),
    quoteRequired: gen.quoteRequired,
  };
}

/**
 * Numeric conflicts are safe only when the executable recommendation is stable,
 * not merely when the broad path label matches. This prevents an arbitrary
 * reading from leaking a different transfer target/cash figure under the same
 * TRANSFER_THEN_BOOK or PORTAL label.
 */
function recommendationSignature(variant: VariantResult): string {
  const winner = variant.winner;
  if (!winner) return `${variant.path}|none`;
  return [
    variant.path,
    winner.kind,
    winner.mechanic ?? '-',
    winner.programmePointsSpent,
    winner.bankPointsRequiredMinimum,
    winner.bankPointsToTransferExact ?? 'blocked',
    winner.cashPayableMinor ?? 'unknown',
    winner.offsetMinor ?? '-',
    winner.awardTaxesMinor ?? '-',
    winner.bankPointsRetained,
    winner.residualProgrammeBalance,
  ].join('|');
}

export function planRedemption(input: RedemptionInput): RedemptionPlan {
  validateRedemptionInput(input);

  const objective: Objective = input.objective ?? 'MINIMISE_CASH_TODAY';
  const provenance = sourcedList(input);
  const quoteMinor = input.fxRate == null ? null : quoteMinorFromRate(input.fxRate);
  const transfer = transferInfo(input);
  const conflicts: ConflictReport[] = [];
  const pricingState: PricingState = input.rules.pricing;

  let permitted: { min: number; increment: number; max_per_booking?: number } | null = null;
  if (input.rules.pricing === 'FIXED_VALUE') {
    const pa = input.rules.permitted_amounts;
    permitted = { ...pa.value.conservative, max_per_booking: pa.value.max_per_booking };
    if (pa.state === 'SOURCE_CONFLICT') {
      conflicts.push({
        fact: 'PERMITTED_AMOUNTS',
        policy: 'INTERSECT',
        readings: pa.readings ?? [pa.value],
        pathInvariant: null,
        effect: `Planned conservative intersection (min ${pa.value.conservative.min}, increment ${pa.value.conservative.increment}); disputed: ${pa.value.disputed.join(', ') || 'none'}.`,
      });
    }
  }

  if (transfer.ratioConflict) {
    conflicts.push({
      fact: 'TRANSFER_RATIO',
      policy: 'BLOCK',
      readings: input.route.status === 'ACTIVE' ? input.route.ratio.readings ?? [input.route.ratio.value] : [],
      pathInvariant: null,
      effect: 'Transfer ratio disputed; all transfer-requiring programme candidates are blocked. Zero-transfer redemptions may still survive.',
    });
  }

  const baseFixed =
    input.rules.pricing === 'FIXED_VALUE'
      ? { points: input.rules.fixed_value.value.points, amount_minor: input.rules.fixed_value.value.amount_minor }
      : null;
  const fixedReadings: Array<{ points: number; amount_minor: number } | null> =
    input.rules.pricing === 'FIXED_VALUE' && input.rules.fixed_value.state === 'SOURCE_CONFLICT'
      ? input.rules.fixed_value.readings!.map((reading) => ({ points: reading.points, amount_minor: reading.amount_minor }))
      : [baseFixed];

  if (input.rules.pricing === 'FIXED_VALUE' && input.rules.fixed_value.state === 'SOURCE_CONFLICT') {
    conflicts.push({
      fact: 'FIXED_VALUE',
      policy: 'INVARIANCE_TEST',
      readings: input.rules.fixed_value.readings!,
      pathInvariant: null,
      effect: 'Evaluated under every fixed-value reading.',
    });
  }

  const portalValues = input.portal.value_readings?.length ? input.portal.value_readings : [input.portal.value_paise_per_point];
  const portalCaps = input.portal.cap_readings?.length ? input.portal.cap_readings : [input.portal.cap_bp];
  const fees = input.portal.fee_readings?.length ? input.portal.fee_readings : [input.portal.fee_minor];
  if (portalValues.length > 1) conflicts.push({ fact: 'PORTAL_VALUE', policy: 'INVARIANCE_TEST', readings: portalValues, pathInvariant: null, effect: 'Evaluated under every portal-value reading.' });
  if (portalCaps.length > 1) conflicts.push({ fact: 'PORTAL_CAP', policy: 'INVARIANCE_TEST', readings: portalCaps, pathInvariant: null, effect: 'Evaluated under every portal-cap reading.' });
  if (fees.length > 1) conflicts.push({ fact: 'FEE', policy: 'INVARIANCE_TEST', readings: fees, pathInvariant: null, effect: 'Evaluated under every fee reading.' });

  let eligibilityUnknown = false;
  let eligibilityUnbounded = false;
  let eligibleReadings: Array<number | null> = [null];
  if (input.rules.pricing === 'FIXED_VALUE') {
    const eligible = input.rules.programme_eligible;
    if (eligible.state === 'UNKNOWN') {
      eligibilityUnknown = true;
      if (input.rules.programme_eligible_bounds) {
        eligibleReadings = [input.rules.programme_eligible_bounds.minMinor, input.rules.programme_eligible_bounds.maxMinor];
        conflicts.push({
          fact: 'ELIGIBLE_BASIS',
          policy: 'INVARIANCE_TEST',
          readings: eligibleReadings,
          pathInvariant: null,
          effect: 'Programme eligibility unknown; evaluated across supplied lower/upper bounds.',
        });
      } else {
        eligibilityUnbounded = true;
        eligibleReadings = [0];
      }
    } else {
      eligibleReadings = [resolveEligible(input.booking, eligible.value)];
    }
  }

  const readings: Reading[] = [];
  for (const fixedValue of fixedReadings) {
    for (const portalValue of portalValues) {
      for (const portalCap of portalCaps) {
        for (const fee of fees) {
          for (const eligibleMinor of eligibleReadings) {
            readings.push({ fixedValue, portalValue, portalCap, fee, eligibleMinor });
          }
        }
      }
    }
  }

  const variants = readings.map((reading) =>
    evaluateVariant(
      input,
      reading,
      eligibilityUnknown,
      eligibilityUnbounded,
      permitted,
      transfer,
      quoteMinor,
      provenance,
      objective,
    ),
  );
  const base = variants[0];

  const invarianceTested = conflicts.some((conflict) => conflict.policy === 'INVARIANCE_TEST');
  const signatures = variants.map(recommendationSignature);
  const recommendationInvariant = signatures.every((signature) => signature === signatures[0]);
  if (invarianceTested) {
    for (const conflict of conflicts) {
      if (conflict.policy !== 'INVARIANCE_TEST') continue;
      conflict.pathInvariant = recommendationInvariant;
      if (!recommendationInvariant) {
        conflict.effect = `Executable recommendation diverges across readings; no recommendation (${[...new Set(signatures)].join(' ; ')}).`;
      }
    }
  }

  let recommendedPath = base.path;
  let recommended = base.winner;
  let runnerUp = base.runnerUp;
  let blockedReason: string | null = null;

  if (invarianceTested && !recommendationInvariant) {
    recommendedPath = 'NO_RECOMMENDATION';
    recommended = null;
    runnerUp = null;
    blockedReason = 'Published readings disagree on the executable recommendation.';
  } else if (base.path === 'NO_RECOMMENDATION' || base.path === 'QUOTE_REQUIRED') {
    recommended = null;
    runnerUp = null;
    blockedReason =
      base.path === 'QUOTE_REQUIRED'
        ? 'Award pricing requires a quote before a recommendation can be made.'
        : eligibilityUnbounded
          ? 'Programme eligibility is unknown and unbounded.'
          : base.balanceState === 'BELOW_MINIMUM'
            ? 'The balance cannot reach the smallest permitted redemption.'
            : input.rules.pricing === 'NOT_PRICED'
              ? 'This programme is not priced.'
              : 'No recommendation.';
  }

  let awardTaxesUnknown = false;
  if (input.rules.pricing === 'PUBLISHED_CHART') {
    const match = input.rules.award_chart.value.entries.find(
      (entry) =>
        entry.zone_id === input.booking.zoneId &&
        entry.cabin === input.booking.cabin &&
        entry.fare_tier === input.booking.fareTier,
    );
    awardTaxesUnknown = Boolean(match && match.taxes_minor == null);
  } else if (input.rules.pricing === 'QUOTE_REQUIRED' && input.rules.quote) {
    awardTaxesUnknown = input.rules.quote.taxes_minor == null;
  }

  let ruleState: RuleState;
  if (eligibilityUnknown || awardTaxesUnknown) ruleState = 'UNKNOWN';
  else if (conflicts.length > 0) ruleState = 'SOURCE_CONFLICT';
  else ruleState = 'VERIFIED';

  let conversionValuePerBankPointPaise: RedemptionPlan['conversionValuePerBankPointPaise'] = null;
  if (
    input.rules.pricing === 'FIXED_VALUE' &&
    quoteMinor !== null &&
    transfer.state !== 'UNAVAILABLE' &&
    transfer.state !== 'ENDED' &&
    !transfer.ratioConflict &&
    transfer.ratio !== null
  ) {
    const fixed = readings[0].fixedValue;
    if (fixed) {
      const offset = offsetPaise(fixed.points, fixed.amount_minor, fixed.points, quoteMinor, BASE_MINOR_PER_BASE_UNIT);
      const bankFor = bankPointsForProgramme(fixed.points, transfer.ratio);
      if (bankFor > 0) conversionValuePerBankPointPaise = rational(offset, bankFor);
    }
  }

  const programmePoints = input.programmeBalance?.points ?? 0;
  const latentPoints = permitted && programmePoints > 0 && programmePoints < permitted.min ? programmePoints : 0;

  return {
    pricingState,
    transferState: transfer.state,
    balanceState: base.balanceState,
    ruleState,
    recommendedPath,
    objective,
    conversionValuePerBankPointPaise,
    fxState: quoteMinor !== null ? 'LIVE' : 'UNAVAILABLE',
    candidates: base.candidates,
    recommended,
    runnerUpUnderOtherObjective: runnerUp,
    balances: {
      bank: {
        points: input.bank.points,
        expiresOn: input.bank.expires_on?.value ?? null,
        provenance: input.bank.provenance,
      },
      programme: {
        points: programmePoints,
        expiresOn: input.programmeBalance?.expires_on?.value ?? null,
        latentPoints,
        provenance: input.programmeBalance?.provenance ?? null,
      },
    },
    eliminated: base.eliminated,
    conflicts,
    blockedReason,
    provenance,
  };
}

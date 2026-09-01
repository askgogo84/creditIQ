// lib/redemption-engine/plan.ts
//
// The v3.1 orchestrator: resolves conflicts per fact class (§3.3), runs the
// invariance test where required, ranks, and assembles the RedemptionPlan.
//
// Conflict policy, exactly per §3.3:
//   • Permitted amounts (set-valued) → INTERSECT: plan the conservative
//     intersection, surface the disputed members, rank normally.
//   • Transfer ratio → BLOCK: no exact instruction under any objective. A wrong
//     ratio on an irreversible transfer is unrecoverable.
//   • Fixed value / portal value / portal cap / fee → INVARIANCE_TEST: evaluate
//     the whole plan under EVERY reading; recommend only what all readings agree
//     on, else NO_RECOMMENDATION with the divergence reported.
//   • Eligible basis (UNKNOWN) → INVARIANCE_TEST across the room-only..gross
//     bounds (§5.3). Unbounded, it blocks the recommendation itself.

import { rational, quoteMinorFromRate, offsetPaise, bankPointsForProgramme } from './rational';
import { findPermittedRedemptions, resolveEligible, type EngineContext } from './generate';
import { rankCandidates } from './rank';
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
  label: string;
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

function sourcedList(input: RedemptionInput): Sourced<unknown>[] {
  const out: Sourced<unknown>[] = [];
  const { rules, route } = input;
  out.push(rules.requires_direct_booking as Sourced<unknown>);
  if (rules.pricing === 'FIXED_VALUE') {
    out.push(rules.fixed_value as Sourced<unknown>);
    out.push(rules.permitted_amounts as Sourced<unknown>);
    out.push(rules.programme_eligible as Sourced<unknown>);
    out.push(rules.min_booking_value_rule as Sourced<unknown>);
  }
  if (rules.pricing === 'PUBLISHED_CHART') out.push(rules.award_chart as Sourced<unknown>);
  if (route.status === 'ACTIVE') out.push(route.ratio as Sourced<unknown>);
  if (route.status === 'ENDED' && route.historic_ratio)
    out.push(route.historic_ratio as Sourced<unknown>);
  return out;
}

function transferInfo(input: RedemptionInput): {
  state: TransferState;
  ratio: { fromUnits: number; toUnits: number };
  ratioConflict: boolean;
  minTransfer: number | null;
  transferIncrement: number | null;
  durationHours: { min: number; max: number } | null;
} {
  const { route } = input;
  if (route.status === 'UNAVAILABLE') {
    return {
      state: 'UNAVAILABLE',
      ratio: { fromUnits: 1, toUnits: 1 }, // placeholder — never used for arithmetic
      ratioConflict: false,
      minTransfer: null,
      transferIncrement: null,
      durationHours: null,
    };
  }
  if (route.status === 'ENDED') {
    return {
      state: 'ENDED',
      ratio: route.historic_ratio?.value ?? { fromUnits: 1, toUnits: 1 }, // display only
      ratioConflict: false,
      minTransfer: null,
      transferIncrement: null,
      durationHours: null,
    };
  }
  // ACTIVE
  const ratioConflict = route.ratio.state === 'SOURCE_CONFLICT';
  const minTransfer = route.min_transfer ? route.min_transfer.value : null;
  const transferIncrement = route.transfer_increment ? route.transfer_increment.value : null;
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
  transfer: ReturnType<typeof transferInfo>,
  quote: number | null,
  provenance: Sourced<unknown>[],
): EngineContext {
  const portal = {
    ...input.portal,
    value_paise_per_point: reading.portalValue,
    cap_bp: reading.portalCap,
    fee_minor: reading.fee,
  };
  const minBookingValueRule =
    input.rules.pricing === 'FIXED_VALUE' ? input.rules.min_booking_value_rule.value : 'NONE';
  return {
    booking: input.booking,
    bank: input.bank,
    programmeBalance: input.programmeBalance,
    rules: input.rules,
    route: input.route,
    portal,
    quoteMinorPerBaseUnit: quote,
    ratio: transfer.ratio,
    ratioConflict: transfer.ratioConflict,
    minTransfer: transfer.minTransfer,
    transferIncrement: transfer.transferIncrement,
    durationHours: transfer.durationHours,
    permitted,
    fixedValue: reading.fixedValue,
    minBookingValueRule,
    programmeEligibleMinor: reading.eligibleMinor,
    eligibilityUnknown,
    provenance,
  };
}

/** Determine the recommended path for one variant, before the invariance gate. */
function variantPath(
  input: RedemptionInput,
  gen: ReturnType<typeof findPermittedRedemptions>,
  winner: RedemptionCandidate | null,
  transferState: TransferState,
  eligibilityUnknownUnbounded: boolean,
): RecommendedPath {
  const pricing = input.rules.pricing;
  if (pricing === 'NOT_PRICED') return 'NO_RECOMMENDATION';
  if (gen.quoteRequired) {
    return pricing === 'QUOTE_REQUIRED' ? 'QUOTE_REQUIRED' : 'NO_RECOMMENDATION';
  }
  if (eligibilityUnknownUnbounded) return 'NO_RECOMMENDATION';
  // A programme transfer is the intended answer but the balance cannot reach the
  // smallest permitted amount: decline rather than nudge to portal (§3.2 rule 7).
  // Only fires when there was genuinely a programme spend set to attempt — an
  // empty legal set means FX/rule was unavailable, not that the user fell short,
  // and portal/cash should still be ranked.
  if (
    (transferState === 'VERIFIED' || transferState === 'RATIO_ONLY') &&
    gen.legalSpendSet.length > 0 &&
    gen.balanceState === 'BELOW_MINIMUM'
  ) {
    return 'NO_RECOMMENDATION';
  }
  if (!winner) return 'NO_RECOMMENDATION';
  switch (winner.kind) {
    case 'CASH':
      return 'CASH_AND_RETAIN';
    case 'PORTAL':
      return 'PORTAL';
    case 'PROGRAMME':
      return winner.bankPointsRequiredMinimum === 0 ? 'REDEEM_EXISTING_BALANCE' : 'TRANSFER_THEN_BOOK';
  }
}

function evaluateVariant(
  input: RedemptionInput,
  reading: Reading,
  eligibilityUnknown: boolean,
  eligibilityUnbounded: boolean,
  permitted: { min: number; increment: number; max_per_booking?: number } | null,
  transfer: ReturnType<typeof transferInfo>,
  quote: number | null,
  provenance: Sourced<unknown>[],
  objective: Objective,
): VariantResult {
  const ctx = buildContext(
    input,
    reading,
    eligibilityUnknown,
    permitted,
    transfer,
    quote,
    provenance,
  );
  const gen = findPermittedRedemptions(ctx);
  const ranked = rankCandidates(gen.candidates, objective, transfer.state);
  const eliminated = [...gen.eliminated, ...ranked.eliminated];
  const path = variantPath(input, gen, ranked.winner, transfer.state, eligibilityUnbounded);
  return {
    candidates: ranked.ordered,
    eliminated,
    balanceState: gen.balanceState,
    winner: ranked.winner,
    runnerUp: ranked.runnerUp,
    path,
    quoteRequired: gen.quoteRequired,
  };
}

export function planRedemption(input: RedemptionInput): RedemptionPlan {
  const objective: Objective = input.objective ?? 'MINIMISE_CASH_TODAY';
  const provenance = sourcedList(input);
  const quote = input.fxRate == null ? null : quoteMinorFromRate(input.fxRate);
  const transfer = transferInfo(input);
  const conflicts: ConflictReport[] = [];

  const pricingState: PricingState = input.rules.pricing;

  // ── Resolve permitted amounts (INTERSECT) ─────────────────────────────────
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
        effect: `Planned the conservative intersection (min ${pa.value.conservative.min}, increment ${pa.value.conservative.increment}); disputed amounts surfaced: ${pa.value.disputed.join(', ') || 'none'}.`,
      });
    }
  }

  // ── Ratio conflict (BLOCK) ────────────────────────────────────────────────
  if (transfer.ratioConflict) {
    conflicts.push({
      fact: 'TRANSFER_RATIO',
      policy: 'BLOCK',
      readings:
        input.route.status === 'ACTIVE' ? input.route.ratio.readings ?? [input.route.ratio.value] : [],
      pathInvariant: null,
      effect: 'Transfer ratio disputed — no exact transfer instruction is produced under any objective.',
    });
  }

  // ── Build invariance-test dimensions (readings that vary the plan) ─────────
  const baseFixed =
    input.rules.pricing === 'FIXED_VALUE'
      ? { points: input.rules.fixed_value.value.points, amount_minor: input.rules.fixed_value.value.amount_minor }
      : null;

  const fixedReadings: Array<{ points: number; amount_minor: number }> =
    input.rules.pricing === 'FIXED_VALUE' && input.rules.fixed_value.state === 'SOURCE_CONFLICT'
      ? (input.rules.fixed_value.readings ?? []).map((r) => ({
          points: r.points,
          amount_minor: r.amount_minor,
        }))
      : baseFixed
        ? [baseFixed]
        : [null as unknown as { points: number; amount_minor: number }];

  if (input.rules.pricing === 'FIXED_VALUE' && input.rules.fixed_value.state === 'SOURCE_CONFLICT') {
    conflicts.push({
      fact: 'FIXED_VALUE',
      policy: 'INVARIANCE_TEST',
      readings: input.rules.fixed_value.readings ?? [input.rules.fixed_value.value],
      pathInvariant: null, // set after the test
      effect: 'Evaluated under every fixed-value reading.',
    });
  }

  const portalValues = input.portal.value_readings ?? [input.portal.value_paise_per_point];
  if (input.portal.value_readings && input.portal.value_readings.length > 1) {
    conflicts.push({
      fact: 'PORTAL_VALUE',
      policy: 'INVARIANCE_TEST',
      readings: input.portal.value_readings,
      pathInvariant: null,
      effect: 'Evaluated under every portal-value reading.',
    });
  }
  const portalCaps = input.portal.cap_readings ?? [input.portal.cap_bp];
  if (input.portal.cap_readings && input.portal.cap_readings.length > 1) {
    conflicts.push({
      fact: 'PORTAL_CAP',
      policy: 'INVARIANCE_TEST',
      readings: input.portal.cap_readings,
      pathInvariant: null,
      effect: 'Evaluated under every portal-cap reading.',
    });
  }
  const fees = input.portal.fee_readings ?? [input.portal.fee_minor];
  if (input.portal.fee_readings && input.portal.fee_readings.length > 1) {
    conflicts.push({
      fact: 'FEE',
      policy: 'INVARIANCE_TEST',
      readings: input.portal.fee_readings,
      pathInvariant: null,
      effect: 'Evaluated under every fee reading.',
    });
  }

  // ── Eligibility (INVARIANCE_TEST across bounds, §5.3) ──────────────────────
  let eligibilityUnknown = false;
  let eligibilityUnbounded = false;
  let eligibleReadings: number[] = [0]; // sentinel for non-FIXED
  if (input.rules.pricing === 'FIXED_VALUE') {
    const pe = input.rules.programme_eligible;
    if (pe.state === 'UNKNOWN') {
      eligibilityUnknown = true;
      if (input.rules.programme_eligible_bounds) {
        eligibleReadings = [
          input.rules.programme_eligible_bounds.minMinor,
          input.rules.programme_eligible_bounds.maxMinor,
        ];
        conflicts.push({
          fact: 'ELIGIBLE_BASIS',
          policy: 'INVARIANCE_TEST',
          readings: eligibleReadings,
          pathInvariant: null,
          effect: 'Programme-eligible basis unknown; evaluated across the room-only..gross bracket.',
        });
      } else {
        // Unbounded — the range runs to zero and blocks the recommendation itself.
        eligibilityUnbounded = true;
        eligibleReadings = [0];
      }
    } else {
      eligibleReadings = [resolveEligible(input.booking, pe.value)];
    }
  }

  // ── Cartesian product of the reading dimensions ───────────────────────────
  const readings: Reading[] = [];
  for (const fv of fixedReadings) {
    for (const pv of portalValues) {
      for (const pc of portalCaps) {
        for (const fee of fees) {
          for (const el of eligibleReadings) {
            readings.push({
              label: `fv=${fv ? fv.amount_minor : '-'};pv=${pv};cap=${pc};fee=${fee};el=${el}`,
              fixedValue: fv,
              portalValue: pv,
              portalCap: pc,
              fee,
              eligibleMinor: input.rules.pricing === 'FIXED_VALUE' ? el : null,
            });
          }
        }
      }
    }
  }

  const variantResults = readings.map((r) =>
    evaluateVariant(
      input,
      r,
      eligibilityUnknown,
      eligibilityUnbounded,
      permitted,
      transfer,
      quote,
      provenance,
      objective,
    ),
  );

  const base = variantResults[0];
  const invarianceTested = conflicts.some((c) => c.policy === 'INVARIANCE_TEST');
  const paths = variantResults.map((v) => v.path);
  const pathInvariant = paths.every((p) => p === paths[0]);

  if (invarianceTested) {
    for (const c of conflicts) {
      if (c.policy === 'INVARIANCE_TEST') {
        c.pathInvariant = pathInvariant;
        if (!pathInvariant) {
          c.effect = `Recommended path diverges across readings (${[...new Set(paths)].join(', ')}); no recommendation.`;
        }
      }
    }
  }

  // ── Assemble ──────────────────────────────────────────────────────────────
  let recommendedPath: RecommendedPath = base.path;
  let recommended: RedemptionCandidate | null = base.winner;
  let runnerUp: RedemptionCandidate | null = base.runnerUp;
  let blockedReason: string | null = null;

  if (invarianceTested && !pathInvariant) {
    recommendedPath = 'NO_RECOMMENDATION';
    recommended = null;
    runnerUp = null;
    blockedReason = 'Published readings disagree on the recommended path; recommending nothing (§3.3).';
  } else if (base.path === 'NO_RECOMMENDATION' || base.path === 'QUOTE_REQUIRED') {
    recommendedPath = base.path;
    recommended = null;
    runnerUp = null;
    blockedReason =
      base.path === 'QUOTE_REQUIRED'
        ? 'Award pricing requires a live quote before a recommendation can be made.'
        : eligibilityUnbounded
          ? 'Programme-eligible amount is unknown and unbounded, which blocks the recommendation itself (§5.3).'
          : base.balanceState === 'BELOW_MINIMUM'
            ? 'The balance cannot reach the smallest permitted redemption.'
            : input.rules.pricing === 'NOT_PRICED'
              ? 'This programme is not priced; no programme redemption can be recommended.'
              : 'No recommendation.';
  }

  // ── Award taxes unknown → the cash figure is suppressed; label the rule UNKNOWN.
  let awardTaxesUnknown = false;
  if (input.rules.pricing === 'PUBLISHED_CHART') {
    const match = input.rules.award_chart.value.entries.find(
      (e) =>
        (input.booking.zoneId == null || e.zone_id === input.booking.zoneId) &&
        (input.booking.cabin == null || e.cabin === input.booking.cabin) &&
        (input.booking.fareTier == null || e.fare_tier === input.booking.fareTier),
    );
    if (match && match.taxes_minor == null) awardTaxesUnknown = true;
  } else if (input.rules.pricing === 'QUOTE_REQUIRED' && input.rules.quote) {
    if (input.rules.quote.taxes_minor == null) awardTaxesUnknown = true;
  }

  // ── ruleState label ───────────────────────────────────────────────────────
  let ruleState: RuleState;
  if (
    eligibilityUnknown ||
    (input.rules.pricing === 'FIXED_VALUE' && permitted === null) ||
    awardTaxesUnknown
  ) {
    ruleState = 'UNKNOWN';
  } else if (conflicts.length > 0) {
    ruleState = 'SOURCE_CONFLICT';
  } else {
    ruleState = 'VERIFIED';
  }

  // ── conversionValuePerBankPointPaise (FIXED_VALUE, plan-level) ─────────────
  let conversionValuePerBankPointPaise = null as RedemptionPlan['conversionValuePerBankPointPaise'];
  if (input.rules.pricing === 'FIXED_VALUE' && quote != null && base.candidates.length >= 0) {
    const fv = readings[0].fixedValue;
    if (fv) {
      const offset = offsetPaise(fv.points, fv.amount_minor, fv.points, quote, BASE_MINOR_PER_BASE_UNIT);
      const bankFor = bankPointsForProgramme(fv.points, transfer.ratio);
      if (bankFor > 0) conversionValuePerBankPointPaise = rational(offset, bankFor);
    }
  }

  // ── Latent programme points (below the smallest permitted redemption) ──────
  const progPoints = input.programmeBalance?.points ?? 0;
  const latentPoints =
    permitted !== null && progPoints > 0 && progPoints < permitted.min ? progPoints : 0;

  const bankExpires = input.bank.expires_on?.value ?? null;
  const progExpires = input.programmeBalance?.expires_on?.value ?? null;

  return {
    pricingState,
    transferState: transfer.state,
    balanceState: base.balanceState,
    ruleState,
    recommendedPath,
    objective,
    conversionValuePerBankPointPaise,
    fxState: quote != null ? 'LIVE' : 'UNAVAILABLE',
    candidates: base.candidates,
    recommended,
    runnerUpUnderOtherObjective: runnerUp,
    balances: {
      bank: { points: input.bank.points, expiresOn: bankExpires },
      programme: { points: progPoints, expiresOn: progExpires, latentPoints },
    },
    eliminated: base.eliminated,
    conflicts,
    blockedReason,
    provenance,
  };
}

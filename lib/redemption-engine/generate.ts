// lib/redemption-engine/generate.ts
//
// B · Candidate generation (§4). Pure. No I/O, no float in decision arithmetic.
//
// Two properties easy to lose in implementation, both load-bearing:
//   1. The zero-transfer candidate is generated FIRST and UNCONDITIONALLY,
//      before any transfer-availability check. A holder of a programme balance
//      can spend it even when the transfer route is gone (§3.2 rule 4).
//   2. Affordability is tested TWICE — once on the arithmetic requirement, and
//      again AFTER min/increment rounding (§3.1). A requirement of 5,600 that
//      rounds to a permitted 6,000 against a balance of 5,800 is unaffordable.

import {
  offsetPaise,
  bankPointsForProgramme,
  programmePointsFromBank,
  roundUpTransfer,
  feeWithTax,
  portalCapMinor,
} from './rational';
import type {
  Booking,
  BankBalance,
  ProgrammeBalance,
  RedemptionRules,
  TransferRoute,
  PortalTerms,
  RedemptionCandidate,
  BalanceState,
  InstructionBlocked,
  EligibleBasis,
  Sourced,
} from './types';

/**
 * A fully-resolved numeric context: a SINGLE reading of every fact. plan.ts
 * builds one of these per invariance-test variant (§3.3) and calls generate
 * once per variant. Nothing here is conflicted or ambiguous — that is resolved
 * upstream.
 */
export interface EngineContext {
  booking: Booking;
  bank: BankBalance;
  programmeBalance: ProgrammeBalance | null;
  rules: RedemptionRules;
  route: TransferRoute;
  portal: PortalTerms;
  /** Integer paise per one whole base unit, or null when FX unavailable. */
  quoteMinorPerBaseUnit: number | null;

  ratio: { fromUnits: number; toUnits: number };
  ratioConflict: boolean;
  minTransfer: number | null; // verified BANK points, else null
  transferIncrement: number | null; // verified BANK points, else null
  durationHours: { min: number; max: number } | null;

  /** Resolved (intersected) permitted amounts for CASH_OFFSET. */
  permitted: { min: number; increment: number; max_per_booking?: number } | null;
  fixedValue: { points: number; amount_minor: number } | null;
  minBookingValueRule: 'MUST_EXCEED_POINTS_VALUE' | 'NONE';

  /** Resolved eligible amount (INR paise) for CASH_OFFSET, this variant. */
  programmeEligibleMinor: number | null;
  eligibilityUnknown: boolean;

  provenance: Sourced<unknown>[];
}

export interface GenerationResult {
  candidates: RedemptionCandidate[];
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
  balanceState: BalanceState;
  legalSpendSet: number[];
  /** True when the mechanic is AWARD_PRICE with no chart entry / no quote. */
  quoteRequired: boolean;
}

const BASE_MINOR_PER_BASE_UNIT = 100; // EUR cents per whole EUR

export function resolveEligible(booking: Booking, basis: EligibleBasis): number {
  switch (basis.basis) {
    case 'ROOM_ONLY':
      return booking.roomOnlyMinor;
    case 'ROOM_PLUS_TAX':
      return booking.roomPlusTaxMinor ?? booking.grossMinor;
    case 'TOTAL':
    default:
      return booking.grossMinor;
  }
}

/** Is an ACTIVE route fully verified for an EXACT transfer instruction? */
function transferExactComputable(ctx: EngineContext): boolean {
  return (
    ctx.route.status === 'ACTIVE' &&
    ctx.minTransfer !== null &&
    ctx.transferIncrement !== null &&
    !ctx.ratioConflict
  );
}

/** The most severe instruction blocker that applies to a transfer-requiring candidate. */
function baseInstructionBlocked(ctx: EngineContext): InstructionBlocked {
  if (ctx.ratioConflict) return 'RATIO_SOURCE_CONFLICT';
  if (ctx.eligibilityUnknown) return 'PROGRAMME_ELIGIBLE_AMOUNT_UNKNOWN';
  if (ctx.route.status === 'ACTIVE') {
    if (ctx.minTransfer === null) return 'TRANSFER_MINIMUM_UNVERIFIED';
    if (ctx.transferIncrement === null) return 'TRANSFER_INCREMENT_UNVERIFIED';
  }
  return null;
}

function makeCashCandidate(ctx: EngineContext): RedemptionCandidate {
  const prog = ctx.programmeBalance?.points ?? 0;
  const permittedMin = ctx.permitted?.min ?? null;
  // Cash consumes nothing; a programme balance below the smallest permitted
  // redemption sits stranded (§6.1: "1,200 stranded").
  const stranded =
    ctx.rules.mechanic === 'CASH_OFFSET' && permittedMin !== null && prog < permittedMin
      ? prog
      : 0;
  return {
    kind: 'CASH',
    mechanic: null,
    programmePointsSpent: 0,
    existingProgrammePointsConsumed: 0,
    programmePointsReceived: 0,
    residualProgrammeBalance: prog,
    strandedResidualProgrammePoints: stranded,
    bankPointsRequiredMinimum: 0,
    bankPointsToTransferExact: null,
    bankPointsRetained: ctx.bank.points,
    offsetMinor: null,
    awardTaxesMinor: null,
    benchmarkCashFareMinor: ctx.booking.cashFareMinor ?? null,
    benchmarkState: ctx.booking.cashFareMinor != null ? 'CAPTURED' : null,
    feeMinor: 0,
    cashPayableMinor: ctx.booking.grossMinor,
    incrementalBookingOffsetPerTransferredBankPointPaise: null,
    cashAvoidedPerTransferredBankPointPaise: null,
    marginalRateVsPreviousCandidate: null,
    instructionBlocked: null,
    durationHours: null,
    irreversible: false,
    provenance: ctx.provenance,
  };
}

function makePortalCandidate(ctx: EngineContext): RedemptionCandidate {
  const { portal, booking, bank } = ctx;
  const eligibleMinor = resolveEligible(booking, portal.eligible_basis); // portal's OWN basis
  const capMinor = portalCapMinor(eligibleMinor, portal.cap_bp);
  const maxByCap = Math.floor(capMinor / portal.value_paise_per_point);
  const pointsUsable = Math.max(0, Math.min(bank.points, maxByCap));
  const feeMinor = feeWithTax(portal.fee_minor, portal.fee_tax_bp);
  const offsetMinor = pointsUsable * portal.value_paise_per_point;
  const prog = ctx.programmeBalance?.points ?? 0;
  const permittedMin = ctx.permitted?.min ?? null;
  const stranded =
    ctx.rules.mechanic === 'CASH_OFFSET' && permittedMin !== null && prog < permittedMin
      ? prog
      : 0;
  return {
    kind: 'PORTAL',
    mechanic: 'CASH_OFFSET',
    programmePointsSpent: 0,
    existingProgrammePointsConsumed: 0,
    programmePointsReceived: 0,
    residualProgrammeBalance: prog, // untouched — reported
    strandedResidualProgrammePoints: stranded,
    bankPointsRequiredMinimum: pointsUsable,
    bankPointsToTransferExact: null, // portal spends bank points directly; no transfer
    bankPointsRetained: bank.points - pointsUsable,
    offsetMinor,
    awardTaxesMinor: null,
    benchmarkCashFareMinor: null,
    benchmarkState: null,
    feeMinor,
    cashPayableMinor: booking.grossMinor - offsetMinor + feeMinor,
    incrementalBookingOffsetPerTransferredBankPointPaise: null,
    cashAvoidedPerTransferredBankPointPaise: null,
    marginalRateVsPreviousCandidate: null,
    instructionBlocked: null,
    durationHours: null,
    irreversible: false,
    provenance: ctx.provenance,
  };
}

/** The permitted CASH_OFFSET spend amounts, filtered by eligibility (§4). */
function legalCashOffsetSet(ctx: EngineContext): number[] {
  const { permitted, fixedValue, programmeEligibleMinor } = ctx;
  if (!permitted || !fixedValue || ctx.quoteMinorPerBaseUnit == null) return [];
  const eligible = programmeEligibleMinor ?? 0;
  const out: number[] = [];
  const cap = permitted.max_per_booking ?? Number.POSITIVE_INFINITY;
  for (let a = permitted.min; a <= cap; a += permitted.increment) {
    const offset = offsetPaise(
      a,
      fixedValue.amount_minor,
      fixedValue.points,
      ctx.quoteMinorPerBaseUnit,
      BASE_MINOR_PER_BASE_UNIT,
    );
    // min_booking_value_rule MUST_EXCEED_POINTS_VALUE: the offset may not exceed
    // the eligible spend (you cannot discount more than the eligible amount).
    if (ctx.minBookingValueRule === 'MUST_EXCEED_POINTS_VALUE' && offset > eligible) break;
    out.push(a);
    // Safety valve: offsets are monotonic in `a`, so once past eligible we stop.
    if (offset > eligible && ctx.minBookingValueRule !== 'MUST_EXCEED_POINTS_VALUE') break;
  }
  return out;
}

/** Compute BalanceState from the legal set and both affordability views (§3.1). */
function computeBalanceState(
  legal: number[],
  affordableAll: Set<number>,
  affordableBankOnly: Set<number>,
): BalanceState {
  if (legal.length === 0 || affordableAll.size === 0) return 'BELOW_MINIMUM';
  const maxL = Math.max(...legal);
  const maxAll = Math.max(...affordableAll);
  const maxBank = affordableBankOnly.size > 0 ? Math.max(...affordableBankOnly) : -1;
  if (maxAll < maxL) return 'PARTIAL';
  if (maxBank === maxL) return 'SUFFICIENT';
  // maxBank < maxL === maxAll
  return 'SUFFICIENT_VIA_PROGRAMME_BALANCE';
}

export function findPermittedRedemptions(ctx: EngineContext): GenerationResult {
  const candidates: RedemptionCandidate[] = [];
  const eliminated: GenerationResult['eliminated'] = [];

  // CASH is always legal and always present.
  candidates.push(makeCashCandidate(ctx));
  // PORTAL is costed on its OWN eligible basis, always.
  candidates.push(makePortalCandidate(ctx));

  const { rules } = ctx;

  // NOT_PRICED → programme candidates suppressed (§3.2 rule 2).
  if (rules.pricing === 'NOT_PRICED') {
    return { candidates, eliminated, balanceState: 'BELOW_MINIMUM', legalSpendSet: [], quoteRequired: false };
  }

  // ── Determine the legal spend set L, by mechanic ──────────────────────────
  let legal: number[] = [];
  let mechanic: 'CASH_OFFSET' | 'AWARD_PRICE';
  let awardTaxesMinor: number | null = null;
  let benchmarkCashFareMinor: number | null = null;
  let quoteRequired = false;

  if (rules.pricing === 'FIXED_VALUE') {
    mechanic = 'CASH_OFFSET';
    // FX unavailable, or amount-rule unknown → cannot cost programme candidates.
    if (ctx.quoteMinorPerBaseUnit == null || ctx.permitted == null) {
      return {
        candidates,
        eliminated,
        balanceState: 'BELOW_MINIMUM',
        legalSpendSet: [],
        quoteRequired: false,
      };
    }
    legal = legalCashOffsetSet(ctx);
  } else {
    // PUBLISHED_CHART or QUOTE_REQUIRED → AWARD_PRICE
    mechanic = 'AWARD_PRICE';
    let entryPoints: number | null = null;
    if (rules.pricing === 'PUBLISHED_CHART') {
      const entries = rules.award_chart.value.entries;
      const match = entries.find(
        (e) =>
          (ctx.booking.zoneId == null || e.zone_id === ctx.booking.zoneId) &&
          (ctx.booking.cabin == null || e.cabin === ctx.booking.cabin) &&
          (ctx.booking.fareTier == null || e.fare_tier === ctx.booking.fareTier),
      );
      if (match) {
        entryPoints = match.points;
        awardTaxesMinor = match.taxes_minor ?? null;
      }
    } else {
      // QUOTE_REQUIRED
      if (rules.quote) {
        entryPoints = rules.quote.programme_points;
        awardTaxesMinor = rules.quote.taxes_minor ?? null;
      }
    }
    if (entryPoints == null) {
      // No chart entry / no quote → cost portal + cash only, flag QUOTE_REQUIRED.
      quoteRequired = true;
      return {
        candidates,
        eliminated,
        balanceState: 'BELOW_MINIMUM',
        legalSpendSet: [],
        quoteRequired,
      };
    }
    benchmarkCashFareMinor = ctx.booking.cashFareMinor ?? null;
    legal = [entryPoints]; // indivisible: exactly one candidate
  }

  const prog = ctx.programmeBalance?.points ?? 0;
  const ratio = ctx.ratio;
  const affordableAll = new Set<number>();
  const affordableBankOnly = new Set<number>();
  const exactComputable = transferExactComputable(ctx);
  const blockedBase = baseInstructionBlocked(ctx);
  const permittedMin = ctx.permitted?.min ?? 0;

  for (const spend of [...legal].sort((a, b) => a - b)) {
    // A_bank view (ignore programme balance): reachable from bank alone via
    // transfer. Only meaningful on an ACTIVE route.
    if (ctx.route.status === 'ACTIVE') {
      const bankOnlyReq = bankPointsForProgramme(spend, ratio);
      if (bankOnlyReq <= ctx.bank.points) affordableBankOnly.add(spend);
    }

    const fromExisting = Math.min(spend, prog);
    const shortfall = spend - fromExisting;

    // A transfer is required but the route is not ACTIVE (UNAVAILABLE/ENDED).
    // Do NOT compute a bank requirement — that would mean fabricating ratio
    // arithmetic on a route that has none (§2.2). The amount is unreachable.
    if (shortfall > 0 && ctx.route.status !== 'ACTIVE') {
      eliminated.push({ reason: 'TRANSFER_UNAVAILABLE', wouldHaveSpent: spend });
      continue;
    }

    const bankRequired = shortfall === 0 ? 0 : bankPointsForProgramme(shortfall, ratio);

    // Affordability check #1 — on the pure arithmetic requirement.
    if (bankRequired > ctx.bank.points) {
      eliminated.push({ reason: 'UNAFFORDABLE', wouldHaveSpent: spend });
      continue;
    }

    let exact: number | null = null;
    let instructionBlocked: InstructionBlocked = blockedBase;

    if (bankRequired > 0) {
      if (exactComputable && blockedBase === null) {
        exact = roundUpTransfer(bankRequired, ctx.minTransfer!, ctx.transferIncrement!);
        // Affordability check #2 — AFTER increment rounding (§3.1).
        if (exact > ctx.bank.points) {
          eliminated.push({ reason: 'UNAFFORDABLE_AFTER_INCREMENT', wouldHaveSpent: spend });
          continue;
        }
      } else {
        exact = null; // instruction stays blocked; the candidate still ranks
      }
    } else {
      // Zero-transfer candidate: no transfer instruction to block on transfer terms.
      instructionBlocked = ctx.ratioConflict
        ? 'RATIO_SOURCE_CONFLICT'
        : ctx.eligibilityUnknown
          ? 'PROGRAMME_ELIGIBLE_AMOUNT_UNKNOWN'
          : null;
    }

    affordableAll.add(spend);

    const sent = exact ?? bankRequired;
    const received = sent > 0 ? programmePointsFromBank(sent, ratio) : 0;
    const residual = prog + received - spend;
    const stranded = mechanic === 'CASH_OFFSET' && residual < permittedMin ? residual : 0;

    let offsetMinor: number | null;
    let cashPayableMinor: number | null;
    let candAwardTaxes: number | null;
    let candBenchmark: number | null;
    let benchmarkState: RedemptionCandidate['benchmarkState'];

    if (mechanic === 'CASH_OFFSET') {
      offsetMinor = offsetPaise(
        spend,
        ctx.fixedValue!.amount_minor,
        ctx.fixedValue!.points,
        ctx.quoteMinorPerBaseUnit!,
        BASE_MINOR_PER_BASE_UNIT,
      );
      cashPayableMinor = ctx.booking.grossMinor - offsetMinor;
      candAwardTaxes = null;
      candBenchmark = null;
      benchmarkState = null;
    } else {
      offsetMinor = null;
      candAwardTaxes = awardTaxesMinor;
      candBenchmark = benchmarkCashFareMinor;
      // AWARD_PRICE cash payable is the award taxes/fees — never gross − notional.
      // Taxes unknown → suppress the cash figure entirely (test 20).
      cashPayableMinor = awardTaxesMinor;
      benchmarkState =
        benchmarkCashFareMinor != null ? 'CAPTURED' : ('UNAVAILABLE' as const);
    }

    candidates.push({
      kind: 'PROGRAMME',
      mechanic,
      programmePointsSpent: spend,
      existingProgrammePointsConsumed: fromExisting,
      programmePointsReceived: received,
      residualProgrammeBalance: residual,
      strandedResidualProgrammePoints: stranded,
      bankPointsRequiredMinimum: bankRequired,
      bankPointsToTransferExact: exact,
      bankPointsRetained: ctx.bank.points - sent,
      offsetMinor,
      awardTaxesMinor: candAwardTaxes,
      benchmarkCashFareMinor: candBenchmark,
      benchmarkState,
      feeMinor: 0, // direct programme booking carries no portal fee
      cashPayableMinor,
      incrementalBookingOffsetPerTransferredBankPointPaise: null, // filled in rank
      cashAvoidedPerTransferredBankPointPaise: null, // filled in rank
      marginalRateVsPreviousCandidate: null, // filled in rank
      instructionBlocked,
      durationHours: bankRequired > 0 ? ctx.durationHours : null,
      irreversible: bankRequired > 0,
      provenance: ctx.provenance,
    });
  }

  const balanceState = computeBalanceState(legal, affordableAll, affordableBankOnly);

  return { candidates, eliminated, balanceState, legalSpendSet: legal, quoteRequired };
}

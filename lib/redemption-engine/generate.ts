// lib/redemption-engine/generate.ts
// Pure candidate generation. No I/O and no guessed financial facts.

import {
  offsetPaise,
  bankPointsForProgramme,
  programmePointsFromBank,
  roundUpTransfer,
  feeWithTax,
  portalCapMinor,
  floorDiv,
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
  EliminationReason,
} from './types';

export interface EngineContext {
  booking: Booking;
  bank: BankBalance;
  programmeBalance: ProgrammeBalance | null;
  rules: RedemptionRules;
  route: TransferRoute;
  portal: PortalTerms;
  quoteMinorPerBaseUnit: number | null;
  ratio: { fromUnits: number; toUnits: number } | null;
  ratioConflict: boolean;
  minTransfer: number | null;
  transferIncrement: number | null;
  durationHours: { min: number; max: number } | null;
  permitted: { min: number; increment: number; max_per_booking?: number } | null;
  fixedValue: { points: number; amount_minor: number } | null;
  minBookingValueRule: 'MUST_EXCEED_POINTS_VALUE' | 'NONE';
  programmeEligibleMinor: number | null;
  eligibilityUnknown: boolean;
  provenance: Sourced<unknown>[];
}

export interface GenerationResult {
  candidates: RedemptionCandidate[];
  eliminated: Array<{ reason: EliminationReason; wouldHaveSpent: number }>;
  balanceState: BalanceState;
  legalSpendSet: number[];
  quoteRequired: boolean;
}

const BASE_MINOR_PER_BASE_UNIT = 100;

export function resolveEligible(booking: Booking, basis: EligibleBasis): number {
  switch (basis.basis) {
    case 'ROOM_ONLY':
      return booking.roomOnlyMinor;
    case 'ROOM_PLUS_TAX':
      if (booking.roomPlusTaxMinor === undefined) {
        throw new Error('ROOM_PLUS_TAX eligibility requires roomPlusTaxMinor');
      }
      return booking.roomPlusTaxMinor;
    case 'TOTAL':
      return booking.grossMinor;
  }
}

function transferExactComputable(ctx: EngineContext): boolean {
  return (
    ctx.route.status === 'ACTIVE' &&
    ctx.ratio !== null &&
    ctx.minTransfer !== null &&
    ctx.transferIncrement !== null &&
    !ctx.ratioConflict
  );
}

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
  const stranded =
    ctx.rules.mechanic === 'CASH_OFFSET' && permittedMin !== null && prog > 0 && prog < permittedMin
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
    benchmarkState: ctx.booking.cashFareMinor !== undefined ? (ctx.booking.cashFareState ?? 'CAPTURED') : null,
    feeMinor: 0,
    cashPayableMinor: ctx.booking.grossMinor,
    incrementalBookingOffsetPerTransferredBankPointPaise: null,
    cashAvoidedPerTransferredBankPointPaise: null,
    marginalRateVsPreviousCandidate: null,
    instructionBlocked: null,
    durationHours: null,
    irreversible: false,
    provenance: [...ctx.provenance],
  };
}

function makePortalCandidate(ctx: EngineContext): RedemptionCandidate | null {
  const { portal, booking, bank } = ctx;
  const eligibleMinor = resolveEligible(booking, portal.eligible_basis);
  const capMinor = portalCapMinor(eligibleMinor, portal.cap_bp);
  const maxByCap = floorDiv(capMinor, portal.value_paise_per_point);
  const pointsUsable = Math.min(bank.points, maxByCap);
  if (pointsUsable <= 0) return null;

  const feeMinor = feeWithTax(portal.fee_minor, portal.fee_tax_bp);
  const offsetMinor = pointsUsable * portal.value_paise_per_point;
  const prog = ctx.programmeBalance?.points ?? 0;
  const permittedMin = ctx.permitted?.min ?? null;
  const stranded =
    ctx.rules.mechanic === 'CASH_OFFSET' && permittedMin !== null && prog > 0 && prog < permittedMin
      ? prog
      : 0;

  return {
    kind: 'PORTAL',
    mechanic: 'CASH_OFFSET',
    programmePointsSpent: 0,
    existingProgrammePointsConsumed: 0,
    programmePointsReceived: 0,
    residualProgrammeBalance: prog,
    strandedResidualProgrammePoints: stranded,
    bankPointsRequiredMinimum: pointsUsable,
    bankPointsToTransferExact: null,
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
    provenance: [...ctx.provenance],
  };
}

function legalCashOffsetSet(ctx: EngineContext): number[] {
  const { permitted, fixedValue, programmeEligibleMinor } = ctx;
  if (!permitted || !fixedValue || ctx.quoteMinorPerBaseUnit == null || programmeEligibleMinor == null) return [];

  const out: number[] = [];
  const cap = permitted.max_per_booking ?? Number.MAX_SAFE_INTEGER;
  for (let amount = permitted.min; amount <= cap; amount += permitted.increment) {
    const offset = offsetPaise(
      amount,
      fixedValue.amount_minor,
      fixedValue.points,
      ctx.quoteMinorPerBaseUnit,
      BASE_MINOR_PER_BASE_UNIT,
    );
    if (offset > programmeEligibleMinor) break;
    out.push(amount);
  }
  return out;
}

function effectiveBankRequirement(
  spend: number,
  programmePointsAlreadyHeld: number,
  ctx: EngineContext,
): number | null {
  if (ctx.route.status !== 'ACTIVE' || ctx.ratio === null || ctx.ratioConflict) return null;
  const shortfall = Math.max(0, spend - programmePointsAlreadyHeld);
  if (shortfall === 0) return 0;
  const arithmetic = bankPointsForProgramme(shortfall, ctx.ratio);
  if (transferExactComputable(ctx)) {
    return roundUpTransfer(arithmetic, ctx.minTransfer!, ctx.transferIncrement!);
  }
  return arithmetic;
}

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
  return 'SUFFICIENT_VIA_PROGRAMME_BALANCE';
}

export function findPermittedRedemptions(ctx: EngineContext): GenerationResult {
  const candidates: RedemptionCandidate[] = [makeCashCandidate(ctx)];
  const portalCandidate = makePortalCandidate(ctx);
  if (portalCandidate) candidates.push(portalCandidate);
  const eliminated: GenerationResult['eliminated'] = [];

  const { rules } = ctx;
  if (rules.pricing === 'NOT_PRICED') {
    return { candidates, eliminated, balanceState: 'BELOW_MINIMUM', legalSpendSet: [], quoteRequired: false };
  }

  let legal: number[] = [];
  let mechanic: 'CASH_OFFSET' | 'AWARD_PRICE';
  let awardTaxesMinor: number | null = null;
  let benchmarkCashFareMinor: number | null = null;
  let quoteRequired = false;

  if (rules.pricing === 'FIXED_VALUE') {
    mechanic = 'CASH_OFFSET';
    if (ctx.quoteMinorPerBaseUnit == null || ctx.permitted == null) {
      return { candidates, eliminated, balanceState: 'BELOW_MINIMUM', legalSpendSet: [], quoteRequired: false };
    }
    legal = legalCashOffsetSet(ctx);
  } else {
    mechanic = 'AWARD_PRICE';
    let entryPoints: number | null = null;
    if (rules.pricing === 'PUBLISHED_CHART') {
      const match = rules.award_chart.value.entries.find(
        (entry) =>
          entry.zone_id === ctx.booking.zoneId &&
          entry.cabin === ctx.booking.cabin &&
          entry.fare_tier === ctx.booking.fareTier,
      );
      if (match) {
        entryPoints = match.points;
        awardTaxesMinor = match.taxes_minor ?? null;
      }
    } else if (rules.quote) {
      entryPoints = rules.quote.programme_points;
      awardTaxesMinor = rules.quote.taxes_minor ?? null;
    }

    if (entryPoints == null) {
      // QUOTE_REQUIRED => ask for quote; PUBLISHED_CHART with no matching entry =>
      // fail closed through variantPath as NO_RECOMMENDATION.
      quoteRequired = true;
      return { candidates, eliminated, balanceState: 'BELOW_MINIMUM', legalSpendSet: [], quoteRequired };
    }
    benchmarkCashFareMinor = ctx.booking.cashFareMinor ?? null;
    legal = [entryPoints];
  }

  const programmeOpening = ctx.programmeBalance?.points ?? 0;
  const affordableAll = new Set<number>();
  const affordableBankOnly = new Set<number>();
  const exactComputable = transferExactComputable(ctx);
  const blockedBase = baseInstructionBlocked(ctx);
  const permittedMin = ctx.permitted?.min ?? 0;

  for (const spend of [...legal].sort((a, b) => a - b)) {
    const bankOnlyEffective = effectiveBankRequirement(spend, 0, ctx);
    if (bankOnlyEffective !== null && bankOnlyEffective <= ctx.bank.points) affordableBankOnly.add(spend);

    const fromExisting = Math.min(spend, programmeOpening);
    const shortfall = spend - fromExisting;

    if (shortfall > 0 && ctx.route.status !== 'ACTIVE') {
      eliminated.push({ reason: 'TRANSFER_UNAVAILABLE', wouldHaveSpent: spend });
      continue;
    }
    if (shortfall > 0 && ctx.ratioConflict) {
      eliminated.push({ reason: 'RATIO_CONFLICT', wouldHaveSpent: spend });
      continue;
    }
    if (shortfall > 0 && ctx.ratio === null) {
      eliminated.push({ reason: 'RULE_UNKNOWN', wouldHaveSpent: spend });
      continue;
    }

    const bankRequired = shortfall === 0 ? 0 : bankPointsForProgramme(shortfall, ctx.ratio!);
    if (bankRequired > ctx.bank.points) {
      eliminated.push({ reason: 'UNAFFORDABLE', wouldHaveSpent: spend });
      continue;
    }

    let exact: number | null = null;
    const instructionBlocked: InstructionBlocked = shortfall === 0
      ? (ctx.eligibilityUnknown ? 'PROGRAMME_ELIGIBLE_AMOUNT_UNKNOWN' : null)
      : blockedBase;

    if (bankRequired > 0 && exactComputable && blockedBase === null) {
      exact = roundUpTransfer(bankRequired, ctx.minTransfer!, ctx.transferIncrement!);
      if (exact > ctx.bank.points) {
        eliminated.push({ reason: 'UNAFFORDABLE_AFTER_INCREMENT', wouldHaveSpent: spend });
        continue;
      }
    }

    affordableAll.add(spend);
    const sent = exact ?? bankRequired;
    const received = sent > 0 ? programmePointsFromBank(sent, ctx.ratio!) : 0;
    const residual = programmeOpening + received - spend;
    const stranded = mechanic === 'CASH_OFFSET' && residual > 0 && residual < permittedMin ? residual : 0;

    let offsetMinor: number | null = null;
    let cashPayableMinor: number | null;
    let candidateAwardTaxes: number | null = null;
    let candidateBenchmark: number | null = null;
    let benchmarkState: RedemptionCandidate['benchmarkState'] = null;

    if (mechanic === 'CASH_OFFSET') {
      offsetMinor = offsetPaise(
        spend,
        ctx.fixedValue!.amount_minor,
        ctx.fixedValue!.points,
        ctx.quoteMinorPerBaseUnit!,
        BASE_MINOR_PER_BASE_UNIT,
      );
      cashPayableMinor = ctx.booking.grossMinor - offsetMinor;
    } else {
      candidateAwardTaxes = awardTaxesMinor;
      candidateBenchmark = benchmarkCashFareMinor;
      cashPayableMinor = awardTaxesMinor;
      benchmarkState = candidateBenchmark !== null ? (ctx.booking.cashFareState ?? 'CAPTURED') : 'UNAVAILABLE';
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
      awardTaxesMinor: candidateAwardTaxes,
      benchmarkCashFareMinor: candidateBenchmark,
      benchmarkState,
      feeMinor: 0,
      cashPayableMinor,
      incrementalBookingOffsetPerTransferredBankPointPaise: null,
      cashAvoidedPerTransferredBankPointPaise: null,
      marginalRateVsPreviousCandidate: null,
      instructionBlocked,
      durationHours: bankRequired > 0 ? ctx.durationHours : null,
      irreversible: bankRequired > 0,
      provenance: [...ctx.provenance],
    });
  }

  return {
    candidates,
    eliminated,
    balanceState: computeBalanceState(legal, affordableAll, affordableBankOnly),
    legalSpendSet: legal,
    quoteRequired,
  };
}

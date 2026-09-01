// lib/redemption-engine/rank.ts
// Pure candidate ranking. Only illegal/unavailable/dominated candidates are pruned.

import { rational, compareRational, type Rational } from './rational';
import type { RedemptionCandidate, Objective, TransferState } from './types';

export interface RankResult {
  ordered: RedemptionCandidate[];
  winner: RedemptionCandidate | null;
  runnerUp: RedemptionCandidate | null;
  eliminated: Array<{ reason: 'DOMINATED' | 'TRANSFER_UNAVAILABLE'; wouldHaveSpent: number }>;
}

function efficiencyRational(c: RedemptionCandidate): Rational | null {
  if (c.bankPointsRequiredMinimum <= 0) return null;
  if (c.mechanic === 'AWARD_PRICE') {
    if (
      c.benchmarkCashFareMinor == null ||
      c.awardTaxesMinor == null ||
      c.benchmarkState === 'UNAVAILABLE'
    ) return null;
    return rational(c.benchmarkCashFareMinor - c.awardTaxesMinor, c.bankPointsRequiredMinimum);
  }
  if (c.offsetMinor == null) return null;
  return rational(c.offsetMinor - c.feeMinor, c.bankPointsRequiredMinimum);
}

function computeDiagnostics(candidates: RedemptionCandidate[]): void {
  const offsetProg = candidates
    .filter((c) => c.kind === 'PROGRAMME' && c.mechanic === 'CASH_OFFSET')
    .sort((a, b) => a.programmePointsSpent - b.programmePointsSpent);

  for (let i = 0; i < offsetProg.length; i++) {
    const candidate = offsetProg[i];
    if (i === 0) {
      candidate.marginalRateVsPreviousCandidate = null;
      continue;
    }
    const previous = offsetProg[i - 1];
    const dOffset = (candidate.offsetMinor ?? 0) - (previous.offsetMinor ?? 0);
    const dBank = candidate.bankPointsRequiredMinimum - previous.bankPointsRequiredMinimum;
    candidate.marginalRateVsPreviousCandidate = dBank !== 0 ? rational(dOffset, dBank) : null;
  }

  for (const candidate of candidates) {
    if (candidate.kind === 'PROGRAMME' && candidate.mechanic === 'CASH_OFFSET') {
      candidate.incrementalBookingOffsetPerTransferredBankPointPaise =
        candidate.bankPointsRequiredMinimum > 0 && candidate.offsetMinor != null
          ? rational(candidate.offsetMinor, candidate.bankPointsRequiredMinimum)
          : null;
    }
    if (candidate.mechanic === 'AWARD_PRICE') {
      candidate.cashAvoidedPerTransferredBankPointPaise =
        candidate.bankPointsRequiredMinimum > 0 &&
        candidate.benchmarkState !== 'UNAVAILABLE' &&
        candidate.benchmarkCashFareMinor != null &&
        candidate.awardTaxesMinor != null
          ? rational(
              candidate.benchmarkCashFareMinor - candidate.awardTaxesMinor,
              candidate.bankPointsRequiredMinimum,
            )
          : null;
    }
  }
}

function dominates(a: RedemptionCandidate, b: RedemptionCandidate): boolean {
  if (a.cashPayableMinor == null || b.cashPayableMinor == null) return false;
  const noWorse =
    a.cashPayableMinor <= b.cashPayableMinor &&
    a.bankPointsRequiredMinimum <= b.bankPointsRequiredMinimum &&
    a.existingProgrammePointsConsumed <= b.existingProgrammePointsConsumed;
  if (!noWorse) return false;
  return (
    a.cashPayableMinor < b.cashPayableMinor ||
    a.bankPointsRequiredMinimum < b.bankPointsRequiredMinimum ||
    a.existingProgrammePointsConsumed < b.existingProgrammePointsConsumed
  );
}

function compareNumberAsc(a: number, b: number): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function minimiseCompare(a: RedemptionCandidate, b: RedemptionCandidate): number {
  const aUnknown = a.cashPayableMinor == null;
  const bUnknown = b.cashPayableMinor == null;
  if (aUnknown !== bUnknown) return aUnknown ? 1 : -1;
  if (!aUnknown && !bUnknown) {
    const cash = compareNumberAsc(a.cashPayableMinor!, b.cashPayableMinor!);
    if (cash !== 0) return cash;
  }
  return compareNumberAsc(a.bankPointsRequiredMinimum, b.bankPointsRequiredMinimum);
}

function maximiseCompare(a: RedemptionCandidate, b: RedemptionCandidate): number {
  // Unknown award taxes/unknown cash economics can never become "best" by
  // comparator accident, even for a zero-bank-point redemption.
  const aUnknown = a.cashPayableMinor == null;
  const bUnknown = b.cashPayableMinor == null;
  if (aUnknown !== bUnknown) return aUnknown ? 1 : -1;

  const aCash = a.kind === 'CASH';
  const bCash = b.kind === 'CASH';
  if (aCash !== bCash) return aCash ? 1 : -1;
  if (aCash && bCash) return 0;

  const aZero = a.bankPointsRequiredMinimum === 0;
  const bZero = b.bankPointsRequiredMinimum === 0;
  if (aZero !== bZero) return aZero ? -1 : 1;
  if (aZero && bZero) return minimiseCompare(a, b);

  const ea = efficiencyRational(a);
  const eb = efficiencyRational(b);
  if (ea && eb) {
    const cmp = compareRational(eb, ea);
    if (cmp !== 0) return cmp;
  } else if (ea !== null || eb !== null) {
    return ea ? -1 : 1;
  }
  return compareNumberAsc(a.bankPointsRequiredMinimum, b.bankPointsRequiredMinimum);
}

function order(candidates: RedemptionCandidate[], objective: Objective): RedemptionCandidate[] {
  const sorted = [...candidates];
  sorted.sort(objective === 'MINIMISE_CASH_TODAY' ? minimiseCompare : maximiseCompare);
  return sorted;
}

export function rankCandidates(
  candidates: RedemptionCandidate[],
  objective: Objective,
  transferState: TransferState,
): RankResult {
  let survivors = [...candidates];
  const eliminated: RankResult['eliminated'] = [];

  if (transferState === 'UNAVAILABLE' || transferState === 'ENDED') {
    survivors = survivors.filter((candidate) => {
      if (candidate.kind === 'PROGRAMME' && candidate.bankPointsRequiredMinimum > 0) {
        eliminated.push({ reason: 'TRANSFER_UNAVAILABLE', wouldHaveSpent: candidate.programmePointsSpent });
        return false;
      }
      return true;
    });
  }

  const dominated = new Set<RedemptionCandidate>();
  for (const b of survivors) {
    for (const a of survivors) {
      if (a === b || dominated.has(a)) continue;
      if (dominates(a, b)) {
        dominated.add(b);
        break;
      }
    }
  }
  if (dominated.size > 0) {
    survivors = survivors.filter((candidate) => {
      if (!dominated.has(candidate)) return true;
      eliminated.push({ reason: 'DOMINATED', wouldHaveSpent: candidate.programmePointsSpent });
      return false;
    });
  }

  computeDiagnostics(survivors);

  const ordered = order(survivors, objective);
  const other: Objective =
    objective === 'MINIMISE_CASH_TODAY'
      ? 'MAXIMISE_BANK_POINT_EFFICIENCY'
      : 'MINIMISE_CASH_TODAY';
  const orderedOther = order(survivors, other);
  const winner = ordered[0] ?? null;
  const otherWinner = orderedOther[0] ?? null;
  const runnerUp = otherWinner && otherWinner !== winner ? otherWinner : null;

  return { ordered, winner, runnerUp, eliminated };
}

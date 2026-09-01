// lib/redemption-engine/rank.ts
//
// C · Ranking (§5). Pure.
//
// The single most important correction in v3.1 lives here (§0): v3 pruned
// candidates whose marginal rate fell below the portal rate BEFORE the objective
// ran, which under MINIMISE_CASH_TODAY could delete the cheapest candidate.
// Here, elimination is limited to (a) illegal amounts, (b) transfers that are
// actually required but unavailable, and (c) genuinely Pareto-dominated
// candidates. Marginal rate is a REPORTED DIAGNOSTIC, never a pruning input.

import { rational, compareRational, type Rational } from './rational';
import type { RedemptionCandidate, Objective, TransferState } from './types';

export interface RankResult {
  /** Survivors ordered under the requested objective. */
  ordered: RedemptionCandidate[];
  /** Winner under the requested objective (survivors[0]) or null. */
  winner: RedemptionCandidate | null;
  /** Winner under the OTHER objective, or null when identical to `winner`. */
  runnerUp: RedemptionCandidate | null;
  eliminated: Array<{ reason: 'DOMINATED' | 'TRANSFER_UNAVAILABLE'; wouldHaveSpent: number }>;
}

const CASH_LAST = Number.POSITIVE_INFINITY;

/** (gross − cashPayable) / bank, i.e. cash avoided per transferred bank point.
 *  For CASH_OFFSET this equals (offset − fee)/bank; for AWARD_PRICE it is
 *  (benchmark − taxes)/bank. Null when it cannot be computed. */
function efficiencyRational(c: RedemptionCandidate): Rational | null {
  if (c.bankPointsRequiredMinimum <= 0) return null;
  if (c.mechanic === 'AWARD_PRICE') {
    if (c.benchmarkCashFareMinor == null || c.awardTaxesMinor == null) return null;
    return rational(c.benchmarkCashFareMinor - c.awardTaxesMinor, c.bankPointsRequiredMinimum);
  }
  // CASH_OFFSET (programme or portal): gross − cashPayable === offset − fee.
  if (c.offsetMinor == null) return null;
  return rational(c.offsetMinor - c.feeMinor, c.bankPointsRequiredMinimum);
}

function computeDiagnostics(candidates: RedemptionCandidate[]): void {
  // Marginal rate: adjacent PROGRAMME CASH_OFFSET candidates, ascending spend.
  const offsetProg = candidates
    .filter((c) => c.kind === 'PROGRAMME' && c.mechanic === 'CASH_OFFSET')
    .sort((a, b) => a.programmePointsSpent - b.programmePointsSpent);
  for (let i = 0; i < offsetProg.length; i++) {
    const c = offsetProg[i];
    if (i === 0) {
      c.marginalRateVsPreviousCandidate = null;
    } else {
      const prev = offsetProg[i - 1];
      const dOffset = (c.offsetMinor ?? 0) - (prev.offsetMinor ?? 0);
      const dBank = c.bankPointsRequiredMinimum - prev.bankPointsRequiredMinimum;
      c.marginalRateVsPreviousCandidate = dBank !== 0 ? rational(dOffset, dBank) : null;
    }
  }

  for (const c of candidates) {
    if (c.kind === 'PROGRAMME' && c.mechanic === 'CASH_OFFSET') {
      c.incrementalBookingOffsetPerTransferredBankPointPaise =
        c.bankPointsRequiredMinimum > 0 && c.offsetMinor != null
          ? rational(c.offsetMinor, c.bankPointsRequiredMinimum)
          : null;
    }
    if (c.mechanic === 'AWARD_PRICE') {
      c.cashAvoidedPerTransferredBankPointPaise =
        c.bankPointsRequiredMinimum > 0 &&
        c.benchmarkState !== 'UNAVAILABLE' &&
        c.benchmarkCashFareMinor != null &&
        c.awardTaxesMinor != null
          ? rational(c.benchmarkCashFareMinor - c.awardTaxesMinor, c.bankPointsRequiredMinimum)
          : null;
    }
  }
}

/** A dominates B iff no worse on cash, bank and existing programme points, and
 *  strictly better on at least one (§5). Cash is only comparable when numeric. */
function dominates(a: RedemptionCandidate, b: RedemptionCandidate): boolean {
  if (a.cashPayableMinor == null || b.cashPayableMinor == null) return false;
  const cashLE = a.cashPayableMinor <= b.cashPayableMinor;
  const bankLE = a.bankPointsRequiredMinimum <= b.bankPointsRequiredMinimum;
  const progLE = a.existingProgrammePointsConsumed <= b.existingProgrammePointsConsumed;
  if (!cashLE || !bankLE || !progLE) return false;
  const strict =
    a.cashPayableMinor < b.cashPayableMinor ||
    a.bankPointsRequiredMinimum < b.bankPointsRequiredMinimum ||
    a.existingProgrammePointsConsumed < b.existingProgrammePointsConsumed;
  return strict;
}

function minimiseCompare(a: RedemptionCandidate, b: RedemptionCandidate): number {
  const ca = a.cashPayableMinor ?? CASH_LAST;
  const cb = b.cashPayableMinor ?? CASH_LAST;
  if (ca !== cb) return ca - cb;
  return a.bankPointsRequiredMinimum - b.bankPointsRequiredMinimum;
}

function maximiseCompare(a: RedemptionCandidate, b: RedemptionCandidate): number {
  const aCash = a.kind === 'CASH';
  const bCash = b.kind === 'CASH';
  // CASH does not redeem anything — always last under an efficiency objective.
  if (aCash && !bCash) return 1;
  if (bCash && !aCash) return -1;
  if (aCash && bCash) return 0;

  const aZero = a.bankPointsRequiredMinimum === 0;
  const bZero = b.bankPointsRequiredMinimum === 0;
  // Zero-transfer redemptions use no bank points — maximally efficient.
  if (aZero && !bZero) return -1;
  if (bZero && !aZero) return 1;
  if (aZero && bZero) {
    const ca = a.cashPayableMinor ?? CASH_LAST;
    const cb = b.cashPayableMinor ?? CASH_LAST;
    return ca - cb;
  }

  const ea = efficiencyRational(a);
  const eb = efficiencyRational(b);
  if (ea && eb) {
    const cmp = compareRational(eb, ea); // descending efficiency
    if (cmp !== 0) return cmp;
  } else if (ea && !eb) {
    return -1;
  } else if (!ea && eb) {
    return 1;
  }
  return a.bankPointsRequiredMinimum - b.bankPointsRequiredMinimum;
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

  // ── ELIMINATION 1: transfers that are actually required but unavailable ────
  // Only PROGRAMME candidates that require a transfer are dropped; the portal
  // spends bank points directly (not a transfer) and survives, and zero-transfer
  // programme candidates survive (they can be REDEEM_EXISTING_BALANCE).
  if (transferState === 'UNAVAILABLE' || transferState === 'ENDED') {
    survivors = survivors.filter((c) => {
      if (c.kind === 'PROGRAMME' && c.bankPointsRequiredMinimum > 0) {
        eliminated.push({ reason: 'TRANSFER_UNAVAILABLE', wouldHaveSpent: c.programmePointsSpent });
        return false;
      }
      return true;
    });
  }

  // ── ELIMINATION 2: genuinely Pareto-dominated candidates ───────────────────
  const dominated = new Set<RedemptionCandidate>();
  for (const b of survivors) {
    for (const a of survivors) {
      if (a === b) continue;
      if (dominated.has(a)) continue;
      if (dominates(a, b)) {
        dominated.add(b);
        break;
      }
    }
  }
  if (dominated.size > 0) {
    survivors = survivors.filter((c) => {
      if (dominated.has(c)) {
        eliminated.push({ reason: 'DOMINATED', wouldHaveSpent: c.programmePointsSpent });
        return false;
      }
      return true;
    });
  }

  // ── DIAGNOSTICS: computed on survivors, reported, NEVER used to prune ───────
  computeDiagnostics(survivors);

  // ── ORDER by objective ─────────────────────────────────────────────────────
  const ordered = order(survivors, objective);
  const other: Objective =
    objective === 'MINIMISE_CASH_TODAY' ? 'MAXIMISE_BANK_POINT_EFFICIENCY' : 'MINIMISE_CASH_TODAY';
  const orderedOther = order(survivors, other);

  const winner = ordered[0] ?? null;
  const otherWinner = orderedOther[0] ?? null;
  const runnerUp = otherWinner && otherWinner !== winner ? otherWinner : null;

  return { ordered, winner, runnerUp, eliminated };
}

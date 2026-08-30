// lib/hotels/engine.ts
//
// Pure arithmetic for Stay on Points. NO I/O — no fetch, no file reads, no
// React. Every input is injected so the whole thing is unit-testable.
// See docs/stay-on-points/02-TRD.md
//
// ── The decision made 30 Aug 2026 on how to treat SmartBuy's 70% cap ────────
// SmartBuy lets points cover a MAXIMUM OF 70% of any transaction, and charges
// Rs.99 + GST per redemption. Two ways to model that:
//   (a) bake it into an "effective rate" and compare rates
//   (b) compare the clean per-point rates, and surface the cap separately
// We chose (b). Reason: the cap is not a worse RATE, it is a worse
// CAPABILITY — Rs.0.50/pt is Rs.0.50/pt whether you redeem 10 points or
// 10,000. Folding a cap into a rate produces a number that is true of no
// actual transaction. So the rate comparison stays clean and honest, and the
// cap is reported as its own fact for the UI to state plainly.
// The redemption FEE is different: it is a real rupee cost of redeeming, so
// it IS folded into the portal's effective value, with the nominal rate kept
// alongside it.

import type { HotelProgramme } from '@/lib/data/hotel-programmes';

// ── Inputs ────────────────────────────────────────────────────────────────

export interface FxSnapshot {
  rate: number;          // e.g. EUR->INR 110.42
  fetched_at: string;
  source: string;
}

export interface PortalTerms {
  /** Nominal rupee value of one point in the bank portal. HDFC Regalia: 0.50 */
  value_per_point_inr: number;
  /** Max share of a bill payable in points, 0..1. SmartBuy: 0.70 */
  max_share_of_bill: number;
  /** Flat fee per redemption transaction, INR incl. tax. SmartBuy: 99 + GST */
  redemption_fee_inr: number;
  source: string;
  as_of: string;
}

export interface StayInput {
  nights: number;
  cash_per_night_inr: number;
  /** Points the programme charges per night. Null for dynamic programmes. */
  points_per_night: number | null;
  /** The user's balance in the BANK's currency (e.g. HDFC Reward Points). */
  user_balance_points: number | null;
  /**
   * Bank points -> programme points. e.g. { from: 1, to: 1 } for 1:1.
   * Null when the transfer edge has not been sourced — the verdict then
   * refuses to compute rather than guessing. This is deliberate.
   */
  transfer_ratio: { from: number; to: number } | null;
}

// ── Outputs ───────────────────────────────────────────────────────────────

export type Verdict =
  | 'POINTS_WIN'
  | 'CLOSE_CALL'
  | 'CASH_WINS'
  | 'NOT_PUBLISHED'      // programme prices dynamically
  | 'RATIO_UNKNOWN'      // transfer edge not sourced
  | 'FX_UNAVAILABLE';

export interface Coverage {
  kind: 'full' | 'partial' | 'none' | 'unknown';
  covered_nights: number;
  uncovered_nights: number;
  cash_topup_inr: number;
  extra_points_needed: number;
  points_left_over: number;
}

export interface StayResult {
  verdict: Verdict;

  // Points side (null when not computable)
  programme_points_required: number | null;
  bank_points_required: number | null;
  redemption_value_inr: number | null;
  value_per_point_inr: number | null;

  // Portal side
  portal_nominal_per_point_inr: number;
  portal_effective_per_point_inr: number | null;
  /** True when the portal cannot cover the whole bill. Surfaced, not folded. */
  portal_capped: boolean;
  portal_max_payable_inr: number;
  portal_cash_remainder_inr: number;

  cash_total_inr: number;
  advantage_pct: number | null;
  coverage: Coverage;

  /** Every reason the result is incomplete, for the UI to render honestly. */
  notes: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────

/** Above this, points win. Below the negative, cash wins. Between: close. */
export const VERDICT_BAND_PCT = 5;

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Accor is redeemable at 1,000 points, then in increments of 2,000 only.
 * A value the user cannot actually redeem is the same class of error as an
 * invented rate, so we always floor to a redeemable amount.
 */
export function floorToRedeemable(
  points: number,
  programme: Pick<HotelProgramme, 'min_redemption_points' | 'redemption_increment'>,
): number {
  const min = programme.min_redemption_points;
  const inc = programme.redemption_increment;
  if (min === null || inc === null) return Math.floor(points);
  if (points < min) return 0;
  if (points < min + inc) return min;
  const above = points - min;
  return min + Math.floor(above / inc) * inc;
}

/** Convert bank points into programme points at the sourced ratio. */
export function convertPoints(
  bankPoints: number,
  ratio: { from: number; to: number },
): number {
  return Math.floor((bankPoints / ratio.from) * ratio.to);
}

/** Inverse: programme points needed -> bank points to transfer. */
export function bankPointsFor(
  programmePoints: number,
  ratio: { from: number; to: number },
): number {
  return Math.ceil((programmePoints / ratio.to) * ratio.from);
}

// ── The portal side ───────────────────────────────────────────────────────

/**
 * What the bank portal is really worth for THIS bill.
 * The cap is reported separately (see the note at the top of this file);
 * only the redemption fee is folded into the effective rate.
 */
export function portalValuation(billInr: number, terms: PortalTerms) {
  const maxPayable = billInr * terms.max_share_of_bill;
  const pointsUsed = maxPayable / terms.value_per_point_inr;
  const effective =
    pointsUsed > 0
      ? (maxPayable - terms.redemption_fee_inr) / pointsUsed
      : terms.value_per_point_inr;

  return {
    nominal_per_point_inr: terms.value_per_point_inr,
    effective_per_point_inr: Math.max(0, effective),
    capped: terms.max_share_of_bill < 1,
    max_payable_inr: maxPayable,
    cash_remainder_inr: billInr - maxPayable,
  };
}

// ── Coverage ──────────────────────────────────────────────────────────────

export function coverageFor(
  input: StayInput,
  programmePointsPerNight: number | null,
): Coverage {
  const none: Coverage = {
    kind: 'unknown',
    covered_nights: 0,
    uncovered_nights: input.nights,
    cash_topup_inr: 0,
    extra_points_needed: 0,
    points_left_over: 0,
  };

  if (
    programmePointsPerNight === null ||
    input.user_balance_points === null ||
    input.transfer_ratio === null
  ) {
    return none;
  }

  const available = convertPoints(input.user_balance_points, input.transfer_ratio);
  const required = programmePointsPerNight * input.nights;
  const coveredNights = Math.min(
    input.nights,
    Math.floor(available / programmePointsPerNight),
  );
  const uncovered = input.nights - coveredNights;

  return {
    kind: coveredNights >= input.nights ? 'full' : coveredNights > 0 ? 'partial' : 'none',
    covered_nights: coveredNights,
    uncovered_nights: uncovered,
    cash_topup_inr: uncovered * input.cash_per_night_inr,
    extra_points_needed: Math.max(0, required - available),
    points_left_over: Math.max(0, available - required),
  };
}

// ── The main computation ──────────────────────────────────────────────────

export function evaluateStay(
  input: StayInput,
  programme: HotelProgramme,
  portal: PortalTerms,
  fx: FxSnapshot | null,
): StayResult {
  const cashTotal = input.cash_per_night_inr * input.nights;
  const p = portalValuation(cashTotal, portal);
  const notes: string[] = [];

  const base: StayResult = {
    verdict: 'NOT_PUBLISHED',
    programme_points_required: null,
    bank_points_required: null,
    redemption_value_inr: null,
    value_per_point_inr: null,
    portal_nominal_per_point_inr: p.nominal_per_point_inr,
    portal_effective_per_point_inr: p.effective_per_point_inr,
    portal_capped: p.capped,
    portal_max_payable_inr: p.max_payable_inr,
    portal_cash_remainder_inr: p.cash_remainder_inr,
    cash_total_inr: cashTotal,
    advantage_pct: null,
    coverage: coverageFor(input, null),
    notes,
  };

  // 1. Dynamic programme — no published rate to compute from.
  if (programme.pricing_model !== 'fixed' || programme.points_per_block === null) {
    notes.push(
      `${programme.short_name} prices awards by date, so the points cost cannot be computed without an availability lookup.`,
    );
    return base;
  }

  // 2. No sourced transfer ratio — refuse rather than guess.
  if (input.transfer_ratio === null) {
    notes.push(
      `The transfer ratio from your card to ${programme.short_name} has not been verified, so we will not estimate what your points are worth here.`,
    );
    return { ...base, verdict: 'RATIO_UNKNOWN' };
  }

  // 3. No FX — points cost is still real, the rupee comparison is not.
  if (fx === null) {
    const required = (input.points_per_night ?? 0) * input.nights;
    notes.push(
      'We could not fetch a live exchange rate, so we are not converting to rupees. We would rather show nothing than a stale number.',
    );
    return {
      ...base,
      verdict: 'FX_UNAVAILABLE',
      programme_points_required: required || null,
      coverage: coverageFor(input, input.points_per_night),
    };
  }

  // 4. Full computation.
  const rawRequired = (input.points_per_night ?? 0) * input.nights;
  const required = floorToRedeemable(rawRequired, programme);
  const bankRequired = bankPointsFor(required, input.transfer_ratio);

  const valueEur = (required / programme.points_per_block) * (programme.block_value ?? 0);
  const valueInr = valueEur * fx.rate;

  // Value per BANK point — the only comparison that means anything to the
  // user, since that is the currency they actually hold.
  const perBankPoint = bankRequired > 0 ? valueInr / bankRequired : 0;

  const advantage =
    p.effective_per_point_inr > 0
      ? ((perBankPoint - p.effective_per_point_inr) / p.effective_per_point_inr) * 100
      : 0;

  let verdict: Verdict = 'CLOSE_CALL';
  if (advantage > VERDICT_BAND_PCT) verdict = 'POINTS_WIN';
  else if (advantage < -VERDICT_BAND_PCT) verdict = 'CASH_WINS';

  if (p.capped) {
    notes.push(
      `Your bank portal can only cover ${Math.round(portal.max_share_of_bill * 100)}% of a bill — Rs.${Math.round(p.cash_remainder_inr).toLocaleString('en-IN')} would still be cash. Transferred points can cover the whole stay.`,
    );
  }
  if (rawRequired !== required) {
    notes.push(
      `${programme.short_name} redeems in fixed blocks, so the points figure is rounded to an amount you can actually redeem.`,
    );
  }

  return {
    verdict,
    programme_points_required: required,
    bank_points_required: bankRequired,
    redemption_value_inr: valueInr,
    value_per_point_inr: perBankPoint,
    portal_nominal_per_point_inr: p.nominal_per_point_inr,
    portal_effective_per_point_inr: p.effective_per_point_inr,
    portal_capped: p.capped,
    portal_max_payable_inr: p.max_payable_inr,
    portal_cash_remainder_inr: p.cash_remainder_inr,
    cash_total_inr: cashTotal,
    advantage_pct: advantage,
    coverage: coverageFor(input, input.points_per_night),
    notes,
  };
}

/**
 * The EUR/INR rate at which transferring stops beating the portal, for a
 * given stay. This IS the product — the whole thesis is that the margin
 * lives in the exchange rate. Returns null when not computable.
 */
export function breakEvenFxRate(
  input: StayInput,
  programme: HotelProgramme,
  portal: PortalTerms,
): number | null {
  if (
    programme.pricing_model !== 'fixed' ||
    programme.points_per_block === null ||
    programme.block_value === null ||
    input.transfer_ratio === null ||
    input.points_per_night === null
  ) {
    return null;
  }

  const cashTotal = input.cash_per_night_inr * input.nights;
  const p = portalValuation(cashTotal, portal);

  const required = floorToRedeemable(input.points_per_night * input.nights, programme);
  const bankRequired = bankPointsFor(required, input.transfer_ratio);
  if (bankRequired === 0) return null;

  const valueEurPerBankPoint =
    (required / programme.points_per_block) * programme.block_value / bankRequired;
  if (valueEurPerBankPoint === 0) return null;

  return p.effective_per_point_inr / valueEurPerBankPoint;
}

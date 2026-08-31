// lib/hotels/derive.ts
//
// Deriving the points cost of an Accor stay.
//
// ── WHY THIS EXISTS ────────────────────────────────────────────────────────
// The original spec assumed hotels have an award chart — a fixed points price
// per night, per property. Capturing real Accor data on 31 Aug 2026 proved
// that wrong, in a way that SIMPLIFIES the product:
//
//   Accor points are not an award currency. They are a DISCOUNT INSTRUMENT.
//   2,000 ALL Reward points = EUR 40 off any eligible stay. There is no
//   per-hotel award price to source, and none to keep up to date.
//
// So points_per_night is DERIVED from the cash rate and the live FX rate,
// never stored. That deletes an entire class of data maintenance.
//
// Source: all.accor.com terms, read live 31 Aug 2026 —
//   "2,000 ALL Reward points equal EUR 40, which can be used towards an
//    Accor hotel stay."

import type { HotelProgramme } from '@/lib/data/hotel-programmes';
import { floorToRedeemable } from './engine';

/**
 * Which part of the bill points are allowed to offset.
 *
 * ⚠ UNVERIFIED as of 31 Aug 2026. Defaulting to 'room-only' because that is
 * how most hotel programmes behave — taxes and fees are usually payable in
 * cash even on a points booking. NOT confirmed against an actual Accor points
 * redemption. If it turns out points cover taxes too, change the default here
 * and nowhere else.
 *
 * This matters: on the Sofitel Bangkok capture, taxes were Rs.20,036 on top of
 * a Rs.1,13,196 room rate. Getting this wrong misstates the comparison by 18%.
 */
export type PointsApplyTo = 'room-only' | 'room-and-taxes';

export const POINTS_APPLY_TO_DEFAULT: PointsApplyTo = 'room-only';

export interface DerivedPoints {
  /** Programme points needed, floored to a redeemable block. */
  points_required: number;
  /** The rupee amount those points actually offset. */
  offset_inr: number;
  /** Rupees still payable in cash after the points are applied. */
  cash_remainder_inr: number;
  /** True when rounding to a redeemable block left a shortfall. */
  rounded_down: boolean;
  /** What the points were allowed to cover. */
  applied_to: PointsApplyTo;
}

/**
 * Work out how many Accor points a stay costs, and what cash is left over.
 *
 * Returns null when it cannot be computed honestly — a dynamic programme, a
 * missing FX rate, or a programme with no published block rate. Never
 * estimates.
 */
export function derivePoints(
  roomInr: number,
  taxesInr: number,
  programme: HotelProgramme,
  fxRate: number | null,
  applyTo: PointsApplyTo = POINTS_APPLY_TO_DEFAULT,
): DerivedPoints | null {
  if (
    programme.pricing_model !== 'fixed' ||
    programme.points_per_block === null ||
    programme.block_value === null ||
    fxRate === null ||
    fxRate <= 0
  ) {
    return null;
  }

  const eligibleInr = applyTo === 'room-and-taxes' ? roomInr + taxesInr : roomInr;
  const totalInr = roomInr + taxesInr;

  // Rupees -> the programme's reference currency (EUR) -> points.
  const eligibleInBlockCurrency = eligibleInr / fxRate;
  const rawPoints =
    (eligibleInBlockCurrency / programme.block_value) * programme.points_per_block;

  const points = floorToRedeemable(rawPoints, programme);

  // What those points are actually worth back in rupees.
  const offsetInr =
    (points / programme.points_per_block) * programme.block_value * fxRate;

  return {
    points_required: points,
    offset_inr: offsetInr,
    cash_remainder_inr: Math.max(0, totalInr - offsetInr),
    rounded_down: points < rawPoints,
    applied_to: applyTo,
  };
}

/**
 * The rupee value of one programme point at a given FX rate.
 * For Accor: EUR 40 / 2,000 points = EUR 0.02, times the live rate.
 */
export function pointValueInr(
  programme: HotelProgramme,
  fxRate: number | null,
): number | null {
  if (
    programme.pricing_model !== 'fixed' ||
    programme.points_per_block === null ||
    programme.block_value === null ||
    fxRate === null
  ) {
    return null;
  }
  return (programme.block_value / programme.points_per_block) * fxRate;
}

// lib/redemption-engine/rational.ts
//
// Exact integer arithmetic for the redemption engine (v3.1, §1).
//
// The whole point of this module: NO JS float ever drives a recommendation.
// v3 computed a per-point value in paise and floored it before multiplying;
// at €1 = ₹96.20 that floored 192.4 → 192 and produced ₹7,680 where the correct
// figure is ₹7,696 (§0). Everything here is integer rationals, rounded ONCE at
// the presentation/storage boundary, never mid-chain, and only ever in the
// direction that cannot flatter the recommendation (§1.2).
//
// The single permitted float touch in the entire engine is the FX boundary
// conversion (`quoteMinorFromRate` below): an external provider hands us a
// decimal rate exactly once, we round it to an integer paise-per-base-unit, and
// no float is ever read again.

/** Integers only, den > 0. Never a JS float in decision logic. */
export interface Rational {
  num: number;
  den: number;
}

/**
 * Construct a normalised rational. Sign is carried on the numerator, den is
 * always > 0. Throws on den === 0 or non-integer inputs — a non-integer here
 * means a float leaked into decision arithmetic, which is exactly the class of
 * bug this module exists to prevent.
 */
export function rational(num: number, den: number): Rational {
  if (!Number.isInteger(num) || !Number.isInteger(den)) {
    throw new Error(`rational() requires integers, got ${num}/${den}`);
  }
  if (den === 0) throw new Error('rational() denominator must be non-zero');
  if (den < 0) return { num: -num, den: -den };
  return { num, den };
}

/**
 * compare(a, b) → sign of (a - b), by cross-multiplication. Never divides, so
 * never introduces a float. Returns -1, 0 or 1. Denominators are guaranteed
 * positive by rational(), so the inequality direction is preserved.
 */
export function compareRational(a: Rational, b: Rational): -1 | 0 | 1 {
  const left = a.num * b.den;
  const right = b.num * a.den;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function rationalEquals(a: Rational, b: Rational): boolean {
  return compareRational(a, b) === 0;
}

/** Integer floor division. Correct for negative numerators too. den must be > 0. */
export function floorDiv(num: number, den: number): number {
  if (den <= 0) throw new Error('floorDiv requires den > 0');
  return Math.floor(num / den);
}

/** Integer ceil division. den must be > 0. */
export function ceilDiv(num: number, den: number): number {
  if (den <= 0) throw new Error('ceilDiv requires den > 0');
  return Math.ceil(num / den);
}

/**
 * FX boundary, stated once (§1.1). The provider hands us a decimal rate for one
 * WHOLE base unit (€1 = ₹110.50). We want paise per one whole base unit as an
 * integer: 110.50 → 11050. This is the ONLY place a float is read in the whole
 * engine; after this, every figure is an integer.
 *
 * `Math.round(rate * 100)` — €1 = ₹110.50 becomes exactly 11050, ₹96.20 becomes
 * 9620. A rate of 110.5 must never survive as `110`, `1105` or `1105000`; the
 * v3.1 unit-guard regression (test 29) exists to catch exactly that.
 */
export function quoteMinorFromRate(rate: number): number {
  return Math.round(rate * 100);
}

/**
 * The fixed-value offset, in one integer expression with a single floor (§1.1):
 *
 *   offsetPaise = floor( n × amount_minor × quoteMinorPerBaseUnit
 *                        / (rule_points × baseMinorPerBaseUnit) )
 *
 * No per-point rate is computed and floored first — that was the v3 bug. The
 * whole numerator is formed in integers (well within 2^53 for realistic
 * bookings) and floored once, downward, which cannot flatter the recommendation.
 */
export function offsetPaise(
  n: number,
  amountMinor: number,
  rulePoints: number,
  quoteMinorPerBaseUnit: number,
  baseMinorPerBaseUnit: number,
): number {
  const numerator = n * amountMinor * quoteMinorPerBaseUnit;
  const denominator = rulePoints * baseMinorPerBaseUnit;
  return floorDiv(numerator, denominator);
}

/** bank → programme points: floor(bank × toUnits / fromUnits) (§1.2, down). */
export function programmePointsFromBank(
  bankPoints: number,
  ratio: { fromUnits: number; toUnits: number },
): number {
  return floorDiv(bankPoints * ratio.toUnits, ratio.fromUnits);
}

/** programme points → bank required: ceil(need × fromUnits / toUnits) (§1.2, up). */
export function bankPointsForProgramme(
  programmePoints: number,
  ratio: { fromUnits: number; toUnits: number },
): number {
  return ceilDiv(programmePoints * ratio.fromUnits, ratio.toUnits);
}

/**
 * bank required → permitted transfer amount (§1.2): ceil to min_transfer, then
 * to transfer_increment. Both are in BANK points. Rounds up, so the user is
 * never told to transfer fewer points than the programme will accept.
 */
export function roundUpTransfer(
  bankRequired: number,
  minTransfer: number,
  increment: number,
): number {
  const base = Math.max(bankRequired, minTransfer);
  if (increment <= 0) return base;
  const steps = ceilDiv(base - minTransfer, increment);
  return minTransfer + steps * increment;
}

/** fee + tax: ceil(fee_minor × (10000 + tax_bp) / 10000) (§1.2, up). */
export function feeWithTax(feeMinor: number, taxBp: number): number {
  return ceilDiv(feeMinor * (10000 + taxBp), 10000);
}

/** portal cap: floor(eligible × cap_bp / 10000) (§1.2, down). */
export function portalCapMinor(eligibleMinor: number, capBp: number): number {
  return floorDiv(eligibleMinor * capBp, 10000);
}

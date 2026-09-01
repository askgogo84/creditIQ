// lib/redemption-engine/rational.ts
// Exact arithmetic primitives for the redemption engine.
// Financial inputs remain Numbers at the public boundary for ergonomics, but every
// arithmetic intermediate that can exceed Number safe range is evaluated via BigInt.

export interface Rational {
  num: number;
  den: number;
}

export function assertSafeInteger(name: string, value: number, opts: { min?: number; positive?: boolean } = {}): void {
  if (!Number.isSafeInteger(value)) throw new Error(`${name} must be a safe integer, got ${value}`);
  if (opts.positive && value <= 0) throw new Error(`${name} must be > 0, got ${value}`);
  if (opts.min !== undefined && value < opts.min) throw new Error(`${name} must be >= ${opts.min}, got ${value}`);
}

function bigintToSafeNumber(name: string, value: bigint): number {
  const max = BigInt(Number.MAX_SAFE_INTEGER);
  const min = BigInt(Number.MIN_SAFE_INTEGER);
  if (value > max || value < min) throw new Error(`${name} exceeds Number safe-integer range`);
  return Number(value);
}

function floorBigInt(num: bigint, den: bigint): bigint {
  if (den <= 0n) throw new Error('division denominator must be > 0');
  let q = num / den;
  const r = num % den;
  if (r !== 0n && num < 0n) q -= 1n;
  return q;
}

function ceilBigInt(num: bigint, den: bigint): bigint {
  if (den <= 0n) throw new Error('division denominator must be > 0');
  let q = num / den;
  const r = num % den;
  if (r !== 0n && num > 0n) q += 1n;
  return q;
}

export function safeAdd(name: string, ...values: number[]): number {
  let total = 0n;
  for (const value of values) {
    assertSafeInteger(`${name} operand`, value);
    total += BigInt(value);
  }
  return bigintToSafeNumber(name, total);
}

export function safeSubtract(name: string, left: number, right: number): number {
  assertSafeInteger(`${name} left`, left);
  assertSafeInteger(`${name} right`, right);
  return bigintToSafeNumber(name, BigInt(left) - BigInt(right));
}

export function safeMultiply(name: string, left: number, right: number): number {
  assertSafeInteger(`${name} left`, left);
  assertSafeInteger(`${name} right`, right);
  return bigintToSafeNumber(name, BigInt(left) * BigInt(right));
}

export function rational(num: number, den: number): Rational {
  assertSafeInteger('rational numerator', num);
  assertSafeInteger('rational denominator', den, { positive: true });
  return { num, den };
}

export function compareRational(a: Rational, b: Rational): -1 | 0 | 1 {
  assertSafeInteger('left numerator', a.num);
  assertSafeInteger('left denominator', a.den, { positive: true });
  assertSafeInteger('right numerator', b.num);
  assertSafeInteger('right denominator', b.den, { positive: true });
  const left = BigInt(a.num) * BigInt(b.den);
  const right = BigInt(b.num) * BigInt(a.den);
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function rationalEquals(a: Rational, b: Rational): boolean {
  return compareRational(a, b) === 0;
}

export function floorDiv(num: number, den: number): number {
  assertSafeInteger('floorDiv numerator', num);
  assertSafeInteger('floorDiv denominator', den, { positive: true });
  return bigintToSafeNumber('floorDiv result', floorBigInt(BigInt(num), BigInt(den)));
}

export function ceilDiv(num: number, den: number): number {
  assertSafeInteger('ceilDiv numerator', num);
  assertSafeInteger('ceilDiv denominator', den, { positive: true });
  return bigintToSafeNumber('ceilDiv result', ceilBigInt(BigInt(num), BigInt(den)));
}

/** External float boundary only: INR per one whole base unit -> paise per base unit. */
export function quoteMinorFromRate(rate: number): number {
  if (!Number.isFinite(rate) || rate <= 0) throw new Error(`FX rate must be finite and > 0, got ${rate}`);
  const minor = Math.round(rate * 100);
  assertSafeInteger('FX quoteMinorPerBaseUnit', minor, { positive: true });
  return minor;
}

/** Single-floor fixed-value offset. Multiplication is exact via BigInt. */
export function offsetPaise(
  n: number,
  amountMinor: number,
  rulePoints: number,
  quoteMinorPerBaseUnit: number,
  baseMinorPerBaseUnit: number,
): number {
  assertSafeInteger('programme points', n, { min: 0 });
  assertSafeInteger('fixed-value amount minor', amountMinor, { positive: true });
  assertSafeInteger('fixed-value rule points', rulePoints, { positive: true });
  assertSafeInteger('FX quote minor', quoteMinorPerBaseUnit, { positive: true });
  assertSafeInteger('base minor per unit', baseMinorPerBaseUnit, { positive: true });
  const numerator = BigInt(n) * BigInt(amountMinor) * BigInt(quoteMinorPerBaseUnit);
  const denominator = BigInt(rulePoints) * BigInt(baseMinorPerBaseUnit);
  return bigintToSafeNumber('offsetPaise result', floorBigInt(numerator, denominator));
}

export function programmePointsFromBank(bankPoints: number, ratio: { fromUnits: number; toUnits: number }): number {
  assertSafeInteger('bank points', bankPoints, { min: 0 });
  assertSafeInteger('ratio.fromUnits', ratio.fromUnits, { positive: true });
  assertSafeInteger('ratio.toUnits', ratio.toUnits, { positive: true });
  const numerator = BigInt(bankPoints) * BigInt(ratio.toUnits);
  return bigintToSafeNumber('programmePointsFromBank result', floorBigInt(numerator, BigInt(ratio.fromUnits)));
}

export function bankPointsForProgramme(programmePoints: number, ratio: { fromUnits: number; toUnits: number }): number {
  assertSafeInteger('programme points required', programmePoints, { min: 0 });
  assertSafeInteger('ratio.fromUnits', ratio.fromUnits, { positive: true });
  assertSafeInteger('ratio.toUnits', ratio.toUnits, { positive: true });
  const numerator = BigInt(programmePoints) * BigInt(ratio.fromUnits);
  return bigintToSafeNumber('bankPointsForProgramme result', ceilBigInt(numerator, BigInt(ratio.toUnits)));
}

export function roundUpTransfer(bankRequired: number, minTransfer: number, increment: number): number {
  assertSafeInteger('bankRequired', bankRequired, { min: 0 });
  assertSafeInteger('minTransfer', minTransfer, { min: 0 });
  assertSafeInteger('transfer increment', increment, { positive: true });
  const base = Math.max(bankRequired, minTransfer);
  if (base <= minTransfer) return minTransfer;
  const delta = BigInt(base - minTransfer);
  const steps = ceilBigInt(delta, BigInt(increment));
  return bigintToSafeNumber('roundUpTransfer result', BigInt(minTransfer) + steps * BigInt(increment));
}

export function feeWithTax(feeMinor: number, taxBp: number): number {
  assertSafeInteger('portal fee minor', feeMinor, { min: 0 });
  assertSafeInteger('portal fee tax bp', taxBp, { min: 0 });
  const multiplier = safeAdd('portal tax multiplier', 10000, taxBp);
  const numerator = BigInt(feeMinor) * BigInt(multiplier);
  return bigintToSafeNumber('feeWithTax result', ceilBigInt(numerator, 10000n));
}

export function portalCapMinor(eligibleMinor: number, capBp: number): number {
  assertSafeInteger('portal eligible minor', eligibleMinor, { min: 0 });
  assertSafeInteger('portal cap bp', capBp, { min: 0 });
  const numerator = BigInt(eligibleMinor) * BigInt(capBp);
  return bigintToSafeNumber('portalCapMinor result', floorBigInt(numerator, 10000n));
}

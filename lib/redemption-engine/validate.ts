// lib/redemption-engine/validate.ts
// Fail-fast validation for pure-engine inputs. Invalid financial data is rejected
// rather than normalised, coerced, or allowed to flow into a recommendation.

import { assertSafeInteger } from './rational';
import type { RedemptionInput, Sourced } from './types';

function assertBp(name: string, value: number, max?: number): void {
  assertSafeInteger(name, value, { min: 0 });
  if (max !== undefined && value > max) throw new Error(`${name} must be <= ${max}, got ${value}`);
}

function requireConflictReadings<T>(name: string, sourced: Sourced<T>): void {
  if (sourced.state === 'SOURCE_CONFLICT' && (!sourced.readings || sourced.readings.length < 2)) {
    throw new Error(`${name} SOURCE_CONFLICT requires at least two readings`);
  }
}

export function validateRedemptionInput(input: RedemptionInput): void {
  const { booking, bank, programmeBalance, rules, route, portal } = input;

  assertSafeInteger('booking.grossMinor', booking.grossMinor, { min: 0 });
  assertSafeInteger('booking.roomOnlyMinor', booking.roomOnlyMinor, { min: 0 });
  if (booking.roomOnlyMinor > booking.grossMinor) throw new Error('roomOnlyMinor cannot exceed grossMinor');
  if (booking.roomPlusTaxMinor !== undefined) {
    assertSafeInteger('booking.roomPlusTaxMinor', booking.roomPlusTaxMinor, { min: 0 });
    if (booking.roomPlusTaxMinor > booking.grossMinor) throw new Error('roomPlusTaxMinor cannot exceed grossMinor');
  }
  if (booking.cashFareMinor !== undefined) {
    assertSafeInteger('booking.cashFareMinor', booking.cashFareMinor, { min: 0 });
  } else if (booking.cashFareState) {
    throw new Error('cashFareState requires cashFareMinor');
  }

  assertSafeInteger('bank.points', bank.points, { min: 0 });
  if (programmeBalance) assertSafeInteger('programmeBalance.points', programmeBalance.points, { min: 0 });

  if (route.card_id !== bank.card_id) throw new Error(`route.card_id ${route.card_id} does not match bank.card_id ${bank.card_id}`);
  if (route.programme_id !== rules.programme_id) throw new Error('route.programme_id does not match rules.programme_id');
  if (programmeBalance && programmeBalance.programme_id !== rules.programme_id) {
    throw new Error('programmeBalance.programme_id does not match rules.programme_id');
  }

  assertSafeInteger('portal.value_paise_per_point', portal.value_paise_per_point, { positive: true });
  assertBp('portal.cap_bp', portal.cap_bp, 10000);
  assertSafeInteger('portal.fee_minor', portal.fee_minor, { min: 0 });
  assertBp('portal.fee_tax_bp', portal.fee_tax_bp);
  for (const value of portal.value_readings ?? []) assertSafeInteger('portal.value_reading', value, { positive: true });
  for (const cap of portal.cap_readings ?? []) assertBp('portal.cap_reading', cap, 10000);
  for (const fee of portal.fee_readings ?? []) assertSafeInteger('portal.fee_reading', fee, { min: 0 });

  const needsRoomPlusTax = (basis: { basis: string }) => basis.basis === 'ROOM_PLUS_TAX';
  if (needsRoomPlusTax(portal.eligible_basis) && booking.roomPlusTaxMinor === undefined) {
    throw new Error('portal ROOM_PLUS_TAX eligibility requires booking.roomPlusTaxMinor');
  }

  if (rules.pricing === 'FIXED_VALUE') {
    assertSafeInteger('fixed_value.points', rules.fixed_value.value.points, { positive: true });
    assertSafeInteger('fixed_value.amount_minor', rules.fixed_value.value.amount_minor, { positive: true });
    requireConflictReadings('fixed_value', rules.fixed_value);
    // Permitted amounts are set-valued. Their conservative intersection is carried
    // directly in value.conservative, so raw readings are useful provenance but are
    // not required for safe arithmetic the way numeric conflict readings are.

    const p = rules.permitted_amounts.value.conservative;
    assertSafeInteger('permitted.min', p.min, { positive: true });
    assertSafeInteger('permitted.increment', p.increment, { positive: true });
    if (rules.permitted_amounts.value.max_per_booking !== undefined) {
      assertSafeInteger('permitted.max_per_booking', rules.permitted_amounts.value.max_per_booking, { positive: true });
      if (rules.permitted_amounts.value.max_per_booking < p.min) throw new Error('max_per_booking cannot be below permitted min');
    }
    for (const amount of rules.permitted_amounts.value.disputed) {
      assertSafeInteger('permitted.disputed amount', amount, { positive: true });
    }

    if (rules.programme_eligible.state !== 'UNKNOWN' && needsRoomPlusTax(rules.programme_eligible.value) && booking.roomPlusTaxMinor === undefined) {
      throw new Error('programme ROOM_PLUS_TAX eligibility requires booking.roomPlusTaxMinor');
    }
    if (rules.programme_eligible_bounds) {
      assertSafeInteger('eligibility bound min', rules.programme_eligible_bounds.minMinor, { min: 0 });
      assertSafeInteger('eligibility bound max', rules.programme_eligible_bounds.maxMinor, { min: 0 });
      if (rules.programme_eligible_bounds.minMinor > rules.programme_eligible_bounds.maxMinor) {
        throw new Error('eligibility min bound cannot exceed max bound');
      }
      if (rules.programme_eligible_bounds.maxMinor > booking.grossMinor) {
        throw new Error('eligibility max bound cannot exceed booking gross');
      }
    }
  }

  if (rules.pricing === 'PUBLISHED_CHART') {
    if (!booking.zoneId || !booking.cabin || !booking.fareTier) {
      throw new Error('PUBLISHED_CHART requires zoneId, cabin, and fareTier selectors');
    }
    requireConflictReadings('award_chart', rules.award_chart);
    const keys = new Set<string>();
    for (const entry of rules.award_chart.value.entries) {
      assertSafeInteger('award points', entry.points, { positive: true });
      if (entry.taxes_minor !== undefined) assertSafeInteger('award taxes', entry.taxes_minor, { min: 0 });
      const key = `${entry.zone_id}\u0000${entry.cabin}\u0000${entry.fare_tier}`;
      if (keys.has(key)) throw new Error(`duplicate award-chart entry for ${entry.zone_id}/${entry.cabin}/${entry.fare_tier}`);
      keys.add(key);
    }
  }

  if (rules.pricing === 'QUOTE_REQUIRED' && rules.quote) {
    assertSafeInteger('award quote programme_points', rules.quote.programme_points, { positive: true });
    if (rules.quote.taxes_minor !== undefined) assertSafeInteger('award quote taxes_minor', rules.quote.taxes_minor, { min: 0 });
  }

  if (route.status === 'ACTIVE') {
    const ratio = route.ratio.value;
    assertSafeInteger('ratio.fromUnits', ratio.fromUnits, { positive: true });
    assertSafeInteger('ratio.toUnits', ratio.toUnits, { positive: true });
    requireConflictReadings('transfer ratio', route.ratio);
    if (route.min_transfer) assertSafeInteger('min_transfer', route.min_transfer.value, { positive: true });
    if (route.transfer_increment) assertSafeInteger('transfer_increment', route.transfer_increment.value, { positive: true });
    assertSafeInteger('duration min', route.duration_hours.value.min, { min: 0 });
    assertSafeInteger('duration max', route.duration_hours.value.max, { min: 0 });
    if (route.duration_hours.value.min > route.duration_hours.value.max) throw new Error('duration min cannot exceed duration max');
  }

  if (input.fxRate !== null && (!Number.isFinite(input.fxRate) || input.fxRate <= 0)) {
    throw new Error(`fxRate must be finite and > 0, got ${input.fxRate}`);
  }
}

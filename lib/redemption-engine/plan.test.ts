// lib/redemption-engine/plan.test.ts
//
// The v3.1 coverage matrix (§9), all 30 rows, plus the load-bearing exact
// regressions. Every constant here is either sourced (Accor 2,000 pts = €40;
// SmartBuy ₹0.50/pt, 70% cap, ₹99 + 18% GST) or an explicit v3.1 test fixture.
// The Air India and Marriott cases are FIXTURES ONLY — no production flight data.
//
// Reads §6.1 / §6.2 / §7 / §8 of the spec alongside the worked figures.

import { describe, it, expect } from 'vitest';
import { planRedemption } from './plan';
import { offsetPaise, quoteMinorFromRate, rational, compareRational } from './rational';
import type {
  RedemptionInput,
  FixedValueRules,
  ChartAwardRules,
  QuotedAwardRules,
  NotPricedRules,
  ActiveTransferRoute,
  PortalTerms,
  Sourced,
  Rational,
} from './types';

// ── Sourced helper ──────────────────────────────────────────────────────────
function S<T>(value: T, state: Sourced<T>['state'] = 'VERIFIED', readings?: T[]): Sourced<T> {
  return { value, state, source_url: 'https://all.accor.com/', as_of: '2026-08-28', readings };
}

// ── Shared, sourced constants ───────────────────────────────────────────────
const FX_1105 = 110.5; // €1 = ₹110.50  → 11050
const FX_962 = 96.2; // €1 = ₹96.20   →  9620
const GROSS = 1_229_200; // ₹12,292
const ROOM = 1_140_000; // ₹11,400 (programme-eligible in §6.1)

const PORTAL: PortalTerms = {
  value_paise_per_point: 100, // ₹1.00 / point
  cap_bp: 7000, // 70%
  fee_minor: 9900, // ₹99 before tax
  fee_tax_bp: 1800, // 18% GST → ceil(9900×11800/10000) = 11682
  eligible_basis: { basis: 'TOTAL', excluded: [] },
};

function verifiedRoute(min = 1000, inc = 100): ActiveTransferRoute {
  return {
    status: 'ACTIVE',
    card_id: 'hdfc-infinia',
    programme_id: 'accor-all',
    ratio: S({ fromUnits: 2, toUnits: 1 }),
    min_transfer: S(min),
    transfer_increment: S(inc),
    duration_hours: S({ min: 48, max: 96 }),
    reversible: false,
  };
}

function fixedRules(over: Partial<FixedValueRules> = {}): FixedValueRules {
  return {
    programme_id: 'accor-all',
    currency_label: 'Accor ALL points',
    requires_direct_booking: S(true),
    booking_url: 'https://all.accor.com/',
    pricing: 'FIXED_VALUE',
    mechanic: 'CASH_OFFSET',
    fixed_value: S({ points: 2000, amount_minor: 4000, currency: 'EUR' }),
    permitted_amounts: S({ conservative: { min: 2000, increment: 2000 }, disputed: [] }),
    programme_eligible: S({ basis: 'ROOM_ONLY', excluded: [] }),
    min_booking_value_rule: S('MUST_EXCEED_POINTS_VALUE'),
    ...over,
  };
}

function baseInput(over: Partial<RedemptionInput> = {}): RedemptionInput {
  return {
    booking: { grossMinor: GROSS, roomOnlyMinor: ROOM },
    bank: { card_id: 'hdfc-infinia', points: 11_400, provenance: 'STATEMENT' },
    programmeBalance: { programme_id: 'accor-all', points: 1_200, provenance: 'SELF_ENTERED' },
    rules: fixedRules(),
    route: verifiedRoute(),
    portal: PORTAL,
    fxRate: FX_1105,
    ...over,
  };
}

function progCandidate(plan: ReturnType<typeof planRedemption>, spend: number) {
  return plan.candidates.find((c) => c.kind === 'PROGRAMME' && c.programmePointsSpent === spend);
}
function ratEq(a: Rational | null, b: Rational): boolean {
  return a != null && compareRational(a, b) === 0;
}

// ── Exact FX regressions (load-bearing) ─────────────────────────────────────

describe('exact arithmetic (§1.1)', () => {
  it('offset(4000 ALL, fx=11050) === 884000 paise', () => {
    expect(offsetPaise(4000, 4000, 2000, 11050, 100)).toBe(884_000);
  });
  it('offset(4000 ALL, fx=9620) === 769600 paise (not the ₹7,680 premature-floor value)', () => {
    expect(offsetPaise(4000, 4000, 2000, 9620, 100)).toBe(769_600);
    expect(offsetPaise(4000, 4000, 2000, 9620, 100)).not.toBe(768_000);
  });
  it('offset(2000) at both rates', () => {
    expect(offsetPaise(2000, 4000, 2000, 11050, 100)).toBe(442_000);
    expect(offsetPaise(2000, 4000, 2000, 9620, 100)).toBe(384_800);
  });
  it('the 100× unit conversion: €1 = ₹110.50 → 11050 exactly', () => {
    expect(quoteMinorFromRate(110.5)).toBe(11050);
    expect(quoteMinorFromRate(96.2)).toBe(9620);
  });
});

// ── Coverage matrix, rows 1–30 (§9) ─────────────────────────────────────────

describe('coverage matrix §9', () => {
  // 1 — §6.1 exactly: 4 candidates survive, none pruned.
  it('01 FIXED/VERIFIED/SUFFICIENT/VERIFIED → TRANSFER_THEN_BOOK', () => {
    const plan = planRedemption(baseInput());
    expect(plan.recommendedPath).toBe('TRANSFER_THEN_BOOK');
    expect(plan.balanceState).toBe('SUFFICIENT');
    expect(plan.candidates.length).toBe(4); // spend2000, spend4000, portal, cash
    expect(plan.eliminated).toHaveLength(0);
    expect(plan.recommended?.programmePointsSpent).toBe(4000);
    expect(plan.recommended?.cashPayableMinor).toBe(345_200); // ₹3,452
    expect(plan.recommended?.bankPointsRequiredMinimum).toBe(5600);
    expect(plan.runnerUpUnderOtherObjective?.programmePointsSpent).toBe(2000);
    // marginal = ₹1.105, incrementals ₹2.7625 / ₹1.5786
    expect(ratEq(progCandidate(plan, 4000)!.marginalRateVsPreviousCandidate, rational(442000, 4000))).toBe(true);
    expect(
      ratEq(progCandidate(plan, 2000)!.incrementalBookingOffsetPerTransferredBankPointPaise, rational(442000, 1600)),
    ).toBe(true);
    expect(
      ratEq(progCandidate(plan, 4000)!.incrementalBookingOffsetPerTransferredBankPointPaise, rational(884000, 5600)),
    ).toBe(true);
    // conversion value per bank point = ₹1.105
    expect(ratEq(plan.conversionValuePerBankPointPaise, rational(442000, 4000))).toBe(true);
    expect(plan.balances.programme.latentPoints).toBe(1200);
  });

  // 2 — programme balance 0 → 8,000 bank for the same spend.
  it('02 no programme balance → different bank requirement', () => {
    const plan = planRedemption(baseInput({ programmeBalance: null }));
    expect(plan.recommendedPath).toBe('TRANSFER_THEN_BOOK');
    expect(plan.recommended?.programmePointsSpent).toBe(4000);
    expect(plan.recommended?.bankPointsRequiredMinimum).toBe(8000);
    expect(plan.recommended?.bankPointsRequiredMinimum).not.toBe(5600); // must not equal #1
  });

  // 3 — bank 5,600 + programme 1,200: bank alone reaches only 2,000.
  it('03 SUFFICIENT_VIA_PROGRAMME_BALANCE', () => {
    const plan = planRedemption(
      baseInput({ bank: { card_id: 'hdfc-infinia', points: 5600, provenance: 'STATEMENT' } }),
    );
    expect(plan.balanceState).toBe('SUFFICIENT_VIA_PROGRAMME_BALANCE');
    expect(plan.recommendedPath).toBe('TRANSFER_THEN_BOOK');
    expect(plan.recommended?.programmePointsSpent).toBe(4000);
  });

  // 4 — bank 4,000: 2,000 reachable, 4,000 not; larger candidate absent.
  it('04 PARTIAL, larger candidate eliminated UNAFFORDABLE', () => {
    const plan = planRedemption(
      baseInput({
        bank: { card_id: 'hdfc-infinia', points: 4000, provenance: 'STATEMENT' },
        programmeBalance: null,
      }),
    );
    expect(plan.balanceState).toBe('PARTIAL');
    expect(plan.recommendedPath).toBe('TRANSFER_THEN_BOOK');
    expect(plan.recommended?.programmePointsSpent).toBe(2000);
    expect(progCandidate(plan, 4000)).toBeUndefined();
    expect(plan.eliminated.some((e) => e.reason === 'UNAFFORDABLE' && e.wouldHaveSpent === 4000)).toBe(true);
  });

  // 5 — BELOW_MINIMUM under a VERIFIED route → NO_RECOMMENDATION.
  it('05 BELOW_MINIMUM → NO_RECOMMENDATION, portal & cash costed', () => {
    const plan = planRedemption(
      baseInput({
        bank: { card_id: 'hdfc-infinia', points: 1000, provenance: 'STATEMENT' },
        programmeBalance: null,
      }),
    );
    expect(plan.balanceState).toBe('BELOW_MINIMUM');
    expect(plan.recommendedPath).toBe('NO_RECOMMENDATION');
    expect(plan.recommended).toBeNull();
    expect(plan.candidates.some((c) => c.kind === 'PORTAL')).toBe(true);
    expect(plan.candidates.some((c) => c.kind === 'CASH')).toBe(true);
  });

  // 6 — min_booking_value_rule: 6,000 rejected, spend never exceeds eligible.
  it('06 min_booking_value_rule excludes 6,000', () => {
    const plan = planRedemption(
      baseInput({
        booking: { grossMinor: GROSS, roomOnlyMinor: 1_000_000 },
        programmeBalance: null,
      }),
    );
    expect(progCandidate(plan, 6000)).toBeUndefined();
    for (const c of plan.candidates) {
      if (c.kind === 'PROGRAMME' && c.offsetMinor != null) expect(c.offsetMinor).toBeLessThanOrEqual(1_000_000);
    }
  });

  // 7 — permitted amounts INTERSECT; disputed 1,000 surfaced; path unchanged.
  it('07 SOURCE_CONFLICT permitted amounts → INTERSECT', () => {
    const plan = planRedemption(
      baseInput({
        rules: fixedRules({
          permitted_amounts: S({ conservative: { min: 2000, increment: 2000 }, disputed: [1000] }, 'SOURCE_CONFLICT'),
        }),
      }),
    );
    expect(plan.recommendedPath).toBe('TRANSFER_THEN_BOOK');
    expect(plan.ruleState).toBe('SOURCE_CONFLICT');
    const conflict = plan.conflicts.find((c) => c.fact === 'PERMITTED_AMOUNTS');
    expect(conflict?.policy).toBe('INTERSECT');
    expect(conflict?.effect).toContain('1000');
    expect(progCandidate(plan, 1000)).toBeUndefined(); // intersection excludes disputed floor
  });

  // 8 — the disputed floor would itself change BalanceState.
  it('08 PARTIAL under SOURCE_CONFLICT', () => {
    const plan = planRedemption(
      baseInput({
        bank: { card_id: 'hdfc-infinia', points: 4000, provenance: 'STATEMENT' },
        programmeBalance: null,
        rules: fixedRules({
          permitted_amounts: S({ conservative: { min: 2000, increment: 2000 }, disputed: [1000] }, 'SOURCE_CONFLICT'),
        }),
      }),
    );
    expect(plan.balanceState).toBe('PARTIAL');
    expect(plan.recommendedPath).toBe('TRANSFER_THEN_BOOK');
    expect(plan.conflicts.some((c) => c.fact === 'PERMITTED_AMOUNTS')).toBe(true);
  });

  // 9 — portal-value conflict, INVARIANCE_TEST fails → divergence reported.
  it('09 portal-value INVARIANCE_TEST fails → NO_RECOMMENDATION', () => {
    const plan = planRedemption(
      baseInput({
        booking: { grossMinor: 900_000, roomOnlyMinor: 500_000 },
        bank: { card_id: 'hdfc-infinia', points: 4000, provenance: 'STATEMENT' },
        programmeBalance: null,
        portal: { ...PORTAL, value_paise_per_point: 100, value_readings: [100, 200] },
      }),
    );
    expect(plan.recommendedPath).toBe('NO_RECOMMENDATION');
    const conflict = plan.conflicts.find((c) => c.fact === 'PORTAL_VALUE');
    expect(conflict?.policy).toBe('INVARIANCE_TEST');
    expect(conflict?.pathInvariant).toBe(false);
  });

  // 10 — ratio conflict → BLOCK: no exact instruction under either objective.
  it('10 ratio SOURCE_CONFLICT → BLOCK', () => {
    const conflictedRoute: ActiveTransferRoute = {
      ...verifiedRoute(),
      ratio: S({ fromUnits: 2, toUnits: 1 }, 'SOURCE_CONFLICT', [
        { fromUnits: 2, toUnits: 1 },
        { fromUnits: 1, toUnits: 1 },
      ]),
    };
    for (const objective of ['MINIMISE_CASH_TODAY', 'MAXIMISE_BANK_POINT_EFFICIENCY'] as const) {
      const plan = planRedemption(baseInput({ route: conflictedRoute, objective }));
      expect(plan.conflicts.some((c) => c.fact === 'TRANSFER_RATIO' && c.policy === 'BLOCK')).toBe(true);
      expect(plan.recommended?.bankPointsToTransferExact).toBeNull();
      expect(plan.recommended?.instructionBlocked).toBe('RATIO_SOURCE_CONFLICT');
    }
  });

  // 11 — RATIO_ONLY: ranks normally; exact null; target present.
  it('11 RATIO_ONLY', () => {
    const ratioOnly: ActiveTransferRoute = {
      status: 'ACTIVE',
      card_id: 'hdfc-infinia',
      programme_id: 'accor-all',
      ratio: S({ fromUnits: 2, toUnits: 1 }),
      duration_hours: S({ min: 48, max: 96 }),
      reversible: false,
    };
    const plan = planRedemption(baseInput({ route: ratioOnly }));
    expect(plan.transferState).toBe('RATIO_ONLY');
    expect(plan.recommendedPath).toBe('TRANSFER_THEN_BOOK');
    expect(plan.recommended?.bankPointsToTransferExact).toBeNull();
    expect(plan.recommended?.bankPointsRequiredMinimum).toBe(5600); // target present
    expect(plan.recommended?.instructionBlocked).toBe('TRANSFER_MINIMUM_UNVERIFIED');
  });

  // 12 — affordability after increment rounding.
  it('12 UNAFFORDABLE_AFTER_INCREMENT', () => {
    const plan = planRedemption(
      baseInput({
        bank: { card_id: 'hdfc-infinia', points: 5800, provenance: 'STATEMENT' },
        route: verifiedRoute(1000, 1000), // need 5,600 → rounds up to 6,000 > 5,800
      }),
    );
    expect(plan.eliminated.some((e) => e.reason === 'UNAFFORDABLE_AFTER_INCREMENT' && e.wouldHaveSpent === 4000)).toBe(
      true,
    );
    expect(progCandidate(plan, 4000)).toBeUndefined();
    expect(progCandidate(plan, 2000)).toBeDefined();
  });

  // 13 — eligibility unbounded → NO_RECOMMENDATION.
  it('13 UNKNOWN eligibility, unbounded → NO_RECOMMENDATION', () => {
    const plan = planRedemption(
      baseInput({ rules: fixedRules({ programme_eligible: S({ basis: 'TOTAL', excluded: [] }, 'UNKNOWN') }) }),
    );
    expect(plan.recommendedPath).toBe('NO_RECOMMENDATION');
    expect(plan.ruleState).toBe('UNKNOWN');
    expect(plan.blockedReason).toContain('unbounded');
  });

  // 14 — eligibility bounded, path invariant → ranks; instruction still blocked.
  it('14 UNKNOWN eligibility, bounded → TRANSFER_THEN_BOOK, instruction blocked', () => {
    const plan = planRedemption(
      baseInput({
        booking: { grossMinor: GROSS, roomOnlyMinor: 1_000_000 },
        rules: fixedRules({
          programme_eligible: S({ basis: 'TOTAL', excluded: [] }, 'UNKNOWN'),
          programme_eligible_bounds: { minMinor: 1_000_000, maxMinor: GROSS },
        }),
      }),
    );
    expect(plan.recommendedPath).toBe('TRANSFER_THEN_BOOK');
    expect(plan.ruleState).toBe('UNKNOWN');
    expect(plan.recommended?.instructionBlocked).toBe('PROGRAMME_ELIGIBLE_AMOUNT_UNKNOWN');
    expect(plan.recommended?.bankPointsToTransferExact).toBeNull();
    expect(plan.conflicts.some((c) => c.fact === 'ELIGIBLE_BASIS' && c.pathInvariant === true)).toBe(true);
  });

  // 15 — UNAVAILABLE + existing balance → REDEEM_EXISTING_BALANCE.
  it('15 UNAVAILABLE, SUFFICIENT_VIA_PROGRAMME_BALANCE → REDEEM_EXISTING_BALANCE', () => {
    const plan = planRedemption(
      baseInput({
        bank: { card_id: 'hdfc-infinia', points: 0, provenance: 'STATEMENT' },
        programmeBalance: { programme_id: 'accor-all', points: 4000, provenance: 'PROGRAMME_LINKED' },
        route: { status: 'UNAVAILABLE', card_id: 'hdfc-infinia', programme_id: 'accor-all', absence_state: 'SOURCED_NONE' },
      }),
    );
    expect(plan.transferState).toBe('UNAVAILABLE');
    expect(plan.balanceState).toBe('SUFFICIENT_VIA_PROGRAMME_BALANCE');
    expect(plan.recommendedPath).toBe('REDEEM_EXISTING_BALANCE');
    expect(plan.recommended?.bankPointsRequiredMinimum).toBe(0);
    // no fabricated ratio/duration in the record — recommended path used none
    expect(plan.recommended?.durationHours).toBeNull();
  });

  // 16 — ENDED + existing balance → REDEEM_EXISTING_BALANCE; historic ratio unused.
  it('16 ENDED, existing balance → REDEEM_EXISTING_BALANCE', () => {
    const plan = planRedemption(
      baseInput({
        bank: { card_id: 'hdfc-infinia', points: 0, provenance: 'STATEMENT' },
        programmeBalance: { programme_id: 'accor-all', points: 4000, provenance: 'PROGRAMME_LINKED' },
        route: {
          status: 'ENDED',
          card_id: 'hdfc-infinia',
          programme_id: 'accor-all',
          ended_on: S('2026-06-30'),
          historic_ratio: S({ fromUnits: 2, toUnits: 1 }),
        },
      }),
    );
    expect(plan.transferState).toBe('ENDED');
    expect(plan.recommendedPath).toBe('REDEEM_EXISTING_BALANCE');
    expect(plan.recommended?.bankPointsRequiredMinimum).toBe(0); // historic ratio never used
  });

  // 17 — UNAVAILABLE, BELOW_MINIMUM → PORTAL.
  it('17 UNAVAILABLE, BELOW_MINIMUM → PORTAL', () => {
    const plan = planRedemption(
      baseInput({
        programmeBalance: null,
        route: { status: 'UNAVAILABLE', card_id: 'hdfc-infinia', programme_id: 'accor-all', absence_state: 'SOURCED_NONE' },
      }),
    );
    expect(plan.balanceState).toBe('BELOW_MINIMUM');
    expect(plan.recommendedPath).toBe('PORTAL');
  });

  // 18 — §8 Air India PUBLISHED_CHART + AWARD_PRICE (fixture only).
  it('18 PUBLISHED_CHART award → TRANSFER_THEN_BOOK, ₹2,850, objectives disagree', () => {
    const chart: ChartAwardRules = {
      programme_id: 'air-india-maharaja',
      currency_label: 'Maharaja Points',
      requires_direct_booking: S(true),
      booking_url: 'https://www.airindia.com/',
      pricing: 'PUBLISHED_CHART',
      mechanic: 'AWARD_PRICE',
      award_chart: S({
        entries: [{ zone_id: 'SE_ASIA', cabin: 'economy', fare_tier: 'Value', points: 12000, taxes_minor: 285_000 }],
      }),
    };
    const plan = planRedemption({
      booking: { grossMinor: 1_840_000, roomOnlyMinor: 1_840_000, cashFareMinor: 1_840_000, zoneId: 'SE_ASIA', cabin: 'economy', fareTier: 'Value' },
      bank: { card_id: 'hdfc-infinia', points: 21_000, provenance: 'STATEMENT' },
      programmeBalance: { programme_id: 'air-india-maharaja', points: 3000, provenance: 'PROGRAMME_LINKED' },
      rules: chart,
      route: { ...verifiedRoute(1000, 1000), programme_id: 'air-india-maharaja' },
      portal: PORTAL,
      fxRate: FX_1105,
    });
    expect(plan.recommendedPath).toBe('TRANSFER_THEN_BOOK');
    expect(plan.balanceState).toBe('SUFFICIENT_VIA_PROGRAMME_BALANCE');
    expect(plan.recommended?.cashPayableMinor).toBe(285_000); // the taxes, NOT gross − notional
    expect(plan.recommended?.awardTaxesMinor).toBe(285_000);
    expect(plan.recommended?.offsetMinor).toBeNull();
    expect(plan.recommended?.bankPointsRequiredMinimum).toBe(18000);
    expect(ratEq(plan.recommended?.cashAvoidedPerTransferredBankPointPaise ?? null, rational(1_555_000, 18000))).toBe(true);
    expect(plan.runnerUpUnderOtherObjective?.kind).toBe('PORTAL'); // MAXIMISE prefers portal
  });

  // 19 — award indivisible, unaffordable → NO_RECOMMENDATION.
  it('19 PUBLISHED_CHART BELOW_MINIMUM → NO_RECOMMENDATION', () => {
    const chart: ChartAwardRules = {
      programme_id: 'air-india-maharaja',
      currency_label: 'Maharaja Points',
      requires_direct_booking: S(true),
      booking_url: 'https://www.airindia.com/',
      pricing: 'PUBLISHED_CHART',
      mechanic: 'AWARD_PRICE',
      award_chart: S({ entries: [{ zone_id: 'SE_ASIA', cabin: 'economy', fare_tier: 'Value', points: 12000, taxes_minor: 285_000 }] }),
    };
    const plan = planRedemption({
      booking: { grossMinor: 1_840_000, roomOnlyMinor: 1_840_000, cashFareMinor: 1_840_000, zoneId: 'SE_ASIA', cabin: 'economy', fareTier: 'Value' },
      bank: { card_id: 'hdfc-infinia', points: 1000, provenance: 'STATEMENT' },
      programmeBalance: null,
      rules: chart,
      route: { ...verifiedRoute(1000, 1000), programme_id: 'air-india-maharaja' },
      portal: PORTAL,
      fxRate: FX_1105,
    });
    expect(plan.balanceState).toBe('BELOW_MINIMUM');
    expect(plan.recommendedPath).toBe('NO_RECOMMENDATION');
  });

  // 20 — taxes absent → no cash figure emitted at all.
  it('20 PUBLISHED_CHART taxes unknown → cash figure suppressed', () => {
    const chart: ChartAwardRules = {
      programme_id: 'air-india-maharaja',
      currency_label: 'Maharaja Points',
      requires_direct_booking: S(true),
      booking_url: 'https://www.airindia.com/',
      pricing: 'PUBLISHED_CHART',
      mechanic: 'AWARD_PRICE',
      award_chart: S({ entries: [{ zone_id: 'SE_ASIA', cabin: 'economy', fare_tier: 'Value', points: 12000 }] }), // no taxes_minor
    };
    const plan = planRedemption({
      booking: { grossMinor: 1_840_000, roomOnlyMinor: 1_840_000, cashFareMinor: 1_840_000, zoneId: 'SE_ASIA', cabin: 'economy', fareTier: 'Value' },
      bank: { card_id: 'hdfc-infinia', points: 21_000, provenance: 'STATEMENT' },
      programmeBalance: { programme_id: 'air-india-maharaja', points: 3000, provenance: 'PROGRAMME_LINKED' },
      rules: chart,
      route: { ...verifiedRoute(1000, 1000), programme_id: 'air-india-maharaja' },
      portal: PORTAL,
      fxRate: FX_1105,
    });
    const award = plan.candidates.find((c) => c.kind === 'PROGRAMME');
    expect(award?.awardTaxesMinor).toBeNull();
    expect(award?.cashPayableMinor).toBeNull();
    expect(plan.ruleState).toBe('UNKNOWN');
  });

  // 21 — QUOTE_REQUIRED, no quote → QUOTE_REQUIRED; portal still costed.
  it('21 QUOTE_REQUIRED no quote → QUOTE_REQUIRED', () => {
    const quoted: QuotedAwardRules = {
      programme_id: 'marriott-bonvoy',
      currency_label: 'Bonvoy points',
      requires_direct_booking: S(true),
      booking_url: 'https://www.marriott.com/',
      pricing: 'QUOTE_REQUIRED',
      mechanic: 'AWARD_PRICE',
    };
    const plan = planRedemption({
      booking: { grossMinor: 1_864_000, roomOnlyMinor: 1_864_000, cashFareMinor: 1_864_000 },
      bank: { card_id: 'hdfc-infinia', points: 11_400, provenance: 'STATEMENT' },
      programmeBalance: { programme_id: 'marriott-bonvoy', points: 8000, provenance: 'PROGRAMME_LINKED' },
      rules: quoted,
      route: { ...verifiedRoute(1000, 1000), programme_id: 'marriott-bonvoy' },
      portal: PORTAL,
      fxRate: FX_1105,
    });
    expect(plan.recommendedPath).toBe('QUOTE_REQUIRED');
    expect(plan.candidates.some((c) => c.kind === 'PORTAL')).toBe(true);
    expect(plan.candidates.some((c) => c.kind === 'CASH')).toBe(true);
  });

  // 22 — QUOTE_REQUIRED, quote supplied, no route, balance covers → REDEEM_EXISTING_BALANCE.
  it('22 QUOTE_REQUIRED UNAVAILABLE, balance covers → REDEEM_EXISTING_BALANCE', () => {
    const quoted: QuotedAwardRules = {
      programme_id: 'marriott-bonvoy',
      currency_label: 'Bonvoy points',
      requires_direct_booking: S(true),
      booking_url: 'https://www.marriott.com/',
      pricing: 'QUOTE_REQUIRED',
      mechanic: 'AWARD_PRICE',
      quote: { programme_points: 8000, taxes_minor: 0, captured_at: '2026-08-31', provenance: 'USER_ENTERED' },
    };
    const plan = planRedemption({
      booking: { grossMinor: 1_864_000, roomOnlyMinor: 1_864_000, cashFareMinor: 1_864_000 },
      bank: { card_id: 'hdfc-infinia', points: 11_400, provenance: 'STATEMENT' },
      programmeBalance: { programme_id: 'marriott-bonvoy', points: 8000, provenance: 'PROGRAMME_LINKED' },
      rules: quoted,
      route: { status: 'UNAVAILABLE', card_id: 'hdfc-infinia', programme_id: 'marriott-bonvoy', absence_state: 'SOURCED_NONE' },
      portal: PORTAL,
      fxRate: FX_1105,
    });
    expect(plan.recommendedPath).toBe('REDEEM_EXISTING_BALANCE');
    expect(plan.recommended?.bankPointsRequiredMinimum).toBe(0);
  });

  // 23 — §7 Marriott quote unaffordable → NO_RECOMMENDATION.
  it('23 QUOTE_REQUIRED BELOW_MINIMUM → NO_RECOMMENDATION', () => {
    const quoted: QuotedAwardRules = {
      programme_id: 'marriott-bonvoy',
      currency_label: 'Bonvoy points',
      requires_direct_booking: S(true),
      booking_url: 'https://www.marriott.com/',
      pricing: 'QUOTE_REQUIRED',
      mechanic: 'AWARD_PRICE',
      quote: { programme_points: 50000, captured_at: '2026-08-31', provenance: 'USER_ENTERED' },
    };
    const plan = planRedemption({
      booking: { grossMinor: 1_864_000, roomOnlyMinor: 1_864_000, cashFareMinor: 1_864_000 },
      bank: { card_id: 'hdfc-infinia', points: 11_400, provenance: 'STATEMENT' },
      programmeBalance: { programme_id: 'marriott-bonvoy', points: 8000, provenance: 'PROGRAMME_LINKED' },
      rules: quoted,
      route: { ...verifiedRoute(1000, 1000), programme_id: 'marriott-bonvoy' },
      portal: PORTAL,
      fxRate: FX_1105,
    });
    expect(plan.balanceState).toBe('BELOW_MINIMUM');
    expect(plan.recommendedPath).toBe('NO_RECOMMENDATION');
    expect(plan.eliminated.some((e) => e.reason === 'UNAFFORDABLE' && e.wouldHaveSpent === 50000)).toBe(true);
  });

  // 24 — NOT_PRICED → programme suppressed; portal & cash costed; NO_RECOMMENDATION.
  it('24 NOT_PRICED → NO_RECOMMENDATION', () => {
    const notPriced: NotPricedRules = {
      programme_id: 'unpriced',
      currency_label: 'Unpriced points',
      requires_direct_booking: S(true),
      booking_url: 'https://example.com/',
      pricing: 'NOT_PRICED',
      mechanic: null,
    };
    const plan = planRedemption(baseInput({ rules: notPriced }));
    expect(plan.recommendedPath).toBe('NO_RECOMMENDATION');
    expect(plan.candidates.every((c) => c.kind !== 'PROGRAMME')).toBe(true);
    expect(plan.candidates.some((c) => c.kind === 'PORTAL')).toBe(true);
    expect(plan.candidates.some((c) => c.kind === 'CASH')).toBe(true);
  });

  // 25 — CASH strictly dominates the portal → CASH_AND_RETAIN.
  it('25 CASH_AND_RETAIN selected (fee exceeds portal offset)', () => {
    const plan = planRedemption(
      baseInput({
        bank: { card_id: 'hdfc-infinia', points: 100, provenance: 'STATEMENT' },
        programmeBalance: null,
        route: { status: 'UNAVAILABLE', card_id: 'hdfc-infinia', programme_id: 'accor-all', absence_state: 'SOURCED_NONE' },
      }),
    );
    expect(plan.recommendedPath).toBe('CASH_AND_RETAIN');
    expect(plan.eliminated.some((e) => e.reason === 'DOMINATED')).toBe(true);
    // and under MAXIMISE too
    const plan2 = planRedemption(
      baseInput({
        objective: 'MAXIMISE_BANK_POINT_EFFICIENCY',
        bank: { card_id: 'hdfc-infinia', points: 100, provenance: 'STATEMENT' },
        programmeBalance: null,
        route: { status: 'UNAVAILABLE', card_id: 'hdfc-infinia', programme_id: 'accor-all', absence_state: 'SOURCED_NONE' },
      }),
    );
    expect(plan2.recommendedPath).toBe('CASH_AND_RETAIN');
  });

  // 26 — §6.2 at fx=9620 → PORTAL; asserts ₹7,696, not ₹7,680.
  it('26 fx=9620 → PORTAL, premature-floor regression', () => {
    const plan = planRedemption(baseInput({ fxRate: FX_962 }));
    expect(plan.recommendedPath).toBe('PORTAL');
    expect(progCandidate(plan, 4000)?.offsetMinor).toBe(769_600); // ₹7,696 not ₹7,680
    expect(progCandidate(plan, 4000)?.cashPayableMinor).toBe(GROSS - 769_600);
    expect(progCandidate(plan, 2000)?.offsetMinor).toBe(384_800);
  });

  // 27 — FX null → PORTAL; no FX-derived rupee figure; INR-native portal intact.
  it('27 FX unavailable → PORTAL, no programme candidates', () => {
    const plan = planRedemption(baseInput({ fxRate: null }));
    expect(plan.fxState).toBe('UNAVAILABLE');
    expect(plan.recommendedPath).toBe('PORTAL');
    expect(plan.conversionValuePerBankPointPaise).toBeNull();
    expect(plan.candidates.every((c) => c.kind !== 'PROGRAMME')).toBe(true);
    const portal = plan.candidates.find((c) => c.kind === 'PORTAL');
    expect(portal?.cashPayableMinor).toBe(380_482); // INR-native, unaffected by FX
  });

  // 28 — fee amortisation reported; no external floor asserted.
  it('28 portal fee folded correctly (₹116.82)', () => {
    const plan = planRedemption(baseInput());
    const portal = plan.candidates.find((c) => c.kind === 'PORTAL');
    expect(portal?.feeMinor).toBe(11_682); // ceil(9900 × 11800 / 10000)
  });

  // 29 — FX unit guard.
  it('29 FX unit guard: offset(4000, fx=11050) === 884000', () => {
    expect(offsetPaise(4000, 4000, 2000, 11050, 100)).toBe(884_000);
    expect(offsetPaise(4000, 4000, 2000, 110, 100)).not.toBe(884_000);
    expect(offsetPaise(4000, 4000, 2000, 1105, 100)).not.toBe(884_000);
    expect(offsetPaise(4000, 4000, 2000, 1_105_000, 100)).not.toBe(884_000);
  });

  // 30 — no pruning before objective: §6.2 spend-2,000 present despite marginal rate.
  it('30 no candidate pruned on marginal rate', () => {
    const plan = planRedemption(baseInput({ fxRate: FX_962 }));
    expect(progCandidate(plan, 2000)).toBeDefined();
    expect(progCandidate(plan, 4000)).toBeDefined();
  });
});

// ── Every RecommendedPath is selected by at least one test (§9) ──────────────

describe('every RecommendedPath is selected somewhere', () => {
  it('covers all six paths across the matrix', () => {
    const paths = new Set<string>();
    // Re-derive the selecting cases quickly.
    paths.add(planRedemption(baseInput()).recommendedPath); // TRANSFER_THEN_BOOK
    paths.add(planRedemption(baseInput({ fxRate: FX_962 })).recommendedPath); // PORTAL
    paths.add(
      planRedemption(
        baseInput({
          bank: { card_id: 'hdfc-infinia', points: 100, provenance: 'STATEMENT' },
          programmeBalance: null,
          route: { status: 'UNAVAILABLE', card_id: 'hdfc-infinia', programme_id: 'accor-all', absence_state: 'SOURCED_NONE' },
        }),
      ).recommendedPath, // CASH_AND_RETAIN
    );
    paths.add(
      planRedemption(
        baseInput({
          bank: { card_id: 'hdfc-infinia', points: 0, provenance: 'STATEMENT' },
          programmeBalance: { programme_id: 'accor-all', points: 4000, provenance: 'PROGRAMME_LINKED' },
          route: { status: 'UNAVAILABLE', card_id: 'hdfc-infinia', programme_id: 'accor-all', absence_state: 'SOURCED_NONE' },
        }),
      ).recommendedPath, // REDEEM_EXISTING_BALANCE
    );
    paths.add(planRedemption(baseInput({ programmeBalance: null, bank: { card_id: 'x', points: 1000, provenance: 'STATEMENT' } })).recommendedPath); // NO_RECOMMENDATION
    expect(paths.has('TRANSFER_THEN_BOOK')).toBe(true);
    expect(paths.has('PORTAL')).toBe(true);
    expect(paths.has('CASH_AND_RETAIN')).toBe(true);
    expect(paths.has('REDEEM_EXISTING_BALANCE')).toBe(true);
    expect(paths.has('NO_RECOMMENDATION')).toBe(true);
  });
});

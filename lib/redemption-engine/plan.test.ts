// lib/redemption-engine/plan.test.ts
// v3.1 coverage matrix (1–30) plus adversarial regressions discovered in review.

import { describe, it, expect } from 'vitest';
import { planRedemption } from './plan';
import { compareRational, offsetPaise, quoteMinorFromRate, rational } from './rational';
import { HDFC_ACCOR_ROUTE } from './accor';
import type {
  ActiveTransferRoute,
  ChartAwardRules,
  FixedValueRules,
  NotPricedRules,
  PortalTerms,
  QuotedAwardRules,
  Rational,
  RedemptionInput,
  Sourced,
} from './types';

function S<T>(value: T, state: Sourced<T>['state'] = 'VERIFIED', readings?: T[]): Sourced<T> {
  return { value, state, source_url: 'https://example.test/source', as_of: '2026-08-31', readings };
}

const FX_1105 = 110.5;
const FX_962 = 96.2;
const GROSS = 1_229_200;
const ROOM = 1_140_000;

const PORTAL: PortalTerms = {
  value_paise_per_point: 100,
  cap_bp: 7000,
  fee_minor: 9900,
  fee_tax_bp: 1800,
  eligible_basis: { basis: 'TOTAL', excluded: [] },
};

function verifiedRoute(min = 1000, inc = 100, ratio = { fromUnits: 2, toUnits: 1 }): ActiveTransferRoute {
  return {
    status: 'ACTIVE',
    card_id: 'hdfc-infinia',
    programme_id: 'accor-all',
    ratio: S(ratio),
    min_transfer: S(min),
    transfer_increment: S(inc),
    duration_hours: S({ min: 24, max: 24 }),
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
    programmeBalance: { programme_id: 'accor-all', points: 1200, provenance: 'SELF_ENTERED' },
    rules: fixedRules(),
    route: verifiedRoute(),
    portal: PORTAL,
    fxRate: FX_1105,
    ...over,
  };
}

function prog(plan: ReturnType<typeof planRedemption>, spend: number) {
  return plan.candidates.find((candidate) => candidate.kind === 'PROGRAMME' && candidate.programmePointsSpent === spend);
}

function ratEq(actual: Rational | null | undefined, expected: Rational): boolean {
  return actual != null && compareRational(actual, expected) === 0;
}

function chartRules(taxes: number | null = 285_000): ChartAwardRules {
  return {
    programme_id: 'air-india-maharaja',
    currency_label: 'Maharaja Points',
    requires_direct_booking: S(true),
    booking_url: 'https://www.airindia.com/',
    pricing: 'PUBLISHED_CHART',
    mechanic: 'AWARD_PRICE',
    award_chart: S({
      entries: [{ zone_id: 'SE_ASIA', cabin: 'economy', fare_tier: 'Value', points: 12_000, ...(taxes === null ? {} : { taxes_minor: taxes }) }],
    }),
  };
}

function awardInput(rules: ChartAwardRules = chartRules()): RedemptionInput {
  return {
    booking: {
      grossMinor: 1_840_000,
      roomOnlyMinor: 1_840_000,
      cashFareMinor: 1_840_000,
      cashFareState: 'CAPTURED',
      zoneId: 'SE_ASIA',
      cabin: 'economy',
      fareTier: 'Value',
    },
    bank: { card_id: 'hdfc-infinia', points: 21_000, provenance: 'STATEMENT' },
    programmeBalance: { programme_id: 'air-india-maharaja', points: 3000, provenance: 'PROGRAMME_LINKED' },
    rules,
    route: { ...verifiedRoute(1000, 1000), programme_id: 'air-india-maharaja' },
    portal: PORTAL,
    fxRate: FX_1105,
  };
}

describe('exact arithmetic', () => {
  it('keeps the load-bearing FX regressions exact', () => {
    expect(offsetPaise(4000, 4000, 2000, 11050, 100)).toBe(884_000);
    expect(offsetPaise(4000, 4000, 2000, 9620, 100)).toBe(769_600);
    expect(offsetPaise(4000, 4000, 2000, 9620, 100)).not.toBe(768_000);
    expect(quoteMinorFromRate(110.5)).toBe(11_050);
  });
});

describe('v3.1 coverage matrix 1–30', () => {
  it('01 flagship transfer case', () => {
    const plan = planRedemption(baseInput());
    expect(plan.recommendedPath).toBe('TRANSFER_THEN_BOOK');
    expect(plan.balanceState).toBe('SUFFICIENT');
    expect(plan.candidates).toHaveLength(4);
    expect(plan.eliminated).toHaveLength(0);
    expect(plan.recommended?.programmePointsSpent).toBe(4000);
    expect(plan.recommended?.cashPayableMinor).toBe(345_200);
    expect(plan.recommended?.bankPointsRequiredMinimum).toBe(5600);
    expect(plan.runnerUpUnderOtherObjective?.programmePointsSpent).toBe(2000);
    expect(ratEq(prog(plan, 4000)?.marginalRateVsPreviousCandidate, rational(442_000, 4000))).toBe(true);
    expect(ratEq(prog(plan, 2000)?.incrementalBookingOffsetPerTransferredBankPointPaise, rational(442_000, 1600))).toBe(true);
    expect(ratEq(prog(plan, 4000)?.incrementalBookingOffsetPerTransferredBankPointPaise, rational(884_000, 5600))).toBe(true);
    expect(ratEq(plan.conversionValuePerBankPointPaise, rational(442_000, 4000))).toBe(true);
    expect(plan.balances.programme.latentPoints).toBe(1200);
  });

  it('02 programme balance changes bank requirement', () => {
    const plan = planRedemption(baseInput({ programmeBalance: null }));
    expect(plan.recommended?.programmePointsSpent).toBe(4000);
    expect(plan.recommended?.bankPointsRequiredMinimum).toBe(8000);
  });

  it('03 sufficient only with programme balance', () => {
    const plan = planRedemption(baseInput({ bank: { card_id: 'hdfc-infinia', points: 5600, provenance: 'STATEMENT' } }));
    expect(plan.balanceState).toBe('SUFFICIENT_VIA_PROGRAMME_BALANCE');
    expect(plan.recommendedPath).toBe('TRANSFER_THEN_BOOK');
  });

  it('04 partial balance removes unaffordable larger candidate', () => {
    const plan = planRedemption(baseInput({
      bank: { card_id: 'hdfc-infinia', points: 4000, provenance: 'STATEMENT' },
      programmeBalance: null,
    }));
    expect(plan.balanceState).toBe('PARTIAL');
    expect(prog(plan, 4000)).toBeUndefined();
    expect(plan.eliminated.some((item) => item.reason === 'UNAFFORDABLE' && item.wouldHaveSpent === 4000)).toBe(true);
  });

  it('05 below minimum gives no recommendation while costing alternatives', () => {
    const plan = planRedemption(baseInput({
      bank: { card_id: 'hdfc-infinia', points: 1000, provenance: 'STATEMENT' },
      programmeBalance: null,
    }));
    expect(plan.balanceState).toBe('BELOW_MINIMUM');
    expect(plan.recommendedPath).toBe('NO_RECOMMENDATION');
    expect(plan.recommended).toBeNull();
    expect(plan.candidates.some((c) => c.kind === 'PORTAL')).toBe(true);
    expect(plan.candidates.some((c) => c.kind === 'CASH')).toBe(true);
  });

  it('06 never exceeds programme eligible amount', () => {
    const plan = planRedemption(baseInput({ booking: { grossMinor: GROSS, roomOnlyMinor: 1_000_000 }, programmeBalance: null }));
    expect(prog(plan, 6000)).toBeUndefined();
    for (const candidate of plan.candidates) {
      if (candidate.kind === 'PROGRAMME' && candidate.offsetMinor != null) expect(candidate.offsetMinor).toBeLessThanOrEqual(1_000_000);
    }
  });

  it('07 intersects set-valued permitted amount conflict', () => {
    const plan = planRedemption(baseInput({ rules: fixedRules({
      permitted_amounts: S({ conservative: { min: 2000, increment: 2000 }, disputed: [1000] }, 'SOURCE_CONFLICT'),
    }) }));
    expect(plan.recommendedPath).toBe('TRANSFER_THEN_BOOK');
    expect(plan.ruleState).toBe('SOURCE_CONFLICT');
    expect(plan.conflicts.find((c) => c.fact === 'PERMITTED_AMOUNTS')?.policy).toBe('INTERSECT');
    expect(prog(plan, 1000)).toBeUndefined();
  });

  it('08 conflict can coexist with PARTIAL', () => {
    const plan = planRedemption(baseInput({
      bank: { card_id: 'hdfc-infinia', points: 4000, provenance: 'STATEMENT' },
      programmeBalance: null,
      rules: fixedRules({ permitted_amounts: S({ conservative: { min: 2000, increment: 2000 }, disputed: [1000] }, 'SOURCE_CONFLICT') }),
    }));
    expect(plan.balanceState).toBe('PARTIAL');
    expect(plan.conflicts.some((c) => c.fact === 'PERMITTED_AMOUNTS')).toBe(true);
  });

  it('09 numeric portal conflict fails invariance when winner changes', () => {
    const plan = planRedemption(baseInput({
      booking: { grossMinor: 900_000, roomOnlyMinor: 500_000 },
      bank: { card_id: 'hdfc-infinia', points: 4000, provenance: 'STATEMENT' },
      programmeBalance: null,
      portal: { ...PORTAL, value_readings: [100, 200] },
    }));
    expect(plan.recommendedPath).toBe('NO_RECOMMENDATION');
    expect(plan.conflicts.find((c) => c.fact === 'PORTAL_VALUE')?.pathInvariant).toBe(false);
  });

  it('10 transfer ratio conflict blocks transfer arithmetic rather than using one reading', () => {
    const conflicted: ActiveTransferRoute = {
      ...verifiedRoute(),
      ratio: S({ fromUnits: 2, toUnits: 1 }, 'SOURCE_CONFLICT', [
        { fromUnits: 2, toUnits: 1 },
        { fromUnits: 1, toUnits: 1 },
      ]),
    };
    for (const objective of ['MINIMISE_CASH_TODAY', 'MAXIMISE_BANK_POINT_EFFICIENCY'] as const) {
      const plan = planRedemption(baseInput({ route: conflicted, objective }));
      expect(plan.conflicts.some((c) => c.fact === 'TRANSFER_RATIO' && c.policy === 'BLOCK')).toBe(true);
      expect(plan.conversionValuePerBankPointPaise).toBeNull();
      expect(plan.candidates.some((c) => c.kind === 'PROGRAMME' && c.bankPointsRequiredMinimum > 0)).toBe(false);
      expect(plan.eliminated.some((e) => e.reason === 'RATIO_CONFLICT')).toBe(true);
    }
  });

  it('11 ratio-only returns target but never exact instruction', () => {
    const route: ActiveTransferRoute = {
      status: 'ACTIVE', card_id: 'hdfc-infinia', programme_id: 'accor-all',
      ratio: S({ fromUnits: 2, toUnits: 1 }), duration_hours: S({ min: 24, max: 24 }), reversible: false,
    };
    const plan = planRedemption(baseInput({ route }));
    expect(plan.transferState).toBe('RATIO_ONLY');
    expect(plan.recommendedPath).toBe('TRANSFER_THEN_BOOK');
    expect(plan.recommended?.bankPointsRequiredMinimum).toBe(5600);
    expect(plan.recommended?.bankPointsToTransferExact).toBeNull();
    expect(plan.recommended?.instructionBlocked).toBe('TRANSFER_MINIMUM_UNVERIFIED');
  });

  it('12 rechecks affordability after transfer increment rounding', () => {
    const plan = planRedemption(baseInput({
      bank: { card_id: 'hdfc-infinia', points: 5800, provenance: 'STATEMENT' },
      route: verifiedRoute(1000, 1000),
    }));
    expect(plan.eliminated.some((e) => e.reason === 'UNAFFORDABLE_AFTER_INCREMENT' && e.wouldHaveSpent === 4000)).toBe(true);
    expect(prog(plan, 4000)).toBeUndefined();
  });

  it('13 unbounded unknown eligibility blocks recommendation', () => {
    const plan = planRedemption(baseInput({ rules: fixedRules({ programme_eligible: S({ basis: 'TOTAL', excluded: [] }, 'UNKNOWN') }) }));
    expect(plan.ruleState).toBe('UNKNOWN');
    expect(plan.recommendedPath).toBe('NO_RECOMMENDATION');
    expect(plan.blockedReason).toContain('unbounded');
  });

  it('14 bounded unknown eligibility may rank only when executable result invariant', () => {
    const plan = planRedemption(baseInput({
      booking: { grossMinor: GROSS, roomOnlyMinor: 1_000_000 },
      rules: fixedRules({
        programme_eligible: S({ basis: 'TOTAL', excluded: [] }, 'UNKNOWN'),
        programme_eligible_bounds: { minMinor: 1_000_000, maxMinor: GROSS },
      }),
    }));
    expect(plan.recommendedPath).toBe('TRANSFER_THEN_BOOK');
    expect(plan.recommended?.bankPointsToTransferExact).toBeNull();
    expect(plan.recommended?.instructionBlocked).toBe('PROGRAMME_ELIGIBLE_AMOUNT_UNKNOWN');
    expect(plan.conflicts.find((c) => c.fact === 'ELIGIBLE_BASIS')?.pathInvariant).toBe(true);
  });

  it('15 unavailable transfer still allows existing programme balance redemption', () => {
    const plan = planRedemption(baseInput({
      bank: { card_id: 'hdfc-infinia', points: 0, provenance: 'STATEMENT' },
      programmeBalance: { programme_id: 'accor-all', points: 4000, provenance: 'PROGRAMME_LINKED' },
      route: { status: 'UNAVAILABLE', card_id: 'hdfc-infinia', programme_id: 'accor-all', absence_state: 'SOURCED_NONE' },
    }));
    expect(plan.transferState).toBe('UNAVAILABLE');
    expect(plan.recommendedPath).toBe('REDEEM_EXISTING_BALANCE');
    expect(plan.recommended?.bankPointsRequiredMinimum).toBe(0);
    expect(plan.conversionValuePerBankPointPaise).toBeNull();
  });

  it('16 ended transfer still allows existing programme balance redemption', () => {
    const plan = planRedemption(baseInput({
      bank: { card_id: 'hdfc-infinia', points: 0, provenance: 'STATEMENT' },
      programmeBalance: { programme_id: 'accor-all', points: 4000, provenance: 'PROGRAMME_LINKED' },
      route: { status: 'ENDED', card_id: 'hdfc-infinia', programme_id: 'accor-all', ended_on: S('2026-06-30'), historic_ratio: S({ fromUnits: 99, toUnits: 1 }) },
    }));
    expect(plan.recommendedPath).toBe('REDEEM_EXISTING_BALANCE');
    expect(plan.recommended?.bankPointsRequiredMinimum).toBe(0);
    expect(plan.conversionValuePerBankPointPaise).toBeNull();
  });

  it('17 unavailable route with no programme balance falls back to portal', () => {
    const plan = planRedemption(baseInput({
      programmeBalance: null,
      route: { status: 'UNAVAILABLE', card_id: 'hdfc-infinia', programme_id: 'accor-all', absence_state: 'SOURCED_NONE' },
    }));
    expect(plan.balanceState).toBe('BELOW_MINIMUM');
    expect(plan.recommendedPath).toBe('PORTAL');
  });

  it('18 PUBLISHED_CHART uses taxes as cash payable, never manufactured remainder', () => {
    const plan = planRedemption(awardInput());
    expect(plan.recommendedPath).toBe('TRANSFER_THEN_BOOK');
    expect(plan.balanceState).toBe('SUFFICIENT_VIA_PROGRAMME_BALANCE');
    expect(plan.recommended?.cashPayableMinor).toBe(285_000);
    expect(plan.recommended?.awardTaxesMinor).toBe(285_000);
    expect(plan.recommended?.offsetMinor).toBeNull();
    expect(plan.recommended?.bankPointsRequiredMinimum).toBe(18_000);
    expect(ratEq(plan.recommended?.cashAvoidedPerTransferredBankPointPaise, rational(1_555_000, 18_000))).toBe(true);
    expect(plan.runnerUpUnderOtherObjective?.kind).toBe('PORTAL');
  });

  it('19 indivisible award that is unaffordable gives no recommendation', () => {
    const input = awardInput();
    input.bank = { card_id: 'hdfc-infinia', points: 1000, provenance: 'STATEMENT' };
    input.programmeBalance = null;
    const plan = planRedemption(input);
    expect(plan.balanceState).toBe('BELOW_MINIMUM');
    expect(plan.recommendedPath).toBe('NO_RECOMMENDATION');
  });

  it('20 unknown award taxes suppress programme cash figure and cannot win accidentally', () => {
    const input = awardInput(chartRules(null));
    for (const objective of ['MINIMISE_CASH_TODAY', 'MAXIMISE_BANK_POINT_EFFICIENCY'] as const) {
      const plan = planRedemption({ ...input, objective });
      const award = plan.candidates.find((c) => c.kind === 'PROGRAMME');
      expect(award?.cashPayableMinor).toBeNull();
      expect(plan.ruleState).toBe('UNKNOWN');
      expect(plan.recommended?.kind).not.toBe('PROGRAMME');
    }
  });

  it('21 quote-required without quote asks for quote while costing alternatives', () => {
    const rules: QuotedAwardRules = {
      programme_id: 'marriott-bonvoy', currency_label: 'Bonvoy points', requires_direct_booking: S(true),
      booking_url: 'https://www.marriott.com/', pricing: 'QUOTE_REQUIRED', mechanic: 'AWARD_PRICE',
    };
    const plan = planRedemption({
      booking: { grossMinor: 1_864_000, roomOnlyMinor: 1_864_000, cashFareMinor: 1_864_000, cashFareState: 'CAPTURED' },
      bank: { card_id: 'hdfc-infinia', points: 11_400, provenance: 'STATEMENT' },
      programmeBalance: { programme_id: 'marriott-bonvoy', points: 8000, provenance: 'PROGRAMME_LINKED' },
      rules, route: { ...verifiedRoute(), programme_id: 'marriott-bonvoy' }, portal: PORTAL, fxRate: FX_1105,
    });
    expect(plan.recommendedPath).toBe('QUOTE_REQUIRED');
    expect(plan.candidates.some((c) => c.kind === 'PORTAL')).toBe(true);
  });

  it('22 quoted award can redeem existing balance with unavailable transfer route', () => {
    const rules: QuotedAwardRules = {
      programme_id: 'marriott-bonvoy', currency_label: 'Bonvoy points', requires_direct_booking: S(true),
      booking_url: 'https://www.marriott.com/', pricing: 'QUOTE_REQUIRED', mechanic: 'AWARD_PRICE',
      quote: { programme_points: 8000, taxes_minor: 0, captured_at: '2026-08-31', provenance: 'USER_ENTERED' },
    };
    const plan = planRedemption({
      booking: { grossMinor: 1_864_000, roomOnlyMinor: 1_864_000, cashFareMinor: 1_864_000, cashFareState: 'CAPTURED' },
      bank: { card_id: 'hdfc-infinia', points: 11_400, provenance: 'STATEMENT' },
      programmeBalance: { programme_id: 'marriott-bonvoy', points: 8000, provenance: 'PROGRAMME_LINKED' },
      rules, route: { status: 'UNAVAILABLE', card_id: 'hdfc-infinia', programme_id: 'marriott-bonvoy', absence_state: 'SOURCED_NONE' },
      portal: PORTAL, fxRate: FX_1105,
    });
    expect(plan.recommendedPath).toBe('REDEEM_EXISTING_BALANCE');
    expect(plan.recommended?.bankPointsRequiredMinimum).toBe(0);
  });

  it('23 unaffordable Marriott quote stays NO_RECOMMENDATION', () => {
    const rules: QuotedAwardRules = {
      programme_id: 'marriott-bonvoy', currency_label: 'Bonvoy points', requires_direct_booking: S(true),
      booking_url: 'https://www.marriott.com/', pricing: 'QUOTE_REQUIRED', mechanic: 'AWARD_PRICE',
      quote: { programme_points: 50_000, captured_at: '2026-08-31', provenance: 'USER_ENTERED' },
    };
    const plan = planRedemption({
      booking: { grossMinor: 1_864_000, roomOnlyMinor: 1_864_000, cashFareMinor: 1_864_000, cashFareState: 'CAPTURED' },
      bank: { card_id: 'hdfc-infinia', points: 11_400, provenance: 'STATEMENT' },
      programmeBalance: { programme_id: 'marriott-bonvoy', points: 8000, provenance: 'PROGRAMME_LINKED' },
      rules, route: { ...verifiedRoute(), programme_id: 'marriott-bonvoy' }, portal: PORTAL, fxRate: FX_1105,
    });
    expect(plan.balanceState).toBe('BELOW_MINIMUM');
    expect(plan.recommendedPath).toBe('NO_RECOMMENDATION');
  });

  it('24 NOT_PRICED suppresses programme candidates', () => {
    const rules: NotPricedRules = {
      programme_id: 'unpriced', currency_label: 'Unpriced points', requires_direct_booking: S(true),
      booking_url: 'https://example.test/', pricing: 'NOT_PRICED', mechanic: null,
    };
    const plan = planRedemption({
      ...baseInput(),
      programmeBalance: null,
      rules,
      route: { status: 'UNAVAILABLE', card_id: 'hdfc-infinia', programme_id: 'unpriced', absence_state: 'NOT_CAPTURED' },
    });
    expect(plan.recommendedPath).toBe('NO_RECOMMENDATION');
    expect(plan.candidates.every((c) => c.kind !== 'PROGRAMME')).toBe(true);
  });

  it('25 cash-and-retain wins when fee exceeds portal benefit', () => {
    for (const objective of ['MINIMISE_CASH_TODAY', 'MAXIMISE_BANK_POINT_EFFICIENCY'] as const) {
      const plan = planRedemption(baseInput({
        objective,
        bank: { card_id: 'hdfc-infinia', points: 100, provenance: 'STATEMENT' },
        programmeBalance: null,
        route: { status: 'UNAVAILABLE', card_id: 'hdfc-infinia', programme_id: 'accor-all', absence_state: 'SOURCED_NONE' },
      }));
      expect(plan.recommendedPath).toBe('CASH_AND_RETAIN');
    }
  });

  it('26 low FX regression picks portal and keeps ₹7,696 exact', () => {
    const plan = planRedemption(baseInput({ fxRate: FX_962 }));
    expect(plan.recommendedPath).toBe('PORTAL');
    expect(prog(plan, 4000)?.offsetMinor).toBe(769_600);
    expect(prog(plan, 2000)?.offsetMinor).toBe(384_800);
  });

  it('27 null FX keeps INR-native portal valid and suppresses programme FX maths', () => {
    const plan = planRedemption(baseInput({ fxRate: null }));
    expect(plan.fxState).toBe('UNAVAILABLE');
    expect(plan.recommendedPath).toBe('PORTAL');
    expect(plan.conversionValuePerBankPointPaise).toBeNull();
    expect(plan.candidates.every((c) => c.kind !== 'PROGRAMME')).toBe(true);
    expect(plan.candidates.find((c) => c.kind === 'PORTAL')?.cashPayableMinor).toBe(380_482);
  });

  it('28 fee is ₹116.82 exactly', () => {
    expect(planRedemption(baseInput()).candidates.find((c) => c.kind === 'PORTAL')?.feeMinor).toBe(11_682);
  });

  it('29 FX unit guard catches the 100x class', () => {
    expect(offsetPaise(4000, 4000, 2000, 11_050, 100)).toBe(884_000);
    expect(offsetPaise(4000, 4000, 2000, 110, 100)).not.toBe(884_000);
    expect(offsetPaise(4000, 4000, 2000, 1105, 100)).not.toBe(884_000);
    expect(offsetPaise(4000, 4000, 2000, 1_105_000, 100)).not.toBe(884_000);
  });

  it('30 marginal rate never prunes an otherwise legal candidate', () => {
    const plan = planRedemption(baseInput({ fxRate: FX_962 }));
    expect(prog(plan, 2000)).toBeDefined();
    expect(prog(plan, 4000)).toBeDefined();
  });
});

describe('adversarial regressions', () => {
  it('31 rejects negative money and points', () => {
    expect(() => planRedemption(baseInput({ bank: { card_id: 'hdfc-infinia', points: -1, provenance: 'STATEMENT' } }))).toThrow();
    expect(() => planRedemption(baseInput({ booking: { grossMinor: -1, roomOnlyMinor: 0 } }))).toThrow();
  });

  it('32 rejects NaN, Infinity and non-positive FX', () => {
    for (const fxRate of [Number.NaN, Number.POSITIVE_INFINITY, 0, -1]) {
      expect(() => planRedemption(baseInput({ fxRate }))).toThrow();
    }
  });

  it('33 rejects portal caps over 100%', () => {
    expect(() => planRedemption(baseInput({ portal: { ...PORTAL, cap_bp: 10_001 } }))).toThrow();
  });

  it('34 rejects zero transfer-ratio units', () => {
    expect(() => planRedemption(baseInput({ route: verifiedRoute(1000, 100, { fromUnits: 0, toUnits: 1 }) }))).toThrow();
    expect(() => planRedemption(baseInput({ route: verifiedRoute(1000, 100, { fromUnits: 2, toUnits: 0 }) }))).toThrow();
  });

  it('35 rejects missing ROOM_PLUS_TAX instead of falling back to gross', () => {
    expect(() => planRedemption(baseInput({ portal: { ...PORTAL, eligible_basis: { basis: 'ROOM_PLUS_TAX', excluded: [] } } }))).toThrow();
  });

  it('36 rejects card/programme identity mismatches', () => {
    expect(() => planRedemption(baseInput({ bank: { card_id: 'wrong-card', points: 1000, provenance: 'STATEMENT' } }))).toThrow();
    expect(() => planRedemption(baseInput({ programmeBalance: { programme_id: 'wrong-programme', points: 1000, provenance: 'SELF_ENTERED' } }))).toThrow();
  });

  it('37 rejects duplicate award-chart selectors', () => {
    const rules = chartRules();
    rules.award_chart = S({ entries: [
      { zone_id: 'SE_ASIA', cabin: 'economy', fare_tier: 'Value', points: 12_000, taxes_minor: 285_000 },
      { zone_id: 'SE_ASIA', cabin: 'economy', fare_tier: 'Value', points: 99_999, taxes_minor: 1 },
    ] });
    expect(() => planRedemption(awardInput(rules))).toThrow();
  });

  it('38 rational comparison stays exact when Number cross-products would exceed safe integer range', () => {
    const a = rational(Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER - 3);
    const b = rational(Number.MAX_SAFE_INTEGER - 2, Number.MAX_SAFE_INTEGER - 4);
    expect(compareRational(a, b)).toBe(-1);
  });

  it('39 unknown cash figure never sorts as zero/best under either objective', () => {
    const input = awardInput(chartRules(null));
    for (const objective of ['MINIMISE_CASH_TODAY', 'MAXIMISE_BANK_POINT_EFFICIENCY'] as const) {
      const plan = planRedemption({ ...input, objective });
      expect(plan.candidates.find((c) => c.kind === 'PROGRAMME')?.cashPayableMinor).toBeNull();
      expect(plan.recommended?.kind).not.toBe('PROGRAMME');
    }
  });

  it('40 ratio conflict does not block a zero-transfer existing-balance redemption', () => {
    const route: ActiveTransferRoute = {
      ...verifiedRoute(),
      ratio: S({ fromUnits: 2, toUnits: 1 }, 'SOURCE_CONFLICT', [
        { fromUnits: 2, toUnits: 1 }, { fromUnits: 1, toUnits: 1 },
      ]),
    };
    const plan = planRedemption(baseInput({
      bank: { card_id: 'hdfc-infinia', points: 0, provenance: 'STATEMENT' },
      programmeBalance: { programme_id: 'accor-all', points: 4000, provenance: 'PROGRAMME_LINKED' },
      route,
    }));
    expect(plan.recommendedPath).toBe('REDEEM_EXISTING_BALANCE');
    expect(plan.recommended?.bankPointsRequiredMinimum).toBe(0);
  });

  it('41 invariance checks executable numbers, not only the broad path label', () => {
    const plan = planRedemption(baseInput({
      bank: { card_id: 'hdfc-infinia', points: 1000, provenance: 'STATEMENT' },
      programmeBalance: null,
      route: { status: 'UNAVAILABLE', card_id: 'hdfc-infinia', programme_id: 'accor-all', absence_state: 'SOURCED_NONE' },
      portal: { ...PORTAL, value_readings: [90, 100] },
    }));
    expect(plan.recommendedPath).toBe('NO_RECOMMENDATION');
    expect(plan.blockedReason).toContain('executable recommendation');
  });

  it('42 BalanceState uses rounded transfer affordability', () => {
    const plan = planRedemption(baseInput({
      booking: { grossMinor: 500_000, roomOnlyMinor: 442_000 },
      bank: { card_id: 'hdfc-infinia', points: 3500, provenance: 'STATEMENT' },
      programmeBalance: { programme_id: 'accor-all', points: 1000, provenance: 'SELF_ENTERED' },
      route: verifiedRoute(2000, 2000, { fromUnits: 3, toUnits: 2 }),
    }));
    expect(plan.balanceState).toBe('SUFFICIENT_VIA_PROGRAMME_BALANCE');
  });

  it('43 PUBLISHED_CHART requires all selectors', () => {
    const input = awardInput();
    delete input.booking.zoneId;
    expect(() => planRedemption(input)).toThrow();
  });

  it('44 missing published-chart entry fails closed', () => {
    const input = awardInput();
    input.booking.zoneId = 'NO_SUCH_ZONE';
    const plan = planRedemption(input);
    expect(plan.recommendedPath).toBe('NO_RECOMMENDATION');
    expect(plan.candidates.some((c) => c.kind === 'PROGRAMME')).toBe(false);
  });

  it('45 portal eligibility and programme eligibility remain independent', () => {
    const plan = planRedemption(baseInput({
      booking: { grossMinor: 1_200_000, roomOnlyMinor: 400_000 },
      bank: { card_id: 'hdfc-infinia', points: 20_000, provenance: 'STATEMENT' },
      programmeBalance: null,
    }));
    const portal = plan.candidates.find((c) => c.kind === 'PORTAL');
    expect(portal?.bankPointsRequiredMinimum).toBe(8400);
    expect(prog(plan, 4000)).toBeUndefined();
  });

  it('46 cash/portal boundary around the ₹116.82 flat fee is exact', () => {
    const unavailable = { status: 'UNAVAILABLE', card_id: 'hdfc-infinia', programme_id: 'accor-all', absence_state: 'SOURCED_NONE' } as const;
    const p116 = planRedemption(baseInput({ bank: { card_id: 'hdfc-infinia', points: 116, provenance: 'STATEMENT' }, programmeBalance: null, route: unavailable }));
    const p117 = planRedemption(baseInput({ bank: { card_id: 'hdfc-infinia', points: 117, provenance: 'STATEMENT' }, programmeBalance: null, route: unavailable }));
    expect(p116.recommendedPath).toBe('CASH_AND_RETAIN');
    expect(p117.recommendedPath).toBe('PORTAL');
  });

  it('47 production Accor route uses the issuer-captured 24-hour duration', () => {
    expect(HDFC_ACCOR_ROUTE.duration_hours.value).toEqual({ min: 24, max: 24 });
    expect(HDFC_ACCOR_ROUTE.duration_hours.as_of).toBe('2026-08-31');
  });

  it('48 rejects present-but-unverified transfer minimum/increment', () => {
    const route = verifiedRoute();
    route.min_transfer = S(1000, 'UNKNOWN');
    expect(() => planRedemption(baseInput({ route }))).toThrow();
  });
});

describe('path coverage', () => {
  it('selects all six RecommendedPath values in explicit scenarios', () => {
    const paths = new Set<string>();
    paths.add(planRedemption(baseInput()).recommendedPath);
    paths.add(planRedemption(baseInput({ fxRate: FX_962 })).recommendedPath);
    paths.add(planRedemption(baseInput({
      bank: { card_id: 'hdfc-infinia', points: 100, provenance: 'STATEMENT' }, programmeBalance: null,
      route: { status: 'UNAVAILABLE', card_id: 'hdfc-infinia', programme_id: 'accor-all', absence_state: 'SOURCED_NONE' },
    })).recommendedPath);
    paths.add(planRedemption(baseInput({
      bank: { card_id: 'hdfc-infinia', points: 0, provenance: 'STATEMENT' },
      programmeBalance: { programme_id: 'accor-all', points: 4000, provenance: 'PROGRAMME_LINKED' },
      route: { status: 'UNAVAILABLE', card_id: 'hdfc-infinia', programme_id: 'accor-all', absence_state: 'SOURCED_NONE' },
    })).recommendedPath);
    paths.add(planRedemption(baseInput({ bank: { card_id: 'hdfc-infinia', points: 1000, provenance: 'STATEMENT' }, programmeBalance: null })).recommendedPath);

    const quoted: QuotedAwardRules = {
      programme_id: 'marriott-bonvoy', currency_label: 'Bonvoy points', requires_direct_booking: S(true),
      booking_url: 'https://www.marriott.com/', pricing: 'QUOTE_REQUIRED', mechanic: 'AWARD_PRICE',
    };
    paths.add(planRedemption({
      booking: { grossMinor: 1_000_000, roomOnlyMinor: 1_000_000 },
      bank: { card_id: 'hdfc-infinia', points: 1000, provenance: 'STATEMENT' },
      programmeBalance: null,
      rules: quoted,
      route: { status: 'UNAVAILABLE', card_id: 'hdfc-infinia', programme_id: 'marriott-bonvoy', absence_state: 'NOT_CAPTURED' },
      portal: PORTAL,
      fxRate: null,
    }).recommendedPath);

    expect(paths).toEqual(new Set([
      'TRANSFER_THEN_BOOK', 'PORTAL', 'CASH_AND_RETAIN', 'REDEEM_EXISTING_BALANCE', 'NO_RECOMMENDATION', 'QUOTE_REQUIRED',
    ]));
  });
});

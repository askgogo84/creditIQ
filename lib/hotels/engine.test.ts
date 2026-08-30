// lib/hotels/engine.test.ts
//
// The FX boundary is the product. If these tests do not exist, the product
// is not built. Every constant below is VERIFIED, not illustrative:
//
//   SmartBuy (HDFC Regalia), captured from the live checkout 30 Aug 2026:
//     "Note: 1 point = 0.50 Rs"  ... verified
//     "you can pay maximum 70% of the transaction amount through Points"
//     "A redemption fee of Rs. 99 + GST would be charged for every points
//      redemption transaction"      -> Rs.117 incl. 18% GST
//
//   Accor ALL, from all.accor.com terms, checked 28 Aug 2026:
//     2,000 points = EUR 40; redeemable at 1,000 then increments of 2,000

import { describe, it, expect } from 'vitest';
import {
  evaluateStay,
  breakEvenFxRate,
  floorToRedeemable,
  portalValuation,
  convertPoints,
  bankPointsFor,
  type PortalTerms,
  type StayInput,
  type FxSnapshot,
} from './engine';
import type { HotelProgramme } from '@/lib/data/hotel-programmes';

const ACCOR: HotelProgramme = {
  id: 'accor-all',
  name: 'ALL — Accor Live Limitless',
  short_name: 'Accor',
  pricing_model: 'fixed',
  points_per_block: 2000,
  block_value: 40,
  block_currency: 'EUR',
  min_redemption_points: 1000,
  redemption_increment: 2000,
  fixed_rate_applies_to: 'hotel stays',
  source_url: 'https://all.accor.com/',
  as_of: '2026-08-28',
  provenance: 'SOURCED',
};

const MARRIOTT: HotelProgramme = {
  ...ACCOR,
  id: 'marriott-bonvoy',
  short_name: 'Marriott',
  pricing_model: 'dynamic',
  points_per_block: null,
  block_value: null,
  block_currency: null,
  min_redemption_points: null,
  redemption_increment: null,
  fixed_rate_applies_to: null,
  provenance: 'UNKNOWN',
};

/** HDFC SmartBuy, Regalia — every figure verified on the live checkout. */
const SMARTBUY: PortalTerms = {
  value_per_point_inr: 0.5,
  max_share_of_bill: 0.7,
  redemption_fee_inr: 117, // Rs.99 + 18% GST
  source: 'SmartBuy checkout, captured 2026-08-30',
  as_of: '2026-08-30',
};

const fx = (rate: number): FxSnapshot => ({
  rate,
  fetched_at: '2026-08-30T10:00:00Z',
  source: 'test',
});

/** 3 nights, 20,000 Accor points a night, 1:1 from HDFC. */
const stay = (over: Partial<StayInput> = {}): StayInput => ({
  nights: 3,
  cash_per_night_inr: 20000,
  points_per_night: 20000,
  user_balance_points: 100000,
  transfer_ratio: { from: 1, to: 1 },
  ...over,
});

describe('portalValuation — the SmartBuy terms as captured', () => {
  it('caps points at 70% of the bill and leaves the rest as cash', () => {
    const p = portalValuation(12703, SMARTBUY);
    expect(p.max_payable_inr).toBeCloseTo(8892.1, 1);
    expect(p.cash_remainder_inr).toBeCloseTo(3810.9, 1);
    expect(p.capped).toBe(true);
  });

  it('keeps the nominal rate clean and folds only the fee into effective', () => {
    const p = portalValuation(12703, SMARTBUY);
    expect(p.nominal_per_point_inr).toBe(0.5);
    // 17,784 points cover Rs.8,892; the Rs.117 fee shaves the real rate.
    expect(p.effective_per_point_inr).toBeLessThan(0.5);
    expect(p.effective_per_point_inr).toBeGreaterThan(0.49);
  });

  it('matches the live checkout: 17,784 pts offset Rs.8,892 on a Rs.12,703 bill', () => {
    const p = portalValuation(12703, SMARTBUY);
    const pointsUsed = p.max_payable_inr / SMARTBUY.value_per_point_inr;
    expect(Math.round(pointsUsed)).toBe(17784);
  });
});

describe('floorToRedeemable — Accor redeems in blocks, not arbitrary amounts', () => {
  it('returns 0 below the 1,000 minimum', () => {
    expect(floorToRedeemable(999, ACCOR)).toBe(0);
  });
  it('allows exactly the 1,000 minimum', () => {
    expect(floorToRedeemable(1500, ACCOR)).toBe(1000);
  });
  it('steps in 2,000 above the minimum', () => {
    expect(floorToRedeemable(3000, ACCOR)).toBe(3000);
    expect(floorToRedeemable(4500, ACCOR)).toBe(3000);
    expect(floorToRedeemable(5000, ACCOR)).toBe(5000);
  });
  it('passes a dynamic programme through untouched', () => {
    expect(floorToRedeemable(4321, MARRIOTT)).toBe(4321);
  });
});

describe('point conversion', () => {
  it('converts at 1:1', () => {
    expect(convertPoints(50000, { from: 1, to: 1 })).toBe(50000);
  });
  it('converts at 5:2 and rounds down — never up', () => {
    expect(convertPoints(10000, { from: 5, to: 2 })).toBe(4000);
    expect(convertPoints(10001, { from: 5, to: 2 })).toBe(4000);
  });
  it('rounds bank points needed UP so the user is never short', () => {
    expect(bankPointsFor(4001, { from: 5, to: 2 })).toBe(10003);
  });
});

describe('THE FX BOUNDARY — this is the product', () => {
  it('points win at a strong euro', () => {
    const r = evaluateStay(stay(), ACCOR, SMARTBUY, fx(110));
    expect(r.verdict).toBe('POINTS_WIN');
    expect(r.advantage_pct).toBeGreaterThan(5);
  });

  it('cash wins at a weak euro', () => {
    const r = evaluateStay(stay(), ACCOR, SMARTBUY, fx(20));
    expect(r.verdict).toBe('CASH_WINS');
    expect(r.advantage_pct).toBeLessThan(-5);
  });

  it('reports a break-even rate, and the verdict flips across it', () => {
    const s = stay();
    const be = breakEvenFxRate(s, ACCOR, SMARTBUY);
    expect(be).not.toBeNull();

    const below = evaluateStay(s, ACCOR, SMARTBUY, fx(be! * 0.8));
    const above = evaluateStay(s, ACCOR, SMARTBUY, fx(be! * 1.2));
    expect(below.verdict).toBe('CASH_WINS');
    expect(above.verdict).toBe('POINTS_WIN');
  });

  it('sits in CLOSE_CALL right at the break-even rate', () => {
    const s = stay();
    const be = breakEvenFxRate(s, ACCOR, SMARTBUY)!;
    const r = evaluateStay(s, ACCOR, SMARTBUY, fx(be));
    expect(r.verdict).toBe('CLOSE_CALL');
    expect(Math.abs(r.advantage_pct!)).toBeLessThanOrEqual(5);
  });
});

describe('refusing to guess', () => {
  it('will not price a dynamic programme', () => {
    const r = evaluateStay(stay(), MARRIOTT, SMARTBUY, fx(110));
    expect(r.verdict).toBe('NOT_PUBLISHED');
    expect(r.programme_points_required).toBeNull();
    expect(r.value_per_point_inr).toBeNull();
    // The cash side is still real and still useful.
    expect(r.cash_total_inr).toBe(60000);
  });

  it('will not compute without a sourced transfer ratio', () => {
    const r = evaluateStay(
      stay({ transfer_ratio: null }),
      ACCOR,
      SMARTBUY,
      fx(110),
    );
    expect(r.verdict).toBe('RATIO_UNKNOWN');
    expect(r.value_per_point_inr).toBeNull();
  });

  it('suppresses the rupee comparison when FX is unavailable, keeps the points cost', () => {
    const r = evaluateStay(stay(), ACCOR, SMARTBUY, null);
    expect(r.verdict).toBe('FX_UNAVAILABLE');
    expect(r.programme_points_required).toBe(60000);
    expect(r.redemption_value_inr).toBeNull();
    expect(r.advantage_pct).toBeNull();
  });

  it('never falls back to a stored FX constant', () => {
    const r = evaluateStay(stay(), ACCOR, SMARTBUY, null);
    expect(r.redemption_value_inr).toBeNull();
    expect(r.value_per_point_inr).toBeNull();
  });
});

describe('coverage and top-up', () => {
  it('covers every night with points to spare', () => {
    const r = evaluateStay(stay({ user_balance_points: 100000 }), ACCOR, SMARTBUY, fx(110));
    expect(r.coverage.kind).toBe('full');
    expect(r.coverage.covered_nights).toBe(3);
    expect(r.coverage.cash_topup_inr).toBe(0);
    expect(r.coverage.points_left_over).toBe(40000);
  });

  it('covers two nights and names the cash gap on the third', () => {
    const r = evaluateStay(stay({ user_balance_points: 45000 }), ACCOR, SMARTBUY, fx(110));
    expect(r.coverage.kind).toBe('partial');
    expect(r.coverage.covered_nights).toBe(2);
    expect(r.coverage.cash_topup_inr).toBe(20000);
    expect(r.coverage.extra_points_needed).toBe(15000);
  });

  it('covers nothing when the balance is too small', () => {
    const r = evaluateStay(stay({ user_balance_points: 5000 }), ACCOR, SMARTBUY, fx(110));
    expect(r.coverage.kind).toBe('none');
    expect(r.coverage.covered_nights).toBe(0);
  });

  it('reports unknown coverage when no balance is on file', () => {
    const r = evaluateStay(stay({ user_balance_points: null }), ACCOR, SMARTBUY, fx(110));
    expect(r.coverage.kind).toBe('unknown');
  });

  it('accounts for a poor transfer ratio when computing coverage', () => {
    const r = evaluateStay(
      stay({ user_balance_points: 100000, transfer_ratio: { from: 5, to: 2 } }),
      ACCOR,
      SMARTBUY,
      fx(110),
    );
    // 100,000 bank points -> 40,000 Accor -> 2 nights, not 3.
    expect(r.coverage.covered_nights).toBe(2);
  });
});

describe('the 70% cap is surfaced, not folded into the rate', () => {
  it('keeps the nominal portal rate at the stated Rs.0.50', () => {
    const r = evaluateStay(stay(), ACCOR, SMARTBUY, fx(110));
    expect(r.portal_nominal_per_point_inr).toBe(0.5);
  });

  it('flags the cap and states the cash remainder', () => {
    const r = evaluateStay(stay(), ACCOR, SMARTBUY, fx(110));
    expect(r.portal_capped).toBe(true);
    expect(r.portal_cash_remainder_inr).toBeCloseTo(18000, 0); // 30% of 60,000
    expect(r.notes.some((n) => n.includes('70%'))).toBe(true);
  });

  it('does not flag a cap for an uncapped portal', () => {
    const r = evaluateStay(
      stay(),
      ACCOR,
      { ...SMARTBUY, max_share_of_bill: 1 },
      fx(110),
    );
    expect(r.portal_capped).toBe(false);
  });
});

describe('block rounding is disclosed', () => {
  it('notes when the points figure was rounded to a redeemable block', () => {
    const r = evaluateStay(
      stay({ nights: 1, points_per_night: 4500 }),
      ACCOR,
      SMARTBUY,
      fx(110),
    );
    expect(r.programme_points_required).toBe(3000);
    expect(r.notes.some((n) => n.includes('fixed blocks'))).toBe(true);
  });
});

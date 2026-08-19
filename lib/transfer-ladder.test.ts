// lib/transfer-ladder.test.ts
// Engine tests run against a FIXTURE edge set (not lib/data/transfer-graph), so
// they stay stable when the real seed changes. The fixture deliberately carries
// what the shipped graph does not yet: minimum increments, known durations, a
// 2-hop intermediate, and an allowlisted edge — the paths the engine must handle
// regardless of what data exists today.

import { describe, it, expect } from 'vitest';
import { findTransferRoutes, describeDuration, type TransferEdge } from './transfer-ladder';

// ── fixture ──────────────────────────────────────────────────────────────────
// Nodes: currencies hdfc_rp / axis_edge / amex_mr; intermediates accor / marriott;
// programmes singapore / ba.
const FIX: TransferEdge[] = [
  // Direct hdfc_rp -> singapore, 1:1, 1,000 increment, known short duration.
  { from_currency: 'hdfc_rp', to_programme: 'singapore', ratio_from: 1, ratio_to: 1,
    min_transfer: 1000, duration_days_min: 0, duration_days_max: 2,
    bonus_note: null, state: 'unverified', source: 'fixture', as_of: '2026-07-01' },

  // Direct axis_edge -> singapore, 5:4, UNKNOWN duration (nulls).
  { from_currency: 'axis_edge', to_programme: 'singapore', ratio_from: 5, ratio_to: 4,
    min_transfer: 1000, duration_days_min: null, duration_days_max: null,
    bonus_note: null, state: 'unverified', source: 'fixture', as_of: '2026-07-01' },

  // 2-hop leg 1: hdfc_rp -> accor, 2:1, 1,000 increment, 1–3 days.
  { from_currency: 'hdfc_rp', to_programme: 'accor', ratio_from: 2, ratio_to: 1,
    min_transfer: 1000, duration_days_min: 1, duration_days_max: 3,
    bonus_note: null, state: 'unverified', source: 'fixture', as_of: '2026-06-01' },

  // 2-hop leg 2: accor -> singapore, 2:1, 5,000 increment (this is what inflates),
  // 3–10 days, DISPUTED (drives worst-of-hops state).
  { from_currency: 'accor', to_programme: 'singapore', ratio_from: 2, ratio_to: 1,
    min_transfer: 5000, duration_days_min: 3, duration_days_max: 10,
    bonus_note: null, state: 'disputed', source: 'fixture', as_of: '2026-05-01' },

  // Allowlisted edge: hdfc_rp -> ba, 3:1, Infinia only.
  { from_currency: 'hdfc_rp', to_programme: 'ba', ratio_from: 3, ratio_to: 1,
    min_transfer: null, duration_days_min: 2, duration_days_max: 3,
    bonus_note: null, state: 'unverified', source: 'fixture', as_of: '2026-07-01',
    card_name_allowlist: ['HDFC Infinia Metal Edition'] },

  // Extra legs that WOULD form a 3-hop hdfc_rp -> accor -> marriott -> singapore.
  // The engine must never return it (2-hop bound).
  { from_currency: 'accor', to_programme: 'marriott', ratio_from: 1, ratio_to: 1,
    min_transfer: null, duration_days_min: 1, duration_days_max: 2,
    bonus_note: null, state: 'unverified', source: 'fixture', as_of: '2026-07-01' },
  { from_currency: 'marriott', to_programme: 'singapore', ratio_from: 1, ratio_to: 1,
    min_transfer: null, duration_days_min: 1, duration_days_max: 2,
    bonus_note: null, state: 'unverified', source: 'fixture', as_of: '2026-07-01' },
];

describe('findTransferRoutes — direct rungs', () => {
  it('returns a direct 1:1 route with no inflation when the increment divides evenly', () => {
    const routes = findTransferRoutes(FIX, 'hdfc_rp', 'singapore', 40000);
    const direct = routes.find((r) => r.hops.length === 1);
    expect(direct).toBeDefined();
    expect(direct!.pointsRequired).toBe(40000);      // 40000 × 1:1, already a 1,000 multiple
    expect(direct!.nominalRatio).toEqual([1, 1]);
    expect(direct!.roundingInflated).toBe(false);
    expect(direct!.minTransferIncrement).toBe(1000);
  });

  it('flags roundingInflated on a direct route when the minimum forces an over-transfer', () => {
    const routes = findTransferRoutes(FIX, 'hdfc_rp', 'singapore', 39500);
    const direct = routes.find((r) => r.hops.length === 1)!;
    // raw 39,500 -> round up to 1,000 -> 40,000; nominal = 39,500. Inflated.
    expect(direct.pointsRequired).toBe(40000);
    expect(direct.roundingInflated).toBe(true);
  });
});

describe('findTransferRoutes — 2-hop rung (the one-number-one-meaning case)', () => {
  it('pointsRequired exceeds milesNeeded × nominalRatio because a hop minimum bit', () => {
    const routes = findTransferRoutes(FIX, 'hdfc_rp', 'singapore', 39500);
    const twoHop = routes.find((r) => r.hops.length === 2)!;
    expect(twoHop).toBeDefined();
    // Backward: accor needed = ceil(39500×2/1)=79,000 -> round up to 5,000 = 80,000.
    //           hdfc_rp     = ceil(80000×2/1)=160,000 -> round up to 1,000 = 160,000.
    expect(twoHop.pointsRequired).toBe(160000);
    // Nominal 4:1 => ceil(39500×4)=158,000. So the displayed ratio UNDER-states cost.
    expect(twoHop.nominalRatio).toEqual([4, 1]);
    expect(39500 * 4).toBe(158000);
    expect(twoHop.pointsRequired).toBeGreaterThan(39500 * twoHop.nominalRatio[0]);
    expect(twoHop.roundingInflated).toBe(true);
  });

  it('takes the WORST hop state and the OLDEST hop date', () => {
    const twoHop = findTransferRoutes(FIX, 'hdfc_rp', 'singapore', 39500)
      .find((r) => r.hops.length === 2)!;
    expect(twoHop.state).toBe('disputed');   // unverified + disputed -> disputed
    expect(twoHop.asOf).toBe('2026-05-01');  // oldest of 2026-06-01 / 2026-05-01
  });

  it('sums hop durations when all are known', () => {
    const twoHop = findTransferRoutes(FIX, 'hdfc_rp', 'singapore', 39500)
      .find((r) => r.hops.length === 2)!;
    expect(twoHop.durationUnknown).toBe(false);
    expect(twoHop.durationDaysMin).toBe(4);   // 1 + 3
    expect(twoHop.durationDaysMax).toBe(13);  // 3 + 10
    expect(describeDuration(twoHop)).toBe('4–13 days');
  });
});

describe('findTransferRoutes — duration honesty', () => {
  it('marks a route unknown and renders the confirm-before-transfer copy when a hop duration is null', () => {
    const route = findTransferRoutes(FIX, 'axis_edge', 'singapore', 40000)[0];
    expect(route.durationUnknown).toBe(true);
    expect(route.durationDaysMin).toBeNull();
    expect(route.durationDaysMax).toBeNull();
    expect(describeDuration(route)).toBe('transfer time unknown — confirm before you transfer');
  });
});

describe('findTransferRoutes — allowlist (moat: no misfired route)', () => {
  it('excludes an allowlisted edge when no card is named', () => {
    expect(findTransferRoutes(FIX, 'hdfc_rp', 'ba', 30000)).toEqual([]);
  });
  it('includes it for the allowed card', () => {
    const routes = findTransferRoutes(FIX, 'hdfc_rp', 'ba', 30000, { cardName: 'HDFC Infinia Metal Edition' });
    expect(routes).toHaveLength(1);
    expect(routes[0].pointsRequired).toBe(90000); // 30000 × 3
  });
  it('excludes it for a non-allowed card (e.g. Regalia Gold)', () => {
    expect(findTransferRoutes(FIX, 'hdfc_rp', 'ba', 30000, { cardName: 'HDFC Regalia Gold' })).toEqual([]);
  });
});

describe('findTransferRoutes — bounds, sorting, empties', () => {
  it('never returns more than 2 hops and never uses the 3-hop marriott path', () => {
    const routes = findTransferRoutes(FIX, 'hdfc_rp', 'singapore', 39500);
    expect(routes.every((r) => r.hops.length <= 2)).toBe(true);
    const usesMarriott = routes.some((r) => r.hops.some((h) => h.from === 'marriott' || h.to === 'marriott'));
    expect(usesMarriott).toBe(false);
  });

  it('sorts by pointsRequired ascending (cheapest rung first)', () => {
    const routes = findTransferRoutes(FIX, 'hdfc_rp', 'singapore', 39500);
    const pts = routes.map((r) => r.pointsRequired);
    expect(pts).toEqual([...pts].sort((a, b) => a - b));
    expect(routes[0].hops.length).toBe(1);  // direct 40,000 beats 2-hop 160,000
  });

  it('returns [] for an unreachable currency (no guessed ratio)', () => {
    expect(findTransferRoutes(FIX, 'sbi_points', 'singapore', 10000)).toEqual([]);
  });

  it('returns [] for non-positive milesNeeded', () => {
    expect(findTransferRoutes(FIX, 'hdfc_rp', 'singapore', 0)).toEqual([]);
    expect(findTransferRoutes(FIX, 'hdfc_rp', 'singapore', -5)).toEqual([]);
  });
});

// lib/data/transfer-graph.ts
// The transfer-edge list — v1 seed. Same field shape as the deferred
// `transfer_partners` table (docs/05-BACKEND-SCHEMA §1); ships as a build-gated
// TS constant instead of a DB table until it needs editorial writes / history.
// Integrity is enforced by scripts/validate-transfer-graph.ts (npm run
// check:transfer-graph) — a comment is not a gate.
//
// PROVENANCE (honest, per the moat):
//   Every edge here is DIRECT (1 hop) and sourced from lib/transfer-map.ts, which
//   holds ESTIMATED ratios with prior basis in the codebase, NOT reconciled
//   against a live issuer transfer API. So:
//     - state  = 'unverified' on every edge (renders neutral grey, never green).
//     - source = 'internal-estimate:lib/transfer-map.ts'.
//     - as_of  = 2026-07-10 (that file's last substantive edit).
//     - duration_days_* = null everywhere — we do NOT have issuer-confirmed
//       transfer times yet. Null renders "transfer time unknown — confirm before
//       you transfer", never instant. Sourcing real durations (HDFC SmartBuy,
//       Amex MR partner list, Axis Edge — each gives a URL + date) is a separate
//       task that will flip these to real ranges and, where confirmed, state.
//     - min_transfer = null — transfer-map carries no minimums; unknown, not zero.
//
// NO INTERMEDIATE (2-hop) EDGES SHIP. The engine keeps the 2-hop path and it is
// tested against a fixture, but no intermediate edge ships without a verified
// ratio AND a verified duration (a 2-hop 4:1 route taking up to 13 days is a
// risk to demonstrate, not advice to give).

import type { TransferEdge } from '../transfer-ladder';

const SRC = 'internal-estimate:lib/transfer-map.ts';
const AS_OF = '2026-07-10';

export const TRANSFER_EDGES: TransferEdge[] = [
  // Axis EDGE (Magnus / Reserve) -> Singapore KrisFlyer, 5:4.
  {
    from_currency: 'axis_edge',
    to_programme: 'singapore',
    ratio_from: 5,
    ratio_to: 4,
    min_transfer: null,
    duration_days_min: null,
    duration_days_max: null,
    bonus_note: null,
    state: 'unverified',
    source: SRC,
    as_of: AS_OF,
    card_name_allowlist: null,
  },

  // Axis EDGE Miles (Atlas etc.) -> Singapore KrisFlyer, 1:1.
  {
    from_currency: 'axis_miles',
    to_programme: 'singapore',
    ratio_from: 1,
    ratio_to: 1,
    min_transfer: null,
    duration_days_min: null,
    duration_days_max: null,
    bonus_note: null,
    state: 'unverified',
    source: SRC,
    as_of: AS_OF,
    card_name_allowlist: null,
  },

  // HDFC reward-points -> Singapore KrisFlyer, 1:1 — Infinia + Diners Black ONLY.
  // Regalia Gold (devalued) and Diners Privilege do NOT get this ratio, so the
  // edge is card-name-allowlisted rather than applied to all HDFC reward-points.
  {
    from_currency: 'hdfc_reward_points',
    to_programme: 'singapore',
    ratio_from: 1,
    ratio_to: 1,
    min_transfer: null,
    duration_days_min: null,
    duration_days_max: null,
    bonus_note: null,
    state: 'unverified',
    source: SRC,
    as_of: AS_OF,
    card_name_allowlist: ['HDFC Infinia Metal Edition', 'HDFC Diners Club Black'],
  },

  // Axis EDGE -> Air India (Flying Returns), 1:1. Slug 'air-india' is a best-guess
  // seats.aero source (unconfirmed live), a further reason this is unverified.
  {
    from_currency: 'axis_edge',
    to_programme: 'air-india',
    ratio_from: 1,
    ratio_to: 1,
    min_transfer: null,
    duration_days_min: null,
    duration_days_max: null,
    bonus_note: null,
    state: 'unverified',
    source: SRC,
    as_of: AS_OF,
    card_name_allowlist: null,
  },

  // Amex Membership Rewards -> British Airways Avios, 1:1. Slug 'ba' unconfirmed live.
  {
    from_currency: 'amex_membership_rewards',
    to_programme: 'ba',
    ratio_from: 1,
    ratio_to: 1,
    min_transfer: null,
    duration_days_min: null,
    duration_days_max: null,
    bonus_note: null,
    state: 'unverified',
    source: SRC,
    as_of: AS_OF,
    card_name_allowlist: null,
  },
];

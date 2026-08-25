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

// Axis EDGE Rewards devaluation, EFFECTIVE 2 Apr 2026 (live-mispriced until this edit):
// the KrisFlyer transfer was re-rated 5:4 -> 5:2, and Marriott Bonvoy / Accor ALL /
// Qatar Privilege Club were dropped as Axis EDGE partners entirely. Those three were
// never nodes in this graph, so there is nothing to remove here — but the KrisFlyer
// ratio was live and wrong. No canonical issuer URL captured yet, so state stays
// 'unverified' until one is attached (then it can flip to 'verified').
const AXIS_DEVAL_ASOF = '2026-04-02';
const AXIS_DEVAL_SRC = 'axis-edge-rewards-devaluation-2026-04-02';

export const TRANSFER_EDGES: TransferEdge[] = [
  // Axis EDGE (Magnus / Reserve) -> Singapore KrisFlyer, 5:2 (devalued from 5:4,
  // effective 2 Apr 2026 — the same change dropped Marriott / Accor / Qatar, which
  // this graph never carried).
  {
    from_currency: 'axis_edge',
    to_programme: 'singapore',
    ratio_from: 5,
    ratio_to: 2,
    min_transfer: null,
    duration_days_min: null,
    duration_days_max: null,
    bonus_note: null,
    state: 'unverified',
    source: AXIS_DEVAL_SRC,
    as_of: AXIS_DEVAL_ASOF,
    card_name_allowlist: null,
  },

  // Axis EDGE Miles (Atlas etc.) -> Singapore KrisFlyer, 1:1.
  // FLAG 2026-08-25: 2026 trade sources report Atlas EDGE Miles transfer at 1:2
  // (tier-dependent: Olympus 1:4 / Atlas 1:2 / Horizon 1:1), so a flat 1:1 likely
  // UNDER-credits Atlas holders by half. NOT changed pending Travel Edge portal
  // confirmation (login-gated); label PROXY/INFERENCE only. Do not auto-overwrite.
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
  // FLAG 2026-08-25: ratio 1:1 is INTERNALLY INCONSISTENT with the flat 5:2 EDGE
  // Reward Points deval (eff. 2 Apr 2026) applied to axis_edge -> singapore above.
  // EDGE Reward Points transfer at one flat ratio to all partners, so this is
  // likely 5:2, not 1:1. NOT changed pending Travel Edge portal confirmation
  // (per-partner ratios are login-gated). Do not auto-overwrite.
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

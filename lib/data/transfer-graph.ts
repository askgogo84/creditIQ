// lib/data/transfer-graph.ts
// Direct card-currency -> airline-programme transfer edges used by the wallet
// redemption ladder. Every edge must carry explicit provenance and pass
// scripts/validate-transfer-graph.ts.
//
// IMPORTANT: Axis cards that earn EDGE Miles do NOT share one universal
// conversion ratio. Atlas edges therefore stay card-name allowlisted even though
// the underlying wallet currency is the common `axis_miles` node.

import type { TransferEdge } from '../transfer-ladder';

const LEGACY_SRC = 'internal-estimate:lib/transfer-map.ts';
const LEGACY_AS_OF = '2026-07-10';

const AXIS_TERMS = 'https://traveledge.axis.bank.in/travel/common/termsandcondition';
const AXIS_AS_OF = '2026-04-02';
const ATLAS_ALLOW = ['Axis Atlas'];

function atlasEdge(
  programme: string,
  ratio: [number, number],
  group: 'A' | 'B',
  tat: string,
): TransferEdge {
  return {
    from_currency: 'axis_miles',
    to_programme: programme,
    ratio_from: ratio[0],
    ratio_to: ratio[1],
    min_transfer: 500,
    // Axis publishes TAT in WORKING DAYS. We deliberately keep the numeric
    // calendar-day fields null rather than silently converting working days to
    // calendar days. The exact issuer TAT stays in bonus_note/source evidence.
    duration_days_min: null,
    duration_days_max: null,
    bonus_note:
      `Axis Atlas · official TAT ${tat}. Partner Group ${group}; annual Atlas cap is ` +
      `${group === 'A' ? '30,000' : '1,20,000'} EDGE Miles across Group ${group} partners ` +
      '(1,50,000 EDGE Miles overall per calendar year).',
    state: 'verified',
    source: AXIS_TERMS,
    as_of: AXIS_AS_OF,
    card_name_allowlist: ATLAS_ALLOW,
  };
}

export const TRANSFER_EDGES: TransferEdge[] = [
  // ── Axis Atlas EDGE Miles — issuer-published ratios effective 2 Apr 2026 ──
  // Group A
  atlasEdge('aeroplan', [1, 2], 'A', 'up to 1 working day'),
  atlasEdge('ba', [2, 1], 'A', 'up to 1 working day'),
  atlasEdge('ethiopian', [1, 2], 'A', 'up to 10 working days'),
  atlasEdge('etihad', [1, 2], 'A', 'up to 1 working day'),
  atlasEdge('finnair', [2, 1], 'A', 'up to 1 working day'),
  atlasEdge('qatar', [2, 1], 'A', 'up to 1 working day'),
  atlasEdge('singapore', [1, 2], 'A', 'up to 10 working days'),
  atlasEdge('turkish', [1, 2], 'A', 'up to 10 working days'),
  atlasEdge('united', [1, 2], 'A', 'up to 1 working day'),

  // Group B
  atlasEdge('flyingblue', [1, 2], 'B', 'up to 1 working day'),
  atlasEdge('air-india', [1, 2], 'B', 'up to 5 working days'),
  atlasEdge('qantas', [1, 2], 'B', 'up to 1 working day'),

  // ── Existing non-Atlas edges kept until their own issuer reconciliation ──
  // Axis EDGE Reward Points -> KrisFlyer, card variant not yet reconciled here.
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
    source: 'axis-edge-rewards-devaluation-2026-04-02',
    as_of: '2026-04-02',
    card_name_allowlist: null,
  },

  // HDFC reward-points -> Singapore KrisFlyer, Infinia + Diners Black only.
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
    source: LEGACY_SRC,
    as_of: LEGACY_AS_OF,
    card_name_allowlist: ['HDFC Infinia Metal Edition', 'HDFC Diners Club Black'],
  },

  // Axis EDGE Reward Points -> Air India. Kept unverified until the specific
  // card variant is reconciled against the 2026 card-by-card Axis grid.
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
    source: LEGACY_SRC,
    as_of: LEGACY_AS_OF,
    card_name_allowlist: null,
  },

  // Amex Membership Rewards -> British Airways Avios, legacy estimate only.
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
    source: LEGACY_SRC,
    as_of: LEGACY_AS_OF,
    card_name_allowlist: null,
  },
];

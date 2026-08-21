// lib/data/point-values.ts
// Per-point rupee VALUE by redemption channel — v1 seed, HDFC only.
//
// Same discipline as lib/data/transfer-graph.ts: a build-gated TS constant, every
// figure carrying its own source + asOf + state, integrity enforced by
// scripts/validate-point-values.ts (npm run check:point-values) — a comment is not
// a gate.
//
// SHAPE — PER CHANNEL, floor/ceiling DERIVED (never stored):
//   A card holds a LIST of redemption channels (cashback, catalogue, SmartBuy
//   travel, transfer-to-partner), each with its own value + provenance. The floor
//   and ceiling are min()/max() over the channels — see pointValueFloorPaise() /
//   pointValueCeilingPaise(). Storing a floor/ceiling pair would flatten detail we
//   already hold (Infinia carries cashback 0.30 AND catalogue 0.50) and miss the
//   top channel (SmartBuy travel 1.00).
//
// MONEY IS INTEGER PAISE. Rs 1.00 = 100, Rs 0.50 = 50, Rs 0.30 = 30. Never a float
// rupee — the gate rejects a non-integer paise value (money-as-integer discipline).
//
// PROVENANCE (honest, per the moat):
//   'issuer-published'  — HDFC's OWN figure, sourced to a real issuer DEEP LINK. The
//                         SmartBuy Savings Calculator
//                         (https://offers.reward360.in/v1/savings_calculator) returns
//                         a rupee figure alongside points; rupees / points is the
//                         issuer's per-point value, and its disclaimer states the
//                         figure is "taken at the maximum redemption value for each
//                         card" — so smartbuy-travel is a CEILING. Green-eligible
//                         (verified tier). NB: the ~Rs 0.30/pt cashback rate is NOT
//                         issuer-published — the calculator returns the ceiling, not
//                         the cashback rate, and no HDFC page has been confirmed for
//                         it — so it is carried as 'internal-estimate' below.
//   'internal-estimate' — our own prior figure (lib/data/seed-cards.ts), no issuer
//                         confirmation. Neutral grey, never green. (cf. transfer-graph.)
//                         Includes the widely-reported-but-unconfirmed ~Rs 0.30 cashback rate.
//   'disputed'          — sources conflict.
//   'none'              — PROVABLY ABSENT, a sourced fact (a cashback card carries no
//                         points currency; a card with no issuer-grade transfer
//                         programme). A DIFFERENT state from 'unknown'.
//   'unknown'           — we hold no rupee value. e.g. a 1:1 transfer ratio is known
//                         (transfer-graph) but its per-point RUPEE value is a partner
//                         sweet-spot, not an HDFC-published number — not asserted here.
//
// ISSUER-CEILING GUARD (gate check): no channel's value may exceed the issuer's own
// published maximum for that card. seed-cards estimates KrisFlyer/Marriott at
// Rs 1.30-1.80/pt, ABOVE HDFC's Rs 1.00 max — so those are carried as an 'unknown'
// transfer-partner channel (ratio only), never as a per-point value that would
// over-claim past the issuer's own ceiling.

export type PointValueState =
  | 'issuer-published'
  | 'internal-estimate'
  | 'disputed'
  | 'none'
  | 'unknown';

// A value-bearing state MUST carry an integer-paise value; 'none'/'unknown' MUST NOT.
export const VALUE_BEARING_STATES: ReadonlySet<PointValueState> = new Set([
  'issuer-published',
  'internal-estimate',
  'disputed',
]);

export type RedemptionChannelKind =
  | 'cashback'
  | 'catalogue'
  | 'smartbuy-travel'
  | 'transfer-partner';

export interface RedemptionChannel {
  kind: RedemptionChannelKind;
  value_paise: number | null; // integer paise; null iff state is 'none' or 'unknown'
  state: PointValueState;
  source: string;
  as_of: string; // ISO yyyy-mm-dd
  note?: string;
}

export interface CardPointValue {
  card: string;      // key; matches SEED_CARDS slug where one exists
  card_name: string;
  issuer: string;
  // The points currency this card accrues. null = cashback card with NO transferable
  // points currency — an explicit sourced fact (currency_state 'none'), NOT 'unknown'.
  points_currency: string | null;
  currency_state: PointValueState;
  currency_source: string;
  currency_as_of: string;
  channels: RedemptionChannel[];
}

// ── sources ──────────────────────────────────────────────────────────────────
const SMARTBUY = 'https://offers.reward360.in/v1/savings_calculator';
const SMARTBUY_ASOF = '2026-08-20'; // capture date of the 61-row SmartBuy sweep (zero variance)
const SEED = 'internal-estimate:lib/data/seed-cards.ts';
const SEED_ASOF = '2026-08-20';
const XFER = 'internal-estimate:lib/data/transfer-graph.ts';
const XFER_ASOF = '2026-07-10'; // transfer-graph's own asOf

// ── channel factories (keep the card list DRY + consistent) ──────────────────

// HDFC reward-point cashback (points -> statement credit). WIDELY REPORTED at
// ~Rs 0.30/pt but NOT confirmed against an HDFC page, and NOT what the SmartBuy
// calculator returns (it returns the ceiling). So this is an INTERNAL ESTIMATE,
// never issuer-published — and it is NOT propagated onto cards where seed-cards has
// no such number; those simply carry no cashback channel (see the four Metal/base rows).
function cashbackEstimate(paise: number, seedRef: string): RedemptionChannel {
  return {
    kind: 'cashback', value_paise: paise, state: 'internal-estimate', source: SEED, as_of: SEED_ASOF,
    note: `${seedRef} Widely-reported HDFC reward-point cashback redemption rate, NOT confirmed against an HDFC page and NOT returned by the SmartBuy calculator (which gives the ceiling, not the cashback rate).`,
  };
}

// SmartBuy travel redemption — the issuer MAX ("maximum redemption value for each
// card", per the calculator disclaimer). A CEILING, not an expected value.
function smartbuyTravel(paise: number): RedemptionChannel {
  return {
    kind: 'smartbuy-travel', value_paise: paise, state: 'issuer-published', source: SMARTBUY, as_of: SMARTBUY_ASOF,
    note: 'SmartBuy travel redemption — issuer max per the calculator disclaimer ("taken at the maximum redemption value for each card"); a ceiling, not an expected value.',
  };
}

// Catalogue / voucher redemption — our own prior figure from seed-cards.
function catalogue(paise: number, note: string): RedemptionChannel {
  return { kind: 'catalogue', value_paise: paise, state: 'internal-estimate', source: SEED, as_of: SEED_ASOF, note };
}

// Card HAS a transfer programme (ratio in transfer-graph) but its per-point RUPEE
// value is a partner sweet-spot, not an HDFC-published number, and would exceed the
// issuer ceiling — so no value is asserted here.
function transferPartnerUnknown(note: string): RedemptionChannel {
  return { kind: 'transfer-partner', value_paise: null, state: 'unknown', source: XFER, as_of: XFER_ASOF, note };
}

// Card provably has NO issuer-grade transfer programme — an explicit sourced fact,
// not an omitted/empty entry.
function transferPartnerNone(): RedemptionChannel {
  return {
    kind: 'transfer-partner', value_paise: null, state: 'none', source: XFER, as_of: XFER_ASOF,
    note: 'No issuer-grade (1:1) transfer programme — excluded from the HDFC reward-points transfer allowlist (transfer-graph card_name_allowlist restricts the KrisFlyer edge to Infinia Metal / Diners Black). Not "unknown": affirmatively absent at issuer-grade.',
  };
}

// A cashback card: no transferable points currency at all (SmartBuy returns no
// points row). The absence is carried at CARD level (currency_state 'none'); the
// empty channels list below is correct, not an omission.
function cashbackCard(card: string, card_name: string): CardPointValue {
  return {
    card, card_name, issuer: 'HDFC',
    points_currency: null,
    currency_state: 'none',
    currency_source: SMARTBUY,
    currency_as_of: SMARTBUY_ASOF,
    channels: [],
  };
}

// ── the table ────────────────────────────────────────────────────────────────
export const CARD_POINT_VALUES: CardPointValue[] = [
  // Rs 1.00 issuer max ─────────────────────────────────────────────────────────
  {
    card: 'hdfc-infinia', card_name: 'HDFC Infinia', issuer: 'HDFC',
    points_currency: 'hdfc_reward_points', currency_state: 'issuer-published',
    currency_source: SMARTBUY, currency_as_of: SMARTBUY_ASOF,
    channels: [
      cashbackEstimate(30, 'seed-cards line 43.'),
      catalogue(50, 'HDFC Rewards Catalog (seed-cards line 44).'),
      smartbuyTravel(100),
      transferPartnerUnknown('1:1 to Singapore KrisFlyer / Marriott Bonvoy — ratio in transfer-graph. seed-cards estimates Rs 1.30-1.80/pt at sweet spots, which EXCEEDS HDFC\'s own Rs 1.00 max, so no per-point rupee value is asserted here.'),
    ],
  },
  {
    // Identical to hdfc-infinia across all six SmartBuy categories in the sweep —
    // a catalogue-collapse candidate (see docs/catalogue-inclusion-and-verification-spec.md
    // dated note). Kept as a distinct row here for source fidelity until the merge is approved.
    card: 'hdfc-infinia-metal', card_name: 'HDFC Infinia Metal Edition', issuer: 'HDFC',
    points_currency: 'hdfc_reward_points', currency_state: 'issuer-published',
    currency_source: SMARTBUY, currency_as_of: SMARTBUY_ASOF,
    // No cashback channel: seed-cards has no entry for Infinia Metal, so we do NOT
    // propagate Infinia's reported Rs 0.30 onto it. The sweep proved the two identical
    // on the six EARN categories, not on the cashback REDEMPTION rate.
    channels: [
      catalogue(50, 'HDFC Rewards Catalog (same as Infinia; seed-cards line 44).'),
      smartbuyTravel(100),
      transferPartnerUnknown('1:1 to Singapore KrisFlyer / Marriott Bonvoy — on the transfer-graph allowlist. Rupee value not asserted (seed sweet-spot estimates exceed the Rs 1.00 issuer max).'),
    ],
  },
  {
    card: 'hdfc-diners-black', card_name: 'HDFC Diners Club Black', issuer: 'HDFC',
    points_currency: 'hdfc_reward_points', currency_state: 'issuer-published',
    currency_source: SMARTBUY, currency_as_of: SMARTBUY_ASOF,
    channels: [
      cashbackEstimate(30, 'seed-cards line 659.'),
      smartbuyTravel(100),
      transferPartnerUnknown('1:1 to Singapore KrisFlyer / Marriott Bonvoy — on the transfer-graph allowlist. Rupee value not asserted (seed sweet-spot estimates Rs 1.30-1.80/pt exceed the Rs 1.00 issuer max).'),
    ],
  },
  {
    // Distinct product from hdfc-diners-black: differs in all six SmartBuy earn
    // categories, in BOTH directions (see catalogue-inclusion dated note) — do NOT
    // collapse. The per-point VALUES coincide at the Rs 1.00 issuer max; value == earn is not implied.
    card: 'hdfc-diners-black-metal', card_name: 'HDFC Diners Club Black Metal Edition', issuer: 'HDFC',
    points_currency: 'hdfc_reward_points', currency_state: 'issuer-published',
    currency_source: SMARTBUY, currency_as_of: SMARTBUY_ASOF,
    // No cashback channel: distinct product from Diners Black with no seed cashback
    // entry — not propagating another card's Rs 0.30 estimate onto it.
    channels: [
      smartbuyTravel(100),
      transferPartnerUnknown('1:1 to Singapore KrisFlyer / Marriott Bonvoy. Rupee value not asserted (seed sweet-spot estimates exceed the Rs 1.00 issuer max).'),
    ],
  },

  // Rs 0.50 issuer max ─────────────────────────────────────────────────────────
  {
    card: 'hdfc-regalia', card_name: 'HDFC Regalia', issuer: 'HDFC',
    points_currency: 'hdfc_reward_points', currency_state: 'issuer-published',
    currency_source: SMARTBUY, currency_as_of: SMARTBUY_ASOF,
    // No cashback channel: no seed cashback entry for this card — not propagating
    // another card's Rs 0.30 estimate. Its only value we hold is the issuer ceiling.
    channels: [
      smartbuyTravel(50),
      transferPartnerNone(),
    ],
  },
  {
    card: 'hdfc-regalia-gold', card_name: 'HDFC Regalia Gold', issuer: 'HDFC',
    points_currency: 'hdfc_reward_points', currency_state: 'issuer-published',
    currency_source: SMARTBUY, currency_as_of: SMARTBUY_ASOF,
    channels: [
      // seed-cards carries cashback 0.25 for this card — kept as its own internal
      // estimate. We do NOT overwrite it with the reported 0.30 (an estimate is not
      // improved by swapping in another estimate).
      cashbackEstimate(25, 'seed-cards line 388.'),
      catalogue(50, 'Taj IHCL voucher (seed-cards line 387).'),
      smartbuyTravel(50),
      transferPartnerNone(),
    ],
  },
  {
    card: 'hdfc-diners-privilege', card_name: 'HDFC Diners Club Privilege', issuer: 'HDFC',
    points_currency: 'hdfc_reward_points', currency_state: 'issuer-published',
    currency_source: SMARTBUY, currency_as_of: SMARTBUY_ASOF,
    // No cashback channel: no seed cashback entry for this card — not propagating
    // another card's Rs 0.30 estimate. Its only value we hold is the issuer ceiling.
    channels: [
      smartbuyTravel(50),
      transferPartnerNone(),
    ],
  },

  // Cashback cards — NO points currency (SmartBuy returns no points row) ────────
  cashbackCard('tata-neu-infinity-hdfc', 'HDFC Tata Neu Infinite'),
  cashbackCard('hdfc-tata-neu', 'HDFC Tata Neu'),
  cashbackCard('hdfc-other-cashback', 'HDFC Other Cashback Cards (calculator catch-all)'),
];

// ── derived accessors (floor/ceiling are computed, never stored) ─────────────

function valueBearingChannels(c: CardPointValue): (RedemptionChannel & { value_paise: number })[] {
  return c.channels.filter(
    (ch): ch is RedemptionChannel & { value_paise: number } => ch.value_paise != null,
  );
}

/** Derived FLOOR: lowest per-point value across a card's value-bearing channels (paise), or null. */
export function pointValueFloorPaise(c: CardPointValue): number | null {
  const v = valueBearingChannels(c).map((ch) => ch.value_paise);
  return v.length ? Math.min(...v) : null;
}

/** Derived CEILING: highest per-point value across a card's value-bearing channels (paise), or null. */
export function pointValueCeilingPaise(c: CardPointValue): number | null {
  const v = valueBearingChannels(c).map((ch) => ch.value_paise);
  return v.length ? Math.max(...v) : null;
}

/** The issuer's own published maximum we hold for this card (paise), or null — the gate's ceiling guard. */
export function issuerCeilingPaise(c: CardPointValue): number | null {
  const v = c.channels
    .filter((ch) => ch.state === 'issuer-published' && ch.value_paise != null)
    .map((ch) => ch.value_paise as number);
  return v.length ? Math.max(...v) : null;
}

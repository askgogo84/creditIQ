// lib/data/hotel-programmes.ts
//
// Hotel loyalty programme registry for Stay on Points.
// See docs/stay-on-points/05-Backend-Schema.md
//
// RULE: a programme with pricing_model 'dynamic' has NULL rate fields.
// That is CORRECT DATA, not missing data — the UI renders NOT_PUBLISHED from it.
// Never populate a rate for a dynamic programme.

export type PricingModel = 'fixed' | 'dynamic';
export type Provenance = 'SOURCED' | 'ESTIMATED' | 'UNKNOWN';

export interface HotelProgramme {
  id: string;
  name: string;
  short_name: string;
  pricing_model: PricingModel;

  /** Points in one redemption block. Null for dynamic programmes. */
  points_per_block: number | null;
  /** Currency value of one block. Null for dynamic programmes. */
  block_value: number | null;
  block_currency: 'EUR' | 'USD' | null;

  /**
   * Smallest redeemable amount, and the step above it.
   * Accor: 1,000 is redeemable, then multiples of 2,000 only.
   * The engine MUST floor to these — a value the user cannot actually
   * redeem is the same class of error as an invented rate.
   */
  min_redemption_points: number | null;
  redemption_increment: number | null;

  /** What the fixed rate actually covers. Other redemption types differ. */
  fixed_rate_applies_to: string | null;

  source_url: string | null;
  as_of: string | null;
  provenance: Provenance;
  notes?: string;
}

export const HOTEL_PROGRAMMES: HotelProgramme[] = [
  {
    id: 'accor-all',
    name: 'ALL — Accor Live Limitless',
    short_name: 'Accor',
    pricing_model: 'fixed',

    // VERIFIED 2026-08-28 against Accor's own terms page (below):
    // "2,000 ALL Reward points equal EUR 40, which can be used towards an
    //  Accor hotel stay."
    points_per_block: 2000,
    block_value: 40,
    block_currency: 'EUR',

    // VERIFIED: 1,000 points is redeemable; above that, increments of 2,000
    // only. Engine floors to this — do not compute arbitrary point amounts.
    min_redemption_points: 1000,
    redemption_increment: 2000,

    // VERIFIED: the fixed EUR0.02/point rate applies to HOTEL STAYS (room
    // rate and on-property incidentals). Other redemption types — gift cards,
    // some experiences — are worth LESS per point. v1 scopes to stays only.
    fixed_rate_applies_to: 'hotel stays (room rate and on-property incidentals)',

    source_url:
      'https://all.accor.com/loyalty-program/partners/conditions/payrewards/index.en.shtml',
    as_of: '2026-08-28',
    provenance: 'SOURCED',
    notes:
      'Fixed euro-denominated rate, so the INR value moves entirely with EUR/INR. ' +
      'FX must be live on every calculation — never a stored constant. ' +
      'NOT YET VERIFIED: whether an India-originating member redeems at the same ' +
      'rate. Accor terms do not appear to segment by member origin and the rate ' +
      'is denominated in EUR globally, but confirm on the Indian Accor site ' +
      'before launch.',
  },

  {
    id: 'marriott-bonvoy',
    name: 'Marriott Bonvoy',
    short_name: 'Marriott',
    pricing_model: 'dynamic',
    points_per_block: null,
    block_value: null,
    block_currency: null,
    min_redemption_points: null,
    redemption_increment: null,
    fixed_rate_applies_to: null,
    source_url: null,
    as_of: null,
    provenance: 'UNKNOWN',
    notes:
      'Prices awards dynamically by property and date. No published rate exists ' +
      'to source. Renders NOT_PUBLISHED with a real cash price. Computing a ' +
      'points cost would require an availability lookup we do not have.',
  },

  {
    id: 'ihg-one',
    name: 'IHG One Rewards',
    short_name: 'IHG',
    pricing_model: 'dynamic',
    points_per_block: null,
    block_value: null,
    block_currency: null,
    min_redemption_points: null,
    redemption_increment: null,
    fixed_rate_applies_to: null,
    source_url: null,
    as_of: null,
    provenance: 'UNKNOWN',
    notes: 'Dynamic award pricing. See marriott-bonvoy note.',
  },

  {
    id: 'hyatt-wop',
    name: 'World of Hyatt',
    short_name: 'Hyatt',
    pricing_model: 'dynamic',
    points_per_block: null,
    block_value: null,
    block_currency: null,
    min_redemption_points: null,
    redemption_increment: null,
    fixed_rate_applies_to: null,
    source_url: null,
    as_of: null,
    provenance: 'UNKNOWN',
    notes:
      'Hyatt publishes a category award chart, so a fixed-rate model MAY be ' +
      'sourceable later. Left UNKNOWN until verified against Hyatt directly — ' +
      'do not populate from a blog.',
  },

  {
    id: 'hilton-honors',
    name: 'Hilton Honors',
    short_name: 'Hilton',
    pricing_model: 'dynamic',
    points_per_block: null,
    block_value: null,
    block_currency: null,
    min_redemption_points: null,
    redemption_increment: null,
    fixed_rate_applies_to: null,
    source_url: null,
    as_of: null,
    provenance: 'UNKNOWN',
    notes: 'Dynamic award pricing. See marriott-bonvoy note.',
  },
];

export function getProgramme(id: string): HotelProgramme | undefined {
  return HOTEL_PROGRAMMES.find((p) => p.id === id);
}

export function isComputable(id: string): boolean {
  const p = getProgramme(id);
  return !!p && p.pricing_model === 'fixed' && p.points_per_block !== null;
}

// lib/data/hotel-seed.ts
//
// Seeded hotel dataset for Stay on Points v1.
// See docs/stay-on-points/05-Backend-Schema.md
//
// RULES — these are the product, not bureaucracy:
// 1. NO ENTRY WITHOUT cash_captured_at. A rate with no timestamp cannot be
//    shown to a user. The build gate enforces this.
// 2. NEVER invent a cash rate. If you cannot capture it, delete the entry.
// 3. points_per_night is null unless the programme's pricing_model is 'fixed'.
// 4. booking_url points at the PROGRAMME'S OWN SITE. Accor points require
//    direct booking on all.accor.com.
//
// ── CAPTURE BASIS, 31 Aug 2026 ────────────────────────────────────────────
// Every Accor rate below was read directly from all.accor.com search results
// for Bangkok, check-in 12 Oct 2026, 3 nights, 2 adults, 1 room, signed in as
// an ALL Classic member.
//
// FOUR THINGS ABOUT THESE RATES THAT MUST NOT BE LOST:
//
// (a) They are MEMBER rates. Accor showed a public rate ~5% higher alongside.
//     Both are stored — a signed-out user cannot get the member rate.
// (b) They are "starting from" prices — cheapest room on those dates, not a
//     specific room type. Accor says so explicitly.
// (c) TAXES ARE NOT INCLUDED. Accor lists them separately and they are
//     material (~18%). Stored separately so the UI can be honest.
// (d) Accor prices are EUR-REFERENCED and converted to INR at their partner
//     DEVISEA's daily rate — Accor's own terms name the euro as the reference
//     currency and call the conversion "for reference only". Direct
//     confirmation of this product's thesis: the rupee value of an Accor stay
//     moves with EUR/INR, so FX must be live, never stored.
//
// Per-night figures are the captured 3-night total divided by 3. The total
// and the basis are recorded in cash_source so nothing is lost.

export interface SeededHotel {
  id: string;
  name: string;
  programme_id: string;
  city: string;
  country: string;
  area: string;
  star_rating: number;
  room_type: string;

  /** Member rate per night, INR, taxes excluded. Null = excluded at runtime. */
  cash_per_night_inr: number | null;
  /** Public (non-member) rate per night, INR, taxes excluded. */
  public_cash_per_night_inr: number | null;
  /** Taxes for the whole captured stay, INR. Accor quotes these separately. */
  cash_taxes_inr: number | null;
  /** ISO date. REQUIRED alongside a rate. Drives the freshness label. */
  cash_captured_at: string | null;
  /** Where and how the rate was captured. Shown to the user. */
  cash_source: string | null;

  /** Null for dynamic programmes. */
  points_per_night: number | null;
  points_source: 'programme-published' | null;

  booking_url: string;
  photo_ref: string | null;
}

const CAPTURED = '2026-08-31';
const BASIS =
  'all.accor.com search, Bangkok, 12 Oct 2026, 3 nights, 2 adults, ALL Classic member rate, taxes excluded';

export const SEEDED_HOTELS: SeededHotel[] = [
  {
    id: 'sofitel-bangkok-sukhumvit',
    name: 'Sofitel Bangkok Sukhumvit',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Sukhumvit',
    star_rating: 5, room_type: 'Starting-from room',
    cash_per_night_inr: 37732, public_cash_per_night_inr: 39718,
    cash_taxes_inr: 20036, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.1,13,196 member / Rs.1,19,154 public',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/3829/index.en.shtml', photo_ref: null,
  },
  {
    id: 'so-bangkok',
    name: 'SO/ Bangkok',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Sathorn',
    star_rating: 5, room_type: 'Starting-from room',
    cash_per_night_inr: 22687, public_cash_per_night_inr: null,
    cash_taxes_inr: 12047, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.68,061; no separate member rate shown',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/6835/index.en.shtml', photo_ref: null,
  },
  {
    id: 'vie-hotel-bangkok-mgallery',
    name: 'VIE Hotel Bangkok — MGallery Collection',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Ratchathewi',
    star_rating: 5, room_type: 'Starting-from room',
    cash_per_night_inr: 14916, public_cash_per_night_inr: 15701,
    cash_taxes_inr: 7921, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.44,748 member / Rs.47,103 public',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/6929/index.en.shtml', photo_ref: null,
  },
  {
    id: 'movenpick-bdms-wellness-bangkok',
    name: 'Movenpick BDMS Wellness Resort Bangkok',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Lumphini',
    star_rating: 5, room_type: 'Starting-from room',
    cash_per_night_inr: 12546, public_cash_per_night_inr: null,
    cash_taxes_inr: 6663, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.37,639; no separate member rate shown',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/9748/index.en.shtml', photo_ref: null,
  },
  {
    id: 'novotel-bangkok-siam-square',
    name: 'Novotel Bangkok on Siam Square',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Siam',
    star_rating: 4, room_type: 'Starting-from room',
    cash_per_night_inr: 12480, public_cash_per_night_inr: 13137,
    cash_taxes_inr: 6627, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.37,441 member / Rs.39,411 public',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/1031/index.en.shtml', photo_ref: null,
  },
  {
    id: 'mercure-bangkok-siam',
    name: 'Mercure Bangkok Siam',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Siam',
    star_rating: 4, room_type: 'Starting-from room',
    cash_per_night_inr: 11166, public_cash_per_night_inr: 11754,
    cash_taxes_inr: 5930, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.33,499 member / Rs.35,263 public',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/7017/index.en.shtml', photo_ref: null,
  },
  {
    id: 'movenpick-sukhumvit-15-bangkok',
    name: 'Movenpick Hotel Sukhumvit 15 Bangkok',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Sukhumvit',
    star_rating: 5, room_type: 'Starting-from room',
    cash_per_night_inr: 10920, public_cash_per_night_inr: 11495,
    cash_taxes_inr: 5799, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.32,761 member / Rs.34,485 public',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/8355/index.en.shtml', photo_ref: null,
  },
  {
    id: 'novotel-bangkok-platinum',
    name: 'Novotel Bangkok Platinum Pratunam',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Pratunam',
    star_rating: 4, room_type: 'Starting-from room',
    cash_per_night_inr: 10314, public_cash_per_night_inr: 10856,
    cash_taxes_inr: 5477, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.30,941 member / Rs.32,569 public',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/6404/index.en.shtml', photo_ref: null,
  },
  {
    id: 'grand-mercure-bangkok-asoke',
    name: 'Grand Mercure Bangkok Asoke Residence',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Asoke',
    star_rating: 5, room_type: 'Starting-from room',
    cash_per_night_inr: 9336, public_cash_per_night_inr: 9828,
    cash_taxes_inr: 4958, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.28,009 member / Rs.29,483 public',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/8422/index.en.shtml', photo_ref: null,
  },
  {
    id: 'pullman-bangkok-king-power',
    name: 'Pullman Bangkok King Power',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Ratchathewi',
    star_rating: 5, room_type: 'Starting-from room',
    cash_per_night_inr: 9314, public_cash_per_night_inr: 9804,
    cash_taxes_inr: 4946, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.27,941 member / Rs.29,411 public',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/5834/index.en.shtml', photo_ref: null,
  },
  {
    id: 'mercure-bangkok-sukhumvit-11',
    name: 'Mercure Bangkok Sukhumvit 11',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Sukhumvit',
    star_rating: 4, room_type: 'Starting-from room',
    cash_per_night_inr: 8594, public_cash_per_night_inr: 9046,
    cash_taxes_inr: 4564, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.25,782 member / Rs.27,138 public',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/8123/index.en.shtml', photo_ref: null,
  },
  {
    id: 'pullman-bangkok-hotel-g',
    name: 'Pullman Bangkok Hotel G',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Silom',
    star_rating: 5, room_type: 'Starting-from room',
    cash_per_night_inr: 8491, public_cash_per_night_inr: 8938,
    cash_taxes_inr: 4509, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.25,474 member / Rs.26,814 public',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/6753/index.en.shtml', photo_ref: null,
  },
  {
    id: 'novotel-bangkok-sukhumvit-4',
    name: 'Novotel Bangkok Sukhumvit 4',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Sukhumvit',
    star_rating: 4, room_type: 'Starting-from room',
    cash_per_night_inr: 8095, public_cash_per_night_inr: 8521,
    cash_taxes_inr: 4299, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.24,285 member / Rs.25,563 public',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/9522/index.en.shtml', photo_ref: null,
  },
  {
    id: 'ibis-bangkok-siam',
    name: 'ibis Bangkok Siam',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Siam',
    star_rating: 3, room_type: 'Starting-from room',
    cash_per_night_inr: 7736, public_cash_per_night_inr: 8143,
    cash_taxes_inr: 4108, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.23,209 member / Rs.24,430 public',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/7148/index.en.shtml', photo_ref: null,
  },
  {
    id: 'mercure-bangkok-makkasan',
    name: 'Mercure Bangkok Makkasan',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Makkasan',
    star_rating: 4, room_type: 'Starting-from room',
    cash_per_night_inr: 7392, public_cash_per_night_inr: 7781,
    cash_taxes_inr: 3926, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.22,177 member / Rs.23,344 public',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/9011/index.en.shtml', photo_ref: null,
  },
  {
    id: 'mercure-bangkok-surawong',
    name: 'Mercure Bangkok Surawong',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Surawong',
    star_rating: 4, room_type: 'Starting-from room',
    cash_per_night_inr: 6482, public_cash_per_night_inr: null,
    cash_taxes_inr: 3442, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.19,446; no separate member rate shown',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/7178/index.en.shtml', photo_ref: null,
  },
  {
    id: 'ibis-styles-bangkok-silom',
    name: 'ibis Styles Bangkok Silom',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Silom',
    star_rating: 3.5, room_type: 'Starting-from room',
    cash_per_night_inr: 6050, public_cash_per_night_inr: null,
    cash_taxes_inr: 3213, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.18,150; no separate member rate shown',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/9184/index.en.shtml', photo_ref: null,
  },
  {
    id: 'ibis-styles-bangkok-sukhumvit-4',
    name: 'ibis Styles Bangkok Sukhumvit 4',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Sukhumvit',
    star_rating: 3, room_type: 'Starting-from room',
    cash_per_night_inr: 5040, public_cash_per_night_inr: 5305,
    cash_taxes_inr: 2677, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.15,120 member / Rs.15,916 public',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/9523/index.en.shtml', photo_ref: null,
  },
  {
    id: 'ibis-bangkok-sathorn',
    name: 'ibis Bangkok Sathorn',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Sathorn',
    star_rating: 3, room_type: 'Starting-from room',
    cash_per_night_inr: 3844, public_cash_per_night_inr: 4046,
    cash_taxes_inr: 2041, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.11,531 member / Rs.12,137 public',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/7175/index.en.shtml', photo_ref: null,
  },
  {
    id: 'ibis-bangkok-sukhumvit-4',
    name: 'ibis Bangkok Sukhumvit 4',
    programme_id: 'accor-all',
    city: 'Bangkok', country: 'Thailand', area: 'Sukhumvit',
    star_rating: 3, room_type: 'Starting-from room',
    cash_per_night_inr: 3481, public_cash_per_night_inr: 3665,
    cash_taxes_inr: 1849, cash_captured_at: CAPTURED,
    cash_source: BASIS + ' — 3-night total Rs.10,444 member / Rs.10,994 public',
    points_per_night: null, points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/9524/index.en.shtml', photo_ref: null,
  },

  // ─── Dynamic programmes · rates not yet captured ──────────────────────
  // points_per_night null BY DESIGN — these render NOT_PUBLISHED.
  // Excluded at runtime until a cash rate is captured.
  {
    id: 'westin-grande-sukhumvit',
    name: 'The Westin Grande Sukhumvit',
    programme_id: 'marriott-bonvoy',
    city: 'Bangkok', country: 'Thailand', area: 'Asoke',
    star_rating: 5, room_type: 'Deluxe',
    cash_per_night_inr: null, public_cash_per_night_inr: null,
    cash_taxes_inr: null, cash_captured_at: null, cash_source: null,
    points_per_night: null, points_source: null,
    booking_url: 'https://www.marriott.com/hotels/travel/bkkwi-the-westin-grande-sukhumvit-bangkok/',
    photo_ref: null,
  },
  {
    id: 'grand-hyatt-erawan-bangkok',
    name: 'Grand Hyatt Erawan Bangkok',
    programme_id: 'hyatt-wop',
    city: 'Bangkok', country: 'Thailand', area: 'Ratchaprasong',
    star_rating: 5, room_type: 'Grand King',
    cash_per_night_inr: null, public_cash_per_night_inr: null,
    cash_taxes_inr: null, cash_captured_at: null, cash_source: null,
    points_per_night: null, points_source: null,
    booking_url: 'https://www.hyatt.com/grand-hyatt/en-US/bkkgh-grand-hyatt-erawan-bangkok',
    photo_ref: null,
  },
];

/** Only hotels with a captured rate are usable. Everything else is excluded. */
export function usableHotels(): SeededHotel[] {
  return SEEDED_HOTELS.filter(
    (h) => h.cash_per_night_inr !== null && h.cash_captured_at !== null,
  );
}

export function hotelsInCity(city: string): SeededHotel[] {
  return usableHotels().filter((h) => h.city.toLowerCase() === city.toLowerCase());
}

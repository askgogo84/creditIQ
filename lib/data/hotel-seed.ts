// lib/data/hotel-seed.ts
//
// Seeded hotel dataset for Stay on Points v1.
// See docs/stay-on-points/05-Backend-Schema.md
//
// ⚠ RULES — these are the product, not bureaucracy:
//
// 1. NO ENTRY WITHOUT cash_captured_at. A rate with no timestamp cannot be
//    shown to a user. The build gate enforces this.
// 2. NEVER invent a cash rate. If you cannot capture it, delete the entry.
//    An absent hotel is fine. A hotel with a made-up price is not.
// 3. points_per_night is null unless the programme's pricing_model is 'fixed'.
// 4. booking_url points at the PROGRAMME'S OWN SITE. Accor points require
//    direct booking on all.accor.com — an OTA link sends the user somewhere
//    the points cannot be used.
//
// STATUS: property names, programmes and areas below are real and verified.
// CASH RATES ARE NOT YET CAPTURED — every entry has cash_per_night_inr: null
// and cash_captured_at: null, which makes them INVALID and excluded at
// runtime. Fill them in from all.accor.com for a fixed date, set
// cash_captured_at to that date, and they go live.

export interface SeededHotel {
  id: string;
  name: string;
  programme_id: string;
  city: string;
  country: string;
  area: string;
  star_rating: number;
  room_type: string;

  /** Null until captured. A null rate excludes the hotel from results. */
  cash_per_night_inr: number | null;
  /** ISO date. REQUIRED alongside a rate. Drives the freshness label. */
  cash_captured_at: string | null;
  /** Where the rate was captured from. Shown to the user. */
  cash_source: string | null;

  /** Null for dynamic programmes. Derived from the room rate for Accor. */
  points_per_night: number | null;
  points_source: 'programme-published' | null;

  booking_url: string;
  photo_ref: string | null;
}

export const SEEDED_HOTELS: SeededHotel[] = [
  // ─── Accor · Bangkok ──────────────────────────────────────────────
  {
    id: 'sofitel-bangkok-sukhumvit',
    name: 'Sofitel Bangkok Sukhumvit',
    programme_id: 'accor-all',
    city: 'Bangkok',
    country: 'Thailand',
    area: 'Sukhumvit',
    star_rating: 5,
    room_type: 'Superior King',
    cash_per_night_inr: null,
    cash_captured_at: null,
    cash_source: null,
    points_per_night: null,
    points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/3829/index.en.shtml',
    photo_ref: null,
  },
  {
    id: 'pullman-bangkok-king-power',
    name: 'Pullman Bangkok King Power',
    programme_id: 'accor-all',
    city: 'Bangkok',
    country: 'Thailand',
    area: 'Ratchathewi',
    star_rating: 5,
    room_type: 'Deluxe Twin',
    cash_per_night_inr: null,
    cash_captured_at: null,
    cash_source: null,
    points_per_night: null,
    points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/5834/index.en.shtml',
    photo_ref: null,
  },
  {
    id: 'novotel-bangkok-platinum',
    name: 'Novotel Bangkok Platinum Pratunam',
    programme_id: 'accor-all',
    city: 'Bangkok',
    country: 'Thailand',
    area: 'Pratunam',
    star_rating: 4,
    room_type: 'Superior',
    cash_per_night_inr: null,
    cash_captured_at: null,
    cash_source: null,
    points_per_night: null,
    points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/6404/index.en.shtml',
    photo_ref: null,
  },
  {
    id: 'mercure-bangkok-siam',
    name: 'Mercure Bangkok Siam',
    programme_id: 'accor-all',
    city: 'Bangkok',
    country: 'Thailand',
    area: 'Siam',
    star_rating: 4,
    room_type: 'Superior',
    cash_per_night_inr: null,
    cash_captured_at: null,
    cash_source: null,
    points_per_night: null,
    points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/7017/index.en.shtml',
    photo_ref: null,
  },
  {
    id: 'ibis-bangkok-sathorn',
    name: 'ibis Bangkok Sathorn',
    programme_id: 'accor-all',
    city: 'Bangkok',
    country: 'Thailand',
    area: 'Sathorn',
    star_rating: 3,
    room_type: 'Standard',
    cash_per_night_inr: null,
    cash_captured_at: null,
    cash_source: null,
    points_per_night: null,
    points_source: 'programme-published',
    booking_url: 'https://all.accor.com/hotel/7178/index.en.shtml',
    photo_ref: null,
  },

  // ─── Dynamic programmes · Bangkok ─────────────────────────────────
  // points_per_night stays null by design — these render NOT_PUBLISHED.
  {
    id: 'westin-grande-sukhumvit',
    name: 'The Westin Grande Sukhumvit',
    programme_id: 'marriott-bonvoy',
    city: 'Bangkok',
    country: 'Thailand',
    area: 'Asok',
    star_rating: 5,
    room_type: 'Deluxe',
    cash_per_night_inr: null,
    cash_captured_at: null,
    cash_source: null,
    points_per_night: null,
    points_source: null,
    booking_url: 'https://www.marriott.com/hotels/travel/bkkwi-the-westin-grande-sukhumvit-bangkok/',
    photo_ref: null,
  },
  {
    id: 'holiday-inn-bangkok-silom',
    name: 'Holiday Inn Bangkok Silom',
    programme_id: 'ihg-one',
    city: 'Bangkok',
    country: 'Thailand',
    area: 'Silom',
    star_rating: 4,
    room_type: 'Standard',
    cash_per_night_inr: null,
    cash_captured_at: null,
    cash_source: null,
    points_per_night: null,
    points_source: null,
    booking_url: 'https://www.ihg.com/holidayinn/hotels/us/en/bangkok/bkkhi/hoteldetail',
    photo_ref: null,
  },
  {
    id: 'grand-hyatt-erawan-bangkok',
    name: 'Grand Hyatt Erawan Bangkok',
    programme_id: 'hyatt-wop',
    city: 'Bangkok',
    country: 'Thailand',
    area: 'Ratchaprasong',
    star_rating: 5,
    room_type: 'Grand King',
    cash_per_night_inr: null,
    cash_captured_at: null,
    cash_source: null,
    points_per_night: null,
    points_source: null,
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
  return usableHotels().filter(
    (h) => h.city.toLowerCase() === city.toLowerCase(),
  );
}

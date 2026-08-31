// lib/hotels/providers/photos.ts
//
// Hotel photography.
//
// v1 renders deterministic gradient placeholders. NOT because photos are hard,
// but because we do not yet hold the right to display anyone's. Hotlinking a
// hotel group's CDN serves images at their bandwidth cost, generally breaches
// their terms, and can be blocked without warning — leaving the page
// imageless. It also sits badly against a product whose whole pitch is being
// above-board about where its data comes from.
//
// The attribution label ships from day one so the layout never changes when a
// licensed provider lands.
//
// Route to a real provider, cheapest first:
//   1. Booking.com affiliate feed via CJ — carries a display licence, free,
//      already in onboarding. OPEN QUESTION: do the terms permit showing their
//      images beside a POINTS verdict rather than only their cash rate?
//   2. Google Places Photos — pay per request, caching-duration limits.
//   3. Direct Accor / Marriott / IHG content programme — slow, free, solid.
// Once rights exist by any route: SELF-HOST. Do not depend on someone's CDN.

export interface HotelPhoto {
  url: string | null;
  /** Rendered on the image itself. Never omit. */
  attribution: string;
  width: number;
  height: number;
  /** When false the UI draws its own placeholder from `gradient`. */
  is_real: boolean;
  gradient?: [string, string];
}

export interface PhotoProvider {
  readonly id: string;
  readonly attribution: string;
  photos(hotelId: string): Promise<HotelPhoto[]>;
}

const GRADIENTS: Array<[string, string]> = [
  ['#C8B79B', '#9C876A'],
  ['#A8B5C4', '#6E8095'],
  ['#C4A8A8', '#95706E'],
  ['#A9C0B0', '#6E8F7C'],
  ['#C3B8CE', '#8A7C99'],
];

/** Stable per hotel id, so a hotel always looks the same between renders. */
function gradientFor(hotelId: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < hotelId.length; i++) {
    hash = (hash * 31 + hotelId.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

export class PlaceholderPhotoProvider implements PhotoProvider {
  readonly id = 'placeholder';
  readonly attribution = 'Photo not licensed yet';

  async photos(hotelId: string): Promise<HotelPhoto[]> {
    return [
      {
        url: null,
        attribution: this.attribution,
        width: 800,
        height: 450,
        is_real: false,
        gradient: gradientFor(hotelId),
      },
    ];
  }
}

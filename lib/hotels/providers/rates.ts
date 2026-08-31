// lib/hotels/providers/rates.ts
//
// Hotel cash rates. v1 reads the seeded dataset captured by hand from
// all.accor.com. When a live feed lands (Booking.com via CJ, or another),
// implement HotelRateProvider and swap it in config — no component or engine
// change. That is the entire point of this interface.

import { usableHotels, hotelsInCity, type SeededHotel } from '@/lib/data/hotel-seed';

export interface RateQuery {
  city?: string;
  hotel_id?: string;
  nights: number;
}

export interface RateResult {
  hotel: SeededHotel;
  /** Per night, INR, taxes excluded. The MEMBER rate — see below. */
  cash_per_night_inr: number;
  /** Per night, INR, taxes excluded, for a non-member. May be null. */
  public_cash_per_night_inr: number | null;
  /** Taxes for the captured stay, INR. Accor quotes these separately. */
  taxes_inr: number;
  captured_at: string;
  source_id: string;
  /** false for seeded data -> the UI must label it as captured, not live. */
  is_live: boolean;
}

export interface HotelRateProvider {
  readonly id: string;
  readonly is_live: boolean;
  search(q: RateQuery): Promise<RateResult[]>;
}

/**
 * BASELINE DECISION (31 Aug 2026): the comparison uses the MEMBER rate.
 * It is what a user actually pays once signed in, ALL membership is free to
 * join, and anyone reading this page is the kind of person who would join.
 * The public rate is carried alongside so the UI can show both and be honest
 * that a signed-out visitor cannot get the member price.
 */
export class SeededRateProvider implements HotelRateProvider {
  readonly id = 'seeded-accor-bangkok-2026-08-31';
  readonly is_live = false;

  async search(q: RateQuery): Promise<RateResult[]> {
    let rows: SeededHotel[] = q.city ? hotelsInCity(q.city) : usableHotels();
    if (q.hotel_id) rows = rows.filter((h) => h.id === q.hotel_id);

    return rows.map((h) => ({
      hotel: h,
      cash_per_night_inr: h.cash_per_night_inr as number,
      public_cash_per_night_inr: h.public_cash_per_night_inr,
      taxes_inr: h.cash_taxes_inr ?? 0,
      captured_at: h.cash_captured_at as string,
      source_id: h.cash_source ?? 'unknown',
      is_live: false,
    }));
  }
}

/** Human-readable age of a captured rate, for the freshness label. */
export function rateAgeLabel(capturedAt: string, now: Date = new Date()): string {
  const days = Math.floor(
    (now.getTime() - new Date(capturedAt).getTime()) / 86_400_000,
  );
  if (days <= 0) return 'captured today';
  if (days === 1) return 'captured yesterday';
  if (days < 30) return `captured ${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? 'captured a month ago' : `captured ${months} months ago`;
}

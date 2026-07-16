// app/api/flights/fusion/route.ts
// POST /api/flights/fusion — "cash + award + your points" fusion for a route.
//
// Fuses three sources in parallel:
//   1. GET /api/flights/search  — live cash fares
//   2. seats.aero (all sources) — live award availability (via lib/seats-aero.ts)
//   3. the caller's own cards    — statement_imports + manual_cards
//
// For each cash flight we try to match an award (route is implicit — seats.aero
// is already scoped to origin->destination — so we match on date + airline), then
// for each of the user's cards we resolve its reward currency and compute how many
// card points a transfer would cost.
//
// HONESTY CONTRACT (CreditIQ moat): every redemption option ships verified:false.
//   - Unknown card  -> status:'currency-unknown', NO fabricated program/ratio.
//   - Currency that doesn't transfer to that award source -> transferable:false.
//   - Nothing here may be rendered as verified-green downstream.
// Hotels / Marriott are excluded by construction (not seats.aero flight sources,
// and the transfer map has no hotel rows).

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';
import {
  searchAwardAvailability,
  getAvailabilityTrips,
  type SeatsAeroResult,
  type SeatsAeroTrip,
} from '@/lib/seats-aero';
import {
  type CashFlight,
  type UserCard,
  type RedemptionOption,
  programLabel,
  matchAward,
  buildRedemption,
  pickBest,
  pickBestAwardOnly,
} from '@/lib/fusion-core';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

type Cabin = 'economy' | 'business' | 'first';

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SVC = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ── source fetchers ────────────────────────────────────────────────────────

async function fetchCashFlights(
  base: string,
  from: string,
  to: string,
  dateFrom: string,
  dateTo: string,
): Promise<CashFlight[]> {
  try {
    const url = new URL('/api/flights/search', base);
    url.searchParams.set('from', from);
    url.searchParams.set('to', to);
    if (dateFrom) url.searchParams.set('date_from', dateFrom);
    if (dateTo) url.searchParams.set('date_to', dateTo);
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.flights || []) as CashFlight[];
  } catch (e) {
    console.error('fusion: cash flight fetch failed', e);
    return [];
  }
}

async function fetchUserCards(userId: string): Promise<UserCard[]> {
  try {
    const sb = createClient(URL_ENV(), SVC(), { auth: { persistSession: false } });
    const [stmt, manual] = await Promise.all([
      sb.from('statement_imports')
        .select('bank, card_name, card_last4, points_balance, points_currency')
        .eq('user_id', userId),
      sb.from('manual_cards')
        .select('bank, card_name, card_last4, points_balance, points_currency')
        .eq('user_id', userId),
    ]);
    const rows = [...(stmt.data || []), ...(manual.data || [])] as UserCard[];
    // dedupe by bank + last4 + name
    const seen = new Set<string>();
    const cards: UserCard[] = [];
    for (const r of rows) {
      if (!r || !r.card_name) continue;
      const key = `${(r.bank || '').toLowerCase()}-${r.card_last4 || 'x'}-${r.card_name.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      cards.push(r);
    }
    return cards;
  } catch (e) {
    console.error('fusion: user card fetch failed', e);
    return [];
  }
}

// ── award view (rich detail attached to a flight card) ───────────────────────

// How many awards we enrich with a per-flight trips call. Each is a separate
// credit-costing seats.aero request, so we cap and log the remainder.
const ENRICH_CAP = 6;

// Stable identity for an award across cash-match dedupe + trip-detail lookup.
function awardKey(a: SeatsAeroResult): string {
  return a.id || `${a.source}|${a.date}|${a.mileageCost}`;
}

interface AwardView {
  program: string;
  mileageCost: number;
  seats: number;
  source: string;
  airlineCode: string;
  isDirect: boolean;
  date: string;
  cabin: Cabin;
  trip: {
    flightNumbers: string;
    carriers: string;
    aircraft: string;
    departsAt: string;
    arrivesAt: string;
    durationMinutes: number;
    stops: number;
    totalTaxes: number;
    taxesCurrency: string;
  } | null;
}

function buildAwardView(a: SeatsAeroResult, trip: SeatsAeroTrip | null, cabin: Cabin): AwardView {
  return {
    program: programLabel(a.source),
    mileageCost: a.mileageCost,
    seats: a.remainingSeats,
    source: a.source,
    airlineCode: a.airlines,
    isDirect: a.isDirect,
    date: a.date,
    cabin,
    trip: trip
      ? {
          flightNumbers: trip.flightNumbers,
          carriers: trip.carriers,
          aircraft: trip.aircraft,
          departsAt: trip.departsAt,
          arrivesAt: trip.arrivesAt,
          durationMinutes: trip.durationMinutes,
          stops: trip.stops,
          totalTaxes: trip.totalTaxes,
          taxesCurrency: trip.taxesCurrency,
        }
      : null,
  };
}

// ── handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  try {
    const body = await req.json().catch(() => ({}));
    const from = (body.from || '').toUpperCase().trim();
    const to = (body.to || '').toUpperCase().trim();
    const dateFrom = body.date_from || '';
    const dateTo = body.date_to || dateFrom;
    const cabin: Cabin = ['economy', 'business', 'first'].includes(body.cabin)
      ? body.cabin
      : 'economy';

    if (!from || !to) {
      return NextResponse.json({ error: 'from and to are required' }, { status: 400 });
    }

    const base = new URL(req.url).origin;

    // Parallel: cash fares + award availability (all sources) + user cards.
    const [cashFlights, awards, cards] = await Promise.all([
      fetchCashFlights(base, from, to, dateFrom, dateTo),
      searchAwardAvailability(from, to, dateFrom, dateTo, undefined, cabin),
      fetchUserCards(gate.userId),
    ]);

    // Enrich the lowest-mileage awards with per-flight trip details (flight #,
    // times, duration, exact stops). Each is a separate credit-costing seats.aero
    // call, so we cap at ENRICH_CAP and log anything left summary-only.
    const sortedAwards = [...awards].sort((a, b) => a.mileageCost - b.mileageCost);
    const toEnrich = sortedAwards.slice(0, ENRICH_CAP);
    const tripPairs = await Promise.all(
      toEnrich.map(
        async (a) => [awardKey(a), await getAvailabilityTrips(a.id, cabin)] as const,
      ),
    );
    const tripByKey = new Map<string, SeatsAeroTrip | null>(tripPairs);
    if (awards.length > ENRICH_CAP) {
      console.warn(
        `fusion: enriched ${ENRICH_CAP}/${awards.length} awards with trip details; ` +
          `${awards.length - ENRICH_CAP} shown summary-only`,
      );
    }

    // Cash-matched flights: each cash fare with its matched award (if any).
    const matchedKeys = new Set<string>();
    const cashResults = cashFlights.map((flight) => {
      const awardMatch = matchAward(flight, awards);

      if (!awardMatch) {
        // No award for this flight -> cash-only, still shown.
        return {
          ...flight,
          cashUnavailable: false,
          award: null as AwardView | null,
          redemption: [] as RedemptionOption[],
          bestOption: null as RedemptionOption | null,
        };
      }

      const key = awardKey(awardMatch);
      matchedKeys.add(key);
      const award = buildAwardView(awardMatch, tripByKey.get(key) ?? null, cabin);
      const redemption = buildRedemption(cards, awardMatch, flight.price);
      const bestOption = pickBest(redemption);

      return { ...flight, cashUnavailable: false, award, redemption, bestOption };
    });

    // AWARD-FIRST: awards with no cash match become points-only cards. When the
    // cash search returned nothing, EVERY award surfaces here instead of being
    // hidden behind "No flights found" — the awards are our core value.
    const awardOnly = awards
      .filter((a) => !matchedKeys.has(awardKey(a)))
      .map((a) => {
        const key = awardKey(a);
        const trip = tripByKey.get(key) ?? null;
        const award = buildAwardView(a, trip, cabin);
        const redemption = buildRedemption(cards, a, 0); // no cash price -> value/point stays null
        const bestOption = pickBestAwardOnly(redemption);

        return {
          id: `award-${key}`,
          price: 0,
          airline: a.airlines || trip?.carriers || '',
          from,
          to,
          departure: trip?.departsAt || a.date,
          arrival: trip?.arrivesAt || '',
          duration: trip ? Math.round(trip.durationMinutes / 60) : 0,
          stops: trip ? trip.stops : a.isDirect ? 0 : -1, // -1 = stop count unknown
          bookingLink: '',
          cashUnavailable: true,
          award,
          redemption,
          bestOption,
        };
      });

    const results = [...cashResults, ...awardOnly];

    return NextResponse.json({
      route: { from, to, date_from: dateFrom, date_to: dateTo, cabin },
      counts: {
        cashFlights: cashFlights.length,
        awards: awards.length,
        awardsEnriched: Math.min(ENRICH_CAP, awards.length),
        awardOnlyCards: awardOnly.length,
        cards: cards.length,
      },
      verifiedPolicy: 'all-estimates', // every redemption is verified:false
      flights: results,
    });
  } catch (err: any) {
    console.error('fusion error:', err?.message || err);
    return NextResponse.json({ error: 'fusion failed' }, { status: 500 });
  }
}

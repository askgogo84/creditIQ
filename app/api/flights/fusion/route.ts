// app/api/flights/fusion/route.ts
// POST /api/flights/fusion — "cash + award + your points" fusion for a route.

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
  buildCabinBests,
  pickBest,
  pickBestAwardOnly,
} from '@/lib/fusion-core';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

type Cabin = 'economy' | 'business' | 'first';

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SVC = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;

type CashFetch = {
  flights: CashFlight[];
  coverage: any | null;
  attempts: any[];
  source: string | null;
  cashCabinVerified: boolean;
};

async function fetchCashFlights(
  base: string,
  from: string,
  to: string,
  dateFrom: string,
  dateTo: string,
  cabin: Cabin,
): Promise<CashFetch> {
  try {
    const url = new URL('/api/flights/search', base);
    url.searchParams.set('from', from);
    url.searchParams.set('to', to);
    url.searchParams.set('cabin', cabin);
    if (dateFrom) url.searchParams.set('date_from', dateFrom);
    if (dateTo) url.searchParams.set('date_to', dateTo);
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
      return { flights: [], coverage: null, attempts: [], source: null, cashCabinVerified: false };
    }
    const data = await res.json();
    return {
      flights: (data.flights || []) as CashFlight[],
      coverage: data.coverage ?? null,
      attempts: Array.isArray(data.attempts) ? data.attempts : [],
      source: data.source ?? null,
      cashCabinVerified: data.cashCabinVerified !== false && data.source === 'kiwi',
    };
  } catch (e) {
    console.error('fusion: cash flight fetch failed', e);
    return { flights: [], coverage: null, attempts: [], source: null, cashCabinVerified: false };
  }
}

async function fetchUserCards(userId: string): Promise<UserCard[]> {
  try {
    const sb = createClient(URL_ENV(), SVC(), { auth: { persistSession: false } });
    const [stmt, manual] = await Promise.all([
      sb.from('statement_imports')
        .select('bank, card_name, card_last4, points_balance, points_currency, self_entered')
        .eq('user_id', userId),
      sb.from('manual_cards')
        .select('bank, card_name, card_last4, points_balance, points_currency')
        .eq('user_id', userId),
    ]);
    const stmtRows = (stmt.data || []).map((r: any) => ({ ...r, selfEntered: r.self_entered === true }));
    const manualRows = (manual.data || []).map((r: any) => ({ ...r, selfEntered: true }));
    const rows = [...stmtRows, ...manualRows] as UserCard[];
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

const ENRICH_CAP = 6;

function awardKey(a: SeatsAeroResult): string {
  return a.id || `${a.source}|${a.date}|${a.mileageCost}`;
}

interface AwardView {
  program: string;
  mileageCost: number;
  economyMiles: number;
  businessMiles: number;
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
    economyMiles: a.yMileageCost || (cabin === 'economy' ? a.mileageCost : 0),
    businessMiles: a.jMileageCost || (cabin === 'business' ? a.mileageCost : 0),
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

    const [cashFetch, awards, cards] = await Promise.all([
      fetchCashFlights(base, from, to, dateFrom, dateTo, cabin),
      searchAwardAvailability(from, to, dateFrom, dateTo, undefined, cabin),
      fetchUserCards(gate.userId),
    ]);
    const cashFlights = cashFetch.flights;

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

    const matchedKeys = new Set<string>();
    const cashResults = cashFlights.map((flight: any) => {
      const awardMatch = matchAward(flight, awards);

      if (!awardMatch) {
        return {
          ...flight,
          cashUnavailable: false,
          cashFareVerifiedForCabin: cashFetch.cashCabinVerified,
          award: null as AwardView | null,
          redemption: [] as RedemptionOption[],
          bestOption: null as RedemptionOption | null,
        };
      }

      const key = awardKey(awardMatch);
      matchedKeys.add(key);
      const award = buildAwardView(awardMatch, tripByKey.get(key) ?? null, cabin);
      // Never value a Business/First award against a Travelpayouts fare whose
      // cabin is not supplied. Keep the fare visible as a reference, but make
      // points valuation cabin-honest by passing 0 until the cash cabin is known.
      const comparableCashPrice = cashFetch.cashCabinVerified || cabin === 'economy'
        ? flight.price
        : 0;
      const redemption = buildRedemption(cards, awardMatch, comparableCashPrice);
      const bestOption = comparableCashPrice > 0
        ? pickBest(redemption)
        : pickBestAwardOnly(redemption);
      const cabins = buildCabinBests(cards, awardMatch);

      return {
        ...flight,
        cashUnavailable: false,
        cashFareVerifiedForCabin: cashFetch.cashCabinVerified || cabin === 'economy',
        award,
        redemption,
        bestOption,
        cabins,
      };
    });

    const awardOnly = awards
      .filter((a) => !matchedKeys.has(awardKey(a)))
      .map((a) => {
        const key = awardKey(a);
        const trip = tripByKey.get(key) ?? null;
        const award = buildAwardView(a, trip, cabin);
        const redemption = buildRedemption(cards, a, 0);
        const bestOption = pickBestAwardOnly(redemption);
        const cabins = buildCabinBests(cards, a);

        return {
          id: `award-${key}`,
          price: 0,
          airline: a.airlines || trip?.carriers || '',
          from,
          to,
          departure: trip?.departsAt || a.date,
          arrival: trip?.arrivesAt || '',
          duration: trip ? Math.round(trip.durationMinutes / 60) : 0,
          stops: trip ? trip.stops : a.isDirect ? 0 : -1,
          bookingLink: '',
          cashUnavailable: true,
          cashFareVerifiedForCabin: false,
          award,
          redemption,
          bestOption,
          cabins,
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
      cashCoverage: cashFetch.coverage,
      cashAttempts: cashFetch.attempts,
      cashSource: cashFetch.source,
      cashCabinVerified: cashFetch.cashCabinVerified || cabin === 'economy',
      verifiedPolicy: 'all-estimates',
      flights: results,
    });
  } catch (err: any) {
    console.error('fusion error:', err?.message || err);
    return NextResponse.json({ error: 'fusion failed' }, { status: 500 });
  }
}

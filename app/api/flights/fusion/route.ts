// app/api/flights/fusion/route.ts
// POST /api/flights/fusion — "cash + award + your points" fusion for a route.

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import {
  getAvailabilityTrips,
  type SeatsAeroResult,
  type SeatsAeroTrip,
} from '@/lib/seats-aero';
import { searchFusionAwards } from '@/lib/award-inventory/fusion-adapter';
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
import { loadDecisionPortfolio, type DecisionWalletCard } from '@/lib/wallet/decision-portfolio';
import { buildWalletRailMatrix, type WalletRailCardInput } from '@/lib/redemption-rails/matrix';
import { programmeIdForFlightSource } from '@/lib/redemption-rails/programme-resolver';
import { buildTravelDecisionContract, type TravelDecisionAwardStatus } from '@/lib/travel/decision-contract';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

type Cabin = 'economy' | 'business' | 'first';

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
      cashCabinVerified: data.cashCabinVerified !== false && ['skyscanner-live', 'amadeus', 'kiwi'].includes(data.source),
    };
  } catch (e) {
    console.error('fusion: cash flight fetch failed', e);
    return { flights: [], coverage: null, attempts: [], source: null, cashCabinVerified: false };
  }
}

function legacyFusionCards(portfolio: DecisionWalletCard[]): UserCard[] {
  return portfolio
    .filter((card) => !!card.cardName)
    .map((card) => ({
      bank: card.bank,
      card_name: card.cardName!,
      card_last4: card.last4,
      points_balance: card.points,
      points_currency: card.pointsCurrency,
      selfEntered: card.selfEntered,
    }));
}

function decisionRailCards(portfolio: DecisionWalletCard[]): WalletRailCardInput[] {
  return portfolio.map((card, index) => ({
    walletKey: `${card.source}:${card.bank}:${card.last4 ?? card.cardName ?? index}`,
    bank: card.bank,
    // Keep unnamed linked cards in the matrix without guessing a product identity.
    cardName: card.cardName ?? `Unidentified ${card.bank} card${card.last4 ? ` ••••${card.last4}` : ''}`,
    pointsBalance: card.points,
    balanceVerified: card.verified,
  }));
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

function awardDecisionStatus(hasAward: boolean, pricingAuthority: string | null | undefined): TravelDecisionAwardStatus {
  if (!hasAward) return 'NOT_FOUND';
  if (pricingAuthority === 'DATE_SPECIFIC_LIVE') return 'LIVE_OR_PROVIDER_RETURNED';
  if (pricingAuthority === 'CACHED_DISCOVERY') return 'DISCOVERY_ONLY';
  return 'UNAVAILABLE';
}

function safeCashMinor(price: number): number | null {
  if (!Number.isFinite(price) || price < 0) return null;
  const minor = Math.round(price * 100);
  return Number.isSafeInteger(minor) ? minor : null;
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
    // Flexible award discovery may span a date window. Cash shopping remains tied
    // to the user's selected reference date so a fare from the first flexible day
    // is never silently presented as the target-date cash benchmark.
    const cashReferenceDate = body.cash_date || dateFrom;
    const cabin: Cabin = ['economy', 'business', 'first'].includes(body.cabin)
      ? body.cabin
      : 'economy';

    if (!from || !to) {
      return NextResponse.json({ error: 'from and to are required' }, { status: 400 });
    }

    const base = new URL(req.url).origin;

    const [cashFetch, awardFetch, portfolio] = await Promise.all([
      fetchCashFlights(base, from, to, cashReferenceDate, cashReferenceDate, cabin),
      searchFusionAwards({ origin: from, destination: to, startDate: dateFrom, endDate: dateTo, cabin }),
      loadDecisionPortfolio(gate.userId),
    ]);
    const cashFlights = cashFetch.flights;
    const awards = awardFetch.awards;
    const cards = legacyFusionCards(portfolio);
    const railCards = decisionRailCards(portfolio);

    // AwardTool/AwardWallet can return itinerary detail directly. Preserve it and
    // only call Seats.aero's trip-details endpoint for rows that actually came
    // from Seats.aero cached discovery.
    const tripByKey = new Map<string, SeatsAeroTrip | null>();
    for (const [key, trip] of awardFetch.tripsByAwardId.entries()) tripByKey.set(key, trip);

    const sortedAwards = [...awards].sort((a, b) => a.mileageCost - b.mileageCost);
    const toEnrich = sortedAwards
      .filter((award) => {
        const key = awardKey(award);
        return !tripByKey.has(key) && awardFetch.providerByAwardId.get(key) === 'seats-aero-cached';
      })
      .slice(0, ENRICH_CAP);
    const tripPairs = await Promise.all(
      toEnrich.map(
        async (a) => [awardKey(a), await getAvailabilityTrips(a.id, cabin)] as const,
      ),
    );
    for (const [key, trip] of tripPairs) tripByKey.set(key, trip);

    console.info('fusion: award-source', {
      route: `${from}-${to}`,
      dateFrom,
      dateTo,
      cabin,
      mode: awardFetch.mode,
      status: awardFetch.status,
      pricingAuthority: awardFetch.pricingAuthority,
      awards: awards.length,
      attempts: awardFetch.attempts.map((attempt) => ({ source: attempt.source, state: attempt.state, freshness: attempt.freshness })),
    });

    const matchedKeys = new Set<string>();
    const cashResults = cashFlights.map((flight: any) => {
      const awardMatch = matchAward(flight, awards);

      if (!awardMatch) {
        const cashMinor = safeCashMinor(flight.price);
        const matrix = buildWalletRailMatrix(railCards, 'flight', null);
        const decision = buildTravelDecisionContract({
          matrix,
          pricing: {
            travelKind: 'flight',
            programmeId: null,
            programmePointsRequired: null,
            awardTaxesMinor: null,
            awardTaxesCurrency: null,
            cashPriceMinor: cashMinor,
            cashCurrency: cashMinor == null ? null : 'INR',
          },
          inventory: {
            state: 'AVAILABLE',
            selection: { id: flight.id, from, to, departure: flight.departure, cabin, airline: flight.airline },
          },
          awardStatus: 'NOT_FOUND',
          cashSource: cashFetch.source,
          awardPricingAuthority: awardFetch.pricingAuthority,
          provenance: { cashFareVerifiedForCabin: cashFetch.cashCabinVerified || cabin === 'economy', awardSearchMode: awardFetch.mode },
        });

        return {
          ...flight,
          cashUnavailable: false,
          cashFareVerifiedForCabin: cashFetch.cashCabinVerified,
          award: null as AwardView | null,
          redemption: [] as RedemptionOption[],
          bestOption: null as RedemptionOption | null,
          decision,
        };
      }

      const key = awardKey(awardMatch);
      matchedKeys.add(key);
      const award = buildAwardView(awardMatch, tripByKey.get(key) ?? null, cabin);
      const comparableCashPrice = cashFetch.cashCabinVerified || cabin === 'economy'
        ? flight.price
        : 0;
      const redemption = buildRedemption(cards, awardMatch, comparableCashPrice);
      const bestOption = comparableCashPrice > 0
        ? pickBest(redemption)
        : pickBestAwardOnly(redemption);
      const cabins = buildCabinBests(cards, awardMatch);
      const programmeId = programmeIdForFlightSource(awardMatch.source);
      const matrix = buildWalletRailMatrix(railCards, 'flight', programmeId);
      const cashMinor = comparableCashPrice > 0 ? safeCashMinor(comparableCashPrice) : null;
      const evidenceProvider = awardFetch.providerByAwardId.get(key) ?? null;
      const decision = buildTravelDecisionContract({
        matrix,
        pricing: {
          travelKind: 'flight',
          programmeId,
          programmePointsRequired: awardMatch.mileageCost,
          awardTaxesMinor: award.trip ? award.trip.totalTaxes : null,
          awardTaxesCurrency: award.trip?.taxesCurrency ?? null,
          cashPriceMinor: cashMinor,
          cashCurrency: cashMinor == null ? null : 'INR',
        },
        inventory: {
          state: 'AVAILABLE',
          selection: {
            id: flight.id,
            from,
            to,
            departure: flight.departure,
            cabin,
            airline: flight.airline,
            awardDate: award.date,
            awardProgramme: award.program,
          },
        },
        awardStatus: awardDecisionStatus(true, awardFetch.pricingAuthority),
        cashSource: cashFetch.source,
        awardSource: evidenceProvider,
        awardPricingAuthority: awardFetch.pricingAuthority,
        provenance: {
          cashFareVerifiedForCabin: cashFetch.cashCabinVerified || cabin === 'economy',
          awardSearchMode: awardFetch.mode,
          awardEvidenceProvider: evidenceProvider,
        },
      });

      return {
        ...flight,
        cashUnavailable: false,
        cashFareVerifiedForCabin: cashFetch.cashCabinVerified || cabin === 'economy',
        award,
        awardEvidenceProvider: evidenceProvider,
        redemption,
        bestOption,
        cabins,
        decision,
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
        const programmeId = programmeIdForFlightSource(a.source);
        const matrix = buildWalletRailMatrix(railCards, 'flight', programmeId);
        const evidenceProvider = awardFetch.providerByAwardId.get(key) ?? null;
        const rowId = `award-${key}`;
        const decision = buildTravelDecisionContract({
          matrix,
          pricing: {
            travelKind: 'flight',
            programmeId,
            programmePointsRequired: a.mileageCost,
            awardTaxesMinor: trip ? trip.totalTaxes : null,
            awardTaxesCurrency: trip?.taxesCurrency ?? null,
            cashPriceMinor: null,
            cashCurrency: null,
          },
          inventory: {
            state: 'AVAILABLE',
            selection: { id: rowId, from, to, departure: trip?.departsAt || a.date, cabin, airline: a.airlines || trip?.carriers || '', awardDate: a.date, awardProgramme: award.program },
          },
          awardStatus: awardDecisionStatus(true, awardFetch.pricingAuthority),
          cashSource: null,
          awardSource: evidenceProvider,
          awardPricingAuthority: awardFetch.pricingAuthority,
          provenance: { awardSearchMode: awardFetch.mode, awardEvidenceProvider: evidenceProvider, cashBenchmark: 'UNAVAILABLE' },
        });

        return {
          id: rowId,
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
          awardEvidenceProvider: evidenceProvider,
          redemption,
          bestOption,
          cabins,
          decision,
        };
      });

    const results = [...cashResults, ...awardOnly];

    return NextResponse.json({
      route: { from, to, date_from: dateFrom, date_to: dateTo, cash_reference_date: cashReferenceDate, cabin },
      counts: {
        cashFlights: cashFlights.length,
        awards: awards.length,
        awardsEnriched: [...tripByKey.values()].filter(Boolean).length,
        awardOnlyCards: awardOnly.length,
        cards: portfolio.length,
      },
      cashCoverage: cashFetch.coverage,
      cashAttempts: cashFetch.attempts,
      cashSource: cashFetch.source,
      cashCabinVerified: cashFetch.cashCabinVerified || cabin === 'economy',
      awardSearchMode: awardFetch.mode,
      awardStatus: awardFetch.status,
      awardPricingAuthority: awardFetch.pricingAuthority,
      awardAttempts: awardFetch.attempts,
      awardReason: awardFetch.reason,
      verifiedPolicy: 'all-estimates',
      decisionContract: 'travel-decision-v1',
      flights: results,
    });
  } catch (err: any) {
    console.error('fusion error:', err?.message || err);
    return NextResponse.json({ error: 'fusion failed' }, { status: 500 });
  }
}
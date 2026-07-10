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
import { searchAwardAvailability, type SeatsAeroResult } from '@/lib/seats-aero';
import {
  resolveCardCurrency,
  partnersForSource,
  cardPointsFor,
} from '@/lib/transfer-map';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

type Cabin = 'economy' | 'business' | 'first';

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SVC = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Human labels for the canonical seats.aero source slugs we support.
const SOURCE_PROGRAM_LABEL: Record<string, string> = {
  singapore: 'Singapore Airlines KrisFlyer',
  'air-india': 'Air India',
  ba: 'British Airways Avios',
};
function programLabel(source: string): string {
  return SOURCE_PROGRAM_LABEL[source] || source;
}

interface CashFlight {
  id: string;
  price: number;
  airline: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: number;
  stops: number;
  bookingLink: string;
}

interface UserCard {
  bank: string;
  card_name: string;
  card_last4: string | null;
  points_balance: number;
  points_currency: string | null;
}

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

// ── award matching ───────────────────────────────────────────────────────────

function dayOf(iso: string): string {
  return (iso || '').slice(0, 10);
}
function norm(s: string): string {
  return (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Match the cheapest award for a cash flight. Route is implicit (seats.aero is
// already scoped to the route). We match on date, and on airline when the cash
// flight carries an airline code. Returns the lowest-mileage match, or null.
function matchAward(flight: CashFlight, awards: SeatsAeroResult[]): SeatsAeroResult | null {
  const fDay = dayOf(flight.departure);
  const fAir = norm(flight.airline);
  const candidates = awards.filter((a) => {
    if (fDay && dayOf(a.date) && dayOf(a.date) !== fDay) return false;
    if (fAir && a.airlines) {
      const aAir = norm(a.airlines);
      if (!(aAir.includes(fAir) || fAir.includes(aAir))) return false;
    }
    return true;
  });
  if (!candidates.length) return null;
  return candidates.reduce((best, a) => (a.mileageCost < best.mileageCost ? a : best));
}

// ── rating (heuristic, NOT verified) ─────────────────────────────────────────
// Honest value signal: rupees of cash fare covered per card point transferred.
function valueLabel(vpp: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (vpp >= 1.5) return 'excellent';
  if (vpp >= 1.0) return 'good';
  if (vpp >= 0.5) return 'fair';
  return 'poor';
}

interface RedemptionOption {
  cardName: string;
  bank: string;
  status: 'ok' | 'currency-unknown' | 'not-transferable';
  currency?: string;
  transferPartner?: string;
  ratio?: [number, number];
  cardPointsNeeded?: number;
  yourPoints?: number;
  canAfford?: boolean;
  verified: false;
  rating?: { valuePerPointInr: number | null; label: string };
}

function buildRedemption(
  cards: UserCard[],
  award: SeatsAeroResult,
  cashPrice: number,
): RedemptionOption[] {
  return cards.map((card): RedemptionOption => {
    const resolved = resolveCardCurrency(card.bank, card.card_name);

    // Unknown card — never fabricate a program or ratio.
    if (!resolved) {
      return {
        cardName: card.card_name,
        bank: card.bank,
        status: 'currency-unknown',
        verified: false,
      };
    }

    // Does this currency transfer into this award source?
    const partners = partnersForSource(award.source);
    const est = partners.length
      ? cardPointsFor(award.source, resolved.currency, resolved.bank, award.mileageCost, resolved.matchedCardName)
      : null;

    if (!est) {
      return {
        cardName: card.card_name,
        bank: card.bank,
        status: 'not-transferable',
        currency: resolved.currency,
        verified: false,
      };
    }

    const yourPoints = Number(card.points_balance) || 0;
    const canAfford = yourPoints >= est.cardPoints;
    const vpp = cashPrice > 0 ? cashPrice / est.cardPoints : null;

    return {
      cardName: card.card_name,
      bank: card.bank,
      status: 'ok',
      currency: resolved.currency,
      transferPartner: programLabel(award.source),
      ratio: est.ratio,
      cardPointsNeeded: est.cardPoints,
      yourPoints,
      canAfford,
      verified: false,
      rating: { valuePerPointInr: vpp, label: vpp != null ? valueLabel(vpp) : 'unknown' },
    };
  });
}

// Best option = affordable + transferable, highest value-per-point. Else null.
function pickBest(options: RedemptionOption[]): RedemptionOption | null {
  const eligible = options.filter(
    (o) => o.status === 'ok' && o.canAfford && o.rating?.valuePerPointInr != null,
  );
  if (!eligible.length) return null;
  return eligible.reduce((best, o) =>
    (o.rating!.valuePerPointInr! > best.rating!.valuePerPointInr! ? o : best),
  );
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

    const results = cashFlights.map((flight) => {
      const awardMatch = matchAward(flight, awards);

      if (!awardMatch) {
        // No award for this flight -> cash-only, still shown.
        return { ...flight, award: null, redemption: [] as RedemptionOption[], bestOption: null };
      }

      const award = {
        program: programLabel(awardMatch.source),
        mileageCost: awardMatch.mileageCost,
        seats: awardMatch.remainingSeats,
        source: awardMatch.source,
      };
      const redemption = buildRedemption(cards, awardMatch, flight.price);
      const bestOption = pickBest(redemption);

      return { ...flight, award, redemption, bestOption };
    });

    return NextResponse.json({
      route: { from, to, date_from: dateFrom, date_to: dateTo, cabin },
      counts: { cashFlights: cashFlights.length, awards: awards.length, cards: cards.length },
      verifiedPolicy: 'all-estimates', // every redemption is verified:false
      flights: results,
    });
  } catch (err: any) {
    console.error('fusion error:', err?.message || err);
    return NextResponse.json({ error: 'fusion failed' }, { status: 500 });
  }
}

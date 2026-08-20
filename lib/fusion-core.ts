// lib/fusion-core.ts
// Pure fusion helpers extracted verbatim from app/api/flights/fusion/route.ts
// (Phase 1a — no behavior change, no renames). Award↔cash matching, redemption
// building, best-option selection, and the honest value-rating thresholds.
//
// HONESTY CONTRACT (CreditIQ moat): every redemption option ships verified:false.
//   - Unknown card  -> status:'currency-unknown', NO fabricated program/ratio.
//   - Currency that doesn't transfer to that award source -> transferable:false.
//   - Nothing here may be rendered as verified-green downstream.

import { type SeatsAeroResult, type SeatsAeroTrip } from '@/lib/seats-aero';
import type { LiveDestinationPrice } from '@/lib/types';
import { resolveCardCurrency } from '@/lib/transfer-map';
import { findTransferRoutes, type Route } from '@/lib/transfer-ladder';
import { TRANSFER_EDGES } from '@/lib/data/transfer-graph';

// Human labels for seats.aero source slugs. DISPLAY ONLY — the slug itself
// (award.source) is what drives transfer-route lookup, and is never derived from
// this map. Any slug not listed falls back to the raw slug (honest: a visible
// unknown, not a fabricated name). Covers every source the live cached-search
// returns for our routes; extend as new sources appear.
const SOURCE_PROGRAM_LABEL: Record<string, string> = {
  singapore: 'Singapore Airlines KrisFlyer',
  'air-india': 'Air India',
  ba: 'British Airways Avios',
  united: 'United MileagePlus',
  aeroplan: 'Air Canada Aeroplan',
  alaska: 'Alaska Atmos Rewards',
  velocity: 'Virgin Australia Velocity',
  aadvantage: 'American AAdvantage',
  delta: 'Delta SkyMiles',
  emirates: 'Emirates Skywards',
  etihad: 'Etihad Guest',
  flyingblue: 'Air France-KLM Flying Blue',
  virginatlantic: 'Virgin Atlantic Flying Club',
  jetblue: 'JetBlue TrueBlue',
  lifemiles: 'Avianca LifeMiles',
  qantas: 'Qantas Frequent Flyer',
  turkish: 'Turkish Miles&Smiles',
  qatar: 'Qatar Privilege Club',
  saudia: 'Saudia AlFursan',
  smiles: 'GOL Smiles',
  connectmiles: 'Copa ConnectMiles',
  azul: 'Azul TudoAzul',
  ethiopian: 'Ethiopian ShebaMiles',
  eurobonus: 'SAS EuroBonus',
  finnair: 'Finnair Plus',
};
export function programLabel(source: string): string {
  return SOURCE_PROGRAM_LABEL[source] || source;
}

export interface CashFlight {
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

export interface UserCard {
  bank: string;
  card_name: string;
  card_last4: string | null;
  points_balance: number;
  points_currency: string | null;
  // Provenance for the row pill: true when the balance was hand-typed (manual card,
  // or a statement card whose balance was later edited) — renders "Self-entered"
  // grey. false/undefined = statement-verified, renders "In wallet" green (the moat).
  selfEntered?: boolean;
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
export function matchAward(flight: CashFlight, awards: SeatsAeroResult[]): SeatsAeroResult | null {
  const fDay = dayOf(flight.departure);
  // Only gate on airline when the cash source gave a real 2-char IATA carrier
  // code (e.g. "SQ", "6E"). Aggregators return "Various"/"Multiple" for
  // multi-carrier fares — gating on those would wrongly drop a valid
  // date-matched award, so we skip the airline check in that case.
  const fAirRaw = norm(flight.airline);
  const fAir = /^[A-Z0-9]{2}$/.test(fAirRaw) ? fAirRaw : '';
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
export function valueLabel(vpp: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (vpp >= 1.5) return 'excellent';
  if (vpp >= 1.0) return 'good';
  if (vpp >= 0.5) return 'fair';
  return 'poor';
}

export interface RedemptionOption {
  cardName: string;
  bank: string;
  status: 'ok' | 'currency-unknown' | 'not-transferable';
  currency?: string;
  transferPartner?: string;
  ratio?: [number, number];        // nominalRatio of the best route — DISPLAY ONLY,
                                    // never the payable figure (see cardPointsNeeded)
  cardPointsNeeded?: number;        // TRUTH: best route's pointsRequired
  yourPoints?: number;
  canAfford?: boolean;
  verified: false;
  selfEntered?: boolean;            // drives the In-wallet / Self-entered pill
  // Every viable transfer path from this card into the award programme, best-first
  // (from lib/transfer-ladder). Carried for the Phase-4 disclosure ladder; the
  // collapsed row uses only cardPointsNeeded.
  routes?: Route[];
  rating?: { valuePerPointInr: number | null; label: string };
}

// Card reward currency + issuer bank -> transfer-graph edge `from_currency` slug.
// The edge slugs follow a `${bank}_${currency}` convention (hdfc_reward_points,
// axis_edge, axis_miles, amex_membership_rewards), so we normalise both parts and
// join. An unmapped pair returns a slug that simply matches no edge -> no route ->
// "not transferable" (honest: we never fabricate a ratio for an unknown pair).
export function currencyToEdgeSlug(currency: string, bank?: string): string | null {
  const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const b = norm(bank || '');
  const c = norm(currency);
  if (!b || !c) return null;
  return `${b}_${c}`;
}

export function buildRedemption(
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

    // Every viable transfer path from this card's currency into this award source,
    // via the transfer-ladder engine (direct + 2-hop, best-first). Replaces the old
    // single-hop cardPointsFor lookup. For the current all-direct edge set this
    // yields the same pointsRequired, but it also carries the full ladder + honest
    // duration/provenance for the Phase-4 disclosure.
    const slug = currencyToEdgeSlug(resolved.currency, resolved.bank);
    const routes = slug
      ? findTransferRoutes(TRANSFER_EDGES, slug, award.source, award.mileageCost, {
          cardName: resolved.matchedCardName,
        })
      : [];

    if (!routes.length) {
      return {
        cardName: card.card_name,
        bank: card.bank,
        status: 'not-transferable',
        currency: resolved.currency,
        verified: false,
      };
    }

    const best = routes[0]; // sorted pointsRequired asc — the payable truth
    const yourPoints = Number(card.points_balance) || 0;
    const canAfford = yourPoints >= best.pointsRequired;
    const vpp = cashPrice > 0 ? cashPrice / best.pointsRequired : null;

    return {
      cardName: card.card_name,
      bank: card.bank,
      status: 'ok',
      currency: resolved.currency,
      transferPartner: programLabel(award.source),
      ratio: best.nominalRatio, // display only
      cardPointsNeeded: best.pointsRequired,
      yourPoints,
      canAfford,
      verified: false,
      selfEntered: card.selfEntered ?? false,
      routes,
      rating: { valuePerPointInr: vpp, label: vpp != null ? valueLabel(vpp) : 'unknown' },
    };
  });
}

// Best option = affordable + transferable, highest value-per-point. Else null.
export function pickBest(options: RedemptionOption[]): RedemptionOption | null {
  const eligible = options.filter(
    (o) => o.status === 'ok' && o.canAfford && o.rating?.valuePerPointInr != null,
  );
  if (!eligible.length) return null;
  return eligible.reduce((best, o) =>
    (o.rating!.valuePerPointInr! > best.rating!.valuePerPointInr! ? o : best),
  );
}

// Award-only cards have NO cash price, so value-per-point is undefined. Fall back
// to fewest card points: prefer an affordable+transferable route, else the
// cheapest transferable one (UI still flags it, honestly, as "short by N").
export function pickBestAwardOnly(options: RedemptionOption[]): RedemptionOption | null {
  const transferable = options.filter((o) => o.status === 'ok' && o.cardPointsNeeded != null);
  if (!transferable.length) return null;
  const affordable = transferable.filter((o) => o.canAfford);
  const pool = affordable.length ? affordable : transferable;
  return pool.reduce((best, o) => (o.cardPointsNeeded! < best.cardPointsNeeded! ? o : best));
}

// Per-cabin best redemption for the expanded row's cabin selector. Each cabin's
// ladder MUST be computed server-side (not recomputed in the client) because
// pointsRequired and the card-name allowlist depend on the resolver's matched
// seed name, which the client doesn't carry. One entry per cabin the record
// actually prices (miles > 0).
export interface CabinBest {
  cabin: 'economy' | 'business';
  miles: number;                     // award miles for this cabin (seats.aero)
  best: RedemptionOption | null;     // cheapest reachable option, or null (not priced)
}
export function buildCabinBests(
  cards: UserCard[],
  award: SeatsAeroResult,
): CabinBest[] {
  const pairs: Array<[CabinBest['cabin'], number]> = [
    ['economy', award.yMileageCost || 0],
    ['business', award.jMileageCost || 0],
  ];
  const out: CabinBest[] = [];
  for (const [cabin, miles] of pairs) {
    if (!(miles > 0)) continue;
    // cashPrice 0: value-per-point is a client concern (computed after the live
    // "Show cash price" fetch); here we only need the ladder + pointsRequired.
    const redemption = buildRedemption(cards, { ...award, mileageCost: miles }, 0);
    out.push({ cabin, miles, best: pickBestAwardOnly(redemption) });
  }
  return out;
}

// ── live-price assembly (POST /api/trip-planner/live-price) ────────────────────
// Kept here (not in the route file) because Next.js App Router route modules may
// only export HTTP handlers + config — extra exports fail `next build`. Pure +
// synchronous, so they stay unit-testable.

// Lowest-mileage LIVE award, or null. Discards anything not 'seats.aero (live)'.
export function pickLiveAward(awards: SeatsAeroResult[]): SeatsAeroResult | null {
  const live = awards.filter((a) => a.dataSource === 'seats.aero (live)');
  if (!live.length) return null;
  return live.reduce((b, a) => (a.mileageCost < b.mileageCost ? a : b));
}

// Assemble the response from already-fetched inputs. `best === null` => no live price.
export function assembleLivePrice(params: {
  origin: string;
  destination: string;
  cabin: 'economy' | 'business';
  best: SeatsAeroResult | null;
  trip: SeatsAeroTrip | null;
  cashPrice: number | null;
  verifiedCards: UserCard[];
}): LiveDestinationPrice {
  const { origin, destination, cabin, best, trip, cashPrice, verifiedCards } = params;

  // No live award => there is no live price to show.
  if (!best) return { live: false };

  const redemption = buildRedemption(verifiedCards, best, cashPrice ?? 0);
  const bestAffordable = pickBest(redemption); // best affordable, by value-per-point
  const bestOption = bestAffordable ?? pickBestAwardOnly(redemption); // else cheapest reachable

  const verifiedPoints = verifiedCards.reduce(
    (sum, c) => sum + (Number(c.points_balance) || 0),
    0,
  );
  const zeroVerified = verifiedPoints === 0;
  const affordable = bestAffordable !== null;
  const shortfall =
    bestOption && !bestOption.canAfford
      ? Math.max(0, (bestOption.cardPointsNeeded ?? 0) - (bestOption.yourPoints ?? 0))
      : 0;

  return {
    live: true,
    origin,
    destination,
    cabin,
    award: {
      program: programLabel(best.source),
      source: best.source,
      mileageCost: best.mileageCost,
      seats: best.remainingSeats,
      airlineCode: best.airlines,
      isDirect: best.isDirect,
      date: best.date,
      trip,
    },
    cashPrice: cashPrice ?? null,
    bestOption: bestOption ?? null,
    verifiedPoints,
    zeroVerified,
    affordable,
    shortfall,
    verified: false,
  };
}

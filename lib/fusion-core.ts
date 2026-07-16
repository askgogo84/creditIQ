// lib/fusion-core.ts
// Pure fusion helpers extracted verbatim from app/api/flights/fusion/route.ts
// (Phase 1a — no behavior change, no renames). Award↔cash matching, redemption
// building, best-option selection, and the honest value-rating thresholds.
//
// HONESTY CONTRACT (CreditIQ moat): every redemption option ships verified:false.
//   - Unknown card  -> status:'currency-unknown', NO fabricated program/ratio.
//   - Currency that doesn't transfer to that award source -> transferable:false.
//   - Nothing here may be rendered as verified-green downstream.

import { type SeatsAeroResult } from '@/lib/seats-aero';
import {
  resolveCardCurrency,
  partnersForSource,
  cardPointsFor,
} from '@/lib/transfer-map';

// Human labels for the canonical seats.aero source slugs we support.
const SOURCE_PROGRAM_LABEL: Record<string, string> = {
  singapore: 'Singapore Airlines KrisFlyer',
  'air-india': 'Air India',
  ba: 'British Airways Avios',
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
  ratio?: [number, number];
  cardPointsNeeded?: number;
  yourPoints?: number;
  canAfford?: boolean;
  verified: false;
  rating?: { valuePerPointInr: number | null; label: string };
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

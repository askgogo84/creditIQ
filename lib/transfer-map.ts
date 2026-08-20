// lib/transfer-map.ts
// Card-reward-currency -> seats.aero award-program transfer routes.
//
// HONESTY CONTRACT (CreditIQ moat: "We don't guess your money"):
//   EVERY route in this file ships `verified: false`. These are ESTIMATED
//   transfer ratios with prior basis in the codebase, NOT reconciled against a
//   live transfer-partner API. Downstream (mobile app, fusion endpoint) MUST
//   surface anything sourced here as an estimate (neutral grey), never as a
//   verified value (reserved green). Do not flip any of these to true without a
//   live, per-card confirmation of the transfer ratio.
//
// ---------------------------------------------------------------------------
// seats.aero SOURCE-SLUG RECONCILIATION
// Two maps in the codebase disagreed on program -> slug. Reconciled to ONE
// authoritative set below (the KEYS of TRANSFER_MAP):
//
//   Program          lib/seats-aero.ts        travel-ai/route.ts   CANONICAL
//   ---------------  -----------------------  -------------------  -----------
//   KrisFlyer        singapore / krisflyer *  krisflyer            singapore
//   Air India        flyingblue (wrong)       air-india            air-india
//   British Avios    ba                       avios                ba
//
//   * seats-aero.ts mapped 'KrisFlyer'->'singapore' AND
//     'Singapore Airlines'->'krisflyer' (self-contradiction). The `sources=`
//     param that returned live data uses `singapore` (BLR-SIN = 44,500 SQ
//     miles), so `singapore` wins and `krisflyer` is dropped.
//
// CONFIRMED LIVE: only `singapore` has been verified to return real seats.aero
// data. `air-india` and `ba` are best-guess slugs — a further reason every
// route that uses them is verified:false.
// ---------------------------------------------------------------------------

import { SEED_CARDS } from './data/seed-cards';
import type { RewardCurrency } from './types';

/**
 * One card-currency -> airline-program transfer route.
 * `ratio` is [cardPoints, airlineMiles]: [5,4] means 5 card points -> 4 miles.
 */
export interface TransferRoute {
  cardCurrency: RewardCurrency; // matches a SEED_CARDS.reward_currency value
  cardBank?: string;            // optional bank disambiguator (e.g. 'HDFC', 'Axis', 'AmEx')
  ratio: [number, number];      // [cardPoints, airlineMiles]
  verified: boolean;            // ALWAYS false here — honest estimate
  // Optional allowlist of specific SEED_CARDS.name values this route applies to.
  // Used when a (currency, bank) pair is NOT uniform across a bank's cards — e.g.
  // only HDFC Infinia + Diners Black transfer ~1:1 to KrisFlyer, while Regalia
  // Gold was devalued and differs. When set, a card must be on this list for the
  // route to apply; non-listed cards get NO route (honest: show nothing, not a
  // wrong ratio). Matched case/spacing-insensitively.
  cardNameAllowlist?: string[];
}

/**
 * Keyed by CANONICAL seats.aero source slug (see reconciliation note above).
 * Only routes with prior basis in the codebase are included. Phantom routes
 * (Amex MR -> Asia Miles / Aeroplan / Flying Blue) are deliberately DROPPED as
 * unconfirmed for Indian Amex. Marriott Bonvoy is excluded (hotel, not a
 * seats.aero flight source).
 */
export const TRANSFER_MAP: Record<string, TransferRoute[]> = {
  // Singapore Airlines KrisFlyer — CONFIRMED LIVE slug.
  singapore: [
    { cardCurrency: 'edge',          cardBank: 'Axis', ratio: [5, 4], verified: false }, // Axis EDGE (Magnus/Reserve) 5:4
    { cardCurrency: 'miles',         cardBank: 'Axis', ratio: [1, 1], verified: false }, // Axis EDGE Miles (Atlas etc.) 1:1
    // HDFC reward-points -> KrisFlyer 1:1, but ONLY Infinia + Diners Black.
    // Regalia Gold (devalued) and Diners Privilege do NOT get this ratio.
    {
      cardCurrency: 'reward-points',
      cardBank: 'HDFC',
      ratio: [1, 1],
      verified: false,
      cardNameAllowlist: ['HDFC Infinia Metal Edition', 'HDFC Diners Club Black'],
    },
  ],

  // Air India — unconfirmed slug, estimate only.
  'air-india': [
    { cardCurrency: 'edge', cardBank: 'Axis', ratio: [1, 1], verified: false }, // Axis EDGE -> Air India 1:1
  ],

  // British Airways Avios — unconfirmed slug, estimate only.
  ba: [
    { cardCurrency: 'membership-rewards', cardBank: 'AmEx', ratio: [1, 1], verified: false }, // Amex MR -> Avios 1:1
  ],
};

/** All transfer routes into a given seats.aero source slug (empty if none). */
export function partnersForSource(source: string): TransferRoute[] {
  return TRANSFER_MAP[source] ?? [];
}

export interface CardPointsEstimate {
  cardPoints: number;           // card points needed to cover `mileageCost` miles
  ratio: [number, number];
  cardCurrency: RewardCurrency;
  cardBank?: string;
  verified: boolean;            // false — estimate
}

/**
 * How many card points the user must transfer to cover an award of
 * `mileageCost` miles on `source`, for a card of the given currency/bank.
 *
 * Returns null when there is no matching route — we do NOT guess a ratio
 * (honesty rule). If `bank` is supplied it must agree with the route's
 * cardBank; a mismatch yields null rather than a fabricated estimate. If a
 * route carries a cardNameAllowlist, `cardName` must be on it (else null) —
 * this is how per-card exceptions like HDFC Regalia Gold are excluded.
 */
export function cardPointsFor(
  source: string,
  currency: RewardCurrency,
  bank: string | undefined,
  mileageCost: number,
  cardName?: string,
): CardPointsEstimate | null {
  if (!mileageCost || mileageCost <= 0) return null;

  const route = partnersForSource(source).find((r) => {
    if (r.cardCurrency !== currency) return false;
    if (r.cardBank && bank && normalize(r.cardBank) !== normalize(bank)) return false;
    if (r.cardNameAllowlist) {
      const n = normalize(cardName || '');
      if (!n || !r.cardNameAllowlist.some((allowed) => normalize(allowed) === n)) return false;
    }
    return true;
  });
  if (!route) return null;

  const [from, to] = route.ratio;
  const cardPoints = Math.ceil((mileageCost * from) / to);

  return {
    cardPoints,
    ratio: route.ratio,
    cardCurrency: route.cardCurrency,
    cardBank: route.cardBank,
    verified: false,
  };
}

// ---------------------------------------------------------------------------
// (bank, card_name) -> reward_currency RESOLVER
// Matches a user's card against SEED_CARDS by CARD NAME (not by points_currency).
// Unresolved cards return null => caller must show "currency unknown" and must
// NOT guess a currency (honesty rule).
// ---------------------------------------------------------------------------

function normalize(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

// ── issuer-string reconciliation ────────────────────────────────────────────
// Statement banks are routinely INFLATED vs the catalogue's short label — the
// same defect that leaves "HDFC Bank" != "HDFC" and blanks the KrisFlyer price.
// Two kinds of mismatch, handled here so there is ONE place to reconcile them:
//   - Suffix inflation: "HDFC Bank" / "SBI Card" — strip trailing qualifier words.
//   - Aliases: "American Express" vs "AmEx", "Bank of Baroda" vs "BOB" — these are
//     NOT suffixes, so they need an explicit (short) map applied before stripping.
const BANK_ALIASES: Record<string, string> = {
  americanexpress: 'amex',
  amex: 'amex',
  bankofbaroda: 'bob',
  bob: 'bob',
};

/** Canonical issuer token: alias first (so "bank of baroda" isn't mangled by the
 *  suffix strip), else drop trailing qualifier words. "HDFC Bank"->"hdfc",
 *  "SBI Card"->"sbi", "American Express"->"amex", "Bank of Baroda"->"bob". */
function canonicalBank(s: string): string {
  const raw = (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (BANK_ALIASES[raw]) return BANK_ALIASES[raw];
  return raw.replace(/(bank|cards|card|limited|ltd)+$/g, '');
}

/** Same issuer, tolerating inflated labels and known aliases. Empty either side
 *  is NOT a match — callers keep their own `!bank ||` permissive guard. */
function sameBank(a: string, b: string): boolean {
  const ca = canonicalBank(a);
  return !!ca && ca === canonicalBank(b);
}

// Generic/issuer words that carry no product identity — dropped before
// token-overlap matching so only the DISTINCTIVE brand token (e.g. "infinia",
// "regalia", "magnus", "atlas") drives a match. Bank tokens are here too: the
// `bank` field already carries the issuer, so its name-token is noise here.
//
// ⚠ UNVERIFIED ASSERTION, NOT A DESIGN CHOICE: dropping 'metal' and 'edition'
// here makes the matcher treat "Infinia" and "HDFC Infinia Metal Edition" as ONE
// card. That is the INVERSE of the tier-mismatch bug the subset guard below
// fixes — instead of ADDING a distinguishing token, we DELETE one. The catalogue
// inclusion/verification spec found the Infinia / Infinia Metal Edition pair
// INDETERMINATE and made that collapse verification-gated; our pricing only keeps
// working because of that collapse. Removing 'metal'/'edition' now would break a
// currently-correct Infinia pricing, so they stay — but they are an unverified
// equivalence claim living in a drop-list, and belong in the catalogue's
// verified-collapse table, not here.
const GENERIC_NAME_TOKENS = new Set([
  'credit', 'card', 'cards', 'the', 'edition', 'metal', 'club', 'bank',
  'plus', 'for', 'and', 'signature', 'co', 'branded',
  // issuer/bank tokens
  'hdfc', 'axis', 'sbi', 'icici', 'amex', 'american', 'express', 'idfc',
  'kotak', 'rbl', 'yes', 'standard', 'chartered', 'sc', 'au', 'indusind',
  'hsbc', 'citi',
]);

/** Distinctive lowercase tokens in a card name (>=3 chars, non-generic). */
function significantTokens(name: string): string[] {
  return (name || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !GENERIC_NAME_TOKENS.has(t));
}

/**
 * May `seedName` be matched to `inputName` without ASSERTING a tier/variant the
 * user never typed? True only when every distinctive seed token is present in the
 * input — i.e. the seed adds no distinguishing token ("gold", "plus", "reserve",
 * "burgundy"…). This is what stops base "Regalia" resolving to "HDFC Regalia
 * Gold": the seed's extra "gold" is not in the input, so the match is refused and
 * the caller honestly returns null. (Input carrying EXTRA tokens beyond the seed
 * is fine — that resolves a more-specific name to its base catalogue entry.)
 */
function seedAddsNoToken(seedName: string, inputName: string): boolean {
  const inSig = new Set(significantTokens(inputName));
  return significantTokens(seedName).every((t) => inSig.has(t));
}

export interface ResolvedCard {
  matchedCardName: string;      // the SEED_CARDS.name we matched
  bank: string;
  currency: RewardCurrency;
}

/**
 * Resolve a user card (bank + card_name) to its reward currency via SEED_CARDS.
 * Exact normalized-name match first, then a conservative containment match that
 * additionally requires bank agreement. Returns null if unresolved — never a guess.
 */
export function resolveCardCurrency(
  bank: string | undefined,
  cardName: string,
): ResolvedCard | null {
  const target = normalize(cardName);
  if (!target) return null;

  // 1) exact normalized name match
  let match = SEED_CARDS.find((c) => normalize(c.name) === target);

  // 2) conservative containment, guarded by bank agreement + min length. The
  // subset guard forbids a match that ADDS a distinguishing token — so base
  // "Regalia" (contained in "HDFC Regalia Gold") is refused, not upgraded.
  if (!match && target.length >= 5) {
    match = SEED_CARDS.find((c) => {
      const n = normalize(c.name);
      const nameHit = n.includes(target) || target.includes(n);
      const bankHit = !bank || sameBank(c.bank, bank);
      return nameHit && bankHit && seedAddsNoToken(c.name, cardName);
    });
  }

  // 3) token-overlap fallback — catches user names that carry extra generic
  // words on BOTH sides (e.g. "Infinia Credit Card" vs "HDFC Infinia Metal
  // Edition"), where containment can't see the shared brand token. Guarded by
  // bank agreement, the subset rule (seed adds no distinguishing token) AND
  // uniqueness: more than one candidate is ambiguous, so we return null rather
  // than guess (honesty rule).
  if (!match) {
    const targetTokens = significantTokens(cardName);
    if (targetTokens.length) {
      const candidates = SEED_CARDS.filter((c) => {
        const bankHit = !bank || sameBank(c.bank, bank);
        if (!bankHit) return false;
        const seedTokens = significantTokens(c.name);
        if (!seedTokens.length) return false;
        // Every seed token must be in the input (subset) — this both links the
        // two names and refuses any tier the input didn't carry.
        return seedAddsNoToken(c.name, cardName) && seedTokens.some((t) => targetTokens.includes(t));
      });
      if (candidates.length === 1) match = candidates[0];
    }
  }

  if (!match) return null; // currency unknown — do NOT guess
  return { matchedCardName: match.name, bank: match.bank, currency: match.reward_currency };
}

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
// The issuer-verified routes now live in lib/data/transfer-graph.ts. This legacy
// map remains for older consumers, so card-specific exceptions are mirrored here
// conservatively rather than allowing a stale generic route to leak.

import { SEED_CARDS } from './data/seed-cards';
import type { RewardCurrency } from './types';

export interface TransferRoute {
  cardCurrency: RewardCurrency;
  cardBank?: string;
  ratio: [number, number];
  verified: boolean;
  cardNameAllowlist?: string[];
}

export const TRANSFER_MAP: Record<string, TransferRoute[]> = {
  singapore: [
    { cardCurrency: 'edge', cardBank: 'Axis', ratio: [5, 2], verified: false },
    // Axis Atlas current issuer table is 1 EDGE Mile -> 2 KrisFlyer miles. Keep
    // this legacy route card-specific so other Axis EDGE-Miles cards do not
    // inherit Atlas terms.
    {
      cardCurrency: 'miles',
      cardBank: 'Axis',
      ratio: [1, 2],
      verified: false,
      cardNameAllowlist: ['Axis Atlas'],
    },
    {
      cardCurrency: 'reward-points',
      cardBank: 'HDFC',
      ratio: [1, 1],
      verified: false,
      cardNameAllowlist: ['HDFC Infinia Metal Edition', 'HDFC Diners Club Black'],
    },
  ],

  'air-india': [
    { cardCurrency: 'edge', cardBank: 'Axis', ratio: [1, 1], verified: false },
  ],

  ba: [
    { cardCurrency: 'membership-rewards', cardBank: 'AmEx', ratio: [1, 1], verified: false },
  ],
};

export function partnersForSource(source: string): TransferRoute[] {
  return TRANSFER_MAP[source] ?? [];
}

export interface CardPointsEstimate {
  cardPoints: number;
  ratio: [number, number];
  cardCurrency: RewardCurrency;
  cardBank?: string;
  verified: boolean;
}

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

function normalize(s: string): string {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

const BANK_ALIASES: Record<string, string> = {
  americanexpress: 'amex',
  amex: 'amex',
  bankofbaroda: 'bob',
  bob: 'bob',
};

function canonicalBank(s: string): string {
  const raw = (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  if (BANK_ALIASES[raw]) return BANK_ALIASES[raw];
  return raw.replace(/(bank|cards|card|limited|ltd)+$/g, '');
}

function sameBank(a: string, b: string): boolean {
  const ca = canonicalBank(a);
  return !!ca && ca === canonicalBank(b);
}

const GENERIC_NAME_TOKENS = new Set([
  'credit', 'card', 'cards', 'the', 'edition', 'metal', 'club', 'bank',
  'plus', 'for', 'and', 'signature', 'co', 'branded',
  'hdfc', 'axis', 'sbi', 'icici', 'amex', 'american', 'express', 'idfc',
  'kotak', 'rbl', 'yes', 'standard', 'chartered', 'sc', 'au', 'indusind',
  'hsbc', 'citi',
]);

function significantTokens(name: string): string[] {
  return (name || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !GENERIC_NAME_TOKENS.has(t));
}

function seedAddsNoToken(seedName: string, inputName: string): boolean {
  const inSig = new Set(significantTokens(inputName));
  return significantTokens(seedName).every((t) => inSig.has(t));
}

export interface ResolvedCard {
  matchedCardName: string;
  // `bank` normally holds the issuer. Axis Atlas intentionally returns the
  // synthetic routing label `Axis Atlas`: fusion-core combines bank+currency into
  // a graph node, producing `axis_atlas_miles`. The user-facing bank still comes
  // from the wallet row, so this cannot leak as an issuer label in the UI.
  bank: string;
  currency: RewardCurrency;
}

export function resolveCardCurrency(
  bank: string | undefined,
  cardName: string,
): ResolvedCard | null {
  const target = normalize(cardName);
  if (!target) return null;

  let match = SEED_CARDS.find((c) => normalize(c.name) === target);

  if (!match && target.length >= 5) {
    match = SEED_CARDS.find((c) => {
      const n = normalize(c.name);
      const nameHit = n.includes(target) || target.includes(n);
      const bankHit = !bank || sameBank(c.bank, bank);
      return nameHit && bankHit && seedAddsNoToken(c.name, cardName);
    });
  }

  if (!match) {
    const targetTokens = significantTokens(cardName);
    if (targetTokens.length) {
      const candidates = SEED_CARDS.filter((c) => {
        const bankHit = !bank || sameBank(c.bank, bank);
        if (!bankHit) return false;
        const seedTokens = significantTokens(c.name);
        if (!seedTokens.length) return false;
        return seedAddsNoToken(c.name, cardName) && seedTokens.some((t) => targetTokens.includes(t));
      });
      if (candidates.length === 1) match = candidates[0];
    }
  }

  if (!match) return null;

  // Dedicated Atlas graph routing without changing its actual reward-currency
  // label (`miles`). This keeps card-specific Axis ratios isolated by construction.
  const routingBank = normalize(match.name) === normalize('Axis Atlas') ? 'Axis Atlas' : match.bank;
  return { matchedCardName: match.name, bank: routingBank, currency: match.reward_currency };
}

import { SEED_CARDS } from '@/lib/data/seed-cards'
import { resolveCardCurrency } from '@/lib/transfer-map'

function normalize(value: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

const BANK_ALIASES: Record<string, string> = {
  americanexpress: 'amex',
  amex: 'amex',
  bankofbaroda: 'bob',
  bob: 'bob',
}

function canonicalBank(value: string): string {
  const raw = normalize(value)
  if (BANK_ALIASES[raw]) return BANK_ALIASES[raw]
  return raw.replace(/(bank|cards|card|limited|ltd)+$/g, '')
}

export interface RailWalletCardIdentity {
  bank: string
  cardName: string
}

/**
 * Resolve a wallet card to the exact CreditIQ catalogue slug used by the
 * redemption-rail registry.
 *
 * This intentionally reuses the conservative card-name resolver that already
 * powers flight transfer matching. If that resolver refuses an ambiguous card,
 * this function also refuses it. We never fall back to "same bank".
 */
export function resolveRailCardId(card: RailWalletCardIdentity): string | null {
  const resolved = resolveCardCurrency(card.bank, card.cardName)
  if (!resolved) return null

  // `resolveCardCurrency` may return a synthetic routing-bank label for cards
  // whose transfer graph node is intentionally product-specific (Axis Atlas is
  // the current example). That routing label must never be mistaken for the
  // catalogue issuer. The matched card name is already conservatively resolved,
  // so bind it back to the catalogue using the caller's original issuer.
  const targetName = normalize(resolved.matchedCardName)
  const targetBank = canonicalBank(card.bank)
  const seed = SEED_CARDS.find((candidate) =>
    normalize(candidate.name) === targetName && canonicalBank(candidate.bank) === targetBank,
  )

  return seed?.id ?? null
}

export function resolveRailCardIds(cards: RailWalletCardIdentity[]): string[] {
  const ids = new Set<string>()
  for (const card of cards) {
    const id = resolveRailCardId(card)
    if (id) ids.add(id)
  }
  return [...ids]
}

import { SEED_CARDS } from '@/lib/data/seed-cards'
import { resolveCardCurrency } from '@/lib/transfer-map'

function normalize(value: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
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

  const targetName = normalize(resolved.matchedCardName)
  const targetBank = normalize(resolved.bank)
  const seed = SEED_CARDS.find((candidate) =>
    normalize(candidate.name) === targetName && normalize(candidate.bank) === targetBank,
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

import type { TravelKind, RedemptionRailDefinition } from './types'
import { cashRetainRail, queryRails } from './registry'
import { resolveRailCardId } from './card-resolver'
import { supplementalRailsForCard } from './supplemental-rails'

export type WalletRailStatus =
  | 'EXECUTABLE'
  | 'VERIFICATION_REQUIRED'
  | 'DISCOVERY_ONLY'
  | 'NO_VERIFIED_REDEMPTION_RAIL'

export interface WalletRailCardInput {
  walletKey: string
  bank: string
  cardName: string
  pointsBalance?: number | null
  balanceVerified?: boolean
}

export interface WalletRailCardResult {
  walletKey: string
  bank: string
  cardName: string
  cardId: string | null
  pointsBalance: number | null
  balanceVerified: boolean
  status: WalletRailStatus
  rails: RedemptionRailDefinition[]
}

export interface WalletRailMatrix {
  travelKind: TravelKind
  programmeId: string | null
  cards: WalletRailCardResult[]
  cashRail: RedemptionRailDefinition
}

function statusFor(rails: RedemptionRailDefinition[]): WalletRailStatus {
  if (rails.some((rail) => rail.executionState === 'EXECUTABLE')) return 'EXECUTABLE'
  if (rails.some((rail) => rail.executionState === 'RATIO_ONLY' || rail.executionState === 'CHECKOUT_REQUIRED')) {
    return 'VERIFICATION_REQUIRED'
  }
  if (rails.some((rail) => rail.executionState === 'DISCOVERY_ONLY')) return 'DISCOVERY_ONLY'
  return 'NO_VERIFIED_REDEMPTION_RAIL'
}

function railIdentity(rail: RedemptionRailDefinition) {
  if (rail.type === 'LOYALTY_TRANSFER') return `${rail.type}:${rail.transfer?.programmeId || rail.bookingDestination || rail.id}`
  return `${rail.type}:${rail.bookingDestination || rail.portal?.portalName || rail.voucher?.merchant || rail.id}`
}

function mergedRails(cardId: string, travelKind: TravelKind, programmeId: string | null) {
  const merged = new Map<string, RedemptionRailDefinition>()

  // Supplemental rails are deliberately inserted first: when a broad catalogue
  // fallback and a newer issuer-sourced rail describe the same path, the richer
  // issuer-sourced definition wins rather than showing a duplicate.
  for (const rail of supplementalRailsForCard(cardId, travelKind, programmeId)) {
    merged.set(railIdentity(rail), rail)
  }
  for (const rail of queryRails({ cardId, travelKind, programmeId })) {
    const key = railIdentity(rail)
    if (!merged.has(key)) merged.set(key, rail)
  }

  return [...merged.values()]
}

/**
 * Enumerate every sourced travel-redemption rail for every card in the wallet.
 *
 * This layer intentionally DOES NOT rank economic value or calculate an exact
 * transfer instruction. It only answers: "what sourced ways could this exact
 * card participate in this flight/hotel decision?"
 *
 * Financial arithmetic remains in the redemption engine. A card is never
 * dropped merely because its exact catalogue identity or travel rail is not yet
 * known; it stays visible with NO_VERIFIED_REDEMPTION_RAIL.
 */
export function buildWalletRailMatrix(
  cards: WalletRailCardInput[],
  travelKind: TravelKind,
  programmeId?: string | null,
): WalletRailMatrix {
  const seenWalletKeys = new Set<string>()
  const cardResults: WalletRailCardResult[] = []

  for (const card of cards) {
    if (!card.walletKey || seenWalletKeys.has(card.walletKey)) continue
    seenWalletKeys.add(card.walletKey)

    const cardId = resolveRailCardId({ bank: card.bank, cardName: card.cardName })
    const rails = cardId
      ? mergedRails(cardId, travelKind, programmeId ?? null)
      : []

    cardResults.push({
      walletKey: card.walletKey,
      bank: card.bank,
      cardName: card.cardName,
      cardId,
      pointsBalance: Number.isFinite(card.pointsBalance) ? Number(card.pointsBalance) : null,
      balanceVerified: card.balanceVerified === true,
      status: statusFor(rails),
      rails,
    })
  }

  return {
    travelKind,
    programmeId: programmeId ?? null,
    cards: cardResults,
    cashRail: cashRetainRail(travelKind),
  }
}

export function allRailsFromMatrix(matrix: WalletRailMatrix): RedemptionRailDefinition[] {
  const unique = new Map<string, RedemptionRailDefinition>()
  for (const card of matrix.cards) {
    for (const rail of card.rails) unique.set(rail.id, rail)
  }
  unique.set(matrix.cashRail.id, matrix.cashRail)
  return [...unique.values()]
}

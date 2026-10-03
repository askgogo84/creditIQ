import { buildWalletRailMatrix } from '@/lib/redemption-rails/matrix'
import type { RedemptionRailDefinition } from '@/lib/redemption-rails/types'

/** Evidence inventory only. A mapped or executable rail is not a live booking. */
export function cardRedemptionCoverage(card: { bank: string; cardName: string | null; points: number | null }) {
  if (!card.cardName) return []
  const input = [{ walletKey: 'coverage', bank: card.bank, cardName: card.cardName, pointsBalance: card.points }]
  const rails = new Map<string, RedemptionRailDefinition>()
  for (const kind of ['flight', 'hotel'] as const) {
    for (const rail of buildWalletRailMatrix(input, kind).cards[0]?.rails || []) rails.set(rail.id, rail)
  }
  return [...rails.values()].map(rail => {
    const missing = [] as string[]
    if (card.points === null) missing.push('Current card balance')
    if (rail.transfer) {
      if (rail.transfer.minimumBankPoints === null) missing.push('Issuer transfer minimum')
      if (rail.transfer.incrementBankPoints === null) missing.push('Issuer transfer increment')
      if (!rail.transfer.durationText) missing.push('Transfer timing')
      missing.push('Current programme balance and live award availability')
    }
    if (rail.executionState === 'DISCOVERY_ONLY') missing.push('Sourced redemption mechanics')
    if (rail.executionState === 'CHECKOUT_REQUIRED') missing.push('Issuer checkout terms')
    missing.push('Final price, taxes and booking terms')
    return { id: rail.id, name: rail.transfer?.programmeName || rail.bookingDestination || rail.portal?.portalName || rail.id,
      type: rail.type, evidenceState: rail.executionState, bookingReady: false as const,
      ratio: rail.transfer?.ratio ?? null, missing, sources: rail.evidence,
      bookingUrl: rail.bookingUrl ?? null }
  })
}

import type { RankedRailCandidate } from '@/lib/redemption-ranking'
import type { RedemptionRailDefinition } from '@/lib/redemption-rails/types'
import type { TravelDecisionContract } from '@/lib/travel/decision-contract'

export type SearchRedemptionVerdict =
  | 'PAY_CASH'
  | 'USE_POINTS'
  | 'POINTS_PLUS_CASH'
  | 'VERIFY_AWARD'
  | 'VERIFY_REDEMPTION'
  | 'NO_SAFE_ACTION'

export type SearchRedemptionOptionState =
  | 'EXECUTABLE'
  | 'PROJECTED_NEEDS_VERIFICATION'
  | 'DISCOVERY_ONLY'
  | 'NOT_COMPARABLE'

export interface SearchRedemptionOption {
  id: string
  label: string
  cardName: string | null
  bank: string | null
  railType: RankedRailCandidate['railType']
  state: SearchRedemptionOptionState
  affordability: RankedRailCandidate['affordability']
  bankPointsRequired: number | null
  cashPayableMinor: number | null
  cashCurrency: string | null
  savingsVsCashMinor: number | null
  valuePerBankPointInr: number | null
  reasons: string[]
  isBestProjected: boolean
  isBestExecutable: boolean
}

export interface SearchRedemptionSummary {
  verdict: SearchRedemptionVerdict
  verdictLabel: string
  headline: string
  bestPath: SearchRedemptionOption | null
  bestExecutable: SearchRedemptionOption | null
  bestProjected: SearchRedemptionOption | null
  alternatives: SearchRedemptionOption[]
  cash: {
    amountMinor: number | null
    currency: string | null
  }
  award: {
    status: TravelDecisionContract['awardState']['status']
    programmeId: string | null
    pointsRequired: number | null
    taxesMinor: number | null
    taxesCurrency: string | null
  }
  requiresLiveReverification: boolean
  blockedReasons: string[]
}

function railForCandidate(decision: TravelDecisionContract, candidate: RankedRailCandidate): RedemptionRailDefinition | null {
  if (candidate.railType === 'CASH_RETAIN') return decision.wallet.matrix.cashRail
  for (const card of decision.wallet.matrix.cards) {
    const rail = card.rails.find((item) => item.id === candidate.railId)
    if (rail) return rail
  }
  return null
}

function programmeFallback(programmeId: string | null): string {
  if (!programmeId) return 'loyalty programme'
  return programmeId
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function candidateLabel(
  decision: TravelDecisionContract,
  candidate: RankedRailCandidate,
  programmeName?: string | null,
): string {
  const rail = railForCandidate(decision, candidate)
  if (candidate.railType === 'CASH_RETAIN') return 'Pay cash · keep your points'
  if (candidate.railType === 'LOYALTY_TRANSFER') {
    const destination = rail?.transfer?.programmeName || programmeName || programmeFallback(decision.awardState.programmeId)
    return `${candidate.cardName} → ${destination}`
  }
  if (candidate.railType === 'BANK_TRAVEL_PORTAL') {
    return `${candidate.cardName} · ${rail?.portal?.portalName || rail?.bookingDestination || 'bank travel portal'}`
  }
  if (candidate.railType === 'MERCHANT_PAY_WITH_POINTS') {
    return `${candidate.cardName} · ${rail?.portal?.portalName || rail?.bookingDestination || 'Points + Cash'}`
  }
  if (candidate.railType === 'TRAVEL_VOUCHER') {
    return `${candidate.cardName} · ${rail?.voucher?.merchant || rail?.bookingDestination || 'travel voucher'}`
  }
  if (candidate.railType === 'COBRAND_NATIVE') {
    return `${candidate.cardName} · ${rail?.bookingDestination || programmeName || 'native loyalty points'}`
  }
  return `${candidate.cardName} · ${rail?.bookingDestination || candidate.railType.replaceAll('_', ' ').toLowerCase()}`
}

function candidateToOption(
  decision: TravelDecisionContract,
  candidate: RankedRailCandidate,
  programmeName?: string | null,
): SearchRedemptionOption {
  const cashMinor = decision.wallet.ranking.pricing.cashPriceMinor
  const cashCurrency = decision.wallet.ranking.pricing.cashCurrency?.toUpperCase() || null
  const candidateCurrency = candidate.cashCurrency?.toUpperCase() || null
  const comparableCash = cashMinor != null && cashCurrency && candidate.cashPayableMinor != null && candidateCurrency === cashCurrency
  const savings = comparableCash ? cashMinor - candidate.cashPayableMinor! : null
  const points = candidate.bankPointsToTransferExact ?? candidate.bankPointsTargetMinimum
  const valuePerPoint = savings != null && savings > 0 && points != null && points > 0
    ? (savings / 100) / points
    : null

  return {
    id: candidate.id,
    label: candidateLabel(decision, candidate, programmeName),
    cardName: candidate.walletKey ? candidate.cardName : null,
    bank: candidate.walletKey ? candidate.bank : null,
    railType: candidate.railType,
    state: candidate.comparisonState,
    affordability: candidate.affordability,
    bankPointsRequired: points,
    cashPayableMinor: candidate.cashPayableMinor,
    cashCurrency: candidate.cashCurrency,
    savingsVsCashMinor: savings,
    valuePerBankPointInr: valuePerPoint,
    reasons: candidate.reasons,
    isBestProjected: decision.wallet.projectedWinner?.id === candidate.id,
    isBestExecutable: decision.wallet.executableWinner?.id === candidate.id,
  }
}

function verdictFor(decision: TravelDecisionContract, recommended: RankedRailCandidate | null): SearchRedemptionVerdict {
  const state = decision.wallet.ranking.recommendationState
  if (state === 'NO_COMPARABLE_PATH') return 'NO_SAFE_ACTION'
  if (state === 'CASH_ONLY' || recommended?.railType === 'CASH_RETAIN') return 'PAY_CASH'

  if (state === 'PROJECTED_WINNER_NEEDS_VERIFICATION') {
    if (decision.awardState.status === 'DISCOVERY_ONLY') return 'VERIFY_AWARD'
    return 'VERIFY_REDEMPTION'
  }

  if (!recommended) return 'NO_SAFE_ACTION'
  return (recommended.cashPayableMinor ?? 0) > 0 ? 'POINTS_PLUS_CASH' : 'USE_POINTS'
}

function verdictCopy(verdict: SearchRedemptionVerdict): { label: string; headline: string } {
  if (verdict === 'PAY_CASH') return { label: 'Pay cash', headline: 'Cash is the best executable option right now' }
  if (verdict === 'USE_POINTS') return { label: 'Use points', headline: 'A verified points path is executable' }
  if (verdict === 'POINTS_PLUS_CASH') return { label: 'Points + cash', headline: 'A verified points + cash path is executable' }
  if (verdict === 'VERIFY_AWARD') return { label: 'Verify award first', headline: 'A promising redemption exists, but the award is discovery-only' }
  if (verdict === 'VERIFY_REDEMPTION') return { label: 'Verify redemption', headline: 'A projected redemption may beat cash after verification' }
  return { label: 'No safe action yet', headline: 'CreditIQ cannot establish a safe economic winner yet' }
}

/**
 * Convert the canonical travel-decision-v1 object into the compact object every
 * search surface needs: cash, the best redemption, all other sourced routes,
 * wallet affordability, projected value and a safe verdict.
 *
 * This is presentation shaping only. It never invents portal economics, award
 * taxes, FX, transfer minimums/increments or programme availability. A cached
 * award can only produce VERIFY_AWARD; it can never produce USE_POINTS.
 */
export function buildSearchRedemptionSummary(
  decision: TravelDecisionContract,
  options: { programmeName?: string | null } = {},
): SearchRedemptionSummary {
  const candidates = decision.wallet.ranking.candidates.map((candidate) =>
    candidateToOption(decision, candidate, options.programmeName),
  )

  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]))
  const bestProjected = decision.wallet.projectedWinner ? byId.get(decision.wallet.projectedWinner.id) ?? null : null
  const bestExecutable = decision.wallet.executableWinner ? byId.get(decision.wallet.executableWinner.id) ?? null : null
  const recommendedRaw = decision.wallet.ranking.recommendationState === 'PROJECTED_WINNER_NEEDS_VERIFICATION'
    ? decision.wallet.projectedWinner
    : decision.wallet.executableWinner
  const bestPath = recommendedRaw ? byId.get(recommendedRaw.id) ?? null : null
  const verdict = verdictFor(decision, recommendedRaw)
  const copy = verdictCopy(verdict)

  const alternatives = [...candidates].sort((a, b) => {
    const bestA = a.id === bestPath?.id ? 0 : a.isBestExecutable ? 1 : a.isBestProjected ? 2 : 3
    const bestB = b.id === bestPath?.id ? 0 : b.isBestExecutable ? 1 : b.isBestProjected ? 2 : 3
    if (bestA !== bestB) return bestA - bestB
    const stateOrder: Record<SearchRedemptionOptionState, number> = {
      EXECUTABLE: 0,
      PROJECTED_NEEDS_VERIFICATION: 1,
      DISCOVERY_ONLY: 2,
      NOT_COMPARABLE: 3,
    }
    if (stateOrder[a.state] !== stateOrder[b.state]) return stateOrder[a.state] - stateOrder[b.state]
    return a.label.localeCompare(b.label)
  })

  return {
    verdict,
    verdictLabel: copy.label,
    headline: copy.headline,
    bestPath,
    bestExecutable,
    bestProjected,
    alternatives,
    cash: {
      amountMinor: decision.wallet.ranking.pricing.cashPriceMinor,
      currency: decision.wallet.ranking.pricing.cashCurrency,
    },
    award: {
      status: decision.awardState.status,
      programmeId: decision.awardState.programmeId,
      pointsRequired: decision.awardState.pointsRequired,
      taxesMinor: decision.awardState.taxesMinor,
      taxesCurrency: decision.awardState.taxesCurrency,
    },
    requiresLiveReverification: decision.conciergeAction.requiresLiveReverification,
    blockedReasons: decision.blockedReasons,
  }
}

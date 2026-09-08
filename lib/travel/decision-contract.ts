import { rankWalletRails, type RailRankingResult, type RankedRailCandidate, type SelectedTravelPricing } from '@/lib/redemption-ranking'
import type { WalletRailMatrix } from '@/lib/redemption-rails/matrix'

export type TravelDecisionAwardStatus =
  | 'LIVE_OR_PROVIDER_RETURNED'
  | 'DISCOVERY_ONLY'
  | 'NOT_FOUND'
  | 'NOT_APPLICABLE'
  | 'UNAVAILABLE'

export type TravelDecisionInstructionState =
  | 'EXECUTABLE_PATH_AVAILABLE'
  | 'PROJECTED_PATH_NEEDS_VERIFICATION'
  | 'CASH_ONLY'
  | 'NO_SAFE_ACTION'

export interface TravelDecisionContract {
  version: 'travel-decision-v1'
  travelKind: 'flight' | 'hotel'
  inventory: {
    state: 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN'
    selection: Record<string, unknown>
  }
  awardState: {
    status: TravelDecisionAwardStatus
    programmeId: string | null
    pointsRequired: number | null
    taxesMinor: number | null
    taxesCurrency: string | null
  }
  sourceAuthority: {
    cash: string | null
    award: string | null
    awardPricingAuthority: string | null
    railPolicy: 'inventory-first-card-exact-no-bank-inheritance'
  }
  wallet: {
    matrix: WalletRailMatrix
    ranking: RailRankingResult
    projectedWinner: RankedRailCandidate | null
    executableWinner: RankedRailCandidate | null
  }
  blockedReasons: string[]
  provenance: Record<string, unknown>
  conciergeAction: {
    state: 'READY_FOR_OPERATOR_VERIFICATION' | 'CASH_ONLY' | 'BLOCKED'
    instructionState: TravelDecisionInstructionState
    recommendedCandidateId: string | null
    requiresLiveReverification: boolean
    irreversibleTransferAllowed: false
  }
  generatedAt: string
}

export type BuildTravelDecisionContractInput = {
  matrix: WalletRailMatrix
  pricing: SelectedTravelPricing
  inventory?: TravelDecisionContract['inventory']
  awardStatus?: TravelDecisionAwardStatus
  cashSource?: string | null
  awardSource?: string | null
  awardPricingAuthority?: string | null
  provenance?: Record<string, unknown>
  generatedAt?: string
}

function uniqueReasons(values: Array<string | null | undefined>): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const raw of values) {
    const value = raw?.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out
}

function blockedReasons(ranking: RailRankingResult): string[] {
  const reasons: Array<string | null | undefined> = []

  if (ranking.pricing.programmePointsRequired != null && ranking.pricing.awardTaxesMinor == null) {
    reasons.push('Award taxes/cash component are unavailable; final award economics require verification.')
  }

  if (ranking.recommendationState === 'PROJECTED_WINNER_NEEDS_VERIFICATION') {
    reasons.push('The best projected wallet path still needs issuer or checkout verification before it can become an exact instruction.')
    reasons.push(...(ranking.bestProjected?.reasons ?? []))
  }

  if (ranking.recommendationState === 'NO_COMPARABLE_PATH') {
    reasons.push('No safe economic winner can be established from the currently sourced cash, award and wallet facts.')
    for (const candidate of ranking.candidates) {
      if (candidate.comparisonState === 'NOT_COMPARABLE') reasons.push(...candidate.reasons)
    }
  }

  if (ranking.unsupportedWalletCards.length) {
    reasons.push(`${ranking.unsupportedWalletCards.length} wallet card${ranking.unsupportedWalletCards.length === 1 ? '' : 's'} could not be mapped to an exact sourced redemption rail.`)
  }

  return uniqueReasons(reasons)
}

function instructionState(ranking: RailRankingResult): TravelDecisionInstructionState {
  if (ranking.recommendationState === 'NO_COMPARABLE_PATH') return 'NO_SAFE_ACTION'
  if (ranking.recommendationState === 'PROJECTED_WINNER_NEEDS_VERIFICATION') return 'PROJECTED_PATH_NEEDS_VERIFICATION'
  if (ranking.recommendationState === 'CASH_ONLY') return 'CASH_ONLY'
  return 'EXECUTABLE_PATH_AVAILABLE'
}

/**
 * Canonical server-safe travel decision object.
 *
 * Inventory, award evidence, wallet rail enumeration and economic ranking are
 * assembled once here so web/mobile/AskGogo/Concierge can consume the same
 * decision without re-implementing the arithmetic. The contract never promotes
 * a projected transfer to an executable instruction and never authorises an
 * irreversible points movement.
 */
export function buildTravelDecisionContract(input: BuildTravelDecisionContractInput): TravelDecisionContract {
  const ranking = rankWalletRails(input.matrix, input.pricing)
  const state = instructionState(ranking)
  const recommended = state === 'PROJECTED_PATH_NEEDS_VERIFICATION'
    ? ranking.bestProjected
    : ranking.bestExecutable

  return {
    version: 'travel-decision-v1',
    travelKind: input.pricing.travelKind,
    inventory: input.inventory ?? { state: 'UNKNOWN', selection: {} },
    awardState: {
      status: input.awardStatus ?? (input.pricing.programmePointsRequired == null ? 'NOT_APPLICABLE' : 'UNAVAILABLE'),
      programmeId: input.pricing.programmeId,
      pointsRequired: input.pricing.programmePointsRequired,
      taxesMinor: input.pricing.awardTaxesMinor,
      taxesCurrency: input.pricing.awardTaxesCurrency,
    },
    sourceAuthority: {
      cash: input.cashSource ?? null,
      award: input.awardSource ?? null,
      awardPricingAuthority: input.awardPricingAuthority ?? null,
      railPolicy: 'inventory-first-card-exact-no-bank-inheritance',
    },
    wallet: {
      matrix: input.matrix,
      ranking,
      projectedWinner: ranking.bestProjected,
      executableWinner: ranking.bestExecutable,
    },
    blockedReasons: blockedReasons(ranking),
    provenance: input.provenance ?? {},
    conciergeAction: {
      state: state === 'NO_SAFE_ACTION' ? 'BLOCKED' : state === 'CASH_ONLY' ? 'CASH_ONLY' : 'READY_FOR_OPERATOR_VERIFICATION',
      instructionState: state,
      recommendedCandidateId: recommended?.id ?? null,
      requiresLiveReverification: input.pricing.programmePointsRequired != null,
      irreversibleTransferAllowed: false,
    },
    generatedAt: input.generatedAt ?? new Date().toISOString(),
  }
}

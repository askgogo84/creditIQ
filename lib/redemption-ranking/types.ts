import type { RedemptionRailType, RailExecutionState, WalletRailMatrix } from '@/lib/redemption-rails'

export type RailComparisonState =
  | 'EXECUTABLE'
  | 'PROJECTED_NEEDS_VERIFICATION'
  | 'DISCOVERY_ONLY'
  | 'NOT_COMPARABLE'

export type RailAffordability =
  | 'AFFORDABLE'
  | 'POSSIBLY_AFFORDABLE'
  | 'DEFINITELY_UNAFFORDABLE'
  | 'UNKNOWN'

export interface SelectedTravelPricing {
  travelKind: 'flight' | 'hotel'
  programmeId: string | null
  /** Award/loyalty currency required for the selected inventory item. */
  programmePointsRequired: number | null
  /** Cash component of the award. Null means provider did not supply it. */
  awardTaxesMinor: number | null
  awardTaxesCurrency: string | null
  /** Matched cash alternative for the same inventory item / comparable itinerary. */
  cashPriceMinor: number | null
  cashCurrency: string | null
}

export interface RankedRailCandidate {
  id: string
  walletKey: string | null
  bank: string
  cardName: string
  railId: string
  railType: RedemptionRailType
  railExecutionState: RailExecutionState
  comparisonState: RailComparisonState
  affordability: RailAffordability
  bankPointsTargetMinimum: number | null
  bankPointsToTransferExact: number | null
  cashPayableMinor: number | null
  cashCurrency: string | null
  reasons: string[]
}

export type RankingRecommendationState =
  | 'EXECUTABLE_WINNER'
  | 'PROJECTED_WINNER_NEEDS_VERIFICATION'
  | 'CASH_ONLY'
  | 'NO_COMPARABLE_PATH'

export interface RailRankingResult {
  pricing: SelectedTravelPricing
  matrix: WalletRailMatrix
  candidates: RankedRailCandidate[]
  bestExecutable: RankedRailCandidate | null
  bestProjected: RankedRailCandidate | null
  recommendationState: RankingRecommendationState
  unsupportedWalletCards: Array<{
    walletKey: string
    bank: string
    cardName: string
  }>
}

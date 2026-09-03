import type { FlightAwardSearchQuery } from '@/lib/award-inventory/types'

export type PublishedAwardFareTier = 'VALUE' | 'PRIME'

export interface PublishedAwardTier {
  id: PublishedAwardFareTier
  label: string
  pointsMin: number
  pointsMax: number
}

export interface PublishedFlightAwardGuide {
  programmeId: string
  programmeName: string
  origin: string
  destination: string
  cabin: FlightAwardSearchQuery['cabin']
  tripType: 'ONE_WAY'
  passengerScope: 'PER_PASSENGER'
  tiers: [PublishedAwardTier, PublishedAwardTier]
  taxesState: 'NOT_PUBLISHED'
  authority: 'PLANNING_ONLY'
  evidence: {
    sourceKind: 'PROGRAMME_CALCULATOR'
    sourceUrl: string
    capturedAt: string
    caveat: string
  }
}

export interface PublishedFlightAwardGuideQuery {
  programmeId: string
  origin: string
  destination: string
  cabin: FlightAwardSearchQuery['cabin']
}

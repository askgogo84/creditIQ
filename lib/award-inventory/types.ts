export type AwardInventoryKind = 'flight' | 'hotel'
export type AwardFreshness = 'LIVE' | 'CACHED' | 'CAPTURED'

export interface AwardProviderEvidence {
  provider: string
  freshness: AwardFreshness
  fetchedAt: string
  sourceUrl?: string
}

export interface HotelAwardProperty {
  providerPropertyId: string
  programmeId: string
  programmeHotelId: string | null
  name: string
  brand: string | null
  subBrand: string | null
  formattedAddress: string | null
  latitude: number | null
  longitude: number | null
  imageUrl: string | null
  awardAvailabilityPercent: number | null
  observedCashMin: number | null
  observedCashMedian: number | null
  observedCashMax: number | null
  observedPointsMin: number | null
  observedPointsMedian: number | null
  observedPointsMax: number | null
  updatedAt: string | null
  evidence: AwardProviderEvidence
}

export interface HotelAwardNight {
  propertyId: string
  programmeId: string
  checkInDate: string
  checkOutDate: string | null
  roomType: string | null
  ratePlan: string | null
  points: number
  cashMinor: number | null
  cashCurrency: string | null
  bookingUrl: string | null
  evidence: AwardProviderEvidence
}

export interface HotelAwardPropertyQuery {
  destination?: string | null
  programmeIds?: string[]
}

export interface HotelAwardProvider {
  readonly id: string
  readonly freshness: AwardFreshness
  isConfigured(): boolean
  listSupportedProperties(query?: HotelAwardPropertyQuery): Promise<HotelAwardProperty[]>
}

export interface FlightAwardSearchQuery {
  origin: string
  destination: string
  date: string
  cabin: 'economy' | 'premium-economy' | 'business' | 'first'
  adults: number
  programmeIds?: string[]
}

export interface FlightAwardOption {
  providerResultId: string
  programmeId: string
  origin: string
  destination: string
  departureAt: string | null
  arrivalAt: string | null
  cabin: string
  miles: number
  taxesMinor: number | null
  taxesCurrency: string | null
  segments: Array<{
    flightNumber: string | null
    origin: string
    destination: string
    departureAt: string | null
    arrivalAt: string | null
  }>
  evidence: AwardProviderEvidence
}

export interface FlightAwardProvider {
  readonly id: string
  readonly freshness: AwardFreshness
  isConfigured(): boolean
  search(query: FlightAwardSearchQuery): Promise<FlightAwardOption[]>
}

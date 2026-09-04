export type TravelProviderKind = 'cash-flight' | 'award-flight' | 'cash-hotel' | 'award-hotel'

export type ProviderStatus = 'configured' | 'waiting-access' | 'not-configured'

export type TravelProviderDefinition = {
  id: string
  name: string
  kinds: TravelProviderKind[]
  priority: number
  env: string[]
  access: 'active' | 'applied' | 'commercial'
  note: string
}

export const TRAVEL_PROVIDERS: TravelProviderDefinition[] = [
  {
    id: 'skyscanner-flights',
    name: 'Skyscanner Flights Live Prices',
    kinds: ['cash-flight'],
    priority: 10,
    env: ['SKYSCANNER_API_KEY'],
    access: 'applied',
    note: 'Primary live cash-flight source. Create + poll flow returns real-time bookable inventory and cabin-specific searches.',
  },
  {
    id: 'amadeus',
    name: 'Amadeus Travel APIs',
    kinds: ['cash-flight', 'cash-hotel'],
    priority: 20,
    env: ['AMADEUS_CLIENT_ID', 'AMADEUS_CLIENT_SECRET'],
    access: 'applied',
    note: 'Flight shopping/pricing and hotel availability fallback. Uses OAuth client credentials.',
  },
  {
    id: 'kiwi',
    name: 'Kiwi Tequila',
    kinds: ['cash-flight'],
    priority: 30,
    env: ['KIWI_TEQUILA_API_KEY'],
    access: 'commercial',
    note: 'Legacy invited-partner flight inventory source. Only used when a valid partnership key is configured.',
  },
  {
    id: 'travelpayouts',
    name: 'Travelpayouts / Aviasales',
    kinds: ['cash-flight'],
    priority: 90,
    env: ['TRAVELPAYOUTS_TOKEN'],
    access: 'active',
    note: 'Last-resort dated cached-fare discovery. Not complete live itinerary inventory and not cabin-verifiable.',
  },
  {
    id: 'awardtool',
    name: 'AwardTool',
    kinds: ['award-flight', 'award-hotel'],
    priority: 10,
    env: ['AWARDTOOL_API_KEY'],
    access: 'applied',
    note: 'Commercial award search target for real-time flights, broad discovery and hotel points inventory.',
  },
  {
    id: 'pointsyeah',
    name: 'PointsYeah',
    kinds: ['award-flight', 'award-hotel'],
    priority: 20,
    env: ['POINTSYEAH_API_KEY'],
    access: 'applied',
    note: 'Commercial award search target covering flight and hotel loyalty programmes.',
  },
  {
    id: 'seats-aero',
    name: 'Seats.aero',
    kinds: ['award-flight'],
    priority: 30,
    env: ['SEATS_AERO_API_KEY'],
    access: 'active',
    note: 'Current award-flight discovery provider. Kept as an independent source in the fusion layer.',
  },
  {
    id: 'booking-demand',
    name: 'Booking.com Demand API',
    kinds: ['cash-hotel'],
    priority: 10,
    env: ['BOOKING_DEMAND_API_TOKEN', 'BOOKING_AFFILIATE_ID'],
    access: 'applied',
    note: 'Primary global cash-hotel target for search, availability, property content and redirect/booking flows.',
  },
  {
    id: 'skyscanner-hotels',
    name: 'Skyscanner Hotels Live Prices',
    kinds: ['cash-hotel'],
    priority: 20,
    env: ['SKYSCANNER_API_KEY'],
    access: 'applied',
    note: 'Already implemented in CreditIQ; activates automatically when SKYSCANNER_API_KEY is configured.',
  },
]

export function travelProviderStatus(provider: TravelProviderDefinition): ProviderStatus {
  const configured = provider.env.every(name => Boolean(process.env[name]))
  if (configured) return 'configured'
  if (provider.access === 'applied') return 'waiting-access'
  return 'not-configured'
}

export function providerDiagnostics() {
  return TRAVEL_PROVIDERS
    .slice()
    .sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name))
    .map(provider => ({
      id: provider.id,
      name: provider.name,
      kinds: provider.kinds,
      priority: provider.priority,
      status: travelProviderStatus(provider),
      required_env: provider.env,
      note: provider.note,
    }))
}

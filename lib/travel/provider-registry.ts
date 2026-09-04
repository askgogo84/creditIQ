export type TravelProviderKind = 'cash-flight' | 'award-flight' | 'cash-hotel' | 'award-hotel'

export type ProviderStatus = 'configured' | 'waiting-access' | 'waiting-integration' | 'not-configured'

export type TravelProviderDefinition = {
  id: string
  name: string
  kinds: TravelProviderKind[]
  priority: number
  env: string[]
  access: 'active' | 'applied' | 'commercial'
  wired: boolean
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
    wired: true,
    note: 'Primary live cash-flight source. Create + poll adapter is wired for cabin-specific inventory and activates when access is approved.',
  },
  {
    id: 'amadeus-flights',
    name: 'Amadeus Flight Offers',
    kinds: ['cash-flight'],
    priority: 20,
    env: ['AMADEUS_CLIENT_ID', 'AMADEUS_CLIENT_SECRET'],
    access: 'applied',
    wired: true,
    note: 'Cabin-specific Flight Offers adapter is wired with OAuth token caching. It defaults to TEST unless production is explicitly enabled.',
  },
  {
    id: 'kiwi',
    name: 'Kiwi Tequila',
    kinds: ['cash-flight'],
    priority: 30,
    env: ['KIWI_TEQUILA_API_KEY'],
    access: 'commercial',
    wired: true,
    note: 'Legacy invited-partner flight inventory source. Only used when a valid partnership key is configured.',
  },
  {
    id: 'travelpayouts',
    name: 'Travelpayouts / Aviasales',
    kinds: ['cash-flight'],
    priority: 90,
    env: ['TRAVELPAYOUTS_TOKEN'],
    access: 'active',
    wired: true,
    note: 'Working last-resort dated cached-fare discovery. Not complete live itinerary inventory and not cabin-verifiable.',
  },
  {
    id: 'awardtool',
    name: 'AwardTool',
    kinds: ['award-flight', 'award-hotel'],
    priority: 10,
    env: ['AWARDTOOL_API_KEY'],
    access: 'applied',
    wired: false,
    note: 'Commercial access requested. Adapter will be finalized against the credentials/schema supplied with partner access; CreditIQ will not guess a private API contract.',
  },
  {
    id: 'pointsyeah',
    name: 'PointsYeah',
    kinds: ['award-flight', 'award-hotel'],
    priority: 20,
    env: ['POINTSYEAH_API_KEY'],
    access: 'applied',
    wired: false,
    note: 'Commercial access requested. Flight/hotel award adapter remains intentionally unwired until partner API access confirms the production schema.',
  },
  {
    id: 'seats-aero',
    name: 'Seats.aero',
    kinds: ['award-flight'],
    priority: 30,
    env: ['SEATS_AERO_API_KEY'],
    access: 'active',
    wired: true,
    note: 'Current working award-flight discovery provider. Kept as an independent source in the fusion layer.',
  },
  {
    id: 'booking-demand',
    name: 'Booking.com Demand API v3.2',
    kinds: ['cash-hotel'],
    priority: 10,
    env: ['BOOKING_DEMAND_API_TOKEN', 'BOOKING_AFFILIATE_ID'],
    access: 'applied',
    wired: true,
    note: 'Global cash-hotel search/look/redirect adapter is wired. It defaults to Booking.com sandbox until production is explicitly enabled.',
  },
  {
    id: 'skyscanner-hotels',
    name: 'Skyscanner Hotels Live Prices',
    kinds: ['cash-hotel'],
    priority: 20,
    env: ['SKYSCANNER_API_KEY'],
    access: 'applied',
    wired: true,
    note: 'Existing pageable global hotel adapter. Activates automatically when SKYSCANNER_API_KEY is configured.',
  },
  {
    id: 'amadeus-hotels',
    name: 'Amadeus Hotels',
    kinds: ['cash-hotel'],
    priority: 30,
    env: ['AMADEUS_CLIENT_ID', 'AMADEUS_CLIENT_SECRET'],
    access: 'applied',
    wired: false,
    note: 'Requested in the Amadeus Travel Sellers/Web Services application. Hotel adapter will be matched to the enterprise product/API contract they provision.',
  },
  {
    id: 'expedia-rapid',
    name: 'Expedia Rapid',
    kinds: ['cash-hotel'],
    priority: 40,
    env: ['EXPEDIA_RAPID_API_KEY', 'EXPEDIA_RAPID_SHARED_SECRET'],
    access: 'commercial',
    wired: false,
    note: 'Secondary global lodging supply target after primary hotel integrations are activated.',
  },
  {
    id: 'hbx-hotels',
    name: 'HBX / Hotelbeds',
    kinds: ['cash-hotel'],
    priority: 50,
    env: ['HBX_API_KEY', 'HBX_SECRET'],
    access: 'commercial',
    wired: false,
    note: 'Secondary bedbank target for broader hotel supply and future assisted-booking coverage.',
  },
]

export function travelProviderStatus(provider: TravelProviderDefinition): ProviderStatus {
  const credentialsPresent = provider.env.every(name => Boolean(process.env[name]))
  if (provider.wired && credentialsPresent) return 'configured'
  if (!provider.wired && credentialsPresent) return 'waiting-integration'
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
      wired: provider.wired,
      access: provider.access,
      required_env: provider.env,
      note: provider.note,
    }))
}

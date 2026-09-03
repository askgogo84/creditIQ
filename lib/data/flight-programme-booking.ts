/**
 * Direct programme booking destinations used as the final award-verification
 * boundary. These are intentionally programme keyed: provider/source codes are
 * not stable enough to decide where an irreversible transfer should end.
 */
const FLIGHT_PROGRAMME_BOOKING_URLS: Readonly<Record<string, string>> = {
  krisflyer: 'https://www.singaporeair.com/en_UK/us/ppsclub-krisflyer/use-miles/',
  'air-india-maharaja': 'https://www.airindia.com/in/en/loyalty/flying-returns.html',
  'british-airways-club': 'https://www.britishairways.com/travel/redeem/execclub/',
  'united-mileageplus': 'https://www.united.com/en/us/book-flight/united-award',
  aeroplan: 'https://www.aircanada.com/aeroplan/redeem/',
  'flying-blue': 'https://www.flyingblue.com/en/spend/flights',
  'etihad-guest': 'https://www.etihad.com/en-us/etihad-guest',
  'qatar-privilege-club': 'https://www.qatarairways.com/en/Privilege-Club/redeem-qmiles.html',
  cathay: 'https://www.cathaypacific.com/cx/en_IN/membership/redeem-flights.html',
  'turkish-miles-smiles': 'https://www.turkishairlines.com/en-int/miles-and-smiles/redeem-miles/',
}

export function flightProgrammeBookingUrl(programmeId: string | null | undefined): string | null {
  if (!programmeId) return null
  return FLIGHT_PROGRAMME_BOOKING_URLS[programmeId] ?? null
}


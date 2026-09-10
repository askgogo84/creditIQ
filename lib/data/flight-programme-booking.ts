/**
 * Direct programme booking destinations used as the final award-verification
 * boundary. These are intentionally programme keyed: provider/source codes are
 * not stable enough to decide where an irreversible transfer should end.
 */
const FLIGHT_PROGRAMME_BOOKING_URLS: Readonly<Record<string, string>> = {
  krisflyer: 'https://www.singaporeair.com/en_UK/us/ppsclub-krisflyer/use-miles/',
  'air-india-maharaja': 'https://www.airindia.com/in/en/maharaja-club/redeem-points.html',
  'airasia-rewards': 'https://www.airasia.com/rewards/',
  'indigo-bluchip': 'https://www.goindigo.in/loyalty/dashboard/how-to-burn-points.html',
  spiceclub: 'https://spiceclub.spicejet.com/',
  'british-airways-club': 'https://www.britishairways.com/travel/redeem/execclub/',
  'united-mileageplus': 'https://www.united.com/en/us/book-flight/united-award',
  aeroplan: 'https://www.aircanada.com/aeroplan/redeem/',
  'avianca-lifemiles': 'https://www.lifemiles.com/fly/find',
  'flying-blue': 'https://www.flyingblue.com/en/spend/flights',
  'etihad-guest': 'https://www.etihad.com/en/etihadguest/spend-miles',
  'qatar-privilege-club': 'https://www.qatarairways.com/en/Privilege-Club/redeem-qmiles.html',
  cathay: 'https://www.cathaypacific.com/cx/en_IN/membership/redeem-flights.html',
  'turkish-miles-smiles': 'https://www.turkishairlines.com/en-int/miles-and-smiles/redeem-miles/',
  finnair: 'https://www.finnair.com/en/finnair-plus/collect-and-use-avios/use-avios-on-finnair-award-flights',
  ethiopian: 'https://www.ethiopianairlines.com/aa/shebamiles',
  qantas: 'https://www.qantas.com/au/en/frequent-flyer/use-points/classic-flight-rewards.html',
  'jal-mileage-bank': 'https://www.jal.co.jp/jp/en/jalmile/use/flight/',
  'thai-royal-orchid': 'https://www.thaiairways.com/en-th/content/royal-orchid-plus/',
  lotusmiles: 'https://www.vietnamairlines.com/in/en/lotusmiles/redeem-mile/ticket-awards',
}

export function flightProgrammeBookingUrl(programmeId: string | null | undefined): string | null {
  if (!programmeId) return null
  return FLIGHT_PROGRAMME_BOOKING_URLS[programmeId] ?? null
}


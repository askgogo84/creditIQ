// lib/fares.ts
// Shared helpers for the cached-fares feature (cron writer + /api/fares reader).
// Travelpayouts keys everything by CITY code, not airport, so both sides MUST
// normalise through here (e.g. London airport LHR -> city LON, else the response
// key never matches the query and every London route false-negatives).

export const TP_CHEAP_ENDPOINT = 'https://api.travelpayouts.com/v1/prices/cheap'

// Airport IATA -> Travelpayouts city code. Only entries where airport != city
// matter; codes that are already city codes (BLR, DEL, BOM, DXB, SIN, GOI…) fall
// through unchanged in normalizeToCity.
const AIRPORT_TO_CITY: Record<string, string> = {
  LHR: 'LON', LGW: 'LON', STN: 'LON', LCY: 'LON', LTN: 'LON', // London
  JFK: 'NYC', EWR: 'NYC', LGA: 'NYC',                          // New York
  NRT: 'TYO', HND: 'TYO',                                      // Tokyo
  DMK: 'BKK',                                                  // Bangkok (Don Mueang)
  CDG: 'PAR', ORY: 'PAR',                                      // Paris
}

// City / country name -> Travelpayouts city code. Superset of the destinations
// the trip-planner surfaces. London -> LON (city), NOT LHR (airport).
const NAME_TO_CITY: Record<string, string> = {
  bangalore: 'BLR', bengaluru: 'BLR', mumbai: 'BOM', delhi: 'DEL',
  hyderabad: 'HYD', chennai: 'MAA', kolkata: 'CCU', pune: 'PNQ',
  goa: 'GOI', jaipur: 'JAI', kochi: 'COK', ahmedabad: 'AMD',
  dubai: 'DXB', singapore: 'SIN', bangkok: 'BKK', london: 'LON',
  'new york': 'NYC', tokyo: 'TYO', paris: 'PAR', 'hong kong': 'HKG',
  'kuala lumpur': 'KUL', colombo: 'CMB', denpasar: 'DPS', bali: 'DPS',
  'abu dhabi': 'AUH', seoul: 'ICN', istanbul: 'IST', rome: 'FCO',
  maldives: 'MLE', male: 'MLE',
}

/**
 * Normalise a free-text city name OR an airport/city IATA code to the
 * Travelpayouts CITY code. Case-insensitive. Unknown 3-letter codes pass through
 * uppercased (best effort); anything else returns '' so callers can reject.
 */
export function normalizeToCity(input: string | undefined | null): string {
  if (!input) return ''
  const raw = String(input).trim()
  const byName = NAME_TO_CITY[raw.toLowerCase()]
  if (byName) return byName
  const code = raw.toUpperCase()
  if (/^[A-Z]{3}$/.test(code)) return AIRPORT_TO_CITY[code] || code
  return ''
}

// The routes the daily cron pre-warms (city codes). Directional — TP cheapest is
// per direction. International out of the three metros + key domestic pairs + Goa.
export const TOP_ROUTES: ReadonlyArray<readonly [string, string]> = [
  // International (BLR/DEL/BOM -> DXB/SIN/BKK/LON)
  ['BLR', 'DXB'], ['BLR', 'SIN'], ['BLR', 'BKK'], ['BLR', 'LON'],
  ['DEL', 'DXB'], ['DEL', 'SIN'], ['DEL', 'BKK'], ['DEL', 'LON'],
  ['BOM', 'DXB'], ['BOM', 'SIN'], ['BOM', 'BKK'], ['BOM', 'LON'],
  // Domestic metros + Goa
  ['DEL', 'BOM'], ['BOM', 'DEL'], ['DEL', 'BLR'], ['BLR', 'DEL'],
  ['BOM', 'BLR'], ['BLR', 'BOM'], ['DEL', 'GOI'], ['BOM', 'GOI'],
  ['BLR', 'GOI'], ['DEL', 'MAA'], ['DEL', 'HYD'], ['DEL', 'CCU'],
  ['BOM', 'MAA'], ['BLR', 'MAA'],
]

/** YYYY-MM strings for the next `n` months incl. current, for TP's depart_date. */
export function nextMonths(n: number, from: Date = new Date()): string[] {
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + i, 1))
    out.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

// Airline IATA -> display name. Covers the carriers TP returns on India routes.
const AIRLINE_NAMES: Record<string, string> = {
  '6E': 'IndiGo', AI: 'Air India', IX: 'Air India Express', UK: 'Vistara',
  SG: 'SpiceJet', G8: 'Go First', QP: 'Akasa Air', I5: 'AIX Connect',
  EK: 'Emirates', EY: 'Etihad', QR: 'Qatar Airways', WY: 'Oman Air',
  GF: 'Gulf Air', KU: 'Kuwait Airways', SV: 'Saudia', FZ: 'flydubai',
  SQ: 'Singapore Airlines', TR: 'Scoot', TG: 'Thai Airways', FD: 'Thai AirAsia',
  AK: 'AirAsia', MH: 'Malaysia Airlines', CX: 'Cathay Pacific', VN: 'Vietnam Airlines',
  BA: 'British Airways', VS: 'Virgin Atlantic', LH: 'Lufthansa', AF: 'Air France',
  KL: 'KLM', AA: 'American Airlines', UA: 'United', DL: 'Delta', TK: 'Turkish Airlines',
  ET: 'Ethiopian', NH: 'ANA', JL: 'Japan Airlines', KE: 'Korean Air', OZ: 'Asiana',
}

/** Airline display name for a TP IATA code; falls back to the code itself. */
export function airlineName(code: string | null | undefined): string {
  if (!code) return 'Airline'
  return AIRLINE_NAMES[code.toUpperCase()] || code.toUpperCase()
}

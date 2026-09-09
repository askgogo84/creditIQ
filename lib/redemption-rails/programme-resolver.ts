const FLIGHT_SOURCE_TO_PROGRAMME: Record<string, string> = {
  singapore: 'krisflyer',
  krisflyer: 'krisflyer',
  'air-india': 'air-india-maharaja',
  airindia: 'air-india-maharaja',
  indigo: 'indigo-bluchip',
  'indigo-bluchip': 'indigo-bluchip',
  spicejet: 'spiceclub',
  spiceclub: 'spiceclub',
  flyingblue: 'flying-blue',
  'flying-blue': 'flying-blue',
  etihad: 'etihad-guest',
  ba: 'british-airways-club',
  britishairways: 'british-airways-club',
  qatar: 'qatar-privilege-club',
  turkish: 'turkish-miles-smiles',
  united: 'united-mileageplus',
  aeroplan: 'aeroplan',
  cathay: 'cathay',
  emirates: 'emirates-skywards',
  american: 'american-aadvantage',
  delta: 'delta-skymiles',
}

const FLIGHT_PROGRAMME_TO_SOURCE: Record<string, string> = {
  krisflyer: 'singapore',
  'air-india-maharaja': 'air-india',
  'indigo-bluchip': 'indigo',
  spiceclub: 'spicejet',
  'flying-blue': 'flyingblue',
  'etihad-guest': 'etihad',
  'british-airways-club': 'ba',
  'qatar-privilege-club': 'qatar',
  'turkish-miles-smiles': 'turkish',
  'united-mileageplus': 'united',
  aeroplan: 'aeroplan',
  cathay: 'cathay',
  'emirates-skywards': 'emirates',
  'american-aadvantage': 'american',
  'delta-skymiles': 'delta',
}

function token(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

export function programmeIdForFlightSource(source: string): string | null {
  const raw = source.trim().toLowerCase()
  return FLIGHT_SOURCE_TO_PROGRAMME[raw] ?? FLIGHT_SOURCE_TO_PROGRAMME[token(source)] ?? null
}

/**
 * Resolve a known operating carrier to its relevant loyalty programme even when
 * the live award provider returns no award record. This exposes a genuine
 * redemption relationship without pretending an award seat/price exists.
 */
export function programmeIdForFlightCarrier(carrier: string | null | undefined): string | null {
  const n = token(carrier || '')
  if (!n) return null
  if (n === 'ai' || n === 'airindia') return 'air-india-maharaja'
  if (n === '6e' || n === 'indigo') return 'indigo-bluchip'
  if (n === 'sg' || n === 'spicejet') return 'spiceclub'
  return null
}

export function flightSourceForProgrammeId(programmeId: string): string | null {
  return FLIGHT_PROGRAMME_TO_SOURCE[programmeId.trim().toLowerCase()] ?? null
}

export function programmeIdForHotelChain(chainName: string | null | undefined): string | null {
  const n = token(chainName || '')
  if (!n) return null
  if (n.includes('marriott') || n.includes('ritz') || n.includes('westin') || n.includes('sheraton')) return 'marriott-bonvoy'
  if (n.includes('accor') || n.includes('novotel') || n.includes('pullman') || n.includes('ibis') || n.includes('sofitel') || n.includes('mercure')) return 'accor-all'
  if (n.includes('ihg') || n.includes('intercontinental') || n.includes('holidayinn') || n.includes('crowneplaza')) return 'ihg-one'
  if (n.includes('hilton') || n.includes('waldorf') || n.includes('conrad') || n.includes('doubletree')) return 'hilton-honors'
  if (n.includes('hyatt')) return 'world-of-hyatt'
  if (n.includes('wyndham') || n.includes('ramada')) return 'wyndham-rewards'
  if (n.includes('radisson')) return 'radisson-rewards'
  if (n.includes('shangrila')) return 'shangri-la-circle'
  if (n.includes('taj') || n.includes('vivanta') || n.includes('seleqtions') || n.includes('ginger') || n.includes('ihcl')) return 'taj-neupass'
  if (n.includes('itchotels') || n.includes('itc')) return 'club-itc'
  return null
}

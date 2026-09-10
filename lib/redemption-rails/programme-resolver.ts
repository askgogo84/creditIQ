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
  finnair: 'finnair',
  ethiopian: 'ethiopian',
  qantas: 'qantas',
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
  finnair: 'finnair',
  ethiopian: 'ethiopian',
  qantas: 'qantas',
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

const HOTEL_CHAIN_RULES: Array<{ programmeId: string; tokens: string[] }> = [
  {
    programmeId: 'marriott-bonvoy',
    tokens: [
      'marriott', 'jwmarriott', 'ritz', 'ritzcarlton', 'westin', 'sheraton', 'lemeridien', 'stregis',
      'courtyard', 'renaissance', 'fairfield', 'aloft', 'whotel', 'whotels', 'luxurycollection', 'tributeportfolio',
      'autographcollection', 'moxy', 'element', 'fourpoints', 'proteahotels',
    ],
  },
  {
    programmeId: 'accor-all',
    tokens: [
      'accor', 'novotel', 'pullman', 'ibis', 'ibisstyles', 'ibisbudget', 'sofitel', 'mercure', 'mgallery',
      'fairmont', 'raffles', 'swissotel', 'movenpick', 'banyantree', 'angsana', 'mondrian', '25hours',
    ],
  },
  {
    programmeId: 'ihg-one',
    tokens: [
      'ihg', 'intercontinental', 'holidayinn', 'holidayinnexpress', 'crowneplaza', 'voco', 'kimpton',
      'indigo', 'hotelindigo', 'sixsenses', 'regent', 'staybridge', 'candlewood',
    ],
  },
  {
    programmeId: 'hilton-honors',
    tokens: [
      'hilton', 'waldorf', 'waldorfastoria', 'conrad', 'doubletree', 'hampton', 'curio', 'canopy',
      'embassysuites', 'gardeninn', 'homewood', 'home2', 'tapestry', 'lxr',
    ],
  },
  {
    programmeId: 'world-of-hyatt',
    tokens: [
      'hyatt', 'parkhyatt', 'grandhyatt', 'andaz', 'alila', 'miraval', 'thompson', 'jdh',
      'destinationbyhyatt', 'unboundcollection', 'hyattcentric', 'hyattregency', 'hyattplace', 'hyatthouse',
    ],
  },
  {
    programmeId: 'wyndham-rewards',
    tokens: ['wyndham', 'ramada', 'daysinn', 'super8', 'howardjohnson', 'travelodge', 'dolce', 'wingate'],
  },
  {
    programmeId: 'radisson-rewards',
    tokens: ['radisson', 'parkplaza', 'parkinn', 'countryinn', 'artotel'],
  },
  {
    programmeId: 'shangri-la-circle',
    tokens: ['shangrila', 'kerryhotel', 'jenhotel', 'hoteljen'],
  },
  {
    programmeId: 'taj-neupass',
    tokens: [
      'taj', 'tajhotels', 'vivanta', 'seleqtions', 'ginger', 'ihcl', 'amastays', 'gatewayhotel',
      'treeoflife',
    ],
  },
  {
    programmeId: 'club-itc',
    tokens: [
      'itchotels', 'itchotel', 'itcgrand', 'itcmaurya', 'itcroyal', 'welcomhotel', 'mementos', 'fortunehotels',
      'fortunehotel',
    ],
  },
]

/**
 * Resolve a hotel chain or branded property name to a loyalty programme without
 * relying on country-specific logic. The same resolver is intentionally used for
 * India and international searches. It only returns a programme when a known
 * brand token is present; independent hotels stay unmapped and continue to use
 * cash/card-portal rails.
 */
export function programmeIdForHotelChain(chainName: string | null | undefined): string | null {
  const n = token(chainName || '')
  if (!n) return null

  for (const rule of HOTEL_CHAIN_RULES) {
    if (rule.tokens.some((brandToken) => n.includes(brandToken))) return rule.programmeId
  }
  return null
}

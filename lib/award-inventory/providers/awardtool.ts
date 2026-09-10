import type {
  HotelAwardProperty,
  HotelAwardPropertyQuery,
  HotelAwardProvider,
} from '../types'

const BASE_URL = 'https://apisv2.awardtoolapi.com'

const PROGRAMME_BY_BRAND: Record<string, string> = {
  marriott: 'marriott-bonvoy',
  'marriott bonvoy': 'marriott-bonvoy',
  hyatt: 'world-of-hyatt',
  'world of hyatt': 'world-of-hyatt',
  ihg: 'ihg-one',
  'ihg one rewards': 'ihg-one',
  hilton: 'hilton-honors',
  'hilton honors': 'hilton-honors',
  wyndham: 'wyndham-rewards',
  'wyndham rewards': 'wyndham-rewards',
  choice: 'choice-privileges',
  'choice privileges': 'choice-privileges',
  'i prefer': 'i-prefer',
  iprefer: 'i-prefer',
  accor: 'accor-all',
  'all accor': 'accor-all',
  'all - accor live limitless': 'accor-all',
  radisson: 'radisson-rewards',
  'radisson rewards': 'radisson-rewards',
  'shangri-la': 'shangri-la-circle',
  'shangri la': 'shangri-la-circle',
  jumeirah: 'jumeirah-one',
  taj: 'taj-neupass',
  ihcl: 'taj-neupass',
  'itc hotels': 'club-itc',
  itc: 'club-itc',
  'royal orchid': 'orchid-rewards',
  regenta: 'orchid-rewards',
  postcard: 'postcard-sunshine-club',
}

const BRAND_TOKEN_RULES: Array<{ programmeId: string; tokens: string[] }> = [
  { programmeId: 'marriott-bonvoy', tokens: ['marriott', 'bonvoy'] },
  { programmeId: 'world-of-hyatt', tokens: ['hyatt'] },
  { programmeId: 'ihg-one', tokens: ['ihg', 'intercontinental', 'holidayinn', 'crowneplaza'] },
  { programmeId: 'hilton-honors', tokens: ['hilton', 'waldorf', 'conrad', 'doubletree'] },
  { programmeId: 'wyndham-rewards', tokens: ['wyndham', 'ramada'] },
  { programmeId: 'accor-all', tokens: ['accor', 'novotel', 'pullman', 'ibis', 'sofitel', 'mercure', 'fairmont', 'raffles'] },
  { programmeId: 'radisson-rewards', tokens: ['radisson'] },
  { programmeId: 'shangri-la-circle', tokens: ['shangrila'] },
  { programmeId: 'jumeirah-one', tokens: ['jumeirah'] },
  { programmeId: 'taj-neupass', tokens: ['taj', 'ihcl', 'vivanta', 'seleqtions', 'ginger'] },
  { programmeId: 'club-itc', tokens: ['itchotels', 'welcomhotel', 'fortunehotels'] },
  { programmeId: 'orchid-rewards', tokens: ['royalorchid', 'regenta'] },
  { programmeId: 'postcard-sunshine-club', tokens: ['postcard'] },
]

function norm(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function brandToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function finiteOrNull(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export function programmeIdForAwardToolBrand(brand: string): string | null {
  const raw = brand.trim().toLowerCase()
  const exact = PROGRAMME_BY_BRAND[raw]
  if (exact) return exact

  const token = brandToken(brand)
  const rule = BRAND_TOKEN_RULES.find(item => item.tokens.some(candidate => token.includes(candidate)))
  return rule?.programmeId ?? null
}

type AwardToolHotelRow = Record<string, unknown>

export function normalizeAwardToolHotel(row: AwardToolHotelRow, fetchedAt: string): HotelAwardProperty | null {
  const id = norm(row.id)
  const name = norm(row.name)
  const brand = norm(row.brand)
  if (!id || !name || !brand) return null

  const programmeId = programmeIdForAwardToolBrand(brand)
  if (!programmeId) return null

  const location = row.hotel_location && typeof row.hotel_location === 'object'
    ? row.hotel_location as Record<string, unknown>
    : {}

  const updateDate = norm(row.update_date)
  const updateEpoch = finiteOrNull(row.update_epoch)
  const updatedAt = updateDate || (updateEpoch != null ? new Date(updateEpoch * 1000).toISOString() : null)

  return {
    providerPropertyId: id,
    programmeId,
    programmeHotelId: norm(row.hotel_id) || null,
    name,
    brand,
    subBrand: norm(row.sub_brand) || null,
    formattedAddress: norm(row.formatted_address) || null,
    latitude: finiteOrNull(location.latitude),
    longitude: finiteOrNull(location.longitude),
    imageUrl: norm(row.image) || null,
    awardAvailabilityPercent: finiteOrNull(row.availability_num),
    observedCashMin: finiteOrNull(row.cash_min),
    observedCashMedian: finiteOrNull(row.cash_median),
    observedCashMax: finiteOrNull(row.cash_max),
    observedPointsMin: finiteOrNull(row.points_min),
    observedPointsMedian: finiteOrNull(row.points_median),
    observedPointsMax: finiteOrNull(row.points_max),
    updatedAt,
    evidence: {
      provider: 'awardtool',
      freshness: 'CACHED',
      fetchedAt,
      sourceUrl: `${BASE_URL}/api/hotel_all`,
    },
  }
}

function matchesQuery(property: HotelAwardProperty, query?: HotelAwardPropertyQuery): boolean {
  if (!query) return true
  if (query.programmeIds?.length && !query.programmeIds.includes(property.programmeId)) return false
  if (query.destination) {
    const needle = query.destination.toLowerCase().replace(/\s+/g, ' ').trim()
    const haystack = `${property.name} ${property.formattedAddress ?? ''}`.toLowerCase().replace(/\s+/g, ' ')
    if (!haystack.includes(needle)) return false
  }
  return true
}

export class AwardToolHotelProvider implements HotelAwardProvider {
  readonly id = 'awardtool'
  readonly freshness = 'CACHED' as const

  constructor(private readonly apiKey = process.env.AWARDTOOL_API_KEY ?? '') {}

  isConfigured(): boolean {
    return this.apiKey.trim().length > 0
  }

  async listSupportedProperties(query?: HotelAwardPropertyQuery): Promise<HotelAwardProperty[]> {
    if (!this.isConfigured()) return []

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8_000)
    try {
      const res = await fetch(`${BASE_URL}/api/hotel_all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: this.apiKey }),
        signal: controller.signal,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`AwardTool hotel_all failed: ${res.status}`)

      const json = await res.json() as { data?: unknown }
      if (!Array.isArray(json.data)) return []

      const fetchedAt = new Date().toISOString()
      return json.data
        .map((row) => normalizeAwardToolHotel(row as AwardToolHotelRow, fetchedAt))
        .filter((row): row is HotelAwardProperty => row !== null)
        .filter((row) => matchesQuery(row, query))
    } finally {
      clearTimeout(timeout)
    }
  }
}

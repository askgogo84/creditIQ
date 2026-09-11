import { parseOfficialHotelHtml, type OfficialLoyaltyProperty } from './official'

type SearchInput = {
  destination: string
  checkInDate?: string | null
  checkOutDate?: string | null
  adults?: number | null
}

type Adapter = {
  programmeId: string
  sourceName: string
  buildUrl(input: SearchInput): string
  hotelNameTokens: string[]
}

function slug(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const EXTRA_ADAPTERS: readonly Adapter[] = [
  {
    programmeId: 'taj-neupass',
    sourceName: 'Taj / NeuPass',
    buildUrl: ({ destination }) => `https://www.tajhotels.com/en-in/destination/hotels-in-${slug(destination)}`,
    hotelNameTokens: [
      'taj ', 'taj-', 'vivanta', 'seleqtions', 'ginger', 'gateway', 'ama stays', 'amã stays',
      'tree of life',
    ],
  },
  {
    programmeId: 'club-itc',
    sourceName: 'ITC Hotels / Fortune',
    buildUrl: ({ destination }) => `https://www.itchotels.com/in/en/hotels-in-${slug(destination)}`,
    hotelNameTokens: [
      'itc ', 'itc-', 'welcomhotel', 'mementos', 'storii', 'fortune ', 'fortune-',
    ],
  },
  {
    programmeId: 'jumeirah-one',
    sourceName: 'Jumeirah One',
    buildUrl: ({ destination }) => `https://www.jumeirah.com/en/collection/${slug(destination)}-collection`,
    hotelNameTokens: ['jumeirah', 'zabeel house', 'madinat jumeirah', 'burj al arab'],
  },
]

async function fetchOne(adapter: Adapter, input: SearchInput): Promise<OfficialLoyaltyProperty[]> {
  const url = adapter.buildUrl(input)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4500)
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'en-US,en;q=0.9',
        'user-agent': 'Mozilla/5.0 (compatible; CreditIQ/1.0; +https://creditiq.app)',
      },
    })
    if (!response.ok) return []
    const html = await response.text()
    if (!html || html.length < 500) return []
    return parseOfficialHotelHtml(html, adapter, response.url || url)
  } catch {
    return []
  } finally {
    clearTimeout(timeout)
  }
}

export async function fetchAdditionalOfficialLoyaltyProperties(input: SearchInput) {
  const result = await Promise.all(EXTRA_ADAPTERS.map(adapter => fetchOne(adapter, input)))
  return result.flat()
}

export const ADDITIONAL_OFFICIAL_LOYALTY_ADAPTERS = EXTRA_ADAPTERS.map(adapter => ({
  programmeId: adapter.programmeId,
  sourceName: adapter.sourceName,
}))

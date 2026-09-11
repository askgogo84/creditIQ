export type OfficialLoyaltyProperty = {
  providerPropertyId: string
  programmeId: string
  name: string
  brand: string | null
  subBrand: string | null
  formattedAddress: string | null
  imageUrl: string | null
  awardAvailabilityPercent: number | null
  observedPointsMin: number | null
  observedPointsMedian: number | null
  observedPointsMax: number | null
  updatedAt: string | null
  source: 'FIRST_PARTY'
  sourceName: string
  sourceUrl: string
}

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

const ADAPTERS: readonly Adapter[] = [
  {
    programmeId: 'marriott-bonvoy',
    sourceName: 'Marriott Bonvoy',
    buildUrl: ({ destination, checkInDate, checkOutDate, adults }) => {
      const q = new URLSearchParams({
        'destinationAddress.destination': destination,
        isSearch: 'true',
        useRewardsPoints: 'true',
        roomCount: '1',
        numAdultsPerRoom: String(Math.max(1, adults || 2)),
      })
      if (checkInDate) q.set('fromDate', checkInDate)
      if (checkOutDate) q.set('toDate', checkOutDate)
      return `https://www.marriott.com/search/findHotels.mi?${q.toString()}`
    },
    hotelNameTokens: ['marriott', 'sheraton', 'westin', 'courtyard', 'le meridien', 'méridien', 'ritz-carlton', 'ritz carlton', 'st. regis', 'st regis', 'aloft', 'fairfield', 'moxy', 'renaissance', 'luxury collection', 'four points', 'w ', 'jw '],
  },
  {
    programmeId: 'hilton-honors',
    sourceName: 'Hilton Honors',
    buildUrl: ({ destination }) => `https://www.hilton.com/en/search/?query=${encodeURIComponent(destination)}`,
    hotelNameTokens: ['hilton', 'conrad', 'waldorf', 'doubletree', 'hampton', 'curio', 'canopy', 'embassy suites', 'garden inn', 'homewood', 'home2', 'tapestry', 'lxr', 'small luxury hotels', 'slh'],
  },
  {
    programmeId: 'ihg-one',
    sourceName: 'IHG One Rewards',
    buildUrl: ({ destination, checkInDate, checkOutDate, adults }) => {
      const q = new URLSearchParams({
        qDest: destination,
        qRms: '1',
        qAdlt: String(Math.max(1, adults || 2)),
        qChld: '0',
      })
      if (checkInDate) q.set('qCi', checkInDate)
      if (checkOutDate) q.set('qCo', checkOutDate)
      return `https://www.ihg.com/hotels/us/en/find-hotels/hotel/list?${q.toString()}`
    },
    hotelNameTokens: ['intercontinental', 'holiday inn', 'crowne plaza', 'voco', 'kimpton', 'hotel indigo', 'six senses', 'regent', 'staybridge', 'candlewood', 'avid hotel', 'garner'],
  },
  {
    programmeId: 'accor-all',
    sourceName: 'ALL Accor',
    buildUrl: ({ destination }) => {
      const slug = destination.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      // Accor's destination SEO pages redirect/resolve the canonical city page when available.
      // If a city requires an internal destination id, this adapter fails closed and the cached
      // loyalty catalogue remains available until the id resolver is added.
      return `https://all.accor.com/a/en/destination/city/hotels-${slug}.html`
    },
    hotelNameTokens: ['accor', 'novotel', 'mercure', 'ibis', 'sofitel', 'pullman', 'mgallery', 'fairmont', 'raffles', 'swissotel', 'movenpick', 'mövenpick', 'banyan tree', 'angsana', 'mondrian', '25hours', 'tribe'],
  },
]

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function stripTags(value: string) {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
}

function normalizeName(value: string) {
  return stripTags(value).replace(/\s+/g, ' ').trim()
}

function keyFor(programmeId: string, name: string) {
  return `${programmeId}:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

function looksLikeHotel(name: string, adapter: Adapter) {
  const n = name.toLowerCase()
  if (name.length < 4 || name.length > 140) return false
  if (/^(hotels?|find hotels?|view details?|select dates?|book now|view rates)$/i.test(name)) return false
  return adapter.hotelNameTokens.some(token => n.includes(token))
}

function addressFromJson(value: any): string | null {
  const addr = value?.address
  if (!addr) return null
  if (typeof addr === 'string') return addr.trim() || null
  if (typeof addr !== 'object') return null
  return [addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode, addr.addressCountry]
    .filter(Boolean)
    .map(String)
    .join(', ') || null
}

function imageFromJson(value: any): string | null {
  const image = value?.image
  if (typeof image === 'string') return image
  if (Array.isArray(image)) {
    const first = image.find(item => typeof item === 'string' || (item && typeof item.url === 'string'))
    if (typeof first === 'string') return first
    if (first?.url) return String(first.url)
  }
  if (image && typeof image.url === 'string') return image.url
  return null
}

function collectJsonLd(value: any, adapter: Adapter, sourceUrl: string, out: Map<string, OfficialLoyaltyProperty>) {
  if (Array.isArray(value)) {
    value.forEach(item => collectJsonLd(item, adapter, sourceUrl, out))
    return
  }
  if (!value || typeof value !== 'object') return

  const rawType = value['@type']
  const types = Array.isArray(rawType) ? rawType.map(String) : rawType ? [String(rawType)] : []
  const name = typeof value.name === 'string' ? normalizeName(value.name) : ''
  const isLodging = types.some(type => /hotel|lodgingbusiness|resort/i.test(type))
  if (name && (isLodging || looksLikeHotel(name, adapter))) {
    const source = typeof value.url === 'string' ? value.url : sourceUrl
    out.set(keyFor(adapter.programmeId, name), {
      providerPropertyId: keyFor(adapter.programmeId, name),
      programmeId: adapter.programmeId,
      name,
      brand: adapter.sourceName,
      subBrand: null,
      formattedAddress: addressFromJson(value),
      imageUrl: imageFromJson(value),
      awardAvailabilityPercent: null,
      observedPointsMin: null,
      observedPointsMedian: null,
      observedPointsMax: null,
      updatedAt: new Date().toISOString(),
      source: 'FIRST_PARTY',
      sourceName: adapter.sourceName,
      sourceUrl: source,
    })
  }

  for (const child of Object.values(value)) collectJsonLd(child, adapter, sourceUrl, out)
}

export function parseOfficialHotelHtml(html: string, adapter: Adapter, sourceUrl: string): OfficialLoyaltyProperty[] {
  const out = new Map<string, OfficialLoyaltyProperty>()

  const scripts = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  for (const match of scripts) {
    try { collectJsonLd(JSON.parse(match[1]), adapter, sourceUrl, out) } catch { /* issuer page may contain malformed optional JSON-LD */ }
  }

  // Major hotel destination pages are SSR'd with hotel names in h2/h3/card links even
  // when their internal search API is private. This fallback extracts only names carrying
  // a known brand token, so generic navigation headings cannot become fake properties.
  const headings = html.matchAll(/<(h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi)
  for (const match of headings) {
    const name = normalizeName(match[2])
    if (!looksLikeHotel(name, adapter)) continue
    const id = keyFor(adapter.programmeId, name)
    if (out.has(id)) continue
    out.set(id, {
      providerPropertyId: id,
      programmeId: adapter.programmeId,
      name,
      brand: adapter.sourceName,
      subBrand: null,
      formattedAddress: null,
      imageUrl: null,
      awardAvailabilityPercent: null,
      observedPointsMin: null,
      observedPointsMedian: null,
      observedPointsMax: null,
      updatedAt: new Date().toISOString(),
      source: 'FIRST_PARTY',
      sourceName: adapter.sourceName,
      sourceUrl,
    })
  }

  return [...out.values()]
}

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

export async function fetchOfficialLoyaltyProperties(input: SearchInput): Promise<OfficialLoyaltyProperty[]> {
  const batches = await Promise.all(ADAPTERS.map(adapter => fetchOne(adapter, input)))
  const merged = new Map<string, OfficialLoyaltyProperty>()
  for (const properties of batches) {
    for (const property of properties) merged.set(`${property.programmeId}:${property.name.toLowerCase()}`, property)
  }
  return [...merged.values()]
}

export const OFFICIAL_LOYALTY_ADAPTERS = ADAPTERS.map(adapter => ({
  programmeId: adapter.programmeId,
  sourceName: adapter.sourceName,
}))

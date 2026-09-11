import type { OfficialLoyaltyProperty } from './official'

type SearchInput = {
  destination: string
  checkInDate?: string | null
  checkOutDate?: string | null
  adults?: number | null
}

function normalize(value: unknown) {
  return String(value ?? '').trim()
}

function sameDestination(candidate: unknown, destination: string) {
  const hay = normalize(candidate).toLowerCase()
  const needle = destination.trim().toLowerCase()
  return Boolean(hay && needle && (hay === needle || hay.includes(needle) || needle.includes(hay)))
}

function hotelProperty(input: {
  programmeId: string
  sourceName: string
  sourceUrl: string
  id: unknown
  name: unknown
  brand?: unknown
  address?: unknown
  image?: unknown
  points?: unknown
}): OfficialLoyaltyProperty | null {
  const name = normalize(input.name)
  if (!name) return null
  const id = normalize(input.id) || `${input.programmeId}:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  const p = Number(input.points)
  const awardPoints = Number.isFinite(p) && p > 0 ? p : null
  return {
    providerPropertyId: id,
    programmeId: input.programmeId,
    name,
    brand: normalize(input.brand) || input.sourceName,
    subBrand: null,
    formattedAddress: normalize(input.address) || null,
    imageUrl: normalize(input.image) || null,
    awardAvailabilityPercent: null,
    observedPointsMin: awardPoints,
    observedPointsMedian: awardPoints,
    observedPointsMax: awardPoints,
    updatedAt: new Date().toISOString(),
    source: 'FIRST_PARTY',
    sourceName: input.sourceName,
    sourceUrl: input.sourceUrl,
  }
}

async function json(url: string, init?: RequestInit, timeoutMs = 5000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...init, cache: 'no-store', signal: controller.signal })
    if (!response.ok) return null
    return await response.json().catch(() => null)
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchItc(input: SearchInput): Promise<OfficialLoyaltyProperty[]> {
  const sourceUrl = 'https://www.itchotels.com/content/itchotels/in/en/jcr:content/reservationwidget/reservation_widget.accomodation.json'
  const data = await json(sourceUrl)
  if (!data) return []

  const arrays: any[][] = []
  const walk = (value: any) => {
    if (Array.isArray(value)) {
      if (value.some(item => item && typeof item === 'object' && ('hotelCode' in item || 'title' in item))) arrays.push(value)
      value.forEach(walk)
      return
    }
    if (value && typeof value === 'object') Object.values(value).forEach(walk)
  }
  walk(data)

  const out = new Map<string, OfficialLoyaltyProperty>()
  for (const list of arrays) {
    for (const item of list) {
      if (!item || typeof item !== 'object') continue
      if (!sameDestination(item.city, input.destination)) continue
      const property = hotelProperty({
        programmeId: 'club-itc',
        sourceName: 'ITC Hotels / Fortune',
        sourceUrl: normalize(item.synxisUrl) || sourceUrl,
        id: item.hotelCode,
        name: item.title || item.hotelName || item.name,
        brand: item.brand,
      })
      if (property) out.set(property.providerPropertyId, property)
    }
  }
  return [...out.values()]
}

async function fetchShangriLa(input: SearchInput): Promise<OfficialLoyaltyProperty[]> {
  const endpoint = 'https://www.shangri-la.com/v1/website'
  const service = 'searchSuggestService.search(keyWord)'
  const data = await json(endpoint, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'x-sl-service': service,
    },
    body: JSON.stringify({
      service,
      query: { keyWord: input.destination },
      context: { locale: 'en_US', currency: 'USD', channel: 'web', source: 'official' },
    }),
  })
  const list = Array.isArray(data?.data?.list) ? data.data.list : []
  const out = new Map<string, OfficialLoyaltyProperty>()
  for (const place of list) {
    const placeMatches = sameDestination(place?.city, input.destination) || sameDestination(place?.cityAlias, input.destination)
    if (!placeMatches) continue
    const hotels = Array.isArray(place?.hotels) ? place.hotels : Array.isArray(place?.hotelList) ? place.hotelList : []
    for (const item of hotels) {
      const property = hotelProperty({
        programmeId: 'shangri-la-circle',
        sourceName: 'Shangri-La Circle',
        sourceUrl: endpoint,
        id: item?.hotelCode || item?.code,
        name: item?.hotel || item?.hotelName || item?.name,
        brand: 'Shangri-La',
      })
      if (property) out.set(property.providerPropertyId, property)
    }
  }
  return [...out.values()]
}

async function fetchAccor(input: SearchInput): Promise<OfficialLoyaltyProperty[]> {
  const apiKey = (process.env.ACCOR_CATALOG_API_KEY || '').trim()
  if (!apiKey) return []
  const endpoint = `https://api.accor.com/catalog/v1/hotels?q=${encodeURIComponent(input.destination)}`
  const data = await json(endpoint, { headers: { accept: 'application/json', apikey: apiKey } })
  const results = Array.isArray(data?.results) ? data.results : []
  const out = new Map<string, OfficialLoyaltyProperty>()
  for (const row of results) {
    const hotel = row?.hotel ?? row
    const address = hotel?.localization?.address
    const formattedAddress = typeof address === 'string'
      ? address
      : [address?.line1, address?.line2, address?.city, address?.postalCode, address?.country]
          .filter(Boolean).join(', ')
    const media = Array.isArray(hotel?.media) ? hotel.media[0] : hotel?.media
    const image = typeof media === 'string' ? media : media?.url || media?.href
    const factsheet = normalize(hotel?.factsheetUrl)
    const property = hotelProperty({
      programmeId: 'accor-all',
      sourceName: 'ALL Accor',
      sourceUrl: factsheet || endpoint,
      id: hotel?.id || hotel?.code || row?.id,
      name: hotel?.name,
      brand: hotel?.brand?.name || hotel?.brand,
      address: formattedAddress,
      image,
    })
    if (property) out.set(property.providerPropertyId, property)
  }
  return [...out.values()]
}

export async function fetchLiveJsonLoyaltyProperties(input: SearchInput): Promise<OfficialLoyaltyProperty[]> {
  const groups = await Promise.all([
    fetchItc(input),
    fetchShangriLa(input),
    fetchAccor(input),
  ])
  const out = new Map<string, OfficialLoyaltyProperty>()
  for (const group of groups) {
    for (const property of group) out.set(`${property.programmeId}:${property.providerPropertyId}`, property)
  }
  return [...out.values()]
}

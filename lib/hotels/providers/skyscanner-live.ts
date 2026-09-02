// Skyscanner Hotels Live Prices provider.
//
// This provider is intentionally separate from the seeded Accor fixture provider.
// When SKYSCANNER_API_KEY is absent, callers must report live inventory as
// unavailable; they must never substitute Bangkok capture data for another city.

const BASE = 'https://partners.api.skyscanner.net/apiservices'
const PAGE_MAX = 50

export type GlobalHotelOffer = {
  id: string
  hotelId: string
  hotelName: string
  chainName: string | null
  stars: number | null
  latitude: number | null
  longitude: number | null
  imageUrl: string | null
  roomName: string | null
  roomType: string | null
  cancellationPolicy: string | null
  mealPlan: string | null
  paymentType: string | null
  currency: string
  totalPrice: number
  basePrice: number | null
  taxesAndFees: number | null
  agentName: string | null
  deeplink: string | null
  source: 'skyscanner-hotels-live'
}

export type HotelCoverage = {
  provider: 'skyscanner-hotels-live'
  mode: 'FULL_PAGEABLE'
  destination: string
  entityId: string
  loaded: number
  provider_total: number | null
  offset: number
  limit: number
  has_more: boolean
  next_offset: number | null
  status: string
  fetched_at: string
}

export type GlobalHotelPage = {
  sessionToken: string
  offers: GlobalHotelOffer[]
  coverage: HotelCoverage
}

function apiKey() {
  return process.env.SKYSCANNER_API_KEY || ''
}

function headers() {
  return {
    'x-api-key': apiKey(),
    'Content-Type': 'application/json',
  }
}

function asDate(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) throw new Error('date must use YYYY-MM-DD')
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) }
}

function starNumber(value: unknown): number | null {
  const s = String(value || '')
  const map: Record<string, number> = {
    STARS_ONE_STAR: 1,
    STARS_TWO_STAR: 2,
    STARS_THREE_STAR: 3,
    STARS_FOUR_STAR: 4,
    STARS_FIVE_STAR: 5,
  }
  return map[s] ?? null
}

function money(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function skyscannerHotelsConfigured() {
  return !!apiKey()
}

export async function resolveHotelDestination(searchTerm: string): Promise<{ entityId: string; name: string }> {
  if (!apiKey()) throw new Error('Skyscanner Hotels API is not configured')
  const term = searchTerm.trim()
  if (!term) throw new Error('destination required')

  const res = await fetch(`${BASE}/v3/autosuggest/hotels`, {
    method: 'POST',
    headers: headers(),
    cache: 'no-store',
    body: JSON.stringify({
      query: {
        market: 'IN',
        locale: 'en-GB',
        searchTerm: term,
        includedEntityTypes: [
          'PLACE_TYPE_CITY',
          'PLACE_TYPE_DISTRICT',
          'PLACE_TYPE_ISLAND',
          'PLACE_TYPE_FIRST_LEVEL_NATION_ADMINISTRATIVE_DIVISION',
          'PLACE_TYPE_SECOND_LEVEL_NATION_ADMINISTRATIVE_DIVISION',
          'PLACE_TYPE_HOTEL',
        ],
      },
      limit: 20,
    }),
  })

  if (!res.ok) throw new Error(`Skyscanner hotel autosuggest failed (${res.status})`)
  const data = await res.json()
  const places = Array.isArray(data.places) ? data.places : []
  const chosen = places.find((p: any) => p.type === 'PLACE_TYPE_CITY') ?? places[0]
  if (!chosen?.entityId) throw new Error('destination not found by hotel provider')
  return { entityId: String(chosen.entityId), name: String(chosen.name || term) }
}

export async function createHotelSearch(input: {
  destination: string
  checkin: string
  checkout: string
  adults?: number
  rooms?: number
  limit?: number
}): Promise<GlobalHotelPage> {
  if (!apiKey()) throw new Error('Skyscanner Hotels API is not configured')
  const place = await resolveHotelDestination(input.destination)
  const limit = Math.min(PAGE_MAX, Math.max(1, input.limit ?? 50))

  const res = await fetch(`${BASE}/v1/hotels/live/search/create`, {
    method: 'POST',
    headers: headers(),
    cache: 'no-store',
    body: JSON.stringify({
      query: {
        market: 'IN',
        locale: 'en-GB',
        currency: 'INR',
        entityId: place.entityId,
        checkinDate: asDate(input.checkin),
        checkoutDate: asDate(input.checkout),
        adults: Math.max(1, Math.min(9, input.adults ?? 2)),
        childrenAges: [],
        rooms: Math.max(1, Math.min(8, input.rooms ?? 1)),
      },
      initialPageSize: limit,
    }),
  })

  if (!res.ok) throw new Error(`Skyscanner hotel search create failed (${res.status})`)
  const data = await res.json()
  if (!data.sessionToken) throw new Error('hotel provider did not return a session')
  return normalizePage(data, place.name, place.entityId, 0, limit)
}

export async function pollHotelSearch(input: {
  sessionToken: string
  destination: string
  entityId: string
  offset: number
  limit?: number
}): Promise<GlobalHotelPage> {
  if (!apiKey()) throw new Error('Skyscanner Hotels API is not configured')
  const limit = Math.min(PAGE_MAX, Math.max(1, input.limit ?? 50))
  const offset = Math.max(0, input.offset)

  const res = await fetch(`${BASE}/v1/hotels/live/search/poll/${encodeURIComponent(input.sessionToken)}`, {
    method: 'POST',
    headers: headers(),
    cache: 'no-store',
    body: JSON.stringify({
      sort: {
        type: 'SORT_ORDER_TYPE_BEST',
        order: 'SORT_ORDER_DIRECTION_DESCENDING',
      },
      pagination: { offset, limit },
      filters: [],
    }),
  })

  if (!res.ok) throw new Error(`Skyscanner hotel search poll failed (${res.status})`)
  const data = await res.json()
  return normalizePage(data, input.destination, input.entityId, offset, limit)
}

function normalizePage(data: any, destination: string, entityId: string, offset: number, limit: number): GlobalHotelPage {
  const content = data?.content ?? {}
  const results = content?.results ?? {}
  const pricingMap = results?.hotelsPricingOptions ?? {}
  const infoMap = results?.hotelInfo ?? {}
  const agentMap = results?.agents ?? {}
  const offers: GlobalHotelOffer[] = []

  for (const [fallbackId, raw] of Object.entries(pricingMap) as Array<[string, any]>) {
    const hotelId = String(raw?.hotelId || '')
    if (!hotelId) continue
    const info = infoMap[hotelId] ?? {}
    const agent = agentMap[raw?.agentId] ?? {}
    const price = money(raw?.price?.price)
    if (price === null) continue
    const fees = Array.isArray(raw?.price?.taxesAndFees)
      ? raw.price.taxesAndFees.reduce((sum: number, f: any) => sum + (money(f?.value) ?? 0), 0)
      : null
    const images = Array.isArray(info?.hotelImages) ? info.hotelImages : []
    const image = images[0] ?? null

    offers.push({
      id: String(raw?.id || fallbackId),
      hotelId,
      hotelName: String(info?.hotelName || `Hotel ${hotelId}`),
      chainName: info?.chainGroup?.chainName ? String(info.chainGroup.chainName) : null,
      stars: starNumber(info?.stars),
      latitude: Number.isFinite(Number(info?.coordinates?.latitude)) ? Number(info.coordinates.latitude) : null,
      longitude: Number.isFinite(Number(info?.coordinates?.longitude)) ? Number(info.coordinates.longitude) : null,
      imageUrl: image?.thumbnailUrl || image?.galleryUrl || image?.fullUrl || null,
      roomName: raw?.roomName ? String(raw.roomName) : null,
      roomType: raw?.roomType ? String(raw.roomType) : null,
      cancellationPolicy: raw?.cancellationPolicy ? String(raw.cancellationPolicy) : null,
      mealPlan: raw?.mealPlan ? String(raw.mealPlan) : null,
      paymentType: raw?.paymentType ? String(raw.paymentType) : null,
      currency: String(raw?.price?.currency || 'INR'),
      totalPrice: price,
      basePrice: money(raw?.price?.basePrice),
      taxesAndFees: fees,
      agentName: agent?.name ? String(agent.name) : null,
      deeplink: raw?.deeplink ? String(raw.deeplink) : null,
      source: 'skyscanner-hotels-live',
    })
  }

  const total = Number.isFinite(Number(content?.totalHotelResultCount)) ? Number(content.totalHotelResultCount) : null
  const distinctHotels = new Set(offers.map((o) => o.hotelId)).size
  const consumed = offset + distinctHotels
  const hasMore = total !== null ? consumed < total : data?.status !== 'RESULT_STATUS_COMPLETE'

  return {
    sessionToken: String(data.sessionToken || ''),
    offers,
    coverage: {
      provider: 'skyscanner-hotels-live',
      mode: 'FULL_PAGEABLE',
      destination,
      entityId,
      loaded: offers.length,
      provider_total: total,
      offset,
      limit,
      has_more: hasMore,
      next_offset: hasMore ? offset + limit : null,
      status: String(data?.status || 'UNKNOWN'),
      fetched_at: new Date().toISOString(),
    },
  }
}

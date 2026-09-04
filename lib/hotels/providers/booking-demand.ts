import { getAirport, resolveCity } from '@/lib/data/airports'

export type BookingDemandHotelOffer = {
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
  source: 'booking-demand'
}

type BookingSearchInput = {
  destination: string
  checkin: string
  checkout: string
  adults: number
  rooms: number
  limit?: number
  page?: string | null
}

export type BookingDemandPage = {
  offers: BookingDemandHotelOffer[]
  nextPage: string | null
  total: number | null
  requestId: string | null
  destinationProxy: {
    iata: string
    city: string
    latitude: number
    longitude: number
    radiusKm: number
  }
}

function token() {
  return process.env.BOOKING_DEMAND_API_TOKEN || ''
}

function affiliateId() {
  return process.env.BOOKING_AFFILIATE_ID || ''
}

function baseUrl() {
  const override = (process.env.BOOKING_DEMAND_BASE_URL || '').trim().replace(/\/$/, '')
  if (override) return override
  return (process.env.BOOKING_DEMAND_ENV || 'sandbox').toLowerCase() === 'production'
    ? 'https://demandapi.booking.com/3.2'
    : 'https://demandapi-sandbox.booking.com/3.2'
}

export function bookingDemandConfigured() {
  return Boolean(token() && affiliateId())
}

function headers() {
  return {
    Authorization: `Bearer ${token()}`,
    'X-Affiliate-Id': affiliateId(),
    'Content-Type': 'application/json',
  }
}

function finiteNumber(value: unknown): number | null {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function translated(value: any): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    const candidate = value['en-gb'] ?? value['en-us'] ?? value.fallback ?? Object.values(value).find(item => typeof item === 'string')
    return typeof candidate === 'string' ? candidate : null
  }
  return null
}

function displayPrice(price: any): number | null {
  const display = price?.display
  if (typeof display === 'number') return finiteNumber(display)
  if (display && typeof display === 'object') {
    return finiteNumber(display.booker_currency ?? display.accommodation_currency ?? display.value)
  }
  return finiteNumber(price?.book ?? price?.total)
}

function totalPrice(price: any): number | null {
  const total = price?.total
  if (typeof total === 'number') return finiteNumber(total)
  if (total && typeof total === 'object') {
    return finiteNumber(total.booker_currency ?? total.accommodation_currency ?? total.value)
  }
  return displayPrice(price)
}

function basePrice(price: any): number | null {
  const base = price?.base
  if (typeof base === 'number') return finiteNumber(base)
  if (base && typeof base === 'object') {
    return finiteNumber(base.booker_currency ?? base.accommodation_currency ?? base.value)
  }
  return null
}

function firstPhoto(detail: any): string | null {
  const photos = Array.isArray(detail?.photos) ? detail.photos : []
  for (const photo of photos) {
    if (typeof photo === 'string' && photo.startsWith('http')) return photo
    const candidates = [photo?.url?.large, photo?.url?.medium, photo?.url?.small, photo?.url, photo?.large, photo?.medium, photo?.small]
    const found = candidates.find(value => typeof value === 'string' && value.startsWith('http'))
    if (typeof found === 'string') return found
  }
  return null
}

function stars(detail: any): number | null {
  const candidates = [detail?.rating?.stars, detail?.rating?.number_of_stars, detail?.stars, detail?.class]
  for (const candidate of candidates) {
    const value = finiteNumber(candidate)
    if (value != null && value >= 0 && value <= 5) return value
  }
  return null
}

function coordinates(detail: any): { latitude: number | null; longitude: number | null } {
  const latitude = finiteNumber(detail?.location?.coordinates?.latitude ?? detail?.location?.latitude ?? detail?.coordinates?.latitude)
  const longitude = finiteNumber(detail?.location?.coordinates?.longitude ?? detail?.location?.longitude ?? detail?.coordinates?.longitude)
  return { latitude, longitude }
}

function cancellationLabel(product: any): string | null {
  const cancellation = product?.policies?.cancellation
  if (!cancellation) return null
  if (typeof cancellation === 'string') return cancellation.replaceAll('_', ' ')
  if (Array.isArray(cancellation)) {
    const types = cancellation.map(item => item?.type).filter(Boolean)
    return types.length ? types.join(', ').replaceAll('_', ' ') : 'Cancellation terms returned'
  }
  if (cancellation?.type) return String(cancellation.type).replaceAll('_', ' ')
  return 'Cancellation terms returned'
}

function mealLabel(product: any): string | null {
  const meal = product?.policies?.meal_plan
  if (!meal) return null
  if (typeof meal === 'string') return meal.replaceAll('_', ' ')
  if (Array.isArray(meal)) return meal.map(item => typeof item === 'string' ? item : item?.type).filter(Boolean).join(', ').replaceAll('_', ' ') || null
  return meal?.type ? String(meal.type).replaceAll('_', ' ') : null
}

function paymentLabel(product: any): string | null {
  const timings = product?.policies?.payment?.timings
  if (Array.isArray(timings) && timings.length) return timings.join(', ').replaceAll('_', ' ')
  return null
}

function resolveDestinationProxy(destination: string) {
  const iata = resolveCity(destination) || (destination.trim().toUpperCase().match(/^[A-Z]{3}$/)?.[0] ?? '')
  const airport = iata ? getAirport(iata) : undefined
  if (!airport) throw new Error(`CreditIQ could not resolve ${destination} to a global city/airport coordinate yet`)
  return {
    iata: airport.iata,
    city: airport.city,
    latitude: airport.lat,
    longitude: airport.lon,
    // Airport coordinates are a conservative location proxy, not a claim that the
    // airport is the city centre. 50 km keeps metro inventory in scope until the
    // provider's own stable autocomplete/city-ID flow is enabled for our account.
    radiusKm: 50,
  }
}

async function post(path: string, body: unknown) {
  const response = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const json = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = json?.message || json?.error || json?.errors?.[0]?.message || ''
    throw new Error(`Booking.com Demand ${path} failed (${response.status})${message ? `: ${String(message).slice(0, 220)}` : ''}`)
  }
  return json
}

async function detailsFor(ids: number[]) {
  if (!ids.length) return new Map<string, any>()
  const json = await post('/accommodations/details', {
    accommodations: ids.slice(0, 100),
    extras: ['photos'],
    languages: ['en-gb'],
  })
  const rows = Array.isArray(json?.data) ? json.data : []
  return new Map<string, any>(rows.map((row: any) => [String(row?.id), row]))
}

export async function searchBookingDemandHotels(input: BookingSearchInput): Promise<BookingDemandPage> {
  if (!bookingDemandConfigured()) throw new Error('Booking.com Demand API is not configured')
  const destinationProxy = resolveDestinationProxy(input.destination)
  const limit = Math.min(100, Math.max(10, input.limit ?? 50))
  const body: Record<string, unknown> = {
    coordinates: {
      latitude: destinationProxy.latitude,
      longitude: destinationProxy.longitude,
      radius: destinationProxy.radiusKm,
    },
    booker: { country: 'in', platform: 'desktop' },
    currency: 'INR',
    checkin: input.checkin,
    checkout: input.checkout,
    guests: {
      number_of_rooms: Math.max(1, Math.min(8, input.rooms || 1)),
      number_of_adults: Math.max(1, Math.min(30, input.adults || 1)),
    },
    extras: ['products'],
    rows: limit,
  }
  if (input.page) body.page = input.page

  const search = await post('/accommodations/search', body)
  const rows = Array.isArray(search?.data) ? search.data : []
  const ids = rows.map((row: any) => Number(row?.id)).filter((id: number) => Number.isSafeInteger(id) && id > 0)
  let details = new Map<string, any>()
  try {
    details = await detailsFor(ids)
  } catch (error) {
    // Search prices are still usable if optional content enrichment fails.
    console.warn('booking-demand: property detail enrichment failed', error)
  }

  const offers: BookingDemandHotelOffer[] = rows.flatMap((row: any) => {
    const total = totalPrice(row?.price)
    const display = displayPrice(row?.price)
    if (total == null && display == null) return []
    const totalValue = total ?? display as number
    const base = basePrice(row?.price)
    const detail = details.get(String(row?.id)) || {}
    const product = Array.isArray(row?.products) ? row.products[0] : null
    const position = coordinates(detail)
    const currency = String(row?.currency?.booker ?? row?.currency?.accommodation ?? row?.currency ?? 'INR').toUpperCase()
    const webUrl = typeof row?.url === 'string' ? row.url : row?.url?.web
    const detailUrl = typeof detail?.url === 'string' ? detail.url : detail?.url?.web
    const name = translated(detail?.name) || translated(detail?.title) || `Booking.com property ${row.id}`
    const charges = base != null && totalValue >= base ? totalValue - base : null

    return [{
      id: `booking-${row.id}-${product?.id || 'best'}`,
      hotelId: String(row.id),
      hotelName: name,
      chainName: translated(detail?.brands?.[0]?.name) || translated(detail?.chain?.name),
      stars: stars(detail),
      latitude: position.latitude,
      longitude: position.longitude,
      imageUrl: firstPhoto(detail),
      roomName: translated(product?.room?.name) || translated(product?.name),
      roomType: product?.room?.id != null ? `Room ${product.room.id}` : null,
      cancellationPolicy: cancellationLabel(product),
      mealPlan: mealLabel(product),
      paymentType: paymentLabel(product),
      currency,
      // v3.2 `display` is the compliant traveller display price, while `total`
      // may include additional non-conditional charges. CreditIQ stores total for
      // comparison and carries the calculated separation where available.
      totalPrice: totalValue,
      basePrice: base,
      taxesAndFees: charges,
      agentName: 'Booking.com',
      deeplink: String(webUrl || detailUrl || '' || '') || null,
      source: 'booking-demand' as const,
    }]
  })

  const nextPage = String(search?.metadata?.next_page ?? search?.metadata?.next_page_token ?? '').trim() || null
  const total = finiteNumber(search?.metadata?.total_results)

  return {
    offers,
    nextPage,
    total: total != null ? Math.round(total) : null,
    requestId: typeof search?.request_id === 'string' ? search.request_id : null,
    destinationProxy,
  }
}

export function bookingDemandBaseUrl() {
  return baseUrl()
}

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

export type BookingDestinationProxy = {
  iata: string | null
  city: string
  latitude: number | null
  longitude: number | null
  radiusKm: number | null
  bookingCityId: number | null
  resolver: 'airport-coordinate' | 'creditiq-india-destination' | 'booking-autocomplete-city'
  providerKey: string
}

export type BookingDemandPage = {
  offers: BookingDemandHotelOffer[]
  nextPage: string | null
  total: number | null
  requestId: string | null
  destinationProxy: BookingDestinationProxy
}

type IndiaStayDestination = {
  city: string
  aliases: string[]
  latitude: number
  longitude: number
  radiusKm: number
}

// Places without a useful airport-city proxy still need a truthful coordinate search.
// This list is intentionally destination coordinates only — never hotel prices or inventory.
// Booking.com remains the source of live properties, availability and prices.
const INDIA_STAY_DESTINATIONS: IndiaStayDestination[] = [
  { city: 'Agra', aliases: ['agra', 'taj mahal'], latitude: 27.1767, longitude: 78.0081, radiusKm: 25 },
  { city: 'Alappuzha', aliases: ['alappuzha', 'alleppey'], latitude: 9.4981, longitude: 76.3388, radiusKm: 30 },
  { city: 'Amritsar', aliases: ['amritsar', 'golden temple'], latitude: 31.634, longitude: 74.8723, radiusKm: 30 },
  { city: 'Bhopal', aliases: ['bhopal'], latitude: 23.2599, longitude: 77.4126, radiusKm: 35 },
  { city: 'Bhubaneswar', aliases: ['bhubaneswar', 'bhubaneshwar'], latitude: 20.2961, longitude: 85.8245, radiusKm: 35 },
  { city: 'Chandigarh', aliases: ['chandigarh'], latitude: 30.7333, longitude: 76.7794, radiusKm: 35 },
  { city: 'Coorg', aliases: ['coorg', 'kodagu', 'madikeri'], latitude: 12.4244, longitude: 75.7382, radiusKm: 45 },
  { city: 'Darjeeling', aliases: ['darjeeling'], latitude: 27.041, longitude: 88.2663, radiusKm: 35 },
  { city: 'Dehradun', aliases: ['dehradun'], latitude: 30.3165, longitude: 78.0322, radiusKm: 40 },
  { city: 'Dharamshala', aliases: ['dharamshala', 'mcleod ganj', 'mcleodganj'], latitude: 32.219, longitude: 76.3234, radiusKm: 35 },
  { city: 'Gangtok', aliases: ['gangtok'], latitude: 27.3389, longitude: 88.6065, radiusKm: 35 },
  { city: 'Gokarna', aliases: ['gokarna'], latitude: 14.5479, longitude: 74.3188, radiusKm: 30 },
  { city: 'Gulmarg', aliases: ['gulmarg'], latitude: 34.0484, longitude: 74.3805, radiusKm: 25 },
  { city: 'Hampi', aliases: ['hampi', 'hospet', 'hosapete'], latitude: 15.335, longitude: 76.46, radiusKm: 35 },
  { city: 'Haridwar', aliases: ['haridwar', 'hardwar'], latitude: 29.9457, longitude: 78.1642, radiusKm: 30 },
  { city: 'Indore', aliases: ['indore'], latitude: 22.7196, longitude: 75.8577, radiusKm: 40 },
  { city: 'Jaipur', aliases: ['jaipur'], latitude: 26.9124, longitude: 75.7873, radiusKm: 45 },
  { city: 'Jaisalmer', aliases: ['jaisalmer'], latitude: 26.9157, longitude: 70.9083, radiusKm: 35 },
  { city: 'Jodhpur', aliases: ['jodhpur'], latitude: 26.2389, longitude: 73.0243, radiusKm: 40 },
  { city: 'Kodaikanal', aliases: ['kodaikanal', 'kodai'], latitude: 10.2381, longitude: 77.4892, radiusKm: 30 },
  { city: 'Kovalam', aliases: ['kovalam'], latitude: 8.3988, longitude: 76.9781, radiusKm: 20 },
  { city: 'Lonavala', aliases: ['lonavala', 'khandala'], latitude: 18.7546, longitude: 73.4062, radiusKm: 30 },
  { city: 'Mahabaleshwar', aliases: ['mahabaleshwar'], latitude: 17.9307, longitude: 73.6477, radiusKm: 30 },
  { city: 'Mahabalipuram', aliases: ['mahabalipuram', 'mamallapuram'], latitude: 12.6269, longitude: 80.1927, radiusKm: 25 },
  { city: 'Manali', aliases: ['manali'], latitude: 32.2432, longitude: 77.1892, radiusKm: 35 },
  { city: 'Munnar', aliases: ['munnar'], latitude: 10.0889, longitude: 77.0595, radiusKm: 35 },
  { city: 'Mussoorie', aliases: ['mussoorie'], latitude: 30.4598, longitude: 78.0644, radiusKm: 25 },
  { city: 'Mysuru', aliases: ['mysuru', 'mysore'], latitude: 12.2958, longitude: 76.6394, radiusKm: 35 },
  { city: 'Nainital', aliases: ['nainital'], latitude: 29.3919, longitude: 79.4542, radiusKm: 30 },
  { city: 'Ooty', aliases: ['ooty', 'udhagamandalam'], latitude: 11.4064, longitude: 76.6932, radiusKm: 30 },
  { city: 'Pahalgam', aliases: ['pahalgam'], latitude: 34.0161, longitude: 75.315, radiusKm: 30 },
  { city: 'Puducherry', aliases: ['puducherry', 'pondicherry'], latitude: 11.9416, longitude: 79.8083, radiusKm: 30 },
  { city: 'Puri', aliases: ['puri', 'jagannath puri'], latitude: 19.8135, longitude: 85.8312, radiusKm: 30 },
  { city: 'Rishikesh', aliases: ['rishikesh'], latitude: 30.0869, longitude: 78.2676, radiusKm: 30 },
  { city: 'Shimla', aliases: ['shimla'], latitude: 31.1048, longitude: 77.1734, radiusKm: 30 },
  { city: 'Srinagar', aliases: ['srinagar'], latitude: 34.0837, longitude: 74.7973, radiusKm: 40 },
  { city: 'Thekkady', aliases: ['thekkady', 'periyar', 'kumily'], latitude: 9.6031, longitude: 77.1615, radiusKm: 30 },
  { city: 'Tirupati', aliases: ['tirupati'], latitude: 13.6288, longitude: 79.4192, radiusKm: 35 },
  { city: 'Udaipur', aliases: ['udaipur'], latitude: 24.5854, longitude: 73.7125, radiusKm: 40 },
  { city: 'Varanasi', aliases: ['varanasi', 'banaras', 'benaras', 'kashi'], latitude: 25.3176, longitude: 82.9739, radiusKm: 35 },
  { city: 'Varkala', aliases: ['varkala'], latitude: 8.7379, longitude: 76.7163, radiusKm: 25 },
  { city: 'Wayanad', aliases: ['wayanad', 'kalpetta'], latitude: 11.6854, longitude: 76.132, radiusKm: 45 },
]

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

function norm(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/\s+/g, ' ')
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

function localIndiaDestination(destination: string): BookingDestinationProxy | null {
  const query = norm(destination)
  if (!query) return null
  const match = INDIA_STAY_DESTINATIONS.find(item => item.aliases.some(alias => query === norm(alias) || query.includes(norm(alias))))
  if (!match) return null
  return {
    iata: null,
    city: match.city,
    latitude: match.latitude,
    longitude: match.longitude,
    radiusKm: match.radiusKm,
    bookingCityId: null,
    resolver: 'creditiq-india-destination',
    providerKey: `india:${norm(match.city).replaceAll(' ', '-')}`,
  }
}

function airportDestination(destination: string): BookingDestinationProxy | null {
  const iata = resolveCity(destination) || (destination.trim().toUpperCase().match(/^[A-Z]{3}$/)?.[0] ?? '')
  const airport = iata ? getAirport(iata) : undefined
  if (!airport) return null
  return {
    iata: airport.iata,
    city: airport.city,
    latitude: airport.lat,
    longitude: airport.lon,
    radiusKm: 50,
    bookingCityId: null,
    resolver: 'airport-coordinate',
    providerKey: `airport:${airport.iata}`,
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

function autocompleteCityFromRow(row: any): BookingDestinationProxy | null {
  const type = String(row?.type ?? row?.location?.type ?? '').toLowerCase()
  if (type && type !== 'city') return null
  const id = finiteNumber(row?.id ?? row?.city?.id ?? row?.location?.id)
  if (id == null || !Number.isSafeInteger(id)) return null
  const city = translated(row?.name) || translated(row?.city?.name) || translated(row?.location?.name)
  if (!city) return null
  const latitude = finiteNumber(row?.coordinates?.latitude ?? row?.location?.coordinates?.latitude)
  const longitude = finiteNumber(row?.coordinates?.longitude ?? row?.location?.coordinates?.longitude)
  return {
    iata: null,
    city,
    latitude,
    longitude,
    radiusKm: latitude != null && longitude != null ? 30 : null,
    bookingCityId: id,
    resolver: 'booking-autocomplete-city',
    providerKey: `city:${id}`,
  }
}

async function bookingAutocompleteDestination(destination: string): Promise<BookingDestinationProxy | null> {
  if (!bookingDemandConfigured() || destination.trim().length < 3) return null
  try {
    const json = await post('/common/autocomplete', {
      query: destination.trim(),
      language: 'en-gb',
      filters: { types: ['city'] },
    })
    const rows = Array.isArray(json?.data) ? json.data : Array.isArray(json?.suggestions) ? json.suggestions : []
    const query = norm(destination)
    const candidates = rows
      .map(autocompleteCityFromRow)
      .filter((value: BookingDestinationProxy | null): value is BookingDestinationProxy => Boolean(value))
      .sort((a, b) => {
        const aName = norm(a.city)
        const bName = norm(b.city)
        const score = (name: string) => name === query ? 0 : name.startsWith(query) ? 1 : name.includes(query) ? 2 : 3
        return score(aName) - score(bName) || aName.localeCompare(bName)
      })
    return candidates[0] ?? null
  } catch (error: any) {
    // Autocomplete is a limited-access Beta endpoint. Failing it must not break
    // hotel search for destinations CreditIQ can safely resolve another way.
    console.info('booking-demand: autocomplete unavailable; using local resolver', error?.message || error)
    return null
  }
}

export async function resolveBookingDestination(destination: string): Promise<BookingDestinationProxy> {
  // Exact curated leisure destinations should beat a far-away airport city proxy.
  const indiaDestination = localIndiaDestination(destination)
  if (indiaDestination) return indiaDestination

  // Airport/city data gives broad global coverage and remains deterministic.
  const airport = airportDestination(destination)
  if (airport) return airport

  // Booking.com Beta autocomplete extends coverage to destinations that are not in
  // the airport dataset when the partner account has access. It is fail-closed.
  const booking = await bookingAutocompleteDestination(destination)
  if (booking) return booking

  throw new Error(`CreditIQ could not safely resolve ${destination} to a hotel-search location yet`)
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
  const destinationProxy = await resolveBookingDestination(input.destination)
  const limit = Math.min(100, Math.max(10, input.limit ?? 50))
  const body: Record<string, unknown> = {
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

  if (destinationProxy.bookingCityId != null) {
    body.city = destinationProxy.bookingCityId
  } else if (destinationProxy.latitude != null && destinationProxy.longitude != null && destinationProxy.radiusKm != null) {
    body.coordinates = {
      latitude: destinationProxy.latitude,
      longitude: destinationProxy.longitude,
      radius: destinationProxy.radiusKm,
    }
  } else {
    throw new Error(`CreditIQ resolved ${input.destination}, but no safe Booking.com location filter is available`)
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

type Cabin = 'economy' | 'premium_economy' | 'business' | 'first'

export type AmadeusCashFlight = {
  id: string
  price: number
  airline: string
  airlines: string[]
  from: string
  to: string
  departure: string
  arrival: string
  duration: number
  durationSeconds: number
  stops: number
  segments: Array<{
    from: string
    to: string
    airline: string
    flightNo: string
    departure: string
    arrival: string
  }>
  bookingLink: string
  provider: 'amadeus'
  cashCabin: Cabin
}

let tokenCache: { token: string; expiresAt: number; base: string } | null = null

function configured() {
  return Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET)
}

function baseUrl() {
  const override = (process.env.AMADEUS_BASE_URL || '').trim().replace(/\/$/, '')
  if (override) return override
  const env = (process.env.AMADEUS_ENV || 'test').toLowerCase()
  return env === 'production' ? 'https://api.amadeus.com' : 'https://test.api.amadeus.com'
}

async function accessToken(): Promise<string> {
  const base = baseUrl()
  if (tokenCache && tokenCache.base === base && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.token
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.AMADEUS_CLIENT_ID || '',
    client_secret: process.env.AMADEUS_CLIENT_SECRET || '',
  })
  const res = await fetch(`${base}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Amadeus OAuth failed (${res.status})`)
  const json = await res.json()
  if (!json?.access_token) throw new Error('Amadeus OAuth returned no access token')
  const expiresIn = Number(json.expires_in) || 1800
  tokenCache = { token: String(json.access_token), expiresAt: Date.now() + expiresIn * 1000, base }
  return tokenCache.token
}

function cabinValue(cabin: Cabin): string {
  if (cabin === 'premium_economy') return 'PREMIUM_ECONOMY'
  return cabin.toUpperCase()
}

function durationSeconds(iso: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso || '')
  if (!match) return 0
  return (Number(match[1]) || 0) * 3600 + (Number(match[2]) || 0) * 60 + (Number(match[3]) || 0)
}

export async function searchAmadeusFlights(input: {
  from: string
  to: string
  date: string
  cabin: Cabin
  adults?: number
  max?: number
}): Promise<{ flights: AmadeusCashFlight[]; status: number; base: string }> {
  if (!configured()) return { flights: [], status: 0, base: baseUrl() }

  const base = baseUrl()
  const token = await accessToken()
  const url = new URL(`${base}/v2/shopping/flight-offers`)
  url.searchParams.set('originLocationCode', input.from)
  url.searchParams.set('destinationLocationCode', input.to)
  url.searchParams.set('departureDate', input.date)
  url.searchParams.set('adults', String(Math.max(1, input.adults ?? 1)))
  url.searchParams.set('travelClass', cabinValue(input.cabin))
  url.searchParams.set('currencyCode', 'INR')
  url.searchParams.set('max', String(Math.min(250, Math.max(1, input.max ?? 100))))

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Amadeus Flight Offers Search failed (${res.status})${text ? `: ${text.slice(0, 180)}` : ''}`)
  }

  const json = await res.json()
  const raw = Array.isArray(json?.data) ? json.data : []
  const flights: AmadeusCashFlight[] = raw.flatMap((offer: any, offerIndex: number) => {
    const itineraries = Array.isArray(offer?.itineraries) ? offer.itineraries : []
    const itinerary = itineraries[0]
    const rawSegments = Array.isArray(itinerary?.segments) ? itinerary.segments : []
    if (!rawSegments.length) return []

    const first = rawSegments[0]
    const last = rawSegments[rawSegments.length - 1]
    const segments = rawSegments.map((segment: any) => ({
      from: String(segment?.departure?.iataCode || ''),
      to: String(segment?.arrival?.iataCode || ''),
      airline: String(segment?.carrierCode || ''),
      flightNo: `${segment?.carrierCode || ''}${segment?.number || ''}`,
      departure: String(segment?.departure?.at || ''),
      arrival: String(segment?.arrival?.at || ''),
    }))
    const carriers = [...new Set(segments.map(segment => segment.airline).filter(Boolean))]
    const seconds = durationSeconds(String(itinerary?.duration || ''))
    const total = Number(offer?.price?.grandTotal ?? offer?.price?.total)
    if (!Number.isFinite(total) || total <= 0) return []

    return [{
      id: `amadeus-${offer?.id || offerIndex}-${first?.departure?.at || input.date}`,
      price: total,
      airline: carriers[0] || 'Multiple',
      airlines: carriers,
      from: String(first?.departure?.iataCode || input.from),
      to: String(last?.arrival?.iataCode || input.to),
      departure: String(first?.departure?.at || input.date),
      arrival: String(last?.arrival?.at || ''),
      duration: seconds > 0 ? Math.max(1, Math.round(seconds / 3600)) : 0,
      durationSeconds: seconds,
      stops: Math.max(0, rawSegments.length - 1),
      segments,
      bookingLink: '',
      provider: 'amadeus' as const,
      cashCabin: input.cabin,
    }]
  })

  return { flights, status: res.status, base }
}

export function amadeusFlightsConfigured() {
  return configured()
}

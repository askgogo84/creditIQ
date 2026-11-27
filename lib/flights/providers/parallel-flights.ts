/**
 * Parallel Flights API pilot. Official endpoint: POST /v1/flights/search.
 * Only an authenticated, flag-gated caller may invoke this adapter.
 * Search results contain provider-listed totals, NOT a verified checkout price.
 *
 * Source: https://docs.parallel.ai/flight-search/best-practices
 */
export type FlightCabin = 'economy' | 'premium_economy' | 'business' | 'first'
export type ParallelFlightInput = {
  from: string
  to: string
  date: string
  cabin: FlightCabin
  adults: number
}
export type ParallelFlight = {
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
  segments: Array<{ from: string; to: string; airline: string; flightNo: string; departure: string; arrival: string }>
  bookingLink: string
  provider: 'parallel-flights'
  cashCabin: FlightCabin
  pricedAdults: number
  priceCurrency: 'INR'
  fareBasis: 'TOTAL_FOR_REQUESTED_ADULTS'
  requiresRepriceBeforeBooking: true
  bookingLinkAuthority: 'AIRLINE_SEARCH_OR_HOMEPAGE'
}
export type ParallelFlightSearchResult = {
  status: 'DISABLED' | 'SUCCESS' | 'EMPTY' | 'ACCESS_DENIED' | 'RATE_LIMITED' | 'PROVIDER_ERROR'
  flights: ParallelFlight[]
  searchId: string | null
}
const BASE = 'https://api.parallel.ai/v1/flights/search'
const DAY = /^20\d{2}-\d{2}-\d{2}$/
const IATA = /^[A-Z]{3}$/
const CABIN = new Set(['economy', 'premium_economy', 'business', 'first'])

export function parallelFlightsConfigured(env: Record<string, string | undefined> = process.env) {
  return env.PARALLEL_FLIGHTS_ENABLED === 'true' && Boolean(env.PARALLEL_API_KEY)
}

/** Explicit owner-controlled pilot allowlist; no public unauthenticated API spend. */
export function parallelPilotUserAllowed(userId: string, env: Record<string, string | undefined> = process.env): boolean {
  if (!parallelFlightsConfigured(env) || !userId) return false
  const allowed = String(env.PARALLEL_FLIGHTS_PILOT_USER_IDS || '').split(',')
    .map(s => s.trim()).filter(Boolean)
  return allowed.includes(userId)
}

function cabinOf(value: unknown): FlightCabin | null {
  const raw = String(value || '').trim().toLowerCase().replace(/[ -]+/g, '_')
  return CABIN.has(raw) ? raw as FlightCabin : null
}
function flightNoCode(flightNumber: string) {
  return /^([A-Z0-9]{2})\s*\d/i.exec(flightNumber.trim().toUpperCase())?.[1] || ''
}
function safeHttps(value: unknown): string {
  try {
    const u = new URL(String(value || ''))
    if (u.protocol !== 'https:' || !u.hostname || u.username || u.password) return ''
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.)/i.test(u.hostname)) return ''
    return u.toString()
  } catch { return '' }
}
function isoLocal(value: unknown): string {
  const raw = String(value || '').trim()
  return /^20\d{2}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(raw)
    ? raw.replace(' ', 'T') : ''
}

export function normalizeParallelFlights(
  raw: unknown, input: ParallelFlightInput,
): ParallelFlight[] {
  const payload = raw as { results?: unknown[]; search_id?: string } | null
  const list = Array.isArray(payload?.results) ? payload.results : []
  return list.flatMap((row, index) => {
    const itinerary = row as Record<string, any> | null
    const leg = itinerary?.outbound
    const price = itinerary?.price
    const bookingLink = safeHttps(itinerary?.url)
    if (!leg || typeof price !== 'number' || !Number.isFinite(price) || price <= 0 || !bookingLink) return []
    const from = String(leg.departure_airport || '').toUpperCase()
    const to = String(leg.arrival_airport || '').toUpperCase()
    const departure = isoLocal(leg.departure_time)
    const arrival = isoLocal(leg.arrival_time)
    if (from !== input.from || to !== input.to || !departure.startsWith(input.date) || !arrival) return []
    const segs = Array.isArray(leg.segments) ? leg.segments : []
    if (!segs.length) return []
    // The Flights API filters by cabin, but reject any explicitly conflicting
    // segment. Premium cabins need a reported match for every segment.
    const allCabinsKnown = segs.every(s => cabinOf(s?.cabin) === input.cabin)
    if (segs.some(s => s?.cabin && cabinOf(s.cabin) !== input.cabin)) return []
    if (input.cabin !== 'economy' && !allCabinsKnown) return []
    const segments: ParallelFlight['segments'] = segs.map((s: any) => {
      const flightNo = String(s?.flight_number || '').trim()
      return {
        from: String(s?.departure_airport || '').toUpperCase(),
        to: String(s?.arrival_airport || '').toUpperCase(),
        airline: flightNoCode(flightNo),
        flightNo,
        departure: isoLocal(s?.departure_time),
        arrival: isoLocal(s?.arrival_time),
      }
    })
    // Never date-match an unrelated airline reward because a carrier is missing.
    if (segments.some(s => !IATA.test(s.from) || !IATA.test(s.to) || !s.airline ||
      !s.departure || !s.arrival)) return []
    const codes = [...new Set(segments.map(s => s.airline))]
    const minutes = Number(leg.duration_minutes || 0)
    const stops = Number(leg.stops)
    if (!Number.isSafeInteger(stops) || stops < 0) return []
    if (!Number.isFinite(minutes) || minutes <= 0) return []
    return [{
      id: 'parallel-' + index + '-' + departure,
      price, airline: codes[0], airlines: codes,
      from, to, departure, arrival,
      duration: Math.max(1, Math.round(minutes / 60)),
      durationSeconds: minutes * 60, stops, segments,
      bookingLink,
      provider: 'parallel-flights' as const,
      cashCabin: input.cabin, pricedAdults: input.adults,
      priceCurrency: 'INR' as const,
      fareBasis: 'TOTAL_FOR_REQUESTED_ADULTS' as const,
      requiresRepriceBeforeBooking: true as const,
      bookingLinkAuthority: 'AIRLINE_SEARCH_OR_HOMEPAGE' as const,
    }]
  })
}

export async function searchParallelFlights(
  input: ParallelFlightInput,
  options: { apiKey?: string; enabled?: boolean; fetcher?: typeof fetch } = {},
): Promise<ParallelFlightSearchResult> {
  const key = options.apiKey ?? process.env.PARALLEL_API_KEY ?? ''
  const enabled = options.enabled ?? (process.env.PARALLEL_FLIGHTS_ENABLED === 'true')
  if (!enabled || !key) return { status: 'DISABLED', flights: [], searchId: null }
  if (!IATA.test(input.from) || !IATA.test(input.to) || input.from === input.to ||
      !DAY.test(input.date) || !CABIN.has(input.cabin) ||
      !Number.isSafeInteger(input.adults) || input.adults < 1 || input.adults > 9) {
    return { status: 'PROVIDER_ERROR', flights: [], searchId: null }
  }
  const today = new Date().toISOString().slice(0, 10)
  const ms = Date.parse(input.date + 'T00:00:00Z')
  if (input.date < today || ms > Date.now() + 330 * 86_400_000) {
    return { status: 'PROVIDER_ERROR', flights: [], searchId: null }
  }
  try {
    const res = await (options.fetcher ?? fetch)(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body: JSON.stringify({
        origins: [input.from], destinations: [input.to],
        departure_date: input.date, adults: input.adults,
        cabin: input.cabin, currency: 'INR', sort: 'price',
        advanced_settings: { max_results: 12 },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(25_000),
    })
    if (res.status === 401 || res.status === 403) return { status: 'ACCESS_DENIED', flights: [], searchId: null }
    if (res.status === 429) return { status: 'RATE_LIMITED', flights: [], searchId: null }
    if (!res.ok) return { status: 'PROVIDER_ERROR', flights: [], searchId: null }
    const data = await res.json()
    const flights = normalizeParallelFlights(data, input)
    return {
      status: flights.length ? 'SUCCESS' : 'EMPTY',
      flights, searchId: typeof data?.search_id === 'string' ? data.search_id : null,
    }
  } catch {
    return { status: 'PROVIDER_ERROR', flights: [], searchId: null }
  }
}

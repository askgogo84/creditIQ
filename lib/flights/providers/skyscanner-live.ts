type Cabin = 'economy' | 'premium_economy' | 'business' | 'first'

export type SkyscannerCashFlight = {
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
  provider: 'skyscanner-live'
  cashCabin: Cabin
}

const BASE = 'https://partners.api.skyscanner.net/apiservices/v3/flights/live/search'

function key() {
  return process.env.SKYSCANNER_API_KEY || ''
}

export function skyscannerFlightsConfigured() {
  return Boolean(key())
}

function cabinEnum(cabin: Cabin) {
  if (cabin === 'premium_economy') return 'CABIN_CLASS_PREMIUM_ECONOMY'
  if (cabin === 'business') return 'CABIN_CLASS_BUSINESS'
  if (cabin === 'first') return 'CABIN_CLASS_FIRST'
  return 'CABIN_CLASS_ECONOMY'
}

function dateParts(date: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!match) throw new Error('Skyscanner date must use YYYY-MM-DD')
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}

function dt(value: any): string {
  if (!value || !value.year) return ''
  const pad = (n: number) => String(n || 0).padStart(2, '0')
  return `${value.year}-${pad(value.month)}-${pad(value.day)}T${pad(value.hour)}:${pad(value.minute)}:${pad(value.second)}`
}

function priceAmount(price: any): number | null {
  const amount = Number(price?.amount)
  if (!Number.isFinite(amount) || amount <= 0) return null
  const unit = String(price?.unit || 'PRICE_UNIT_WHOLE')
  const divisor = unit === 'PRICE_UNIT_CENTI' ? 100 : unit === 'PRICE_UNIT_MILLI' ? 1000 : unit === 'PRICE_UNIT_MICRO' ? 1_000_000 : 1
  return amount / divisor
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function normalize(json: any, input: { from: string; to: string; cabin: Cabin }): SkyscannerCashFlight[] {
  const results = json?.content?.results || {}
  const itineraries = results?.itineraries || {}
  const legs = results?.legs || {}
  const segmentsMap = results?.segments || {}
  const carriers = results?.carriers || {}
  const places = results?.places || {}

  const placeIata = (id: string, fallback: string) => String(places?.[id]?.iata || fallback)
  const carrierCode = (id: string) => String(carriers?.[id]?.iata || carriers?.[id]?.displayCode || '')

  return Object.entries(itineraries).flatMap(([itineraryId, itinerary]: [string, any]) => {
    const legId = Array.isArray(itinerary?.legIds) ? itinerary.legIds[0] : null
    const leg = legId ? legs?.[legId] : null
    if (!leg) return []

    const pricingOptions = Array.isArray(itinerary?.pricingOptions) ? itinerary.pricingOptions : []
    const priced = pricingOptions
      .map((option: any) => ({ option, amount: priceAmount(option?.price) }))
      .filter((entry: any) => entry.amount != null)
      .sort((a: any, b: any) => a.amount - b.amount)[0]
    if (!priced) return []

    const segmentIds = Array.isArray(leg?.segmentIds) ? leg.segmentIds : []
    const segments: SkyscannerCashFlight['segments'] = segmentIds.map((segmentId: string) => {
      const segment = segmentsMap?.[segmentId] || {}
      const airline = carrierCode(String(segment?.marketingCarrierId || ''))
      return {
        from: placeIata(String(segment?.originPlaceId || ''), input.from),
        to: placeIata(String(segment?.destinationPlaceId || ''), input.to),
        airline,
        flightNo: `${airline}${segment?.marketingFlightNumber || ''}`,
        departure: dt(segment?.departureDateTime),
        arrival: dt(segment?.arrivalDateTime),
      }
    })

    const marketing: string[] = Array.isArray(leg?.marketingCarrierIds)
      ? leg.marketingCarrierIds.map((id: string) => carrierCode(id)).filter(Boolean)
      : []
    const airlineCodes: string[] = [...new Set([
      ...marketing,
      ...segments.map((segment: SkyscannerCashFlight['segments'][number]) => segment.airline).filter(Boolean),
    ])]
    const minutes = Number(leg?.durationInMinutes) || 0
    const deepLink = priced.option?.items?.find((item: any) => item?.deepLink)?.deepLink || ''

    return [{
      id: `skyscanner-${itineraryId}`,
      price: priced.amount as number,
      airline: airlineCodes[0] || 'Multiple',
      airlines: airlineCodes,
      from: placeIata(String(leg?.originPlaceId || ''), input.from),
      to: placeIata(String(leg?.destinationPlaceId || ''), input.to),
      departure: dt(leg?.departureDateTime),
      arrival: dt(leg?.arrivalDateTime),
      duration: minutes > 0 ? Math.max(1, Math.round(minutes / 60)) : 0,
      durationSeconds: minutes * 60,
      stops: Math.max(0, Number(leg?.stopCount) || 0),
      segments,
      bookingLink: String(deepLink),
      provider: 'skyscanner-live' as const,
      cashCabin: input.cabin,
    }]
  })
}

export async function searchSkyscannerFlights(input: {
  from: string
  to: string
  date: string
  cabin: Cabin
  adults?: number
}): Promise<{ flights: SkyscannerCashFlight[]; status: string; polls: number }> {
  if (!key()) return { flights: [], status: 'NOT_CONFIGURED', polls: 0 }

  const create = await fetch(`${BASE}/create`, {
    method: 'POST',
    headers: { 'x-api-key': key(), 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({
      query: {
        market: 'IN',
        locale: 'en-GB',
        currency: 'INR',
        queryLegs: [{
          originPlaceId: { iata: input.from },
          destinationPlaceId: { iata: input.to },
          date: dateParts(input.date),
        }],
        adults: Math.max(1, input.adults ?? 1),
        childrenAges: [],
        cabinClass: cabinEnum(input.cabin),
        nearbyAirports: false,
        includeSustainabilityData: false,
      },
    }),
  })

  if (!create.ok) throw new Error(`Skyscanner Flights create failed (${create.status})`)
  let latest = await create.json()
  const sessionToken = String(latest?.sessionToken || '')
  if (!sessionToken) throw new Error('Skyscanner Flights create returned no session token')

  let polls = 0
  for (let i = 0; i < 5 && latest?.status !== 'RESULT_STATUS_COMPLETE'; i++) {
    if (i > 0) await sleep(550)
    const poll = await fetch(`${BASE}/poll/${encodeURIComponent(sessionToken)}`, {
      method: 'POST',
      headers: { 'x-api-key': key(), 'Content-Type': 'application/json' },
      cache: 'no-store',
    })
    polls += 1
    if (!poll.ok) throw new Error(`Skyscanner Flights poll failed (${poll.status})`)
    const polled = await poll.json()
    if (polled?.content?.results?.itineraries) latest = polled
    else if (polled?.status) latest = { ...latest, status: polled.status }
  }

  return {
    flights: normalize(latest, input).sort((a, b) => a.price - b.price),
    status: String(latest?.status || 'RESULT_STATUS_UNSPECIFIED'),
    polls,
  }
}

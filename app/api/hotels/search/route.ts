// Global hotel search provider orchestration.
// Priority: Booking.com Demand API -> Skyscanner Hotels Live Prices -> HBX Hotelbeds.
// Captured fixtures are deliberately excluded from this endpoint.
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import {
  createHotelSearch,
  pollHotelSearch,
  skyscannerHotelsConfigured,
} from '@/lib/hotels/providers/skyscanner-live'
import {
  bookingDemandBaseUrl,
  bookingDemandConfigured,
  searchBookingDemandHotels,
  type BookingDestinationProxy,
} from '@/lib/hotels/providers/booking-demand'
import {
  hotelbedsConfigured,
  hotelbedsConfigurationState,
  searchHotelbedsHotels,
} from '@/lib/hotels/providers/hotelbeds-hbx'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

type Attempt = {
  provider: string
  ok: boolean
  loaded: number
  note: string
}

function unavailable(attempts: Attempt[]) {
  return NextResponse.json({
    hotels: [],
    offers: [],
    error: 'no live hotel provider is configured or responding',
    attempts,
    coverage: {
      provider: 'none',
      mode: 'UNAVAILABLE',
      loaded: 0,
      provider_total: null,
      has_more: false,
      fetched_at: new Date().toISOString(),
      note: 'CreditIQ does not substitute captured/demo hotel rates for a different destination.',
      hbx_configuration: hotelbedsConfigurationState(),
    },
  }, { status: 503 })
}

function bookingResolutionNote(proxy: BookingDestinationProxy) {
  const environment = bookingDemandBaseUrl().includes('sandbox') ? 'sandbox' : 'production'
  if (proxy.resolver === 'booking-autocomplete-city') {
    return `Booking.com Demand v3.2 ${environment} search. Destination resolved by Booking.com city autocomplete (${proxy.city}, city ${proxy.bookingCityId}).`
  }
  if (proxy.resolver === 'creditiq-india-destination') {
    return `Booking.com Demand v3.2 ${environment} search. ${proxy.city} resolved to a curated CreditIQ destination coordinate with a ${proxy.radiusKm} km search radius; Booking.com remains the source of live properties and prices.`
  }
  return `Booking.com Demand v3.2 ${environment} search. Destination resolved through CreditIQ's airport/city coordinates (${proxy.city}${proxy.iata ? `/${proxy.iata}` : ''}) with a ${proxy.radiusKm} km metro radius.`
}

async function bookingPage(body: any, pageToken: string | null) {
  const destination = typeof body.destination === 'string' ? body.destination.trim() : ''
  const checkin = typeof body.checkin === 'string' ? body.checkin : ''
  const checkout = typeof body.checkout === 'string' ? body.checkout : ''
  if (!destination || !checkin || !checkout) {
    throw new Error('destination, checkin and checkout are required')
  }
  const limit = Number.isFinite(Number(body.limit)) ? Number(body.limit) : 50
  const result = await searchBookingDemandHotels({
    destination,
    checkin,
    checkout,
    adults: Number.isFinite(Number(body.adults)) ? Number(body.adults) : 2,
    rooms: Number.isFinite(Number(body.rooms)) ? Number(body.rooms) : 1,
    limit,
    page: pageToken,
  })

  return {
    hotels: result.offers,
    offers: result.offers,
    sessionToken: result.nextPage ? `booking:${result.nextPage}` : undefined,
    coverage: {
      provider: 'booking-demand',
      mode: result.nextPage ? 'PROVIDER_PAGEABLE' : 'PROVIDER_COMPLETE',
      destination,
      entityId: `booking:${result.destinationProxy.providerKey}`,
      loaded: result.offers.length,
      provider_total: result.total,
      has_more: Boolean(result.nextPage),
      next_page: result.nextPage,
      limit,
      status: 'LIVE_PROVIDER_RETURNED',
      fetched_at: new Date().toISOString(),
      destination_resolution: {
        resolver: result.destinationProxy.resolver,
        city: result.destinationProxy.city,
        iata: result.destinationProxy.iata,
        booking_city_id: result.destinationProxy.bookingCityId,
      },
      note: bookingResolutionNote(result.destinationProxy),
    },
    requestId: result.requestId,
  }
}

async function execute(req: NextRequest, body: any) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  const attempts: Attempt[] = []
  const sessionToken = typeof body?.sessionToken === 'string' ? body.sessionToken : ''

  // Provider-specific continuation.
  if (sessionToken.startsWith('booking:')) {
    if (!bookingDemandConfigured()) return unavailable([{ provider: 'booking-demand', ok: false, loaded: 0, note: 'continuation requested but provider is not configured' }])
    try {
      const page = await bookingPage(body, sessionToken.slice('booking:'.length))
      return NextResponse.json({ ...page, attempts: [{ provider: 'booking-demand', ok: true, loaded: page.offers.length, note: 'next Booking.com provider page returned' }] })
    } catch (error: any) {
      console.error('booking-demand continuation failed', error?.message || error)
      return NextResponse.json({ error: error?.message || 'Booking.com continuation failed' }, { status: 502 })
    }
  }

  if (sessionToken) {
    // Existing Skyscanner Hotels continuation shape.
    if (!skyscannerHotelsConfigured()) return unavailable([{ provider: 'skyscanner-hotels-live', ok: false, loaded: 0, note: 'continuation requested but provider is not configured' }])
    const destination = typeof body.destination === 'string' ? body.destination.trim() : ''
    const entityId = typeof body.entityId === 'string' ? body.entityId.trim() : ''
    const offset = Number.isFinite(Number(body.offset)) ? Number(body.offset) : 0
    const limit = Number.isFinite(Number(body.limit)) ? Number(body.limit) : 50
    if (!destination || !entityId) {
      return NextResponse.json({ error: 'destination and entityId are required with Skyscanner sessionToken' }, { status: 400 })
    }
    try {
      const page = await pollHotelSearch({ sessionToken, destination, entityId, offset, limit })
      return NextResponse.json({ hotels: page.offers, ...page, attempts: [{ provider: 'skyscanner-hotels-live', ok: true, loaded: page.offers.length, note: 'next Skyscanner provider page returned' }] })
    } catch (error: any) {
      console.error('skyscanner hotel continuation failed', error?.message || error)
      return NextResponse.json({ error: error?.message || 'hotel continuation failed' }, { status: 502 })
    }
  }

  const destination = typeof body?.destination === 'string' ? body.destination.trim() : ''
  const checkin = typeof body?.checkin === 'string' ? body.checkin : ''
  const checkout = typeof body?.checkout === 'string' ? body.checkout : ''
  if (!destination || !checkin || !checkout) {
    return NextResponse.json({ error: 'destination, checkin and checkout are required' }, { status: 400 })
  }
  const limit = Number.isFinite(Number(body?.limit)) ? Number(body.limit) : 50
  const adults = Number.isFinite(Number(body?.adults)) ? Number(body.adults) : 2
  const rooms = Number.isFinite(Number(body?.rooms)) ? Number(body.rooms) : 1

  // 1. Booking.com Demand v3.2 — global search/look/redirect target.
  if (bookingDemandConfigured()) {
    try {
      const page = await bookingPage(body, null)
      attempts.push({ provider: 'booking-demand', ok: true, loaded: page.offers.length, note: page.offers.length ? 'live accommodation search returned offers' : 'zero offers; trying next provider' })
      if (page.offers.length > 0) return NextResponse.json({ ...page, attempts })
    } catch (error: any) {
      attempts.push({ provider: 'booking-demand', ok: false, loaded: 0, note: 'request failed; trying next provider' })
      console.error('booking-demand hotel search failed', error?.message || error)
    }
  } else {
    attempts.push({ provider: 'booking-demand', ok: false, loaded: 0, note: 'not configured' })
  }

  // 2. Skyscanner Hotels Live Prices — pageable provider.
  if (skyscannerHotelsConfigured()) {
    try {
      const page = await createHotelSearch({ destination, checkin, checkout, adults, rooms, limit })
      attempts.push({ provider: 'skyscanner-hotels-live', ok: true, loaded: page.offers.length, note: page.offers.length ? 'live hotel session returned offers' : 'zero offers; trying next provider' })
      if (page.offers.length > 0) return NextResponse.json({ hotels: page.offers, ...page, attempts })
    } catch (error: any) {
      attempts.push({ provider: 'skyscanner-hotels-live', ok: false, loaded: 0, note: 'request failed; trying next provider' })
      console.error('global Skyscanner hotel search failed', error?.message || error)
    }
  } else {
    attempts.push({ provider: 'skyscanner-hotels-live', ok: false, loaded: 0, note: 'not configured' })
  }

  // 3. HBX / Hotelbeds Booking API — mTLS live availability fallback.
  // Evaluation credentials default to the TEST mTLS host; no booking is created here.
  if (hotelbedsConfigured()) {
    try {
      const page = await searchHotelbedsHotels({ destination, checkin, checkout, adults, rooms, limit })
      attempts.push({ provider: 'hotelbeds-hbx', ok: true, loaded: page.offers.length, note: page.offers.length ? `HBX ${page.environment} availability returned offers` : 'HBX returned zero available hotels' })
      if (page.offers.length > 0) {
        return NextResponse.json({
          hotels: page.offers,
          offers: page.offers,
          coverage: {
            provider: 'hotelbeds-hbx',
            mode: 'PROVIDER_WINDOW',
            destination,
            entityId: `hbx:${page.destinationCode}`,
            loaded: page.offers.length,
            provider_total: page.total,
            has_more: false,
            status: page.environment === 'production' ? 'LIVE_PROVIDER_RETURNED' : 'EVALUATION_PROVIDER_RETURNED',
            fetched_at: new Date().toISOString(),
            note: `HBX Hotelbeds ${page.environment} mTLS availability. Evaluation inventory is genuine provider-returned test availability and cannot create a real reservation from this search endpoint.`,
          },
          attempts,
          requestId: page.requestId,
        })
      }
    } catch (error: any) {
      const note = String(error?.message || 'request failed')
      attempts.push({ provider: 'hotelbeds-hbx', ok: false, loaded: 0, note })
      console.error('HBX Hotelbeds search failed', note)
    }
  } else {
    const state = hotelbedsConfigurationState()
    const missing = [
      !state.apiKey && 'API key',
      !state.secret && 'secret',
      !state.clientCert && 'client certificate',
      !state.clientKey && 'client private key',
    ].filter(Boolean).join(', ')
    attempts.push({ provider: 'hotelbeds-hbx', ok: false, loaded: 0, note: `not configured${missing ? ` · missing ${missing}` : ''}` })
  }

  return unavailable(attempts)
}

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }
  return execute(req, body)
}

export async function GET(req: NextRequest) {
  const p = new URL(req.url).searchParams
  return execute(req, {
    destination: p.get('location') || p.get('destination') || '',
    checkin: p.get('check_in') || p.get('checkin') || '',
    checkout: p.get('check_out') || p.get('checkout') || '',
    adults: p.get('adults') || 2,
    rooms: p.get('rooms') || 1,
    limit: p.get('limit') || 50,
    sessionToken: p.get('sessionToken') || undefined,
    entityId: p.get('entityId') || undefined,
    offset: p.get('offset') || 0,
  })
}

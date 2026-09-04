// Global hotel search provider orchestration.
// Priority: Booking.com Demand API -> Skyscanner Hotels Live Prices.
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
} from '@/lib/hotels/providers/booking-demand'

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
    },
  }, { status: 503 })
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
      entityId: `booking-proxy:${result.destinationProxy.iata}`,
      loaded: result.offers.length,
      provider_total: result.total,
      has_more: Boolean(result.nextPage),
      next_page: result.nextPage,
      limit,
      status: 'LIVE_PROVIDER_RETURNED',
      fetched_at: new Date().toISOString(),
      note: `Booking.com Demand v3.2 ${bookingDemandBaseUrl().includes('sandbox') ? 'sandbox' : 'production'} search. Destination is currently resolved through CreditIQ's global airport/city coordinates (${result.destinationProxy.city}/${result.destinationProxy.iata}) with a ${result.destinationProxy.radiusKm} km metro radius.`,
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

  // 2. Skyscanner Hotels Live Prices — existing pageable provider.
  if (skyscannerHotelsConfigured()) {
    try {
      const page = await createHotelSearch({
        destination,
        checkin,
        checkout,
        adults: Number.isFinite(Number(body.adults)) ? Number(body.adults) : 2,
        rooms: Number.isFinite(Number(body.rooms)) ? Number(body.rooms) : 1,
        limit,
      })
      attempts.push({ provider: 'skyscanner-hotels-live', ok: true, loaded: page.offers.length, note: page.offers.length ? 'live hotel session returned offers' : 'zero offers' })
      if (page.offers.length > 0) return NextResponse.json({ hotels: page.offers, ...page, attempts })
    } catch (error: any) {
      attempts.push({ provider: 'skyscanner-hotels-live', ok: false, loaded: 0, note: 'request failed' })
      console.error('global Skyscanner hotel search failed', error?.message || error)
    }
  } else {
    attempts.push({ provider: 'skyscanner-hotels-live', ok: false, loaded: 0, note: 'not configured' })
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

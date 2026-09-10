import { NextRequest, NextResponse } from 'next/server'
import { verifyGogoServiceRequest } from '@/lib/gogo-service-auth'
import {
  createHotelSearch,
  skyscannerHotelsConfigured,
} from '@/lib/hotels/providers/skyscanner-live'
import {
  bookingDemandConfigured,
  searchBookingDemandHotels,
} from '@/lib/hotels/providers/booking-demand'
import {
  hotelbedsConfigured,
  hotelbedsConfigurationState,
  searchHotelbedsHotels,
} from '@/lib/hotels/providers/hotelbeds-hbx'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

type Attempt = { provider: string; ok: boolean; loaded: number; note: string }

function unavailable(attempts: Attempt[]) {
  return NextResponse.json({
    hotels: [],
    offers: [],
    source: 'creditiq',
    error: 'no live hotel provider is configured or responding',
    attempts,
    coverage: {
      provider: 'none',
      mode: 'UNAVAILABLE',
      loaded: 0,
      provider_total: null,
      has_more: false,
      fetched_at: new Date().toISOString(),
      hbx_configuration: hotelbedsConfigurationState(),
      note: 'CreditIQ returned no usable live hotel inventory for this request.',
    },
  }, { status: 503 })
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  if (!verifyGogoServiceRequest(req, rawBody)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: any
  try {
    body = JSON.parse(rawBody || '{}')
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const destination = typeof body?.destination === 'string' ? body.destination.trim() : ''
  const checkin = typeof body?.checkin === 'string' ? body.checkin.trim() : ''
  const checkout = typeof body?.checkout === 'string' ? body.checkout.trim() : ''
  const adults = Number.isFinite(Number(body?.adults)) ? Math.max(1, Math.min(9, Number(body.adults))) : 1
  const rooms = Number.isFinite(Number(body?.rooms)) ? Math.max(1, Math.min(5, Number(body.rooms))) : 1
  const limit = Number.isFinite(Number(body?.limit)) ? Math.max(1, Math.min(50, Number(body.limit))) : 20

  if (!destination || !/^20\d{2}-\d{2}-\d{2}$/.test(checkin) || !/^20\d{2}-\d{2}-\d{2}$/.test(checkout)) {
    return NextResponse.json({ error: 'destination, checkin and checkout are required' }, { status: 400 })
  }
  if (checkout <= checkin) {
    return NextResponse.json({ error: 'checkout must be after checkin' }, { status: 400 })
  }

  const attempts: Attempt[] = []

  if (bookingDemandConfigured()) {
    try {
      const result = await searchBookingDemandHotels({ destination, checkin, checkout, adults, rooms, limit, page: null })
      attempts.push({ provider: 'booking-demand', ok: true, loaded: result.offers.length, note: result.offers.length ? 'live Booking.com offers returned' : 'zero offers; trying next provider' })
      if (result.offers.length) {
        return NextResponse.json({
          hotels: result.offers,
          offers: result.offers,
          source: 'booking-demand',
          attempts,
          coverage: {
            provider: 'booking-demand',
            mode: result.nextPage ? 'PROVIDER_PAGEABLE' : 'PROVIDER_COMPLETE',
            loaded: result.offers.length,
            provider_total: result.total,
            has_more: Boolean(result.nextPage),
            next_page: result.nextPage,
            fetched_at: new Date().toISOString(),
            destination_resolution: {
              resolver: result.destinationProxy.resolver,
              city: result.destinationProxy.city,
              iata: result.destinationProxy.iata,
              booking_city_id: result.destinationProxy.bookingCityId,
            },
            note: 'Live Booking.com Demand inventory returned through CreditIQ for AskGogo.',
          },
        })
      }
    } catch (error: any) {
      attempts.push({ provider: 'booking-demand', ok: false, loaded: 0, note: 'request failed; trying next provider' })
      console.error('gogo hotel bridge booking-demand failed', error?.message || error)
    }
  } else {
    attempts.push({ provider: 'booking-demand', ok: false, loaded: 0, note: 'not configured' })
  }

  if (skyscannerHotelsConfigured()) {
    try {
      const page = await createHotelSearch({ destination, checkin, checkout, adults, rooms, limit })
      attempts.push({ provider: 'skyscanner-hotels-live', ok: true, loaded: page.offers.length, note: page.offers.length ? 'live Skyscanner offers returned' : 'zero offers; trying next provider' })
      if (page.offers.length) {
        return NextResponse.json({
          hotels: page.offers,
          offers: page.offers,
          source: 'skyscanner-hotels-live',
          attempts,
          coverage: {
            ...page.coverage,
            sessionToken: page.sessionToken,
            note: 'Live Skyscanner Hotels inventory returned through CreditIQ for AskGogo.',
          },
        })
      }
    } catch (error: any) {
      attempts.push({ provider: 'skyscanner-hotels-live', ok: false, loaded: 0, note: 'request failed; trying next provider' })
      console.error('gogo hotel bridge skyscanner failed', error?.message || error)
    }
  } else {
    attempts.push({ provider: 'skyscanner-hotels-live', ok: false, loaded: 0, note: 'not configured' })
  }

  if (hotelbedsConfigured()) {
    try {
      const page = await searchHotelbedsHotels({ destination, checkin, checkout, adults, rooms, limit })
      attempts.push({ provider: 'hotelbeds-hbx', ok: true, loaded: page.offers.length, note: page.offers.length ? `HBX ${page.environment} availability returned offers` : 'zero offers' })
      if (page.offers.length) {
        return NextResponse.json({
          hotels: page.offers,
          offers: page.offers,
          source: 'hotelbeds-hbx',
          attempts,
          coverage: {
            provider: 'hotelbeds-hbx',
            mode: 'PROVIDER_WINDOW',
            loaded: page.offers.length,
            provider_total: page.total,
            has_more: false,
            fetched_at: new Date().toISOString(),
            environment: page.environment,
            note: `HBX Hotelbeds ${page.environment} availability returned through CreditIQ for AskGogo.`,
          },
        })
      }
    } catch (error: any) {
      attempts.push({ provider: 'hotelbeds-hbx', ok: false, loaded: 0, note: 'request failed' })
      console.error('gogo hotel bridge HBX failed', error?.message || error)
    }
  } else {
    attempts.push({ provider: 'hotelbeds-hbx', ok: false, loaded: 0, note: 'not configured' })
  }

  return unavailable(attempts)
}

// Global hotel search. Skyscanner Hotels Live Prices is pageable and provides
// destination-wide live inventory. The retired Hotellook API is deliberately no
// longer used here.
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import {
  createHotelSearch,
  pollHotelSearch,
  skyscannerHotelsConfigured,
} from '@/lib/hotels/providers/skyscanner-live'

export const runtime = 'nodejs'
export const maxDuration = 60
export const dynamic = 'force-dynamic'

function unavailable() {
  return NextResponse.json({
    hotels: [],
    offers: [],
    error: 'live hotel provider is not configured',
    coverage: {
      provider: 'skyscanner-hotels-live',
      mode: 'UNAVAILABLE',
      loaded: 0,
      provider_total: null,
      has_more: false,
      fetched_at: null,
      note: 'Captured Bangkok fixtures are never substituted for a different destination.',
    },
  }, { status: 503 })
}

async function execute(req: NextRequest, body: any) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res
  if (!skyscannerHotelsConfigured()) return unavailable()

  const limit = Number.isFinite(Number(body?.limit)) ? Number(body.limit) : 50
  try {
    if (body?.sessionToken) {
      const destination = typeof body.destination === 'string' ? body.destination.trim() : ''
      const entityId = typeof body.entityId === 'string' ? body.entityId.trim() : ''
      const offset = Number.isFinite(Number(body.offset)) ? Number(body.offset) : 0
      if (!destination || !entityId) {
        return NextResponse.json({ error: 'destination and entityId are required with sessionToken' }, { status: 400 })
      }
      const page = await pollHotelSearch({
        sessionToken: String(body.sessionToken),
        destination,
        entityId,
        offset,
        limit,
      })
      return NextResponse.json({ hotels: page.offers, ...page })
    }

    const destination = typeof body?.destination === 'string' ? body.destination.trim() : ''
    const checkin = typeof body?.checkin === 'string' ? body.checkin : ''
    const checkout = typeof body?.checkout === 'string' ? body.checkout : ''
    if (!destination || !checkin || !checkout) {
      return NextResponse.json({ error: 'destination, checkin and checkout are required' }, { status: 400 })
    }

    const page = await createHotelSearch({
      destination,
      checkin,
      checkout,
      adults: Number.isFinite(Number(body.adults)) ? Number(body.adults) : 2,
      rooms: Number.isFinite(Number(body.rooms)) ? Number(body.rooms) : 1,
      limit,
    })
    return NextResponse.json({ hotels: page.offers, ...page })
  } catch (error: any) {
    console.error('global hotel search failed', error?.message || error)
    return NextResponse.json({
      hotels: [],
      offers: [],
      error: error?.message || 'hotel search failed',
      coverage: {
        provider: 'skyscanner-hotels-live',
        mode: 'UNAVAILABLE',
        loaded: 0,
        provider_total: null,
        has_more: false,
        fetched_at: new Date().toISOString(),
      },
    }, { status: 502 })
  }
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

// Backward-compatible GET shape for any old caller. It still authenticates and
// starts a live provider session; subsequent pages should use POST with the
// returned sessionToken/entityId/next_offset.
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

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { getBookingDemandHotelDetails } from '@/lib/hotels/providers/booking-demand-details'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  const p = new URL(req.url).searchParams
  const provider = p.get('provider') || ''
  const hotelId = p.get('hotelId') || ''
  if (provider !== 'booking-demand') {
    return NextResponse.json({ error: 'hotel detail gallery is not available for this provider yet' }, { status: 400 })
  }
  if (!hotelId) return NextResponse.json({ error: 'hotelId is required' }, { status: 400 })

  try {
    const detail = await getBookingDemandHotelDetails(hotelId)
    return NextResponse.json({ detail, source: 'booking-demand', fetched_at: new Date().toISOString() })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'hotel details unavailable' }, { status: 502 })
  }
}

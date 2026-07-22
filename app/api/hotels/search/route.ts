// app/api/hotels/search/route.ts
// Hotel prices via Travelpayouts (Hotellook) Data API — cached prices, not live quotes.
// Docs: https://support.travelpayouts.com/hc/en-us/articles/115000343268-Hotels-data-API
// Pattern mirrors app/api/flights/search/route.ts (token from env, graceful empty fallback).
import { NextRequest, NextResponse } from 'next/server'

interface HotelResult {
  id: string
  name: string
  stars: number | null
  priceFrom: number | null   // cheapest cached price for the stay, INR
  priceAvg: number | null    // average cached price for the stay, INR
  location: string
  checkIn: string
  checkOut: string
  bookingLink: string
  dataSource: 'travelpayouts (cached)'
}

export const runtime = 'nodejs'
export const maxDuration = 15

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const location = searchParams.get('location') || ''   // city name or IATA, e.g. 'SIN' or 'Singapore'
  const checkIn = searchParams.get('check_in') || ''    // YYYY-MM-DD
  const checkOut = searchParams.get('check_out') || ''  // YYYY-MM-DD
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10) || 10, 25)

  if (!location || !checkIn || !checkOut) {
    return NextResponse.json(
      { error: 'Missing location, check_in, or check_out' },
      { status: 400 }
    )
  }

  const tpToken = process.env.TRAVELPAYOUTS_TOKEN || ''
  const tpMarker = process.env.TRAVELPAYOUTS_MARKER || ''

  if (!tpToken) {
    return NextResponse.json({ hotels: [], source: 'none', error: 'No API keys configured' })
  }

  try {
    const url = new URL('https://engine.hotellook.com/api/v2/cache.json')
    url.searchParams.set('location', location)
    url.searchParams.set('checkIn', checkIn)
    url.searchParams.set('checkOut', checkOut)
    url.searchParams.set('currency', 'inr')
    url.searchParams.set('limit', String(limit))
    // Token goes in the X-Access-Token header ONLY — never the query string, which
    // would leak it into edge/access logs (same fix as cron/refresh-fares).

    const res = await fetch(url.toString(), {
      headers: { 'X-Access-Token': tpToken },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      console.error('hotellook cache API error:', res.status, await res.text())
      return NextResponse.json({ hotels: [], source: 'travelpayouts', error: `upstream ${res.status}` })
    }

    const data = await res.json()
    const rows: any[] = Array.isArray(data) ? data : []

    const bookingBase = 'https://search.hotellook.com/hotels'
    const hotels: HotelResult[] = rows.slice(0, limit).map((h: any, i: number) => {
      const link = new URL(bookingBase)
      link.searchParams.set('destination', location)
      link.searchParams.set('checkIn', checkIn)
      link.searchParams.set('checkOut', checkOut)
      link.searchParams.set('adults', '2')
      if (tpMarker) link.searchParams.set('marker', tpMarker)
      if (h.hotelId != null) link.searchParams.set('hotelId', String(h.hotelId))

      return {
        id: String(h.hotelId ?? `tp-hotel-${i}`),
        name: h.hotelName || h.hotel_name || 'Unknown hotel',
        stars: typeof h.stars === 'number' ? h.stars : null,
        priceFrom: typeof h.priceFrom === 'number' ? Math.round(h.priceFrom) : null,
        priceAvg: typeof h.priceAvg === 'number' ? Math.round(h.priceAvg) : null,
        location,
        checkIn,
        checkOut,
        bookingLink: link.toString(),
        dataSource: 'travelpayouts (cached)' as const,
      }
    })

    // Cheapest first; null prices sink to the bottom rather than pretending to be free
    hotels.sort((a, b) => (a.priceFrom ?? Number.MAX_SAFE_INTEGER) - (b.priceFrom ?? Number.MAX_SAFE_INTEGER))

    return NextResponse.json({ hotels, count: hotels.length, source: 'travelpayouts' })
  } catch (err: any) {
    console.error('hotels/search error:', err?.message)
    return NextResponse.json({ hotels: [], source: 'travelpayouts', error: 'fetch failed' })
  }
}

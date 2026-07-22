import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') || 'DEL'
  const to = searchParams.get('to') || 'BOM'
  const dateFrom = searchParams.get('date_from') || ''
  const dateTo = searchParams.get('date_to') || ''
  const kiwiKey = process.env.KIWI_TEQUILA_API_KEY || ''
  const tpToken = process.env.TRAVELPAYOUTS_TOKEN || ''
  const tpMarker = process.env.TRAVELPAYOUTS_MARKER || ''

  // Try Kiwi first
  if (kiwiKey) {
    try {
      const url = new URL('https://api.tequila.kiwi.com/v2/search')
      url.searchParams.set('fly_from', from)
      url.searchParams.set('fly_to', to)
      if (dateFrom) url.searchParams.set('date_from', dateFrom)
      if (dateTo) url.searchParams.set('date_to', dateTo)
      url.searchParams.set('adults', '1')
      url.searchParams.set('curr', 'INR')
      url.searchParams.set('limit', '5')
      url.searchParams.set('sort', 'price')
      url.searchParams.set('max_stopovers', '2')

      const res = await fetch(url.toString(), { headers: { 'apikey': kiwiKey } })
      if (res.ok) {
        const data = await res.json()
        const flights = (data.data || []).map((f: any) => ({
          id: f.id,
          price: f.price,
          airline: f.airlines?.[0] || 'Multiple',
          from: f.flyFrom,
          to: f.flyTo,
          departure: f.local_departure,
          arrival: f.local_arrival,
          duration: Math.round((f.duration?.total || 0) / 3600),
          stops: (f.route?.length || 1) - 1,
          bookingLink: f.deep_link,
        }))
        return NextResponse.json({ flights, source: 'kiwi' })
      }
    } catch {}
  }

  // Fallback: Travelpayouts cheapest fares
  if (tpToken) {
    try {
      const url = new URL('https://api.travelpayouts.com/v1/prices/cheap')
      url.searchParams.set('origin', from)
      url.searchParams.set('destination', to)
      // Make the fallback date-aware: without depart_date, prices/cheap returns
      // a stale cheapest-ever cached fare on an unrelated date. depart_date
      // accepts YYYY-MM-DD (or YYYY-MM); we pass the searched departure date.
      if (dateFrom) url.searchParams.set('depart_date', dateFrom)
      url.searchParams.set('currency', 'INR')
      // Token goes in the X-Access-Token header ONLY — never the query string, which
      // would leak it into edge/access logs (same fix as cron/refresh-fares).

      const res = await fetch(url.toString(), {
        headers: { 'X-Access-Token': tpToken },
        next: { revalidate: 3600 }
      })

      if (res.ok) {
        const data = await res.json()
        const dest = data.data?.[to] || {}
        const flights = Object.values(dest).slice(0, 5).map((f: any, i: number) => ({
          id: `tp-${i}`,
          price: f.price,
          airline: f.airline || 'Various',
          from,
          to,
          departure: f.departure_at || new Date().toISOString(),
          arrival: f.return_at || new Date().toISOString(),
          // TP reports duration in MINUTES; the Kiwi branch (and the UI) use
          // hours. Convert so the card stops showing impossible values (1660h).
          duration: f.duration ? Math.round(f.duration / 60) : 2,
          stops: f.transfers || 0,
          bookingLink: `https://www.aviasales.com/search/${from}${dateFrom?.replace(/-/g,'')}${to}1${tpMarker ? `?marker=${tpMarker}` : ''}`,
        }))
        return NextResponse.json({ flights, source: 'travelpayouts' })
      }
    } catch {}
  }

  return NextResponse.json({ flights: [], source: 'none', error: 'No API keys configured' })
}

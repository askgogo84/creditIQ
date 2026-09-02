import { NextRequest, NextResponse } from 'next/server'

const KIWI_MAX_RESULTS = 200

type Coverage = {
  provider: 'kiwi' | 'travelpayouts' | 'none'
  mode: 'PROVIDER_COMPLETE' | 'PROVIDER_WINDOW' | 'PARTIAL_FALLBACK' | 'UNAVAILABLE'
  loaded: number
  provider_total: number | null
  has_more: boolean
  provider_limit: number | null
  fetched_at: string
  note?: string
}

function response(flights: any[], coverage: Coverage, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ flights, source: coverage.provider, coverage, ...extra })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = (searchParams.get('from') || 'DEL').toUpperCase().trim()
  const to = (searchParams.get('to') || 'BOM').toUpperCase().trim()
  const dateFrom = searchParams.get('date_from') || ''
  const dateTo = searchParams.get('date_to') || dateFrom
  const kiwiKey = process.env.KIWI_TEQUILA_API_KEY || ''
  const tpToken = process.env.TRAVELPAYOUTS_TOKEN || ''
  const tpMarker = process.env.TRAVELPAYOUTS_MARKER || ''
  const fetchedAt = new Date().toISOString()

  // Kiwi's documented /v2/search result limit is 200. The previous production
  // route silently requested only 5. We now request the complete provider window
  // and expose the provider cap instead of pretending it is the whole market.
  if (kiwiKey) {
    try {
      const url = new URL('https://api.tequila.kiwi.com/v2/search')
      url.searchParams.set('fly_from', from)
      url.searchParams.set('fly_to', to)
      if (dateFrom) url.searchParams.set('date_from', dateFrom)
      if (dateTo) url.searchParams.set('date_to', dateTo)
      url.searchParams.set('adults', '1')
      url.searchParams.set('curr', 'INR')
      url.searchParams.set('limit', String(KIWI_MAX_RESULTS))
      url.searchParams.set('sort', 'price')
      url.searchParams.set('max_stopovers', '2')

      const res = await fetch(url.toString(), {
        headers: { apikey: kiwiKey },
        cache: 'no-store',
      })

      if (res.ok) {
        const data = await res.json()
        const raw = Array.isArray(data.data) ? data.data : []
        const flights = raw.map((f: any) => ({
          id: f.id,
          price: f.price,
          airline: f.airlines?.[0] || 'Multiple',
          airlines: Array.isArray(f.airlines) ? f.airlines : [],
          from: f.flyFrom || from,
          to: f.flyTo || to,
          departure: f.local_departure,
          arrival: f.local_arrival,
          duration: Math.round((f.duration?.total || 0) / 3600),
          durationSeconds: f.duration?.total || 0,
          stops: Math.max(0, (f.route?.length || 1) - 1),
          segments: Array.isArray(f.route)
            ? f.route.map((s: any) => ({
                from: s.flyFrom,
                to: s.flyTo,
                airline: s.airline,
                flightNo: s.flight_no,
                departure: s.local_departure,
                arrival: s.local_arrival,
              }))
            : [],
          bookingLink: f.deep_link,
          provider: 'kiwi',
        }))

        const reportedTotal = Number.isFinite(Number(data._results)) ? Number(data._results) : null
        const hitProviderLimit = raw.length >= KIWI_MAX_RESULTS
        const providerHasMore = reportedTotal !== null ? reportedTotal > raw.length : hitProviderLimit
        const coverage: Coverage = {
          provider: 'kiwi',
          mode: providerHasMore ? 'PROVIDER_WINDOW' : 'PROVIDER_COMPLETE',
          loaded: flights.length,
          provider_total: reportedTotal,
          has_more: providerHasMore,
          provider_limit: KIWI_MAX_RESULTS,
          fetched_at: fetchedAt,
          note: providerHasMore
            ? 'Kiwi returned its maximum search window. CreditIQ is showing every returned itinerary, but does not claim this is every itinerary in the market.'
            : 'All itineraries returned by the Kiwi search call are included.',
        }
        return response(flights, coverage)
      }
    } catch (error) {
      console.error('flight search: kiwi failed', error)
    }
  }

  // Travelpayouts /prices/cheap is an aggregate cheapest-fare fallback rather
  // than complete itinerary inventory. We keep every row it returns and label
  // coverage PARTIAL_FALLBACK so the UI cannot call it a complete search.
  if (tpToken) {
    try {
      const url = new URL('https://api.travelpayouts.com/v1/prices/cheap')
      url.searchParams.set('origin', from)
      url.searchParams.set('destination', to)
      if (dateFrom) url.searchParams.set('depart_date', dateFrom)
      url.searchParams.set('currency', 'INR')

      const res = await fetch(url.toString(), {
        headers: { 'X-Access-Token': tpToken },
        next: { revalidate: 3600 },
      })

      if (res.ok) {
        const data = await res.json()
        const dest = data.data?.[to] || {}
        const raw = Object.values(dest) as any[]
        const flights = raw.map((f: any, i: number) => ({
          id: `tp-${i}-${f.airline || 'various'}-${f.departure_at || dateFrom}`,
          price: f.price,
          airline: f.airline || 'Various',
          airlines: f.airline ? [f.airline] : [],
          from,
          to,
          departure: f.departure_at || dateFrom,
          arrival: f.return_at || '',
          duration: f.duration ? Math.round(f.duration / 60) : 0,
          durationSeconds: f.duration ? f.duration * 60 : 0,
          stops: f.transfers || 0,
          segments: [],
          bookingLink: `https://www.aviasales.com/search/${from}${dateFrom?.replace(/-/g, '')}${to}1${tpMarker ? `?marker=${tpMarker}` : ''}`,
          provider: 'travelpayouts',
        }))

        return response(flights, {
          provider: 'travelpayouts',
          mode: 'PARTIAL_FALLBACK',
          loaded: flights.length,
          provider_total: null,
          has_more: false,
          provider_limit: null,
          fetched_at: fetchedAt,
          note: 'Travelpayouts cheapest-fare fallback is not complete itinerary inventory.',
        })
      }
    } catch (error) {
      console.error('flight search: travelpayouts failed', error)
    }
  }

  return response([], {
    provider: 'none',
    mode: 'UNAVAILABLE',
    loaded: 0,
    provider_total: null,
    has_more: false,
    provider_limit: null,
    fetched_at: fetchedAt,
    note: 'No cash-flight provider is configured or responding.',
  }, { error: 'No cash-flight provider available' })
}

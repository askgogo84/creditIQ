import { NextRequest, NextResponse } from 'next/server'
import { normalizeTravelpayoutsPricesForDates } from '@/lib/flights/travelpayouts-prices-for-dates'

const KIWI_MAX_RESULTS = 200
const TP_MAX_RESULTS = 100

type Coverage = {
  provider: 'kiwi' | 'travelpayouts-v3' | 'travelpayouts' | 'none'
  mode: 'PROVIDER_COMPLETE' | 'PROVIDER_WINDOW' | 'PARTIAL_FALLBACK' | 'UNAVAILABLE'
  loaded: number
  provider_total: number | null
  has_more: boolean
  provider_limit: number | null
  fetched_at: string
  note?: string
}

type Attempt = {
  provider: string
  ok: boolean
  status?: number
  loaded: number
  note: string
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
  const cabin = (searchParams.get('cabin') || 'economy').toLowerCase()
  const kiwiKey = process.env.KIWI_TEQUILA_API_KEY || ''
  const tpToken = process.env.TRAVELPAYOUTS_TOKEN || ''
  const tpMarker = process.env.TRAVELPAYOUTS_MARKER || ''
  const fetchedAt = new Date().toISOString()
  const attempts: Attempt[] = []

  // Kiwi remains the preferred itinerary source where the existing invited
  // Tequila partnership key is active. IMPORTANT: an HTTP-200 EMPTY result is not
  // terminal; production previously returned [] here and never tried the fallback.
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

      // Tequila's search endpoint supports cabin selection for active partners.
      // Keep this provider-scoped: Travelpayouts fallback does not expose cabin.
      if (cabin === 'business') url.searchParams.set('selected_cabins', 'C')
      else if (cabin === 'first') url.searchParams.set('selected_cabins', 'F')
      else url.searchParams.set('selected_cabins', 'M')

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
                flightNo: `${s.airline || ''}${s.flight_no || ''}`,
                departure: s.local_departure,
                arrival: s.local_arrival,
              }))
            : [],
          bookingLink: f.deep_link,
          provider: 'kiwi',
          cashCabin: cabin,
        }))

        attempts.push({ provider: 'kiwi', ok: true, status: res.status, loaded: flights.length, note: flights.length ? 'itineraries returned' : 'HTTP 200 but zero itineraries; trying fallback' })

        if (flights.length > 0) {
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
          return response(flights, coverage, { attempts, requestedCabin: cabin })
        }
      } else {
        attempts.push({ provider: 'kiwi', ok: false, status: res.status, loaded: 0, note: `provider HTTP ${res.status}; trying fallback` })
        console.warn(`flight search: kiwi returned ${res.status} for ${from}-${to} ${dateFrom}`)
      }
    } catch (error) {
      attempts.push({ provider: 'kiwi', ok: false, loaded: 0, note: 'request failed; trying fallback' })
      console.error('flight search: kiwi failed', error)
    }
  } else {
    attempts.push({ provider: 'kiwi', ok: false, loaded: 0, note: 'not configured' })
  }

  // CURRENT Travelpayouts/Aviasales fallback. Their own docs recommend
  // /aviasales/v3/prices_for_dates instead of the old /v1/prices/cheap route.
  // This is cached fare discovery (prices found by Aviasales users in the last
  // 48h), not complete live GDS inventory, so coverage is always PARTIAL_FALLBACK.
  if (tpToken) {
    try {
      const url = new URL('https://api.travelpayouts.com/aviasales/v3/prices_for_dates')
      url.searchParams.set('origin', from)
      url.searchParams.set('destination', to)
      if (dateFrom) url.searchParams.set('departure_at', dateFrom)
      url.searchParams.set('one_way', 'true')
      url.searchParams.set('direct', 'false')
      url.searchParams.set('currency', 'inr')
      url.searchParams.set('sorting', 'price')
      url.searchParams.set('unique', 'false')
      url.searchParams.set('limit', String(TP_MAX_RESULTS))
      url.searchParams.set('page', '1')
      url.searchParams.set('token', tpToken)

      const res = await fetch(url.toString(), { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const flights = normalizeTravelpayoutsPricesForDates(data, from, to, tpMarker)
        attempts.push({ provider: 'travelpayouts-v3', ok: true, status: res.status, loaded: flights.length, note: flights.length ? 'dated cached fares returned' : 'no dated cached fares returned' })

        if (flights.length > 0) {
          return response(flights, {
            provider: 'travelpayouts-v3',
            mode: 'PARTIAL_FALLBACK',
            loaded: flights.length,
            provider_total: null,
            has_more: false,
            provider_limit: TP_MAX_RESULTS,
            fetched_at: fetchedAt,
            note: cabin === 'business' || cabin === 'first'
              ? 'Travelpayouts returned dated cached fare discovery but does not expose cabin. These cash fares are reference fares only and are NOT labelled as verified Business/First cash prices.'
              : 'Travelpayouts dated fares are cached discovery from recent Aviasales searches, not complete live itinerary inventory.',
          }, { attempts, requestedCabin: cabin, cashCabinVerified: cabin === 'economy' })
        }
      } else {
        attempts.push({ provider: 'travelpayouts-v3', ok: false, status: res.status, loaded: 0, note: `provider HTTP ${res.status}` })
        console.warn(`flight search: travelpayouts v3 returned ${res.status} for ${from}-${to} ${dateFrom}`)
      }
    } catch (error) {
      attempts.push({ provider: 'travelpayouts-v3', ok: false, loaded: 0, note: 'request failed' })
      console.error('flight search: travelpayouts v3 failed', error)
    }
  } else {
    attempts.push({ provider: 'travelpayouts-v3', ok: false, loaded: 0, note: 'not configured' })
  }

  return response([], {
    provider: 'none',
    mode: 'UNAVAILABLE',
    loaded: 0,
    provider_total: null,
    has_more: false,
    provider_limit: null,
    fetched_at: fetchedAt,
    note: 'Every configured cash-flight provider was attempted, but none returned a fare for this exact search.',
  }, { error: 'No cash fares returned for this search', attempts, requestedCabin: cabin })
}

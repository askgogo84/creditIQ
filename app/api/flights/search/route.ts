import { NextRequest, NextResponse } from 'next/server'
import { normalizeTravelpayoutsPricesForDates } from '@/lib/flights/travelpayouts-prices-for-dates'
import { searchSkyscannerFlights, skyscannerFlightsConfigured } from '@/lib/flights/providers/skyscanner-live'
import { searchAmadeusFlights, amadeusFlightsConfigured } from '@/lib/flights/providers/amadeus'

const KIWI_MAX_RESULTS = 200
const TP_MAX_RESULTS = 100

type Coverage = {
  provider: 'skyscanner-live' | 'amadeus' | 'kiwi' | 'travelpayouts-v3' | 'none'
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

type Cabin = 'economy' | 'premium_economy' | 'business' | 'first'

function response(flights: any[], coverage: Coverage, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ flights, source: coverage.provider, coverage, ...extra })
}

function normalizeCabin(raw: string): Cabin {
  const value = raw.toLowerCase().replace(/[ -]+/g, '_')
  if (value === 'premium_economy' || value === 'business' || value === 'first') return value
  return 'economy'
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = (searchParams.get('from') || 'DEL').toUpperCase().trim()
  const to = (searchParams.get('to') || 'BOM').toUpperCase().trim()
  const dateFrom = searchParams.get('date_from') || ''
  const dateTo = searchParams.get('date_to') || dateFrom
  const cabin = normalizeCabin(searchParams.get('cabin') || 'economy')
  const kiwiKey = process.env.KIWI_TEQUILA_API_KEY || ''
  const tpToken = process.env.TRAVELPAYOUTS_TOKEN || ''
  const tpMarker = process.env.TRAVELPAYOUTS_MARKER || ''
  const fetchedAt = new Date().toISOString()
  const attempts: Attempt[] = []

  // 1. Skyscanner Flights Live Prices — primary target. Create + poll retrieves
  // supply-partner inventory and is cabin-specific. It activates automatically
  // when the commercial API key is added to Vercel.
  if (skyscannerFlightsConfigured() && dateFrom) {
    try {
      const result = await searchSkyscannerFlights({ from, to, date: dateFrom, cabin, adults: 1 })
      attempts.push({
        provider: 'skyscanner-live', ok: true, loaded: result.flights.length,
        note: result.flights.length ? `${result.status}; ${result.polls} poll(s)` : `${result.status}; zero itineraries; trying next provider`,
      })
      if (result.flights.length > 0) {
        return response(result.flights, {
          provider: 'skyscanner-live',
          mode: result.status === 'RESULT_STATUS_COMPLETE' ? 'PROVIDER_COMPLETE' : 'PROVIDER_WINDOW',
          loaded: result.flights.length,
          provider_total: null,
          has_more: result.status !== 'RESULT_STATUS_COMPLETE',
          provider_limit: null,
          fetched_at: fetchedAt,
          note: result.status === 'RESULT_STATUS_COMPLETE'
            ? 'Skyscanner Live Prices search completed. Returned itineraries are cabin-specific and bookable through returned supply-partner links.'
            : 'Skyscanner returned usable live itineraries before the provider search reached COMPLETE. Results are shown, but coverage is labelled as a provider window.',
        }, { attempts, requestedCabin: cabin, cashCabinVerified: true })
      }
    } catch (error) {
      attempts.push({ provider: 'skyscanner-live', ok: false, loaded: 0, note: 'request failed; trying next provider' })
      console.error('flight search: skyscanner live failed', error)
    }
  } else {
    attempts.push({ provider: 'skyscanner-live', ok: false, loaded: 0, note: skyscannerFlightsConfigured() ? 'date missing' : 'not configured' })
  }

  // 2. Amadeus Flight Offers Search — cabin-specific shopping fallback. The
  // adapter defaults to Amadeus TEST until AMADEUS_ENV=production (or an explicit
  // AMADEUS_BASE_URL) is configured, so adding sandbox credentials cannot
  // accidentally make a production-money claim.
  if (amadeusFlightsConfigured() && dateFrom) {
    try {
      const result = await searchAmadeusFlights({ from, to, date: dateFrom, cabin, adults: 1, max: 100 })
      attempts.push({
        provider: 'amadeus', ok: true, status: result.status, loaded: result.flights.length,
        note: result.flights.length ? `flight offers returned from ${result.base}` : 'zero flight offers; trying next provider',
      })
      if (result.flights.length > 0) {
        return response(result.flights, {
          provider: 'amadeus',
          mode: 'PROVIDER_WINDOW',
          loaded: result.flights.length,
          provider_total: null,
          has_more: result.flights.length >= 100,
          provider_limit: 100,
          fetched_at: fetchedAt,
          note: 'Amadeus Flight Offers Search returned cabin-specific shopping results. CreditIQ labels this as a provider window rather than claiming every itinerary in the market.',
        }, { attempts, requestedCabin: cabin, cashCabinVerified: true })
      }
    } catch (error) {
      attempts.push({ provider: 'amadeus', ok: false, loaded: 0, note: 'request failed; trying next provider' })
      console.error('flight search: amadeus failed', error)
    }
  } else {
    attempts.push({ provider: 'amadeus', ok: false, loaded: 0, note: amadeusFlightsConfigured() ? 'date missing' : 'not configured' })
  }

  // 3. Kiwi — legacy invited-partner itinerary source where a Tequila key is
  // active. An HTTP-200 EMPTY result is deliberately non-terminal.
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
          return response(flights, {
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
          }, { attempts, requestedCabin: cabin, cashCabinVerified: true })
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

  // 4. Travelpayouts / Aviasales dated-fare discovery. This is intentionally the
  // last fallback: prices are cached from recent searches and cabin is not exposed.
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
            note: cabin !== 'economy'
              ? 'Travelpayouts returned dated cached fare discovery but does not expose cabin. These fares are reference-only and are NOT treated as a verified premium-cabin cash comparison.'
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

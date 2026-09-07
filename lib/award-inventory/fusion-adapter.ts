import { searchAwardAvailability, type SeatsAeroResult, type SeatsAeroTrip } from '@/lib/seats-aero'
import { flightSourceForProgrammeId } from '@/lib/redemption-rails/programme-resolver'
import { searchFlightAwards, type FlightAwardSourceAttempt } from './flight-orchestrator'
import type { FlightAwardOption, FlightAwardSearchQuery } from './types'

export type FusionAwardFetch = {
  awards: SeatsAeroResult[]
  tripsByAwardId: Map<string, SeatsAeroTrip>
  attempts: FlightAwardSourceAttempt[]
  status: string
  pricingAuthority: 'DATE_SPECIFIC_LIVE' | 'CACHED_DISCOVERY' | 'DIRECT_ONLY' | 'NONE'
  reason: string
  mode: 'EXACT_ORCHESTRATED' | 'FLEX_CACHED'
}

function dateOf(value: string | null | undefined, fallback: string): string {
  return value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : fallback
}

function carrierFromFlightNumber(value: string | null | undefined): string | null {
  const normalized = (value || '').toUpperCase().replace(/\s+/g, '')
  const match = normalized.match(/^([A-Z0-9]{2})\d+/)
  return match?.[1] ?? null
}

function carriersOf(option: FlightAwardOption): string {
  return [...new Set(option.segments.map(segment => carrierFromFlightNumber(segment.flightNumber)).filter((value): value is string => Boolean(value)))].join(',')
}

function minutesBetween(start: string | null | undefined, end: string | null | undefined): number {
  if (!start || !end) return 0
  const a = Date.parse(start)
  const b = Date.parse(end)
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0
  return Math.round((b - a) / 60_000)
}

function legacyDataSource(option: FlightAwardOption): SeatsAeroResult['dataSource'] {
  // The legacy fusion DTO predates multi-provider award search and has only two
  // source labels. The authoritative provider/freshness is returned separately
  // in awardAttempts/awardPricingAuthority and in option.evidence. Keep this
  // compatibility value non-authoritative instead of pretending AwardTool is
  // Seats.aero.
  return option.evidence.freshness === 'LIVE' ? 'estimated' : 'estimated'
}

function toLegacyAward(option: FlightAwardOption, query: FlightAwardSearchQuery): SeatsAeroResult | null {
  const source = flightSourceForProgrammeId(option.programmeId)
  if (!source) return null
  const airlines = carriersOf(option)
  const segmentCount = option.segments.length
  return {
    available: true,
    mileageCost: option.miles,
    remainingSeats: 0,
    airlines,
    isDirect: segmentCount === 1,
    source,
    date: dateOf(option.departureAt, query.date),
    id: option.providerResultId,
    originAirport: option.origin || query.origin,
    destinationAirport: option.destination || query.destination,
    dataSource: legacyDataSource(option),
    yMileageCost: query.cabin === 'economy' ? option.miles : 0,
    jMileageCost: query.cabin === 'business' ? option.miles : 0,
  }
}

function toTrip(option: FlightAwardOption, query: FlightAwardSearchQuery): SeatsAeroTrip | null {
  const first = option.segments[0]
  const last = option.segments[option.segments.length - 1]
  const departsAt = option.departureAt || first?.departureAt || ''
  const arrivesAt = option.arrivalAt || last?.arrivalAt || ''
  const flightNumbers = option.segments.map(segment => segment.flightNumber).filter(Boolean).join(', ')
  const carriers = carriersOf(option)
  const hasUsefulDetail = Boolean(flightNumbers || departsAt || arrivesAt || option.taxesMinor != null)
  if (!hasUsefulDetail) return null

  return {
    flightNumbers,
    carriers,
    aircraft: '',
    departsAt,
    arrivesAt,
    durationMinutes: minutesBetween(departsAt, arrivesAt),
    stops: option.segments.length ? Math.max(0, option.segments.length - 1) : 0,
    cabin: query.cabin,
    mileageCost: option.miles,
    // FlightAwardOption carries minor currency units; the existing Travel UI also
    // treats SeatsAeroTrip.totalTaxes as minor units and divides by 100 for display.
    totalTaxes: option.taxesMinor ?? 0,
    taxesCurrency: option.taxesCurrency ?? '',
    remainingSeats: 0,
    originAirport: option.origin || query.origin,
    destinationAirport: option.destination || query.destination,
  }
}

/**
 * Feed the modern award orchestrator into the existing cash+wallet fusion engine.
 * Exact dates may use AwardTool Real-Time. Flexible windows remain on one cached
 * Seats.aero request until AwardTool Panorama is integrated, avoiding 7-15 paid
 * real-time searches from a single ±3/±7 click.
 */
export async function searchFusionAwards(input: {
  origin: string
  destination: string
  startDate: string
  endDate: string
  cabin: 'economy' | 'business' | 'first'
}): Promise<FusionAwardFetch> {
  if (input.startDate !== input.endDate) {
    const awards = await searchAwardAvailability(
      input.origin,
      input.destination,
      input.startDate,
      input.endDate,
      undefined,
      input.cabin,
    )
    return {
      awards,
      tripsByAwardId: new Map(),
      attempts: [{
        source: 'seats-aero',
        configured: Boolean(process.env.SEATS_AERO_API_KEY),
        state: awards.length ? 'SUCCESS' : (process.env.SEATS_AERO_API_KEY ? 'EMPTY' : 'UNAVAILABLE'),
        freshness: process.env.SEATS_AERO_API_KEY ? 'CACHED' : null,
        reason: awards.length
          ? `${awards.length} cached flexible-window option(s) returned; Panorama is the planned flexible-date replacement.`
          : 'Flexible-window cached discovery returned no award options.',
      }],
      status: awards.length ? 'SUCCESS_CACHED_DISCOVERY' : 'NO_AWARD_OPTIONS',
      pricingAuthority: awards.length ? 'CACHED_DISCOVERY' : 'NONE',
      reason: 'Flexible date ranges use cached discovery until AwardTool Panorama is wired.',
      mode: 'FLEX_CACHED',
    }
  }

  const query: FlightAwardSearchQuery = {
    origin: input.origin,
    destination: input.destination,
    date: input.startDate,
    cabin: input.cabin,
    adults: 1,
  }
  const result = await searchFlightAwards(query)
  const awards: SeatsAeroResult[] = []
  const tripsByAwardId = new Map<string, SeatsAeroTrip>()
  for (const option of result.options) {
    const award = toLegacyAward(option, query)
    if (!award) continue
    awards.push(award)
    const trip = toTrip(option, query)
    if (trip) tripsByAwardId.set(award.id, trip)
  }

  return {
    awards,
    tripsByAwardId,
    attempts: result.attempts,
    status: result.status,
    pricingAuthority: result.pricingAuthority,
    reason: result.reason,
    mode: 'EXACT_ORCHESTRATED',
  }
}

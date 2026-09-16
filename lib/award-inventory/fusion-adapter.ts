import { searchAwardAvailability, type SeatsAeroResult, type SeatsAeroTrip } from '@/lib/seats-aero'
import { flightSourceForProgrammeId } from '@/lib/redemption-rails/programme-resolver'
import { searchFlightAwards, type FlightAwardSourceAttempt } from './flight-orchestrator'
import { AwardToolPanoramaProvider, type AwardToolPanoramaOption } from './providers/awardtool-panorama'
import type { FlightAwardOption, FlightAwardSearchQuery } from './types'

export type FusionAwardFetch = {
  awards: SeatsAeroResult[]
  tripsByAwardId: Map<string, SeatsAeroTrip>
  providerByAwardId: Map<string, string>
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

function legacyDataSource(_option: FlightAwardOption): SeatsAeroResult['dataSource'] {
  return 'estimated'
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

function toPanoramaAward(
  option: AwardToolPanoramaOption,
  origin: string,
  destination: string,
  cabin: 'economy' | 'business',
): SeatsAeroResult | null {
  const source = flightSourceForProgrammeId(option.programmeId)
  if (!source) return null
  const miles = cabin === 'business' ? option.businessPoints : option.economyPoints
  if (!miles) return null
  return {
    available: true,
    mileageCost: miles,
    remainingSeats: 0,
    airlines: '',
    isDirect: false,
    source,
    date: option.date,
    id: `awardtool-panorama:${option.programmeCode}:${option.date}:${cabin}:${miles}`,
    originAirport: origin,
    destinationAirport: destination,
    dataSource: 'estimated',
    yMileageCost: cabin === 'economy' ? miles : 0,
    jMileageCost: cabin === 'business' ? miles : 0,
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
    totalTaxes: option.taxesMinor ?? 0,
    taxesCurrency: option.taxesCurrency ?? '',
    remainingSeats: 0,
    originAirport: option.origin || query.origin,
    destinationAirport: option.destination || query.destination,
  }
}

async function flexibleCachedAwards(input: {
  origin: string
  destination: string
  startDate: string
  endDate: string
  cabin: 'economy' | 'business' | 'first'
}): Promise<FusionAwardFetch> {
  const panorama = new AwardToolPanoramaProvider()
  const attempts: FlightAwardSourceAttempt[] = []

  if (input.cabin !== 'first' && panorama.isConfigured()) {
    try {
      const options = await panorama.searchFlexible(input.origin, input.destination, input.startDate, input.endDate)
      const awards = options
        .map(option => toPanoramaAward(option, input.origin, input.destination, input.cabin))
        .filter((award): award is SeatsAeroResult => award !== null)

      attempts.push({
        source: 'awardtool',
        configured: true,
        state: awards.length ? 'SUCCESS' : 'EMPTY',
        freshness: 'CACHED',
        reason: awards.length
          ? `${awards.length} AwardTool Panorama cached flexible-date option(s) returned; live verification is still required.`
          : 'AwardTool Panorama returned no cached option. This is not proof that no award exists; fallback discovery will run.',
      })

      if (awards.length) {
        return {
          awards,
          tripsByAwardId: new Map(),
          providerByAwardId: new Map(awards.map(award => [award.id, 'awardtool-panorama'])),
          attempts,
          status: 'SUCCESS_CACHED_DISCOVERY',
          pricingAuthority: 'CACHED_DISCOVERY',
          reason: 'Flexible-date awards come from AwardTool Panorama cached Route Data. Shortlisted dates must be verified with Real-Time or direct programme checkout before transfer.',
          mode: 'FLEX_CACHED',
        }
      }
    } catch (error) {
      attempts.push({
        source: 'awardtool',
        configured: true,
        state: 'ERROR',
        freshness: 'CACHED',
        reason: error instanceof Error ? error.message : 'AwardTool Panorama flexible-date discovery failed.',
      })
    }
  } else {
    attempts.push({
      source: 'awardtool',
      configured: panorama.isConfigured(),
      state: 'UNAVAILABLE',
      freshness: panorama.isConfigured() ? 'CACHED' : null,
      reason: input.cabin === 'first'
        ? 'Panorama Route Data integration currently covers Economy and Business; First uses cached fallback discovery.'
        : 'AwardTool Panorama is not configured.',
    })
  }

  const awards = await searchAwardAvailability(
    input.origin,
    input.destination,
    input.startDate,
    input.endDate,
    undefined,
    input.cabin,
  )
  attempts.push({
    source: 'seats-aero',
    configured: Boolean(process.env.SEATS_AERO_API_KEY),
    state: awards.length ? 'SUCCESS' : (process.env.SEATS_AERO_API_KEY ? 'EMPTY' : 'UNAVAILABLE'),
    freshness: process.env.SEATS_AERO_API_KEY ? 'CACHED' : null,
    reason: awards.length
      ? `${awards.length} cached Seats.aero fallback option(s) returned after Panorama was unavailable or empty.`
      : 'Cached fallback discovery returned no award options. This still does not prove that no live award exists.',
  })

  return {
    awards,
    tripsByAwardId: new Map(),
    providerByAwardId: new Map(awards.map(award => [award.id, 'seats-aero-cached'])),
    attempts,
    status: awards.length ? 'SUCCESS_CACHED_DISCOVERY' : 'NO_AWARD_OPTIONS',
    pricingAuthority: awards.length ? 'CACHED_DISCOVERY' : 'NONE',
    reason: awards.length
      ? 'Flexible-date Panorama discovery fell back to Seats.aero cached inventory. Live verification remains required.'
      : 'No cached flexible-date discovery source returned an option. Search the selected exact date with Real-Time/direct programme verification before concluding that no award exists.',
    mode: 'FLEX_CACHED',
  }
}

export async function searchFusionAwards(input: {
  origin: string
  destination: string
  startDate: string
  endDate: string
  cabin: 'economy' | 'business' | 'first'
}): Promise<FusionAwardFetch> {
  if (input.startDate !== input.endDate) return flexibleCachedAwards(input)

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
  const providerByAwardId = new Map<string, string>()
  for (const option of result.options) {
    const award = toLegacyAward(option, query)
    if (!award) continue
    awards.push(award)
    providerByAwardId.set(award.id, option.evidence.provider)
    const trip = toTrip(option, query)
    if (trip) tripsByAwardId.set(award.id, trip)
  }

  return {
    awards,
    tripsByAwardId,
    providerByAwardId,
    attempts: result.attempts,
    status: result.status,
    pricingAuthority: result.pricingAuthority,
    reason: result.reason,
    mode: 'EXACT_ORCHESTRATED',
  }
}

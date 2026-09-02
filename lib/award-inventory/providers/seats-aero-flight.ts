import { searchAwardAvailability } from '@/lib/seats-aero'
import { programmeIdForFlightSource } from '@/lib/redemption-rails/programme-resolver'
import type { FlightAwardOption, FlightAwardProvider, FlightAwardSearchQuery } from '../types'

/**
 * Seats.aero Cached Search is broad discovery inventory. Do not label this LIVE:
 * the provider's cached search can be refreshed frequently, but it is still a
 * cache and direct programme checkout remains the final execution boundary.
 */
export class SeatsAeroFlightProvider implements FlightAwardProvider {
  readonly id = 'seats-aero-cached'
  readonly freshness = 'CACHED' as const

  isConfigured(): boolean { return !!process.env.SEATS_AERO_API_KEY }

  async search(query: FlightAwardSearchQuery): Promise<FlightAwardOption[]> {
    if (!this.isConfigured()) return []
    const rows = await searchAwardAvailability(
      query.origin,
      query.destination,
      query.date,
      query.date,
      undefined,
      query.cabin === 'premium-economy' ? 'economy' : query.cabin,
    )
    const fetchedAt = new Date().toISOString()
    return rows.flatMap((row) => {
      const programmeId = programmeIdForFlightSource(row.source)
      if (!programmeId) return []
      if (query.programmeIds?.length && !query.programmeIds.includes(programmeId)) return []
      return [{
        providerResultId: row.id || `${row.source}:${row.date}:${row.mileageCost}`,
        programmeId,
        origin: row.originAirport || query.origin,
        destination: row.destinationAirport || query.destination,
        departureAt: null,
        arrivalAt: null,
        cabin: query.cabin,
        miles: row.mileageCost,
        taxesMinor: null,
        taxesCurrency: null,
        segments: [],
        evidence: { provider: 'seats-aero-cached', freshness: 'CACHED', fetchedAt },
      } satisfies FlightAwardOption]
    })
  }
}

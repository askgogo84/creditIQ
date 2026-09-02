import type { FlightAwardOption, FlightAwardSearchQuery } from './types'
import { SeatsAeroFlightProvider } from './providers/seats-aero-flight'
import { AwardWalletFlightSearchClient, type AwardWalletFlightProviderInfo } from './providers/awardwallet-flight'

export type FlightAwardAttemptState = 'SUCCESS' | 'EMPTY' | 'PENDING' | 'UNAVAILABLE' | 'DIRECT_REQUIRED' | 'SKIPPED' | 'ERROR'

export interface FlightAwardSourceAttempt {
  source: 'awardwallet' | 'seats-aero' | 'direct'
  configured: boolean
  state: FlightAwardAttemptState
  freshness: 'LIVE' | 'CACHED' | 'DIRECT' | null
  reason: string
}

export type FlightAwardOrchestratorStatus =
  | 'SUCCESS_LIVE_VERIFIED'
  | 'SUCCESS_CACHED_DISCOVERY'
  | 'PENDING_LIVE'
  | 'DIRECT_REQUIRED'
  | 'PROVIDER_UNAVAILABLE'
  | 'NO_AWARD_OPTIONS'

export interface FlightAwardOrchestratorResult {
  status: FlightAwardOrchestratorStatus
  query: FlightAwardSearchQuery
  options: FlightAwardOption[]
  liveProvider: AwardWalletFlightProviderInfo | null
  attempts: FlightAwardSourceAttempt[]
  pricingAuthority: 'DATE_SPECIFIC_LIVE' | 'CACHED_DISCOVERY' | 'DIRECT_ONLY' | 'NONE'
  fetchedAt: string
  reason: string
}

function attempt(
  source: FlightAwardSourceAttempt['source'], configured: boolean, state: FlightAwardAttemptState,
  freshness: FlightAwardSourceAttempt['freshness'], reason: string,
): FlightAwardSourceAttempt { return { source, configured, state, freshness, reason } }

function dedupe(options: FlightAwardOption[]): FlightAwardOption[] {
  const best = new Map<string, FlightAwardOption>()
  for (const option of options) {
    const segmentKey = option.segments.length
      ? option.segments.map((s) => `${s.flightNumber ?? ''}:${s.origin}:${s.destination}:${s.departureAt ?? ''}`).join('|')
      : `${option.origin}:${option.destination}:${option.programmeId}:${option.cabin}`
    const key = `${option.programmeId}|${option.cabin}|${segmentKey}`
    const current = best.get(key)
    if (!current || option.miles < current.miles) best.set(key, option)
  }
  return [...best.values()].sort((a, b) => a.miles - b.miles)
}

/**
 * Flight award policy:
 * - Broad search (no programmeIds): use Seats.aero cached discovery so we can
 *   surface many programmes without fanning out paid live crawler requests.
 * - Selected programme (exactly one programmeId): try AwardWallet live guest
 *   verification first. If it cannot complete, preserve Seats.aero cached
 *   discovery as evidence rather than calling the route unavailable.
 * - Direct airline checkout remains the final verification boundary before an
 *   irreversible transfer or booking.
 */
export async function searchFlightAwards(
  query: FlightAwardSearchQuery,
  deps: { seats?: SeatsAeroFlightProvider; awardWallet?: AwardWalletFlightSearchClient } = {},
): Promise<FlightAwardOrchestratorResult> {
  const fetchedAt = new Date().toISOString()
  const attempts: FlightAwardSourceAttempt[] = []
  const seats = deps.seats ?? new SeatsAeroFlightProvider()
  const awardWallet = deps.awardWallet ?? new AwardWalletFlightSearchClient()
  const selectedProgramme = query.programmeIds?.length === 1 ? query.programmeIds[0] : null

  if (selectedProgramme) {
    if (awardWallet.isConfigured()) {
      try {
        const live = await awardWallet.searchGuestVerified(query, selectedProgramme)
        if (live.status === 'SUCCESS' && live.options.length) {
          attempts.push(attempt('awardwallet', true, 'SUCCESS', 'LIVE', `${live.options.length} live date-specific award option(s) returned.`))
          attempts.push(attempt('seats-aero', seats.isConfigured(), 'SKIPPED', null, 'Stronger live selected-programme source succeeded.'))
          attempts.push(attempt('direct', true, 'DIRECT_REQUIRED', 'DIRECT', 'Final verification remains direct airline/programme checkout.'))
          return {
            status: 'SUCCESS_LIVE_VERIFIED', query, options: dedupe(live.options), liveProvider: live.provider,
            attempts, pricingAuthority: 'DATE_SPECIFIC_LIVE', fetchedAt: live.fetchedAt,
            reason: 'Live selected-programme award inventory returned.',
          }
        }
        if (live.status === 'PENDING') attempts.push(attempt('awardwallet', true, 'PENDING', 'LIVE', live.reason))
        else if (live.status === 'DIRECT_REQUIRED') attempts.push(attempt('awardwallet', true, 'DIRECT_REQUIRED', 'LIVE', live.reason))
        else attempts.push(attempt('awardwallet', true, 'ERROR', 'LIVE', live.reason))
      } catch (error) {
        attempts.push(attempt('awardwallet', true, 'ERROR', 'LIVE', error instanceof Error ? error.message : 'Live provider failed.'))
      }
    } else {
      attempts.push(attempt('awardwallet', false, 'UNAVAILABLE', null, 'AwardWallet API is not configured.'))
    }

    if (seats.isConfigured()) {
      try {
        const cached = dedupe(await seats.search({ ...query, programmeIds: [selectedProgramme] }))
        attempts.push(attempt('seats-aero', true, cached.length ? 'SUCCESS' : 'EMPTY', 'CACHED', cached.length ? `${cached.length} cached selected-programme option(s) returned.` : 'Cached provider returned no selected-programme option.'))
        attempts.push(attempt('direct', true, 'DIRECT_REQUIRED', 'DIRECT', 'Direct airline/programme checkout remains the final verification boundary.'))
        if (cached.length) return {
          status: 'SUCCESS_CACHED_DISCOVERY', query, options: cached, liveProvider: null, attempts,
          pricingAuthority: 'CACHED_DISCOVERY', fetchedAt, reason: 'Cached award discovery exists; selected programme was not live-verified.',
        }
      } catch (error) {
        attempts.push(attempt('seats-aero', true, 'ERROR', 'CACHED', error instanceof Error ? error.message : 'Cached provider failed.'))
      }
    } else {
      attempts.push(attempt('seats-aero', false, 'UNAVAILABLE', null, 'Seats.aero API is not configured.'))
    }

    attempts.push(attempt('direct', true, 'DIRECT_REQUIRED', 'DIRECT', 'Direct airline/programme checkout is required.'))
    const pending = attempts.some((a) => a.source === 'awardwallet' && a.state === 'PENDING')
    const direct = attempts.some((a) => a.source === 'awardwallet' && a.state === 'DIRECT_REQUIRED')
    return {
      status: pending ? 'PENDING_LIVE' : direct ? 'DIRECT_REQUIRED' : 'PROVIDER_UNAVAILABLE',
      query, options: [], liveProvider: null, attempts, pricingAuthority: direct ? 'DIRECT_ONLY' : 'NONE', fetchedAt,
      reason: pending ? 'Live award verification is still processing.' : direct ? 'Selected programme requires direct verification.' : 'No configured award source returned usable selected-programme pricing.',
    }
  }

  attempts.push(attempt('awardwallet', awardWallet.isConfigured(), 'SKIPPED', null, 'Broad search avoids live fan-out across many loyalty programmes.'))
  if (seats.isConfigured()) {
    try {
      const cached = dedupe(await seats.search(query))
      attempts.push(attempt('seats-aero', true, cached.length ? 'SUCCESS' : 'EMPTY', 'CACHED', cached.length ? `${cached.length} cached broad-discovery award option(s) returned.` : 'Cached provider returned no awards.'))
      attempts.push(attempt('direct', true, 'DIRECT_REQUIRED', 'DIRECT', 'Selected award must be verified directly/live before transfer.'))
      return cached.length ? {
        status: 'SUCCESS_CACHED_DISCOVERY', query, options: cached, liveProvider: null, attempts,
        pricingAuthority: 'CACHED_DISCOVERY', fetchedAt, reason: 'Broad cached award inventory returned.',
      } : {
        status: 'NO_AWARD_OPTIONS', query, options: [], liveProvider: null, attempts,
        pricingAuthority: 'NONE', fetchedAt, reason: 'Configured cached provider returned no award options for this route/date.',
      }
    } catch (error) {
      attempts.push(attempt('seats-aero', true, 'ERROR', 'CACHED', error instanceof Error ? error.message : 'Cached provider failed.'))
    }
  } else {
    attempts.push(attempt('seats-aero', false, 'UNAVAILABLE', null, 'Seats.aero API is not configured.'))
  }
  attempts.push(attempt('direct', true, 'DIRECT_REQUIRED', 'DIRECT', 'Direct airline/programme verification remains available.'))
  return {
    status: 'PROVIDER_UNAVAILABLE', query, options: [], liveProvider: null, attempts,
    pricingAuthority: 'NONE', fetchedAt, reason: 'Broad award discovery provider is unavailable.',
  }
}

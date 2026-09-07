import type { FlightAwardOption, FlightAwardSearchQuery } from './types'
import { AwardToolRealtimeFlightProvider, awardToolProgrammeCode } from './providers/awardtool-flight'
import { SeatsAeroFlightProvider } from './providers/seats-aero-flight'
import { AwardWalletFlightSearchClient, type AwardWalletFlightProviderInfo } from './providers/awardwallet-flight'
import { findAirIndiaMaharajaPublishedGuide, type PublishedFlightAwardGuide } from '@/lib/award-guides'

export type FlightAwardAttemptState = 'SUCCESS' | 'EMPTY' | 'PENDING' | 'UNAVAILABLE' | 'DIRECT_REQUIRED' | 'SKIPPED' | 'ERROR'

export interface FlightAwardSourceAttempt {
  source: 'awardtool' | 'awardwallet' | 'seats-aero' | 'direct'
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
  publishedGuide: PublishedFlightAwardGuide | null
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
      ? option.segments.map((segment) => `${segment.flightNumber ?? ''}:${segment.origin}:${segment.destination}:${segment.departureAt ?? ''}`).join('|')
      : `${option.origin}:${option.destination}:${option.programmeId}:${option.cabin}`
    const key = `${option.programmeId}|${option.cabin}|${segmentKey}`
    const current = best.get(key)
    if (!current || option.miles < current.miles) best.set(key, option)
  }
  return [...best.values()].sort((a, b) => a.miles - b.miles)
}

/**
 * Flight award source policy during the AwardTool evaluation:
 * 1. AwardTool Real-Time is the primary date-specific source when the requested
 *    programme is supported (or for a broad search, where it can search many
 *    programmes in one task).
 * 2. AwardWallet remains a selected-programme live fallback where guest search
 *    is allowed and no loyalty secret is required.
 * 3. Seats.aero remains cached discovery only and is never promoted to live.
 * 4. Direct airline/programme checkout remains the final verification boundary
 *    before any irreversible transfer or booking.
 */
export async function searchFlightAwards(
  query: FlightAwardSearchQuery,
  deps: {
    awardTool?: AwardToolRealtimeFlightProvider
    seats?: SeatsAeroFlightProvider
    awardWallet?: AwardWalletFlightSearchClient
  } = {},
): Promise<FlightAwardOrchestratorResult> {
  const fetchedAt = new Date().toISOString()
  const attempts: FlightAwardSourceAttempt[] = []
  const awardTool = deps.awardTool ?? new AwardToolRealtimeFlightProvider()
  const seats = deps.seats ?? new SeatsAeroFlightProvider()
  const awardWallet = deps.awardWallet ?? new AwardWalletFlightSearchClient()
  const selectedProgramme = query.programmeIds?.length === 1 ? query.programmeIds[0] : null
  const publishedGuide = selectedProgramme ? findAirIndiaMaharajaPublishedGuide({
    programmeId: selectedProgramme,
    origin: query.origin,
    destination: query.destination,
    cabin: query.cabin,
  }) : null

  const awardToolSupportsSelection = !selectedProgramme || Boolean(awardToolProgrammeCode(selectedProgramme))
  if (awardTool.isConfigured() && awardToolSupportsSelection) {
    try {
      const live = dedupe(await awardTool.search(query))
      attempts.push(attempt(
        'awardtool', true, live.length ? 'SUCCESS' : 'EMPTY', 'LIVE',
        live.length
          ? `${live.length} AwardTool date-specific real-time option(s) returned.`
          : 'AwardTool real-time search completed without a usable option for this query.',
      ))
      if (live.length) {
        attempts.push(attempt('awardwallet', awardWallet.isConfigured(), 'SKIPPED', null, 'AwardTool real-time returned stronger date-specific evidence.'))
        attempts.push(attempt('seats-aero', seats.isConfigured(), 'SKIPPED', null, 'Cached fallback not needed after real-time success.'))
        attempts.push(attempt('direct', true, 'DIRECT_REQUIRED', 'DIRECT', 'Final verification remains direct airline/programme checkout.'))
        return {
          status: 'SUCCESS_LIVE_VERIFIED', query, options: live, liveProvider: null, attempts,
          pricingAuthority: 'DATE_SPECIFIC_LIVE', publishedGuide, fetchedAt: new Date().toISOString(),
          reason: 'AwardTool returned live date-specific award inventory.',
        }
      }
    } catch (error) {
      attempts.push(attempt('awardtool', true, 'ERROR', 'LIVE', error instanceof Error ? error.message : 'AwardTool real-time search failed.'))
    }
  } else {
    attempts.push(attempt(
      'awardtool', awardTool.isConfigured(), awardToolSupportsSelection ? 'UNAVAILABLE' : 'SKIPPED', null,
      awardToolSupportsSelection
        ? 'AwardTool API is not configured.'
        : 'The selected loyalty programme is not currently exposed by AwardTool Real-Time.',
    ))
  }

  if (selectedProgramme) {
    if (awardWallet.isConfigured()) {
      try {
        const live = await awardWallet.searchGuestVerified(query, selectedProgramme)
        if (live.status === 'SUCCESS' && live.options.length) {
          attempts.push(attempt('awardwallet', true, 'SUCCESS', 'LIVE', `${live.options.length} AwardWallet live date-specific option(s) returned.`))
          attempts.push(attempt('seats-aero', seats.isConfigured(), 'SKIPPED', null, 'Stronger live selected-programme source succeeded.'))
          attempts.push(attempt('direct', true, 'DIRECT_REQUIRED', 'DIRECT', 'Final verification remains direct airline/programme checkout.'))
          return {
            status: 'SUCCESS_LIVE_VERIFIED', query, options: dedupe(live.options), liveProvider: live.provider,
            attempts, pricingAuthority: 'DATE_SPECIFIC_LIVE', publishedGuide, fetchedAt: live.fetchedAt,
            reason: 'AwardWallet returned live selected-programme award inventory.',
          }
        }
        if (live.status === 'SUCCESS') attempts.push(attempt('awardwallet', true, 'EMPTY', 'LIVE', 'Live selected-programme provider completed but returned no award options.'))
        else if (live.status === 'PENDING') attempts.push(attempt('awardwallet', true, 'PENDING', 'LIVE', live.reason))
        else if (live.status === 'DIRECT_REQUIRED') attempts.push(attempt('awardwallet', true, 'DIRECT_REQUIRED', 'LIVE', live.reason))
        else attempts.push(attempt('awardwallet', true, 'ERROR', 'LIVE', live.reason))
      } catch (error) {
        attempts.push(attempt('awardwallet', true, 'ERROR', 'LIVE', error instanceof Error ? error.message : 'AwardWallet live provider failed.'))
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
          pricingAuthority: 'CACHED_DISCOVERY', publishedGuide, fetchedAt, reason: 'Cached award discovery exists; selected programme was not live-verified.',
        }
      } catch (error) {
        attempts.push(attempt('seats-aero', true, 'ERROR', 'CACHED', error instanceof Error ? error.message : 'Cached provider failed.'))
      }
    } else {
      attempts.push(attempt('seats-aero', false, 'UNAVAILABLE', null, 'Seats.aero API is not configured.'))
    }

    attempts.push(attempt('direct', true, 'DIRECT_REQUIRED', 'DIRECT', 'Direct airline/programme checkout is required.'))
    const pending = attempts.some((item) => item.source === 'awardwallet' && item.state === 'PENDING')
    const direct = attempts.some((item) => item.source === 'awardwallet' && item.state === 'DIRECT_REQUIRED')
    const anyLiveAttempted = attempts.some((item) => (item.source === 'awardtool' || item.source === 'awardwallet') && item.configured)
    return {
      status: pending ? 'PENDING_LIVE' : direct ? 'DIRECT_REQUIRED' : anyLiveAttempted ? 'NO_AWARD_OPTIONS' : 'PROVIDER_UNAVAILABLE',
      query, options: [], liveProvider: null, attempts, pricingAuthority: direct ? 'DIRECT_ONLY' : 'NONE', publishedGuide, fetchedAt,
      reason: pending
        ? 'Live award verification is still processing.'
        : direct
          ? 'Selected programme requires direct verification.'
          : anyLiveAttempted
            ? 'Configured live sources returned no usable award option for this route/date/cabin.'
            : 'No configured award source returned usable selected-programme pricing.',
    }
  }

  attempts.push(attempt('awardwallet', awardWallet.isConfigured(), 'SKIPPED', null, 'Broad search avoids AwardWallet fan-out across many loyalty programmes.'))
  if (seats.isConfigured()) {
    try {
      const cached = dedupe(await seats.search(query))
      attempts.push(attempt('seats-aero', true, cached.length ? 'SUCCESS' : 'EMPTY', 'CACHED', cached.length ? `${cached.length} cached broad-discovery award option(s) returned.` : 'Cached provider returned no awards.'))
      attempts.push(attempt('direct', true, 'DIRECT_REQUIRED', 'DIRECT', 'Selected award must be verified directly/live before transfer.'))
      return cached.length ? {
        status: 'SUCCESS_CACHED_DISCOVERY', query, options: cached, liveProvider: null, attempts,
        pricingAuthority: 'CACHED_DISCOVERY', publishedGuide: null, fetchedAt, reason: 'Broad cached award inventory returned after live source did not return an option.',
      } : {
        status: 'NO_AWARD_OPTIONS', query, options: [], liveProvider: null, attempts,
        pricingAuthority: 'NONE', publishedGuide: null, fetchedAt, reason: 'Configured sources returned no award options for this route/date/cabin.',
      }
    } catch (error) {
      attempts.push(attempt('seats-aero', true, 'ERROR', 'CACHED', error instanceof Error ? error.message : 'Cached provider failed.'))
    }
  } else {
    attempts.push(attempt('seats-aero', false, 'UNAVAILABLE', null, 'Seats.aero API is not configured.'))
  }
  attempts.push(attempt('direct', true, 'DIRECT_REQUIRED', 'DIRECT', 'Direct airline/programme verification remains available.'))
  return {
    status: awardTool.isConfigured() ? 'NO_AWARD_OPTIONS' : 'PROVIDER_UNAVAILABLE', query, options: [], liveProvider: null, attempts,
    pricingAuthority: 'NONE', publishedGuide: null, fetchedAt,
    reason: awardTool.isConfigured()
      ? 'AwardTool real-time completed without a usable option and no cached fallback was available.'
      : 'Broad award discovery providers are unavailable.',
  }
}

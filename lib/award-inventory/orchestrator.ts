import { hotelAwardProgramme } from './programme-registry'
import { AwardToolHotelProvider } from './providers/awardtool'
import { AwardWalletHotelSearchClient, type AwardWalletGuestSearchResult, type AwardWalletHotelAwardRate } from './providers/awardwallet'
import type { HotelAwardProperty } from './types'

export type HotelAwardAttemptState =
  | 'SUCCESS'
  | 'EMPTY'
  | 'PENDING'
  | 'UNAVAILABLE'
  | 'DIRECT_REQUIRED'
  | 'CACHED_DISCOVERY'
  | 'SKIPPED'
  | 'ERROR'

export interface HotelAwardSourceAttempt {
  source: 'awardwallet' | 'awardtool' | 'direct'
  configured: boolean
  state: HotelAwardAttemptState
  freshness: 'LIVE' | 'CACHED' | 'DIRECT' | null
  reason: string
}

export type HotelAwardOrchestratorStatus =
  | 'SUCCESS'
  | 'PENDING'
  | 'CACHED_DISCOVERY'
  | 'DIRECT_REQUIRED'
  | 'PROVIDER_UNAVAILABLE'
  | 'NO_LIVE_RATES'

export interface HotelAwardOrchestratorInput {
  programmeId: string
  destination: string
  checkInDate: string
  checkOutDate: string
  numberOfRooms: 1 | 2
  numberOfAdults: number
  numberOfKids: number
}

export interface HotelAwardOrchestratorResult {
  status: HotelAwardOrchestratorStatus
  programmeId: string
  rates: AwardWalletHotelAwardRate[]
  cachedProperties: HotelAwardProperty[]
  provider: AwardWalletGuestSearchResult extends infer _T ? { code: string; displayName: string; shortName: string; loginRequired: boolean } | null : never
  fetchedAt: string
  reason: string
  attempts: HotelAwardSourceAttempt[]
  pricingAuthority: 'DATE_SPECIFIC_LIVE' | 'DISCOVERY_ONLY' | 'DIRECT_ONLY' | 'NONE'
}

function attempt(
  source: HotelAwardSourceAttempt['source'],
  configured: boolean,
  state: HotelAwardAttemptState,
  freshness: HotelAwardSourceAttempt['freshness'],
  reason: string,
): HotelAwardSourceAttempt {
  return { source, configured, state, freshness, reason }
}

function trimCached(properties: HotelAwardProperty[]): HotelAwardProperty[] {
  return properties
    .sort((a, b) => (b.awardAvailabilityPercent ?? -1) - (a.awardAvailabilityPercent ?? -1))
    .slice(0, 12)
}

/**
 * Hotel award source policy:
 * 1. Prefer a guest-capable live AwardWallet search for the exact stay dates.
 * 2. If live search is unavailable/empty/pending, consult AwardTool only as
 *    cached discovery. Its property/range data MUST NOT enter exact ranking.
 * 3. Direct programme checkout remains the final verification boundary.
 *
 * Missing provider credentials are provider-unavailable states, never evidence
 * of zero award availability.
 */
export async function searchHotelAwards(
  input: HotelAwardOrchestratorInput,
  deps: {
    awardWallet?: AwardWalletHotelSearchClient
    awardTool?: AwardToolHotelProvider
  } = {},
): Promise<HotelAwardOrchestratorResult> {
  const definition = hotelAwardProgramme(input.programmeId)
  if (!definition) throw new Error('unsupported hotel loyalty programme')

  const fetchedAt = new Date().toISOString()
  const attempts: HotelAwardSourceAttempt[] = []

  if (definition.discoveryMode === 'DIRECT_REQUIRED') {
    attempts.push(attempt('awardwallet', false, 'SKIPPED', null, 'Programme policy is direct verification.'))
    attempts.push(attempt('awardtool', false, 'SKIPPED', null, 'Programme is not currently mapped to aggregate award discovery.'))
    attempts.push(attempt('direct', true, 'DIRECT_REQUIRED', 'DIRECT', 'Direct programme checkout is required.'))
    return {
      status: 'DIRECT_REQUIRED', programmeId: input.programmeId, rates: [], cachedProperties: [], provider: null,
      fetchedAt, reason: `${definition.displayName} currently requires direct programme availability verification.`,
      attempts, pricingAuthority: 'DIRECT_ONLY',
    }
  }

  const awardWallet = deps.awardWallet ?? new AwardWalletHotelSearchClient()
  let live: AwardWalletGuestSearchResult | null = null

  if (awardWallet.isConfigured()) {
    try {
      live = await awardWallet.searchGuest(input.programmeId, {
        destination: input.destination,
        checkInDate: input.checkInDate,
        checkOutDate: input.checkOutDate,
        numberOfRooms: input.numberOfRooms,
        numberOfAdults: input.numberOfAdults,
        numberOfKids: input.numberOfKids,
        priority: 9,
      })
      if (live.status === 'SUCCESS' && live.rates.length > 0) {
        attempts.push(attempt('awardwallet', true, 'SUCCESS', 'LIVE', `${live.rates.length} date-specific award rate(s) returned.`))
        attempts.push(attempt('awardtool', false, 'SKIPPED', null, 'Stronger live date-specific source succeeded.'))
        attempts.push(attempt('direct', true, 'DIRECT_REQUIRED', 'DIRECT', 'Final verification remains direct programme checkout.'))
        return {
          status: 'SUCCESS', programmeId: input.programmeId, rates: live.rates, cachedProperties: [], provider: live.provider,
          fetchedAt: live.fetchedAt, reason: 'Live date-specific award inventory returned.', attempts,
          pricingAuthority: 'DATE_SPECIFIC_LIVE',
        }
      }

      if (live.status === 'SUCCESS') attempts.push(attempt('awardwallet', true, 'EMPTY', 'LIVE', 'Live provider completed but returned no award rates.'))
      else if (live.status === 'PENDING') attempts.push(attempt('awardwallet', true, 'PENDING', 'LIVE', live.reason))
      else if (live.status === 'DIRECT_REQUIRED') attempts.push(attempt('awardwallet', true, 'DIRECT_REQUIRED', 'LIVE', live.reason))
      else attempts.push(attempt('awardwallet', true, 'ERROR', 'LIVE', live.reason))
    } catch (error) {
      attempts.push(attempt('awardwallet', true, 'ERROR', 'LIVE', error instanceof Error ? error.message : 'Live award provider failed.'))
    }
  } else {
    attempts.push(attempt('awardwallet', false, 'UNAVAILABLE', null, 'AwardWallet API is not configured.'))
  }

  const awardTool = deps.awardTool ?? new AwardToolHotelProvider()
  let cached: HotelAwardProperty[] = []
  if (awardTool.isConfigured()) {
    try {
      cached = trimCached(await awardTool.listSupportedProperties({
        destination: input.destination,
        programmeIds: [input.programmeId],
      }))
      attempts.push(attempt(
        'awardtool', true, cached.length ? 'CACHED_DISCOVERY' : 'EMPTY', 'CACHED',
        cached.length
          ? `${cached.length} cached property discovery result(s) returned; not date-specific pricing.`
          : 'Cached provider returned no matching properties for this destination/programme.',
      ))
    } catch (error) {
      attempts.push(attempt('awardtool', true, 'ERROR', 'CACHED', error instanceof Error ? error.message : 'Cached award provider failed.'))
    }
  } else {
    attempts.push(attempt('awardtool', false, 'UNAVAILABLE', null, 'AwardTool API is not configured.'))
  }

  attempts.push(attempt('direct', true, 'DIRECT_REQUIRED', 'DIRECT', 'Direct programme checkout remains available for final verification.'))

  if (cached.length) {
    return {
      status: 'CACHED_DISCOVERY', programmeId: input.programmeId, rates: [], cachedProperties: cached,
      provider: live?.provider ?? null, fetchedAt, reason: 'Cached award discovery exists, but no live date-specific price is available.',
      attempts, pricingAuthority: 'DISCOVERY_ONLY',
    }
  }

  if (live?.status === 'PENDING') {
    return {
      status: 'PENDING', programmeId: input.programmeId, rates: [], cachedProperties: [], provider: live.provider,
      fetchedAt: live.fetchedAt, reason: live.reason, attempts, pricingAuthority: 'NONE',
    }
  }

  if (live?.status === 'SUCCESS') {
    return {
      status: 'NO_LIVE_RATES', programmeId: input.programmeId, rates: [], cachedProperties: [], provider: live.provider,
      fetchedAt: live.fetchedAt, reason: 'Live provider completed but returned no award rates for this search.',
      attempts, pricingAuthority: 'NONE',
    }
  }

  if (live?.status === 'DIRECT_REQUIRED') {
    return {
      status: 'DIRECT_REQUIRED', programmeId: input.programmeId, rates: [], cachedProperties: [], provider: live.provider,
      fetchedAt: live.fetchedAt, reason: live.reason, attempts, pricingAuthority: 'DIRECT_ONLY',
    }
  }

  return {
    status: 'PROVIDER_UNAVAILABLE', programmeId: input.programmeId, rates: [], cachedProperties: [], provider: live?.provider ?? null,
    fetchedAt, reason: 'No configured award source returned date-specific pricing. Direct verification remains available.',
    attempts, pricingAuthority: 'NONE',
  }
}

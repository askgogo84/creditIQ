import { describe, expect, it } from 'vitest'
import { searchFlightAwards } from './flight-orchestrator'

const baseQuery = {
  origin: 'BLR', destination: 'SIN', date: '2026-10-15', cabin: 'business' as const, adults: 1,
}

function option(provider: string, programmeId = 'krisflyer', miles = 43000) {
  return {
    providerResultId: `${provider}-${miles}`, programmeId, origin: 'BLR', destination: 'SIN',
    departureAt: null, arrivalAt: null, cabin: 'business', miles, taxesMinor: provider === 'awardwallet' ? 418000 : null,
    taxesCurrency: provider === 'awardwallet' ? 'INR' : null, segments: [],
    evidence: { provider, freshness: provider === 'awardwallet' ? 'LIVE' as const : 'CACHED' as const, fetchedAt: '2026-09-03T00:00:00Z' },
  }
}

describe('flight award orchestrator', () => {
  it('uses cached broad discovery without fanning out live programme searches', async () => {
    let liveCalled = false
    const result = await searchFlightAwards(baseQuery, {
      seats: { isConfigured: () => true, search: async () => [option('seats-aero-cached'), option('seats-aero-cached', 'air-india-maharaja', 50000)] } as any,
      awardWallet: { isConfigured: () => true, searchGuestVerified: async () => { liveCalled = true; throw new Error('should not run') } } as any,
    })
    expect(liveCalled).toBe(false)
    expect(result.status).toBe('SUCCESS_CACHED_DISCOVERY')
    expect(result.options).toHaveLength(2)
    expect(result.pricingAuthority).toBe('CACHED_DISCOVERY')
  })

  it('prefers live selected-programme verification over cached discovery', async () => {
    let seatsCalled = false
    const result = await searchFlightAwards({ ...baseQuery, programmeIds: ['krisflyer'] }, {
      seats: { isConfigured: () => true, search: async () => { seatsCalled = true; return [option('seats-aero-cached')] } } as any,
      awardWallet: {
        isConfigured: () => true,
        searchGuestVerified: async () => ({ status: 'SUCCESS', provider: { code: 'singapore' }, options: [option('awardwallet')], fetchedAt: '2026-09-03T00:00:00Z' }),
      } as any,
    })
    expect(seatsCalled).toBe(false)
    expect(result.status).toBe('SUCCESS_LIVE_VERIFIED')
    expect(result.options[0].evidence.freshness).toBe('LIVE')
    expect(result.pricingAuthority).toBe('DATE_SPECIFIC_LIVE')
  })

  it('falls back to cached discovery when live selected-programme verification is pending', async () => {
    const result = await searchFlightAwards({ ...baseQuery, programmeIds: ['krisflyer'] }, {
      seats: { isConfigured: () => true, search: async () => [option('seats-aero-cached')] } as any,
      awardWallet: {
        isConfigured: () => true,
        searchGuestVerified: async () => ({ status: 'PENDING', provider: { code: 'singapore' }, options: [], fetchedAt: 'x', reason: 'queued' }),
      } as any,
    })
    expect(result.status).toBe('SUCCESS_CACHED_DISCOVERY')
    expect(result.options[0].evidence.freshness).toBe('CACHED')
    expect(result.attempts.some((a) => a.source === 'awardwallet' && a.state === 'PENDING')).toBe(true)
  })

  it('never turns missing providers into a false no-award result', async () => {
    const result = await searchFlightAwards({ ...baseQuery, programmeIds: ['krisflyer'] }, {
      seats: { isConfigured: () => false, search: async () => [] } as any,
      awardWallet: { isConfigured: () => false } as any,
    })
    expect(result.status).toBe('PROVIDER_UNAVAILABLE')
    expect(result.reason).toMatch(/No configured award source/)
  })

  it('returns a published Maharaja guide without treating it as inventory', async () => {
    const result = await searchFlightAwards({
      origin: 'DEL', destination: 'SIN', date: '2026-10-15', cabin: 'economy', adults: 1,
      programmeIds: ['air-india-maharaja'],
    }, {
      seats: { isConfigured: () => false, search: async () => [] } as any,
      awardWallet: { isConfigured: () => false } as any,
    })

    expect(result.status).toBe('PROVIDER_UNAVAILABLE')
    expect(result.options).toEqual([])
    expect(result.publishedGuide?.authority).toBe('PLANNING_ONLY')
    expect(result.publishedGuide?.tiers[0]).toMatchObject({ id: 'VALUE', pointsMin: 12_000, pointsMax: 30_000 })
  })
})

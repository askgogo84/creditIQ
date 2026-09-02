import { describe, expect, it, vi } from 'vitest'
import { searchHotelAwards } from './orchestrator'

const liveRate = {
  id: 'rate-1', programmeId: 'marriott-bonvoy', providerCode: 'marriott', hotelName: 'JW Marriott Singapore',
  hotelUrl: null, addressText: null, latitude: 1.29, longitude: 103.85,
  checkInDate: '2026-10-15', checkOutDate: '2026-10-18', numberOfNights: 3,
  roomType: null, roomName: 'King', rateName: 'Standard Reward', pointsPerNight: 42000,
  totalPoints: 126000, cashPerNightMinor: null, totalCashMinor: null, cashCurrency: null,
  fetchedAt: '2026-09-02T17:00:00Z', freshness: 'LIVE' as const, source: 'awardwallet' as const,
}

const provider = { code: 'marriott', displayName: 'Marriott', shortName: 'Marriott', loginRequired: false }

const input = {
  programmeId: 'marriott-bonvoy', destination: 'Singapore', checkInDate: '2026-10-15', checkOutDate: '2026-10-18',
  numberOfRooms: 1 as const, numberOfAdults: 2, numberOfKids: 0,
}

function wallet(result: any, configured = true) {
  return {
    isConfigured: () => configured,
    searchGuest: vi.fn().mockResolvedValue(result),
  } as any
}

function tool(properties: any[], configured = true) {
  return {
    isConfigured: () => configured,
    listSupportedProperties: vi.fn().mockResolvedValue(properties),
  } as any
}

describe('hotel award orchestrator', () => {
  it('prefers live date-specific AwardWallet rates and skips cached discovery', async () => {
    const aw = wallet({ status: 'SUCCESS', provider, rates: [liveRate], fetchedAt: liveRate.fetchedAt })
    const at = tool([{ providerPropertyId: 'x' }])
    const result = await searchHotelAwards(input, { awardWallet: aw, awardTool: at })

    expect(result.status).toBe('SUCCESS')
    expect(result.pricingAuthority).toBe('DATE_SPECIFIC_LIVE')
    expect(result.rates).toHaveLength(1)
    expect(at.listSupportedProperties).not.toHaveBeenCalled()
    expect(result.attempts.map((a) => [a.source, a.state])).toContainEqual(['awardtool', 'SKIPPED'])
  })

  it('falls back to AwardTool only as cached discovery when live provider is unavailable', async () => {
    const cached = [{
      providerPropertyId: 'marriott_jw_sin', programmeId: 'marriott-bonvoy', programmeHotelId: 'jw-sin',
      name: 'JW Marriott Singapore', brand: 'marriott', subBrand: 'JW Marriott', formattedAddress: 'Singapore',
      latitude: 1.29, longitude: 103.85, imageUrl: null, awardAvailabilityPercent: 81,
      observedCashMin: 500, observedCashMedian: 575, observedCashMax: 700,
      observedPointsMin: 39000, observedPointsMedian: 42000, observedPointsMax: 51000,
      updatedAt: '2026-09-02', evidence: { provider: 'awardtool', freshness: 'CACHED', fetchedAt: '2026-09-02T17:00:00Z' },
    }]
    const result = await searchHotelAwards(input, {
      awardWallet: wallet(null, false), awardTool: tool(cached),
    })

    expect(result.status).toBe('CACHED_DISCOVERY')
    expect(result.pricingAuthority).toBe('DISCOVERY_ONLY')
    expect(result.rates).toEqual([])
    expect(result.cachedProperties).toHaveLength(1)
    expect(result.attempts).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: 'awardwallet', state: 'UNAVAILABLE' }),
      expect.objectContaining({ source: 'awardtool', state: 'CACHED_DISCOVERY' }),
      expect.objectContaining({ source: 'direct', state: 'DIRECT_REQUIRED' }),
    ]))
  })

  it('does not convert a successful empty live search into cached exact pricing', async () => {
    const result = await searchHotelAwards(input, {
      awardWallet: wallet({ status: 'SUCCESS', provider, rates: [], fetchedAt: '2026-09-02T17:00:00Z' }),
      awardTool: tool([]),
    })

    expect(result.status).toBe('NO_LIVE_RATES')
    expect(result.pricingAuthority).toBe('NONE')
    expect(result.rates).toEqual([])
  })

  it('keeps direct-required programmes direct without calling aggregate providers', async () => {
    const aw = wallet({ status: 'SUCCESS', provider, rates: [liveRate], fetchedAt: liveRate.fetchedAt })
    const at = tool([])
    const result = await searchHotelAwards({ ...input, programmeId: 'accor-all' }, { awardWallet: aw, awardTool: at })

    expect(result.status).toBe('DIRECT_REQUIRED')
    expect(result.pricingAuthority).toBe('DIRECT_ONLY')
    expect(aw.searchGuest).not.toHaveBeenCalled()
    expect(at.listSupportedProperties).not.toHaveBeenCalled()
  })

  it('never claims no award availability when neither provider is configured', async () => {
    const result = await searchHotelAwards(input, {
      awardWallet: wallet(null, false), awardTool: tool([], false),
    })

    expect(result.status).toBe('PROVIDER_UNAVAILABLE')
    expect(result.reason).toMatch(/No configured award source/i)
    expect(result.status).not.toBe('NO_LIVE_RATES')
  })
})

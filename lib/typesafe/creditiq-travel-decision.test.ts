import { describe, expect, it } from 'vitest'
import { deterministicTravelDecision } from './creditiq-travel-decision'
import { deterministicHotelVerdict } from './creditiq-hotel-decision'

function travelFixture(verdict: string, awardStatus: string) {
  return {
    travelKind: 'flight',
    awardState: {
      status: awardStatus,
      programmeId: 'singapore-krisflyer',
      pointsRequired: 24000,
      taxesMinor: 250000,
      taxesCurrency: 'INR',
    },
    conciergeAction: {
      requiresLiveReverification: awardStatus !== 'NOT_APPLICABLE',
    },
    blockedReasons: [],
    searchSummary: {
      verdict,
      cash: { amountMinor: 1800000, currency: 'INR' },
      bestPath: {
        id: 'rail-1',
        railType: 'LOYALTY_TRANSFER',
        state: verdict === 'VERIFY_AWARD' ? 'PROJECTED_NEEDS_VERIFICATION' : 'EXECUTABLE',
        affordability: 'AFFORDABLE',
        bankPointsRequired: 24000,
        cashPayableMinor: 250000,
        cashCurrency: 'INR',
        savingsVsCashMinor: 1550000,
        valuePerBankPointInr: 0.64,
        isBestExecutable: verdict === 'USE_POINTS',
        isBestProjected: true,
      },
    },
  } as any
}

describe('CreditIQ Jev deterministic safety fallback', () => {
  it('never promotes discovery-only flight awards to transfer/use-points', () => {
    const decision = deterministicTravelDecision(travelFixture('VERIFY_AWARD', 'DISCOVERY_ONLY'))
    expect(decision.action).toBe('VERIFY_AWARD_FIRST')
    expect(decision.transferRisk).toBe('HIGH')
    expect(decision.verificationRequired).toBe(true)
    expect(decision.source).toBe('deterministic-fallback')
  })

  it('preserves an executable live points verdict as the fallback action', () => {
    const decision = deterministicTravelDecision(travelFixture('USE_POINTS', 'LIVE_OR_PROVIDER_RETURNED'))
    expect(decision.action).toBe('USE_POINTS')
    expect(decision.source).toBe('deterministic-fallback')
  })

  it('forces discovery-only hotel points into verification', () => {
    const verdict = deterministicHotelVerdict({
      destination: 'Singapore',
      cash: { amountMinor: 2400000, currency: 'INR', source: 'booking-demand', live: true },
      loyalty: {
        programmeId: 'marriott-bonvoy',
        propertyName: 'Example Hotel',
        pointsRequired: 38000,
        cashComponentMinor: null,
        cashCurrency: null,
        status: 'CACHED_DISCOVERY',
        pricingAuthority: 'DISCOVERY_ONLY',
      },
    })
    expect(verdict.action).toBe('VERIFY_LOYALTY_AVAILABILITY')
    expect(verdict.verificationRequired).toBe(true)
  })

  it('allows a live hotel points rate to reach comparison instead of discovery verification', () => {
    const verdict = deterministicHotelVerdict({
      destination: 'Singapore',
      cash: { amountMinor: 2400000, currency: 'INR', source: 'booking-demand', live: true },
      loyalty: {
        programmeId: 'marriott-bonvoy',
        propertyName: 'Example Hotel',
        pointsRequired: 38000,
        cashComponentMinor: 0,
        cashCurrency: 'INR',
        status: 'SUCCESS',
        pricingAuthority: 'DATE_SPECIFIC_LIVE',
      },
    })
    expect(verdict.action).toBe('COMPARE_LIVE_OPTIONS')
    expect(verdict.verificationRequired).toBe(false)
  })
})

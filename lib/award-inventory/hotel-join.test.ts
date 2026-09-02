import { describe, expect, it } from 'vitest'
import { joinHotelAwardRates } from './hotel-join'
import type { AwardWalletHotelAwardRate } from './providers/awardwallet'

function rate(overrides: Partial<AwardWalletHotelAwardRate> = {}): AwardWalletHotelAwardRate {
  return {
    id: 'marriott:1',
    programmeId: 'marriott-bonvoy',
    providerCode: 'marriott',
    hotelName: 'JW Marriott Hotel Singapore South Beach',
    hotelUrl: 'https://example.com',
    addressText: '30 Beach Road, Singapore',
    latitude: 1.2945,
    longitude: 103.8572,
    checkInDate: '2026-10-15',
    checkOutDate: '2026-10-18',
    numberOfNights: 3,
    roomType: 'Standard',
    roomName: 'King',
    rateName: 'Standard Reward',
    pointsPerNight: 42000,
    totalPoints: 126000,
    cashPerNightMinor: null,
    totalCashMinor: null,
    cashCurrency: null,
    fetchedAt: '2026-09-02T16:00:00Z',
    freshness: 'LIVE',
    source: 'awardwallet',
    ...overrides,
  }
}

describe('hotel award join', () => {
  it('joins an exact normalized property name and keeps every room/rate option', () => {
    const joined = joinHotelAwardRates({
      id: 'cash-1', hotelName: 'JW Marriott Hotel Singapore South Beach', chainName: 'Marriott',
      latitude: 1.2945, longitude: 103.8572,
    }, [rate({ id: 'a', totalPoints: 126000 }), rate({ id: 'b', totalPoints: 150000 })])

    expect(joined?.confidence).toBe('EXACT')
    expect(joined?.rates.map((r) => r.id)).toEqual(['a', 'b'])
  })

  it('allows a high-confidence branded name variant when coordinates agree closely', () => {
    const joined = joinHotelAwardRates({
      id: 'cash-2', hotelName: 'JW Marriott Singapore South Beach', chainName: 'Marriott',
      latitude: 1.29452, longitude: 103.85718,
    }, [rate()])

    expect(joined?.confidence).toBe('HIGH')
    expect(joined?.awardHotelName).toContain('JW Marriott')
  })

  it('does not join a similarly named but geographically different hotel', () => {
    const joined = joinHotelAwardRates({
      id: 'cash-3', hotelName: 'JW Marriott Singapore', chainName: 'Marriott',
      latitude: 1.36, longitude: 103.99,
    }, [rate({ hotelName: 'JW Marriott Singapore Airport', latitude: 1.36, longitude: 103.99 }), rate()])

    expect(joined?.awardHotelName).toBe('JW Marriott Singapore Airport')
  })

  it('fails closed when two high-confidence candidates are effectively tied', () => {
    const joined = joinHotelAwardRates({
      id: 'cash-4', hotelName: 'Marriott Downtown', chainName: 'Marriott', latitude: null, longitude: null,
    }, [
      rate({ id: 'a', hotelName: 'Marriott Downtown East', latitude: null, longitude: null }),
      rate({ id: 'b', hotelName: 'Marriott Downtown West', latitude: null, longitude: null }),
    ])
    expect(joined).toBeNull()
  })
})

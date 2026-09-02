import { describe, expect, it } from 'vitest'
import { attachRailsToFlightAward, attachRailsToHotelAward } from './redemption-matrix'
import type { FlightAwardOption, HotelAwardProperty } from './types'

const wallet = [
  { walletKey: 'h', bank: 'HDFC', cardName: 'HDFC Infinia Metal Edition', pointsBalance: 50000, balanceVerified: true },
  { walletKey: 'u', bank: 'AU', cardName: 'AU Zenith Plus', pointsBalance: 10000, balanceVerified: true },
]

const flightAward: FlightAwardOption = {
  providerResultId: 'f1',
  programmeId: 'krisflyer',
  origin: 'BLR', destination: 'SIN',
  departureAt: null, arrivalAt: null,
  cabin: 'business', miles: 43000,
  taxesMinor: 418000, taxesCurrency: 'INR',
  segments: [],
  evidence: { provider: 'fixture', freshness: 'CAPTURED', fetchedAt: '2026-09-02T00:00:00Z' },
}

const hotelAward: HotelAwardProperty = {
  providerPropertyId: 'm1',
  programmeId: 'marriott-bonvoy',
  programmeHotelId: 'ABC',
  name: 'JW Marriott Example',
  brand: 'marriott', subBrand: null, formattedAddress: 'Singapore',
  latitude: null, longitude: null, imageUrl: null,
  awardAvailabilityPercent: 80,
  observedCashMin: 400, observedCashMedian: 500, observedCashMax: 700,
  observedPointsMin: 35000, observedPointsMedian: 42000, observedPointsMax: 60000,
  updatedAt: '2026-09-02',
  evidence: { provider: 'awardtool', freshness: 'CACHED', fetchedAt: '2026-09-02T00:00:00Z' },
}

describe('award inventory redemption rail join', () => {
  it('attaches exact-programme flight transfer rails while preserving unsupported cards', () => {
    const result = attachRailsToFlightAward(flightAward, wallet)
    expect(result.railMatrix.programmeId).toBe('krisflyer')
    expect(result.railMatrix.cards[0].rails.some((rail) => rail.id === 'hdfc-infinia-transfer-krisflyer')).toBe(true)
    expect(result.railMatrix.cards[1].status).toBe('NO_VERIFIED_REDEMPTION_RAIL')
    expect(result.railMatrix.cashRail.executionState).toBe('EXECUTABLE')
  })

  it('attaches Marriott-specific HDFC transfer rail to a Marriott award property', () => {
    const result = attachRailsToHotelAward(hotelAward, wallet)
    const hdfcRails = result.railMatrix.cards[0].rails
    expect(hdfcRails.some((rail) => rail.id === 'hdfc-infinia-transfer-marriott-bonvoy')).toBe(true)
    expect(hdfcRails.some((rail) => rail.id === 'hdfc-infinia-transfer-accor-all')).toBe(false)
  })
})

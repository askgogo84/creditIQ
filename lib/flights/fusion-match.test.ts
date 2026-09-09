import { describe, expect, it } from 'vitest'
import type { CashFlight } from '@/lib/fusion-core'
import type { SeatsAeroResult } from '@/lib/seats-aero'
import { airlineDisplayName, cashSourceCabinVerified, matchAwardToCashFlight } from './fusion-match'

const cash: CashFlight = {
  id: 'ai-428',
  price: 41850,
  airline: 'AI',
  from: 'BLR',
  to: 'DEL',
  departure: '2026-09-11T15:30:00',
  arrival: '2026-09-11T18:15:00',
  duration: 3,
  stops: 0,
  bookingLink: 'https://example.com',
}

function award(overrides: Partial<SeatsAeroResult> = {}): SeatsAeroResult {
  return {
    id: 'award-1',
    source: 'aeroplan',
    date: '2026-09-11',
    mileageCost: 22500,
    yMileageCost: 0,
    jMileageCost: 22500,
    fMileageCost: 0,
    remainingSeats: 1,
    airlines: '',
    isDirect: true,
    dataSource: 'seats.aero (cached)',
    ...overrides,
  } as SeatsAeroResult
}

describe('flight fusion airline identity', () => {
  it('never binds cached discovery to a concrete live cash itinerary', () => {
    expect(matchAwardToCashFlight(cash, [award({ airlines: 'AI' })], 'CACHED_DISCOVERY')).toBeNull()
  })

  it('does not bind a carrierless live award to Air India just because the date matches', () => {
    expect(matchAwardToCashFlight(cash, [award({ dataSource: 'live' })], 'DATE_SPECIFIC_LIVE')).toBeNull()
  })

  it('does not bind a different carrier live award to Air India', () => {
    expect(matchAwardToCashFlight(cash, [award({ airlines: 'AC', dataSource: 'live' })], 'DATE_SPECIFIC_LIVE')).toBeNull()
  })

  it('binds date-specific live award evidence when the carrier matches', () => {
    const matched = matchAwardToCashFlight(cash, [award({ airlines: 'AI', dataSource: 'live' })], 'DATE_SPECIFIC_LIVE')
    expect(matched?.id).toBe('award-1')
  })

  it('recognizes Kiwi MCP as exact-cabin live cash authority', () => {
    expect(cashSourceCabinVerified('kiwi-mcp', true)).toBe(true)
    expect(cashSourceCabinVerified('travelpayouts-v3', true)).toBe(false)
  })

  it('renders familiar Indian airline names', () => {
    expect(airlineDisplayName('AI')).toBe('Air India')
    expect(airlineDisplayName('6E')).toBe('IndiGo')
    expect(airlineDisplayName('IX')).toBe('Air India Express')
    expect(airlineDisplayName('QP')).toBe('Akasa Air')
  })
})

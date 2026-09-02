import { describe, expect, it } from 'vitest'
import { programmeIdForFlightSource, programmeIdForHotelChain } from './programme-resolver'

describe('travel programme resolver', () => {
  it('normalises Seats.aero source slugs to registry programme ids', () => {
    expect(programmeIdForFlightSource('singapore')).toBe('krisflyer')
    expect(programmeIdForFlightSource('ba')).toBe('british-airways-club')
    expect(programmeIdForFlightSource('air-india')).toBe('air-india-maharaja')
  })

  it('keeps known award programmes addressable even when no bank transfer rail exists yet', () => {
    expect(programmeIdForFlightSource('emirates')).toBe('emirates-skywards')
    expect(programmeIdForFlightSource('american')).toBe('american-aadvantage')
  })

  it('maps major hotel families without guessing unrelated independents', () => {
    expect(programmeIdForHotelChain('Marriott International')).toBe('marriott-bonvoy')
    expect(programmeIdForHotelChain('Accor')).toBe('accor-all')
    expect(programmeIdForHotelChain('IHCL - Taj Hotels')).toBe('taj-neupass')
    expect(programmeIdForHotelChain('Independent Collection')).toBeNull()
  })
})

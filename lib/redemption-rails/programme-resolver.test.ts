import { describe, expect, it } from 'vitest'
import { programmeIdForFlightCarrier, programmeIdForFlightSource, programmeIdForHotelChain } from './programme-resolver'

describe('travel programme resolver', () => {
  it('normalises award/source slugs to registry programme ids', () => {
    expect(programmeIdForFlightSource('singapore')).toBe('krisflyer')
    expect(programmeIdForFlightSource('ba')).toBe('british-airways-club')
    expect(programmeIdForFlightSource('air-india')).toBe('air-india-maharaja')
    expect(programmeIdForFlightSource('finnair')).toBe('finnair')
    expect(programmeIdForFlightSource('ethiopian')).toBe('ethiopian')
    expect(programmeIdForFlightSource('qantas')).toBe('qantas')
  })

  it('resolves domestic operating carriers even when no award record was returned', () => {
    expect(programmeIdForFlightCarrier('AI')).toBe('air-india-maharaja')
    expect(programmeIdForFlightCarrier('Air India')).toBe('air-india-maharaja')
    expect(programmeIdForFlightCarrier('6E')).toBe('indigo-bluchip')
    expect(programmeIdForFlightCarrier('IndiGo')).toBe('indigo-bluchip')
    expect(programmeIdForFlightCarrier('SG')).toBe('spiceclub')
    expect(programmeIdForFlightCarrier('Akasa Air')).toBeNull()
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

import { describe, expect, it } from 'vitest'
import { programmeIdForFlightCarrier, programmeIdForFlightSource, programmeIdForHotelChain } from './programme-resolver'

describe('travel programme resolver', () => {
  it('normalises award/source slugs to registry programme ids', () => {
    expect(programmeIdForFlightSource('singapore')).toBe('krisflyer')
    expect(programmeIdForFlightSource('ba')).toBe('british-airways-club')
    expect(programmeIdForFlightSource('air-india')).toBe('air-india-maharaja')
    expect(programmeIdForFlightSource('airasia')).toBe('airasia-rewards')
    expect(programmeIdForFlightSource('indigo')).toBe('indigo-bluchip')
    expect(programmeIdForFlightSource('spicejet')).toBe('spiceclub')
    expect(programmeIdForFlightSource('finnair')).toBe('finnair')
    expect(programmeIdForFlightSource('ethiopian')).toBe('ethiopian')
    expect(programmeIdForFlightSource('jal')).toBe('jal-mileage-bank')
    expect(programmeIdForFlightSource('thai')).toBe('thai-royal-orchid')
    expect(programmeIdForFlightSource('lotusmiles')).toBe('lotusmiles')
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

  it('maps Indian hotel families and sub-brands without guessing independents', () => {
    expect(programmeIdForHotelChain('IHCL - Taj Hotels')).toBe('taj-neupass')
    expect(programmeIdForHotelChain('Vivanta Bengaluru')).toBe('taj-neupass')
    expect(programmeIdForHotelChain('Ginger Goa')).toBe('taj-neupass')
    expect(programmeIdForHotelChain('ITC Grand Chola')).toBe('club-itc')
    expect(programmeIdForHotelChain('Welcomhotel by ITC')).toBe('club-itc')
    expect(programmeIdForHotelChain('Fortune Hotels')).toBe('club-itc')
    expect(programmeIdForHotelChain('Royal Orchid Bangalore')).toBe('orchid-rewards')
    expect(programmeIdForHotelChain('Regenta Central')).toBe('orchid-rewards')
    expect(programmeIdForHotelChain('The Postcard Cuelim')).toBe('postcard-sunshine-club')
    expect(programmeIdForHotelChain('Independent Collection')).toBeNull()
  })

  it('maps major global hotel families and common sub-brands', () => {
    expect(programmeIdForHotelChain('Marriott International')).toBe('marriott-bonvoy')
    expect(programmeIdForHotelChain('JW Marriott')).toBe('marriott-bonvoy')
    expect(programmeIdForHotelChain('Le Meridien')).toBe('marriott-bonvoy')
    expect(programmeIdForHotelChain('Accor')).toBe('accor-all')
    expect(programmeIdForHotelChain('Fairmont')).toBe('accor-all')
    expect(programmeIdForHotelChain('Holiday Inn Express')).toBe('ihg-one')
    expect(programmeIdForHotelChain('Conrad Hotels')).toBe('hilton-honors')
    expect(programmeIdForHotelChain('Park Hyatt')).toBe('world-of-hyatt')
    expect(programmeIdForHotelChain('Ramada by Wyndham')).toBe('wyndham-rewards')
    expect(programmeIdForHotelChain('Radisson Blu')).toBe('radisson-rewards')
    expect(programmeIdForHotelChain('Shangri-La')).toBe('shangri-la-circle')
  })
})
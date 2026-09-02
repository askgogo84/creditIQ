import { describe, expect, it } from 'vitest'
import { HOTEL_AWARD_PROGRAMMES, hotelAwardProgramme } from './programme-registry'

describe('hotel award programme registry', () => {
  it('keeps Marriott, Accor, Taj and Club ITC as first-class programmes', () => {
    const ids = HOTEL_AWARD_PROGRAMMES.map((programme) => programme.programmeId)
    expect(ids).toContain('marriott-bonvoy')
    expect(ids).toContain('accor-all')
    expect(ids).toContain('taj-neupass')
    expect(ids).toContain('club-itc')
  })

  it('declares live guest search before cached discovery for aggregator-covered programmes', () => {
    expect(hotelAwardProgramme('marriott-bonvoy')).toMatchObject({
      discoveryMode: 'AGGREGATOR_LIVE',
      discoveryProviders: ['awardwallet', 'awardtool'],
    })
    expect(hotelAwardProgramme('world-of-hyatt')?.discoveryProviders).toEqual(['awardwallet', 'awardtool'])
    expect(hotelAwardProgramme('hilton-honors')?.discoveryProviders).toEqual(['awardwallet', 'awardtool'])
  })

  it('does not hide Accor or Taj merely because current aggregate coverage is unavailable', () => {
    expect(hotelAwardProgramme('accor-all')).toMatchObject({
      discoveryMode: 'DIRECT_REQUIRED',
      discoveryProviders: [],
    })
    expect(hotelAwardProgramme('taj-neupass')).toMatchObject({
      discoveryMode: 'DIRECT_REQUIRED',
      discoveryProviders: [],
    })
  })

  it('requires direct programme checkout as the final verification boundary for every programme', () => {
    expect(HOTEL_AWARD_PROGRAMMES.every(
      (programme) => programme.finalVerification === 'DIRECT_PROGRAMME_CHECKOUT',
    )).toBe(true)
  })
})

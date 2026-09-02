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

  it('uses AwardTool only where we have mapped aggregator coverage', () => {
    expect(hotelAwardProgramme('marriott-bonvoy')).toMatchObject({
      discoveryMode: 'AGGREGATOR_CACHED',
      discoveryProviders: ['awardtool'],
    })
    expect(hotelAwardProgramme('world-of-hyatt')?.discoveryProviders).toContain('awardtool')
  })

  it('does not hide Accor or Taj merely because the current aggregator lacks coverage', () => {
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

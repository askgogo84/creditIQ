import { describe, expect, it } from 'vitest'
import { AwardToolHotelProvider, normalizeAwardToolHotel, programmeIdForAwardToolBrand } from './awardtool'

describe('AwardTool hotel provider', () => {
  it('maps only known loyalty brands to CreditIQ programme ids', () => {
    expect(programmeIdForAwardToolBrand('marriott')).toBe('marriott-bonvoy')
    expect(programmeIdForAwardToolBrand('Hyatt')).toBe('world-of-hyatt')
    expect(programmeIdForAwardToolBrand('unknown-chain')).toBeNull()
  })

  it('normalizes supported cached hotel metadata with provenance', () => {
    const row = normalizeAwardToolHotel({
      id: 'marriott_demo',
      hotel_id: 'M123',
      name: 'JW Marriott Demo',
      brand: 'marriott',
      sub_brand: 'JW Marriott',
      availability_num: 55.5,
      cash_min: 200,
      cash_median: 250,
      cash_max: 320,
      points_min: 40000,
      points_median: 45000,
      points_max: 52000,
      formatted_address: 'Bangkok, Thailand',
      hotel_location: { latitude: 13.7, longitude: 100.5 },
      image: 'https://example.test/hotel.jpg',
      update_date: '2026-09-01',
    }, '2026-09-02T00:00:00.000Z')

    expect(row).toMatchObject({
      providerPropertyId: 'marriott_demo',
      programmeId: 'marriott-bonvoy',
      programmeHotelId: 'M123',
      name: 'JW Marriott Demo',
      observedPointsMin: 40000,
      evidence: { provider: 'awardtool', freshness: 'CACHED' },
    })
  })

  it('drops unsupported brands rather than inventing a programme mapping', () => {
    expect(normalizeAwardToolHotel({ id: 'x', name: 'Mystery Hotel', brand: 'mystery' }, '2026-09-02T00:00:00Z')).toBeNull()
  })

  it('fails closed when no API key is configured', async () => {
    const provider = new AwardToolHotelProvider('')
    expect(provider.isConfigured()).toBe(false)
    await expect(provider.listSupportedProperties({ destination: 'Bangkok' })).resolves.toEqual([])
  })
})

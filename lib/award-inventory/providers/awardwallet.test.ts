import { describe, expect, it } from 'vitest'
import { AwardWalletHotelSearchClient, buildAwardWalletHotelSearchBody } from './awardwallet'

describe('AwardWallet hotel search POC', () => {
  it('builds a bounded credential-free search payload', () => {
    const body = buildAwardWalletHotelSearchBody({
      provider: 'marriott',
      destination: 'Bangkok, Thailand',
      checkInDate: '2026-10-15',
      checkOutDate: '2026-10-18',
      numberOfRooms: 1,
      numberOfAdults: 2,
      numberOfKids: 0,
      priority: 99,
      userData: 'search-123',
    })

    expect(body).toMatchObject({
      provider: 'marriott',
      destination: 'Bangkok, Thailand',
      priority: 9,
      downloadPreview: false,
    })
    expect(body).not.toHaveProperty('loyaltyAccount')
    expect(body).not.toHaveProperty('password')
    expect(body).not.toHaveProperty('answers')
  })

  it('fails closed without AwardWallet API credentials', async () => {
    const client = new AwardWalletHotelSearchClient('')
    expect(client.isConfigured()).toBe(false)
    await expect(client.submit({
      provider: 'marriott', destination: 'Bangkok', checkInDate: '2026-10-15',
      numberOfRooms: 1, numberOfAdults: 2, numberOfKids: 0,
    })).resolves.toBeNull()
  })

  it('rejects malformed provider ids and occupancy', () => {
    expect(() => buildAwardWalletHotelSearchBody({
      provider: '../secret', destination: 'Bangkok', checkInDate: '2026-10-15',
      numberOfRooms: 1, numberOfAdults: 2, numberOfKids: 0,
    })).toThrow('invalid AwardWallet provider id')

    expect(() => buildAwardWalletHotelSearchBody({
      provider: 'marriott', destination: 'Bangkok', checkInDate: '2026-10-15',
      numberOfRooms: 1, numberOfAdults: 9, numberOfKids: 0,
    })).toThrow('adults out of range')
  })
})

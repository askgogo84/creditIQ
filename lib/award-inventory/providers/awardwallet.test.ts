import { describe, expect, it } from 'vitest'
import {
  AwardWalletHotelSearchClient,
  buildAwardWalletHotelSearchBody,
  normalizeAwardWalletHotels,
  resolveGuestAwardWalletProvider,
} from './awardwallet'

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
    await expect(client.searchGuest('marriott-bonvoy', {
      destination: 'Bangkok', checkInDate: '2026-10-15', checkOutDate: '2026-10-18',
      numberOfRooms: 1, numberOfAdults: 2, numberOfKids: 0,
    })).resolves.toMatchObject({ status: 'PROVIDER_ERROR', rates: [] })
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

  it('uses only a provider the API reports as guest-capable', () => {
    const providers = [
      { code: 'marriott', displayName: 'Marriott Bonvoy', shortName: 'Marriott', loginRequired: false },
      { code: 'secret-hyatt', displayName: 'Hyatt', shortName: 'Hyatt', loginRequired: true },
    ]
    expect(resolveGuestAwardWalletProvider('marriott-bonvoy', providers)?.code).toBe('marriott')
    expect(resolveGuestAwardWalletProvider('world-of-hyatt', providers)).toBeNull()
  })

  it('normalises every room/rate award without inventing loyalty credentials or cash currency', () => {
    const rows = normalizeAwardWalletHotels({
      state: 'success',
      hotels: [{
        name: 'JW Marriott Singapore',
        checkInDate: '2026-10-15', checkOutDate: '2026-10-18', numberOfNights: 3,
        hotelURL: 'https://marriott.example',
        address: { text: '30 Beach Road', lat: 1.2945, lng: 103.8572 },
        rooms: [{
          type: 'Standard', name: 'King', rates: [
            { name: 'Standard Reward', pointsPerNight: 42000 },
            { name: 'Points + Cash', pointsPerNight: 30000, cashPerNight: 120, originalCurrency: 'SGD' },
          ],
        }],
      }],
    }, 'marriott-bonvoy', 'marriott', '2026-09-02T16:00:00Z')

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({ totalPoints: 126000, cashPerNightMinor: null, cashCurrency: null })
    expect(rows[1]).toMatchObject({ totalPoints: 90000, totalCashMinor: 36000, cashCurrency: 'SGD' })
  })
})

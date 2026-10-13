import { afterEach, describe, expect, it, vi } from 'vitest'
import { bookHotelbedsTestRate } from './hotelbeds-hbx'

afterEach(() => vi.unstubAllEnvs())

describe('HBX TEST booking adapter', () => {
  it('rechecks RECHECK rates, books them, and returns the supplier reference', async () => {
    vi.stubEnv('HOTELBEDS_ENV', 'test')
    const calls: Array<{ url: string; body: any; timeout?: number }> = []
    const transport = vi.fn(async (url: string, body: unknown, timeout?: number) => {
      calls.push({ url, body, timeout })
      if (url.endsWith('/checkrates')) {
        return {
          status: 200,
          headers: {},
          data: { hotels: { hotels: [{ rooms: [{ rates: [{
            rateKey: 'checked-rate-key',
            rateType: 'BOOKABLE',
            net: '101.25',
            currency: 'EUR',
          }] }] }] } },
        }
      }
      return {
        status: 200,
        headers: {},
        data: { booking: {
          reference: '123-456789',
          status: 'CONFIRMED',
          totalNet: '101.25',
          currency: 'EUR',
        } },
      }
    })

    const result = await bookHotelbedsTestRate({
      rateKey: 'original-rate-key',
      rateType: 'RECHECK',
      holder: { firstName: 'Booking', lastName: 'Test' },
      adults: 2,
      clientReference: 'CIQ-HOTEL-1',
    }, transport)

    expect(result).toMatchObject({
      provider: 'hotelbeds-hbx',
      testMode: true,
      bookingReference: '123-456789',
      status: 'CONFIRMED',
      rateKey: 'checked-rate-key',
    })
    expect(calls.map(call => call.url.endsWith('/checkrates') ? 'check' : 'book')).toEqual(['check', 'book'])
    expect(calls[1].timeout).toBeGreaterThanOrEqual(60_000)
    expect(calls[1].body.rooms[0].rateKey).toBe('checked-rate-key')
  })

  it('skips CheckRate for BOOKABLE rates', async () => {
    vi.stubEnv('HOTELBEDS_ENV', 'test')
    const transport = vi.fn(async (_url: string, _body: unknown, timeout?: number) => ({
      status: 200,
      headers: {},
      data: { booking: { reference: '321-654987', status: 'CONFIRMED', totalNet: '88.00', currency: 'EUR' } },
    }))

    const result = await bookHotelbedsTestRate({
      rateKey: 'bookable-rate',
      rateType: 'BOOKABLE',
      holder: { firstName: 'Booking', lastName: 'Test' },
      clientReference: 'CIQ-HOTEL-2',
    }, transport)

    expect(result.bookingReference).toBe('321-654987')
    expect(transport).toHaveBeenCalledTimes(1)
    expect(transport.mock.calls[0][2]).toBeGreaterThanOrEqual(60_000)
  })

  it('refuses to create a booking in production', async () => {
    vi.stubEnv('HOTELBEDS_ENV', 'production')
    await expect(bookHotelbedsTestRate({
      rateKey: 'bookable-rate',
      rateType: 'BOOKABLE',
      holder: { firstName: 'Booking', lastName: 'Test' },
      clientReference: 'CIQ-HOTEL-3',
    }, vi.fn())).rejects.toThrow(/refuses production/)
  })
})

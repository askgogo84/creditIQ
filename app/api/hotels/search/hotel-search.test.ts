/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const bookingConfigured = vi.hoisted(() => vi.fn())
const skyscannerConfigured = vi.hoisted(() => vi.fn())
const hbxConfigured = vi.hoisted(() => vi.fn())
const hbxSearch = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api-auth', () => ({
  requireAuth: vi.fn(async () => ({ ok: true, userId: 'user-A' })),
}))

vi.mock('@/lib/hotels/providers/booking-demand', () => ({
  bookingDemandBaseUrl: vi.fn(() => 'https://demandapi.booking.com/3.2'),
  bookingDemandConfigured: bookingConfigured,
  searchBookingDemandHotels: vi.fn(),
}))

vi.mock('@/lib/hotels/providers/skyscanner-live', () => ({
  createHotelSearch: vi.fn(),
  pollHotelSearch: vi.fn(),
  skyscannerHotelsConfigured: skyscannerConfigured,
}))

vi.mock('@/lib/hotels/providers/hotelbeds-hbx', () => ({
  hotelbedsConfigured: hbxConfigured,
  hotelbedsConfigurationState: vi.fn(() => ({ apiKey: true, secret: true, clientCert: true, clientKey: true })),
  searchHotelbedsHotels: hbxSearch,
}))

function request(body: unknown) {
  return new Request('http://localhost/api/hotels/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test' },
    body: JSON.stringify(body),
  }) as any
}

beforeEach(() => {
  bookingConfigured.mockReset().mockReturnValue(false)
  skyscannerConfigured.mockReset().mockReturnValue(false)
  hbxConfigured.mockReset().mockReturnValue(true)
  hbxSearch.mockReset()
})

describe('hotel search provider truthfulness', () => {
  it('never returns HBX evaluation/test inventory to customers', async () => {
    hbxSearch.mockResolvedValue({
      environment: 'test',
      offers: [{ id: 'fake-eval', hotelName: 'Evaluation Hotel', currency: 'EUR', totalPrice: 99 }],
      destinationCode: 'TST',
      total: 1,
      requestId: 'req-test',
    })

    const { POST } = await import('./route')
    const res = await POST(request({
      destination: 'Goa',
      checkin: '2026-10-14',
      checkout: '2026-10-17',
      adults: 2,
      rooms: 1,
    }))

    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.offers).toEqual([])
    expect(body.hotels).toEqual([])
    expect(body.attempts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        provider: 'hotelbeds-hbx',
        ok: false,
        loaded: 0,
        note: expect.stringContaining('evaluation/test inventory is intentionally hidden'),
      }),
    ]))
  })

  it('returns HBX inventory only when the provider reports production', async () => {
    hbxSearch.mockResolvedValue({
      environment: 'production',
      offers: [{ id: 'prod-1', hotelName: 'Goa Production Hotel', currency: 'INR', totalPrice: 12000 }],
      destinationCode: 'GOI',
      total: 1,
      requestId: 'req-prod',
    })

    const { POST } = await import('./route')
    const res = await POST(request({
      destination: 'Goa',
      checkin: '2026-10-14',
      checkout: '2026-10-17',
      adults: 2,
      rooms: 1,
    }))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.coverage).toMatchObject({
      provider: 'hotelbeds-hbx',
      status: 'LIVE_PROVIDER_RETURNED',
    })
    expect(body.offers).toHaveLength(1)
    expect(body.offers[0].hotelName).toBe('Goa Production Hotel')
  })
})

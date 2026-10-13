import { afterEach, describe, expect, it, vi } from 'vitest'
import { bookDuffelTestFlight } from './duffel-test'

afterEach(() => vi.unstubAllEnvs())

describe('Duffel TEST booking adapter', () => {
  it('creates an instant paid TEST order and returns the supplier booking reference', async () => {
    vi.stubEnv('DUFFEL_TEST_TOKEN', 'duffel_test_fake')
    const calls: Array<{ url: string; body: any }> = []
    const transport = vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)) })
      if (url.includes('offer_requests')) {
        return {
          status: 201,
          data: { data: {
            id: 'orq_test',
            passengers: [{ id: 'pas_test' }],
            offers: [{
              id: 'off_test',
              expires_at: '2099-01-01T00:00:00Z',
              total_amount: '125.50',
              total_currency: 'GBP',
              owner: { name: 'Duffel Airways', iata_code: 'ZZ' },
            }],
          } },
        }
      }
      return {
        status: 201,
        data: { data: {
          id: 'ord_test',
          booking_reference: 'ABC123',
          total_amount: '125.50',
          total_currency: 'GBP',
          owner: { name: 'Duffel Airways' },
        } },
      }
    })

    const result = await bookDuffelTestFlight({
      from: 'LHR', to: 'DXB', date: '2098-12-20',
      cabin: 'economy', adults: 1, clientReference: 'ciq-case-1',
    }, transport)

    expect(result).toMatchObject({
      provider: 'duffel', testMode: true, orderId: 'ord_test',
      bookingReference: 'ABC123', totalAmount: '125.50', totalCurrency: 'GBP',
      paymentType: 'balance',
    })
    expect(calls[1].body.data).toMatchObject({
      type: 'instant',
      selected_offers: ['off_test'],
      payments: [{ type: 'balance', currency: 'GBP', amount: '125.50' }],
    })
    expect(JSON.stringify(calls[1].body)).not.toContain('duffel_test_fake')
  })

  it('surfaces supplier order failures without inventing a booking reference', async () => {
    vi.stubEnv('DUFFEL_TEST_TOKEN', 'duffel_test_fake')
    const transport = vi.fn()
      .mockResolvedValueOnce({
        status: 201,
        data: { data: {
          id: 'orq_test',
          passengers: [{ id: 'pas_test' }],
          offers: [{ id: 'off_test', expires_at: '2099-01-01T00:00:00Z', total_amount: '10.00', total_currency: 'GBP' }],
        } },
      })
      .mockResolvedValueOnce({ status: 422, data: { errors: [{ message: 'order creation failed' }] } })

    await expect(bookDuffelTestFlight({
      from: 'LHR', to: 'LGW', date: '2098-12-20', clientReference: 'ciq-case-2',
    }, transport)).rejects.toThrow(/order creation failed/)
  })
})

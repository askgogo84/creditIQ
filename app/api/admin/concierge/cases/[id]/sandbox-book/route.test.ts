import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const providers = vi.hoisted(() => ({
  duffel: vi.fn(),
  hbx: vi.fn(),
}))

const state = vi.hoisted(() => ({
  status: 'TRANSFER_APPROVED',
  sourceType: 'FLIGHT' as 'FLIGHT' | 'HOTEL',
  selection: { from: 'BLR', to: 'SIN', award_date: '2026-11-10', booking_link: 'https://example.invalid/book' } as Record<string, unknown>,
  rpcActions: [] as string[],
}))

vi.mock('@/lib/admin-auth', () => ({ requireAdmin: vi.fn(async () => null) }))
vi.mock('@/lib/flights/providers/duffel-test', () => ({ bookDuffelTestFlight: providers.duffel }))
vi.mock('@/lib/hotels/providers/hotelbeds-hbx', () => ({ bookHotelbedsTestRate: providers.hbx }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: {
              id: '11111111-1111-4111-8111-111111111111',
              status: state.status,
              source_type: state.sourceType,
              selection: state.selection,
              redemption_snapshot: {},
              source_snapshot: {},
              snapshot_trust: 'SERVER_VERIFIED',
              verified_redemption_snapshot: { booking_url: 'https://example.invalid/book', provider: 'synthetic' },
              expected_cash_minor: 418000,
              currency: 'INR',
              booking_reference: null,
              reconciliation: null,
            },
            error: null,
          }),
        }),
      }),
    }),
    rpc: (_name: string, args: any) => ({
      single: async () => {
        state.rpcActions.push(args.p_action)
        if (args.p_action === 'START_BOOKING') state.status = 'BOOKING_IN_PROGRESS'
        if (args.p_action === 'MARK_BOOKED') state.status = 'BOOKED'
        if (args.p_action === 'RECONCILE') state.status = 'RECONCILED'
        if (args.p_action === 'FAIL') state.status = 'FAILED'
        return {
          data: {
            id: args.p_case_id,
            status: state.status,
            booking_reference: args.p_booking_reference,
            reconciliation: args.p_reconciliation,
          },
          error: null,
        }
      },
    }),
  }),
}))

import { GET, POST } from './route'

const request = (body?: unknown) => new NextRequest(
  'https://test.invalid/api/admin/concierge/cases/11111111-1111-4111-8111-111111111111/sandbox-book',
  body === undefined ? undefined : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  },
)
const params = { params: { id: '11111111-1111-4111-8111-111111111111' } }

beforeEach(() => {
  state.status = 'TRANSFER_APPROVED'
  state.sourceType = 'FLIGHT'
  state.selection = { from: 'BLR', to: 'SIN', award_date: '2026-11-10', booking_link: 'https://example.invalid/book' }
  state.rpcActions.length = 0
  providers.duffel.mockReset()
  providers.hbx.mockReset()
  providers.duffel.mockResolvedValue({
    provider: 'duffel', testMode: true, offerRequestId: 'orq_test', offerId: 'off_test',
    orderId: 'ord_test', bookingReference: 'DUFFEL1', totalAmount: '100.00',
    totalCurrency: 'GBP', owner: 'Duffel Airways', paymentType: 'balance',
  })
  providers.hbx.mockResolvedValue({
    provider: 'hotelbeds-hbx', testMode: true, bookingReference: '123-456789',
    status: 'CONFIRMED', rateKey: 'rate-key', rateType: 'BOOKABLE',
    totalNet: 88, currency: 'EUR',
  })
  vi.stubEnv('VERCEL_ENV', 'preview')
})
afterEach(() => vi.unstubAllEnvs())

describe('admin transaction sandbox route', () => {
  it('runs approved flight booking through start, booked and reconciliation states', async () => {
    const response = await POST(request({
      holder: { firstName: 'Test', lastName: 'Traveller' },
      participantCount: 1,
      simulation: 'SUCCESS',
    }), params)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(state.rpcActions).toEqual(['START_BOOKING', 'MARK_BOOKED', 'RECONCILE'])
    expect(json.case.status).toBe('RECONCILED')
    expect(json.sandbox.bookingReference).toMatch(/^CIQ-FLT-/)
    expect(json.sandbox.reconciliation.personal_data_persisted).toBe(false)
  })

  it('runs an approved hotel reservation through the same lifecycle', async () => {
    state.sourceType = 'HOTEL'
    state.selection = { hotel_name: 'Synthetic Hotel', city: 'Bangkok', nights: 2, booking_url: 'https://example.invalid/hotel' }
    const response = await POST(request({
      holder: { firstName: 'Test', lastName: 'Guest' },
      participantCount: 2,
      simulation: 'SUCCESS',
    }), params)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(state.rpcActions).toEqual(['START_BOOKING', 'MARK_BOOKED', 'RECONCILE'])
    expect(json.case.status).toBe('RECONCILED')
    expect(json.sandbox.bookingReference).toMatch(/^CIQ-HTL-/)
  })

  it('uses a real Duffel TEST reference through the same booking lifecycle', async () => {
    const response = await POST(request({
      holder: { firstName: 'Test', lastName: 'Traveller' },
      participantCount: 1,
      supplier: 'DUFFEL_TEST',
      simulation: 'SUCCESS',
    }), params)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(providers.duffel).toHaveBeenCalledWith(expect.objectContaining({
      from: 'BLR', to: 'SIN', date: '2026-11-10', adults: 1,
    }))
    expect(state.rpcActions).toEqual(['START_BOOKING', 'MARK_BOOKED', 'RECONCILE'])
    expect(json.sandbox.bookingReference).toBe('DUFFEL1')
    expect(json.sandbox.supplierEvidence).toMatchObject({
      mode: 'SUPPLIER_TEST', supplier_order_id: 'ord_test', booking_reference: 'DUFFEL1',
    })
  })

  it('uses an HBX TEST reservation reference through the same hotel lifecycle', async () => {
    state.sourceType = 'HOTEL'
    state.selection = { hotel_name: 'Synthetic Hotel', city: 'Bangkok', nights: 2, booking_url: 'https://example.invalid/hotel' }
    const response = await POST(request({
      holder: { firstName: 'Booking', lastName: 'Test' },
      participantCount: 2,
      supplier: 'HBX_TEST',
      hbxRateKey: 'rate-key',
      hbxRateType: 'BOOKABLE',
      simulation: 'SUCCESS',
    }), params)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(providers.hbx).toHaveBeenCalledWith(expect.objectContaining({
      rateKey: 'rate-key', rateType: 'BOOKABLE', adults: 2,
    }))
    expect(state.rpcActions).toEqual(['START_BOOKING', 'MARK_BOOKED', 'RECONCILE'])
    expect(json.sandbox.bookingReference).toBe('123-456789')
    expect(json.sandbox.supplierEvidence).toMatchObject({
      mode: 'SUPPLIER_TEST', booking_reference: '123-456789', supplier_status: 'CONFIRMED',
    })
  })

  it('fails the case when a supplier TEST booking fails and does not claim retry safety', async () => {
    providers.duffel.mockRejectedValueOnce(new Error('supplier rejected order'))
    const response = await POST(request({
      holder: { firstName: 'Test', lastName: 'Traveller' },
      supplier: 'DUFFEL_TEST',
      simulation: 'SUCCESS',
    }), params)
    expect(response.status).toBe(409)
    const json = await response.json()
    expect(state.rpcActions).toEqual(['START_BOOKING', 'FAIL'])
    expect(json.case.status).toBe('FAILED')
    expect(json.retrySafe).toBe(false)
  })

  it('records a simulated payment failure through the normal failed state', async () => {
    const response = await POST(request({
      holder: { firstName: 'Test', lastName: 'Traveller' },
      simulation: 'PAYMENT_DECLINED',
    }), params)
    expect(response.status).toBe(200)
    const json = await response.json()
    expect(state.rpcActions).toEqual(['START_BOOKING', 'FAIL'])
    expect(json.case.status).toBe('FAILED')
    expect(json.sandbox.bookingReference).toBeNull()
  })

  it('reports preview eligibility without mutating the case', async () => {
    const response = await GET(request(), params)
    expect(await response.json()).toMatchObject({ enabled: true, eligible: true, status: 'TRANSFER_APPROVED' })
    expect(state.rpcActions).toHaveLength(0)
  })

  it('is disabled in production unless explicitly enabled', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('CREDITIQ_BOOKING_SANDBOX', '')
    const response = await POST(request({ holder: { firstName: 'Test', lastName: 'Traveller' } }), params)
    expect(response.status).toBe(404)
    expect(state.rpcActions).toHaveLength(0)
  })
})

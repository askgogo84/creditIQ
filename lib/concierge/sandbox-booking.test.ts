import { afterEach, describe, expect, it, vi } from 'vitest'
import { bookingSandboxEnabled, buildSandboxBooking } from './sandbox-booking'

afterEach(() => vi.unstubAllEnvs())

describe('transaction sandbox', () => {
  it('creates a deterministic flight booking reference without persisting holder names', () => {
    const input = {
      caseId: '11111111-1111-4111-8111-111111111111',
      sourceType: 'FLIGHT' as const,
      selection: { from: 'BLR', to: 'SIN', departs_at: '2026-11-10T03:00:00Z' },
      verifiedRedemptionSnapshot: { provider: 'synthetic-flight-provider' },
      expectedCashMinor: 418000,
      currency: 'INR',
      holder: { firstName: 'Test', lastName: 'Traveller' },
      participantCount: 2,
    }
    const a = buildSandboxBooking(input)
    const b = buildSandboxBooking(input)
    expect(a.bookingReference).toBe(b.bookingReference)
    expect(a.bookingReference).toMatch(/^CIQ-FLT-[A-F0-9]{10}$/)
    expect(a.reconciliation).toMatchObject({
      mode: 'SANDBOX',
      final_cash_minor: 418000,
      currency: 'INR',
      participant_count: 2,
      personal_data_persisted: false,
    })
    expect(JSON.stringify(a.reconciliation)).not.toContain('Traveller')
  })

  it('accepts an exact dated live hotel selection', () => {
    const result = buildSandboxBooking({
      caseId: '33333333-3333-4333-8333-333333333333',
      sourceType: 'HOTEL',
      selection: {
        hotel_name: 'Live Hotel',
        destination: 'Bangkok',
        checkin: '2026-11-10',
        checkout: '2026-11-12',
      },
      verifiedRedemptionSnapshot: { provider: 'booking-demand' },
      expectedCashMinor: 10125,
      currency: 'EUR',
      holder: { firstName: 'Test', lastName: 'Guest' },
      participantCount: 2,
    })
    expect(result.bookingReference).toMatch(/^CIQ-HTL-/)
    expect(result.currency).toBe('EUR')
  })

  it('creates a deterministic hotel reservation reference', () => {
    const result = buildSandboxBooking({
      caseId: '22222222-2222-4222-8222-222222222222',
      sourceType: 'HOTEL',
      selection: { hotel_name: 'Synthetic Hotel', city: 'Bangkok', nights: 2 },
      verifiedRedemptionSnapshot: { provider: 'synthetic-hotel-provider' },
      expectedCashMinor: 346200,
      currency: 'INR',
      holder: { firstName: 'Test', lastName: 'Guest' },
    })
    expect(result.bookingReference).toMatch(/^CIQ-HTL-[A-F0-9]{10}$/)
    expect(result.provider).toBe('creditiq-transaction-sandbox')
  })

  it('refuses an unverified or unpriced booking', () => {
    expect(() => buildSandboxBooking({
      caseId: 'x', sourceType: 'FLIGHT',
      selection: { from: 'BLR', to: 'DEL', award_date: '2026-11-10' },
      verifiedRedemptionSnapshot: null, expectedCashMinor: 100,
      currency: 'INR', holder: { firstName: 'Test', lastName: 'Traveller' },
    })).toThrow(/server-verified/)
    expect(() => buildSandboxBooking({
      caseId: 'x', sourceType: 'HOTEL',
      selection: { hotel_name: 'Test', city: 'Goa', nights: 1 },
      verifiedRedemptionSnapshot: {}, expectedCashMinor: null,
      currency: 'INR', holder: { firstName: 'Test', lastName: 'Guest' },
    })).toThrow(/final cash amount/)
  })

  it('is enabled in tests and previews but not production by default', () => {
    expect(bookingSandboxEnabled({ NODE_ENV: 'test' } as NodeJS.ProcessEnv)).toBe(true)
    expect(bookingSandboxEnabled({ VERCEL_ENV: 'preview' } as unknown as NodeJS.ProcessEnv)).toBe(true)
    expect(bookingSandboxEnabled({ VERCEL_ENV: 'production' } as unknown as NodeJS.ProcessEnv)).toBe(false)
  })
})

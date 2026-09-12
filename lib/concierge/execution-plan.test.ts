import { describe, expect, it } from 'vitest'
import { buildBookingExecutionPlan } from './execution-plan'

const base = {
  source_type: 'FLIGHT' as const,
  selection: {},
  redemption_snapshot: {},
  source_snapshot: {},
  snapshot_trust: 'SERVER_VERIFIED',
  verified_redemption_snapshot: { verified: true },
}

describe('concierge booking execution plan', () => {
  it('blocks execution until the exact selection has been server re-verified', () => {
    const plan = buildBookingExecutionPlan({ ...base, snapshot_trust: 'CLIENT_REQUEST', verified_redemption_snapshot: null })
    expect(plan.mode).toBe('BLOCKED_NEEDS_REVERIFICATION')
    expect(plan.canStartBooking).toBe(false)
    expect(plan.blockedReasons.join(' ')).toMatch(/re-verify/i)
  })

  it('builds an assisted loyalty-transfer path with a second award check after transfer', () => {
    const plan = buildBookingExecutionPlan({
      ...base,
      redemption_snapshot: {
        travel_decision: {
          requires_live_reverification: false,
          recommended_candidate: { rail_type: 'LOYALTY_TRANSFER' },
        },
      },
    })
    expect(plan.mode).toBe('POINTS_ASSISTED')
    expect(plan.requiresPointsTransfer).toBe(true)
    expect(plan.steps.join(' ')).toMatch(/re-check the award/i)
    expect(plan.steps.join(' ')).toMatch(/PNR\/reservation reference/i)
  })

  it('uses the selected provider deeplink for a verified cash booking', () => {
    const plan = buildBookingExecutionPlan({
      ...base,
      selection: { booking_link: 'https://provider.example/book/abc', provider: 'kiwi-mcp' },
    })
    expect(plan.mode).toBe('CASH_PROVIDER_DEEPLINK')
    expect(plan.bookingUrl).toBe('https://provider.example/book/abc')
    expect(plan.canStartBooking).toBe(true)
  })

  it('keeps issuer portal redemption distinct from loyalty transfer', () => {
    const plan = buildBookingExecutionPlan({
      ...base,
      redemption_snapshot: {
        travel_decision: {
          requires_live_reverification: false,
          recommended_candidate: { rail_type: 'PORTAL' },
        },
      },
    })
    expect(plan.mode).toBe('PORTAL_ASSISTED')
    expect(plan.requiresPointsTransfer).toBe(false)
  })

  it('does not pretend a search-only supplier can issue a booking', () => {
    const plan = buildBookingExecutionPlan({
      ...base,
      selection: { provider: 'amadeus' },
    })
    expect(plan.mode).toBe('CASH_API_BOOKING')
    expect(plan.canStartBooking).toBe(false)
    expect(plan.blockedReasons.join(' ')).toMatch(/no executable provider deeplink/i)
    expect(plan.blockedReasons.join(' ')).toMatch(/no booking-order adapter/i)
  })
})
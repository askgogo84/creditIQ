import { describe, expect, it } from 'vitest'
import type { RedemptionOption } from '@/lib/fusion-core'
import type { StayCard } from '@/components/ciq/stay-points/StayOnPointsView'
import { buildFlightConciergeRequest, buildHotelConciergeRequest } from './travel-requests'

const option: RedemptionOption = {
  cardName: 'SBI Elite',
  bank: 'SBI',
  status: 'ok',
  currency: 'Reward Points',
  transferPartner: 'KrisFlyer',
  cardPointsNeeded: 50000,
  yourPoints: 80000,
  canAfford: true,
  verified: false,
  selfEntered: false,
}

describe('Travel → Concierge request snapshots', () => {
  it('keeps a flight handoff card-agnostic and never injects a user id', () => {
    const request = buildFlightConciergeRequest({
      id: 'award-1',
      price: 52600,
      from: 'BLR',
      to: 'SIN',
      departure: '2026-10-15T09:25:00+05:30',
      arrival: '2026-10-15T16:40:00+08:00',
      stops: 0,
      award: {
        program: 'KrisFlyer', source: 'singapore', cabin: 'business',
        date: '2026-10-15', mileageCost: 43000, seats: 2,
        trip: { totalTaxes: 418000, taxesCurrency: 'INR', flightNumbers: 'SQ509', carriers: 'SQ' },
      },
    }, [option], option)

    expect(request.redemptionSnapshot).toMatchObject({
      recommended_card: { bank: 'SBI', card_name: 'SBI Elite' },
    })
    expect(request.expectedCashMinor).toBe(418000)
    expect(request).not.toHaveProperty('userId')
    expect(JSON.stringify(request)).not.toMatch(/cvv|otp|access_token|refresh_token/i)
  })

  it('does not convert foreign award taxes into INR inside the handoff', () => {
    const request = buildFlightConciergeRequest({
      id: 'award-2', price: 0, from: 'BLR', to: 'SIN',
      award: {
        program: 'KrisFlyer', source: 'singapore', cabin: 'business', date: '2026-10-15',
        mileageCost: 43000, seats: 2,
        trip: { totalTaxes: 5000, taxesCurrency: 'USD' },
      },
    }, [option], option)
    expect(request.expectedCashMinor).toBeNull()
    expect(request.selection).toMatchObject({ taxes_minor: 5000, taxes_currency: 'USD' })
  })

  it('carries hotel execution blockers into Concierge rather than removing them', () => {
    const card = {
      id: 'novotel', name: 'Novotel Bangkok', area: 'Sukhumvit', star_rating: 4,
      room_type: 'King', programme_name: 'Accor ALL',
      room_total_inr: 11400, taxes_inr: 892, cash_total_inr: 12292, public_room_total_inr: null,
      pricing_state: 'FIXED_VALUE', transfer_state: 'RATIO_ONLY', balance_state: 'SUFFICIENT',
      rule_state: 'UNKNOWN', recommended_path: 'TRANSFER_THEN_BOOK',
      blocked_reason: 'Programme eligible amount unknown',
      programme_points_spent: 4000, bank_points_target: 5600, bank_points_exact: null,
      bank_points_retained: 5800, existing_programme_points_consumed: 1200,
      programme_points_received: 2800, residual_programme_balance: 0, stranded_programme_points: 0,
      points_offset_inr: 8840, execution_cash_payable_inr: 3452,
      instruction_blocked: 'PROGRAMME_ELIGIBLE_AMOUNT_UNKNOWN',
      transfer_duration_hours: { min: 24, max: 24 }, transfer_irreversible: true,
      portal_points_used: 8604, portal_cash_payable_inr: 3804.82, portal_fee_inr: 116.82,
      conversion_value_per_bank_point_inr: 1.105, booking_specific_value_per_bank_point_inr: 1.578,
      conflicts: ['eligible basis unresolved'], rate_age_label: 'captured 2 days ago',
      rate_source: 'accor-capture', rate_is_live: false, booking_url: 'https://example.com',
    } satisfies StayCard

    const request = buildHotelConciergeRequest(card, {
      city: 'Bangkok', nights: 3,
      fx: { rate: 110.5, fetched_at: '2026-09-02T07:00:00Z', source: 'fx-provider' },
      portalAsOf: '2026-08-31', ratioAsOf: '2026-08-31',
    })

    expect(request.expectedCashMinor).toBe(345200)
    expect(request.redemptionSnapshot).toMatchObject({
      bank_points_exact: null,
      instruction_blocked: 'PROGRAMME_ELIGIBLE_AMOUNT_UNKNOWN',
      rule_state: 'UNKNOWN',
    })
    expect(request.sourceSnapshot).toMatchObject({ blocked_reason: 'Programme eligible amount unknown' })
  })
})

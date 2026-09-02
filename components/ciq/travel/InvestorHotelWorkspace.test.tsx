import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import InvestorHotelWorkspace from './InvestorHotelWorkspace'
import type { StayCard } from '@/components/ciq/stay-points/StayOnPointsView'

const card: StayCard = {
  id: 'hotel-1',
  name: 'Novotel Demo',
  area: 'Bangkok',
  star_rating: 4,
  room_type: 'King',
  programme_name: 'ALL',
  room_total_inr: 11_400,
  taxes_inr: 892,
  cash_total_inr: 12_292,
  public_room_total_inr: null,
  pricing_state: 'FIXED_VALUE',
  transfer_state: 'RATIO_ONLY',
  balance_state: 'SUFFICIENT',
  rule_state: 'UNKNOWN',
  recommended_path: 'TRANSFER_THEN_BOOK',
  blocked_reason: 'Exact issuer transfer instruction is blocked until minimum/increment and eligible booking basis are verified.',
  programme_points_spent: 4_000,
  bank_points_target: 5_600,
  bank_points_exact: null,
  bank_points_retained: 5_800,
  existing_programme_points_consumed: 1_200,
  programme_points_received: 2_800,
  residual_programme_balance: 0,
  stranded_programme_points: 0,
  points_offset_inr: 8_840,
  execution_cash_payable_inr: 3_452,
  instruction_blocked: 'TRANSFER_INCREMENT_UNVERIFIED',
  transfer_duration_hours: { min: 24, max: 24 },
  transfer_irreversible: true,
  portal_points_used: 8_604,
  portal_cash_payable_inr: 3_804.82,
  portal_fee_inr: 116.82,
  conversion_value_per_bank_point_inr: 1.105,
  booking_specific_value_per_bank_point_inr: 1.578,
  conflicts: ['Programme eligible amount is not yet verified'],
  rate_age_label: 'captured 2 days ago',
  rate_source: 'accor-capture',
  rate_is_live: false,
  booking_url: 'https://example.com/hotel',
}

function renderView() {
  return render(
    <InvestorHotelWorkspace
      city="Bangkok"
      mode="city"
      nights={3}
      balance={11_400}
      cards={[card]}
      fx={{ rate: 110.5, fetched_at: '2026-09-02T00:00:00Z', source: 'live-fx' }}
      programmeConversionValueInr={1.105}
      portalPerPoint={1}
      portalCapPct={70}
      portalFeeInr={116.82}
      portalSource="smartbuy"
      portalAsOf="2026-08-31"
      ratioSource="issuer"
      ratioAsOf="2026-08-31"
      programmeCount={4}
    />,
  )
}

describe('InvestorHotelWorkspace', () => {
  it('keeps an unverified transfer ranked but explicitly non-executable', () => {
    renderView()
    expect(screen.getByText(/exact issuer step withheld/i)).toBeInTheDocument()
    expect(screen.getByText(/ranked · not yet executable/i)).toBeInTheDocument()
    expect(screen.queryByText(/Transfer exactly 5,600/i)).not.toBeInTheDocument()
  })

  it('shows cash, portal and programme paths without hiding the unresolved facts', () => {
    renderView()
    expect(screen.getByText('PROGRAMME')).toBeInTheDocument()
    expect(screen.getByText('PORTAL')).toBeInTheDocument()
    expect(screen.getByText('CASH')).toBeInTheDocument()
    expect(screen.getByText(/Why CreditIQ is cautious/i)).toBeInTheDocument()
  })

  it('does not pretend the current hotel engine already compares every bank', () => {
    renderView()
    expect(screen.getByText(/current engine has sourced HDFC→Accor logic/i)).toBeInTheDocument()
  })
})

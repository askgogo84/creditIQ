import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import InvestorHotelWorkspace from './InvestorHotelWorkspace'
import type { StayCard } from '@/components/ciq/stay-points/StayOnPointsView'
import { SeededRateProvider } from '@/lib/hotels/providers/rates'

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

function renderView(selectedCard: StayCard = card) {
  return render(
    <InvestorHotelWorkspace
      city="Bangkok"
      mode="city"
      nights={3}
      balance={11_400}
      cards={[selectedCard]}
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
  // Independently checked against official Accor property pages on 2026-10-05.
  // See docs/qa/redemption-verification-2026-10-05.md for sources and scope.
  it.each([
    ['sofitel-bangkok-sukhumvit', '5213'],
    ['so-bangkok', '6835'],
    ['vie-hotel-bangkok-mgallery', '6469'],
    ['movenpick-bdms-wellness-bangkok', 'B4U9'],
    ['novotel-bangkok-siam-square', '1031'],
    ['mercure-bangkok-siam', '8015'],
    ['movenpick-sukhumvit-15-bangkok', 'B4K2'],
    ['novotel-bangkok-platinum', '7272'],
    ['grand-mercure-bangkok-asoke', '6162'],
    ['pullman-bangkok-king-power', '6323'],
    ['mercure-bangkok-sukhumvit-11', 'A247'],
    ['pullman-bangkok-hotel-g', '3616'],
    ['novotel-bangkok-sukhumvit-4', 'A246'],
    ['ibis-bangkok-siam', '8016'],
    ['mercure-bangkok-makkasan', '8422'],
    ['mercure-bangkok-surawong', 'C0Q6'],
    ['ibis-styles-bangkok-silom', 'B6N1'],
    ['ibis-styles-bangkok-sukhumvit-4', 'A237'],
    ['ibis-bangkok-sathorn', '6537'],
    ['ibis-bangkok-sukhumvit-4', '7295'],
  ])('hands %s off to its verified Accor property', async (hotelId, accorId) => {
    const [rate] = await new SeededRateProvider().search({ hotel_id: hotelId, nights: 3 })
    expect(rate.hotel.city).toBe('Bangkok')
    expect(rate.hotel.country).toBe('Thailand')
    renderView({ ...card, id: rate.hotel.id, name: rate.hotel.name, booking_url: rate.hotel.booking_url })
    expect(screen.getByRole('link', { name: /check direct/i })).toHaveAttribute(
      'href', `https://all.accor.com/hotel/${accorId}/index.en.shtml`,
    )
  })

  it('keeps an unverified transfer ranked but explicitly non-executable', () => {
    renderView()
    // The same guarded wording intentionally appears in the compact result row,
    // selected-path heading, and execution step. Target the decision-panel heading
    // so this assertion protects the user-visible state without requiring uniqueness
    // across the whole page.
    expect(screen.getByRole('heading', { name: /exact issuer step withheld/i })).toBeInTheDocument()
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
  it('requires current checkout verification for captured-rate comparisons', () => {
    renderView()
    expect(screen.getByText(/Captured rate only. Confirm the current price/)).toBeInTheDocument()
    expect(screen.getByText(/Checkout verification required/)).toBeInTheDocument()
    expect(screen.queryByText(/\d+ executable/)).not.toBeInTheDocument()
  })
})

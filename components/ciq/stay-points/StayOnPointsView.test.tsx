import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import StayOnPointsView, { type StayCard } from './StayOnPointsView';
import type { ComponentProps } from 'react';

const CARD: StayCard = {
  id: 'novotel-test',
  name: 'Novotel Test Bangkok',
  area: 'Siam',
  star_rating: 4,
  room_type: 'Starting-from room',
  programme_name: 'Accor',
  room_total_inr: 40_000,
  taxes_inr: 7_000,
  cash_total_inr: 47_000,
  public_room_total_inr: 42_000,
  pricing_state: 'FIXED_VALUE',
  transfer_state: 'RATIO_ONLY',
  balance_state: 'SUFFICIENT',
  rule_state: 'UNKNOWN',
  recommended_path: 'TRANSFER_THEN_BOOK',
  blocked_reason: null,
  programme_points_spent: 4_000,
  bank_points_target: 8_000,
  bank_points_exact: null,
  bank_points_retained: 3_400,
  existing_programme_points_consumed: 0,
  programme_points_received: 4_000,
  residual_programme_balance: 0,
  stranded_programme_points: 0,
  points_offset_inr: 8_840,
  execution_cash_payable_inr: 38_160,
  instruction_blocked: 'PROGRAMME_ELIGIBLE_AMOUNT_UNKNOWN',
  transfer_duration_hours: { min: 24, max: 24 },
  transfer_irreversible: true,
  portal_points_used: 11_400,
  portal_cash_payable_inr: 35_716.82,
  portal_fee_inr: 116.82,
  conversion_value_per_bank_point_inr: 1.105,
  booking_specific_value_per_bank_point_inr: 1.105,
  conflicts: [
    'Planned conservative intersection (min 2000, increment 2000); disputed: 1000.',
    'Programme eligibility unknown; evaluated across supplied lower/upper bounds.',
  ],
  rate_age_label: 'captured yesterday',
  rate_source: 'all.accor.com capture',
  rate_is_live: false,
  booking_url: 'https://all.accor.com/',
};

const BASE: ComponentProps<typeof StayOnPointsView> = {
  city: 'Bangkok',
  mode: 'city',
  nights: 3,
  balance: 11_400,
  cards: [CARD],
  fx: { rate: 110.5, fetched_at: '2026-09-01T00:00:00Z', source: 'frankfurter.app (ECB)' },
  programmeConversionValueInr: 1.105,
  portalPerPoint: 1,
  portalCapPct: 70,
  portalFeeInr: 116.82,
  portalSource: 'https://offers.smartbuy.hdfcbank.com/',
  portalAsOf: '2026-08-31',
  ratioSource: 'https://offers.reward360.in/infinia/miles_transfer/partners',
  ratioAsOf: '2026-08-31',
  programmeCount: 5,
};

function normalizedText(node: HTMLElement): string {
  return (node.textContent ?? '').replace(/\s+/g, ' ').trim();
}

describe('StayOnPointsView — executable-path honesty', () => {
  it('never says transfer exactly when issuer min/increment is not verified', () => {
    render(<StayOnPointsView {...BASE} />);
    expect(screen.getByText(/Do not transfer yet — exact issuer step is withheld/i)).toBeInTheDocument();
    expect(screen.getByText(/8,000 HDFC Reward Points/i)).toBeInTheDocument();
    expect(screen.queryByText(/Transfer exactly 8,000/i)).not.toBeInTheDocument();
    expect(screen.getByText(/HDFC transfer minimum\/increment is not yet sourced/i)).toBeInTheDocument();
  });

  it('keeps point currencies explicit and carries the irreversible 24-hour warning', () => {
    const { container } = render(<StayOnPointsView {...BASE} />);
    const text = normalizedText(container);

    // The target sentence intentionally contains nested <b> spans for the two
    // point currencies. Assert on the rendered textContent so the test protects
    // the user-visible wording without depending on element boundaries.
    expect(text).toMatch(/Target 4,000 Accor points/i);
    expect(text).toMatch(/at least 8,000 HDFC Reward Points/i);
    expect(text).toMatch(/within 24 hours/i);
    expect(text).toMatch(/transfer is irreversible/i);
  });

  it('does not invent a personal path when the balance is missing', () => {
    render(<StayOnPointsView {...BASE} balance={null} cards={[{ ...CARD, recommended_path: 'NO_RECOMMENDATION' }]} />);
    expect(screen.getByText(/Add your balance to unlock this path/i)).toBeInTheDocument();
    expect(screen.getByText(/will not invent a balance/i)).toBeInTheDocument();
    expect(screen.queryByText(/Transfer exactly/i)).not.toBeInTheDocument();
  });
});

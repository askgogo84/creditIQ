import type { RedemptionOption } from '@/lib/fusion-core'
import type { StayCard } from '@/components/ciq/stay-points/StayOnPointsView'
import type { ConciergeRequest } from './ConciergeRequestButton'

// These builders intentionally carry only decision context needed by Concierge.
// They do NOT include auth/session material, full card numbers, or user ids. The
// receiving API validates the snapshot again and stores it as CLIENT_REQUEST.

export function buildFlightConciergeRequest(
  row: any,
  rankedOptions: RedemptionOption[],
  best: RedemptionOption | null,
): ConciergeRequest {
  const award = row.award
  const trip = award?.trip ?? null
  const expectedCashMinor =
    trip && trip.taxesCurrency === 'INR' && Number.isSafeInteger(trip.totalTaxes) && trip.totalTaxes >= 0
      ? trip.totalTaxes
      : null

  return {
    context: 'HNI',
    sourceType: 'FLIGHT',
    sourceRef: String(row.id),
    title: `${row.from} → ${row.to} · ${award?.program || 'award flight'}${award?.cabin ? ` · ${award.cabin}` : ''}`,
    selection: {
      from: row.from,
      to: row.to,
      award_date: award?.date ?? null,
      cabin: award?.cabin ?? null,
      programme: award?.program ?? null,
      award_source: award?.source ?? null,
      mileage_cost: award?.mileageCost ?? null,
      seats: award?.seats ?? null,
      flight_numbers: trip?.flightNumbers ?? null,
      carriers: trip?.carriers ?? null,
      departs_at: trip?.departsAt ?? row.departure ?? null,
      arrives_at: trip?.arrivesAt ?? row.arrival ?? null,
      stops: trip?.stops ?? row.stops ?? null,
      cash_fare_inr: row.price > 0 ? row.price : null,
      cash_fare_matched: row.price > 0,
      taxes_minor: trip?.totalTaxes ?? null,
      taxes_currency: trip?.taxesCurrency ?? null,
    },
    redemptionSnapshot: {
      recommended_card: best ? {
        bank: best.bank,
        card_name: best.cardName,
        card_points_needed: best.cardPointsNeeded ?? null,
        wallet_points: best.yourPoints ?? null,
        can_afford: best.canAfford ?? null,
        self_entered: best.selfEntered ?? false,
        verified: best.verified,
      } : null,
      compared_cards: rankedOptions.map((option) => ({
        bank: option.bank,
        card_name: option.cardName,
        status: option.status,
        card_points_needed: option.cardPointsNeeded ?? null,
        wallet_points: option.yourPoints ?? null,
        can_afford: option.canAfford ?? null,
        self_entered: option.selfEntered ?? false,
        verified: option.verified,
      })),
      instruction_state: 'NEEDS_OPERATOR_VERIFICATION',
    },
    sourceSnapshot: {
      award: {
        source: award?.source ?? null,
        state: award ? 'LIVE_OR_PROVIDER_RETURNED' : 'UNKNOWN',
      },
      cash: {
        state: row.price > 0 ? 'MATCHED' : 'UNAVAILABLE',
      },
      transfer_candidates: {
        state: 'UNVERIFIED',
        reason: 'Current flight fusion returns verified:false for transfer options.',
      },
    },
    expectedCashMinor,
    currency: 'INR',
    contactChannel: 'BOTH',
  }
}

export function buildHotelConciergeRequest(
  card: StayCard,
  context: {
    city: string
    nights: number
    fx: { rate: number; fetched_at: string; source: string } | null
    portalAsOf: string
    ratioAsOf: string
  },
): ConciergeRequest {
  const selectedCash =
    card.recommended_path === 'PORTAL' && card.portal_cash_payable_inr !== null
      ? card.portal_cash_payable_inr
      : card.execution_cash_payable_inr ?? card.cash_total_inr
  const expectedCashMinor = Number.isFinite(selectedCash)
    ? Math.round(selectedCash * 100)
    : null

  return {
    context: 'HNI',
    sourceType: 'HOTEL',
    sourceRef: card.id,
    title: `${card.name} · ${context.city} · ${context.nights} nights`,
    selection: {
      hotel_name: card.name,
      city: context.city,
      area: card.area,
      nights: context.nights,
      star_rating: card.star_rating,
      room_type: card.room_type,
      programme: card.programme_name,
      cash_total_inr: card.cash_total_inr,
      booking_url: card.booking_url,
    },
    redemptionSnapshot: {
      recommended_path: card.recommended_path,
      programme_points_spent: card.programme_points_spent,
      bank_points_target: card.bank_points_target,
      bank_points_exact: card.bank_points_exact,
      points_offset_inr: card.points_offset_inr,
      execution_cash_payable_inr: card.execution_cash_payable_inr,
      portal_points_used: card.portal_points_used,
      portal_cash_payable_inr: card.portal_cash_payable_inr,
      instruction_blocked: card.instruction_blocked,
      pricing_state: card.pricing_state,
      transfer_state: card.transfer_state,
      rule_state: card.rule_state,
      balance_state: card.balance_state,
    },
    sourceSnapshot: {
      cash_rate: {
        state: card.rate_is_live ? 'LIVE' : 'CAPTURED',
        source: card.rate_source,
        age_label: card.rate_age_label,
      },
      fx: context.fx
        ? { state: 'LIVE', rate: context.fx.rate, source: context.fx.source, fetched_at: context.fx.fetched_at }
        : { state: 'UNAVAILABLE' },
      portal_terms_as_of: context.portalAsOf,
      transfer_ratio_as_of: context.ratioAsOf,
      conflicts: card.conflicts,
      blocked_reason: card.blocked_reason,
    },
    expectedCashMinor,
    currency: 'INR',
    contactChannel: 'BOTH',
  }
}

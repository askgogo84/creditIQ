import type { RedemptionOption } from '@/lib/fusion-core'
import type { StayCard } from '@/components/ciq/stay-points/StayOnPointsView'
import type { TravelDecisionContract } from '@/lib/travel/decision-contract'
import type { ConciergeRequest } from './ConciergeRequestButton'

// These builders intentionally carry only decision context needed by Concierge.
// They do NOT include auth/session material, full card numbers, or user ids. The
// receiving API validates the snapshot again and stores it as CLIENT_REQUEST.

function conciergeDecisionSnapshot(decision: TravelDecisionContract | null | undefined) {
  if (!decision) return null
  const ranking = decision.wallet.ranking
  const recommended = decision.conciergeAction.recommendedCandidateId
    ? ranking.candidates.find((candidate) => candidate.id === decision.conciergeAction.recommendedCandidateId) ?? null
    : null

  const candidate = (value: typeof ranking.bestExecutable) => value ? {
    id: value.id,
    bank: value.bank,
    card_name: value.cardName,
    rail_id: value.railId,
    rail_type: value.railType,
    execution_state: value.railExecutionState,
    comparison_state: value.comparisonState,
    affordability: value.affordability,
    bank_points_target_minimum: value.bankPointsTargetMinimum,
    bank_points_to_transfer_exact: value.bankPointsToTransferExact,
    cash_payable_minor: value.cashPayableMinor,
    cash_currency: value.cashCurrency,
    reasons: value.reasons,
  } : null

  return {
    version: decision.version,
    travel_kind: decision.travelKind,
    instruction_state: decision.conciergeAction.instructionState,
    action_state: decision.conciergeAction.state,
    recommended_candidate: candidate(recommended),
    projected_winner: candidate(decision.wallet.projectedWinner),
    executable_winner: candidate(decision.wallet.executableWinner),
    blocked_reasons: decision.blockedReasons,
    award_state: decision.awardState,
    source_authority: decision.sourceAuthority,
    requires_live_reverification: decision.conciergeAction.requiresLiveReverification,
    irreversible_transfer_allowed: decision.conciergeAction.irreversibleTransferAllowed,
    generated_at: decision.generatedAt,
  }
}

export function buildFlightConciergeRequest(
  row: any,
  rankedOptions: RedemptionOption[],
  best: RedemptionOption | null,
): ConciergeRequest {
  const award = row.award
  const trip = award?.trip ?? null
  const bestRoute = best?.routes?.[0] ?? null
  const decision = (row.decision ?? null) as TravelDecisionContract | null
  const decisionCandidate = decision?.conciergeAction.recommendedCandidateId
    ? decision.wallet.ranking.candidates.find((candidate) => candidate.id === decision.conciergeAction.recommendedCandidateId) ?? null
    : null
  const decisionCashMinor =
    decisionCandidate?.cashCurrency === 'INR' && decisionCandidate.cashPayableMinor != null
      ? decisionCandidate.cashPayableMinor
      : null
  const expectedCashMinor = decisionCashMinor ?? (
    trip && trip.taxesCurrency === 'INR' && Number.isSafeInteger(trip.totalTaxes) && trip.totalTaxes >= 0
      ? trip.totalTaxes
      : !award && Number.isSafeInteger(row.price) && row.price >= 0
        ? row.price * 100
        : null
  )

  return {
    context: 'HNI',
    sourceType: 'FLIGHT',
    sourceRef: String(row.id),
    title: `${row.from} → ${row.to} · ${award?.program || 'cash flight'}${award?.cabin ? ` · ${award.cabin}` : ''}`,
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
      carriers: trip?.carriers ?? row.airline ?? null,
      departs_at: trip?.departsAt ?? row.departure ?? null,
      arrives_at: trip?.arrivesAt ?? row.arrival ?? null,
      stops: trip?.stops ?? row.stops ?? null,
      cash_fare_inr: row.price > 0 ? row.price : null,
      cash_fare_matched: row.price > 0,
      taxes_minor: trip?.totalTaxes ?? null,
      taxes_currency: trip?.taxesCurrency ?? null,
    },
    redemptionSnapshot: {
      travel_decision: conciergeDecisionSnapshot(decision),
      recommended_card: best ? {
        bank: best.bank,
        card_name: best.cardName,
        card_points_needed: best.cardPointsNeeded ?? null,
        wallet_points: best.yourPoints ?? null,
        can_afford: best.canAfford ?? null,
        self_entered: best.selfEntered ?? false,
        verified: best.verified,
      } : null,
      recommended_route: bestRoute ? {
        points_required: bestRoute.pointsRequired,
        nominal_ratio: bestRoute.nominalRatio,
        duration_days_min: bestRoute.durationDaysMin,
        duration_days_max: bestRoute.durationDaysMax,
        duration_unknown: bestRoute.durationUnknown,
        transfer_state: bestRoute.state,
        as_of: bestRoute.asOf,
        rounding_inflated: bestRoute.roundingInflated,
        min_transfer_increment: bestRoute.minTransferIncrement,
        hops: bestRoute.hops.map(hop => ({
          from: hop.from,
          to: hop.to,
          ratio: hop.ratio,
          min_transfer: hop.minTransfer,
          duration_days_min: hop.durationDaysMin,
          duration_days_max: hop.durationDaysMax,
          state: hop.state,
          as_of: hop.asOf,
          source: hop.source,
        })),
      } : null,
      self_serve_eligible: Boolean(best && best.status === 'ok' && best.canAfford && best.cardPointsNeeded != null),
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
      instruction_state: decision?.conciergeAction.instructionState ?? (award ? 'NEEDS_OPERATOR_VERIFICATION' : 'CASH_ONLY_NO_TRANSFER'),
    },
    sourceSnapshot: {
      decision_contract: decision ? {
        version: decision.version,
        award_pricing_authority: decision.sourceAuthority.awardPricingAuthority,
        rail_policy: decision.sourceAuthority.railPolicy,
      } : null,
      award: {
        source: decision?.sourceAuthority.award ?? award?.source ?? null,
        state: decision?.awardState.status ?? (award ? 'LIVE_OR_PROVIDER_RETURNED' : 'NOT_APPLICABLE'),
      },
      cash: {
        source: decision?.sourceAuthority.cash ?? null,
        state: row.price > 0 ? 'PROVIDER_RETURNED' : 'UNAVAILABLE',
      },
      transfer_candidates: {
        state: award ? 'UNVERIFIED' : 'NOT_APPLICABLE',
        reason: award ? 'Travel decision carries mapped wallet rails, but operator must re-verify current ratio, timing and award space before approval.' : 'Cash-only itinerary has no award transfer instruction.',
      },
    },
    expectedCashMinor,
    currency: 'INR',
    contactChannel: 'BOTH',
    notes: 'Corporate/HNI assisted travel handoff. Re-verify live award inventory, transfer ratio/timing, taxes and cash fare before requesting any irreversible approval. If present, travel-decision-v1 is the canonical recommendation state.',
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
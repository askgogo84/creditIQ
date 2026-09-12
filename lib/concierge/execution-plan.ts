import type { ConciergeSourceType } from './contract'

export type BookingExecutionMode =
  | 'CASH_PROVIDER_DEEPLINK'
  | 'CASH_API_BOOKING'
  | 'POINTS_ASSISTED'
  | 'PORTAL_ASSISTED'
  | 'BLOCKED_NEEDS_REVERIFICATION'

export type BookingExecutionPlan = {
  mode: BookingExecutionMode
  canStartBooking: boolean
  requiresUserApproval: boolean
  requiresLiveReverification: boolean
  requiresPayment: boolean
  requiresPointsTransfer: boolean
  bookingUrl: string | null
  provider: string | null
  steps: string[]
  blockedReasons: string[]
}

type CaseLike = {
  source_type: ConciergeSourceType
  selection: Record<string, unknown>
  redemption_snapshot: Record<string, unknown>
  source_snapshot: Record<string, unknown>
  snapshot_trust: string
  verified_redemption_snapshot?: Record<string, unknown> | null
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function bool(value: unknown): boolean {
  return value === true
}

function nested(obj: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const value = obj[key]
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

export function buildBookingExecutionPlan(c: CaseLike): BookingExecutionPlan {
  const verified = c.snapshot_trust === 'SERVER_VERIFIED' || !!c.verified_redemption_snapshot
  const travelDecision = nested(c.redemption_snapshot, 'travel_decision')
  const recommended = travelDecision ? nested(travelDecision, 'recommended_candidate') : null
  const railType = text(recommended?.rail_type)
  const requiresReverify = travelDecision ? bool(travelDecision.requires_live_reverification) : !verified
  const bookingUrl = text(c.selection.booking_url) || text(c.selection.deeplink) || text(c.selection.booking_link)
  const provider = text(c.selection.provider) || text(c.source_snapshot.provider)
  const blocked: string[] = []

  if (!verified) blocked.push('Concierge must re-verify the selected inventory and redemption snapshot before requesting approval.')
  if (requiresReverify) blocked.push('Live fare/award availability must be re-verified immediately before execution.')

  if (blocked.length) {
    return {
      mode: 'BLOCKED_NEEDS_REVERIFICATION', canStartBooking: false,
      requiresUserApproval: true, requiresLiveReverification: true,
      requiresPayment: false, requiresPointsTransfer: false,
      bookingUrl, provider,
      steps: ['Re-price/recheck the exact selected itinerary or room', 'Verify card/portal/transfer rules', 'Request final user approval'],
      blockedReasons: blocked,
    }
  }

  if (railType === 'LOYALTY_TRANSFER') {
    return {
      mode: 'POINTS_ASSISTED', canStartBooking: true,
      requiresUserApproval: true, requiresLiveReverification: false,
      requiresPayment: true, requiresPointsTransfer: true,
      bookingUrl, provider,
      steps: [
        'Confirm the award is still available at the verified points + taxes requirement',
        'Show the irreversible transfer instruction and receive explicit approval',
        'Complete/confirm the points transfer through the issuer-authorised flow',
        'Wait for points to post, re-check the award, then complete the loyalty-programme booking',
        'Capture the PNR/reservation reference and reconcile taxes/fees',
      ],
      blockedReasons: [],
    }
  }

  if (railType === 'PORTAL' || railType === 'BANK_PORTAL') {
    return {
      mode: 'PORTAL_ASSISTED', canStartBooking: true,
      requiresUserApproval: true, requiresLiveReverification: false,
      requiresPayment: true, requiresPointsTransfer: false,
      bookingUrl, provider,
      steps: [
        'Open the issuer portal against the exact verified itinerary/property',
        'Confirm the final points + cash amount at checkout',
        'Receive user approval for the final amount',
        'Complete the issuer-portal booking',
        'Capture the PNR/reservation reference and reconcile',
      ],
      blockedReasons: [],
    }
  }

  if (bookingUrl) {
    return {
      mode: 'CASH_PROVIDER_DEEPLINK', canStartBooking: true,
      requiresUserApproval: true, requiresLiveReverification: false,
      requiresPayment: true, requiresPointsTransfer: false,
      bookingUrl, provider,
      steps: [
        'Re-price the exact selected itinerary/property',
        'Receive approval for the final cash amount',
        'Open the provider booking link for the exact selection',
        'Complete provider checkout',
        'Capture the PNR/reservation reference and reconcile',
      ],
      blockedReasons: [],
    }
  }

  return {
    mode: 'CASH_API_BOOKING', canStartBooking: true,
    requiresUserApproval: true, requiresLiveReverification: false,
    requiresPayment: true, requiresPointsTransfer: false,
    bookingUrl: null, provider,
    steps: [
      'Re-price the exact selected itinerary/property through the booking-capable supplier',
      'Receive approval for the final cash amount',
      'Create the supplier order/reservation',
      'Capture the PNR/reservation reference',
      'Reconcile final supplier cost, fees and customer payment',
    ],
    blockedReasons: [],
  }
}

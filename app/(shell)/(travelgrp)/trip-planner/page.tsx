// /trip-planner — wallet-aware Flights workspace.
//
// The existing /api/flights/fusion backend remains the source of award inventory,
// wallet cards and transfer candidates. This page changes presentation only: compact
// results on the left and one source-aware wallet comparison panel on the right.
// Legacy inbound links (?q=Trip to <city>, ?points=, ?bank=) remain harmless; the
// workspace continues to price from the signed-in user's wallet rather than a typed
// aggregate balance.

import { Suspense } from 'react'
import { InvestorFlightWorkspace } from '@/components/ciq/travel/InvestorFlightWorkspace'

export default function TripPlannerPage() {
  return (
    <Suspense fallback={<div />}>
      <InvestorFlightWorkspace />
    </Suspense>
  )
}

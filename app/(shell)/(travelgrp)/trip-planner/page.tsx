// /trip-planner — global, wallet-aware Flights workspace.
//
// Inventory is the primary search result. Cash-only, award-only and matched rows
// remain visible; wallet reachability is an optional filter/decision overlay.

import { Suspense } from 'react'
import { GlobalFlightWorkspace } from '@/components/ciq/travel/GlobalFlightWorkspace'

export default function TripPlannerPage() {
  return (
    <Suspense fallback={<div />}>
      <GlobalFlightWorkspace />
    </Suspense>
  )
}

// /trip-planner — global, wallet-aware Flights workspace.
//
// Inventory is the primary search result. Cash-only, award-only and matched rows
// remain visible; wallet reachability is an optional filter/decision overlay.

import { Suspense } from 'react'
import { GlobalFlightWorkspace } from '@/components/ciq/travel/GlobalFlightWorkspace'
import { WalletRailMatrix } from '@/components/ciq/travel/WalletRailMatrix'

export default function TripPlannerPage() {
  return (
    <>
      <Suspense fallback={<div />}>
        <GlobalFlightWorkspace />
      </Suspense>

      <section style={{ marginTop: 24 }} aria-label="Always-visible flight redemption channels">
        <div style={{ marginBottom: 10 }}>
          <div className="ciq-editorial-kicker">Your bank-point booking routes</div>
          <h2 style={{ margin: '4px 0 4px', fontSize: 20 }}>Redemption paths do not disappear when an airline award is missing.</h2>
          <p style={{ margin: 0, maxWidth: 820, color: 'var(--ink-2)', fontSize: 11 }}>
            CreditIQ keeps HDFC SmartBuy, Axis Travel EDGE, American Express Travel and other exact-card rails visible independently of airline award inventory. A route with no confirmed award seat is not the same as having no redemption option.
          </p>
        </div>
        <WalletRailMatrix travelKind="flight" programmeId={null} />
      </section>
    </>
  )
}

import type { cardRedemptionCoverage } from '@/lib/redemption-engine/coverage'
import { safeSourceUrl } from '@/lib/intelligence/presentation'

const labels = { EXECUTABLE: 'Rule mechanics captured · verify booking', RATIO_ONLY: 'Ratio captured · transfer rules incomplete', CHECKOUT_REQUIRED: 'Checkout verification required', DISCOVERY_ONLY: 'Discovery only' }
export function RedemptionCoverage({ routes }: { routes: ReturnType<typeof cardRedemptionCoverage> }) {
  return <details style={{ fontSize: 13, lineHeight: 1.45, overflowWrap: 'anywhere' }}>
    <summary style={{ minHeight: 44, padding: '12px 0', cursor: 'pointer' }}>Redemption coverage · {routes.length} mapped options</summary>
    <p>These are mapped options, not confirmed bookings. Each needs a booking-specific price and eligibility check.</p>
    {!routes.length && <p>No supported redemption path is captured for this card yet.</p>}
    {routes.map(route => <article key={route.id} style={{ borderTop: '1px solid #E8E8E5', padding: '12px 0' }}>
      <strong>{route.name}</strong><div>{labels[route.evidenceState]}</div>
      {route.ratio && <div>{route.ratio.fromUnits} card points → {route.ratio.toUnits} programme points</div>}
      <p>Still needed: {route.missing.join('; ')}.</p>
      {route.sources.filter(source => safeSourceUrl(source.sourceUrl)).map((source, i) => <a key={source.sourceId + i} href={safeSourceUrl(source.sourceUrl)!} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, marginRight: 12 }}>Source · {source.capturedAt || 'capture date unavailable'} ↗</a>)}
    </article>)}
  </details>
}

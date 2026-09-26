import type { DecisionWalletCard } from '@/lib/wallet/decision-portfolio'
import type { RateResult } from '@/lib/hotels/providers/rates'
import type { FxSnapshot } from '@/lib/hotels/providers/fx'
import { redemptionReadiness, walletCardKey } from './readiness'
import { planRedemption } from './plan'
import { ACCOR_RULES, HDFC_ACCOR_ROUTE, withEligibilityBounds } from './accor'
import { INFINIA_PORTAL } from './portal'

/** All monetary facts are server inputs. Requests supply identity/intent only. */
export function calculateAdvisor(card: DecisionWalletCard, rate: RateResult | null, fx: FxSnapshot | null) {
  const readiness = redemptionReadiness(card)
  const common = { walletCardId: walletCardKey(card), balance: { points: card.points, currency: card.pointsCurrency, source: card.source, verified: card.verified, observedAt: card.observedAt }, readiness, walletValueInr: null }
  if (readiness.state !== 'BOOKING_REQUIRED' || !rate) {
    return { ...common, plan: null, booking: null, fx: null, advice: readiness.reason + ' ' + readiness.blockers.join(' ') }
  }
  if (rate.hotel.programme_id !== 'accor-all') throw new Error('Unsupported booking programme')
  if (rate.hotel.cash_taxes_inr === null || !rate.captured_at || !rate.source_id) {
    return { ...common, plan: null, booking: null, fx: null, advice: 'Captured booking data is incomplete. Tax, source and capture date are required before comparing payable amounts.' }
  }
  // Three nights is the captured stay, never a quote for arbitrary travel dates.
  const booking = { grossMinor: Math.round((rate.cash_per_night_inr * 3 + rate.taxes_inr) * 100), roomOnlyMinor: Math.round(rate.cash_per_night_inr * 3 * 100) }
  const plan = planRedemption({
    booking, bank: { card_id: HDFC_ACCOR_ROUTE.card_id, points: card.points!, provenance: card.selfEntered ? 'SELF_ENTERED' : card.source === 'linked' ? 'LINKED' : 'STATEMENT' },
    programmeBalance: null, rules: withEligibilityBounds(ACCOR_RULES, booking), route: HDFC_ACCOR_ROUTE, portal: INFINIA_PORTAL, fxRate: fx?.rate ?? null,
  })
  return {
    ...common, plan,
    booking: { ...booking, hotelId: rate.hotel.id, capturedAt: rate.captured_at, source: rate.source_id, isLive: false, basis: 'Captured starting-from member rate: 12 Oct 2026, 3 nights, 2 adults, 1 room. Recheck checkout price.' },
    fx,
    advice: `Server-calculated booking comparison: ${plan.recommendedPath.replaceAll('_', ' ').toLowerCase()}. ${plan.blockedReason ?? 'This comparison applies only to the selected captured stay.'} No programme balance was supplied. ${readiness.blockers.join(' ')} Exact transfer instructions remain withheld.${fx ? '' : ' FX unavailable: programme INR economics cannot be compared.'}`,
  }
}

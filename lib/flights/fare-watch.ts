/**
 * Deterministic price-watch decision. Callers must supply a *provider-backed*
 * observation; this module never searches the web, schedules jobs, or purchases.
 */
export type FareWatch = {
  id: string
  from: string
  to: string
  departDate: string
  cabin: 'economy' | 'premium_economy' | 'business' | 'first'
  adults: number
  currency: string
  targetMinor: number
  /** Optional reduction from the last observed comparable fare in minor units. */
  minDropMinor?: number
  baselineMinor?: number | null
  lastAlertKey?: string | null
  expiresAt?: string | null
}
export type FareObservation = {
  provider: string
  sourceAuthority: 'LIVE_PROVIDER' | 'CACHED_DISCOVERY' | 'WEB_SEARCH' | 'UNKNOWN'
  from: string
  to: string
  departDate: string
  cabin: FareWatch['cabin']
  adults: number
  currency: string
  totalMinor: number
  fetchedAt: string
  bookingUrl: string
  quoteId: string
}
export type WatchDecision = {
  notify: boolean
  reason: string
  alertKey: string | null
  requireRepriceBeforePurchase: true
}
function deny(reason: string): WatchDecision {
  return { notify: false, reason, alertKey: null, requireRepriceBeforePurchase: true }
}
const validMinor = (v: unknown) => Number.isSafeInteger(v) && (v as number) > 0
const MAX_QUOTE_AGE_MS = 15 * 60_000

export function evaluateFareWatch(watch: FareWatch, observed: FareObservation, nowMs: number): WatchDecision {
  if (!Number.isFinite(nowMs) || !validMinor(watch.targetMinor) ||
      !Number.isSafeInteger(watch.adults) || watch.adults < 1 || watch.adults > 9) return deny('INVALID_WATCH')
  if (watch.expiresAt && Date.parse(watch.expiresAt) <= nowMs) return deny('EXPIRED')
  if (observed.sourceAuthority !== 'LIVE_PROVIDER') return deny('NOT_LIVE_PROVIDER')
  if (watch.from !== observed.from || watch.to !== observed.to ||
      watch.departDate !== observed.departDate || watch.cabin !== observed.cabin ||
      watch.adults !== observed.adults || watch.currency !== observed.currency) return deny('NOT_COMPARABLE')
  if (!validMinor(observed.totalMinor) || !observed.quoteId || !observed.provider) return deny('MISSING_QUOTE_EVIDENCE')
  const at = Date.parse(observed.fetchedAt)
  if (!Number.isFinite(at) || at > nowMs + 60_000 || nowMs - at > MAX_QUOTE_AGE_MS) return deny('STALE_QUOTE')
  let url: URL
  try { url = new URL(observed.bookingUrl) } catch { return deny('UNVERIFIED_BOOKING_LINK') }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password ||
      /^(localhost|127\.|10\.|192\.168\.|169\.254\.)/i.test(url.hostname)) return deny('UNVERIFIED_BOOKING_LINK')
  if (observed.totalMinor > watch.targetMinor) return deny('ABOVE_TARGET')
  if (watch.minDropMinor != null) {
    if (!Number.isSafeInteger(watch.minDropMinor) || watch.minDropMinor < 0) return deny('INVALID_WATCH')
    if (!validMinor(watch.baselineMinor) ||
        (watch.baselineMinor as number) - observed.totalMinor < watch.minDropMinor) return deny('INSUFFICIENT_DROP')
  }
  const alertKey = [watch.id, observed.provider, observed.quoteId, observed.totalMinor].join('|')
  if (watch.lastAlertKey === alertKey) return deny('DUPLICATE_ALERT')
  return { notify: true, reason: 'PRICE_CONDITION_MET', alertKey, requireRepriceBeforePurchase: true }
}

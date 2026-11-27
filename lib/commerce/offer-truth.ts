/** Money-correctness boundary for product-shopping observations. No payments or orders. */
export type MerchantQuote = {
  merchant: string
  productId: string
  currency: string
  amountMinor: number
  shippingMinor: number | null
  taxMinor: number | null
  source: 'MERCHANT_CHECKOUT' | 'MERCHANT_LISTING' | 'WEB_SEARCH_SNIPPET' | 'UNKNOWN'
  observedAt: string
  productUrl: string
}
export type QuoteAssessment = {
  state: 'COMPARABLE_QUOTE' | 'DISCOVERY_ONLY' | 'INVALID'
  totalMinor: number | null
  reason: string
  requiresCheckoutReverification: true
}
export function assessMerchantQuote(q: MerchantQuote, nowMs: number): QuoteAssessment {
  const invalid = (reason: string): QuoteAssessment => ({
    state: 'INVALID', totalMinor: null, reason, requiresCheckoutReverification: true,
  })
  const discovery = (reason: string): QuoteAssessment => ({
    state: 'DISCOVERY_ONLY', totalMinor: null, reason, requiresCheckoutReverification: true,
  })
  if (!Number.isFinite(nowMs) || !q.merchant || !q.productId || !/^[A-Z]{3}$/.test(q.currency) ||
      !Number.isSafeInteger(q.amountMinor) || q.amountMinor <= 0) return invalid('INVALID_QUOTE')
  let url: URL
  try { url = new URL(q.productUrl) } catch { return invalid('INVALID_URL') }
  if (url.protocol !== 'https:' || !url.hostname || url.username || url.password ||
      /^(localhost|127\.|10\.|192\.168\.)/i.test(url.hostname)) return invalid('INVALID_URL')
  if (q.source !== 'MERCHANT_CHECKOUT') return discovery('NOT_CHECKOUT_VERIFIED')
  const observedMs = Date.parse(q.observedAt)
  if (!Number.isFinite(observedMs) || observedMs > nowMs + 60_000 ||
      nowMs - observedMs > 15 * 60_000) return discovery('STALE_PRICE')
  if (q.shippingMinor == null || q.taxMinor == null ||
      !Number.isSafeInteger(q.shippingMinor) || !Number.isSafeInteger(q.taxMinor) ||
      q.shippingMinor < 0 || q.taxMinor < 0) return discovery('ADDITIONAL_FEES_UNKNOWN')
  const total = q.amountMinor + q.shippingMinor + q.taxMinor
  if (!Number.isSafeInteger(total)) return invalid('TOTAL_OVERFLOW')
  return { state: 'COMPARABLE_QUOTE', totalMinor: total, reason: 'ALL_PRICE_COMPONENTS_OBSERVED',
    requiresCheckoutReverification: true }
}

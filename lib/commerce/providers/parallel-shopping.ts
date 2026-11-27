/**
 * Parallel Shopping API — authenticated, user-allowlisted pilot, discovery only.
 * Official docs: https://docs.parallel.ai/shopping-search/best-practices.md
 * Listed store prices omit unknown taxes/delivery; never treat as checkout total.
 */
export type ParallelProduct = {
  id: string
  title: string
  merchant: string
  brand: string | null
  priceMinor: number | null
  currency: 'INR'
  productUrl: string
  availability: string | null
  source: 'PARALLEL_MERCHANT_LISTING'
  evidenceState: 'DISCOVERY_ONLY'
  requiresCheckoutReverification: true
}
export type ShoppingResult = {
  status: 'DISABLED' | 'SUCCESS' | 'EMPTY' | 'ACCESS_DENIED' | 'RATE_LIMITED' | 'PROVIDER_ERROR'
  products: ParallelProduct[]
}
const ENDPOINT = 'https://api.parallel.ai/v1/shopping/search'
function safeProductUrl(raw: unknown): string {
  try {
    const url = new URL(String(raw || ''))
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return ''
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/i.test(url.hostname)) return ''
    return url.toString()
  } catch { return '' }
}
export function parallelShoppingAllowed(userId: string, env: Record<string, string | undefined> = process.env): boolean {
  if (!userId || !env.PARALLEL_API_KEY || env.PARALLEL_SHOPPING_ENABLED !== 'true') return false
  return String(env.PARALLEL_SHOPPING_PILOT_USER_IDS || '').split(',').some(s => s.trim() === userId)
}
export function shoppingQueryValid(query: unknown): query is string {
  return typeof query === 'string' && query.trim().length >= 3 && query.trim().length <= 200 &&
    !/\S+@\S+|(?:\d[ -]?){9,}/.test(query)
}
export function normalizeParallelShopping(raw: unknown): ParallelProduct[] {
  const results = (raw as { results?: unknown[] } | null)?.results
  if (!Array.isArray(results)) return []
  return results.slice(0, 12).flatMap((row, index) => {
    if (!row || typeof row !== 'object') return []
    const r = row as Record<string, unknown>
    const productUrl = safeProductUrl(r.url)
    const title = String(r.title || '').trim().slice(0, 240)
    const merchant = String(r.merchant || '').trim().slice(0, 120)
    if (!productUrl || !title || !merchant) return []
    // Market 'in' is requested. Reject all other currency results; no fake INR exchange.
    if (r.currency !== 'INR') return []
    const price = r.price
    const minor = typeof price === 'number' && Number.isFinite(price) && price > 0
      ? Math.round(price * 100) : null
    if (minor !== null && !Number.isSafeInteger(minor)) return []
    return [{
      id: 'parallel-shopping-' + index,
      title, merchant,
      brand: typeof r.brand === 'string' ? r.brand.slice(0, 100) : null,
      priceMinor: minor, currency: 'INR' as const,
      productUrl,
      availability: typeof r.availability === 'string' ? r.availability.slice(0, 30) : null,
      source: 'PARALLEL_MERCHANT_LISTING' as const,
      evidenceState: 'DISCOVERY_ONLY' as const,
      requiresCheckoutReverification: true as const,
    }]
  })
}
export async function searchParallelShopping(
  query: string,
  options: { apiKey?: string; enabled?: boolean; fetcher?: typeof fetch } = {},
): Promise<ShoppingResult> {
  const key = options.apiKey ?? process.env.PARALLEL_API_KEY ?? ''
  const enabled = options.enabled ?? (process.env.PARALLEL_SHOPPING_ENABLED === 'true')
  if (!enabled || !key) return { status: 'DISABLED', products: [] }
  if (!shoppingQueryValid(query)) return { status: 'PROVIDER_ERROR', products: [] }
  try {
    const res = await (options.fetcher ?? fetch)(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body: JSON.stringify({
        search_queries: [query.trim()],
        advanced_settings: { location: 'in', max_results: 10 },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(25_000),
    })
    if (res.status === 401 || res.status === 403) return { status: 'ACCESS_DENIED', products: [] }
    if (res.status === 429) return { status: 'RATE_LIMITED', products: [] }
    if (!res.ok) return { status: 'PROVIDER_ERROR', products: [] }
    const products = normalizeParallelShopping(await res.json())
    return { status: products.length ? 'SUCCESS' : 'EMPTY', products }
  } catch {
    return { status: 'PROVIDER_ERROR', products: [] }
  }
}

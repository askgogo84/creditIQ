import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import {
  parallelShoppingAllowed, searchParallelShopping, shoppingQueryValid,
} from '@/lib/commerce/providers/parallel-shopping'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Pilot-only live store listings. No card numbers, personal statement content,
 * payment tokens or purchase instructions leave CreditIQ.
 * This endpoint NEVER marks provider listings as final checkout prices.
 */
export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res
  if (!parallelShoppingAllowed(gate.userId)) {
    return NextResponse.json({ error: 'pilot_not_enabled' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  if (!shoppingQueryValid(body?.query)) {
    return NextResponse.json({
      error: 'invalid_product_query',
      detail: 'Specify one public product/model description (3–200 characters) with no private account details.',
    }, { status: 400 })
  }
  const result = await searchParallelShopping(body.query)
  if (result.status === 'ACCESS_DENIED') {
    return NextResponse.json({ error: 'parallel_shopping_access_denied' }, { status: 424 })
  }
  if (result.status === 'RATE_LIMITED') {
    return NextResponse.json({ error: 'shopping_rate_limited' }, { status: 429 })
  }
  if (result.status === 'PROVIDER_ERROR' || result.status === 'DISABLED') {
    return NextResponse.json({ error: 'shopping_provider_unavailable' }, { status: 503 })
  }
  return NextResponse.json({
    products: result.products,
    source: 'parallel-shopping',
    priceAuthority: 'STORE_LISTING_NOT_CHECKOUT',
    shoppingAvailable: result.status === 'SUCCESS',
    requiresCheckoutReverification: true,
    paymentsExecuted: false,
    note: 'Listed store prices may exclude delivery, taxes and card-specific charges. Verify at merchant checkout.',
  })
}

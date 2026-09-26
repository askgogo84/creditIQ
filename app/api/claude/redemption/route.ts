import { requireAuth } from '@/lib/api-auth'
import { NextRequest, NextResponse } from 'next/server'
import { loadDecisionPortfolio } from '@/lib/wallet/decision-portfolio'
import { redemptionReadiness, walletCardKey } from '@/lib/redemption-engine/readiness'
import { calculateAdvisor } from '@/lib/redemption-engine/advisor'
import { SeededRateProvider, type RateResult } from '@/lib/hotels/providers/rates'
import { LiveFxProvider, type FxSnapshot } from '@/lib/hotels/providers/fx'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res
  let body: Record<string, unknown>
  try {
    body = await req.json()
    if (!body || Array.isArray(body) || typeof body !== 'object') throw new Error()
    // Reject legacy rankings/financial overrides rather than endorsing them.
    if (Object.keys(body).some(key => !['walletCardId', 'cardId', 'bookingId'].includes(key))) throw new Error()
    if (typeof (body.walletCardId ?? body.cardId) !== 'string') throw new Error()
    if (body.bookingId !== undefined && typeof body.bookingId !== 'string') throw new Error()
  } catch {
    return NextResponse.json({ error: 'Provide a wallet card identity and optional captured booking ID; financial overrides are not accepted.' }, { status: 400 })
  }
  try {
    const portfolio = await loadDecisionPortfolio(gate.userId)
    const matches = portfolio.filter(card => body.walletCardId
      ? walletCardKey(card) === body.walletCardId
      : redemptionReadiness(card).cardId === body.cardId)
    if (matches.length !== 1) return NextResponse.json({ error: matches.length ? 'Select one wallet card.' : 'Card not found in your wallet.' }, { status: 422 })
    let rate: RateResult | null = null
    let fx: FxSnapshot | null = null
    if (body.bookingId) {
      const rates = await new SeededRateProvider().search({ hotel_id: body.bookingId as string, nights: 3 })
      rate = rates.find(r => r.hotel.programme_id === 'accor-all') ?? null
      if (!rate) return NextResponse.json({ error: 'Captured booking unavailable.' }, { status: 422 })
      if (redemptionReadiness(matches[0]).state === 'BOOKING_REQUIRED') fx = await new LiveFxProvider().rate('EUR', 'INR')
    }
    return NextResponse.json(calculateAdvisor(matches[0], rate, fx))
  } catch {
    return NextResponse.json({ error: 'Redemption evidence temporarily unavailable.' }, { status: 503 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { loadDecisionPortfolio } from '@/lib/wallet/decision-portfolio'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  try {
    const cards = await loadDecisionPortfolio(gate.userId)
    return NextResponse.json({
      cards: cards.map((card) => ({
        source: card.source,
        bank: card.bank,
        cardName: card.cardName,
        last4: card.last4,
        points: card.points,
        pointsCurrency: card.pointsCurrency,
        verified: card.verified,
        selfEntered: card.selfEntered,
        observedAt: card.observedAt,
        linkedBalanceMerged: card.linkedBalanceMerged,
      })),
    })
  } catch (error) {
    console.error('travel wallet load failed', error)
    return NextResponse.json({ error: 'could not load wallet', cards: [] }, { status: 500 })
  }
}

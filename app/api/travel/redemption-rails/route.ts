import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { loadDecisionPortfolio } from '@/lib/wallet/decision-portfolio'
import { buildWalletRailMatrix } from '@/lib/redemption-rails/matrix'
import type { TravelKind } from '@/lib/redemption-rails/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function safeProgrammeId(value: unknown): string | null {
  if (value == null || value === '') return null
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  return /^[a-z0-9-]{2,80}$/.test(v) ? v : null
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  const body = await req.json().catch(() => ({}))
  const travelKind = body.travelKind as TravelKind
  if (travelKind !== 'flight' && travelKind !== 'hotel') {
    return NextResponse.json({ error: 'travelKind must be flight or hotel' }, { status: 400 })
  }

  if (body.programmeId != null && safeProgrammeId(body.programmeId) == null) {
    return NextResponse.json({ error: 'invalid programmeId' }, { status: 400 })
  }

  try {
    // Owner identity comes only from the verified bearer token. Any userId in the
    // request body is ignored by construction.
    const portfolio = await loadDecisionPortfolio(gate.userId)
    const cards = portfolio.map((card, index) => ({
      walletKey: `${card.source}:${card.bank}:${card.last4 ?? card.cardName ?? index}`,
      bank: card.bank,
      // Unnamed AA-linked cards stay visible, but this label is intentionally not
      // a catalogue product name, so the exact-card resolver will refuse to map it.
      cardName: card.cardName ?? `Unidentified ${card.bank} card${card.last4 ? ` ••••${card.last4}` : ''}`,
      pointsBalance: card.points,
      balanceVerified: card.verified,
    }))

    const matrix = buildWalletRailMatrix(cards, travelKind, safeProgrammeId(body.programmeId))
    return NextResponse.json({
      matrix,
      walletCount: portfolio.length,
      policy: 'inventory-first-card-exact-no-bank-inheritance',
    })
  } catch (error) {
    console.error('travel redemption rail matrix failed', error)
    return NextResponse.json({ error: 'could not load redemption rails' }, { status: 500 })
  }
}

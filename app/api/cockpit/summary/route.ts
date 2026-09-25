import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { loadDecisionPortfolio } from '@/lib/wallet/decision-portfolio'
import { railsForCard } from '@/lib/redemption-rails/registry'
import { supplementalRailsForCard } from '@/lib/redemption-rails/supplemental-rails'
import { amexExactRailsForCard } from '@/lib/redemption-rails/amex-exact-rails'
import { resolveRailCardId } from '@/lib/redemption-rails/card-resolver'
import { SEED_CARDS } from '@/lib/data/seed-cards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function norm(value: unknown) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function catalogueCard(bank: string, name: string | null | undefined) {
  const held = norm(String(bank) + ' ' + String(name || ''))
  const heldName = norm(name)
  return SEED_CARDS.find(card => {
    const seed = norm(String(card.bank) + ' ' + String(card.name))
    const seedName = norm(card.name)
    return seed === held || seed.includes(held) || held.includes(seed) ||
      (heldName.length >= 5 && (seedName.includes(heldName) || heldName.includes(seedName)))
  }) || null
}

function partnersFor(card: { bank: string; cardName: string | null }) {
  if (!card.cardName) return []
  const cardId = resolveRailCardId({ bank: card.bank, cardName: card.cardName })
  if (!cardId) return []

  const rails = [
    ...railsForCard(cardId),
    ...supplementalRailsForCard(cardId, 'flight'),
    ...supplementalRailsForCard(cardId, 'hotel'),
    ...amexExactRailsForCard(cardId, 'flight'),
    ...amexExactRailsForCard(cardId, 'hotel'),
  ]
  const seenRails = new Map(rails.map(rail => [rail.id, rail]))

  const partners = [...seenRails.values()].flatMap(rail => {
    if (rail.type === 'LOYALTY_TRANSFER' && rail.transfer) {
      return [rail.transfer.programmeName || rail.transfer.destinationCurrency || rail.transfer.programmeId]
    }
    if ((rail.type === 'BANK_TRAVEL_PORTAL' || rail.type === 'MERCHANT_PAY_WITH_POINTS' || rail.type === 'COBRAND_NATIVE') && rail.bookingDestination) {
      return [rail.bookingDestination]
    }
    return []
  }).filter(Boolean) as string[]

  return [...new Set(partners)].slice(0, 12)
}

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  try {
    const portfolio = await loadDecisionPortfolio(gate.userId)
    const cards = portfolio.map((card, index) => {
      const catalogue = catalogueCard(card.bank, card.cardName)
      const partners = partnersFor(card)
      return {
        id: String(card.last4 || (card.bank + ':' + (card.cardName || index))),
        bank: card.bank,
        cardName: card.cardName || ('Unidentified ' + card.bank + ' card'),
        last4: card.last4,
        points: card.points,
        pointsCurrency: card.pointsCurrency || catalogue?.reward_currency || 'Reward points',
        verified: card.verified,
        selfEntered: card.selfEntered,
        source: card.source,
        observedAt: card.observedAt,
        color: catalogue?.color || '#1C2B4B',
        bestUse: catalogue?.best_for || (partners.length ? 'Use transfer and travel rails after live verification.' : 'Compare issuer redemption options before using points.'),
        partners,
        catalogueId: catalogue?.id || null,
      }
    })

    const total = cards.reduce((sum, card) => sum + (Number(card.points) || 0), 0)
    const verified = cards.filter(card => card.verified).reduce((sum, card) => sum + (Number(card.points) || 0), 0)
    const selfEntered = Math.max(0, total - verified)
    const transferPathCount = cards.reduce((sum, card) => sum + card.partners.length, 0)

    return NextResponse.json({
      cards,
      summary: {
        total,
        verified,
        selfEntered,
        verifiedPercent: total > 0 ? Math.round((verified / total) * 100) : 0,
        cardCount: cards.length,
        transferPathCount,
      },
      // Single source of truth for the catalogue size shown on Home ("Catalogue · N
      // cards"). SEED_CARDS is canonical; this is a count, not a second card query.
      catalogueCount: SEED_CARDS.length,
      insights: cards.length ? [
        {
          kicker: selfEntered > 0 ? selfEntered.toLocaleString('en-IN') + ' points are self-entered' : 'Your tracked balances are verified',
          action: selfEntered > 0 ? 'Verify balance' : 'Explore your wallet',
          intent: selfEntered > 0 ? 'statement' : 'wallet',
        },
        {
          kicker: transferPathCount + ' mapped redemption paths',
          action: 'Explore transfers',
          intent: 'redeem',
        },
        {
          kicker: 'Planning a large purchase?',
          action: 'Find the best card in your wallet',
          intent: 'spend',
        },
      ] : [
        { kicker: 'Nothing in your wallet yet', action: 'Add your first card', intent: 'wallet' },
        { kicker: 'Fastest way to start', action: 'Upload a statement', intent: 'statement' },
        { kicker: 'Curious what CIRA can do?', action: 'Ask a question', intent: 'cira' },
      ],
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('cockpit summary failed', error)
    return NextResponse.json({ error: 'cockpit summary unavailable' }, { status: 500 })
  }
}

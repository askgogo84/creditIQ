import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { loadDecisionPortfolio } from '@/lib/wallet/decision-portfolio'
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

function categoryCandidates(category: string, merchant: string) {
  const c = String(category || '').toLowerCase()
  const m = String(merchant || '').toLowerCase()
  const out = new Set<string>([c])
  if (c === 'shopping') {
    out.add('online')
    out.add('smartbuy')
  }
  if (c === 'travel') out.add('travel')
  if (c === 'dining') out.add('dining')
  if (c === 'fuel') out.add('fuel')
  if (m.includes('amazon')) {
    out.add('amazon-prime')
    out.add('amazon-non-prime')
    out.add('amazon-partners')
    out.add('online')
    out.add('smartbuy')
  }
  if (m.includes('apple')) out.add('online')
  if (m.includes('makemytrip') || m.includes('cleartrip') || m.includes('flight') || m.includes('hotel')) out.add('travel')
  if (m.includes('swiggy') || m.includes('zomato') || m.includes('restaurant')) out.add('dining')
  if (m.includes('tax')) out.add('utilities')
  return [...out].filter(Boolean)
}

function expectedValue(card: any, amount: number, categories: string[]) {
  const rewards = Array.isArray(card.category_rewards) ? card.category_rewards : []
  let matched: any = null
  for (const candidate of categories) {
    matched = rewards.find((reward: any) => String(reward.category || '').toLowerCase() === candidate)
    if (matched) break
  }

  const rate = Number(matched?.rate ?? card.base_reward_rate ?? 0)
  let value = amount * Math.max(0, rate) / 100
  const cap = Number(matched?.cap_inr_monthly || 0)
  if (cap > 0) value = Math.min(value, cap)

  return {
    value: Math.round(value),
    rate,
    matchedCategory: matched?.category || null,
    note: matched?.notes || null,
    assumption: matched ? (matched.unit === 'multiplier' ? 'catalogue category rate proxy' : 'catalogue category rate') : 'catalogue base reward rate',
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  const body = await req.json().catch(() => ({}))
  const amount = Math.max(0, Math.min(10_000_000, Number(body.amount) || 0))
  const merchant = String(body.merchant || '').trim().slice(0, 120)
  const category = String(body.category || 'shopping').trim().toLowerCase().slice(0, 40)
  if (!(amount > 0)) return NextResponse.json({ error: 'amount must be greater than zero' }, { status: 400 })

  try {
    const portfolio = await loadDecisionPortfolio(gate.userId)
    const categories = categoryCandidates(category, merchant)
    const rows = portfolio.flatMap((walletCard, index) => {
      const card = catalogueCard(walletCard.bank, walletCard.cardName)
      if (!card) return []
      const estimate = expectedValue(card, amount, categories)
      return [{
        id: String(walletCard.last4 || (walletCard.bank + ':' + (walletCard.cardName || index))),
        bank: walletCard.bank,
        cardName: walletCard.cardName || card.name,
        catalogueId: card.id,
        color: card.color || '#1C2B4B',
        value: estimate.value,
        rate: estimate.rate,
        matchedCategory: estimate.matchedCategory,
        note: estimate.note,
        assumption: estimate.assumption,
        verifiedBalance: walletCard.verified,
      }]
    }).sort((a, b) => b.value - a.value)

    return NextResponse.json({
      amount,
      merchant,
      category,
      cards: rows,
      best: rows[0] || null,
      disclosure: 'Estimated reward value uses CreditIQ curated earn-rate data for cards in your wallet. Merchant exclusions, accelerated portals, monthly caps and issuer terms can change; confirm current issuer terms before paying.',
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('cockpit spend failed', error)
    return NextResponse.json({ error: 'spend comparison unavailable' }, { status: 500 })
  }
}

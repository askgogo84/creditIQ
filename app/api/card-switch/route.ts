import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCards, buildRagSystemPrompt, cardToText } from '@/lib/rag'
import { getAllCards } from '@/lib/supabase'
import { callClaude, MODELS } from '@/lib/ai'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit(req, 'card-switch')
    if (!rl.ok) return rl.res

    const { currentCardId, monthlySpend, spendProfile } = await req.json()

    const allCards = await getAllCards()
    const currentCard = allCards.find((c: any) => c.id === currentCardId || c.slug === currentCardId) as any
    if (!currentCard) return NextResponse.json({ error: 'Card not found' }, { status: 400 })

    // Build slug lookup map to fix Claude hallucinating wrong cardId order
    const slugMap = new Map<string, string>()
    for (const card of allCards as any[]) {
      const slug: string = card.slug || card.id || ''
      slugMap.set(slug.toLowerCase(), slug)
      const parts = slug.split('-')
      if (parts.length >= 2) {
        slugMap.set(parts.slice(1).join('-') + '-' + parts[0], slug)
      }
      const nameKey = (card.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/, '')
      slugMap.set(nameKey, slug)
    }

    const resolveSlug = (cardId: string): string => {
      if (!cardId) return ''
      const key = cardId.toLowerCase()
      if (slugMap.has(key)) return slugMap.get(key)!
      const parts = key.split('-').filter((p: string) => p.length > 2)
      for (const [k, v] of slugMap.entries()) {
        if (parts.every((p: string) => k.includes(p))) return v
      }
      return cardId
    }

    const { context, devaluations } = await retrieveRelevantCards(
      'best alternative to ' + currentCard.name + ' for ' + (spendProfile || 'general') + ' spending',
      { topK: 8 }
    )

    const systemPrompt = buildRagSystemPrompt(context, devaluations)

    const userPrompt = `A user wants to know if they should switch from their current card.

CURRENT CARD:
${cardToText(currentCard)}

USER PROFILE:
Monthly Spend: Rs.${monthlySpend || 0}
Spend Pattern: ${spendProfile || 'General spender'}

Find the best 3 alternatives from the database. Be specific about the upgrade in value.

Respond ONLY with valid JSON:
{
  "currentCardScore": 65,
  "currentMonthlyValue": 800,
  "shouldSwitch": true,
  "switchReason": "Specific reason with numbers",
  "alternatives": [
    {
      "cardId": "card-slug",
      "cardName": "Card Name",
      "bank": "Bank Name",
      "monthlyValue": 1800,
      "annualUpgrade": 12000,
      "keyUpgrade": "Specific improvement over current card",
      "tradeoff": "What you lose vs current card",
      "annualFee": 2500,
      "applyUrl": null
    }
  ],
  "keepIfCondition": "Condition under which they should keep current card"
}`

    const ai = await callClaude({
      model: MODELS.sonnet,
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
    if (!ai.ok) {
      return NextResponse.json({ ok: false, reason: ai.reason }, { status: ai.status })
    }

    const clean = ai.text.replace(/```json|```/g, '').trim()
    let parsed: any
    try {
      parsed = JSON.parse(clean)
    } catch {
      return NextResponse.json({ ok: false, reason: 'ai_bad_response' }, { status: 502 })
    }
    // Map alternatives to cards for frontend compatibility
    const response_data = {
      ...parsed,
      cards: (parsed.alternatives || []).map((alt: any) => {
        const resolvedSlug = resolveSlug(alt.cardId || '')
        return {
          id: resolvedSlug,
          slug: resolvedSlug,
          name: alt.cardName,
          bank: alt.bank,
          monthlyValue: alt.monthlyValue,
          annualUpgrade: alt.annualUpgrade,
          keyUpgrade: alt.keyUpgrade,
          tradeoff: alt.tradeoff,
          annualFee: alt.annualFee,
          reasons: [alt.keyUpgrade, alt.tradeoff].filter(Boolean),
        }
      }),
    }
    return NextResponse.json(response_data)
  } catch (err) {
    console.error('Card switch error:', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}

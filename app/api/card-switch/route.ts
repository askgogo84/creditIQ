import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCards, buildRagSystemPrompt, cardToText } from '@/lib/rag'
import { getAllCards } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { currentCardId, monthlySpend, spendProfile } = await req.json()

    const allCards = await getAllCards()
    const currentCard = allCards.find((c: any) => c.id === currentCardId || c.slug === currentCardId) as any
    if (!currentCard) return NextResponse.json({ error: 'Card not found' }, { status: 400 })

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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Card switch error:', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}

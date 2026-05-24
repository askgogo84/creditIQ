import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCards, buildRagSystemPrompt } from '@/lib/rag'
import { getAllCards } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { cardId, statementData, monthlySpend } = await req.json()

    const allCards = await getAllCards()
    const card = allCards.find((c: any) => c.id === cardId || c.slug === cardId) as any
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 400 })

    const { context, devaluations } = await retrieveRelevantCards(
      'best cards for ' + (statementData?.topCategory || 'general') + ' spending',
      { topK: 6, intent: 'general' }
    )

    const systemPrompt = buildRagSystemPrompt(context, devaluations)

    const userPrompt = `Analyze this credit card statement and tell the truth about whether this card is delivering value.

CARD: ${card.name} (${card.bank})
Annual Fee: Rs.${card.annual_fee_inr ?? 0}
Base Reward Rate: ${card.base_reward_rate ?? 1}%
Category Rewards: ${JSON.stringify(card.category_rewards ?? [])}
Highlights: ${(card.highlights ?? []).join(', ')}
Recent Devaluations: ${(card.devaluations ?? []).slice(0, 3).map((d: any) => d.description).join('; ') || 'None'}

STATEMENT DATA:
Monthly Spend: Rs.${monthlySpend || 0}
${statementData ? JSON.stringify(statementData, null, 2) : 'No statement data provided'}

Give an honest assessment. Respond ONLY with valid JSON:
{
  "verdict": "delivering" | "underperforming" | "wrong-card",
  "verdictText": "One line summary",
  "score": 72,
  "monthlyEarned": 450,
  "monthlyPotential": 1200,
  "gap": 750,
  "insights": [
    "Specific insight about their spending vs card benefits",
    "Specific missed opportunity with numbers",
    "What the card is actually good at"
  ],
  "devaluationAlert": "If any recent devaluation affects this user, mention it here. Otherwise null.",
  "betterCard": "Card name if gap > Rs.500/month",
  "betterCardId": "card-slug",
  "keepOrSwitch": "keep" | "switch",
  "keepSwitchReason": "One specific reason with numbers"
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
        max_tokens: 1000,
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
    console.error('Statement truth error:', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCards, buildRagSystemPrompt } from '@/lib/rag'
import { getAllCards } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { cardId, monthlySpend, spendProfile } = await req.json()

    // Get live card data
    const allCards = await getAllCards()
    const card = allCards.find(c => c.id === cardId || c.slug === cardId) as any
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 400 })

    // RAG: get relevant comparison cards
    const { context, devaluations } = await retrieveRelevantCards(
      est cards for  Rs./month,
      { topK: 6, intent: 'general' }
    )

    const systemPrompt = buildRagSystemPrompt(context, devaluations)

    const userPrompt = Grade this card for this user:

CARD BEING GRADED:
Name:  ()
Annual Fee: Rs.
Base Reward Rate: %
Category Rewards: 
Highlights: 
Drawbacks: 
Recent Devaluations: 

USER PROFILE:
Monthly spend: Rs.
Spend pattern: 

Grade A+ to F based on value for this user. Be honest and slightly savage — entertaining but accurate.

Respond ONLY with valid JSON:
{
  "grade": "C",
  "gradeColor": "#f59e0b",
  "roast": "2-3 sentence brutal but accurate assessment. GenZ tone. Specific about what this card does wrong for their spend.",
  "monthlyEarnings": 500,
  "monthlyPotential": 1850,
  "moneyLeft": 1350,
  "improvements": [
    "Specific thing this card does badly for their spend",
    "Specific missed opportunity with numbers",
    "What a better card would give them"
  ],
  "betterCard": "Axis Magnus",
  "betterCardId": "axis-magnus",
  "shareText": "My  got a [grade] on CreditIQ. I'm leaving Rs.[amount]/month on the table! creditiq.app/card-roast"
}

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
    const clean = text.replace(/\\\json|\\\/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Card roast error:', err)
    return NextResponse.json({ error: 'Roast failed' }, { status: 500 })
  }
}

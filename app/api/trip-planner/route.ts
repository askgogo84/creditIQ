import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCards, buildRagSystemPrompt } from '@/lib/rag'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { destination, origin, travelers, budget, userCards } = await req.json()
    if (!destination) return NextResponse.json({ error: 'Missing destination' }, { status: 400 })

    const query = 'travel cards for ' + (origin || 'India') + ' to ' + destination + ' trip'
    const { context, devaluations } = await retrieveRelevantCards(query, {
      topK: 8,
      intent: 'travel',
    })

    const systemPrompt = buildRagSystemPrompt(context, devaluations)

    const userPrompt = `Plan a trip and recommend the best credit cards to maximize value.

TRIP DETAILS:
From: ${origin || 'India'}
To: ${destination}
Travelers: ${travelers || 1}
Budget: ${budget ? 'Rs.' + budget : 'Not specified'}
User already has: ${userCards?.join(', ') || 'No cards specified'}

Analyze which cards from the database will give maximum value for this trip (flights, hotels, forex, lounge access).

Respond ONLY with valid JSON:
{
  "destination": "${destination}",
  "estimatedCost": {
    "flights": 45000,
    "hotel": 30000,
    "total": 75000
  },
  "bestCards": [
    {
      "cardId": "card-slug",
      "cardName": "Card Name",
      "bank": "Bank Name",
      "whyBest": "Specific reason with numbers from the card data",
      "pointsEarned": 5000,
      "pointsValue": 8000,
      "keyBenefit": "e.g. 4 international lounge visits + 0% forex markup"
    }
  ],
  "redemptionTip": "Specific tip on how to redeem points for this destination",
  "loungeAlert": "Which cards give lounge access at departure/arrival airport if known",
  "forexTip": "Which card has lowest forex markup for this destination currency",
  "totalSavings": 12000
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
        max_tokens: 1500,
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
    console.error('Trip planner error:', err)
    return NextResponse.json({ error: 'Trip planning failed' }, { status: 500 })
  }
}

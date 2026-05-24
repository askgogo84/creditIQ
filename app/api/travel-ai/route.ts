import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCards, buildRagSystemPrompt } from '@/lib/rag'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json()
    if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 })

    const { context, devaluations } = await retrieveRelevantCards(message, {
      topK: 8,
      intent: 'travel',
    })

    const systemPrompt = buildRagSystemPrompt(context, devaluations) +
      '\n\nYou are also a travel expert. Help users plan trips using credit card points and miles. ' +
      'Always suggest specific cards from the database for travel benefits. ' +
      'For flight/hotel redemptions, use the redemption values from the card data. ' +
      'Respond in conversational JSON: { "message": "your response", "cards": ["card-slug-1"], "tip": "optional pro tip" }'

    const messages = [
      ...(history || []),
      { role: 'user', content: message },
    ]

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
        messages,
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''
    try {
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({ message: text, cards: [], tip: null })
    }
  } catch (err) {
    console.error('Travel AI error:', err)
    return NextResponse.json({ error: 'Travel AI failed' }, { status: 500 })
  }
}

import { requirePro } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCards, buildRagSystemPrompt, cardToText } from '@/lib/rag'
import { getAllCards } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const gate = await requirePro(req);
  if (!gate.ok) return gate.res;
  try {
    const { cardId, points, preference } = await req.json()
    if (!cardId) return NextResponse.json({ error: 'Missing cardId' }, { status: 400 })

    const allCards = await getAllCards()
    const card = allCards.find((c: any) => c.id === cardId || c.slug === cardId) as any
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 400 })

    const { context, devaluations } = await retrieveRelevantCards(
      'best redemption options for ' + card.name + ' points',
      { topK: 5, intent: 'general' }
    )

    const systemPrompt = buildRagSystemPrompt(context, devaluations)

    const userPrompt = 'Give the best redemption strategy for this user.\n\n' +
      'CARD: ' + card.name + ' (' + card.bank + ')\n' +
      'Points balance: ' + (points || 50000) + '\n' +
      'Preference: ' + (preference || 'any') + '\n' +
      'Redemption options available: ' + JSON.stringify(card.redemption_options || []) + '\n\n' +
      'Give specific advice on how to maximize value from these points.\n\n' +
      'Respond ONLY with valid JSON:\n' +
      '{\n' +
      '  "advice": "2-3 sentence specific strategy for maximizing these points",\n' +
      '  "topRedemption": "Best redemption option name",\n' +
      '  "topValue": 45000,\n' +
      '  "tip": "One specific actionable tip"\n' +
      '}'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Optimize error:', err)
    return NextResponse.json({ error: 'Optimization failed' }, { status: 500 })
  }
}

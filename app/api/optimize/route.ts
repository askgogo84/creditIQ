import { requirePro } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCards, buildRagSystemPrompt, cardToText } from '@/lib/rag'
import { getAllCards } from '@/lib/supabase'
import { callClaude, MODELS } from '@/lib/ai'

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

    const ai = await callClaude({
      model: MODELS.sonnet,
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })
    if (!ai.ok) {
      return NextResponse.json({ ok: false, reason: ai.reason }, { status: ai.status })
    }

    const clean = ai.text.replace(/```json/g, '').replace(/```/g, '').trim()
    let parsed: any
    try {
      parsed = JSON.parse(clean)
    } catch {
      return NextResponse.json({ ok: false, reason: 'ai_bad_response' }, { status: 502 })
    }
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Optimize error:', err)
    return NextResponse.json({ error: 'Optimization failed' }, { status: 500 })
  }
}

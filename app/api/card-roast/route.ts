import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCards, buildRagSystemPrompt, cardToText, getIgInsights } from '@/lib/rag'
import { getAllCards } from '@/lib/supabase'
import { callClaude, MODELS } from '@/lib/ai'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { cardId, monthlySpend, spendProfile } = await req.json()

    const allCards = await getAllCards()
    const card = allCards.find((c: any) => c.id === cardId || c.slug === cardId) as any
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 400 })

    const { context, devaluations } = await retrieveRelevantCards(
      'best cards for ' + (spendProfile || 'general spending') + ' Rs.' + monthlySpend + ' per month',
      { topK: 6, intent: 'general' }
    )

    const systemPrompt = buildRagSystemPrompt(context, devaluations)

    const cardInfo = cardToText(card)

    const userPrompt = 'Grade this card. If community intelligence shows devaluations or problems, lower the grade and cite them.\n\n' +
      'CARD BEING GRADED:\n' + cardInfo + '\n\n' +
      'USER PROFILE:\n' +
      'Monthly spend: Rs.' + (monthlySpend || 0) + '\n' +
      'Spend pattern: ' + (spendProfile || 'General spender') + '\n\n' +
      'Grade A+ to F based on value for this user. Be honest and slightly savage.\n\n' +
      'Respond ONLY with valid JSON:\n' +
      '{\n' +
      '  "grade": "C",\n' +
      '  "gradeColor": "#f59e0b",\n' +
      '  "roast": "2-3 sentence brutal but accurate assessment. GenZ tone.",\n' +
      '  "monthlyEarnings": 500,\n' +
      '  "monthlyPotential": 1850,\n' +
      '  "moneyLeft": 1350,\n' +
      '  "improvements": [\n' +
      '    "Specific thing this card does badly for their spend",\n' +
      '    "Specific missed opportunity with numbers",\n' +
      '    "What a better card would give them"\n' +
      '  ],\n' +
      '  "betterCard": "Axis Magnus",\n' +
      '  "betterCardId": "axis-magnus",\n' +
      '  "shareText": "My card got graded on CreditIQ. Check yours at creditiq.app/card-roast"\n' +
      '}'

    const ai = await callClaude({
      model: MODELS.sonnet,
      max_tokens: 1000,
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
    console.error('Card roast error:', err)
    return NextResponse.json({ error: 'Roast failed' }, { status: 500 })
  }
}

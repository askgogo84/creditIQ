import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCards, buildRagSystemPrompt } from '@/lib/rag'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { prompt, spends, totalSpend } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })

    const promptLower = prompt.toLowerCase()
    let intent: 'travel' | 'cashback' | 'dining' | 'fuel' | 'shopping' | 'general' = 'general'
    if (promptLower.includes('travel') || promptLower.includes('flight') || promptLower.includes('lounge')) {
      intent = 'travel'
    } else if (promptLower.includes('cashback') || promptLower.includes('cash back')) {
      intent = 'cashback'
    } else if (promptLower.includes('dining') || promptLower.includes('restaurant')) {
      intent = 'dining'
    } else if (promptLower.includes('fuel') || promptLower.includes('petrol')) {
      intent = 'fuel'
    } else if (promptLower.includes('shopping') || promptLower.includes('online')) {
      intent = 'shopping'
    }

    const { context, devaluations } = await retrieveRelevantCards(prompt, {
      topK: 10,
      intent,
      maxFee: spends?.maxFee,
    })

    const systemPrompt = buildRagSystemPrompt(context, devaluations)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic error:', err)
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Spend optimizer error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

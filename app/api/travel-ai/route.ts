import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCards, buildRagSystemPrompt } from '@/lib/rag'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    let message: string
    let history: any[] = []

    if (body.messages && Array.isArray(body.messages)) {
      const msgs = body.messages
      const lastUser = [...msgs].reverse().find((m: any) => m.role === 'user')
      message = lastUser?.content ?? ''
      history = msgs.slice(0, -1)
    } else {
      message = body.message ?? ''
      history = body.history ?? []
    }

    if (!message.trim()) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    const { context, devaluations } = await retrieveRelevantCards(message, {
      topK: 8,
      intent: 'travel',
    })

    const systemPrompt = buildRagSystemPrompt(context, devaluations) + `\n\nTRAVEL AI LOUNGE FACTS (verified May 2026 - use these, never say 0 visits):\n- Axis Magnus: Unlimited international Priority Pass + unlimited domestic (spend-gated Rs.50K/quarter since May 2024)\n- HDFC Infinia: Unlimited domestic + international Priority Pass, no spend gate\n- ICICI Emeralde: Unlimited domestic + international lounge access\n- HDFC Regalia Gold: 12 domestic + 6 international per year (spend-gated Rs.1L/quarter since Dec 2023)\n- SBI Elite: 8 domestic (2/quarter, no spend gate) + 6 international Priority Pass per year\n- ICICI Sapphiro: 4 domestic/quarter (spend-gated Rs.75K) + 2 international per year\n- Axis Reserve: Unlimited domestic + international Priority Pass\n- HDFC Diners Black: Unlimited domestic + international via Diners network\nRULE: If lounge data shows 0 or missing, NEVER say '0 visits'. Say: 'Please verify current lounge benefits directly with the bank as benefits change frequently.'\nAlways add caveat: Benefits subject to change - verify with bank before travel.` +
      '\n\nYou are a travel expert for Indian credit card holders. Help users plan trips using credit card points and miles. ' +
      'Suggest specific cards for travel benefits. Keep answers concise and helpful. Plain text only, no JSON.'

    const messages = [
      ...history,
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
        max_tokens: 600,
        system: systemPrompt,
        messages,
      }),
    })

    const data = await response.json()
    const reply = data.content?.[0]?.text ?? 'Sorry, I could not get a response.'

    return NextResponse.json({ reply, message: reply })
  } catch (err) {
    console.error('Travel AI error:', err)
    return NextResponse.json({ error: 'Travel AI failed' }, { status: 500 })
  }
}

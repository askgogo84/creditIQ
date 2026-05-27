import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCards, buildRagSystemPrompt } from '@/lib/rag'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { prompt, spends, totalSpend } = await req.json()
    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })

    // Detect intent from actual spend categories (not just prompt text)
    const spendKeys = Object.keys(spends || {}).filter(k => parseInt(spends[k]) > 0)
    const promptLower = prompt.toLowerCase()

    let intent: 'travel' | 'cashback' | 'dining' | 'fuel' | 'shopping' | 'general' = 'general'

    // Priority: highest spend category determines intent
    const spendAmounts = spendKeys.map(k => ({ key: k, amount: parseInt(spends[k]) || 0 }))
    spendAmounts.sort((a, b) => b.amount - a.amount)
    const topSpendKey = spendAmounts[0]?.key || ''

    if (topSpendKey === 'travel' || promptLower.includes('travel') || promptLower.includes('flight') || promptLower.includes('lounge')) {
      intent = 'travel'
    } else if (topSpendKey === 'dining' || promptLower.includes('dining') || promptLower.includes('restaurant')) {
      intent = 'dining'
    } else if (topSpendKey === 'fuel' || promptLower.includes('fuel') || promptLower.includes('petrol')) {
      intent = 'fuel'
    } else if (topSpendKey === 'shopping' || promptLower.includes('shopping') || promptLower.includes('online')) {
      intent = 'shopping'
    } else if (promptLower.includes('cashback') || promptLower.includes('cash back')) {
      intent = 'cashback'
    }

    // Increase topK to surface more card options for the AI to choose from
    const { context, devaluations } = await retrieveRelevantCards(prompt, {
      topK: 20,  // was 10 — doubled to see more cards
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
        max_tokens: 3000,  // was 2000 — more room for 5 cards
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

    // Robust JSON extraction — handles cases where AI wraps in markdown
    let clean = text.trim()
    // Strip markdown code fences if present
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    // Find the first { and last } to extract just the JSON object
    const firstBrace = clean.indexOf('{')
    const lastBrace = clean.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.substring(firstBrace, lastBrace + 1)
    }

    const parsed = JSON.parse(clean)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Spend optimizer error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

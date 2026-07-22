import { NextRequest, NextResponse } from 'next/server'
import { retrieveRelevantCards, buildRagSystemPrompt } from '@/lib/rag'
import { callClaude, MODELS } from '@/lib/ai'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
// Real 5-card output runs ~18s with no maxDuration guard — one slow generation
// from the same 504 that hit points-optimizer. Defensive headroom.
export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit(req, 'spend-optimizer')
    if (!rl.ok) return rl.res

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

    // buildRagSystemPrompt is prose-oriented (shared with /api/assistant, which wants
    // prose). This route JSON.parse()s the reply, so pin the output format here at the
    // route level — insurance against a rare prose reply. Scoped to this route only.
    const systemPrompt = buildRagSystemPrompt(context, devaluations) +
      '\n\nOUTPUT FORMAT: Respond with valid JSON ONLY, exactly matching the schema in the user message. No markdown, no code fences, no prose before or after the JSON.'

    const ai = await callClaude({
      model: MODELS.sonnet,
      max_tokens: 3000,  // was 2000 — more room for 5 cards
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    })
    if (!ai.ok) {
      return NextResponse.json({ ok: false, reason: ai.reason }, { status: ai.status })
    }

    // Robust JSON extraction — handles cases where AI wraps in markdown
    let clean = ai.text.trim()
    // Strip markdown code fences if present
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
    // Find the first { and last } to extract just the JSON object
    const firstBrace = clean.indexOf('{')
    const lastBrace = clean.lastIndexOf('}')
    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.substring(firstBrace, lastBrace + 1)
    }

    let parsed: any
    try {
      parsed = JSON.parse(clean)
    } catch {
      return NextResponse.json({ ok: false, reason: 'ai_bad_response' }, { status: 502 })
    }
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('Spend optimizer error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

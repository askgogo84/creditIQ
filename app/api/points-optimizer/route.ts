import { requirePro } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { callClaude, MODELS } from '@/lib/ai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const gate = await requirePro(req);
  if (!gate.ok) return gate.res;
  try {
    const { prompt, card, points, goal } = await req.json();

    if (!prompt) return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });

    const ai = await callClaude({
      model: MODELS.sonnet,
      max_tokens: 2000,
      system: `You are CreditIQ's points redemption expert specialising in Indian credit cards.
You know the exact transfer partners, ratios, and redemption rules for all major Indian cards.
You ALWAYS respond with valid JSON only — no markdown, no code fences, no explanation outside the JSON structure.
Your redemption valuations must be realistic for Indian travellers booking in INR.`,
      messages: [{ role: 'user', content: prompt }],
    });
    if (!ai.ok) {
      return NextResponse.json({ ok: false, reason: ai.reason }, { status: ai.status });
    }

    // Robust JSON extraction
    let clean = ai.text.trim();
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const firstBrace = clean.indexOf('{');
    const lastBrace = clean.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      clean = clean.substring(firstBrace, lastBrace + 1);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ ok: false, reason: 'ai_bad_response' }, { status: 502 });
    }
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Points optimizer error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

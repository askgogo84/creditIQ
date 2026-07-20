import { requireAuth } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { callClaude, MODELS } from '@/lib/ai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;
  try {
    const { cardId, points, recommendations } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ advice: 'Configure ANTHROPIC_API_KEY for AI advice.' });
    }

    // Build ranked redemption context
    const rankedPaths = recommendations
      .slice(0, 5)
      .map((r: any, i: number) => `${i + 1}. ${r.option.partner || r.option.type}  --  Rs.${r.inr_value.toLocaleString('en-IN')} (Rs.${r.option.value_per_point_inr.toFixed(2)}/pt)`)
      .join('\n');

    const topOption = recommendations[0];
    const topPartner = topOption?.option?.partner || topOption?.option?.type || 'unknown';
    const topValue = topOption?.inr_value || 0;
    const worstOption = recommendations[recommendations.length - 1];
    const worstValue = worstOption?.inr_value || 0;
    const valueDiff = topValue - worstValue;

    const prompt = `You are CreditIQ's points strategy advisor. Give SPECIFIC, ACTIONABLE advice for THIS card and these exact points.

Card: ${cardId}
Points balance: ${points.toLocaleString('en-IN')} points

Ranked redemption paths (from our data engine  --  these are the actual options available):
${rankedPaths}

CRITICAL RULES:
1. The #1 ranked option above IS the mathematically best option. DO NOT contradict this ranking.
2. If #1 is ${topPartner} at Rs.${topValue.toLocaleString('en-IN')}, your advice must align with this being the top choice.
3. Give card-SPECIFIC advice  --  different cards have different transfer partners, expiry rules, and sweet spots.
4. Be specific about this card's ecosystem (e.g. HDFC -> SmartBuy/KrisFlyer/InterMiles, Axis -> Vistara/EDGE Rewards, SBI -> Air India, IDFC -> no transfer partners, etc.)
5. Mention the value difference of Rs.${valueDiff.toLocaleString('en-IN')} between best and worst option.
6. Keep it to 3-4 focused paragraphs. No generic advice. No repeating the ranked list.
7. End with ONE clear action to take right now.

Write as a sharp, opinionated advisor who knows Indian credit card rewards deeply.`;

    const ai = await callClaude({
      model: MODELS.sonnet,
      max_tokens: 600,
      system: 'You are CreditIQ\'s points strategy advisor. You give sharp, card-specific, actionable advice. You NEVER contradict the ranked redemption data provided. Your top recommendation must always match the #1 ranked option in the data.',
      messages: [{ role: 'user', content: prompt }],
    });
    if (!ai.ok) {
      return NextResponse.json({ advice: 'AI strategy unavailable. See redemption paths above for best option.' });
    }

    const advice = ai.text || 'Unable to generate strategy.';
    return NextResponse.json({ advice });
  } catch (err) {
    console.error('Redemption AI error:', err);
    return NextResponse.json({ advice: 'AI strategy unavailable. See redemption paths above for best option.' });
  }
}

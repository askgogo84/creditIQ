import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { buildRedemptionPrompt } from '@/lib/redemption';
import type { RedemptionRecommendation } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { cardId, points, recommendations } = (await req.json()) as {
      cardId: string;
      points: number;
      recommendations: RedemptionRecommendation[];
    };

    const card = SEED_CARDS.find((c) => c.id === cardId);
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    if (!process.env.ANTHROPIC_API_KEY) {
      // Fallback rule-based advice when no API key configured
      const best = recommendations[0];
      const worst = recommendations[recommendations.length - 1];
      const fallback = `For ${points.toLocaleString('en-IN')} points on the ${card.name}, your best path is ${best?.option.partner || best?.option.type} at â‚¹${best?.inr_value.toLocaleString('en-IN')} â€” ${(best?.option.value_per_point_inr || 0).toFixed(2)}/point.

Avoid ${worst?.option.partner || worst?.option.type} (only â‚¹${worst?.inr_value.toLocaleString('en-IN')}) â€” you'd lose â‚¹${((best?.inr_value || 0) - (worst?.inr_value || 0)).toLocaleString('en-IN')} versus the best option.

${best?.option.notes ?? ''}

(Configure ANTHROPIC_API_KEY for full AI strategy with sweet-spot routes and partner promo intel.)`;
      return NextResponse.json({ advice: fallback });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = buildRedemptionPrompt(card, points, recommendations);

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const advice = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as any).text)
      .join('\n');

    return NextResponse.json({ advice });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


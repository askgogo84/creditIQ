import { NextRequest, NextResponse } from 'next/server';
import { SEED_CARDS } from '@/lib/data/seed-cards';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { cardId, monthlySpend, spendProfile } = await req.json();
    const card = SEED_CARDS.find(c => c.id === cardId) as any;
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 400 });

    const prompt = `You are CreditIQ's brutally honest card grader. Grade this credit card for this user.

Card: ${card.name} (${card.bank})
Annual fee: Rs.${card.annual_fee_inr ?? 0}
Base reward rate: ${card.base_reward_rate ?? 1}%
User monthly spend: Rs.${monthlySpend.toLocaleString('en-IN')}
Spend profile: ${spendProfile || 'General spender'}

Grade the card A+ to F based on value delivered for this spend level. Be honest and slightly savage — this is meant to be entertaining but accurate.

Respond ONLY with valid JSON:
{
  "grade": "C",
  "gradeColor": "#f59e0b",
  "roast": "2-3 sentence savage but accurate assessment of this card for this user. Be specific about what the card does wrong for their spend level. GenZ friendly tone.",
  "monthlyEarnings": 500,
  "monthlyPotential": 1850,
  "moneyLeft": 1350,
  "improvements": [
    "Specific thing this card does badly for their spend",
    "Specific missed opportunity",
    "What a better card would give them"
  ],
  "betterCard": "Axis Magnus",
  "betterCardId": "axis-magnus",
  "shareText": "My [card name] got a [grade] on CreditIQ. I'm leaving Rs.[amount]/month on the table! Check yours at creditiq.app/card-roast"
}

Grade guidelines:
A+/A: Excellent card, right fit for this spend level, earning 80%+ of maximum possible
B: Good card, some missed opportunities, earning 60-80% of potential  
C: Mediocre fit, earning 40-60% of potential, clear better alternatives exist
D: Poor fit, earning 20-40% of potential, user should switch
F: Wrong card entirely, earning under 20% of potential rewards

For betterCardId use one of: hdfc-infinia, hdfc-regalia-gold, hdfc-millenia, axis-magnus, axis-privilege, sbi-cashback, idfc-first, scapia, icici-amazon-pay, au-zenith`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'You are CreditIQ\'s card grader. Respond with valid JSON only. Be honest, slightly savage, accurate.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Card roast error:', err);
    return NextResponse.json({ error: 'Roast failed' }, { status: 500 });
  }
}

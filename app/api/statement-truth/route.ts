import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { base64Pdf, cardName } = await req.json();

    if (!base64Pdf) {
      return NextResponse.json({ error: 'No PDF provided' }, { status: 400 });
    }

    const prompt = `You are CreditIQ's Statement Truth Analyzer. Analyze this credit card statement PDF and compare actual rewards earned vs what the bank advertises.

Card name (if provided): ${cardName || 'Unknown — detect from statement'}

Extract:
1. Card name and bank
2. Statement period
3. Total spend by category
4. Total reward points/cashback actually earned
5. Compare to typical advertised rates for this card

Then calculate the "truth gap" — how much the user actually earned vs what they should have earned based on advertised rates.

Respond ONLY with valid JSON:
{
  "cardName": "HDFC Regalia Gold",
  "bank": "HDFC Bank", 
  "period": "April 2026",
  "totalSpend": 85000,
  "totalRewardsEarned": 850,
  "advertisedRate": 3.3,
  "actualRate": 1.2,
  "gapPercent": 2.1,
  "totalMoneyLeft": 1785,
  "categoryBreakdown": [
    {
      "category": "dining",
      "spend": 15000,
      "rewardsEarned": 150,
      "advertisedRate": 5.0,
      "actualRate": 1.0,
      "moneyLeft": 600
    }
  ],
  "verdict": "Your bank paid you 63% LESS than advertised",
  "verdictColor": "red",
  "bestAlternative": "Based on your spend pattern, Axis Magnus would have earned you Rs.2,890 this month vs your actual Rs.1,020 — a Rs.1,870 difference.",
  "insight": "The main gap is on dining — HDFC Regalia caps dining rewards at 2X on non-SmartBuy partners. You spent Rs.15,000 at restaurants that don't qualify for the advertised 5X rate."
}

verdictColor must be: "red" (actual < 60% of advertised), "amber" (60-85%), "green" (85%+)`;

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
        system: 'You are CreditIQ\'s Statement Truth Analyzer. Respond with valid JSON only.',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64Pdf,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Statement truth error:', err);
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }
}

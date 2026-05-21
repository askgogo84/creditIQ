import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { prompt, spends, totalSpend } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

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
        system: `You are CreditIQ's unbiased AI card recommendation engine for India. You have deep knowledge of all major Indian credit cards — HDFC, Axis, SBI, ICICI, Amex, IDFC First, Kotak, Yes Bank, AU Small Finance, RBL, IndusInd.

You always respond with ONLY valid JSON — no markdown, no explanation, no text outside the JSON object. Your reward estimates are realistic and based on actual published card reward rates. You are never biased toward any bank.`,
        messages: [
          {
            role: 'user',
            content: prompt,
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

    let parsed;
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      console.error('JSON parse error:', text);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Spend optimizer error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

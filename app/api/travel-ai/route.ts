import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Missing messages' }, { status: 400 });
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
        system: `You are CreditIQ's Travel AI advisor — an expert on Indian credit card travel benefits, award redemptions, airline miles, hotel points, and lounge access.

You help users maximize their credit card points for travel. You know HDFC, Axis, SBI, ICICI, Amex, IDFC First, Kotak cards inside out — their reward rates, transfer partners, lounge access policies, forex markup fees.

Be specific, actionable, and honest. Use real numbers. Format responses clearly with headings and bullet points for easy reading. Always mention the best and worst options so users can make informed decisions.`,
        messages: messages.map((m: Message) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return NextResponse.json({ error: 'AI request failed' }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text;

    if (!reply) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 });
    }

    return NextResponse.json({ reply });

  } catch (err) {
    console.error('Travel AI error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

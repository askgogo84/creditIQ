import { NextRequest, NextResponse } from 'next/server';
import { retrieveRelevantCards, buildRagSystemPrompt } from '@/lib/rag';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();
    if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 });

    const { context, devaluations } = await retrieveRelevantCards(message, {
      topK: 6,
      intent: 'general',
    });

    const systemPrompt = buildRagSystemPrompt(context, devaluations) +
      `\n\nYou are the CreditIQ Assistant — India's most honest credit card advisor.
You help users find the best credit card for any merchant, category, or spend pattern.
You have zero bank bias — you are not paid by any bank.

When asked "best card for X":
1. Give a direct answer with the top 1-2 cards
2. Explain WHY briefly (reward rate, category bonus, etc.)
3. Mention the key benefit in rupees/points where possible

Keep responses SHORT — 2-4 sentences max. Be direct and specific.
Never recommend a card you don't have data on.
Always mention if a card has had recent devaluations.

If the user asks about booking/ordering (Swiggy, Zara, Amazon etc.), focus on:
- Which card gives most cashback/points for that specific merchant
- Any 10X or category bonuses
- Relevant offers if known`;

    const messages = [
      ...(history || []).slice(-6),
      { role: 'user', content: message },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text ?? 'Sorry, I could not get a response.';

    return NextResponse.json({ message: text });
  } catch (err) {
    console.error('Assistant error:', err);
    return NextResponse.json({ error: 'Assistant failed' }, { status: 500 });
  }
}

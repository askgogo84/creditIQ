import { NextRequest, NextResponse } from 'next/server';
import { retrieveRelevantCards, buildRagSystemPrompt } from '@/lib/rag';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Accept BOTH {message, history} (web) and {messages:[{role,content}]} (mobile)
    let message = body.message;
    let history = body.history || [];
    if (!message && Array.isArray(body.messages) && body.messages.length) {
      const msgs = body.messages;
      message = msgs[msgs.length - 1]?.content;
      history = msgs.slice(0, -1).map((m: any) => ({ role: m.role, content: m.content }));
    }
    if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 });

    const { context, devaluations, igInsights } = await retrieveRelevantCards(message, {
      topK: 6,
      intent: 'general',
    });

    const systemPrompt = buildRagSystemPrompt(context, devaluations, igInsights) +
      `\n\nYou are the CreditIQ Assistant  --  India's most honest credit card advisor.
You help users find the best credit card for any merchant, category, or spend pattern.
You have zero bank bias  --  you are not paid by any bank.

IMPORTANT RULES:
- Respond in plain conversational text ONLY. Never use JSON format.
- Never output code blocks or backticks.
- Keep responses SHORT -- 2-4 sentences max unless complex.
- Be direct and specific with card names and numbers.
- Use Rs. for rupee amounts.
- TRAVEL CTA RULE: If the answer involves award flights, transfer partners, miles redemption, or booking flights on points, ALWAYS end with a travel link on a new line. Build the link URL with the user's destination and context pre-filled as a query param, like: → [Check live award availability](/travel?q=Bangkok+flights+next+week+Vistara+miles) — use the actual destination/airline/points from the conversation. This auto-fills the Travel AI search so users don't have to retype anything.

When asked "best card for X":
1. Name the top 1-2 cards directly
2. Give the key benefit (reward rate, cashback %, category bonus)
3. One sentence on why

Examples of good responses:
"For Amazon, the Amazon Pay ICICI card gives 5% cashback (up to Rs.500/month) with no annual fee. Best free card for Amazon shopping."
"For Swiggy, the HDFC Millennia gives 5% cashback on food delivery apps with a Rs.1,000/quarter spend requirement."`;

    const messages = [
      ...(history || []).slice(-6),
      { role: 'user', content: message },
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages,
      }),
    });

    clearTimeout(timeout);
    const data = await response.json();
    let text = data.content?.[0]?.text ?? 'Sorry, I could not get a response.';

    // Strip any JSON blocks if they sneak through
    text = text.replace(/```json[\s\S]*?```/g, '').trim();
    text = text.replace(/```[\s\S]*?```/g, '').trim();

    return NextResponse.json({ message: text });
  } catch (err) {
    console.error('Assistant error:', err);
    return NextResponse.json({ error: 'Assistant failed' }, { status: 500 });
  }
}

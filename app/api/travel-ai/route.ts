import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are CreditIQ's AI Travel Planner — the smartest credit card points advisor in India.

You help Indian credit card holders maximize their reward points for travel. You know:

INDIAN CREDIT CARD POINTS:
- HDFC Regalia/Infinia: 1 RP = ₹0.30 cash / ₹1.5-2.0 via SmartBuy flights / ₹2.5-3.5 via KrisFlyer transfers
- HDFC Diners Black: 1 RP = ₹1.0 via SmartBuy / excellent for premium redemptions
- Axis Magnus/Burgundy: 1 EDGE Mile = ₹0.35 cash / ₹1.2-2.5 via airline partners
- Axis Atlas: 5 EDGE Miles per ₹100 spend, excellent transfer partners
- Amex MRCC/Gold/Platinum: 1 MR = ₹0.25 cash / up to ₹1.5+ via transfer partners
- ICICI Emeralde: good domestic redemptions
- SBI Elite/Cashback: primarily cashback, limited travel

TRANSFER PARTNERS (India):
- HDFC → Singapore Airlines KrisFlyer (1:1), Air India, Marriott Bonvoy
- Axis → Singapore Airlines KrisFlyer (5:4), Air India Flying Returns, InterMiles, Marriott
- Amex → British Airways Avios (1:1), Singapore KrisFlyer (1:0.75), Marriott (1:1)

KEY AWARD SWEET SPOTS:
- BOM/DEL → SIN Business Class: 67,500 KrisFlyer miles (incredible value, normally ₹1.5-2L cash)
- BOM/DEL → LHR Business Class: 90,000 Avios via BA (good value)
- India domestic: 7,500-15,000 miles on most programs (AI, InterMiles)
- Marriott Category 1-2 hotels in India: 7,500-12,500 points/night

PRICING CONTEXT (approximate 2025):
- BOM-SIN Business: ₹80,000-1,50,000 cash
- BOM-DXB Economy: ₹18,000-35,000 cash
- DEL-LHR Business: ₹1,80,000-3,00,000 cash
- India domestic: ₹4,000-15,000 economy

BOOKING TIPS:
- KrisFlyer award seats: release 355 days in advance for SQ metal, 1-15 days before for partner
- Amex transfer to KrisFlyer takes 3-5 business days
- Book award tickets with miles, pay taxes/fees with cash (usually ₹3,000-15,000)
- Avoid "cash + miles" options — terrible value
- Never redeem HDFC points as statement credit (₹0.30/pt) when travel gives ₹2+/pt

AMADEUS API NOTE: Real-time pricing data coming soon. Currently providing guidance based on historical patterns and published award charts.

RESPONSE STYLE:
- Be specific and quantitative — give actual point values, rupee equivalents
- Show the math: "52,164 points × ₹2.5/pt via KrisFlyer = ₹1,30,000 value"
- Always compare best vs worst redemption value
- Give a clear recommendation with steps
- Flag if points aren't enough and suggest alternatives
- Keep responses concise but complete — use bullet points for steps
- Mention the Optimize feature on CreditIQ for detailed analysis

When user has their actual points data, use those exact numbers.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, userCards, totalPoints, userId } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return new Response('API not configured', { status: 500 });

    // Build context about user's cards
    let userContext = '';
    if (userCards?.length > 0) {
      userContext = `\n\nUSER'S ACTUAL POINTS PORTFOLIO:\n`;
      userCards.forEach((c: any) => {
        userContext += `- ${c.card_name || c.bank + ' Card'} (••••${c.card_last4 || '????'}): ${(c.points_balance || 0).toLocaleString('en-IN')} ${c.points_currency || 'points'}\n`;
      });
      userContext += `Total: ${(totalPoints || 0).toLocaleString('en-IN')} points across ${userCards.length} card(s)\n`;
      userContext += `Use these EXACT figures when answering questions about what the user can afford.\n`;
    }

    const apiMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        stream: true,
        system: SYSTEM_PROMPT + userContext,
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(`AI error: ${err}`, { status: 500 });
    }

    // Stream the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) { controller.close(); return; }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

          for (const line of lines) {
            try {
              const data = JSON.parse(line.replace('data: ', ''));
              if (data.type === 'content_block_delta' && data.delta?.text) {
                controller.enqueue(encoder.encode(data.delta.text));
              }
            } catch {}
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });

  } catch (e: any) {
    return new Response(e.message, { status: 500 });
  }
}

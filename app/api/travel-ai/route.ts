import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const maxDuration = 30;

const SYSTEM_PROMPT = `You are CreditIQ's AI Travel Planner — India's smartest credit card points advisor.

You help Indian credit card holders maximize reward points for travel. You know:

INDIAN CREDIT CARD POINTS VALUES:
- HDFC Regalia/Infinia: 1 RP = ₹0.30 cash / ₹1.5-2.0 via SmartBuy flights / ₹2.5-3.5 via KrisFlyer transfers
- HDFC Diners Black: 1 RP = ₹1.0 via SmartBuy / excellent premium redemptions
- Axis Magnus/Burgundy: 1 EDGE Mile = ₹0.35 cash / ₹1.2-2.5 via airline partners
- Amex MRCC/Gold/Platinum: 1 MR = ₹0.25 cash / up to ₹1.5+ via transfer partners
- SBI/ICICI: primarily cash, limited travel value

TRANSFER PARTNERS (India cards):
- HDFC → Singapore Airlines KrisFlyer (1:1), Air India Flying Returns, Marriott Bonvoy
- Axis → Singapore Airlines KrisFlyer (5:4), Air India, InterMiles, Marriott
- Amex → British Airways Avios (1:1), Singapore KrisFlyer (1:0.75), Marriott (1:1)

KEY AWARD SWEET SPOTS:
- BOM/DEL → SIN Business Class: 67,500 KrisFlyer miles (worth ₹1.2-2L in cash)
- BOM/DEL → LHR Business: 90,000 Avios via BA
- India domestic: 7,500-15,000 miles on AI/InterMiles
- Marriott Category 1-2 India hotels: 7,500-12,500 pts/night

BOOKING TIPS:
- KrisFlyer award seats: open 355 days out on SQ metal, 1-15 days before on partners
- Amex → KrisFlyer transfer: 3-5 business days
- Always pay taxes in cash (₹3,000-15,000), never use miles for fees
- Avoid cash+miles options — terrible value
- Never redeem HDFC as statement credit (₹0.30/pt) when travel gives ₹2+/pt

PRICING CONTEXT (2025-26):
- BOM-SIN Business: ₹80,000-1,50,000 cash
- BOM-DXB Economy: ₹18,000-35,000
- DEL-LHR Business: ₹1,80,000-3,00,000
- India domestic: ₹4,000-15,000

RESPONSE FORMAT:
- Be specific — give exact point amounts, rupee values, math
- Show: "52,164 pts × ₹2.5 via KrisFlyer = ₹1,30,000 value"
- Always show best vs worst redemption comparison
- Give step-by-step booking instructions
- Use bullet points for clarity
- Keep responses focused and actionable`;

export async function POST(req: NextRequest) {
  try {
    const { messages, userCards, totalPoints } = await req.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API not configured' }, { status: 500 });

    // Build user context
    let userContext = '';
    if (userCards?.length > 0) {
      userContext = '\n\nUSER PORTFOLIO:\n';
      userCards.forEach((c: any) => {
        userContext += `- ${c.card_name || c.bank + ' Card'} ••••${c.card_last4 || '????'}: ${(c.points_balance || 0).toLocaleString('en-IN')} ${c.points_currency || 'points'}\n`;
      });
      userContext += `Total: ${(totalPoints || 0).toLocaleString('en-IN')} points across ${userCards.length} card(s)\n`;
      userContext += 'Use these exact figures in your answer.\n';
    }

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
        system: SYSTEM_PROMPT + userContext,
        messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `API error ${response.status}`);

    const text = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
    return NextResponse.json({ response: text });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

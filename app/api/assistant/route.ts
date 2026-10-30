import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { retrieveRelevantCards, buildRagSystemPrompt } from '@/lib/rag';
import { callAI } from '@/lib/ai';
import { rateLimit } from '@/lib/rate-limit';
import { callerId } from '@/lib/api-auth';
import { rankedWalletIntelligence, walletIntelligencePrompt } from '@/lib/intelligence/wallet-intelligence';
import { ciraCanonicalTravelContext } from '@/lib/redemption-rails/cira-context';

export const runtime = 'nodejs';
export const maxDuration = 60;

// A whole-wallet value is not an output of the booking-specific redemption engine.
// Keep this product explanation deterministic rather than asking a model to invent rates.
function walletValueMessage(message: string) {
  if (!(/\bwallet\b/i.test(message) && /\b(value|worth|rupees?|valuation)\b/i.test(message))) return null;
  return [
    'Your wallet shows reward points because CreditIQ does not have a verified single rupee value for the whole wallet. Points in different programmes are not interchangeable, and their value depends on the specific redemption. Statement or linked balances and self-entered balances keep their source labels.',
    'For a hotel comparison, choose the property, dates, room and guests; obtain a current cash price including taxes and a confirmed points quote. The comparison also needs your card and programme balances, current eligibility, transfer ratio, minimum and increment, any fees and, where required, a current exchange rate. Missing information stays unknown rather than being filled with a fallback value.',
    'A booking comparison is separate from a whole-wallet valuation. Confirm availability and the final price directly before transferring points or paying.',
    '→ [Compare a hotel stay](/hotels)',
  ].join('\n\n');
}

function fallbackMessage(raw: unknown) {
  const message = String(raw || '').trim();
  const q = message.toLowerCase();

  if (/hotel|stay|marriott|hilton|ihg|accor|hyatt|taj|itc/.test(q)) {
    return [
      'I can still help with this even while the AI model is temporarily unavailable.',
      'Open Hotels, choose the property first, then compare cash versus the loyalty programme. Treat cached points as discovery only and verify the live award price before transferring any bank points.',
      '→ [Open Hotels](/hotels)',
    ].join('\n');
  }

  if (/flight|trip|travel|singapore|dubai|bangkok|miles|award|points/.test(q)) {
    return [
      'I can still help plan this trip even while the AI model is temporarily unavailable.',
      'Open Travel and search the exact route/date. CreditIQ will reduce the result to one of three actions: Pay cash, Use points, or Verify award first. If it says Verify award first, do not transfer points yet.',
      '→ [Open Travel](/trip-planner)',
    ].join('\n');
  }

  if (/amazon|swiggy|merchant|purchase|spend|card/.test(q)) {
    return [
      'Card recommendations are temporarily unavailable while the AI service is unavailable.',
      'You can retry Spend Smart for a catalogue comparison of monthly spending. Results may include cards you do not own and remain estimates to verify with the issuer.',
      '→ [Open Spend Smart](/spend-optimizer)',
    ].join('\n');
  }

  return [
    'CIRA is temporarily running in safe fallback mode because the AI provider is unavailable.',
    'You can still view Wallet and search Travel or Hotels. AI card comparisons may also be temporarily unavailable.',
  ].join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const rl = await rateLimit(req, 'assistant');
    if (!rl.ok) return rl.res;

    const body = await req.json();
    let message = body.message;
    let history = body.history || [];
    if (!message && Array.isArray(body.messages) && body.messages.length) {
      const msgs = body.messages;
      message = msgs[msgs.length - 1]?.content;
      history = msgs.slice(0, -1).map((m: any) => ({ role: m.role, content: m.content }));
    }
    if (typeof message !== 'string' || !message.trim()) return NextResponse.json({ error: 'Missing message' }, { status: 400 });
    const explanation = walletValueMessage(message);
    if (explanation) return NextResponse.json({ ok: true, provider: null, message: explanation });
    history = Array.isArray(history) ? history.filter((item: any) => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string') : [];

    const { context, devaluations, igInsights, sourced } = await retrieveRelevantCards(message, {
      topK: 6,
      intent: 'general',
    });

    let personalisedIntel = '';
    try {
      const userId = await callerId(req);
      if (userId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { persistSession: false } },
        );
        const { ranked } = await rankedWalletIntelligence(sb, userId, 40);
        personalisedIntel = walletIntelligencePrompt(ranked, 8);
      }
    } catch (error) {
      console.error('CIRA wallet intelligence context failed', error);
    }

    const canonicalTravel = ciraCanonicalTravelContext(String(message));
    const systemPrompt = buildRagSystemPrompt(context, devaluations, igInsights, sourced) + personalisedIntel + canonicalTravel +
      `\n\nYou are the CreditIQ Assistant -- India's most honest credit card advisor.
You help users find the best credit card for any merchant, category, or spend pattern.
You have zero bank bias.

IMPORTANT RULES:
- Respond in plain conversational text ONLY. Never use JSON format.
- Never output code blocks or backticks.
- Keep responses SHORT -- 2-4 sentences max unless complex.
- Use card names, rates, ratios and eligibility claims only when supported by the supplied evidence. Do not supply generic rupee-per-point ranges from memory.
- Missing evidence does not mean a card has no transfer partners. Say what needs verification; do not invent either eligibility or exclusions.
- A booking-specific comparison is not a whole-wallet valuation. Never convert the wallet total using a generic per-point constant.
- Use Rs. for rupee amounts.
- If CANONICAL TRAVEL RAILS is present, it outranks generic/community context.
- If PERSONALISED WALLET INTELLIGENCE is present, prioritise cards/programmes the user can actually reach.
- For travel, never recommend an irreversible transfer until live award space, transfer ratio, timing and final price are verified.`;

    const messages = [
      ...(history || []).slice(-6),
      { role: 'user', content: message },
    ];

    const ai = await callAI({
      max_tokens: 1000,
      system: systemPrompt,
      messages,
      timeoutMs: 15000,
    });

    if (!ai.ok) {
      console.warn('CIRA entering safe fallback mode', ai.reason, ai.detail || '');
      return NextResponse.json({
        ok: true,
        degraded: true,
        message: fallbackMessage(message),
      });
    }

    let text = ai.text || fallbackMessage(message);
    text = text.replace(/```json[\s\S]*?```/g, '').trim();
    text = text.replace(/```[\s\S]*?```/g, '').trim();

    return NextResponse.json({ ok: true, provider: ai.provider || null, message: text });
  } catch (err) {
    console.error('Assistant error:', err);
    return NextResponse.json({
      ok: true,
      degraded: true,
      message: fallbackMessage(''),
    });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { callerId } from '@/lib/api-auth';
export const runtime = 'nodejs';

const SMS_PATTERNS = [
  { bank: 'HDFC', senders: ['HDFCBK', 'HDFCCC', 'HDFC'], pattern: /(?:total|available)?\s*(?:reward\s*)?points?\s*(?:balance|bal)?[:\s]+(\d[\d,]+)/i, type: 'balance' },
  { bank: 'HDFC', senders: ['HDFCBK', 'HDFCCC'], pattern: /(\d[\d,]+)\s*(?:reward\s*)?points?\s*(?:credited|earned|added)/i, type: 'earned' },
  { bank: 'Axis', senders: ['AXISCC', 'AXISBK', 'AXIS'], pattern: /(?:total\s*)?edge\s*(?:miles?|points?)\s*[:\s]+(\d[\d,]+)/i, type: 'balance' },
  { bank: 'Axis', senders: ['AXISCC'], pattern: /(\d[\d,]+)\s*edge\s*miles?\s*(?:credited|earned|added|on)/i, type: 'earned' },
  { bank: 'AmEx', senders: ['AMEXIN', 'AMEX'], pattern: /mr\s*(?:points?)?\s*(?:balance|bal)[:\s]+(\d[\d,]+)/i, type: 'balance' },
  { bank: 'AmEx', senders: ['AMEXIN'], pattern: /(\d[\d,]+)\s*membership\s*rewards?\s*points?\s*(?:have been\s*)?(?:added|earned|credited)/i, type: 'earned' },
  { bank: 'ICICI', senders: ['ICICIB', 'ICICICC', 'ICICI'], pattern: /(?:total\s*)?(?:reward\s*)?points?\s*(?:balance|bal)?[:\s]+(\d[\d,]+)/i, type: 'balance' },
  { bank: 'SBI', senders: ['SBICRD', 'SBICC', 'SBICRD'], pattern: /(?:reward\s*)?points?\s*(?:balance|bal)?[:\s]+(\d[\d,]+)/i, type: 'balance' },
  { bank: 'Kotak', senders: ['KOTAKB', 'KOTAK'], pattern: /(?:reward\s*)?points?\s*(?:balance|bal)?[:\s]+(\d[\d,]+)/i, type: 'balance' },
  { bank: 'IDFC', senders: ['IDFCBK', 'IDFC'], pattern: /(?:reward\s*)?points?\s*(?:balance|bal)?[:\s]+(\d[\d,]+)/i, type: 'balance' },
  { bank: 'RBL', senders: ['RBLBNK', 'RBLCC'], pattern: /(?:reward\s*)?points?\s*(?:balance|bal)?[:\s]+(\d[\d,]+)/i, type: 'balance' },
  { bank: 'IndusInd', senders: ['INDUSB', 'INDUCC'], pattern: /(?:reward\s*)?points?\s*(?:balance|bal)?[:\s]+(\d[\d,]+)/i, type: 'balance' },
  { bank: 'Yes', senders: ['YESBNK', 'YESCC'], pattern: /(?:reward\s*)?points?\s*(?:balance|bal)?[:\s]+(\d[\d,]+)/i, type: 'balance' },
];

function extractMaskedCard(text: string): string | null {
  const m = text.match(/[xX*]{2,4}(\d{4})/);
  return m ? m[1] : null;
}

function parseSms(messages: Array<{text: string; sender: string; date?: string}>) {
  const cardMap = new Map<string, any>();

  for (const msg of messages) {
    const sender = (msg.sender || '').toUpperCase();
    const text = msg.text || '';
    const maskedCard = extractMaskedCard(text);

    for (const p of SMS_PATTERNS) {
      const senderMatch = p.senders.some(s => sender.includes(s));
      if (!senderMatch) continue;

      const match = text.match(p.pattern);
      if (!match) continue;

      const points = parseInt(match[1].replace(/,/g, ''), 10);
      if (isNaN(points) || points <= 0) continue;

      const key = `${p.bank}-${maskedCard || 'unknown'}`;

      if (!cardMap.has(key)) {
        cardMap.set(key, {
          bank: p.bank,
          card_last4: maskedCard,
          points_balance: 0,
          points_earned: 0,
          points_currency: p.bank === 'Axis' ? 'EDGE Miles' : p.bank === 'AmEx' ? 'Membership Rewards' : 'Reward Points',
          sms_count: 0,
        });
      }

      const card = cardMap.get(key);
      card.sms_count++;

      if (p.type === 'balance') {
        card.points_balance = Math.max(card.points_balance, points);
      } else if (p.type === 'earned') {
        card.points_earned += points;
        if (card.points_balance === 0) card.points_balance = points;
      }

      break;
    }
  }

  return Array.from(cardMap.values()).filter(c => c.points_balance > 0);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    // Identity from the bearer token — a body `userId` is ignored. Anonymous
    // callers still get parsed results; they just aren't saved. Closes the IDOR.
    const userId = await callerId(req);

    const cards = parseSms(messages);

    if (cards.length === 0) {
      return NextResponse.json({ success: true, cards: [], message: 'No reward points found in these messages' });
    }

    // Save only for an authenticated caller, scoped to their verified id
    if (userId) {
      const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (sUrl && sKey) {
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(sUrl, sKey);
        // Same partial-index constraint as parse-statement: idx_stmt_user_card is PARTIAL, so
        // PostgREST onConflict can't arbiter it (42P10) — it was silently 42P10-ing here, which
        // is why the swallowed error mattered. SELECT by the natural key, then UPDATE in place
        // (self_entered:false re-verifies) if present, else INSERT. Surface a real failure
        // instead of a phantom success. Same shape as app/api/parse-statement/route.ts.
        let saveErr: any = null;
        for (const card of cards) {
          const shared = {
            bank: card.bank,
            card_name: `${card.bank} Credit Card`,
            points_balance: card.points_balance,
            points_currency: card.points_currency,
            points_earned: card.points_earned,
            confidence: 'medium',
            self_entered: false,
            imported_at: new Date().toISOString(),
          };
          let existingId: string | null = null;
          if (card.card_last4) {
            const found = await sb.from('statement_imports').select('id')
              .eq('user_id', userId).eq('card_last4', card.card_last4).limit(1);
            if (found.error) { saveErr = found.error; break; }
            existingId = found.data?.[0]?.id ?? null;
          }
          ({ error: saveErr } = existingId
            ? await sb.from('statement_imports').update(shared).eq('id', existingId)
            : await sb.from('statement_imports').insert({ user_id: userId, card_last4: card.card_last4, ...shared }));
          if (saveErr) break;
        }
        if (saveErr) {
          console.error('sms-parse save error:', saveErr.code, saveErr.message);
          return NextResponse.json({
            error: "We read your messages, but couldn't save them just now. Please try again in a moment.",
          }, { status: 502 });
        }
      }
    }

    const totalPoints = cards.reduce((s, c) => s + c.points_balance, 0);
    return NextResponse.json({ success: true, cards, totalPoints });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

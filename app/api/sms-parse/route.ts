import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';

// Bank SMS patterns for reward points
const SMS_PATTERNS = [
  // HDFC
  { bank: 'HDFC', pattern: /(\d[\d,]+)\s*(?:reward\s*points?|rp)\s*(?:credited|earned|added)/i, type: 'points' },
  { bank: 'HDFC', pattern: /reward\s*points?\s*(?:balance|bal)[:\s]+(\d[\d,]+)/i, type: 'balance' },
  { bank: 'HDFC', pattern: /(?:total|available)\s*(?:reward\s*)?points?[:\s]+(\d[\d,]+)/i, type: 'balance' },
  // Axis
  { bank: 'Axis', pattern: /(\d[\d,]+)\s*edge\s*(?:miles?|reward\s*points?)\s*(?:credited|earned|added)/i, type: 'points' },
  { bank: 'Axis', pattern: /edge\s*(?:miles?|points?)\s*(?:balance|bal)[:\s]+(\d[\d,]+)/i, type: 'balance' },
  // Axis Magnus specific
  { bank: 'Axis', pattern: /(\d[\d,]+)\s*edge\s*miles?\s*(?:on|for)/i, type: 'earned' },
  // ICICI
  { bank: 'ICICI', pattern: /(\d[\d,]+)\s*(?:reward\s*points?|cashback)\s*(?:credited|earned|added)/i, type: 'points' },
  { bank: 'ICICI', pattern: /payback\s*points?[:\s]+(\d[\d,]+)/i, type: 'balance' },
  // Amex
  { bank: 'AmEx', pattern: /(\d[\d,]+)\s*membership\s*rewards?\s*(?:points?)\s*(?:credited|earned|added)/i, type: 'points' },
  { bank: 'AmEx', pattern: /mr\s*points?\s*(?:balance|bal)[:\s]+(\d[\d,]+)/i, type: 'balance' },
  { bank: 'AmEx', pattern: /(\d[\d,]+)\s*(?:membership\s*rewards?|MR)\s*points?/i, type: 'points' },
  // SBI
  { bank: 'SBI', pattern: /(\d[\d,]+)\s*reward\s*points?\s*(?:credited|earned|added)/i, type: 'points' },
  { bank: 'SBI', pattern: /cashback\s*(?:of\s*)?(?:rs\.?\s*|₹\s*)(\d[\d,.]+)\s*(?:credited|added)/i, type: 'cashback' },
  // Kotak
  { bank: 'Kotak', pattern: /(\d[\d,]+)\s*(?:reward\s*points?|kotak\s*points?)\s*(?:credited|earned)/i, type: 'points' },
  // IDFC
  { bank: 'IDFC', pattern: /(\d[\d,]+)\s*(?:reward\s*points?|cashpoints?)\s*(?:credited|earned|added)/i, type: 'points' },
  // Generic patterns
  { bank: 'Unknown', pattern: /(\d[\d,]+)\s*reward\s*points?\s*(?:credited|earned|added|for)/i, type: 'points' },
  { bank: 'Unknown', pattern: /points?\s*(?:balance|bal)[:\s]+(\d[\d,]+)/i, type: 'balance' },
  { bank: 'Unknown', pattern: /(?:earned|credited)\s*(\d[\d,]+)\s*points?/i, type: 'points' },
];

// Card number patterns to extract masked card
const CARD_PATTERNS = [
  /(?:card|cc)\s*(?:ending|no\.?|number)?\s*(?:with|in|ending)?\s*(?:xx+|•+)?(\d{4})/i,
  /(?:xx|••)+(\d{4})/i,
  /\*+(\d{4})/i,
];

// Bank sender IDs
const SENDER_BANKS: Record<string, string> = {
  'HDFCBK': 'HDFC', 'HDFCCC': 'HDFC', 'HDFC': 'HDFC',
  'AXISBK': 'Axis', 'AXISCC': 'Axis', 'AXIS': 'Axis',
  'ICICIB': 'ICICI', 'ICICIC': 'ICICI', 'ICICI': 'ICICI',
  'SBICRD': 'SBI', 'SBICC': 'SBI', 'SBIINB': 'SBI',
  'KOTAKB': 'Kotak', 'KOTAK': 'Kotak',
  'IDFCFB': 'IDFC', 'IDFC': 'IDFC',
  'AMEXIN': 'AmEx', 'AMEX': 'AmEx',
};

function parseSms(smsText: string, sender?: string): {
  bank: string; points: number; type: string; maskedCard?: string; raw: string;
} | null {
  const text = smsText.trim();

  // Detect bank from sender
  let detectedBank = 'Unknown';
  if (sender) {
    const senderUpper = sender.toUpperCase().replace(/[^A-Z]/g, '');
    for (const [key, bank] of Object.entries(SENDER_BANKS)) {
      if (senderUpper.includes(key)) { detectedBank = bank; break; }
    }
  }

  // Try each pattern
  for (const { bank, pattern, type } of SMS_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const pointsStr = match[1].replace(/,/g, '');
      const points = parseInt(pointsStr, 10);
      if (isNaN(points) || points <= 0) continue;

      // Extract masked card number
      let maskedCard: string | undefined;
      for (const cardPattern of CARD_PATTERNS) {
        const cardMatch = text.match(cardPattern);
        if (cardMatch) { maskedCard = `•••• ${cardMatch[1]}`; break; }
      }

      return {
        bank: detectedBank !== 'Unknown' ? detectedBank : bank,
        points,
        type,
        maskedCard,
        raw: text.slice(0, 100),
      };
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json() as { messages: Array<{ text: string; sender?: string; date?: string }> };
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    const results: any[] = [];
    const cardMap: Record<string, { bank: string; points: number; earned: number; maskedCard?: string; transactions: number }> = {};

    for (const msg of messages) {
      const parsed = parseSms(msg.text, msg.sender);
      if (!parsed) continue;

      const key = `${parsed.bank}-${parsed.maskedCard || 'unknown'}`;
      if (!cardMap[key]) {
        cardMap[key] = { bank: parsed.bank, points: 0, earned: 0, maskedCard: parsed.maskedCard, transactions: 0 };
      }

      if (parsed.type === 'balance') {
        // Balance SMS = current total, use as authoritative if higher
        if (parsed.points > cardMap[key].points) cardMap[key].points = parsed.points;
      } else {
        // Earned SMS = add to earned total
        cardMap[key].earned += parsed.points;
        cardMap[key].transactions++;
        if (parsed.points > cardMap[key].points) cardMap[key].points = parsed.points;
      }

      results.push({ ...parsed, date: msg.date });
    }

    const cards = Object.values(cardMap).map(card => ({
      ...card,
      estimatedValue: Math.round(card.points * 0.25), // ₹0.25 per point conservative estimate
    }));

    return NextResponse.json({
      parsed: results.length,
      total: messages.length,
      cards,
      totalPoints: cards.reduce((s, c) => s + c.points, 0),
      totalEstimatedValue: cards.reduce((s, c) => s + c.estimatedValue, 0),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

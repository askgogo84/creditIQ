import { requirePro } from '@/lib/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { callClaude, MODELS } from '@/lib/ai';

const SYSTEM_PROMPT = `You are a credit card statement analyst specializing in Indian bank statements (HDFC, ICICI, Axis, SBI, etc.).

CRITICAL: You must extract THREE separate reward point values and never confuse them:
- opening_balance: Points the user had at the START of this billing cycle
- points_earned_this_cycle: ONLY new points earned during this billing period
- closing_balance: Total points at END of statement (what user can redeem RIGHT NOW)

For HDFC statements specifically:
- There is a Reward Points summary box showing: Opening Balance | Feature+Bonus Reward Points Earned | Disbursed | Adjusted/Lapsed
- The BIG number displayed (e.g. 52,164) is the CLOSING BALANCE = Opening + Earned - Disbursed - Lapsed
- closing_balance MUST equal opening_balance + points_earned_this_cycle - points_disbursed - points_lapsed

For statements without a summary box (some Infinia/other cards):
- Sum all +XXX reward entries from individual transactions = points_earned_this_cycle
- If no opening balance shown, set opening_balance to 0
- closing_balance = opening_balance + points_earned_this_cycle

Return ONLY valid JSON. No markdown fences. No explanation.`;

const USER_INSTRUCTION = `Analyze this credit card statement and return EXACTLY this JSON (no markdown, no extra text):
{
  "card_holder": "full name",
  "card_number": "masked e.g. 552260XXXXXX9687",
  "card_type": "e.g. HDFC Regalia Credit Card",
  "statement_date": "15 May 2026",
  "billing_period": "16 Apr 2026 - 15 May 2026",
  "due_date": "04 Jun 2026",
  "points": {
    "opening_balance": 50124,
    "points_earned_this_cycle": 2040,
    "points_disbursed": 0,
    "points_lapsed": 0,
    "closing_balance": 52164,
    "points_expiring_30_days": 0,
    "points_expiring_60_days": 0
  },
  "financials": {
    "previous_dues": 272311.62,
    "payments_received": 105000.00,
    "purchases_this_cycle": 93003.56,
    "finance_charges": 9884.24,
    "total_amount_due": 270199.00,
    "minimum_due": 25488.00,
    "total_credit_limit": 375000,
    "available_credit_limit": 81734
  },
  "finance_charge_warning": true,
  "category_breakdown": [
    { "category": "Electronics", "percentage": 99 }
  ],
  "transactions": [
    {
      "date": "15 Apr 2026",
      "description": "ZEPTO MARKETPLACE",
      "amount": 552.00,
      "type": "debit",
      "rewards_earned": 0,
      "category": "Groceries"
    }
  ],
  "summary_insight": "One sentence CIRA insight about finance charges vs rewards."
}

IMPORTANT RULES:
1. closing_balance = total points user has NOW (opening + earned - disbursed - lapsed). NOT just this month earned.
2. points_earned_this_cycle = ONLY points added this billing period.
3. finance_charge_warning = true if finance_charges > 500.
4. Payments/credits: type = credit, amount positive.`;

export async function POST(request: NextRequest) {
  const gate = await requirePro(request);
  if (!gate.ok) return gate.res;
  try {
    const formData = await request.formData();
    const file = formData.get('statement') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    const ai = await callClaude({
      model: MODELS.opus,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: USER_INSTRUCTION,
            },
          ],
        },
      ],
      extraHeaders: { 'anthropic-beta': 'pdfs-2024-09-25' },
    });
    if (!ai.ok) {
      return NextResponse.json({ ok: false, reason: ai.reason }, { status: ai.status });
    }

    let rawText = (ai.text || '').trim();
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

    let data: any;
    try {
      data = JSON.parse(rawText);
    } catch {
      return NextResponse.json({ ok: false, reason: 'ai_bad_response' }, { status: 502 });
    }

    // Safety net: if closing_balance was set to only earned (Infinia bug), recalculate
    if (
      data.points &&
      data.points.closing_balance === data.points.points_earned_this_cycle &&
      data.points.opening_balance > 0
    ) {
      data.points.closing_balance =
        data.points.opening_balance +
        data.points.points_earned_this_cycle -
        (data.points.points_disbursed || 0) -
        (data.points.points_lapsed || 0);
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Statement Truth API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze statement', details: String(error) },
      { status: 500 }
    );
  }
}

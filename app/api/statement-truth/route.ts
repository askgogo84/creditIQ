import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a credit card statement analyst specializing in Indian bank statements (HDFC, ICICI, Axis, SBI, etc.).

CRITICAL: You must extract THREE separate reward point values and never confuse them:
- opening_balance: Points the user had at the START of this billing cycle
- points_earned_this_cycle: ONLY new points earned during this billing period
- closing_balance: Total points at END of statement (what user can redeem RIGHT NOW)

For HDFC statements specifically:
- There is a "Reward Points" summary box showing: Opening Balance | Feature+Bonus Reward Points Earned | Disbursed | Adjusted/Lapsed
- The BIG number displayed (e.g. 52,164) is the CLOSING BALANCE = Opening + Earned - Disbursed - Lapsed
- Extract all four fields separately
- closing_balance MUST equal opening_balance + points_earned_this_cycle - points_disbursed - points_lapsed

For statements without a summary box (some Infinia/other cards):
- Sum up all "+XXX" reward entries from transactions = points_earned_this_cycle
- If no opening balance is shown, set opening_balance to 0
- closing_balance = opening_balance + points_earned_this_cycle

Return ONLY valid JSON. No markdown. No explanation. No preamble.`;

const USER_INSTRUCTION = `Analyze this credit card statement PDF and extract all data.

Return EXACTLY this JSON structure (no extra fields, no markdown fences):
{
  "card_holder": "full name from statement",
  "card_number": "masked number e.g. 552260XXXXXX9687",
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
    { "category": "Electronics", "percentage": 99 },
    { "category": "Groceries", "percentage": 1 }
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

  "summary_insight": "One sentence CIRA insight. e.g. Finance charges of ₹9,884 wiped out your ₹408 in rewards — you lost money this month."
}

RULES:
1. closing_balance = the total points the user has RIGHT NOW (not just this month's earned)
2. points_earned_this_cycle = ONLY points added during this billing period
3. finance_charge_warning = true if finance_charges > 500
4. For credits/payments, set type to "credit" and amount as positive
5. Include ALL transactions listed in the statement`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('statement') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5-20251101',
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
    });

    // Extract text response
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Clean and parse JSON (strip any accidental markdown fences)
    let rawText = textContent.text.trim();
    rawText = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '');

    const data = JSON.parse(rawText);

    // Safety check: if closing_balance looks wrong (equals only earned this cycle),
    // recalculate it
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

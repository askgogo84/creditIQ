import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bank = formData.get('bank') as string || 'Unknown';

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Only PDF files accepted' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API not configured' }, { status: 500 });

    // Convert PDF to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // Send to Claude with PDF document support
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `This is a ${bank} credit card statement PDF. Extract ONLY the following information and return as JSON with no other text:

{
  "bank": "bank name",
  "card_name": "full card name if visible",
  "card_last4": "last 4 digits of card number",
  "points_balance": number or null,
  "points_currency": "Reward Points / EDGE Miles / Membership Rewards / Cashback / etc",
  "cashback_balance": number or null,
  "statement_date": "YYYY-MM-DD or null",
  "points_expiry": "date string or null",
  "points_earned_this_month": number or null,
  "points_redeemed_this_month": number or null,
  "customer_name": "first name only",
  "confidence": "high / medium / low"
}

Return ONLY the JSON object. If a field is not found, use null. For points_balance use the CURRENT BALANCE / CLOSING BALANCE figure, not earned this month.`
            }
          ]
        }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error: ${response.status} ${err}`);
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';

    let parsed: any = {};
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      return NextResponse.json({ error: 'Could not parse statement data', raw: text }, { status: 422 });
    }

    // Save to Supabase if configured
    const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (sUrl && sKey && parsed.points_balance) {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(sUrl, sKey);
      await sb.from('statement_imports').upsert({
        bank: parsed.bank || bank,
        card_name: parsed.card_name,
        card_last4: parsed.card_last4,
        points_balance: parsed.points_balance,
        points_currency: parsed.points_currency,
        cashback_balance: parsed.cashback_balance,
        statement_date: parsed.statement_date,
        points_expiry: parsed.points_expiry,
        points_earned: parsed.points_earned_this_month,
        confidence: parsed.confidence,
        imported_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      data: parsed,
      message: parsed.points_balance
        ? `Found ${parsed.points_balance.toLocaleString('en-IN')} ${parsed.points_currency || 'points'} on your ${parsed.bank || bank} card`
        : 'Statement parsed but no points balance found',
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

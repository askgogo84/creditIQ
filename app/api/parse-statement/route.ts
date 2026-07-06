import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

function getPasswordHint(bank: string): string {
  const hints: Record<string, string> = {
    HDFC: 'First 4 letters of name (uppercase) + DOB in DDMM. Example: GOVE0305',
    Axis: 'PAN card number in uppercase. Example: ABCDE1234F',
    ICICI: 'Date of birth DDMMYYYY. Example: 03051985',
    SBI: 'Date of birth DDMMYYYY. Example: 03051985',
    AmEx: 'Date of birth DDMMYYYY. Example: 03051985',
    Kotak: 'Date of birth DDMMYYYY. Example: 03051985',
    IDFC: 'Registered mobile number (10 digits)',
    Yes: 'Date of birth DDMMYYYY. Example: 03051985',
  };
  return hints[bank] || 'Check your bank welcome email for the PDF password format';
}

async function isPdfEncrypted(buffer: Buffer): Promise<boolean> {
  // Check PDF encryption flag in the file bytes
  const str = buffer.slice(0, 2048).toString('binary');
  return str.includes('/Encrypt') || str.includes('/encrypt');
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bank = formData.get('bank') as string || 'Unknown';
    const userId = formData.get('userId') as string || null;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API not configured' }, { status: 500 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Check if PDF is encrypted
    const encrypted = await isPdfEncrypted(buffer);
    if (encrypted) {
      return NextResponse.json({
        error: 'PDF is password protected',
        hint: getPasswordHint(bank),
        needsPassword: true,
        unlockUrl: 'https://www.ilovepdf.com/unlock_pdf',
      }, { status: 422 });
    }

    const base64 = buffer.toString('base64');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
            {
              type: 'text',
              text: `This is a ${bank} credit card statement. Extract ONLY these fields as JSON:
{
  "bank": "bank name",
  "card_name": "full card product name",
  "card_last4": "last 4 digits",
  "points_balance": number or null,
  "points_currency": "Reward Points / EDGE Miles / Membership Rewards / Cashback / etc",
  "cashback_balance": number or null,
  "statement_date": "YYYY-MM-DD or null",
  "points_expiry": "date string or null",
  "points_earned_this_month": number or null,
  "customer_name": "first name only",
  "confidence": "high / medium / low"
}
For points_balance: use the closing/total balance shown in the Reward Points summary box. If no summary box exists, sum all the reward points earned from individual transactions (the +XXX values). Never return null if any points data exists. Return ONLY the JSON.`
            }
          ]
        }],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `API error ${response.status}`);

    const text = data.content?.[0]?.text || '{}';
    let parsed: any = {};
    try { parsed = JSON.parse(text.replace(/```json|```/g, '').trim()); } catch {}

    const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (sUrl && sKey && parsed.points_balance) {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(sUrl, sKey);
      await sb.from('statement_imports').upsert({
        user_id: userId, bank: parsed.bank || bank, card_name: parsed.card_name,
        card_last4: parsed.card_last4, points_balance: parsed.points_balance,
        points_currency: parsed.points_currency, cashback_balance: parsed.cashback_balance,
        statement_date: parsed.statement_date, points_expiry: parsed.points_expiry,
        points_earned: parsed.points_earned_this_month, confidence: parsed.confidence,
        imported_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, data: parsed });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

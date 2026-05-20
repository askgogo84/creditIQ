import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

export const runtime = 'nodejs';
export const maxDuration = 30;

async function decryptPdf(inputPath: string, outputPath: string, password: string): Promise<boolean> {
  try {
    // Try pikepdf (Python)
    await execAsync(`python3 -c "
import pikepdf, sys
try:
    pdf = pikepdf.open('${inputPath}', password='${password.replace(/'/g, "\\'")}')
    pdf.save('${outputPath}')
    print('ok')
except Exception as e:
    print('error:', e, file=sys.stderr)
    sys.exit(1)
"`);
    return true;
  } catch {
    try {
      // Fallback: qpdf
      await execAsync(`qpdf --password='${password.replace(/'/g, "\\'")}' --decrypt '${inputPath}' '${outputPath}'`);
      return true;
    } catch {
      return false;
    }
  }
}

function getPasswordHint(bank: string): string {
  const hints: Record<string, string> = {
    HDFC: 'First 4 letters of your name (uppercase) + birth date DDMM. Example: name=Goverdhan, DOB=03-May → GOVE0305',
    Axis: 'Your PAN card number in uppercase. Example: ABCDE1234F',
    ICICI: 'Date of birth in DDMMYYYY format. Example: 03051985',
    SBI: 'Date of birth in DDMMYYYY format. Example: 03051985',
    AmEx: 'Date of birth in DDMMYYYY format. Example: 03051985',
    Kotak: 'Date of birth in DDMMYYYY format. Example: 03051985',
    IDFC: 'Registered mobile number (10 digits)',
    Yes: 'Date of birth in DDMMYYYY format. Example: 03051985',
  };
  return hints[bank] || 'Check your bank welcome email for the statement password format';
}

export async function POST(req: NextRequest) {
  const tmpInput = join(tmpdir(), `stmt_in_${Date.now()}.pdf`);
  const tmpOutput = join(tmpdir(), `stmt_out_${Date.now()}.pdf`);

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bank = formData.get('bank') as string || 'Unknown';
    const password = formData.get('password') as string || '';

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API not configured' }, { status: 500 });

    const bytes = await file.arrayBuffer();
    await writeFile(tmpInput, Buffer.from(bytes));

    let pdfToUse = tmpInput;
    let wasEncrypted = false;

    // Check if encrypted and try to decrypt
    if (password) {
      const decrypted = await decryptPdf(tmpInput, tmpOutput, password);
      if (!decrypted) {
        return NextResponse.json({
          error: 'Wrong password. Please check the format and try again.',
          hint: getPasswordHint(bank),
          needsPassword: true,
        }, { status: 422 });
      }
      pdfToUse = tmpOutput;
      wasEncrypted = true;
    } else {
      // Try without password first — some PDFs aren't encrypted
      try {
        await execAsync(`python3 -c "
import pikepdf
pdf = pikepdf.open('${tmpInput}')
pdf.save('${tmpOutput}')
"`);
        pdfToUse = tmpOutput;
      } catch {
        // Encrypted — needs password
        return NextResponse.json({
          error: 'PDF is password protected',
          hint: getPasswordHint(bank),
          needsPassword: true,
        }, { status: 422 });
      }
    }

    const pdfBuffer = await readFile(pdfToUse);
    const base64 = pdfBuffer.toString('base64');

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
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
            {
              type: 'text',
              text: `This is a ${bank} credit card statement. Extract ONLY these fields as JSON:
{
  "bank": "bank name",
  "card_name": "full card name",
  "card_last4": "last 4 digits",
  "points_balance": number or null,
  "points_currency": "Reward Points / EDGE Miles / Membership Rewards / Cashback etc",
  "cashback_balance": number or null,
  "statement_date": "YYYY-MM-DD or null",
  "points_expiry": "date string or null",
  "points_earned_this_month": number or null,
  "customer_name": "first name only",
  "confidence": "high / medium / low"
}
Return ONLY the JSON. Use CLOSING BALANCE for points_balance.`
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

    // Save to Supabase
    const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (sUrl && sKey && parsed.points_balance) {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(sUrl, sKey);
      await sb.from('statement_imports').upsert({
        bank: parsed.bank || bank, card_name: parsed.card_name,
        card_last4: parsed.card_last4, points_balance: parsed.points_balance,
        points_currency: parsed.points_currency, cashback_balance: parsed.cashback_balance,
        statement_date: parsed.statement_date, points_expiry: parsed.points_expiry,
        points_earned: parsed.points_earned_this_month, confidence: parsed.confidence,
        imported_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, data: parsed, wasEncrypted });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally {
    // Clean up temp files
    await unlink(tmpInput).catch(() => {});
    await unlink(tmpOutput).catch(() => {});
  }
}

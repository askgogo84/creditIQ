import { NextRequest, NextResponse } from 'next/server';
import { callClaude, MODELS } from '@/lib/ai';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_TEXT_CHARS = 200_000;

// Password format hints per bank — shown in the UI so the user knows what to type.
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

// Thrown when the PDF is encrypted and we either have no password or the wrong one.
class PdfPasswordError extends Error {
  constructor(public hadPassword: boolean) { super('pdf_password'); }
}

// HYBRID reader. Opens the PDF in memory with unpdf's serverless PDF.js build to
// determine whether it is encrypted, and decrypts it when a password is supplied.
//   - unencrypted (opens without a password) -> mode:'document'  (caller sends the
//     original PDF to Claude's native document reader, which keeps OCR for scanned/
//     image statements — no regression)
//   - encrypted + correct password           -> mode:'text'      (Claude cannot read the
//     locked bytes, so we hand it the decrypted text we just extracted here)
//   - encrypted + missing/wrong password     -> PdfPasswordError
// The password is used ONLY on the getDocumentProxy line below. It is never stored,
// logged, or persisted, and the buffer is discarded when the request ends.
async function readPdf(buf: Buffer, password?: string): Promise<{ mode: 'document' } | { mode: 'text'; text: string }> {
  const { getDocumentProxy, extractText } = await import('unpdf');
  let pdf: any;
  try {
    pdf = await getDocumentProxy(new Uint8Array(buf), { password: password || undefined } as any);
  } catch (e: any) {
    const msg = String(e?.message ?? e ?? '');
    if (e?.name === 'PasswordException' || /password/i.test(msg)) {
      throw new PdfPasswordError(!!password);
    }
    throw e;
  }
  // Opened without a password -> unencrypted. Prefer Claude's native document reading.
  if (!password) return { mode: 'document' };
  // A password was supplied and the document opened -> extract the now-decrypted text.
  const { text } = await extractText(pdf, { mergePages: true });
  const out = Array.isArray(text) ? text.join('\n') : String(text ?? '');
  return { mode: 'text', text: out.slice(0, MAX_TEXT_CHARS) };
}

const EXTRACT_INSTRUCTIONS = `Extract ONLY these fields as JSON:
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
For points_balance: use the closing/total balance shown in the Reward Points summary box. If no summary box exists, sum all the reward points earned from individual transactions (the +XXX values). Never return null if any points data exists. NEVER output full card numbers. Return ONLY the JSON.`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const bank = (formData.get('bank') as string) || 'Unknown';
    const userId = (formData.get('userId') as string) || null;
    // Password comes from the request, hard-capped at 256 chars. In-memory use only.
    const pwdRaw = formData.get('password');
    const password = pwdRaw != null ? String(pwdRaw).slice(0, 256) : undefined;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'File too large — max 10MB' }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Statement reader is not configured. Please try again later.' }, { status: 500 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Decide how to read the PDF. A locked PDF is unlocked HERE with the user's password —
    // never on a third-party site — then the bytes are dropped.
    let read: { mode: 'document' } | { mode: 'text'; text: string };
    try {
      read = await readPdf(buffer, password);
    } catch (e: any) {
      if (e instanceof PdfPasswordError) {
        return NextResponse.json({
          error: e.hadPassword
            ? "That password didn't unlock the PDF. Double-check your bank's format and try again."
            : "This PDF is locked. Enter its password below and we'll unlock it right here — your file never leaves CreditIQ.",
          needsPassword: true,
          hint: getPasswordHint(bank),
        }, { status: 422 });
      }
      // Any other read failure — keep it human, never surface a raw library error.
      return NextResponse.json({
        error: "We couldn't read that file. Make sure it's a PDF statement downloaded from your bank app.",
      }, { status: 422 });
    }

    // Build the Claude request: native document mode for unencrypted PDFs (keeps OCR),
    // extracted-text mode for the decrypted-in-memory case.
    const extraHeaders: Record<string, string> = {};
    let content: any;

    if (read.mode === 'text') {
      if (!read.text || read.text.trim().length < 100) {
        return NextResponse.json({
          error: "We unlocked the PDF but couldn't find readable text — it may be a scanned image. Download a fresh PDF from your bank app or net banking and try again.",
        }, { status: 422 });
      }
      content = `This is a ${bank} credit card statement. The text extracted from the PDF is between the markers below.\n\n<statement>\n${read.text}\n</statement>\n\n${EXTRACT_INSTRUCTIONS}`;
    } else {
      const base64 = buffer.toString('base64');
      extraHeaders['anthropic-beta'] = 'pdfs-2024-09-25';
      content = [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
        { type: 'text', text: `This is a ${bank} credit card statement. ${EXTRACT_INSTRUCTIONS}` },
      ];
    }

    const ai = await callClaude({
      model: MODELS.sonnet,
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
      extraHeaders,
    });
    if (!ai.ok) {
      // Log status only — never the statement text or any secret.
      console.error('parse-statement Claude error:', ai.reason);
      return NextResponse.json({ error: 'Our reader hit a snag. Please try again in a moment.' }, { status: 502 });
    }

    const out = ai.text || '{}';
    let parsed: any = {};
    try { parsed = JSON.parse(out.replace(/```json|```/g, '').trim()); } catch {}

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
    // Never echo raw error text to the client, and never log the password/statement.
    console.error('parse-statement error:', e?.message);
    return NextResponse.json({ error: 'Something went wrong reading your statement. Please try again.' }, { status: 500 });
  }
}

// app/api/wa/redeem/route.ts
// Server-to-server: AskGogo redeems a 6-digit code. Shared-secret auth (no user token).
// Validates + single-use burns the code, returns the CreditIQ user id.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function POST(req: Request) {
  const secret = req.headers.get('x-wa-secret') ?? '';
  if (!process.env.WA_LINK_SECRET || secret !== process.env.WA_LINK_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let code = '';
  try { code = String((await req.json())?.code ?? '').trim(); } catch { /* empty body */ }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, error: 'bad_code' }, { status: 400 });
  }

  const b = svc();
  const { data: row } = await b
    .from('wa_link_codes')
    .select('code, consumer_user_id, expires_at, used_at')
    .eq('code', code)
    .maybeSingle();

  if (!row)                                        return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  if (row.used_at)                                 return NextResponse.json({ ok: false, error: 'already_used' }, { status: 409 });
  if (new Date(row.expires_at).getTime() < Date.now())
                                                   return NextResponse.json({ ok: false, error: 'expired' }, { status: 410 });

  // Burn atomically-ish: only succeed if still unused (guards against double-redeem races).
  const { data: burned } = await b
    .from('wa_link_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('code', code)
    .is('used_at', null)
    .select('consumer_user_id')
    .maybeSingle();

  if (!burned) return NextResponse.json({ ok: false, error: 'already_used' }, { status: 409 });

  return NextResponse.json({ ok: true, consumer_user_id: burned.consumer_user_id });
}

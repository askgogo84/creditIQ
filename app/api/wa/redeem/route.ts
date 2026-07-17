// app/api/wa/redeem/route.ts
// Server-to-server: AskGogo redeems a 6-digit code. Shared-secret auth (no user token).
//
// Hardening:
//  - Every failure (bad format, never-issued, used, expired, attempt-capped) returns
//    ONE identical generic response (400 { ok: false }) so a caller cannot enumerate
//    which codes were ever real. Only success is distinguishable (200 + user id).
//  - Consume is a single atomic UPDATE guarded on used_at IS NULL + not expired +
//    under the attempt cap, so expiry + single-use + consume happen in one round-trip.
//  - Per-CODE attempt cap (defense-in-depth): each failed redeem of an existing code
//    increments attempts; at MAX_ATTEMPTS the code is treated as consumed. Per-SENDER
//    throttling/lockout must live in the AskGogo bot — this endpoint gets only { code }.
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const MAX_ATTEMPTS = 5;

// One identical failure for every non-success case (no enumeration signal).
function genericFail() {
  return NextResponse.json({ ok: false }, { status: 400 });
}

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
  if (!/^\d{6}$/.test(code)) return genericFail();

  const b = svc();
  const nowIso = new Date().toISOString();

  // Single atomic consume: succeeds only if the code is unused, unexpired, and under
  // the attempt cap. Folds expiry + single-use + consume into one round-trip.
  const { data: burned } = await b
    .from('wa_link_codes')
    .update({ used_at: nowIso })
    .eq('code', code)
    .is('used_at', null)
    .gt('expires_at', nowIso)
    .lt('attempts', MAX_ATTEMPTS)
    .select('consumer_user_id')
    .maybeSingle();

  if (burned) {
    return NextResponse.json({ ok: true, consumer_user_id: burned.consumer_user_id });
  }

  // Failure: best-effort per-code attempt increment (no-ops if the code was never
  // issued), then the SAME generic response so nothing is enumerable.
  try { await b.rpc('increment_wa_link_attempts', { p_code: code }); } catch { /* best-effort; never blocks the response */ }
  return genericFail();
}

// app/api/wa/link-code/route.ts
// Mint a 6-digit WhatsApp link code for the LOGGED-IN CreditIQ user.
// Auth: Bearer token -> anon.auth.getUser() (same pattern as employee/company-cards).
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomInt } from 'crypto';

export const runtime = 'nodejs';

async function getUser(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
  const { data, error } = await anon.auth.getUser(m[1].trim());
  if (error || !data.user) return null;
  return data.user;
}

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function sixDigit(): string {
  // CSPRNG — 000000–999999, single-use, 10-min expiry.
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const b = svc();

  // Invalidate any still-valid codes this user minted earlier (one active code at a time).
  await b.from('wa_link_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('consumer_user_id', user.id)
    .is('used_at', null);

  // Mint, retrying on the astronomically-rare PK collision.
  let code = '';
  for (let i = 0; i < 5; i++) {
    const candidate = sixDigit();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error } = await b.from('wa_link_codes').insert({
      code: candidate,
      consumer_user_id: user.id,
      expires_at: expiresAt,
    });
    if (!error) { code = candidate; break; }
    if (error.code !== '23505') { // not a unique-violation → real failure
      return NextResponse.json({ error: 'could not create code' }, { status: 500 });
    }
  }
  if (!code) return NextResponse.json({ error: 'could not create code' }, { status: 500 });

  const waNumber = process.env.NEXT_PUBLIC_ASKGOGO_WA_NUMBER || '';
  const waText = encodeURIComponent(`link creditiq ${code}`);
  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : null;

  return NextResponse.json({ code, expires_in_seconds: 600, wa_link: waLink });
}

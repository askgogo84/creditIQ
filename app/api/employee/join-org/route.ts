import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const CONSUMER_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const CONSUMER_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const CONSUMER_SERVICE = process.env.CONSUMER_SERVICE_ROLE_KEY!;
const BUSINESS_URL = process.env.BUSINESS_SUPABASE_URL!;
const BUSINESS_SERVICE = process.env.BUSINESS_SERVICE_ROLE_KEY!;

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const auth = req.headers.get('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const anon = createClient(CONSUMER_URL, CONSUMER_ANON, { auth: { persistSession: false } });
  const { data: userData, error: userErr } = await anon.auth.getUser(m[1].trim());
  if (userErr || !userData.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const user = userData.user;

  let code: string | undefined;
  try { ({ code } = await req.json()); } catch {}
  if (!code) return NextResponse.json({ error: 'missing_code' }, { status: 400 });

  const biz = createClient(BUSINESS_URL, BUSINESS_SERVICE, { auth: { persistSession: false } });

  const { data: org } = await biz
    .from('orgs')
    .select('id, name, join_code_domain, join_code_expires_at, join_code_active')
    .eq('join_code', code.trim().toUpperCase())
    .maybeSingle();

  if (!org || org.join_code_active === false)
    return NextResponse.json({ error: 'invalid_code' }, { status: 404 });

  if (org.join_code_expires_at && new Date(org.join_code_expires_at) < new Date())
    return NextResponse.json({ error: 'code_expired' }, { status: 410 });

  if (org.join_code_domain) {
    const ok = !!user.email && user.email.toLowerCase().endsWith('@' + org.join_code_domain.toLowerCase());
    if (!ok) return NextResponse.json({ error: 'email_domain_mismatch' }, { status: 403 });
  }

  const { error: jErr } = await biz.from('org_employees').upsert(
    { org_id: org.id, consumer_user_id: user.id, status: 'active', joined_via: 'code' },
    { onConflict: 'org_id,consumer_user_id' }
  );
  if (jErr) return NextResponse.json({ error: 'join_failed' }, { status: 500 });

  const cons = createClient(CONSUMER_URL, CONSUMER_SERVICE, { auth: { persistSession: false } });
  await cons.from('personal_entitlements').upsert(
    { user_id: user.id, feature: 'corporate_sponsored', status: 'active' },
    { onConflict: 'user_id,feature' }
  );

  return NextResponse.json({ ok: true, org_id: org.id, org_name: org.name });
}
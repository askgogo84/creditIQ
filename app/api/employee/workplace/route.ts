import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

function biz() {
  return createClient(
    process.env.BUSINESS_SUPABASE_URL!,
    process.env.BUSINESS_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data } = await biz()
    .from('org_employees')
    .select('org_id, orgs ( name )')
    .eq('consumer_user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!data) return NextResponse.json({ linked: false });

  const o = (data as any).orgs;
  const orgName = (Array.isArray(o) ? o[0]?.name : o?.name) ?? 'your company';
  return NextResponse.json({ linked: true, org_id: (data as any).org_id, org_name: orgName });
}

export async function DELETE(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await biz().from('org_employees').update({ status: 'disabled' }).eq('consumer_user_id', user.id);

  const cons = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  await cons.from('personal_entitlements').delete().eq('user_id', user.id).eq('feature', 'corporate_sponsored');

  return NextResponse.json({ ok: true });
}
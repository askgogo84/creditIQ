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

  const b = biz();

  const { data: link } = await b
    .from('org_employees')
    .select('org_id, orgs ( name )')
    .eq('consumer_user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!link) return NextResponse.json({ linked: false, cards: [] });

  const orgId = (link as any).org_id;
  const o = (link as any).orgs;
  const orgName = (Array.isArray(o) ? o[0]?.name : o?.name) ?? 'your company';

  const { data: rows } = await b
    .from('corp_cards')
    .select('id, last4, issuer, enrolled, allocation_model, card_slug, cards_snapshot ( name, color, network )')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  const cards = (rows ?? []).map((r: any) => {
    const snap = Array.isArray(r.cards_snapshot) ? r.cards_snapshot[0] : r.cards_snapshot;
    return {
      id: r.id,
      name: snap?.name ?? r.issuer,
      issuer: r.issuer,
      last4: r.last4,
      network: snap?.network ?? null,
      color: snap?.color ?? null,
      status: r.enrolled ? 'enrolled' : 'pending',
    };
  });

  return NextResponse.json({ linked: true, org_name: orgName, cards });
}
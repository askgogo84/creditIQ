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

async function activeOrgId(userId: string): Promise<string | null> {
  const { data } = await biz()
    .from('org_employees')
    .select('org_id')
    .eq('consumer_user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  return (data as any)?.org_id ?? null;
}

// GET — card catalog for the picker
export async function GET(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await biz()
    .from('cards_snapshot')
    .select('slug, name, bank, network, color, annual_fee')
    .order('iq_score', { ascending: false });

  if (error) return NextResponse.json({ error: 'catalog_failed' }, { status: 500 });
  return NextResponse.json({ cards: data ?? [] });
}

// POST — submit a corporate card (lands PENDING for admin approval)
export async function POST(req: Request) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const orgId = await activeOrgId(user.id);
  if (!orgId) return NextResponse.json({ error: 'not_linked' }, { status: 403 });

  let card_slug: string | undefined;
  let last4: string | undefined;
  try { ({ card_slug, last4 } = await req.json()); } catch {}

  if (!card_slug) return NextResponse.json({ error: 'invalid_card' }, { status: 400 });
  if (!last4 || !/^\d{4}$/.test(last4)) return NextResponse.json({ error: 'invalid_last4' }, { status: 400 });

  const b = biz();

  const { data: card } = await b
    .from('cards_snapshot')
    .select('slug, bank')
    .eq('slug', card_slug)
    .maybeSingle();
  if (!card) return NextResponse.json({ error: 'invalid_card' }, { status: 400 });

  const { data: existing } = await b
    .from('corp_cards')
    .select('id')
    .eq('org_id', orgId)
    .eq('card_slug', card_slug)
    .eq('last4', last4)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: 'already_exists' }, { status: 409 });

  const { data: inserted, error: insErr } = await b
    .from('corp_cards')
    .insert({
      org_id: orgId,
      card_slug: (card as any).slug,
      issuer: (card as any).bank,
      last4,
      ownership: 'corporate',
      allocation_model: 'unenrolled',
      enrolled: false,
      rules_pending: true,
    })
    .select('id')
    .single();

  if (insErr || !inserted) return NextResponse.json({ error: 'submit_failed' }, { status: 500 });
  return NextResponse.json({ ok: true, card_id: (inserted as any).id });
}
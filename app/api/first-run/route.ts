// app/api/first-run/route.ts
// First-run pricing-modal state for the logged-in user.
//
// SECURITY (the Aug-10 IDOR class): this route writes to user_profiles with the
// service-role key, so it MUST derive the user from a VERIFIED session token and
// never from a caller-supplied user_id — on the header path AND the sendBeacon path
// (where the token travels in the body because a beacon can't set headers). We verify
// the token with getUser() and write to the returned id only.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SVC = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Read at runtime so unsetting the flag disables the modal without a rebuild.
const flagOn = () => process.env.FIRST_RUN_MODAL === 'on';

function bearer(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

// Verify a session token and return its user id. NEVER trust a body/query user_id.
async function verifiedUserId(token: string | null): Promise<string | null> {
  if (!token) return null;
  const anon = createClient(URL_ENV(), ANON(), { auth: { persistSession: false } });
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

function admin() {
  return createClient(URL_ENV(), SVC(), { auth: { persistSession: false } });
}

// GET -> { enabled, plan_chosen }. Signed-out / bad token reports "nothing to show"
// so the client gate renders no modal (it also never fetches without a session).
export async function GET(req: NextRequest) {
  const userId = await verifiedUserId(bearer(req));
  if (!userId) return NextResponse.json({ enabled: false, plan_chosen: true });

  const { data } = await admin()
    .from('user_profiles')
    .select('plan_chosen_at')
    .eq('user_id', userId)
    .maybeSingle();

  return NextResponse.json({ enabled: flagOn(), plan_chosen: !!data?.plan_chosen_at });
}

// POST -> stamp plan_chosen_at ONCE (idempotent; never overwrites the first choice).
// Token from the Authorization header (fetch) OR body.token (sendBeacon). Either way
// it is verified and the id comes from getUser — a body user_id is never read.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const token = bearer(req) || (typeof body?.token === 'string' ? body.token : null);
  const userId = await verifiedUserId(token);
  if (!userId) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const sb = admin();
  const { data: existing } = await sb
    .from('user_profiles')
    .select('plan_chosen_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (existing?.plan_chosen_at) return NextResponse.json({ ok: true, already: true });

  const now = new Date().toISOString();
  const { error } = await sb
    .from('user_profiles')
    .upsert({ user_id: userId, plan_chosen_at: now, updated_at: now }, { onConflict: 'user_id' });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

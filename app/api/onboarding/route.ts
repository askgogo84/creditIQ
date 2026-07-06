// app/api/onboarding/route.ts
// Reads/writes the onboarding profile for the LOGGED-IN user.
// user id is ALWAYS derived from the bearer token — never trusted from query/body.
// This closes the IDOR where any caller could read/overwrite another user's profile.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SVC = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Verify the caller from their bearer token and return their user id (or null).
async function callerId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const anon = createClient(URL_ENV(), ANON(), { auth: { persistSession: false } });
  const { data, error } = await anon.auth.getUser(m[1].trim());
  if (error || !data.user) return null;
  return data.user.id;
}

function admin() {
  return createClient(URL_ENV(), SVC(), { auth: { persistSession: false } });
}

// GET -> { onboarding_complete, profile } for the logged-in user
export async function GET(req: NextRequest) {
  const userId = await callerId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data, error } = await admin()
    .from('user_profiles')
    .select('user_id, display_name, date_of_birth, home_airport, home_city, onboarding_complete')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data ?? null, onboarding_complete: !!data?.onboarding_complete });
}

// POST { displayName, dateOfBirth, homeAirport, complete? } -> upsert own profile
export async function POST(req: NextRequest) {
  try {
    const userId = await callerId(req);
    if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const row = {
      user_id: userId, // from token, never from body
      display_name: body?.displayName != null ? String(body.displayName).slice(0, 80) : null,
      date_of_birth: body?.dateOfBirth ? String(body.dateOfBirth).slice(0, 10) : null,
      home_airport: body?.homeAirport ? String(body.homeAirport).toUpperCase().slice(0, 4) : null,
      onboarding_complete: body?.complete !== false,
      updated_at: new Date().toISOString(),
    };
    const { error } = await admin().from('user_profiles').upsert(row, { onConflict: 'user_id' });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}

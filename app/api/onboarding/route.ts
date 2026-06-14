// app/api/onboarding/route.ts
// Reads/writes the onboarding profile. Service-role + userId-in-body to match
// your existing /api/manual-cards pattern. Writes to user_profiles (extended).
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET ?userId=...  -> { onboarding_complete, profile }
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') ?? '';
  if (!UUID.test(userId)) return NextResponse.json({ error: 'bad userId' }, { status: 400 });
  const { data, error } = await admin()
    .from('user_profiles')
    .select('user_id, display_name, date_of_birth, home_airport, home_city, onboarding_complete')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data ?? null, onboarding_complete: !!data?.onboarding_complete });
}

// POST { userId, displayName, dateOfBirth, homeAirport, complete? }  -> upsert profile
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = String(body?.userId ?? '');
    if (!UUID.test(userId)) return NextResponse.json({ error: 'bad userId' }, { status: 400 });

    const row = {
      user_id: userId,
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

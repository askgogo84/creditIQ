import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

export const runtime = 'nodejs';

// PARTIAL update of the LOGGED-IN user's editable profile fields, for the /profile
// "Personal Details" edit. Identity comes from the bearer token (requireAuth) — never
// the body — closing the IDOR where a caller could overwrite another user's profile.
//
// Why a dedicated endpoint instead of reusing /api/onboarding: the onboarding POST
// writes the WHOLE row (display_name, date_of_birth, home_airport, onboarding_complete)
// and NULLs date_of_birth when the body omits it. Editing an airport through it would
// silently wipe a user's DOB. This handler upserts ONLY the columns actually present in
// the request, so untouched columns (notably date_of_birth) are never clobbered.
// Home CITY is edited via /api/user-city (already partial-safe); this route owns
// display_name + home_airport.
export async function PATCH(req: NextRequest) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;
  const userId = gate.userId;

  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  if (typeof body?.displayName === 'string') patch.display_name = body.displayName.trim().slice(0, 80);
  if (typeof body?.homeAirport === 'string') patch.home_airport = body.homeAirport.trim().toUpperCase().slice(0, 4);

  // Nothing recognised to update → 400, and write nothing (never blind-touch the row).
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, error: 'no updatable fields' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: false }, { status: 500 });

  try {
    const sb = createClient(url, key);
    // upsert with a PARTIAL payload: ON CONFLICT updates only the provided columns,
    // leaving date_of_birth and every other sibling column untouched.
    const { error } = await sb
      .from('user_profiles')
      .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}

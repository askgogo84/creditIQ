// app/api/update-points/route.ts
// Updates the points balance on ONE of the logged-in user's own cards.
// Identity comes from the bearer token (requireAuth) — a caller-supplied
// `userId` is ignored. This closes the IDOR where any caller could rewrite
// another user's points by passing their id.
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const gate = await requireAuth(req);
    if (!gate.ok) return gate.res;
    const userId = gate.userId;

    const { cardId, source, points } = await req.json();
    if (!cardId || points == null) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!sUrl || !sKey) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(sUrl, sKey, { auth: { persistSession: false } });
    const table = source === 'manual' ? 'manual_cards' : 'statement_imports';
    // Scoped to the VERIFIED caller id — never the request body.
    const { error } = await sb.from(table)
      .update({ points_balance: points, imported_at: new Date().toISOString() })
      .eq('id', cardId)
      .eq('user_id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

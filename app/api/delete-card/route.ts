// app/api/delete-card/route.ts
// Deletes ONE of the logged-in user's own cards — manual OR statement — from the
// right table based on `source`. ONE endpoint for both (the delete used to live,
// manual-only, on /api/manual-cards; consolidated here so there is a single delete
// path). Identity comes from the bearer token (requireAuth); a caller-supplied
// user_id is never trusted, and every delete is scoped .eq('user_id', userId) so a
// caller can only ever delete their own row. Same pattern as update-points.
//
// ⚠ Deleting a statement card is IRREVERSIBLE — it destroys statement_date,
// points_expiry and the verified provenance. There is no soft-delete here; the
// client gives the user a ~5s undo window and only calls this AFTER it elapses.
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
export const runtime = 'nodejs';

export async function DELETE(req: NextRequest) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;
  const userId = gate.userId;
  try {
    const { cardId, source } = await req.json();
    if (!cardId) return NextResponse.json({ error: 'Missing cardId' }, { status: 400 });

    const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!sUrl || !sKey) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(sUrl, sKey, { auth: { persistSession: false } });

    const table = source === 'manual' ? 'manual_cards' : 'statement_imports';
    const { error } = await sb.from(table)
      .delete()
      .eq('id', cardId)
      .eq('user_id', userId); // can only delete own rows
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

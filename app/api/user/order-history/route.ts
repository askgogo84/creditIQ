import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '@/lib/api-auth';

export const runtime = 'nodejs';

// Read the LOGGED-IN user's Pro purchase receipts for the /profile Transactions list.
// Identity comes from the bearer token (requireAuth) — never a caller-supplied userId.
// pro_order_events is service-role only (RLS deny-all to anon/authenticated), so we
// read it with the service key FILTERED to the verified user_id. This closes the IDOR
// where a caller could read another user's receipts. Every row is one real paid order
// (extend_pro writes exactly one row per order.paid grant), so no event-type filtering
// is needed. Read-only — this route never writes.
export async function GET(req: NextRequest) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;
  const userId = gate.userId;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ orders: [] });

  try {
    const sb = createClient(url, key);
    const { data, error } = await sb
      .from('pro_order_events')
      .select('id, plan, amount_paise, months, applied_pro_until, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ orders: [] });
    return NextResponse.json({ orders: data ?? [] });
  } catch {
    return NextResponse.json({ orders: [] });
  }
}

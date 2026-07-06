// app/api/user-cards/route.ts
// Returns the LOGGED-IN user's statement-imported cards.
// User identity comes from the bearer token — NOT a caller-supplied ?userId=.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sUrl || !anonKey || !svcKey) return NextResponse.json({ cards: [] });

  // verify caller from their bearer token
  const auth = req.headers.get('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return NextResponse.json({ error: 'unauthorized', cards: [] }, { status: 401 });

  const anon = createClient(sUrl, anonKey, { auth: { persistSession: false } });
  const { data: u, error: ue } = await anon.auth.getUser(m[1].trim());
  if (ue || !u.user) return NextResponse.json({ error: 'unauthorized', cards: [] }, { status: 401 });
  const userId = u.user.id;

  // query that user's own rows (service role for the read; scoped by the verified id)
  const sb = createClient(sUrl, svcKey, { auth: { persistSession: false } });
  const { data } = await sb
    .from('statement_imports')
    .select('*')
    .eq('user_id', userId)
    .order('imported_at', { ascending: false });

  if (!data || data.length === 0) return NextResponse.json({ cards: [] });

  const seen = new Set<string>();
  const cards = data.filter(row => {
    const key = `${row.bank}-${row.card_last4 || 'unknown'}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return NextResponse.json({ cards });
}

import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get('userId');
  if (!userId) return NextResponse.json({ cards: [] });

  const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sUrl || !sKey) return NextResponse.json({ cards: [] });

  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(sUrl, sKey);

  const { data } = await sb
    .from('statement_imports')
    .select('*')
    .eq('user_id', userId)
    .order('imported_at', { ascending: false });

  if (!data || data.length === 0) return NextResponse.json({ cards: [] });

  // Keep latest per card_last4+bank combo
  const seen = new Set<string>();
  const cards = data.filter(row => {
    const key = `${row.bank}-${row.card_last4 || 'unknown'}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({ cards });
}

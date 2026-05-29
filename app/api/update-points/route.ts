import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) {
  try {
    const { cardId, source, points, userId } = await req.json();
    if (!cardId || !points || !userId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!sUrl || !sKey) return NextResponse.json({ error: 'Not configured' }, { status: 500 });
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(sUrl, sKey);
    const table = source === 'manual' ? 'manual_cards' : 'statement_imports';
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

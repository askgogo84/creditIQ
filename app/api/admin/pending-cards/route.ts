import { NextResponse } from 'next/server';
export const runtime = 'edge';
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ cards: [] });
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, key);
    const { data } = await supabase.from('pending_cards').select('*').eq('status', 'pending_review').order('discovered_at', { ascending: false });
    return NextResponse.json({ cards: data || [] });
  } catch { return NextResponse.json({ cards: [] }); }
}

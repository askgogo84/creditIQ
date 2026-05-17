import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';
export async function POST(req: NextRequest) {
  const { slug } = await req.json();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ ok: true });
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, key);
  await supabase.from('pending_cards').update({ status: 'rejected' }).eq('slug', slug);
  return NextResponse.json({ ok: true });
}

// app/api/ig-click/route.ts
// Log insight clicks for feedback loop
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { insight_id, query_context } = await req.json();
    if (!insight_id) return NextResponse.json({ error: 'Missing insight_id' }, { status: 400 });
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'Missing env' }, { status: 500 });
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(supabaseUrl, supabaseKey);
    await sb.from('ig_insight_clicks').insert({ insight_id, query_context: query_context || '' });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

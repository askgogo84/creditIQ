import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Simple in-memory store for demo  --  in production use Supabase
// Ratings stored as { cardId: { total: number, count: number } }

export async function POST(req: NextRequest) {
  try {
    const { cardId, rating } = await req.json();
    if (!cardId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }
    // Store in Supabase if configured
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(url, key);
      await supabase.from('user_ratings').insert({ card_id: cardId, rating, created_at: new Date().toISOString() });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const cardId = new URL(req.url).searchParams.get('cardId');
  if (!cardId) return NextResponse.json({ error: 'Missing cardId' }, { status: 400 });
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(url, key);
      const { data } = await supabase.from('user_ratings').select('rating').eq('card_id', cardId);
      if (data && data.length > 0) {
        const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
        return NextResponse.json({ avg: Math.round(avg * 10) / 10, count: data.length });
      }
    }
    return NextResponse.json({ avg: 0, count: 0 });
  } catch {
    return NextResponse.json({ avg: 0, count: 0 });
  }
}

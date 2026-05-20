import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';
export async function POST(req: NextRequest) {
  try {
    const { cardId, type } = await req.json();
    const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (sUrl && sKey) {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(sUrl, sKey);
      await sb.from('affiliate_clicks').insert({ card_id: cardId, affiliate_type: type, clicked_at: new Date().toISOString(), referrer: req.headers.get('referer') });
    }
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ ok: true }); }
}

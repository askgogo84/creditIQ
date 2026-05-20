import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

  const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sUrl || !sKey) return NextResponse.json({ cards: [], consents: [] });

  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(sUrl, sKey);

  const { data: consents } = await sb.from('aa_consents').select('*').eq('user_id', userId).eq('status', 'DATA_FETCHED');
  if (!consents || consents.length === 0) return NextResponse.json({ cards: [], consents: [] });

  const handles = consents.map((c: any) => c.consent_handle);
  const { data: cards } = await sb.from('linked_cards').select('*').in('consent_handle', handles);

  return NextResponse.json({ cards: cards || [], consents });
}

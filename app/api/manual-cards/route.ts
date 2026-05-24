import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function getClient() {
  const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sUrl || !sKey) throw new Error('Missing Supabase env vars');
  return createClient(sUrl, sKey);
}

export async function GET(req: NextRequest) {
  const userId = new URL(req.url).searchParams.get('userId');
  if (!userId) return NextResponse.json({ cards: [] });
  try {
    const sb = getClient();
    const { data } = await sb
      .from('manual_cards')
      .select('*')
      .eq('user_id', userId)
      .order('imported_at', { ascending: false });
    return NextResponse.json({ cards: data || [] });
  } catch (e: any) {
    console.error('manual-cards GET error:', e.message);
    return NextResponse.json({ cards: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, bank, cardName, cardLast4, pointsBalance, pointsCurrency } = body;
    if (!userId || !bank || !cardName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const sb = getClient();
    const { data, error } = await sb
      .from('manual_cards')
      .insert({
        user_id: userId,
        bank,
        card_name: cardName,
        card_last4: cardLast4 || null,
        points_balance: parseInt(pointsBalance) || 0,
        points_currency: pointsCurrency || 'Points',
      })
      .select()
      .single();
    if (error) {
      console.error('manual-cards POST error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ card: data });
  } catch (err: any) {
    console.error('manual-cards POST exception:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId, cardId } = await req.json();
    if (!userId || !cardId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const sb = getClient();
    const { error } = await sb
      .from('manual_cards')
      .delete()
      .eq('id', cardId)
      .eq('user_id', userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

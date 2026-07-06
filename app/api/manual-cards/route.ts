// app/api/manual-cards/route.ts
// CRUD for the LOGGED-IN user's manually-added cards.
// user_id is ALWAYS derived from the bearer token — never trusted from the request body.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const runtime = 'nodejs';

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SVC = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;

// verify the caller and return their user id, or null
async function callerId(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get('authorization') ?? '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const anon = createClient(URL_ENV(), ANON(), { auth: { persistSession: false } });
  const { data, error } = await anon.auth.getUser(m[1].trim());
  if (error || !data.user) return null;
  return data.user.id;
}
function svcClient() {
  return createClient(URL_ENV(), SVC(), { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  const userId = await callerId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized', cards: [] }, { status: 401 });
  try {
    const { data } = await svcClient()
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
  const userId = await callerId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { bank, cardName, cardLast4, pointsBalance, pointsCurrency } = body;
    if (!bank || !cardName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const { data, error } = await svcClient()
      .from('manual_cards')
      .insert({
        user_id: userId, // from token, never from body
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
  const userId = await callerId(req);
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const { cardId } = await req.json();
    if (!cardId) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    const { error } = await svcClient()
      .from('manual_cards')
      .delete()
      .eq('id', cardId)
      .eq('user_id', userId); // can only delete own rows
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

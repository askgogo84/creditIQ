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
    // Points balance is OPTIONAL — blank or 0 saves as 0 points (grey "Estimated").
    const points = parseInt(pointsBalance) || 0;
    const last4 = (cardLast4 || '').trim() || null;
    const svc = svcClient();

    // Dedupe: same bank + card name + last-4 → update the existing row instead of
    // inserting a duplicate. If the incoming last-4 is blank, match on bank + name only.
    const norm = (s: any) => (s || '').toString().trim().toLowerCase();
    const { data: existing } = await svc
      .from('manual_cards')
      .select('*')
      .eq('user_id', userId);
    const dupe = (existing || []).find(
      (r: any) =>
        norm(r.bank) === norm(bank) &&
        norm(r.card_name) === norm(cardName) &&
        (last4 ? norm(r.card_last4) === norm(last4) : true)
    );

    if (dupe) {
      const { data, error } = await svc
        .from('manual_cards')
        .update({
          points_balance: points,
          points_currency: pointsCurrency || 'Points',
          card_last4: last4 || dupe.card_last4 || null, // keep an existing last-4 if none supplied now
        })
        .eq('id', dupe.id)
        .eq('user_id', userId) // can only touch own rows
        .select()
        .single();
      if (error) {
        console.error('manual-cards POST (dedupe update) error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ card: data, deduped: true });
    }

    const { data, error } = await svc
      .from('manual_cards')
      .insert({
        user_id: userId, // from token, never from body
        bank,
        card_name: cardName,
        card_last4: last4,
        points_balance: points,
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

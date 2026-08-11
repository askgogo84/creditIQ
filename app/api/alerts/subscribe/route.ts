import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { email, cards } = await req.json();
    if (!email || !cards?.length) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const supabase = createClient(url, key);
      // NON-DESTRUCTIVE: this endpoint is anonymous email capture on public
      // marketing pages, so anyone can POST any email. Insert only when the
      // email is NEW (ON CONFLICT DO NOTHING); an existing subscriber's card_ids
      // are left untouched — we never silently overwrite someone's alert
      // preferences from an unauthenticated form. Proper double opt-in / a
      // "manage your alerts" email is a deferred follow-up.
      await supabase.from('alert_subscriptions').upsert(
        { email, card_ids: cards, active: true },
        { onConflict: 'email', ignoreDuplicates: true }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

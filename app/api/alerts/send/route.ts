import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

// POST - send devaluation alert to all subscribers for a card
// Called manually or by cron when devaluation detected
export async function POST(req: NextRequest) {
  const secret = req.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.SYNC_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { cardId, cardName, bank, change, effective, severity } = await req.json();

  const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sUrl || !sKey) return NextResponse.json({ error: 'DB not configured' }, { status: 500 });

  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(sUrl, sKey);

  // Get all subscribers for this card
  const { data: subs } = await sb
    .from('alert_subscriptions')
    .select('email')
    .contains('cards', [cardId]);

  if (!subs?.length) {
    return NextResponse.json({ sent: 0, message: 'No subscribers for this card' });
  }

  // Log the devaluation event
  await sb.from('devaluation_events').upsert({
    card_id: cardId,
    card_name: cardName,
    bank,
    change_description: change,
    effective_date: effective,
    severity: severity || 'medium',
    notified_count: subs.length,
    created_at: new Date().toISOString(),
  });

  // TODO: Send via Resend/SendGrid when email service configured
  // For now, log and return count
  console.log(`[ALERT] Devaluation: ${cardName} - ${change}. Would email ${subs.length} subscribers.`);

  return NextResponse.json({
    success: true,
    subscribers: subs.length,
    card: cardName,
    message: `Alert queued for ${subs.length} subscribers. Wire up Resend API to actually send.`,
  });
}

export async function GET(req: NextRequest) {
  // Return recent devaluation events
  const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sUrl || !sKey) return NextResponse.json({ events: [] });

  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(sUrl, sKey);

  const { data } = await sb
    .from('devaluation_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ events: data || [] });
}

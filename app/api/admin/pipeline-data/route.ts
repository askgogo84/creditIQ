// app/api/admin/pipeline-data/route.ts
// Returns cron logs, devaluation events, pending cards, and live card count
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [cronLogs, devalEvents, pendingCards, cardsCount] = await Promise.all([
    supabase.from('cron_logs').select('*').order('ran_at', { ascending: false }).limit(50),
    supabase.from('devaluation_events').select('*').order('detected_at', { ascending: false }).limit(100),
    supabase.from('pending_cards').select('*').order('discovered_at', { ascending: false }),
    supabase.from('cards').select('id', { count: 'exact', head: true }).eq('active', true),
  ]);

  return NextResponse.json({
    cronLogs: cronLogs.data || [],
    devalEvents: devalEvents.data || [],
    pendingCards: pendingCards.data || [],
    totalCards: cardsCount.count ?? 0,
  });
}

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const SURFACES = new Set([
  'cards',
  'compare',
  'my-cards',
  'optimize',
  'card-switch',
  'card-detail',
]);

function toIntOrNull(x: unknown): number | null {
  return typeof x === 'number' && Number.isFinite(x) ? Math.round(x) : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) ?? {};
    const { cardSlug, surface, reason, sessionId, displayedValueInr, monthlyTotalInr } = body;

    if (typeof cardSlug !== 'string' || cardSlug.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid cardSlug' }, { status: 400 });
    }
    if (typeof surface !== 'string' || !SURFACES.has(surface)) {
      return NextResponse.json({ error: 'Invalid surface' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(url, key);
      const { error } = await supabase.from('card_reports').insert({
        card_slug: cardSlug.slice(0, 120),
        surface,
        reason: typeof reason === 'string' ? reason.slice(0, 280) : null,
        session_id: typeof sessionId === 'string' ? sessionId.slice(0, 64) : null,
        displayed_value_inr: toIntOrNull(displayedValueInr),
        monthly_total_inr: toIntOrNull(monthlyTotalInr),
        created_at: new Date().toISOString(),
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Bad request' }, { status: 400 });
  }
}

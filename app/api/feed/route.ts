// app/api/feed/route.ts
// User-facing community feed. Free for any logged-in user, but NOT public — a valid
// Supabase session is required. Read-only. Returns intelligence_kb rows newest-first,
// with legacy mojibake repaired on the way out (display-only; the DB is not modified).
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeText } from '@/lib/sanitize-text';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SVC = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(req: NextRequest) {
  // Require a logged-in user (any user — the feed is free, not Pro-gated).
  const m = (req.headers.get('authorization') ?? '').match(/^Bearer\s+(.+)$/i);
  if (!m) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const anon = createClient(URL_ENV(), ANON(), { auth: { persistSession: false } });
  const { data: u, error: ue } = await anon.auth.getUser(m[1].trim());
  if (ue || !u.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const sb = createClient(URL_ENV(), SVC() || ANON(), { auth: { persistSession: false } });
    const { data, error } = await sb
      .from('intelligence_kb')
      .select('id, source, source_url, creator_handle, creator_name, title, content, insight_type, card_mentions, published_at, scraped_at')
      .eq('active', true)
      .order('scraped_at', { ascending: false })   // newest-first; no fake freshness
      .limit(100);
    if (error) return NextResponse.json({ items: [] });

    const items = (data ?? []).map((r: any) => ({
      id: r.id,
      source: r.source ?? null,
      source_url: r.source_url ?? null,
      creator_handle: r.creator_handle ?? null,
      creator_name: sanitizeText(r.creator_name),
      title: sanitizeText(r.title),
      summary: sanitizeText(r.content),
      insight_type: r.insight_type ?? 'general',
      card_mentions: Array.isArray(r.card_mentions) ? r.card_mentions : [],
      date: r.scraped_at ?? r.published_at ?? null,
    }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

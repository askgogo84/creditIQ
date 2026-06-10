// app/api/cron/ig-embed/route.ts
// One-time + ongoing: generate embeddings for insights missing them
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 120;

async function getEmbedding(text: string, openaiKey: string): Promise<number[] | null> {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + openaiKey },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data?.[0]?.embedding || null;
}

export async function GET(req: NextRequest) {
  // Vercel crons are called by Vercel infrastructure only — no secret needed
  const openaiKey = process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!openaiKey || !supabaseUrl || !supabaseKey)
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(supabaseUrl, supabaseKey);
  const { data: insights } = await sb
    .from('ig_knowledge_base')
    .select('id, insight_type, insight_summary, source_handle')
    .is('embedding', null)
    .limit(50);
  if (!insights?.length) return NextResponse.json({ success: true, message: 'No insights need embedding', embedded: 0 });
  let embedded = 0;
  const errors: string[] = [];
  for (const insight of insights) {
    const text = insight.insight_type + ': ' + insight.insight_summary + ' (via @' + insight.source_handle + ')';
    const embedding = await getEmbedding(text, openaiKey);
    if (!embedding) { errors.push('embed failed: ' + insight.id); continue; }
    const { error } = await sb.from('ig_knowledge_base').update({ embedding }).eq('id', insight.id);
    if (!error) embedded++;
    else errors.push('update failed: ' + insight.id);
  }
  return NextResponse.json({ success: true, embedded, errors });
}

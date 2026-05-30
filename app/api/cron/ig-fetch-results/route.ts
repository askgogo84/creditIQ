// app/api/cron/ig-fetch-results/route.ts
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const maxDuration = 60;
const APIFY_BASE = 'https://api.apify.com/v2';

async function extractInsights(post: any, anthropicKey: string): Promise<any | null> {
  if (!post.caption || post.caption.length < 50) return null;
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: Indian credit card Instagram post by @.
Caption: ""

Return ONLY valid JSON, no markdown:
{"insight_type":"transfer_hack|devaluation|card_comparison|sweet_spot|strategy|general","insight_summary":"one clear sentence","is_valuable":true,"structured_data":{"cards_mentioned":[],"actionable_tip":""}} }]
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  try {
    const parsed = JSON.parse(text.replace(/\\json|\\/g, '').trim());
    if (!parsed.is_valuable) return null;
    return {
      source_handle: post.ownerUsername || post.owner?.username || 'unknown',
      post_id: post.id || post.shortCode,
      post_url: post.shortCode ? \https://instagram.com/p/\ : '',
      caption: post.caption?.slice(0, 500) || '',
      post_date: post.timestamp || new Date().toISOString(),
      insight_type: parsed.insight_type,
      insight_summary: parsed.insight_summary,
      structured_data: parsed.structured_data || {},
      likes: post.likesCount || 0,
      scraped_at: new Date().toISOString(),
    };
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const apifyToken = process.env.APIFY_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apifyToken || !anthropicKey || !supabaseUrl || !supabaseKey)
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(supabaseUrl, supabaseKey);

  const { data: pendingRuns } = await sb
    .from('ig_pending_runs').select('*').eq('status', 'pending')
    .order('started_at', { ascending: false }).limit(1);
  if (!pendingRuns || pendingRuns.length === 0)
    return NextResponse.json({ success: true, message: 'No pending runs found' });

  const pendingRun = pendingRuns[0];
  const runIds: Record<string, string> = pendingRun.run_ids;
  const results = { posts_scraped: 0, insights_extracted: 0, insights_saved: 0, run_statuses: {} as any, errors: [] as string[] };

  const { data: existing } = await sb.from('ig_knowledge_base').select('post_id').limit(1000);
  const existingIds = new Set((existing || []).map((r: any) => r.post_id));

  const deadline = Date.now() + 45000; // 45s hard limit

  for (const [handle, runId] of Object.entries(runIds)) {
    if (Date.now() > deadline) { results.errors.push('deadline_reached'); break; }
    try {
      const statusRes = await fetch(\/actor-runs/\?token=\);
      if (!statusRes.ok) { results.errors.push(\: status fetch failed\); continue; }
      const status = await statusRes.json();
      const runStatus = status.data?.status;
      (results.run_statuses as any)[handle] = runStatus;
      if (runStatus !== 'SUCCEEDED') {
        results.errors.push(\: \);
        continue;
      }
      const dataRes = await fetch(\/actor-runs/\/dataset/items?token=\&limit=5\);
      if (!dataRes.ok) continue;
      const posts = await dataRes.json();
      results.posts_scraped += posts.length;
      const newPosts = posts.filter((p: any) => !existingIds.has(p.id || p.shortCode) && (p.caption?.length || 0) > 50);
      for (const post of newPosts.slice(0, 3)) {
        if (Date.now() > deadline) break;
        const insight = await extractInsights(post, anthropicKey);
        if (!insight) continue;
        results.insights_extracted++;
        const { error } = await sb.from('ig_knowledge_base').upsert(insight, { onConflict: 'post_id' });
        if (!error) results.insights_saved++;
        else results.errors.push(\insert: \);
      }
    } catch (e: any) { results.errors.push(\: \); }
  }

  await sb.from('ig_pending_runs').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', pendingRun.id);
  await sb.from('cron_logs').insert({ job_name: 'ig-fetch-results', status: results.errors.length === 0 ? 'success' : 'partial', details: results, ran_at: new Date().toISOString() });
  return NextResponse.json({ success: true, ...results });
}

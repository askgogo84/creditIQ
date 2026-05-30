// app/api/cron/ig-fetch-results/route.ts
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const maxDuration = 60;
const APIFY_BASE = 'https://api.apify.com/v2';

async function extractInsights(post: any, anthropicKey: string): Promise<any | null> {
  if (!post.caption || post.caption.length < 50) return null;
  const prompt = [
    'Indian credit card Instagram post by @' + (post.ownerUsername || 'unknown') + '.',
    'Caption: "' + (post.caption || '').slice(0, 800) + '"',
    '',
    'Return ONLY valid JSON, no markdown:',
    '{"insight_type":"transfer_hack|devaluation|card_comparison|sweet_spot|strategy|general","insight_summary":"one clear sentence","is_valuable":true,"structured_data":{"cards_mentioned":[],"actionable_tip":""}}'
  ].join('\n');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = (data.content?.[0]?.text || '').replace(/\\json|\\/g, '').trim();
  try {
    const parsed = JSON.parse(text);
    if (!parsed.is_valuable) return null;
    const handle = post.ownerUsername || post.owner?.username || 'unknown';
    const shortCode = post.shortCode || '';
    return {
      source_handle: handle,
      post_id: post.id || shortCode,
      post_url: shortCode ? 'https://instagram.com/p/' + shortCode : '',
      caption: (post.caption || '').slice(0, 500),
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
  const { data: pendingRuns } = await sb.from('ig_pending_runs').select('*').eq('status', 'pending').order('started_at', { ascending: false }).limit(1);
  if (!pendingRuns || pendingRuns.length === 0)
    return NextResponse.json({ success: true, message: 'No pending runs found' });
  const pendingRun = pendingRuns[0];
  const runIds: Record<string, string> = pendingRun.run_ids;
  const results = { posts_scraped: 0, insights_extracted: 0, insights_saved: 0, run_statuses: {} as Record<string, string>, errors: [] as string[] };
  const { data: existing } = await sb.from('ig_knowledge_base').select('post_id').limit(1000);
  const existingIds = new Set((existing || []).map((r: any) => r.post_id));
  const deadline = Date.now() + 45000;
  for (const [handle, runId] of Object.entries(runIds)) {
    if (Date.now() > deadline) { results.errors.push('deadline_reached'); break; }
    try {
      const statusRes = await fetch(APIFY_BASE + '/actor-runs/' + runId + '?token=' + apifyToken);
      if (!statusRes.ok) { results.errors.push(handle + ': status fetch failed'); continue; }
      const status = await statusRes.json();
      const runStatus = status.data?.status || 'UNKNOWN';
      results.run_statuses[handle] = runStatus;
      if (runStatus !== 'SUCCEEDED') { results.errors.push(handle + ': ' + runStatus); continue; }
      const dataRes = await fetch(APIFY_BASE + '/actor-runs/' + runId + '/dataset/items?token=' + apifyToken + '&limit=5');
      if (!dataRes.ok) continue;
      const posts = await dataRes.json();
      results.posts_scraped += posts.length;
      const newPosts = (posts as any[]).filter((p: any) => !existingIds.has(p.id || p.shortCode) && (p.caption?.length || 0) > 50);
      for (const post of newPosts.slice(0, 3)) {
        if (Date.now() > deadline) break;
        const insight = await extractInsights(post, anthropicKey);
        if (!insight) continue;
        results.insights_extracted++;
        const { error } = await sb.from('ig_knowledge_base').upsert(insight, { onConflict: 'post_id' });
        if (!error) results.insights_saved++;
        else results.errors.push('insert: ' + JSON.stringify(error));
      }
    } catch (e: any) { results.errors.push(handle + ': ' + e.message); }
  }
  await sb.from('ig_pending_runs').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', pendingRun.id);
  await sb.from('cron_logs').insert({ job_name: 'ig-fetch-results', status: results.errors.length === 0 ? 'success' : 'partial', details: results, ran_at: new Date().toISOString() });
  return NextResponse.json({ success: true, ...results });
}

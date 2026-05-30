// app/api/cron/ig-fetch-results/route.ts
// Step 2: Fetch completed Apify runs, extract insights with Claude Vision
// Called 10 mins after ig-start-runs

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

const APIFY_BASE = 'https://api.apify.com/v2';

async function extractInsights(post: any, anthropicKey: string): Promise<any | null> {
  if (!post.caption || post.caption.length < 50) return null;
  const content: any[] = [{
    type: 'text',
    text: `Instagram post from @${post.ownerUsername} about Indian credit cards.\nCaption: "${post.caption?.slice(0, 1000)}"\n\nExtract insights. Return ONLY valid JSON:\n{"insight_type":"transfer_hack|devaluation|card_comparison|sweet_spot|strategy|general","insight_summary":"one clear sentence","is_valuable":true,"structured_data":{"cards_mentioned":[],"transfer_ratios":{},"devaluation_details":{},"sweet_spots":[],"actionable_tip":""}}`
  }];
  for (const imgUrl of (post.images || []).slice(0, 3)) {
    try {
      const imgRes = await fetch(imgUrl);
      if (!imgRes.ok) continue;
      const imgBuffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(imgBuffer).toString('base64');
      content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } });
    } catch {}
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content }] }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.content?.[0]?.text || '';
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    if (!parsed.is_valuable) return null;
    return {
      source_handle: post.ownerUsername,
      post_id: post.id,
      post_url: `https://instagram.com/p/${post.shortCode}`,
      caption: post.caption?.slice(0, 500) || '',
      post_date: post.timestamp,
      insight_type: parsed.insight_type,
      insight_summary: parsed.insight_summary,
      structured_data: parsed.structured_data,
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

  // Get latest pending run
  const { data: pendingRuns } = await sb
    .from('ig_pending_runs')
    .select('*')
    .eq('status', 'pending')
    .order('started_at', { ascending: false })
    .limit(1);

  if (!pendingRuns || pendingRuns.length === 0)
    return NextResponse.json({ success: true, message: 'No pending runs' });

  const pendingRun = pendingRuns[0];
  const runIds: Record<string, string> = pendingRun.run_ids;

  const results = { posts_scraped: 0, insights_extracted: 0, insights_saved: 0, errors: [] as string[] };

  // Get existing post IDs
  const { data: existing } = await sb.from('ig_knowledge_base').select('post_id').limit(1000);
  const existingIds = new Set((existing || []).map((r: any) => r.post_id));

  for (const [handle, runId] of Object.entries(runIds)) {
    try {
      // Check if run succeeded
      const statusRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${apifyToken}`);
      if (!statusRes.ok) continue;
      const status = await statusRes.json();
      if (status.data?.status !== 'SUCCEEDED') {
        results.errors.push(`${handle}: run status ${status.data?.status}`);
        continue;
      }

      // Fetch results
      const dataRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${apifyToken}`);
      if (!dataRes.ok) continue;
      const posts = await dataRes.json();
      results.posts_scraped += posts.length;

      const newPosts = posts.filter((p: any) => !existingIds.has(p.id) && p.caption?.length > 50);

      for (const post of newPosts) {
        const insight = await extractInsights(post, anthropicKey);
        if (!insight) continue;
        results.insights_extracted++;
        const { error } = await sb.from('ig_knowledge_base').upsert(insight, { onConflict: 'post_id' });
        if (!error) results.insights_saved++;
      }
    } catch (e: any) { results.errors.push(`${handle}: ${e.message}`); }
  }

  // Mark run as processed
  await sb.from('ig_pending_runs').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', pendingRun.id);

  await sb.from('cron_logs').insert({
    job_name: 'ig-fetch-results',
    status: results.errors.length === 0 ? 'success' : 'partial',
    details: results,
    ran_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true, ...results });
}

// app/api/cron/ig-fetch-results/route.ts
import { NextRequest, NextResponse } from 'next/server';

async function embedAndSave(sb: any, id: string, text: string): Promise<void> {
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text.slice(0, 8000) }),
    })
    if (!res.ok) return
    const data = await res.json()
    const embedding = data.data?.[0]?.embedding
    if (embedding) {
      await sb.from('intelligence_kb').update({ embedding }).eq('id', id)
    }
  } catch { /* non-fatal */ }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60;
const APIFY_BASE = 'https://api.apify.com/v2';

async function getEmbedding(text: string, openaiKey: string): Promise<number[] | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + openaiKey },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.embedding || null;
  } catch { return null; }
}

async function extractInsights(post: any, anthropicKey: string): Promise<any | null> {
  if (!post.caption || post.caption.length < 50) return null;
  const prompt = [
    'Indian credit card Instagram post by @' + (post.ownerUsername || 'unknown') + '.',
    'Caption: "' + (post.caption || '').slice(0, 800) + '"',
    '',
    'Return ONLY valid JSON, no markdown:',
    '{"insight_type":"transfer_hack|devaluation|card_comparison|sweet_spot|strategy|general","insight_summary":"one clear sentence","is_valuable":true,"structured_data":{"cards_mentioned":[],"actionable_tip":""}}'
  ].join('\n');
  console.log('extractInsights caption preview:', (post.caption || '').slice(0, 100));
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 600, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const raw = data.content?.[0]?.text || '';
  const text = raw.replace(/`json|`|'''json|'''/g, '').replace(/^[^{]*/,'').replace(/[^}]*$/,'').trim();
  console.log('Claude raw response:', text.slice(0, 300));
  try {
    const parsed = JSON.parse(text);
    if (parsed.is_valuable === false) return null;
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
  // Vercel crons are called by Vercel infrastructure only — no secret needed
  const apifyToken = process.env.APIFY_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY || '';
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
      const newPosts = (posts as any[]).filter((p: any) => (p.caption?.length || 0) > 50);
      for (const post of newPosts.slice(0, 3)) {
        if (Date.now() > deadline) break;
        const insight = await extractInsights(post, anthropicKey);
        if (!insight) continue;
        results.insights_extracted++;
        if (openaiKey) {
          const embText = insight.insight_type + ': ' + insight.insight_summary + ' (via @' + insight.source_handle + ')';
          const embedding = await getEmbedding(embText, openaiKey);
          if (embedding) (insight as any).embedding = embedding;
        }
        // Map to intelligence_kb schema
        const kbRecord = {
          source: 'instagram',
          source_url: insight.post_url,
          creator_handle: insight.source_handle,
          creator_name: insight.source_handle,
          title: insight.insight_summary,
          content: insight.caption,
          insight_type: insight.insight_type,
          card_mentions: insight.structured_data?.cards_mentioned || [],
          trust_score: Math.min(1.0, (insight.likes || 0) / 10000),
          engagement: insight.likes || 0,
          published_at: insight.post_date,
          scraped_at: new Date().toISOString(),
          active: true,
        }
        // Also keep ig_knowledge_base for legacy admin view
        const { error } = await sb.from('ig_knowledge_base').upsert(insight, { onConflict: 'post_id' });
        // Save to intelligence_kb
        const { data: kbInserted } = await sb.from('intelligence_kb').upsert(kbRecord, { onConflict: 'source_url' }).select('id').single();
        if (kbInserted?.id) {
          const embedText = [kbRecord.insight_type, kbRecord.title, kbRecord.content?.slice(0,500), kbRecord.card_mentions.join(', ')].filter(Boolean).join(' | ')
          await embedAndSave(sb, kbInserted.id, embedText)
        }
        if (!error) {
          results.insights_saved++;
          // Layer 3: auto-detect devaluations from community signals
          if (insight.insight_type === 'devaluation' && insight.structured_data?.cards_mentioned?.length > 0) {
            for (const cardName of insight.structured_data.cards_mentioned) {
              const { data: existing } = await sb
                .from('devaluation_events')
                .select('id')
                .ilike('card_name', '%' + cardName + '%')
                .gte('event_date', new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0])
                .limit(1);
              if (!existing?.length) {
                await sb.from('devaluation_events').insert({
                  card_name: cardName,
                  description: insight.insight_summary,
                  impact: 'medium',
                  event_date: new Date().toISOString().split('T')[0],
                  status: 'community_detected',
                  source: 'ig_pipeline',
                  source_url: insight.post_url,
                  detected_at: new Date().toISOString(),
                });
              }
            }
          }
        } else results.errors.push('insert: ' + JSON.stringify(error));
      }
    } catch (e: any) { results.errors.push(handle + ': ' + e.message); }
  }
  await sb.from('ig_pending_runs').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', pendingRun.id);
  await sb.from('cron_logs').insert({ job_name: 'ig-fetch-results', status: results.errors.length === 0 ? 'success' : 'partial', details: results, ran_at: new Date().toISOString() });
  return NextResponse.json({ success: true, ...results });
}

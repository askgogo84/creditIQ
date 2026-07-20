// app/api/cron/ig-fetch-results/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrCron } from '@/lib/admin-auth';
import { cleanForStorage } from '@/lib/sanitize-text';
import { callClaude, MODELS } from '@/lib/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300; // was 60 - needs room for many handles
const APIFY_BASE = 'https://api.apify.com/v2';

async function getEmbedding(text: string, openaiKey: string): Promise<number[] | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + openaiKey },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text.slice(0, 8000) }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.embedding || null;
  } catch { return null; }
}

async function extractInsights(post: any): Promise<any | null> {
  if (!post.caption || post.caption.length < 50) return null;
  const prompt = [
    'You are screening an Instagram post for an Indian credit-card & points intelligence database.',
    'Post by @' + (post.ownerUsername || 'unknown') + '.',
    'Caption: "' + (post.caption || '').slice(0, 800) + '"',
    '',
    'Decide whether this post contains ACTIONABLE value for Indian credit-card holders: specific cards, reward points/miles, transfer partners, award redemptions, sweet spots, devaluations, or eligibility/upgrade strategy.',
    'Set "is_valuable": false if the post is NOT about that - e.g. lifestyle or travel content with no card/points angle, motivational or personal-brand posts, course/workshop promotion, generic personal finance (stocks, mutual funds, Nifty, Buffett, wealth mindset), or points/cards tied only to non-Indian-issued products.',
    'Only set "is_valuable": true when there is a concrete, usable credit-card or points takeaway.',
    '',
    'Return ONLY valid JSON, no markdown:',
    '{"insight_type":"transfer_hack|devaluation|card_comparison|sweet_spot|strategy|general","insight_summary":"one clear sentence","is_valuable":true,"structured_data":{"cards_mentioned":[],"actionable_tip":""}}'
  ].join('\n');
  const ai = await callClaude({
    model: MODELS.haiku,
    max_tokens: 600,
    messages: [{ role: 'user', content: prompt }],
  });
  if (!ai.ok) { console.error('ig-fetch-results AI failed:', ai.reason); return null; }
  const raw = ai.text || '';
  const text = raw.replace(/`json|`|'''json|'''/g, '').replace(/^[^{]*/, '').replace(/[^}]*$/, '').trim();
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
  const denied = await requireAdminOrCron(req); if (denied) return denied;
  const apifyToken = process.env.APIFY_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY || '';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apifyToken || !anthropicKey || !supabaseUrl || !supabaseKey)
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(supabaseUrl, supabaseKey);

  // Process ALL pending runs (was: limit 1, newest only - abandoned the rest forever)
  const { data: pendingRuns } = await sb.from('ig_pending_runs')
    .select('*').eq('status', 'pending').order('started_at', { ascending: true }).limit(5);
  if (!pendingRuns || pendingRuns.length === 0)
    return NextResponse.json({ success: true, message: 'No pending runs found' });

  const results = { posts_scraped: 0, insights_extracted: 0, insights_saved: 0, skipped_existing: 0, run_statuses: {} as Record<string, string>, errors: [] as string[] };

  // Real dedup set against intelligence_kb by source_url (the table CIRA reads)
  const { data: existing } = await sb.from('intelligence_kb').select('source_url').eq('source', 'instagram').limit(5000);
  const existingUrls = new Set((existing || []).map((r: any) => r.source_url).filter(Boolean));

  const deadline = Date.now() + 270000; // 4.5 min, matches maxDuration

  for (const pendingRun of pendingRuns) {
    const runIds: Record<string, string> = pendingRun.run_ids || {};
    let runHadDeadline = false;
    let runHasUnfinished = false; // true if any handle still RUNNING/READY (not yet terminal)

    for (const [handle, runId] of Object.entries(runIds)) {
      if (Date.now() > deadline) { results.errors.push('deadline_reached'); runHadDeadline = true; break; }
      try {
        const statusRes = await fetch(APIFY_BASE + '/actor-runs/' + runId + '?token=' + apifyToken);
        if (!statusRes.ok) { results.errors.push(handle + ': status fetch failed'); continue; }
        const status = await statusRes.json();
        const runStatus = status.data?.status || 'UNKNOWN';
        results.run_statuses[handle] = runStatus;
        if (runStatus !== 'SUCCEEDED') {
          // RUNNING/READY are non-terminal: keep this pending run alive so a later call resumes them.
          // FAILED/ABORTED/TIMED-OUT are terminal failures: nothing to wait for, let the run close.
          if (runStatus === 'RUNNING' || runStatus === 'READY') runHasUnfinished = true;
          results.errors.push(handle + ': ' + runStatus);
          continue;
        }

        // FIX: pull all 20 (was limit=5)
        const dataRes = await fetch(APIFY_BASE + '/actor-runs/' + runId + '/dataset/items?token=' + apifyToken + '&limit=20');
        if (!dataRes.ok) continue;
        const posts = await dataRes.json();
        results.posts_scraped += posts.length;

        // FIX: process ALL qualifying posts (was slice 0,3), and skip ones already in KB
        const newPosts = (posts as any[]).filter((p: any) => {
          if ((p.caption?.length || 0) <= 50) return false;
          const sc = p.shortCode || '';
          const url = sc ? 'https://instagram.com/p/' + sc : '';
          if (url && existingUrls.has(url)) { results.skipped_existing++; return false; }
          return true;
        });

        for (const post of newPosts) {
          if (Date.now() > deadline) { runHadDeadline = true; break; }
          const insight = await extractInsights(post);
          if (!insight) continue;
          results.insights_extracted++;

          const kbRecord: any = {
            source: 'instagram',
            source_url: insight.post_url,
            creator_handle: insight.source_handle,
            creator_name: cleanForStorage(insight.source_handle),
            title: cleanForStorage(insight.insight_summary),
            content: cleanForStorage(insight.caption),
            insight_type: insight.insight_type,
            card_mentions: insight.structured_data?.cards_mentioned || [],
            trust_score: Math.min(1.0, (insight.likes || 0) / 10000),
            engagement: insight.likes || 0,
            published_at: insight.post_date,
            scraped_at: new Date().toISOString(),
            active: true,
          };
          if (openaiKey) {
            const embText = [kbRecord.insight_type, kbRecord.title, kbRecord.content?.slice(0, 500), (kbRecord.card_mentions || []).join(', ')].filter(Boolean).join(' | ');
            const embedding = await getEmbedding(embText, openaiKey);
            if (embedding) kbRecord.embedding = embedding;
          }

          // legacy admin table (best-effort)
          await sb.from('ig_knowledge_base').upsert(insight, { onConflict: 'post_id' });

          // main KB - insert; on conflict do nothing so genuine new rows always land
          const { error } = await sb.from('intelligence_kb').upsert(kbRecord, { onConflict: 'source_url', ignoreDuplicates: true });
          if (!error) {
            results.insights_saved++;
            if (insight.post_url) existingUrls.add(insight.post_url);
            if (insight.insight_type === 'devaluation' && insight.structured_data?.cards_mentioned?.length > 0) {
              for (const cardName of insight.structured_data.cards_mentioned) {
                const { data: dev } = await sb.from('devaluation_events').select('id')
                  .ilike('card_name', '%' + cardName + '%')
                  .gte('event_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]).limit(1);
                if (!dev?.length) {
                  await sb.from('devaluation_events').insert({
                    card_name: cardName, description: insight.insight_summary, impact: 'medium',
                    event_date: new Date().toISOString().split('T')[0], status: 'community_detected',
                    source: 'ig_pipeline', source_url: insight.post_url, detected_at: new Date().toISOString(),
                  });
                }
              }
            }
          } else { results.errors.push('insert: ' + JSON.stringify(error)); }
        }
      } catch (e: any) { results.errors.push(handle + ': ' + e.message); }
    }

    // Mark processed only when we didn't bail on the deadline AND every handle reached a
    // terminal state. If some are still RUNNING/READY, leave it pending so the next call
    // resumes them (instead of orphaning slow handles). Age cap: give up on a run after
    // 60 min so a permanently-stuck handle can't cause infinite retry.
    const runAgeMs = Date.now() - new Date(pendingRun.started_at).getTime();
    const runIsStale = runAgeMs > 60 * 60 * 1000;
    if (!runHadDeadline && (!runHasUnfinished || runIsStale)) {
      await sb.from('ig_pending_runs').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', pendingRun.id);
    }
    if (Date.now() > deadline) break;
  }

  await sb.from('cron_logs').insert({ job_name: 'ig-fetch-results', status: results.errors.length === 0 ? 'success' : 'partial', details: results, ran_at: new Date().toISOString() });
  return NextResponse.json({ success: true, ...results });
}

// app/api/cron/ig-fetch-results/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminOrCron } from '@/lib/admin-auth';
import { cleanForStorage } from '@/lib/sanitize-text';
import { callClaude, MODELS } from '@/lib/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300;
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

function postImageUrls(post: any): string[] {
  const urls: string[] = [];
  const add = (value: unknown) => {
    if (typeof value === 'string' && /^https?:\/\//i.test(value) && !urls.includes(value)) urls.push(value);
  };
  if (Array.isArray(post?.images)) post.images.forEach(add);
  add(post?.displayUrl);
  add(post?.imageUrl);
  if (Array.isArray(post?.childPosts)) {
    for (const child of post.childPosts) {
      add(child?.displayUrl);
      add(child?.imageUrl);
      if (Array.isArray(child?.images)) child.images.forEach(add);
    }
  }
  return urls.slice(0, 2);
}

async function imageBlock(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const type = (res.headers.get('content-type') || 'image/jpeg').split(';')[0].toLowerCase();
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    if (!allowed.has(type)) return null;
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength > 5_000_000) return null;
    return {
      type: 'image',
      source: { type: 'base64', media_type: type, data: Buffer.from(bytes).toString('base64') },
    };
  } catch { return null; }
}

async function extractInsights(post: any): Promise<any | null> {
  const caption = String(post?.caption || '');
  const imageUrls = postImageUrls(post);
  if (caption.length < 30 && imageUrls.length === 0) return null;

  const prompt = [
    'You are screening an Instagram post for an Indian credit-card, airline-miles and hotel-points intelligence database.',
    'Post by @' + (post.ownerUsername || post.owner?.username || 'unknown') + '.',
    'Caption: "' + caption.slice(0, 1000) + '"',
    imageUrls.length ? 'IMPORTANT: Read the attached carousel/infographic images too. Many creator posts put the actual prices, card names, transfer ratios, award costs and comparisons in the image rather than the caption.' : '',
    '',
    'Keep only ACTIONABLE value for Indian cardholders: specific cards, reward rates, transfer partners/ratios, airline or hotel redemptions, award sweet spots, fees, exclusions, lounge rules, devaluations or eligibility/upgrade strategy.',
    'Set is_valuable=false for lifestyle travel, generic finance, motivational/personal-brand content, promotions with no card/points facts, or non-Indian card content with no relevance to Indian-issued cards.',
    'Do not infer a transfer ratio that is not explicitly present. Community claims are signals, not issuer verification.',
    '',
    'Return ONLY valid JSON, no markdown:',
    '{"insight_type":"transfer_hack|devaluation|card_comparison|sweet_spot|strategy|reward_tip|card_review|general","insight_summary":"one specific sentence","is_valuable":true,"structured_data":{"cards_mentioned":[],"banks_mentioned":[],"transfer_ratios":{},"airline_programmes":[],"hotel_programmes":[],"actionable_tip":"1-2 concise sentences with the useful numbers/facts"}}'
  ].filter(Boolean).join('\n');

  const content: any[] = [{ type: 'text', text: prompt }];
  for (const url of imageUrls) {
    const block = await imageBlock(url);
    if (block) content.push(block);
  }

  const ai = await callClaude({
    model: MODELS.haiku,
    max_tokens: 700,
    messages: [{ role: 'user', content }],
  });
  if (!ai.ok) { console.error('ig-fetch-results AI failed:', ai.reason); return null; }
  const raw = ai.text || '';
  const text = raw.replace(/```json|```|'''json|'''/g, '').replace(/^[^{]*/, '').replace(/[^}]*$/, '').trim();
  try {
    const parsed = JSON.parse(text);
    if (parsed.is_valuable === false) return null;
    const handle = post.ownerUsername || post.owner?.username || 'unknown';
    const shortCode = post.shortCode || '';
    return {
      source_handle: handle,
      post_id: post.id || shortCode,
      post_url: shortCode ? 'https://instagram.com/p/' + shortCode : '',
      caption: caption.slice(0, 700),
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

  const { data: pendingRuns } = await sb.from('ig_pending_runs')
    .select('*').eq('status', 'pending').order('started_at', { ascending: true }).limit(5);
  if (!pendingRuns || pendingRuns.length === 0)
    return NextResponse.json({ success: true, message: 'No pending runs found' });

  const results = { posts_scraped: 0, insights_extracted: 0, insights_saved: 0, skipped_existing: 0, run_statuses: {} as Record<string, string>, errors: [] as string[] };

  const { data: existing } = await sb.from('intelligence_kb').select('source_url').eq('source', 'instagram').limit(5000);
  const existingUrls = new Set((existing || []).map((r: any) => r.source_url).filter(Boolean));

  const deadline = Date.now() + 270000;

  for (const pendingRun of pendingRuns) {
    const runIds: Record<string, string> = pendingRun.run_ids || {};
    let runHadDeadline = false;
    let runHasUnfinished = false;

    for (const [handle, runId] of Object.entries(runIds)) {
      if (Date.now() > deadline) { results.errors.push('deadline_reached'); runHadDeadline = true; break; }
      try {
        const statusRes = await fetch(APIFY_BASE + '/actor-runs/' + runId, { headers: { Authorization: 'Bearer ' + apifyToken } });
        if (!statusRes.ok) { results.errors.push(handle + ': status fetch failed'); continue; }
        const status = await statusRes.json();
        const runStatus = status.data?.status || 'UNKNOWN';
        results.run_statuses[handle] = runStatus;
        if (runStatus !== 'SUCCEEDED') {
          if (runStatus === 'RUNNING' || runStatus === 'READY') runHasUnfinished = true;
          results.errors.push(handle + ': ' + runStatus);
          continue;
        }

        const dataRes = await fetch(APIFY_BASE + '/actor-runs/' + runId + '/dataset/items?limit=20', { headers: { Authorization: 'Bearer ' + apifyToken } });
        if (!dataRes.ok) continue;
        const posts = await dataRes.json();
        results.posts_scraped += posts.length;

        const newPosts = (posts as any[]).filter((p: any) => {
          const hasReadableContent = (p.caption?.length || 0) >= 30 || postImageUrls(p).length > 0;
          if (!hasReadableContent) return false;
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

          const usefulContent = insight.structured_data?.actionable_tip || insight.caption;
          const kbRecord: any = {
            source: 'instagram',
            source_url: insight.post_url,
            creator_handle: insight.source_handle,
            creator_name: cleanForStorage(insight.source_handle),
            title: cleanForStorage(insight.insight_summary),
            content: cleanForStorage(usefulContent),
            insight_type: insight.insight_type,
            card_mentions: insight.structured_data?.cards_mentioned || [],
            bank_mentions: insight.structured_data?.banks_mentioned || [],
            trust_score: Math.min(0.9, 0.25 + Math.log10(Math.max(1, insight.likes || 0)) * 0.12),
            engagement: insight.likes || 0,
            published_at: insight.post_date,
            scraped_at: new Date().toISOString(),
            active: true,
          };
          if (openaiKey) {
            const embText = [kbRecord.insight_type, kbRecord.title, kbRecord.content?.slice(0, 700), (kbRecord.card_mentions || []).join(', ')].filter(Boolean).join(' | ');
            const embedding = await getEmbedding(embText, openaiKey);
            if (embedding) kbRecord.embedding = embedding;
          }

          await sb.from('ig_knowledge_base').upsert(insight, { onConflict: 'post_id' });

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

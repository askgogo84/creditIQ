import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrCron } from '@/lib/admin-auth';
import { cleanForStorage } from '@/lib/sanitize-text';
import { callClaude, MODELS } from '@/lib/ai';

export const runtime = "nodejs";
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300;

const TARGET_HANDLES = [
  "creditcardtalks",
  "everypaisamatters",
  "thegreatindianmiles",
  "the.financial.boss",
  "cashoverflow.in",
];

const APIFY_ACTOR = "apify~instagram-scraper";
const APIFY_BASE = "https://api.apify.com/v2";

async function scrapeHandle(handle: string, apifyToken: string): Promise<any[]> {
  const runRes = await fetch(`${APIFY_BASE}/acts/${APIFY_ACTOR}/runs?token=${apifyToken}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ directUrls: [`https://www.instagram.com/${handle}/`], resultsType: "posts", resultsLimit: 20 }),
  });
  if (!runRes.ok) return [];
  const runData = await runRes.json();
  const runId = runData.data?.id;
  if (!runId) return [];
  let attempts = 0;
  while (attempts < 24) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${apifyToken}`);
    const status = await statusRes.json();
    if (status.data?.status === "SUCCEEDED") break;
    if (status.data?.status === "FAILED") return [];
    attempts++;
  }
  const dataRes = await fetch(`${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${apifyToken}`);
  if (!dataRes.ok) return [];
  return await dataRes.json();
}

async function extractInsights(post: any): Promise<any | null> {
  if (!post.caption || post.caption.length < 50) return null;
  const content: any[] = [{
    type: "text",
    text: `Instagram post from @${post.ownerUsername} about Indian credit cards.\nCaption: "${post.caption}"\n\nExtract insights. Return ONLY valid JSON:\n{"insight_type":"transfer_hack|devaluation|card_comparison|sweet_spot|strategy|general","insight_summary":"one clear sentence","is_valuable":true,"structured_data":{"cards_mentioned":[],"transfer_ratios":{},"devaluation_details":{},"sweet_spots":[],"actionable_tip":""}}`
  }];
  for (const imgUrl of (post.images || []).slice(0, 4)) {
    try {
      const imgRes = await fetch(imgUrl);
      if (!imgRes.ok) continue;
      const imgBuffer = await imgRes.arrayBuffer();
      const base64 = Buffer.from(imgBuffer).toString("base64");
      content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 } });
    } catch {}
  }
  const ai = await callClaude({
    model: MODELS.opus,
    max_tokens: 800,
    messages: [{ role: "user", content }],
  });
  if (!ai.ok) { console.error('ig-intelligence AI failed:', ai.reason); return null; }
  const text = ai.text || "";
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    if (!parsed.is_valuable) return null;
    return {
      source_handle: post.ownerUsername,
      post_id: post.id,
      post_url: `https://instagram.com/p/${post.shortCode}`,
      caption: cleanForStorage(post.caption?.slice(0, 500) || ""),
      post_date: post.timestamp,
      insight_type: parsed.insight_type,
      insight_summary: cleanForStorage(parsed.insight_summary),
      structured_data: parsed.structured_data,
      likes: post.likesCount || 0,
      scraped_at: new Date().toISOString(),
    };
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const denied = await requireAdminOrCron(req); if (denied) return denied;
  // Vercel crons are called by Vercel infrastructure only — no secret needed
  const apifyToken = process.env.APIFY_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apifyToken || !anthropicKey || !supabaseUrl || !supabaseKey)
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  const { createClient } = await import("@supabase/supabase-js");
  const sb = createClient(supabaseUrl, supabaseKey);
  const results = { handles_processed: 0, posts_scraped: 0, insights_extracted: 0, insights_saved: 0, errors: [] as string[] };
  const { data: existing } = await sb.from("ig_knowledge_base").select("post_id").limit(500);
  const existingIds = new Set((existing || []).map((r: any) => r.post_id));
  for (const handle of TARGET_HANDLES) {
    try {
      const posts = await scrapeHandle(handle, apifyToken);
      results.posts_scraped += posts.length;
      const newPosts = posts.filter((p: any) => !existingIds.has(p.id));
      for (const post of newPosts) {
        const insight = await extractInsights(post);
        if (!insight) continue;
        results.insights_extracted++;
        const { error } = await sb.from("ig_knowledge_base").upsert(insight, { onConflict: "post_id" });
        if (!error) results.insights_saved++;
      }
      results.handles_processed++;
    } catch (e: any) { results.errors.push(`${handle}: ${e.message}`); }
  }
  await sb.from("cron_logs").insert({ job_name: "ig-intelligence", status: results.errors.length === 0 ? "success" : "partial", details: results, ran_at: new Date().toISOString() });
  return NextResponse.json({ success: true, ...results });
}
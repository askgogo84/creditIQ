
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Subreddits and queries to mine for Indian credit card intelligence
const TARGETS = [
  { subreddit: "IndiaInvestments", query: "credit card" },
  { subreddit: "IndiaInvestments", query: "rewards points lounge" },
  { subreddit: "CreditCardsIndia", query: "HDFC Axis SBI rewards" },
  { subreddit: "CreditCardsIndia", query: "devaluation benefits" },
  { subreddit: "india", query: "credit card reward points hack" },
];

// How many days back to look (avoids re-scraping old content)
const LOOKBACK_DAYS = 30;

interface ArcticPost {
  id: string;
  title: string;
  selftext: string;
  score: number;
  created_utc: number;
  subreddit: string;
  url: string;
  author: string;
  num_comments: number;
}

interface ProcessedInsight {
  insight_type: string;
  content: string;
  card_mentioned: string | null;
  source_url: string;
  relevance_score: number;
}

async function fetchArcticShiftPosts(
  subreddit: string,
  query: string,
  afterDate: Date
): Promise<ArcticPost[]> {
  const afterStr = afterDate.toISOString().split("T")[0]; // YYYY-MM-DD

  // CORRECT params: query= (not q=), sort=desc (not sort=score)
  const url = new URL(
    "https://arctic-shift.photon-reddit.com/api/posts/search"
  );
  url.searchParams.set("subreddit", subreddit);
  url.searchParams.set("query", query); // FIX: was "q" — invalid param
  url.searchParams.set("sort", "desc"); // FIX: was "score" — invalid value
  url.searchParams.set("limit", "25");
  url.searchParams.set("after", afterStr);
  url.searchParams.set(
    "fields",
    "id,title,selftext,score,created_utc,subreddit,url,author,num_comments"
  );

  const resp = await fetch(url.toString(), {
    headers: { "User-Agent": "CreditIQ-Bot/1.0 (creditiq.app)" },
    signal: AbortSignal.timeout(15000),
  });

  if (!resp.ok) {
    throw new Error(`Arctic Shift HTTP ${resp.status}: ${await resp.text()}`);
  }

  const data = await resp.json();

  if (data.error) {
    throw new Error(`Arctic Shift API error: ${data.error}`);
  }

  // Filter: only posts with score >= 5 and some body text
  return (data.data ?? []).filter(
    (p: ArcticPost) =>
      p.score >= 5 &&
      p.selftext &&
      p.selftext.length > 50 &&
      p.selftext !== "[removed]" &&
      p.selftext !== "[deleted]"
  );
}

async function classifyWithClaude(
  posts: ArcticPost[]
): Promise<ProcessedInsight[]> {
  if (posts.length === 0) return [];

  const postsText = posts
    .map(
      (p, i) =>
        `POST ${i + 1} [score:${p.score}] r/${p.subreddit}
Title: ${p.title}
Body: ${p.selftext.slice(0, 800)}
URL: https://reddit.com${p.url}`
    )
    .join("\n\n---\n\n");

  const prompt = `You are analysing Indian Reddit posts about credit cards to extract intelligence for CreditIQ, India's credit card intelligence platform.

For each post below, extract ONE insight if the post contains genuinely useful, specific information about:
- Card reward rates, point values, or earn multipliers
- Devaluation announcements or benefit cuts
- Hidden hacks, tricks, or underused features  
- Lounge access tips or milestone benefits
- Card comparisons with specific data points
- Fee waivers, offers, or limited-time deals

Skip posts that are vague, complain without specifics, or are off-topic.

Return a JSON array. Each item must have:
{
  "insight_type": one of: "devaluation_alert" | "reward_hack" | "card_comparison" | "benefit_tip" | "offer_alert" | "community_discussion",
  "content": "1-2 sentence insight in plain English, specific and actionable",
  "card_mentioned": "primary card name or null if generic",
  "source_url": "the post URL",
  "relevance_score": integer 1-10 (10 = highly specific, actionable intelligence)
}

Only include insights with relevance_score >= 6. Return [] if nothing qualifies.

POSTS TO ANALYSE:
${postsText}

Return ONLY valid JSON array, no markdown, no explanation.`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "[]";

  try {
    const parsed = JSON.parse(text.trim());
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error("Claude JSON parse failed:", text.slice(0, 200));
    return [];
  }
}

async function embedAndSave(
  insights: ProcessedInsight[],
  savedCount: { value: number }
): Promise<void> {
  for (const insight of insights) {
    // Skip if this URL is already in the DB
    const { data: existing } = await supabase
      .from("intelligence_kb")
      .select("id")
      .eq("source_url", insight.source_url)
      .eq("source", "reddit")
      .maybeSingle();

    if (existing) continue;

    // Generate embedding
    const embeddingResp = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: insight.content,
      }),
    });

    const embeddingData = await embeddingResp.json();
    const embedding = embeddingData?.data?.[0]?.embedding ?? null;

    // Insert into intelligence_kb
    const { error } = await supabase.from("intelligence_kb").insert({
      source: "reddit",
      insight_type: insight.insight_type,
      content: insight.content,
      title: null, // Reddit posts don't need a separate title field
      card_mentioned: insight.card_mentioned,
      source_url: insight.source_url,
      relevance_score: insight.relevance_score,
      embedding,
      active: true,
      scraped_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Supabase insert error:", error.message);
    } else {
      savedCount.value++;
    }
  }
}

export async function GET(req: NextRequest) {
  // Auth check
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const startTime = Date.now();
  const afterDate = new Date();
  afterDate.setDate(afterDate.getDate() - LOOKBACK_DAYS);

  let totalFetched = 0;
  let totalInsights = 0;
  const savedCount = { value: 0 };
  const errors: string[] = [];

  try {
    for (const target of TARGETS) {
      try {
        const posts = await fetchArcticShiftPosts(
          target.subreddit,
          target.query,
          afterDate
        );
        totalFetched += posts.length;

        if (posts.length === 0) continue;

        const insights = await classifyWithClaude(posts);
        totalInsights += insights.length;

        await embedAndSave(insights, savedCount);
      } catch (err) {
        const msg = `r/${target.subreddit} "${target.query}": ${err instanceof Error ? err.message : String(err)}`;
        console.error(msg);
        errors.push(msg);
      }

      // Rate limit — don't hammer Arctic Shift
      await new Promise((r) => setTimeout(r, 1000));
    }

    // Log to cron_logs
    await supabase.from("cron_logs").insert({
      job_name: "reddit-scrape",
      status: errors.length === 0 ? "success" : "partial",
      ran_at: new Date().toISOString(),
      records_inserted: savedCount.value,
      error_message: errors.length > 0 ? errors.join(" | ") : null,
      duration_ms: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      posts_fetched: totalFetched,
      insights_extracted: totalInsights,
      records_saved: savedCount.value,
      errors: errors.length > 0 ? errors : undefined,
      duration_ms: Date.now() - startTime,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    await supabase.from("cron_logs").insert({
      job_name: "reddit-scrape",
      status: "error",
      ran_at: new Date().toISOString(),
      records_inserted: 0,
      error_message: msg,
      duration_ms: Date.now() - startTime,
    });

    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}


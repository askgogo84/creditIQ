import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrCron } from '@/lib/admin-auth'
import { cleanForStorage } from '@/lib/sanitize-text'
import { createClient } from '@supabase/supabase-js'
import { callClaude, MODELS } from '@/lib/ai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 300

// Credit-card relevance gate. Post must mention at least one of these
// before we spend a Claude call on it. Kills restaurant-loan / Mudra / IOB junk.
const CC_KEYWORDS = [
  'credit card', 'creditcard', 'cc ', 'reward point', 'reward points', 'amex', 'american express',
  'infinia', 'magnus', 'atlas', 'horizon', 'millennia', 'regalia', 'diners', 'smartbuy',
  'edge miles', 'edge reward', 'krisflyer', 'aeroplan', 'avios', 'transfer partner', 'transfer ratio',
  'lounge access', 'annual fee', 'joining fee', 'milestone', 'cashback', 'cash back', 'forex markup',
  'lifetime free', 'ltf', 'reward rate', 'accelerated reward', 'air miles', 'airmiles', 'membership reward',
  'hdfc', 'axis', 'icici', 'sbi card', 'sbicard', 'au bank', 'idfc', 'rbl', 'yes bank', 'hsbc', 'standard chartered',
  'visa', 'mastercard', 'rupay', 'devaluation', 'devalued', 'redeem', 'redemption',
]

function isCreditCardRelevant(title: string, body: string): boolean {
  const text = (title + ' ' + body).toLowerCase()
  return CC_KEYWORDS.some(kw => text.includes(kw))
}

async function getRedditToken(): Promise<string | null> {
  const id = process.env.REDDIT_CLIENT_ID
  const secret = process.env.REDDIT_CLIENT_SECRET
  if (!id || !secret) return null
  try {
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': process.env.REDDIT_USER_AGENT || 'web:creditiq:v1.0 (by /u/creditiq)',
      },
      body: 'grant_type=client_credentials',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.access_token || null
  } catch { return null }
}

async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text.slice(0, 8000) }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.data?.[0]?.embedding || null
  } catch { return null }
}

async function extractInsight(title: string, body: string, subreddit: string): Promise<any | null> {
  const text = (title + ' ' + body).slice(0, 1500)
  if (text.length < 80) return null
  const prompt = `Indian credit card Reddit post from r/${subreddit}.
Title: "${title}"
Body: "${body.slice(0, 800)}"

You are filtering for a credit card intelligence platform. ONLY return is_valuable:true if this is genuinely about credit cards, reward points, transfers, devaluations, or card strategy. Loans, mutual funds, generic personal finance, login issues = is_valuable:false.

Return ONLY valid JSON:
{"insight_type":"transfer_hack|devaluation|sweet_spot|strategy|general|card_review|reward_tip","title":"one clear insight headline under 15 words","content":"2-3 sentence summary of what Indian CC users would find useful","card_mentions":["any card names mentioned"],"is_valuable":true}`

  const ai = await callClaude({
    model: MODELS.haiku,
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  })
  if (!ai.ok) { console.error('reddit-scrape AI failed:', ai.reason); return null }
  const raw = ai.text || ''
  const clean = raw.replace(/```json|```/g, '').replace(/^[^{]*/,'').replace(/[^}]*$/,'').trim()
  try {
    const parsed = JSON.parse(clean)
    if (parsed.is_valuable === false) return null   // <-- now respected
    return parsed
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const denied = await requireAdminOrCron(req); if (denied) return denied;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const token = await getRedditToken()
  if (!token) {
    await sb.from('cron_logs').insert({ job_name: 'reddit-scrape', status: 'error', details: { error: 'No Reddit OAuth token - check REDDIT_CLIENT_ID/SECRET' }, ran_at: new Date().toISOString() })
    return NextResponse.json({ error: 'Reddit OAuth not configured' }, { status: 500 })
  }

  const { data: sources } = await sb.from('reddit_sources').select('*').eq('active', true).limit(8)
  if (!sources?.length) return NextResponse.json({ message: 'No subreddits configured' })

  let saved = 0, skipped = 0, errors: string[] = []

  for (const source of sources) {
    try {
      const res = await fetch(
        `https://oauth.reddit.com/r/${source.subreddit}/new?limit=25`,
        { headers: { 'Authorization': `Bearer ${token}`, 'User-Agent': process.env.REDDIT_USER_AGENT || 'web:creditiq:v1.0 (by /u/creditiq)' } }
      )
      if (!res.ok) { errors.push(source.subreddit + ': oauth HTTP ' + res.status); continue }
      const data = await res.json()
      const posts = data.data?.children || []

      for (const { data: post } of posts) {
        if (!post?.title) continue

        // RELEVANCE GATE - skip non-CC before spending a Claude call
        if (!isCreditCardRelevant(post.title, post.selftext || '')) { skipped++; continue }

        const url = `https://reddit.com${post.permalink}`
        const { data: existing } = await sb.from('intelligence_kb').select('id').eq('source_url', url).single()
        if (existing) continue

        const insight = await extractInsight(post.title, post.selftext || '', source.subreddit)
        if (!insight) { skipped++; continue }

        const embedText = [insight.insight_type, insight.title, insight.content, insight.card_mentions?.join(', ')].filter(Boolean).join(' | ')
        const embedding = await getEmbedding(embedText)

        const record = {
          source: 'reddit',
          source_url: url,
          creator_handle: post.author,
          creator_name: 'r/' + source.subreddit,
          creator_followers: post.score,
          title: cleanForStorage(insight.title),
          content: cleanForStorage(insight.content),
          insight_type: (['transfer_hack','devaluation','sweet_spot','strategy','general','card_review','reward_tip','lounge','forex'].includes(insight.insight_type) ? insight.insight_type : 'strategy'),
          card_mentions: insight.card_mentions || [],
          trust_score: Math.min(1.0, post.score / 1000),
          published_at: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : new Date().toISOString(),
          scraped_at: new Date().toISOString(),
          active: true,
          ...(embedding ? { embedding } : {}),
        }

        const { error } = await sb.from('intelligence_kb').insert(record)
        if (!error) saved++
        else errors.push(post.id + ': ' + JSON.stringify(error))
      }
    } catch (e: any) {
      errors.push(source.subreddit + ': ' + e.message)
    }
  }

  await sb.from('cron_logs').insert({
    job_name: 'reddit-scrape',
    status: errors.length === 0 ? 'success' : 'partial',
    details: { saved, skipped, errors: errors.slice(0, 5) },
    ran_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, saved, skipped, errors: errors.slice(0, 5) })
}

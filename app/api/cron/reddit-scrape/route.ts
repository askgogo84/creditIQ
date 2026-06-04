import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 300

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

Return ONLY valid JSON:
{"insight_type":"transfer_hack|devaluation|sweet_spot|strategy|general|card_review|reward_tip","title":"one clear insight headline under 15 words","content":"2-3 sentence summary of what Indian CC users would find useful","card_mentions":["any card names mentioned"],"is_valuable":true}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const raw = data.content?.[0]?.text || ''
  const clean = raw.replace(/```json|```/g, '').replace(/^[^{]*/,'').replace(/[^}]*$/,'').trim()
  try {
    const parsed = JSON.parse(clean)
    // Save all insights, trust score handles quality filtering
    return parsed
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: sources } = await sb.from('reddit_sources').select('*').eq('active', true).limit(5)
  if (!sources?.length) return NextResponse.json({ message: 'No subreddits configured' })

  let saved = 0, errors: string[] = []

  for (const source of sources) {
    try {
      // Use Arctic Shift API — works from Vercel, updated through Apr 2026
      const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString().split('T')[0]
      const res = await fetch(
        `https://arctic-shift.photon-reddit.com/api/posts/search?subreddit=${source.subreddit}&after=${since}&limit=15&sort=score`,
        { headers: { 'User-Agent': 'CreditIQ/1.0 (creditiq.app)' } }
      )
      if (!res.ok) {
        errors.push(source.subreddit + ': arctic HTTP ' + res.status)
        continue
      }
      const data = await res.json()
      const rawPosts = data.data || []
      const posts = rawPosts.map((p: any) => ({ data: p }))

      for (const { data: post } of posts) { if (!post) continue
        if (!post?.title) continue

        // Check already processed
        const { data: existing } = await sb.from('intelligence_kb')
          .select('id').eq('source_url', `https://reddit.com${post.permalink}`).single()
        if (existing) continue

        const insight = await extractInsight(post.title, post.selftext || '', source.subreddit)
        if (!insight) continue

        const embedText = [insight.insight_type, insight.title, insight.content, insight.card_mentions?.join(', ')].filter(Boolean).join(' | ')
        const embedding = await getEmbedding(embedText)

        const record = {
          source: 'reddit',
          source_url: `https://reddit.com${post.permalink || '/r/' + source.subreddit}`,
          creator_handle: post.author,
          creator_name: 'r/' + source.subreddit,
          creator_followers: post.score,
          title: insight.title,
          content: insight.content,
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
    details: { saved, errors: errors.slice(0, 5) },
    ran_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, saved, errors: errors.slice(0, 5) })
}

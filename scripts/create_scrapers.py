import os

os.makedirs(r'app/api/cron/youtube-scrape', exist_ok=True)
os.makedirs(r'app/api/cron/reddit-scrape', exist_ok=True)

youtube = r"""import { NextRequest, NextResponse } from 'next/server'
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

async function extractInsight(title: string, transcript: string, channelName: string): Promise<any | null> {
  if (!transcript || transcript.length < 100) return null
  const prompt = `Indian credit card YouTube video.
Channel: ${channelName}
Title: "${title}"
Transcript excerpt: "${transcript.slice(0, 1500)}"

Return ONLY valid JSON:
{"insight_type":"transfer_hack|devaluation|card_comparison|sweet_spot|strategy|general","title":"one clear insight headline","content":"2-3 sentence summary of the key insight","card_mentions":[],"is_valuable":true}`

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
    if (!parsed.is_valuable) return null
    return parsed
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ytKey = process.env.YOUTUBE_API_KEY
  if (!ytKey) return NextResponse.json({ error: 'Missing YOUTUBE_API_KEY' }, { status: 500 })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: channels } = await sb.from('youtube_channels').select('*').eq('active', true).limit(10)
  if (!channels?.length) return NextResponse.json({ message: 'No channels configured' })

  let saved = 0, errors: string[] = []

  for (const channel of channels) {
    try {
      // Get latest videos
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?channelId=${channel.channel_id}&part=snippet&order=date&maxResults=3&type=video&key=${ytKey}`
      )
      if (!searchRes.ok) continue
      const searchData = await searchRes.json()
      const videos = searchData.items || []

      for (const video of videos) {
        const videoId = video.id?.videoId
        if (!videoId) continue

        // Check if already processed
        const { data: existing } = await sb.from('intelligence_kb')
          .select('id').eq('source_url', `https://youtube.com/watch?v=${videoId}`).single()
        if (existing) continue

        // Get transcript via YouTube captions API
        let transcript = ''
        try {
          const captionRes = await fetch(
            `https://www.googleapis.com/youtube/v3/captions?videoId=${videoId}&part=snippet&key=${ytKey}`
          )
          if (captionRes.ok) {
            const capData = await captionRes.json()
            // YouTube caption content requires OAuth - use title+description as proxy
            transcript = video.snippet?.description || ''
          }
        } catch {}

        // Use title + description if no transcript
        const textContent = video.snippet?.title + '. ' + (video.snippet?.description || '').slice(0, 1000)
        const insight = await extractInsight(video.snippet?.title || '', textContent, channel.channel_name || channel.channel_id)
        if (!insight) continue

        const embedText = [insight.insight_type, insight.title, insight.content, insight.card_mentions?.join(', ')].filter(Boolean).join(' | ')
        const embedding = await getEmbedding(embedText)

        const record = {
          source: 'youtube',
          source_url: `https://youtube.com/watch?v=${videoId}`,
          creator_handle: channel.channel_id,
          creator_name: channel.channel_name || channel.channel_id,
          creator_followers: channel.subscriber_count || 0,
          title: insight.title,
          content: insight.content,
          insight_type: insight.insight_type,
          card_mentions: insight.card_mentions || [],
          trust_score: Math.min(1.0, (channel.subscriber_count || 0) / 500000),
          published_at: video.snippet?.publishedAt,
          scraped_at: new Date().toISOString(),
          active: true,
          ...(embedding ? { embedding } : {}),
        }

        const { error } = await sb.from('intelligence_kb').insert(record)
        if (!error) saved++
        else errors.push(videoId + ': ' + JSON.stringify(error))
      }
    } catch (e: any) {
      errors.push(channel.channel_id + ': ' + e.message)
    }
  }

  await sb.from('cron_logs').insert({
    job_name: 'youtube-scrape',
    status: errors.length === 0 ? 'success' : 'partial',
    details: { saved, errors: errors.slice(0, 5) },
    ran_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, saved, errors: errors.slice(0, 5) })
}
"""

reddit = r"""import { NextRequest, NextResponse } from 'next/server'
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
{"insight_type":"transfer_hack|devaluation|card_comparison|sweet_spot|strategy|general","title":"one clear insight headline","content":"2-3 sentence summary","card_mentions":[],"is_valuable":true}`

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
    if (!parsed.is_valuable) return null
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
      const res = await fetch(
        `https://www.reddit.com/r/${source.subreddit}/hot.json?limit=10`,
        { headers: { 'User-Agent': 'CreditIQ/1.0 (creditiq.app)' } }
      )
      if (!res.ok) continue
      const data = await res.json()
      const posts = data.data?.children || []

      for (const { data: post } of posts) {
        if (!post.title || post.score < 10) continue

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
          source_url: `https://reddit.com${post.permalink}`,
          creator_handle: post.author,
          creator_name: 'r/' + source.subreddit,
          creator_followers: post.score,
          title: insight.title,
          content: insight.content,
          insight_type: insight.insight_type,
          card_mentions: insight.card_mentions || [],
          trust_score: Math.min(1.0, post.score / 1000),
          published_at: new Date(post.created_utc * 1000).toISOString(),
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
"""

with open(r'app/api/cron/youtube-scrape/route.ts', 'w', encoding='utf-8', newline='\n') as f:
    f.write(youtube)
print("OK: youtube-scrape route created")

with open(r'app/api/cron/reddit-scrape/route.ts', 'w', encoding='utf-8', newline='\n') as f:
    f.write(reddit)
print("OK: reddit-scrape route created")

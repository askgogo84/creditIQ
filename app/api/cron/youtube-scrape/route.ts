import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrCron } from '@/lib/admin-auth'
import { cleanForStorage } from '@/lib/sanitize-text'
import { createClient } from '@supabase/supabase-js'
import { callClaude, MODELS } from '@/lib/ai'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Credit card relevance gate
const CC_KEYWORDS = [
  'credit card','creditcard','reward point','amex','infinia','magnus','atlas',
  'horizon','millennia','regalia','diners','smartbuy','edge mile','krisflyer',
  'aeroplan','avios','transfer partner','lounge','annual fee','milestone',
  'cashback','forex','lifetime free','reward rate','air mile','membership reward',
  'marriott','bonvoy','accor','ihg','radisson','club itc','taj','neupass',
  'maharaja','flying blue','qatar privilege','etihad guest','turkish miles',
  'hdfc','axis','icici','sbi card','au bank','idfc','rbl','hsbc','visa',
  'mastercard','rupay','devaluation','redeem','redemption','points',
]
function isCCRelevant(title: string, desc: string): boolean {
  const t = (title + ' ' + desc).toLowerCase()
  return CC_KEYWORDS.some(k => t.includes(k))
}

async function getEmbedding(text: string): Promise<number[] | null> {
  try {
    const key = process.env.OPENAI_API_KEY
    if (!key) return null
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text.slice(0, 8000) }),
    })
    if (!res.ok) return null
    const d = await res.json()
    return d.data?.[0]?.embedding || null
  } catch { return null }
}

async function extractInsight(title: string, desc: string, channelName: string): Promise<any | null> {
  const ai = await callClaude({
    model: MODELS.haiku,
    max_tokens: 500,
    messages: [{ role: 'user', content: `Indian credit card YouTube video from "${channelName}".
Title: "${title}"
Description: "${desc.slice(0, 800)}"

Extract the KEY credit card / points insight. Only mark is_valuable:true if this contains SPECIFIC actionable data such as card names, reward rates, transfer ratios, airline/hotel partners, award costs, fee amounts, lounge rules, exclusions or devaluation details. Generic "top 10 cards" lists with no specifics = is_valuable:false.

Return ONLY valid JSON:
{"insight_type":"transfer_hack|devaluation|sweet_spot|strategy|card_review|reward_tip|general","title":"specific insight headline","content":"2-3 sentences with the specific data","card_mentions":[],"key_facts":["specific fact 1","specific fact 2"],"is_valuable":true}` }],
  })
  if (!ai.ok) { console.error('youtube-scrape AI failed:', ai.reason); return null }
  const raw = ai.text || ''
  const clean = raw.replace(/\`\`\`json|\`\`\`/g, '').replace(/^[^{]*/,'').replace(/[^}]*$/,'').trim()
  try {
    const p = JSON.parse(clean)
    if (!p.is_valuable) return null
    return p
  } catch { return null }
}

// DEDUPLICATION: Check if a similar insight already exists using pgvector
async function isDuplicate(sb: any, embedding: number[], title: string): Promise<boolean> {
  try {
    const { data } = await sb.rpc('match_intelligence', {
      query_embedding: embedding,
      match_threshold: 0.88,
      match_count: 1,
    })
    if (data?.length > 0) {
      console.log(`Dedup: "${title}" is similar to existing insight (similarity > 0.88)`)
      return true
    }
    return false
  } catch { return false }
}

// CONSOLIDATION: if multiple semantically related rows corroborate an insight,
// increase their community-confidence score. This is still NOT issuer verification.
async function boostConfirmation(sb: any, embedding: number[], insightTitle: string): Promise<void> {
  try {
    const { data } = await sb.rpc('match_intelligence', {
      query_embedding: embedding,
      match_threshold: 0.82,
      match_count: 4,
    })
    const ids = [...new Set((data || []).map((r: any) => r.id).filter(Boolean))]
    if (ids.length < 2) return
    const { data: rows } = await sb.from('intelligence_kb').select('id,trust_score').in('id', ids)
    for (const row of rows || []) {
      const next = Math.min(1, Number(row.trust_score || 0) + 0.15)
      await sb.from('intelligence_kb').update({ trust_score: next }).eq('id', row.id)
    }
    console.log(`Consolidation: boosted community confidence for ${ids.length} related insights about "${insightTitle}"`)
  } catch {}
}

export async function GET(req: NextRequest) {
  const denied = await requireAdminOrCron(req); if (denied) return denied
  const ytKey = process.env.YOUTUBE_API_KEY
  if (!ytKey) return NextResponse.json({ error: 'Missing YOUTUBE_API_KEY' }, { status: 500 })

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  // The database currently contains ~50 active channels. Process the full catalogue,
  // not the first 20 returned by Postgres. Purpose-built card channels are therefore
  // no longer silently excluded from the daily scan.
  const { data: channels } = await sb.from('youtube_channels').select('*').eq('active', true).limit(50)
  if (!channels?.length) return NextResponse.json({ message: 'No channels configured' })

  let saved = 0, skipped_irrelevant = 0, skipped_duplicate = 0, processed_channels = 0, errors: string[] = []
  const deadline = Date.now() + 270_000

  for (const channel of channels) {
    if (Date.now() > deadline) { errors.push('deadline_reached'); break }
    try {
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?channelId=${channel.channel_id}&part=snippet&order=date&maxResults=5&type=video&key=${ytKey}`
      )
      if (!searchRes.ok) { errors.push(channel.channel_name + ': ' + searchRes.status); continue }
      const searchData = await searchRes.json()
      processed_channels++

      for (const video of searchData.items || []) {
        if (Date.now() > deadline) break
        const videoId = video.id?.videoId
        const title = video.snippet?.title || ''
        const desc = video.snippet?.description || ''
        if (!videoId) continue

        if (!isCCRelevant(title, desc)) { skipped_irrelevant++; continue }

        const url = `https://youtube.com/watch?v=${videoId}`
        const { data: existing } = await sb.from('intelligence_kb').select('id').eq('source_url', url).maybeSingle()
        if (existing) continue

        const insight = await extractInsight(title, desc, channel.channel_name || channel.channel_id)
        if (!insight) { skipped_irrelevant++; continue }

        const embedText = [insight.title, insight.content, insight.key_facts?.join(' '), insight.card_mentions?.join(' ')].filter(Boolean).join(' | ')
        const embedding = await getEmbedding(embedText)

        if (embedding) {
          const dup = await isDuplicate(sb, embedding, insight.title)
          if (dup) {
            skipped_duplicate++
            await boostConfirmation(sb, embedding, insight.title)
            continue
          }
        }

        const subs = channel.subscribers || 0
        const record = {
          source: 'youtube',
          source_url: url,
          creator_handle: channel.channel_name || channel.channel_id,
          creator_name: channel.channel_name || channel.channel_id,
          creator_followers: subs,
          title: cleanForStorage(insight.title),
          content: cleanForStorage(insight.content),
          insight_type: (['transfer_hack','devaluation','sweet_spot','strategy','general','card_review','reward_tip','lounge','forex'].includes(insight.insight_type) ? insight.insight_type : 'strategy'),
          card_mentions: insight.card_mentions || [],
          trust_score: Math.min(0.95,
            (subs / 1000000) * 0.6 +
            (insight.key_facts?.length >= 2 ? 0.2 : 0.1) +
            0.15
          ),
          published_at: video.snippet?.publishedAt,
          scraped_at: new Date().toISOString(),
          active: true,
          ...(embedding ? { embedding } : {}),
        }

        const { error } = await sb.from('intelligence_kb').insert(record)
        if (!error) { saved++; if (embedding) await boostConfirmation(sb, embedding, insight.title) }
        else errors.push(videoId + ': ' + JSON.stringify(error))
      }
    } catch (e: any) {
      errors.push((channel.channel_name || channel.channel_id) + ': ' + e.message)
    }
  }

  await sb.from('cron_logs').insert({
    job_name: 'youtube-scrape',
    status: errors.length === 0 ? 'success' : 'partial',
    details: { channels_configured: channels.length, processed_channels, saved, skipped_irrelevant, skipped_duplicate, errors: errors.slice(0, 5) },
    ran_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, channels_configured: channels.length, processed_channels, saved, skipped_irrelevant, skipped_duplicate, errors: errors.slice(0, 5) })
}

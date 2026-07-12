import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrCron } from '@/lib/admin-auth'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Search queries that find Indian credit card YouTube channels
const DISCOVERY_QUERIES = [
  'Indian credit card rewards 2026',
  'best credit card India hindi',
  'credit card points transfer India',
  'HDFC Infinia Magnus review India',
  'credit card devaluation India 2026',
  'travel credit card India miles',
  'credit card lounge access India',
  'cashback credit card India',
  'axis atlas HDFC infinia comparison',
  'credit card sweet spot India',
]

// Min quality bar: must have at least this many subscribers to be worth scraping
const MIN_SUBSCRIBERS = 5000

export async function GET(req: NextRequest) {
  const denied = await requireAdminOrCron(req); if (denied) return denied;
  const ytKey = process.env.YOUTUBE_API_KEY
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  if (!ytKey) return NextResponse.json({ error: 'Missing YOUTUBE_API_KEY' }, { status: 500 })

  // Get existing channel IDs to avoid re-adding
  const { data: existing } = await sb.from('youtube_channels').select('channel_id')
  const existingIds = new Set((existing || []).map((c: any) => c.channel_id))

  const discovered: any[] = []
  const errors: string[] = []

  for (const query of DISCOVERY_QUERIES) {
    try {
      // Search for videos
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&relevanceLanguage=en&regionCode=IN&maxResults=10&key=${ytKey}`
      )
      if (!searchRes.ok) { errors.push(`search ${query}: ${searchRes.status}`); continue }
      const searchData = await searchRes.json()

      // Collect unique channel IDs from results
      const channelIds = [...new Set(
        (searchData.items || [])
          .map((v: any) => v.snippet?.channelId)
          .filter((id: string) => id && !existingIds.has(id))
      )] as string[]

      if (!channelIds.length) continue

      // Get channel details in batch
      const chanRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds.join(',')}&key=${ytKey}`
      )
      if (!chanRes.ok) continue
      const chanData = await chanRes.json()

      for (const ch of chanData.items || []) {
        const subs = parseInt(ch.statistics?.subscriberCount || '0')
        if (subs < MIN_SUBSCRIBERS) continue

        // Quality check: does channel description mention credit cards / finance / points?
        const desc = (ch.snippet?.description || '').toLowerCase()
        const title = (ch.snippet?.title || '').toLowerCase()
        const ccKeywords = ['credit card', 'creditcard', 'reward point', 'miles', 'lounge', 'cashback', 'travel card', 'finance', 'points']
        const relevant = ccKeywords.some(k => desc.includes(k) || title.includes(k))
        if (!relevant) continue

        if (!existingIds.has(ch.id)) {
          existingIds.add(ch.id)
          discovered.push({
            channel_id: ch.id,
            channel_name: ch.snippet?.title,
            handle: '@' + (ch.snippet?.customUrl || ch.id),
            active: true,
            subscribers: subs,
            category: 'credit_card',
          })
        }
      }
    } catch (e: any) {
      errors.push(query + ': ' + e.message)
    }
  }

  // Insert newly discovered channels
  let added = 0
  if (discovered.length) {
    const { error } = await sb.from('youtube_channels').upsert(discovered, { onConflict: 'channel_id' })
    if (!error) added = discovered.length
  }

  await sb.from('cron_logs').insert({
    job_name: 'youtube-discover',
    status: errors.length === 0 ? 'success' : 'partial',
    details: { discovered: discovered.length, added, queries_run: DISCOVERY_QUERIES.length, errors: errors.slice(0, 5) },
    ran_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, discovered: discovered.length, added, channels: discovered.map(c => c.channel_name), errors: errors.slice(0, 3) })
}

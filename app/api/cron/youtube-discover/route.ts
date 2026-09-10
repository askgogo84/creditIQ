import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrCron } from '@/lib/admin-auth'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

// India-focused discovery queries. Keep the set targeted enough to stay within the
// normal YouTube Data API daily quota while covering cards, airline miles AND hotel points.
const DISCOVERY_QUERIES = [
  'Indian credit card rewards 2026',
  'best credit card India rewards',
  'credit card points transfer India',
  'HDFC Infinia Magnus review India',
  'credit card devaluation India 2026',
  'travel credit card India miles',
  'credit card lounge access India',
  'cashback credit card India',
  'Axis Atlas HDFC Infinia comparison',
  'credit card sweet spot India',
  'Marriott Bonvoy credit card points India',
  'Accor ALL credit card points India',
  'IHG credit card points transfer India',
  'Air India Maharaja points credit card India',
  'KrisFlyer HDFC Axis points India',
  'Axis Atlas transfer partners 2026',
  'American Express Membership Rewards transfer India',
  'HSBC TravelOne transfer partners India',
]

const MIN_SUBSCRIBERS = 5000

export async function GET(req: NextRequest) {
  const denied = await requireAdminOrCron(req); if (denied) return denied
  const ytKey = process.env.YOUTUBE_API_KEY
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  if (!ytKey) return NextResponse.json({ error: 'Missing YOUTUBE_API_KEY' }, { status: 500 })

  const { data: existing } = await sb.from('youtube_channels').select('channel_id')
  const existingIds = new Set((existing || []).map((c: any) => c.channel_id))

  const discovered: any[] = []
  const errors: string[] = []

  for (const query of DISCOVERY_QUERIES) {
    try {
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&relevanceLanguage=en&regionCode=IN&maxResults=10&key=${ytKey}`
      )
      if (!searchRes.ok) { errors.push(`search ${query}: ${searchRes.status}`); continue }
      const searchData = await searchRes.json()

      const channelIds = [...new Set(
        (searchData.items || [])
          .map((v: any) => v.snippet?.channelId)
          .filter((id: string) => id && !existingIds.has(id))
      )] as string[]

      if (!channelIds.length) continue

      const chanRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds.join(',')}&key=${ytKey}`
      )
      if (!chanRes.ok) continue
      const chanData = await chanRes.json()

      for (const ch of chanData.items || []) {
        const subs = parseInt(ch.statistics?.subscriberCount || '0')
        if (subs < MIN_SUBSCRIBERS) continue

        const desc = (ch.snippet?.description || '').toLowerCase()
        const title = (ch.snippet?.title || '').toLowerCase()
        const keywords = [
          'credit card', 'creditcard', 'reward point', 'miles', 'lounge', 'cashback',
          'travel card', 'points', 'airline', 'award travel', 'marriott', 'bonvoy',
          'accor', 'hotel points', 'krisflyer', 'avios', 'maharaja',
        ]
        const relevant = keywords.some(k => desc.includes(k) || title.includes(k))
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

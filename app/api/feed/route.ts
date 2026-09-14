// app/api/feed/route.ts
// Wallet-personalised intelligence feed. Community signals remain directional;
// issuer/programme rules still require CreditIQ's sourced redemption graph.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sanitizeText } from '@/lib/sanitize-text'
import { rankedWalletIntelligence } from '@/lib/intelligence/wallet-intelligence'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const URL_ENV = () => process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SVC = () => process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(req: NextRequest) {
  const m = (req.headers.get('authorization') ?? '').match(/^Bearer\s+(.+)$/i)
  if (!m) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const anon = createClient(URL_ENV(), ANON(), { auth: { persistSession: false } })
  const { data: u, error: ue } = await anon.auth.getUser(m[1].trim())
  if (ue || !u.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const sb = createClient(URL_ENV(), SVC() || ANON(), { auth: { persistSession: false } })
    const { wallet, ranked } = await rankedWalletIntelligence(sb, u.user.id, 100)

    const items = ranked.map(({ row, match }: any) => ({
      id: row.id,
      source: row.source ?? null,
      source_url: row.source_url ?? null,
      creator_handle: row.creator_handle ?? null,
      creator_name: sanitizeText(row.creator_name),
      title: sanitizeText(row.title),
      summary: sanitizeText(row.content),
      insight_type: row.insight_type ?? 'general',
      card_mentions: Array.isArray(row.card_mentions) ? row.card_mentions : [],
      date: row.published_at ?? row.scraped_at ?? row.created_at ?? null,
      wallet_matches: match.matchedCards,
      programme_matches: match.matchedProgrammes,
      relevance_reason: match.relevanceReason,
      section: match.section,
      relevance_score: Math.round(match.score),
      notification_eligible: match.shouldNotify,
    }))

    return NextResponse.json({
      items,
      wallet_cards: wallet.length,
      counts: {
        important_now: items.filter((item: any) => item.section === 'IMPORTANT_NOW').length,
        for_you: items.filter((item: any) => item.section === 'FOR_YOU').length,
        discover: items.filter((item: any) => item.section === 'DISCOVER').length,
      },
    })
  } catch (error) {
    console.error('feed error', error)
    return NextResponse.json({ items: [], wallet_cards: 0 })
  }
}

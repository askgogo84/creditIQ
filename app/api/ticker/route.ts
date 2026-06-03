import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const revalidate = 3600

export async function GET() {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data } = await sb
      .from('intelligence_kb')
      .select('title, insight_type, card_mentions, scraped_at')
      .eq('active', true)
      .in('insight_type', ['devaluation', 'sweet_spot', 'transfer_hack'])
      .order('scraped_at', { ascending: false })
      .limit(12)

    if (!data?.length) {
      return NextResponse.json({ items: [
        'AXIS Magnus devalued — Grab Vouchers capped at 1:0.4',
        'HDFC SmartBuy halved on Cleartrip from May 2026',
        'ICICI Sapphiro removed all spend-based renewal benefits',
        'SBI Aurum to scrap Priority Pass guest visits',
        'New — AU Bank Zenith+ launches with 10x on fuel',
      ]})
    }

    const items = data.map((row: any) => {
      const prefix = row.insight_type === 'devaluation' ? 'DEVALUATION' :
                     row.insight_type === 'sweet_spot' ? 'SWEET SPOT' : 'HACK'
      const cards = row.card_mentions?.slice(0, 2).join(', ')
      const body = (row.title && row.title.trim()) ? row.title : (row.content ? row.content.slice(0, 80) : null)
      if (!body) return null
      return cards ? `${prefix} — ${cards}: ${body}` : `${prefix} — ${body}`
    })

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}

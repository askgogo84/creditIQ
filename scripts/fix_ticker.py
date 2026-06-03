import os

# API route for live ticker
os.makedirs(r'app/api/ticker', exist_ok=True)
ticker_api = r"""import { NextResponse } from 'next/server'
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
      return cards ? `${prefix} — ${cards}: ${row.title}` : `${prefix} — ${row.title}`
    })

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ items: [] })
  }
}
"""
with open(r'app/api/ticker/route.ts', 'w', encoding='utf-8', newline='\n') as f:
    f.write(ticker_api)
print("OK: ticker API route created")

# Update DevalTicker to fetch live data
ticker_component = r"""'use client';

import { Fragment, useEffect, useState } from 'react';

interface DevalTickerProps {
  items?: string[];
}

export function DevalTicker({ items: staticItems }: DevalTickerProps) {
  const [items, setItems] = useState<string[]>(staticItems || [
    'AXIS Magnus devalued — Grab Vouchers capped at 1:0.4',
    'HDFC SmartBuy halved on Cleartrip from May 2026',
    'ICICI Sapphiro removed all spend-based renewal benefits',
    'SBI Aurum to scrap Priority Pass guest visits',
    'New — AU Bank Zenith+ launches with 10x on fuel',
  ])

  useEffect(() => {
    fetch('/api/ticker')
      .then(r => r.json())
      .then(d => { if (d.items?.length) setItems(d.items) })
      .catch(() => {})
  }, [])

  const content = items.map((s, i) => (
    <span key={`a-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: 'currentColor', flexShrink: 0 }} />
      <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s}</span>
    </span>
  ))

  return (
    <div className="deval" style={{ padding: '12px 0', position: 'relative', zIndex: 1 }}>
      <div className="marquee">
        <div className="marquee__track">
          {content}
          {content.map((c, i) => (<Fragment key={`b-${i}`}>{c}</Fragment>))}
        </div>
        <div className="marquee__track" aria-hidden="true">
          {content}
          {content.map((c, i) => (<Fragment key={`c-${i}`}>{c}</Fragment>))}
        </div>
      </div>
    </div>
  )
}
"""
with open(r'components/design/DevalTicker.tsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(ticker_component)
print("OK: DevalTicker now fetches live from intelligence_kb")

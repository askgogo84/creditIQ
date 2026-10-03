'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { authedFetch } from '@/lib/authed-fetch'
import { feedForCard, insightAgeLabel, safeSourceUrl, type WalletFeedItem } from '@/lib/intelligence/presentation'

export function WalletIntelligencePanel({ cardName, bank }: { cardName?: string; bank?: string }) {
  const [items, setItems] = useState<WalletFeedItem[]>([])
  const [state, setState] = useState<'loading' | 'available' | 'unavailable'>('loading')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let current = true
    setState('loading')
    authedFetch('/api/feed').then(async res => {
      if (!res.ok) throw new Error('feed unavailable')
      const data = await res.json()
      if (!Array.isArray(data.items)) throw new Error('invalid feed')
      if (current) { setItems(data.items); setState('available') }
    }).catch(() => { if (current) setState('unavailable') })
    return () => { current = false }
  }, [retry])
  const relevant = feedForCard(items, cardName, bank).slice(0, 3)
  return <section aria-label="Wallet intelligence" style={{ borderTop: '1px solid #E8E8E5', paddingTop: 12, fontSize: 13, lineHeight: 1.45, overflowWrap: 'anywhere' }}>
    <h3 style={{ fontSize: 15, margin: '0 0 8px' }}>For {cardName || 'your wallet'}</h3>
    {state === 'loading' ? <p role="status">Loading card intelligence…</p> : state === 'unavailable' ? <div role="status">Card intelligence could not be loaded. Your balances are unaffected.<button onClick={() => setRetry(n => n + 1)} style={{ display: 'block', minHeight: 44, padding: '8px 12px' }}>Retry intelligence</button></div> : relevant.length ? relevant.map(item => <article key={item.id} style={{ borderTop: '1px solid #E8E8E5', paddingTop: 10, marginTop: 10 }}>
      <strong>{item.title || item.summary.slice(0, 150)}</strong>
      <p style={{ margin: '6px 0' }}>{item.relevance_reason}</p>
      <small>{insightAgeLabel(item.date)}{item.date && Number.isFinite(Date.parse(item.date)) ? ` · ${new Date(item.date).toLocaleDateString('en-IN')}` : ''}</small>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <Link href={`/feed?insight=${encodeURIComponent(item.id)}`} style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>Review opportunity →</Link>
        {safeSourceUrl(item.source_url) && <a href={safeSourceUrl(item.source_url)!} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>Source{item.source ? ` · ${item.source}` : ''} ↗</a>}
      </div>
    </article>) : <p>No matched intelligence yet. <Link href="/feed" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44 }}>Explore the feed →</Link></p>}
    <p style={{ color: '#4A4D57', marginBottom: 0 }}>Community discovery, not verified redemption instructions. Confirm eligibility and current issuer terms before acting.</p>
  </section>
}

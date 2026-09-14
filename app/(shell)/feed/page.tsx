'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { authedFetch } from '@/lib/authed-fetch'
import { CiqTheme } from '@/components/ciq/ThemeProvider'

type FeedItem = {
  id: string
  source: string | null
  source_url: string | null
  creator_handle: string | null
  creator_name: string | null
  title: string
  summary: string
  insight_type: string
  card_mentions: string[]
  date: string | null
  wallet_matches: string[]
  programme_matches: string[]
  relevance_reason: string | null
  section: 'IMPORTANT_NOW' | 'FOR_YOU' | 'DISCOVER'
  relevance_score: number
}

const CATEGORY_LABEL: Record<string, string> = {
  transfer_hack: 'Transfer hack', devaluation: 'Devaluation', card_comparison: 'Comparison',
  sweet_spot: 'Sweet spot', strategy: 'Strategy', reward_tip: 'Reward tip', card_review: 'Card review',
  lounge: 'Lounge', forex: 'Forex', general: 'Tip',
}
const SOURCE_LABEL: Record<string, string> = { instagram: 'Instagram', reddit: 'Reddit', youtube: 'YouTube' }
function labelFor(type: string) { return CATEGORY_LABEL[type] || type.replace(/_/g, ' ') }
function fmtDate(d: string | null) {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ''
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function FeedPage() {
  const [user, setUser] = useState<any>(null)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<FeedItem[]>([])
  const [walletCards, setWalletCards] = useState(0)

  useEffect(() => {
    const sb = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
    sb.auth.getUser().then(({ data: { user } }) => {
      setUser(user); setChecking(false); if (user) void loadFeed()
    })
  }, [])

  const loadFeed = async () => {
    setLoading(true)
    try {
      const res = await authedFetch('/api/feed')
      const data = await res.json()
      setItems(Array.isArray(data.items) ? data.items : [])
      setWalletCards(Number(data.wallet_cards || 0))
    } catch {}
    setLoading(false)
  }

  const sections = useMemo(() => ({
    important: items.filter(item => item.section === 'IMPORTANT_NOW'),
    forYou: items.filter(item => item.section === 'FOR_YOU'),
    discover: items.filter(item => item.section === 'DISCOVER'),
  }), [items])

  const masthead = <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 8px' }}><div className="ciq-display" style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-.02em' }}>Credit<span style={{ color: 'var(--ciq-gold-2)' }}>IQ</span></div></div>

  if (!checking && !user) return (
    <CiqTheme><div style={{ maxWidth: 420, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>{masthead}<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 28px' }}><div className="ciq-mono" style={{ fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ciq-gold-2)' }}>Intelligence</div><h1 className="ciq-serif" style={{ fontSize: 32, letterSpacing: '-.02em', marginTop: 12 }}>Card intelligence, personalised.</h1><p style={{ fontSize: 13.5, color: 'var(--ciq-ink-3)', marginTop: 12, lineHeight: 1.5 }}>Sweet spots, transfer hacks and devaluations matched to the cards in your wallet.</p><Link href="/login?next=/feed" style={{ marginTop: 22, display: 'inline-flex', padding: '13px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: 'none', background: 'linear-gradient(135deg,var(--ciq-gold-2),var(--ciq-gold))', color: '#1a1710' }}>Sign in</Link></div></div></CiqTheme>
  )

  const InsightCard = ({ item }: { item: FeedItem }) => {
    const handle = item.creator_handle ? item.source === 'instagram' ? `@${item.creator_handle}` : item.creator_handle : (item.source ? SOURCE_LABEL[item.source] || item.source : '')
    const src = item.source ? SOURCE_LABEL[item.source] || item.source : ''
    const card = <div style={{ borderRadius: 18, padding: 16, background: 'var(--ciq-panel)', border: '1px solid var(--ciq-line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}><span className="ciq-mono" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, color: 'var(--ciq-gold-2)', background: 'var(--ciq-gold-soft)', border: '1px solid var(--ciq-gold-line)' }}>{labelFor(item.insight_type)}</span>{item.section !== 'DISCOVER' && <span className="ciq-mono" style={{ fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6, color: 'var(--ciq-gold-2)', background: 'var(--ciq-gold-soft)', border: '1px solid var(--ciq-gold-line)' }}>For your wallet</span>}{item.date && <span className="ciq-mono" style={{ fontSize: 10.5, color: 'var(--ciq-ink-3)', marginLeft: 'auto' }}>{fmtDate(item.date)}</span>}</div>
      {item.relevance_reason && <div className="ciq-mono" style={{ fontSize: 9.5, color: 'var(--ciq-gold-2)', marginBottom: 6 }}>{item.relevance_reason}</div>}
      {item.title && <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.35, color: 'var(--ciq-ink)' }}>{item.title}</div>}
      {item.summary && <div style={{ fontSize: 12.5, color: 'var(--ciq-ink-2)', marginTop: 6, lineHeight: 1.5 }}>{item.summary.length > 240 ? `${item.summary.slice(0, 240)}…` : item.summary}</div>}
      {(src || handle || item.card_mentions.length > 0 || item.programme_matches?.length > 0) && <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>{src && <span className="ciq-mono" style={{ fontSize: 9.5, color: 'var(--ciq-ink-3)' }}>{src}</span>}{handle && handle !== src && <span className="ciq-mono" style={{ fontSize: 9.5, color: 'var(--ciq-ink-3)' }}>{handle}</span>}{[...item.card_mentions.slice(0, 2), ...(item.programme_matches || []).slice(0, 1)].map((c, i) => <span key={`${c}-${i}`} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: 'var(--ciq-line)', color: 'var(--ciq-ink-3)' }}>{c}</span>)}</div>}
    </div>
    return item.source_url ? <a href={item.source_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: 'var(--ciq-ink)' }}>{card}</a> : card
  }

  const Block = ({ title, subtitle, list }: { title: string; subtitle: string; list: FeedItem[] }) => list.length ? <section style={{ marginTop: 22 }}><div style={{ padding: '0 20px 10px' }}><h2 className="ciq-display" style={{ fontSize: 18, fontWeight: 650 }}>{title}</h2><p style={{ marginTop: 3, fontSize: 11.5, color: 'var(--ciq-ink-3)' }}>{subtitle}</p></div><div className="ciq-rise" style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>{list.map(item => <InsightCard key={item.id} item={item} />)}</div></section> : null

  return <CiqTheme><div style={{ maxWidth: 420, margin: '0 auto', paddingBottom: 104 }}>{masthead}<div style={{ padding: '10px 20px 0' }}><div className="ciq-mono" style={{ fontSize: 9.5, color: 'var(--ciq-gold-2)', textTransform: 'uppercase', letterSpacing: '.12em' }}>Explore · Intelligence</div><h1 className="ciq-display" style={{ fontWeight: 600, fontSize: 28, letterSpacing: '-.02em', marginTop: 6 }}>For you</h1><p style={{ fontSize: 12.5, color: 'var(--ciq-ink-3)', marginTop: 6, lineHeight: 1.5 }}>{walletCards > 0 ? `Matched against ${walletCards} card${walletCards === 1 ? '' : 's'} in your wallet.` : 'Add cards to your wallet to personalise this feed.'} Community signals remain directional until issuer/programme rules are verified.</p></div>{loading ? <div className="ciq-mono" style={{ color: 'var(--ciq-ink-3)', fontSize: 12, padding: 30, textAlign: 'center' }}>building your intelligence…</div> : items.length === 0 ? <div style={{ margin: 20, padding: 24, textAlign: 'center', borderRadius: 16, border: '1px solid var(--ciq-line)', background: 'var(--ciq-panel)' }}>No intelligence yet.</div> : <><Block title="Important now" subtitle="Devaluations and material changes affecting your wallet." list={sections.important} /><Block title="For your wallet" subtitle="Sweet spots, transfer hacks and strategies reachable from cards you hold." list={sections.forYou} /><Block title="Discover" subtitle="Broader community intelligence outside your current wallet." list={sections.discover} /></>}</div></CiqTheme>
}

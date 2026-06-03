import { createClient } from '@supabase/supabase-js'
import { Header } from '@/components/Header'
import { DesignFooter } from '@/components/design/Footer'
import Link from 'next/link'

export const revalidate = 3600

export const metadata = {
  title: 'Intelligence Feed — Live CC Insights from Community | CreditIQ',
  description: 'Real-time credit card intelligence scraped from top Indian creators on Instagram, YouTube and Reddit. Devaluations, sweet spots, transfer hacks — updated nightly.',
  alternates: { canonical: 'https://creditiq.app/intelligence' },
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  devaluation: { label: 'Devaluation', color: '#dc2626', bg: '#fef2f2' },
  sweet_spot: { label: 'Sweet Spot', color: '#16a34a', bg: '#f0fdf4' },
  transfer_hack: { label: 'Transfer Hack', color: '#7c3aed', bg: '#f5f3ff' },
  strategy: { label: 'Strategy', color: '#92400e', bg: '#fffbeb' },
  card_comparison: { label: 'Comparison', color: '#0369a1', bg: '#eff6ff' },
  card_review: { label: 'Review', color: '#1B3A5C', bg: '#f8fafc' },
  general: { label: 'Intel', color: '#374151', bg: '#f9fafb' },
}

export default async function IntelligencePage() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: insights } = await sb
    .from('intelligence_kb')
    .select('id, insight_type, title, content, creator_handle, creator_name, card_mentions, trust_score, source, source_url, scraped_at, published_at')
    .eq('active', true)
    .order('scraped_at', { ascending: false })
    .limit(50)

  const byType = (insights || []).reduce((acc: any, i: any) => {
    acc[i.insight_type] = (acc[i.insight_type] || 0) + 1
    return acc
  }, {})

  const devals = (insights || []).filter(i => i.insight_type === 'devaluation').length
  const sweetSpots = (insights || []).filter(i => i.insight_type === 'sweet_spot').length
  const hacks = (insights || []).filter(i => i.insight_type === 'transfer_hack').length

  return (
    <>
      <Header />
      <div style={{ paddingTop: 'clamp(80px,12vw,100px)', paddingBottom: 80, background: 'var(--bg-2,#EFE7D8)', minHeight: '100vh' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 10 }}>Live Intelligence</div>
            <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'var(--ink,#142950)', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
              Community Intelligence Feed
            </h1>
            <p style={{ fontSize: 15, color: 'var(--ink-3,#5A6A8A)', margin: 0 }}>
              Real insights scraped nightly from top Indian credit card creators on Instagram, YouTube and Reddit. No bank spin.
            </p>
          </div>

          {/* Stats bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Total insights', value: insights?.length || 0, color: '#7c3aed' },
              { label: 'Devaluations', value: devals, color: '#dc2626' },
              { label: 'Sweet spots', value: sweetSpots, color: '#16a34a' },
              { label: 'Transfer hacks', value: hacks, color: '#7c3aed' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid rgba(20,41,80,0.08)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {!insights?.length ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px solid rgba(20,41,80,0.08)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🧠</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink,#142950)' }}>Intelligence pipeline running...</div>
                <div style={{ fontSize: 13, color: 'var(--ink-3,#5A6A8A)', marginTop: 6 }}>Check back after 7:30AM IST — new insights land nightly.</div>
              </div>
            ) : insights.map((insight: any, i: number) => {
              const cfg = TYPE_CONFIG[insight.insight_type] || TYPE_CONFIG.general
              return (
                <div key={insight.id || i} style={{ background: '#fff', borderRadius: 14, border: '1px solid rgba(20,41,80,0.08)', padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 999, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    {insight.source && (
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: 'rgba(20,41,80,0.06)', color: 'var(--ink-3,#5A6A8A)', fontWeight: 600, textTransform: 'uppercase' }}>
                        {insight.source}
                      </span>
                    )}
                    {insight.creator_handle && (
                      <span style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)' }}>@{insight.creator_handle}</span>
                    )}
                    {insight.trust_score > 0 && (
                      <span style={{ fontSize: 11, color: insight.trust_score > 0.7 ? '#16a34a' : 'var(--ink-3,#5A6A8A)', marginLeft: 4 }}>
                        Trust {Math.round(insight.trust_score * 100)}%
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)', marginLeft: 'auto' }}>
                      {new Date(insight.scraped_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 6, lineHeight: 1.4 }}>
                    {insight.title}
                  </div>

                  {insight.content && (
                    <div style={{ fontSize: 13, color: 'var(--ink-3,#5A6A8A)', lineHeight: 1.6, marginBottom: 10 }}>
                      {insight.content.slice(0, 200)}{insight.content.length > 200 ? '...' : ''}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {insight.card_mentions?.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {insight.card_mentions.slice(0, 3).map((card: string, j: number) => (
                          <span key={j} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(20,41,80,0.06)', color: 'var(--ink-3,#5A6A8A)', fontWeight: 600 }}>
                            {card}
                          </span>
                        ))}
                      </div>
                    )}
                    {insight.source_url && (
                      <a href={insight.source_url} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 12, color: '#0369a1', marginLeft: 'auto', textDecoration: 'none', fontWeight: 600 }}>
                        View source &rarr;
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA */}
          <div style={{ marginTop: 40, textAlign: 'center', padding: '32px', background: 'var(--ink,#142950)', borderRadius: 20, color: '#fff' }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Ask CIRA about any of these</div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '0 0 20px' }}>
              Every insight above is in CIRA&rsquo;s knowledge base. Ask about any card, devaluation, or sweet spot.
            </p>
            <Link href="/#cira" style={{ display: 'inline-block', background: 'var(--copper-3,#D89B2A)', color: '#fff', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Ask CIRA &rarr;
            </Link>
          </div>

        </div>
      </div>
      <DesignFooter />
    </>
  )
}

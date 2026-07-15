import { createClient } from '@supabase/supabase-js'
import { DesignFooter } from '@/components/design/Footer'
import Link from 'next/link'

export const revalidate = 3600

export const metadata = {
  title: 'Credit Card Sweet Spots India 2026 — Best Redemptions | CreditIQ',
  description: 'Community-discovered credit card sweet spots. Transfer hacks, award redemptions and points strategies found by top Indian CC creators. Updated nightly.',
  alternates: { canonical: 'https://creditiq.app/sweet-spots' },
}

export default async function SweetSpotsPage() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: spots } = await sb
    .from('intelligence_kb')
    .select('id, insight_type, title, content, creator_handle, card_mentions, trust_score, source, source_url, scraped_at')
    .eq('active', true)
    .in('insight_type', ['sweet_spot', 'transfer_hack'])
    .order('trust_score', { ascending: false })
    .order('scraped_at', { ascending: false })
    .limit(30)

  const sweetSpots = spots?.filter(s => s.insight_type === 'sweet_spot') || []
  const transferHacks = spots?.filter(s => s.insight_type === 'transfer_hack') || []

  return (
    <>
      <div style={{ paddingTop: 'clamp(80px,12vw,100px)', paddingBottom: 80 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

          <div style={{ marginBottom: 36 }}>
            <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', marginBottom: 10 }}>Community discovered</div>
            <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'var(--ink,#142950)', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
              Redemption Sweet Spots
            </h1>
            <p style={{ fontSize: 15, color: 'var(--ink-3,#5A6A8A)', margin: 0 }}>
              The best redemptions found by top Indian CC creators — updated nightly from Instagram, YouTube and Reddit.
            </p>
          </div>

          {/* Transfer Hacks */}
          {transferHacks.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: 14 }}>
                Transfer Hacks ({transferHacks.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {transferHacks.map((spot: any, i: number) => (
                  <div key={i} style={{ background: 'var(--paper,#FAF5EB)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 6 }}>{spot.title}</div>
                    {spot.content && <div style={{ fontSize: 13, color: 'var(--ink-3,#5A6A8A)', lineHeight: 1.6, marginBottom: 10 }}>{spot.content.slice(0, 180)}...</div>}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {spot.card_mentions?.slice(0, 3).map((c: string, j: number) => (
                        <span key={j} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(124,58,237,0.08)', color: '#7c3aed', fontWeight: 600 }}>{c}</span>
                      ))}
                      {spot.creator_handle && <span style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)' }}>via @{spot.creator_handle}</span>}
                      {spot.source_url && <a href={spot.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#0369a1', marginLeft: 'auto', textDecoration: 'none' }}>Source &rarr;</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sweet Spots */}
          {sweetSpots.length > 0 && (
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#16a34a', marginBottom: 14 }}>
                Redemption Sweet Spots ({sweetSpots.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sweetSpots.map((spot: any, i: number) => (
                  <div key={i} style={{ background: 'var(--paper,#FAF5EB)', border: '1px solid rgba(22,163,74,0.15)', borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#142950)', marginBottom: 6 }}>{spot.title}</div>
                    {spot.content && <div style={{ fontSize: 13, color: 'var(--ink-3,#5A6A8A)', lineHeight: 1.6, marginBottom: 10 }}>{spot.content.slice(0, 180)}...</div>}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {spot.card_mentions?.slice(0, 3).map((c: string, j: number) => (
                        <span key={j} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'rgba(22,163,74,0.08)', color: '#16a34a', fontWeight: 600 }}>{c}</span>
                      ))}
                      {spot.creator_handle && <span style={{ fontSize: 11, color: 'var(--ink-3,#5A6A8A)' }}>via @{spot.creator_handle}</span>}
                      {spot.source_url && <a href={spot.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#0369a1', marginLeft: 'auto', textDecoration: 'none' }}>Source &rarr;</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!spots?.length && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--paper,#FAF5EB)', borderRadius: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink,#142950)', marginBottom: 6 }}>Intelligence pipeline running</div>
              <div style={{ fontSize: 13, color: 'var(--ink-3,#5A6A8A)' }}>Sweet spots land nightly after 7:30AM IST. Check back tomorrow.</div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link href="/intelligence" style={{ fontSize: 14, color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>
              View all {(spots?.length || 0) + 30}+ intelligence insights &rarr;
            </Link>
          </div>

        </div>
      </div>
      <DesignFooter />
    </>
  )
}

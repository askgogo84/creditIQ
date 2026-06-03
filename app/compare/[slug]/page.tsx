import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Header } from '@/components/Header'
import { DesignFooter } from '@/components/design/Footer'
import Link from 'next/link'

export const revalidate = 86400

async function getCard(slug: string) {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await sb.from('cards').select('*').eq('slug', slug).eq('active', true).single()
  return data
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const raw = params.slug
  const [slug1, slug2] = raw.split('-vs-')
  if (!slug1 || !slug2) return { title: 'Compare Cards | CreditIQ' }
  const [c1, c2] = await Promise.all([getCard(slug1), getCard(slug2)])
  if (!c1 || !c2) return { title: 'Compare Cards | CreditIQ' }
  const title = c1.name + ' vs ' + c2.name + ' — Which Is Better in 2026?'
  const desc = 'Honest comparison: ' + c1.name + ' vs ' + c2.name + '. Reward rates, fees, lounge access, and who should pick which card. Zero bank bias.'
  return {
    title,
    description: desc,
    openGraph: { title, description: desc },
    alternates: { canonical: 'https://creditiq.app/compare/' + raw },
  }
}

function parseField(v: any): any[] {
  if (Array.isArray(v)) return v
  if (typeof v === 'string') { try { return JSON.parse(v) } catch { return [] } }
  return []
}

function Winner({ label }: { label: string }) {
  return <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#065f46', color: '#fff', letterSpacing: '0.08em', marginLeft: 6 }}>WINNER</span>
}

export default async function ComparePage({ params }: { params: { slug: string } }) {
  const raw = params.slug
  const [slug1, slug2] = raw.split('-vs-')
  if (!slug1 || !slug2) notFound()
  const [c1, c2] = await Promise.all([getCard(slug1), getCard(slug2)])
  if (!c1 || !c2) notFound()

  const rows = [
    { label: 'Annual Fee', v1: 'Rs.' + c1.annual_fee_inr, v2: 'Rs.' + c2.annual_fee_inr, winner: c1.annual_fee_inr <= c2.annual_fee_inr ? 1 : 2 },
    { label: 'Base Reward Rate', v1: c1.base_reward_rate + '%', v2: c2.base_reward_rate + '%', winner: c1.base_reward_rate >= c2.base_reward_rate ? 1 : 2 },
    { label: 'Forex Markup', v1: (c1.forex_markup_percent ?? 3.5) + '%', v2: (c2.forex_markup_percent ?? 3.5) + '%', winner: (c1.forex_markup_percent ?? 3.5) <= (c2.forex_markup_percent ?? 3.5) ? 1 : 2 },
    { label: 'Network', v1: c1.network || '—', v2: c2.network || '—', winner: 0 },
    { label: 'Tier', v1: c1.tier || '—', v2: c2.tier || '—', winner: 0 },
  ]

  const l1 = parseField(c1.lounges); const l2 = parseField(c2.lounges)
  const l1visits = l1.length > 0 ? (l1[0].notes?.toLowerCase().includes('unlimited') ? 'Unlimited' : String((l1[0].visits_per_year || 0) + (l1[0].visits_per_quarter || 0) * 4)) : '0'
  const l2visits = l2.length > 0 ? (l2[0].notes?.toLowerCase().includes('unlimited') ? 'Unlimited' : String((l2[0].visits_per_year || 0) + (l2[0].visits_per_quarter || 0) * 4)) : '0'
  rows.push({ label: 'Lounge Access', v1: l1visits + ' visits/yr', v2: l2visits + ' visits/yr', winner: l1visits === 'Unlimited' ? 1 : l2visits === 'Unlimited' ? 2 : parseInt(l1visits) >= parseInt(l2visits) ? 1 : 2 })

  const h1 = parseField(c1.highlights); const h2 = parseField(c2.highlights)

  const ink = '#142950'; const paper = '#FAF5EB'; const line = 'rgba(20,41,80,0.08)'

  return (
    <>
      <Header />
      <div className="page-fade" style={{ paddingTop: 'clamp(80px,12vw,100px)', paddingBottom: 80 }}>
        <div className="shell" style={{ maxWidth: 900, margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

          {/* Breadcrumb */}
          <div style={{ marginBottom: 24 }}>
            <Link href="/cards" style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)', textDecoration: 'none', fontFamily: 'var(--font-mono,monospace)' }}>Cards</Link>
            <span style={{ margin: '0 8px', color: 'var(--ink-3,#5A6A8A)' }}>/</span>
            <span style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)', fontFamily: 'var(--font-mono,monospace)' }}>Compare</span>
          </div>

          {/* Header */}
          <h1 style={{ fontSize: 'clamp(22px,4vw,38px)', fontWeight: 800, color: ink, margin: '0 0 8px', letterSpacing: '-0.03em' }}>
            {c1.name} vs {c2.name}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-3,#5A6A8A)', margin: '0 0 40px' }}>
            Side-by-side comparison · Zero bank bias · Updated June 2026
          </p>

          {/* Card headers */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: 1, marginBottom: 2 }}>
            <div />
            {[c1, c2].map((c, i) => (
              <div key={i} style={{ background: paper, border: '1px solid ' + line, borderRadius: '12px 12px 0 0', padding: '20px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: ink, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)' }}>{c.bank}</div>
                <Link href={'/cards/' + c.slug} style={{ display: 'inline-block', marginTop: 12, padding: '6px 16px', background: ink, color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                  View full review
                </Link>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div style={{ border: '1px solid ' + line, borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
            {rows.map((row, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', background: i % 2 === 0 ? 'var(--surface,#fff)' : paper, borderBottom: i < rows.length - 1 ? '1px solid ' + line : 'none' }}>
                <div style={{ padding: '14px 16px', fontSize: 12, fontWeight: 700, color: 'var(--ink-3,#5A6A8A)', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-mono,monospace)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>{row.label}</div>
                {[{ v: row.v1, w: row.winner === 1 }, { v: row.v2, w: row.winner === 2 }].map((cell, j) => (
                  <div key={j} style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: cell.w ? '#065f46' : ink, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cell.w ? 'rgba(6,95,70,0.04)' : 'transparent' }}>
                    {cell.v}{cell.w && row.winner !== 0 && <Winner label="" />}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 32 }}>
            {[{ card: c1, highlights: h1 }, { card: c2, highlights: h2 }].map(({ card, highlights }, i) => (
              <div key={i} style={{ background: paper, border: '1px solid ' + line, borderRadius: 16, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: ink, marginBottom: 12 }}>{card.name} — Key Benefits</div>
                {highlights.slice(0, 4).map((h: string, j: number) => (
                  <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: '#065f46', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>+</span>
                    <span style={{ fontSize: 13, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.5 }}>{h}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* JSON-LD */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": c1.name + " vs " + c2.name + " — Which Is Better in 2026?",
            "description": "Honest side-by-side comparison of " + c1.name + " and " + c2.name,
            "url": "https://creditiq.app/compare/" + raw,
            "publisher": { "@type": "Organization", "name": "CreditIQ", "url": "https://creditiq.app" },
          })}} />

          {/* CTA */}
          <div style={{ marginTop: 40, textAlign: 'center', padding: '32px 20px', background: ink, borderRadius: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Not sure which card to get?</div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '0 0 20px' }}>Tell CIRA your spending pattern and get a personalised recommendation in 30 seconds.</p>
            <Link href="/smart-match" style={{ display: 'inline-block', background: 'var(--copper-3,#D89B2A)', color: '#fff', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Find my card →
            </Link>
          </div>

        </div>
      </div>
      <DesignFooter />
    </>
  )
}

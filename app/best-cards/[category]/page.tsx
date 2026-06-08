import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { DesignFooter } from '@/components/design/Footer'
import { CardTile, type TileCard } from '@/components/design/CardTile'
import { Reveal } from '@/components/design/Reveal'
import { SEED_CARDS } from '@/lib/data/seed-cards'
import type { CreditCard } from '@/lib/types'
import { type CardVariant } from '@/components/design/CreditCard3D'

const CATS: Record<string, { label: string; desc: string; emoji: string }> = {
  travel:        { label: 'Best Travel Cards',        desc: 'Ranked by effective reward rate on travel spend, lounge access, and forex markup.',       emoji: '✈' },
  cashback:      { label: 'Best Cashback Cards',      desc: 'Ranked by effective cashback rate across all spend categories.',                          emoji: '💰' },
  shopping:      { label: 'Best Shopping Cards',      desc: 'Ranked by online and offline shopping reward rates.',                                     emoji: '🛍' },
  dining:        { label: 'Best Dining Cards',        desc: 'Ranked by dining and food delivery reward rates.',                                        emoji: '🍽' },
  fuel:          { label: 'Best Fuel Cards',          desc: 'Ranked by fuel surcharge waiver and fuel spend rewards.',                                 emoji: '⛽' },
  forex:         { label: 'Best Forex Cards',         desc: 'Zero or near-zero forex markup for international spends.',                                emoji: '🌍' },
  lounge:        { label: 'Best Lounge Access Cards', desc: 'Ranked by lounge access benefits — domestic and international.',                          emoji: '🛋' },
  lifetime_free: { label: 'Best Lifetime Free Cards', desc: 'Zero annual fee cards with the best rewards.',                                            emoji: '🎁' },
}

function filterCards(cards: CreditCard[], cat: string): CreditCard[] {
  switch (cat) {
    case 'travel':        return cards.filter(c => (c.category || []).includes('travel'))
    case 'cashback':      return cards.filter(c => (c.category || []).includes('cashback'))
    case 'shopping':      return cards.filter(c => (c.category || []).includes('shopping'))
    case 'dining':        return cards.filter(c => (c.category || []).includes('dining'))
    case 'fuel':          return cards.filter(c => c.fuel_surcharge_waiver === true)
    case 'forex':         return cards.filter(c => (c.forex_markup_percent ?? 99) <= 1.5)
    case 'lounge':        return cards.filter(c => (c.lounges?.length ?? 0) > 0)
    case 'lifetime_free': return cards.filter(c => c.annual_fee_inr === 0)
    default:              return []
  }
}

const VARIANT_ROTATION: CardVariant[] = ['obsidian', 'navy', 'plum', 'gold', 'iris', 'mint']
const NETWORK_BY_BANK: Record<string, string> = { HDFC: 'VISA', AXIS: 'MASTERCARD', ICICI: 'AMEX', SBI: 'VISA', AMEX: 'AMEX', IDFC: 'VISA' }

function toTileCard(c: CreditCard, i: number): TileCard {
  const bank = c.bank.toUpperCase()
  return {
    bank,
    name: c.name.replace(/^HDFC\s+|^AXIS\s+|^ICICI\s+|^SBI\s+|^AMEX\s+/i, '').replace(/ Credit Card$/i, ''),
    tagline: c.tier || 'Standard',
    tier: (c.tier || 'CARD').toUpperCase().replace(/-/g, ' '),
    network: NETWORK_BY_BANK[bank.split(' ')[0]] || 'VISA',
    variant: VARIANT_ROTATION[i % VARIANT_ROTATION.length],
    tags: (c.category || []).slice(0, 2).map(s => s.replace(/-/g, ' ')),
    fee: c.annual_fee_inr,
    iqScore: Math.round((c.expert_rating ?? 8) * 10),
  }
}

export async function generateStaticParams() {
  return Object.keys(CATS).map(category => ({ category }))
}

export async function generateMetadata({ params }: { params: { category: string } }): Promise<Metadata> {
  const cat = CATS[params.category]
  if (!cat) return {}
  return { title: `${cat.label} in India 2026 | CreditIQ`, description: cat.desc }
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const cat = CATS[params.category]
  if (!cat) notFound()

  const allCards = SEED_CARDS.filter(c => c.active !== false)
  const cards = filterCards(allCards, params.category)
    .sort((a, b) => (b.expert_rating ?? 0) - (a.expert_rating ?? 0))

  return (
    <>
      <Header />
      <div className="page-fade">
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 80 }}>
          <div className="aurora" style={{ top: -100, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.35),transparent 60%)' }} />
          <div className="shell" style={{ position: 'relative', zIndex: 2 }}>

            <Reveal style={{ marginBottom: 'clamp(40px,6vw,64px)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderRadius: 999, background: 'rgba(212,163,115,0.12)', border: '1px solid rgba(212,163,115,0.25)', marginBottom: 24 }}>
                <span>{cat.emoji}</span>
                <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, letterSpacing: '0.16em', color: 'var(--copper,#8C5F12)', textTransform: 'uppercase' as const, fontWeight: 600 }}>CURATED - RANKED BY VALUE</span>
              </div>
              <h1 style={{ fontSize: 'clamp(36px,6vw,80px)', letterSpacing: '-0.04em', lineHeight: 1.0, fontWeight: 800, color: 'var(--ink,#142950)', marginBottom: 16 }}>
                {cat.label}{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>in India</span> (2026)
              </h1>
              <p style={{ fontSize: 'clamp(15px,1.2vw,18px)', color: 'var(--ink-2,#2A3F6B)', maxWidth: 600, lineHeight: 1.6, marginBottom: 20 }}>{cat.desc}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' as const }}>
                <span style={{ padding: '4px 12px', borderRadius: 999, background: 'var(--bg-2,#EFE7D8)', fontSize: 12, color: 'var(--ink-3,#5A6A8A)', fontWeight: 500 }}>{cards.length} cards ranked</span>
                <span style={{ padding: '4px 12px', borderRadius: 999, background: 'var(--bg-2,#EFE7D8)', fontSize: 12, color: 'var(--ink-3,#5A6A8A)', fontWeight: 500 }}>Updated May 2026</span>
                <span style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(79,140,88,0.10)', border: '1px solid rgba(79,140,88,0.20)', fontSize: 12, color: 'var(--green,#4F8C58)', fontWeight: 500 }}>Zero affiliate bias</span>
              </div>
            </Reveal>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, marginBottom: 40 }}>
              {Object.entries(CATS).map(([key, c]) => (
                <Link key={key} href={`/best-cards/${key}`} style={{ padding: '7px 16px', borderRadius: 999, border: `1px solid ${key === params.category ? 'var(--copper-3,#D89B2A)' : 'var(--line,rgba(20,41,80,0.12))'}`, background: key === params.category ? 'rgba(212,163,115,0.12)' : 'transparent', color: key === params.category ? 'var(--copper,#8C5F12)' : 'var(--ink-2,#2A3F6B)', fontSize: 13, fontWeight: key === params.category ? 600 : 400, textDecoration: 'none', whiteSpace: 'nowrap' as const }}>
                  {c.emoji} {c.label.replace('Best ', '').replace(' Cards', '')}
                </Link>
              ))}
            </div>

            {cards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-3,#5A6A8A)' }}>
                <p style={{ fontSize: 18 }}>No cards found for this category yet.</p>
                <Link href="/cards" style={{ marginTop: 16, display: 'inline-block', color: 'var(--copper-3,#D89B2A)', textDecoration: 'none' }}>Browse all 170+ cards</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }} className="grid-1-mobile">
                {cards.map((c, i) => (
                  <Reveal key={c.slug} delay={i * 40}>
                    <CardTile card={toTileCard(c, i)} rank={i + 1} href={`/card/${c.slug}`} />
                  </Reveal>
                ))}
              </div>
            )}

            <Reveal style={{ marginTop: 64, padding: 'clamp(24px,4vw,40px)', borderRadius: 20, background: 'var(--paper,#FAF5EB)', border: '1px solid var(--line,rgba(20,41,80,0.08))' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' as const, color: 'var(--copper,#8C5F12)', marginBottom: 16 }}>HOW WE RANK THESE CARDS</div>
              <p style={{ fontSize: 15, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.6, maxWidth: 700 }}>
                Cards are ranked by effective reward rate on a representative spend profile, after annual fees and accounting for any devaluations in the last 12 months. No bank pays us to rank their cards higher. We charge a flat fee on approved applications — same rate on every card.
              </p>
            </Reveal>

          </div>
        </section>
        <DesignFooter />
      </div>
    </>
  )
}

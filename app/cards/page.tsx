import { Metadata } from 'next';
import Link from 'next/link';
import { TopNav }         from '@/components/design/TopNav';
import { SectionHeader }  from '@/components/design/SectionHeader';
import { CopperCTA, GhostCTA } from '@/components/design/CTAs';
import { CardTile, type TileCard } from '@/components/design/CardTile';
import { type CardVariant } from '@/components/design/CreditCard3D';
import { DesignFooter }   from '@/components/design/Footer';
import { SEED_CARDS }     from '@/lib/data/seed-cards';
import type { CreditCard } from '@/lib/types';

export const metadata: Metadata = {
  title: 'All Credit Cards in India 2026 — Compare 93 Cards | CreditIQ',
  description: 'Compare all 93 credit cards in India. HDFC, Axis, SBI, ICICI, Amex, IDFC First and more. Honest reviews, real fees, no affiliate bias. Find the best card for your spends.',
  keywords: 'credit cards India 2026, best credit card India, HDFC credit card, Axis credit card, SBI credit card, compare credit cards India',
  alternates: { canonical: 'https://creditiq.app/cards' },
  openGraph: {
    title: 'All Credit Cards in India 2026 | CreditIQ',
    description: 'Compare 93 credit cards honestly. No affiliate bias.',
    url: 'https://creditiq.app/cards',
  },
};

/* ============================================================
   seed-cards → TileCard adapter  (shared with homepage)
   ============================================================ */
const VARIANT_ROTATION: CardVariant[] = ['obsidian', 'navy', 'plum', 'gold', 'iris', 'mint'];
const NETWORK_BY_BANK: Record<string, string> = {
  HDFC: 'VISA', AXIS: 'MASTERCARD', ICICI: 'AMEX',
  SBI: 'VISA', AMEX: 'AMEX', AMERICAN: 'AMEX',
  IDFC: 'VISA', RBL: 'MASTERCARD', YES: 'VISA', AU: 'VISA',
};

function tagline(tier?: string) {
  switch (tier) {
    case 'super-premium': return 'Reserve metal';
    case 'premium':       return 'Premium';
    case 'mid':           return 'Mid-tier';
    case 'entry':         return 'Entry';
    case 'starter':       return 'Starter';
    default:              return 'Standard';
  }
}

function toTileCard(c: CreditCard, i: number): TileCard {
  const bank = c.bank.toUpperCase();
  return {
    bank,
    name: c.name.replace(/^HDFC\s+|^AXIS\s+|^ICICI\s+|^SBI\s+|^AMEX\s+/i, '').replace(/ Credit Card$/i, ''),
    tagline: tagline(c.tier),
    tier: c.tier ? c.tier.toUpperCase().replace(/-/g, ' ') : 'CARD',
    network: NETWORK_BY_BANK[bank.split(' ')[0]] || 'VISA',
    variant: VARIANT_ROTATION[i % VARIANT_ROTATION.length],
    tags: (c.category || []).slice(0, 2).map(s => s.replace(/-/g, ' ')),
    fee: c.annual_fee_inr,
    iqScore: Math.round((c.expert_rating ?? 8) * 10),
  };
}

const CATEGORIES = [
  'International Travel', 'Domestic Travel', 'Forex 0%', 'Lounge Access',
  'Cashback', 'Online Shopping', 'Fuel', 'Dining',
  'First Card', 'Lifetime Free', 'Business', 'Metal',
];

export default function CardsIndexPage() {
  const cards = SEED_CARDS.filter(c => c.active !== false);
  const totalCards = cards.length;
  const banks = [...new Set(cards.map(c => c.bank))].sort();

  return (
    <>
      <TopNav />
      <div className="page-fade">

        {/* ============================================
              HERO
              ============================================ */}
        <section style={{ position: 'relative', paddingTop: 'clamp(120px, 18vw, 160px)' }}>
          <div className="aurora" style={{ top: -120, right: -100, width: 540, height: 540,
            background: 'radial-gradient(circle, rgba(212,163,115,0.55), transparent 60%)' }} />

          <div className="shell" style={{ position: 'relative', zIndex: 2, paddingBottom: 8 }}>
            <SectionHeader
              label={`THE FULL CATALOG · ${totalCards} CARDS · ${banks.length} BANKS`}
              title={<>Every card in India, <span className="serif" style={{ color: 'var(--copper)' }}>ranked honestly</span>.</>}
              subtitle="Real annual value, live devaluation tracking and IQ scores for all 93 cards. No affiliate bias — no bank pays us to move a card up the list." />

            <div style={{ marginTop: 'clamp(28px, 4vw, 40px)', display: 'flex', gap: 14, flexWrap: 'wrap' }} className="stack-mobile">
              <CopperCTA href="/smart-match">Find my perfect card</CopperCTA>
              <GhostCTA href="/compare">Compare side by side</GhostCTA>
            </div>
          </div>
        </section>

        {/* ============================================
              CATEGORY PILLS
              ============================================ */}
        <section className="section" style={{ paddingTop: 'clamp(40px, 6vw, 64px)', paddingBottom: 0 }}>
          <div className="shell">
            <div className="label" style={{ marginBottom: 18 }}>BROWSE BY CATEGORY</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {CATEGORIES.map((c) => (
                <Link key={c} href="/cards" className="chip" style={{ fontSize: 14 }}>
                  {c}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================
              CARDS BY BANK
              ============================================ */}
        <section className="section">
          <div className="shell">
            {banks.map((bank) => {
              const bankCards = cards.filter(c => c.bank === bank);
              return (
                <div key={bank} style={{ marginBottom: 'clamp(48px, 7vw, 72px)' }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                    gap: 24, marginBottom: 'clamp(24px, 3vw, 32px)',
                    paddingBottom: 16, borderBottom: '1px solid var(--line)',
                  }}>
                    <h2 style={{ fontSize: 'clamp(24px, 3vw, 34px)', letterSpacing: '-0.03em' }}>
                      {bank} <span className="serif" style={{ color: 'var(--copper)' }}>Credit Cards</span>
                    </h2>
                    <span className="label" style={{ whiteSpace: 'nowrap' }}>{bankCards.length} cards</span>
                  </div>

                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
                  }} className="grid-1-mobile">
                    {bankCards.map((c, i) => (
                      <CardTile key={c.id} card={toTileCard(c, i)} href={`/card/${c.slug}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ============================================
              FINAL CTA
              ============================================ */}
        <section className="section" style={{ paddingBottom: 120, position: 'relative' }}>
          <div className="aurora" style={{ bottom: -200, left: '20%', width: 800, height: 600,
            background: 'radial-gradient(circle, rgba(212,163,115,0.30), transparent 60%)' }} />

          <div className="shell" style={{ position: 'relative' }}>
            <div style={{ textAlign: 'center', maxWidth: 1000, margin: '0 auto' }}>
              <div className="label-copper" style={{ marginBottom: 24 }}>NOT SURE WHICH ONE?</div>
              <h2 style={{
                fontSize: 'clamp(36px, 5vw, 64px)', letterSpacing: '-0.035em', lineHeight: 1.04,
                fontWeight: 800,
              }}>
                Tell us how you spend — we&apos;ll do the{' '}
                <span className="shimmer-text">maths</span>.
              </h2>
              <p style={{
                marginTop: 32, fontSize: 'clamp(16px, 1.3vw, 19px)',
                color: 'var(--ink-2)', maxWidth: 540, margin: '32px auto 0',
              }}>
                Our AI analyses all {totalCards} cards against your real spending pattern. No sign-up, no email.
              </p>
              <div style={{ marginTop: 44, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }} className="stack-mobile">
                <CopperCTA href="/smart-match">Find my best card</CopperCTA>
                <GhostCTA href="/card/hdfc-infinia">See a sample card</GhostCTA>
              </div>
            </div>
          </div>
        </section>

        <DesignFooter />
      </div>
    </>
  );
}

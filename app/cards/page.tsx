import { Metadata } from 'next';
import { TopNav }         from '@/components/design/TopNav';
import { SectionHeader }  from '@/components/design/SectionHeader';
import { CopperCTA, GhostCTA } from '@/components/design/CTAs';
import { DesignFooter }   from '@/components/design/Footer';
import { SEED_CARDS }     from '@/lib/data/seed-cards';
import { CardsClient }    from './CardsClient';

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
              CATEGORY FILTER + CARDS  (interactive)
              ============================================ */}
        <CardsClient />

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

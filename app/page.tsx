'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Reveal }         from '@/components/design/Reveal';
import { StatNumber }     from '@/components/design/StatNumber';
import { Header }         from '@/components/Header';
import { CreditCard3D, type CardVariant } from '@/components/design/CreditCard3D';
import { SectionHeader }  from '@/components/design/SectionHeader';
import { CopperCTA, GhostCTA } from '@/components/design/CTAs';
import { DevalTicker }    from '@/components/design/DevalTicker';
import { JourneyCard }    from '@/components/design/JourneyCard';
import { AIToolCard }     from '@/components/design/AIToolCard';
import { CardTile, type TileCard } from '@/components/design/CardTile';
import { Stamp }          from '@/components/design/Stamp';
import { DesignFooter }   from '@/components/design/Footer';
import { CleoHero } from '@/components/design/CleoHero'
import { HowItWorks }     from '@/components/design/HowItWorks';
import { SEED_CARDS }     from '@/lib/data/seed-cards';
import type { CreditCard } from '@/lib/types';

/* ============================================================
   seed-cards -> TileCard adapter
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

const CARDS = SEED_CARDS.filter(c => c.active !== false);

/* ============================================================
   Dark feature-band override.
   Re-maps the theme tokens to their dark-mode values *locally*,
   so the Journey + AI-Tools sections render as premium obsidian
   slabs (white text on dark) regardless of the global light/dark
   theme. Every child that reads var(--ink)/var(--surface)/etc.
   inherits these without any per-component change.
   ============================================================ */
const DARK_BAND = {
  '--bg':          '#0A1226',
  '--bg-2':        '#101A36',
  '--bg-3':        '#142547',
  '--surface':     '#142950',
  '--surface-2':   '#1A3260',
  '--paper':       '#102140',
  '--ink':         '#F5EFE6',
  '--ink-2':       '#DCD2C0',
  '--ink-3':       '#A89C8A',
  '--ink-4':       '#807464',
  '--line':        'rgba(245,239,230,0.10)',
  '--line-strong': 'rgba(245,239,230,0.20)',
  '--copper':      '#D89B2A',
  '--copper-2':    '#E5AC3B',
  '--copper-3':    '#F2C658',
  background:      'var(--obsidian)',
} as CSSProperties;

/* ============================================================
   Page
   ============================================================ */
export default function HomePage() {
  const router = useRouter();

  return (
    <>
      <Header />
      <div className="page-fade">

        <CleoHero />

        <DevalTicker items={[
        'AXIS Magnus devalued -- Grab Vouchers capped at 1:0.4',
        'HDFC SmartBuy halved on Cleartrip from May 2026',
        'ICICI Sapphiro removed all spend-based renewal benefits',
        'SBI Aurum to scrap Priority Pass guest visits',
        'AMEX MRCC reduced point earn on utility bills to 0',
        'New . AU Bank Zenith+ launches with 10x on fuel']
        } />

        <HowItWorks />


        {/* ============================================
              START HERE -- Three journeys
              ============================================ */}
        <section className="section" style={{ ...DARK_BAND, borderTop: '1px solid var(--line)' }}>
          <div className="shell">
            <SectionHeader
              label="START HERE . 03 PATHS"
              title={<>Three ways to <span className="serif" style={{ color: 'var(--copper)' }}>begin</span>.</>}
              subtitle="Most people don't know what they want until they see it. Pick the question that sounds most like you." />


            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
              marginTop: 'clamp(40px, 6vw, 64px)'
            }} className="grid-1-mobile">
              <JourneyCard
                eyebrow="01 . FIND"
                title={<>Show me the <span className="serif" style={{ color: 'var(--copper)' }}>right</span> card for me.</>}
                subtitle="Tell us how you spend. Get one card recommendation backed by maths, not commissions."
                accent="copper"
                href="/smart-match" />

              <JourneyCard
                eyebrow="02 . ROAST"
                title={<>Tell me if my card <span className="serif" style={{ color: 'var(--terracotta)' }}>sucks</span>.</>}
                subtitle="Drop your current card and a sample month of spending. We grade it brutally -- A through F."
                accent="terracotta"
                href="/card-roast" />

              <JourneyCard
                eyebrow="03 . TRAVEL"
                title={<>Which card flies me <span className="serif" style={{ color: 'var(--sage)' }}>further</span>?</>}
                subtitle="Pick a route, your hotel chain, your loyalty programs. Get the card that maximises that exact trip."
                accent="sage"
                href="/travel" />

            </div>
          </div>
        </section>

        {/* ============================================
              AI TOOLS GRID
              ============================================ */}
        <section className="section" style={{
          ...DARK_BAND,
          borderBottom: '1px solid var(--line)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div className="aurora" style={{ top: 100, left: '40%', width: 500, height: 500,
            background: 'radial-gradient(circle, rgba(212,163,115,0.30), transparent 60%)' }} />

          <div className="shell" style={{ position: 'relative' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              gap: 40, marginBottom: 'clamp(40px, 6vw, 64px)'
            }} className="stack-mobile">
              <SectionHeader
                label="AI TOOLBOX . 06 TOOLS"
                title={<>The arsenal.<br /><span className="serif" style={{ color: 'var(--copper)' }}>Built for spenders</span>, not banks.</>}
                subtitle={null} />

              <Reveal>
                <GhostCTA href="/smart-match">Open the toolbox</GhostCTA>
              </Reveal>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 20
            }} className="grid-1-mobile">
              <AIToolCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M6 15h4"/></svg>}
                title="Card Match"
                desc="Type how you spend in plain English. We pick one card. No top-10 lists, no rankings sold to the highest bidder."
                badge={{ text: 'POPULAR', tone: 'badge-copper' }}
                href="/smart-match" />

              <AIToolCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2c0 6-6 8-6 13a6 6 0 0 0 12 0c0-5-6-7-6-13z"/><path d="M12 22v-4"/></svg>}
                title="Card Roast"
                desc="Brutal A-F grade on your current card. Shareable. Probably mean. Definitely accurate."
                badge={{ text: 'NEW', tone: 'badge-plum' }}
                href="/card-roast" />

              <AIToolCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><polyline points="9,15 11,17 15,13"/></svg>}
                title="Statement Truth"
                desc="Upload your statement. We tell you if your card is doing what the brochure promised."
                href="/statement-truth" />

              <AIToolCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="1,4 1,10 7,10"/><polyline points="23,20 23,14 17,14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>}
                title="Switch Wizard"
                desc="Already have a card? See if there's a better one for the same spend pattern."
                href="/card-switch" />

              <AIToolCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2l-1.2 1.2 4.1 3.3-2.4 2.4-2.1-.7L2 12.3l2.8.9 1 2.8 1.1-1.1-.7-2.1 2.4-2.4z"/></svg>}
                title="Travel AI"
                desc="Chat with an AI that knows every airline, hotel and transfer ratio. Plans your trip + the card to fund it."
                badge={{ text: 'BETA', tone: 'badge-amber' }}
                href="/travel" />

              <AIToolCard
                icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>}
                title="Lounge Tracker"
                desc="Never get turned away at the gate. Tracks free visits across every card you carry."
                href="/lounge-tracker" />

            </div>
          </div>
        </section>

        {/* ============================================
              MANIFESTO BLOCK -- big editorial
              ============================================ */}
        <section className="section">
          <div className="shell">
            <Reveal>
              <div style={{
                padding: 'clamp(40px, 6vw, 72px)',
                border: '1px solid var(--line-strong)',
                borderRadius: 32,
                background: 'var(--paper)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div className="aurora" style={{
                  top: -120, right: -120, width: 400, height: 400,
                  background: 'radial-gradient(circle, rgba(212,163,115,0.45), transparent 60%)'
                }} />

                <div className="label-copper" style={{ marginBottom: 24 }}>OUR PROMISE . MANIFESTO</div>

                <h2 style={{
                  fontSize: 'clamp(28px, 4vw, 48px)',
                  letterSpacing: '-0.03em',
                  maxWidth: 1100, lineHeight: 1.05,
                  fontWeight: 800
                }}>
                  Every comparison site in India is a{' '}
                  <span className="serif" style={{ color: 'var(--copper)' }}>card seller</span>, not a card{' '}
                  <span className="serif" style={{ color: 'var(--copper)' }}>recommender</span>.
                </h2>
                <p style={{
                  marginTop: 28,
                  fontSize: 'clamp(16px, 1.3vw, 20px)',
                  color: 'var(--ink-2)', maxWidth: 760, lineHeight: 1.6
                }}>
                  Every major card comparison site in India earns Rs.500-3,000 per approved application. The card that pays them most appears at the top - not the card that is best for you.
                  Cards with higher payouts rank higher, even when they&apos;re objectively worse for you.
                  <span className="serif" style={{ color: 'var(--ink)' }}> We don&apos;t take affiliate commissions on rankings.</span>{' '}
                  We rank cards by your spending pattern alone.
                </p>

                <div style={{
                  marginTop: 'clamp(40px, 6vw, 64px)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 32,
                  paddingTop: 40,
                  borderTop: '1px solid var(--line)'
                }} className="grid-1-mobile">
                  {[
                  { num: '0',      label: 'Banks paying for ranking', desc: 'Affiliate links are clearly marked. Rankings are pure value-based.' },
                  { num: '7 DAYS', label: 'Data refresh cycle',       desc: 'Weekly MITC scrapes catch devaluations within days, not months.' },
                  { num: '100%',   label: 'Open methodology',         desc: 'Our scoring engine is documented. Every recommendation shows its math.' }].
                  map((item, i) =>
                  <div key={i}>
                      <div className="huge" style={{
                      color: 'var(--copper)',
                      fontSize: 'clamp(40px, 5vw, 68px)',
                      marginBottom: 12
                    }}>{item.num}</div>
                      <div className="label" style={{ marginBottom: 10 }}>{item.label}</div>
                      <p style={{ color: 'var(--ink-3)', fontSize: 14.5, lineHeight: 1.55 }}>{item.desc}</p>
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============================================
              CARD SHOWCASE -- Top deck
              ============================================ */}
        <section className="section">
          <div className="shell">
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              gap: 40, marginBottom: 'clamp(40px, 6vw, 56px)', flexWrap: 'wrap'
            }}>
              <SectionHeader
                label="THE TOP DECK . RANKED"
                title={<>Cards that <span className="serif" style={{ color: 'var(--copper)' }}>actually</span> earn their fee.</>}
                subtitle="Ranked by effective reward rate on a Rs.6L-Rs.15L annual spend, after fees." />

              <Reveal>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['All cards', 'Travel', 'Lifestyle', 'Forex'].map((c, i) =>
                  <span key={c} className={`chip ${i === 0 ? 'chip-active' : ''}`}>{c}</span>
                  )}
                </div>
              </Reveal>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24
            }} className="grid-1-mobile">
              {CARDS.slice(0, 6).map((c, i) =>
                <CardTile key={c.id} card={toTileCard(c, i)} rank={i + 1} href={`/card/${c.slug}`} />
              )}
            </div>

            <Reveal style={{ marginTop: 56, textAlign: 'center' }}>
              <GhostCTA href="/cards">See all 100+ cards '</GhostCTA>
            </Reveal>
          </div>
        </section>

        {/* ============================================
              CATEGORY PILLS
              ============================================ */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="shell">
            <Reveal>
              <div className="label" style={{ marginBottom: 18 }}>BROWSE BY CATEGORY</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                'International Travel', 'Domestic Travel', 'Forex 0%', 'Lounge Access',
                'Cashback', 'Online Shopping', 'Fuel', 'Dining',
                'First Card', 'Lifetime Free', 'Business', 'Metal'].
                map((c) =>
                <Link
                  key={c} href="/cards"
                  className="chip"
                  style={{ fontSize: 14 }}>
                  {c}</Link>
                )}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============================================
              FINAL CTA
              ============================================ */}
        <section className="section" style={{ paddingBottom: 120, position: 'relative' }}>
          <div className="aurora" style={{ bottom: -200, left: '20%', width: 800, height: 600,
            background: 'radial-gradient(circle, rgba(212,163,115,0.30), transparent 60%)' }} />

          <div className="shell" style={{ position: 'relative' }}>
            <Reveal style={{ textAlign: 'center', maxWidth: 1000, margin: '0 auto' }}>
              <div className="label-copper" style={{ marginBottom: 24 }}>YOUR MOVE</div>
              <h2 style={{
                fontSize: 'clamp(36px, 5vw, 64px)', letterSpacing: '-0.035em', lineHeight: 1.04,
                fontWeight: 800
              }}>
                The right card is{' '}
                <span className="shimmer-text">90 seconds</span>{' '}
                away.
              </h2>
              <p style={{
                marginTop: 32,
                fontSize: 'clamp(16px, 1.3vw, 19px)',
                color: 'var(--ink-2)', maxWidth: 520, margin: '32px auto 0'
              }}>
                No sign-up. No email. No upselling to a card you don&apos;t need.
              </p>
              <div style={{ marginTop: 44, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }} className="stack-mobile">
                <CopperCTA href="/smart-match">Find my perfect card</CopperCTA>
                <GhostCTA href="/card/hdfc-infinia">See a sample card</GhostCTA>
              </div>
            </Reveal>
          </div>
        </section>

        <DesignFooter />
      </div>
    </>
  );
}





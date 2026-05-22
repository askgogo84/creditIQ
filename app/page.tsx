'use client';

import { Reveal }         from '@/components/design/Reveal';
import { StatNumber }     from '@/components/design/StatNumber';
import { TopNav }         from '@/components/design/TopNav';
import { CreditCard3D }   from '@/components/design/CreditCard3D';
import { SectionHeader }  from '@/components/design/SectionHeader';
import { CopperCTA, GhostCTA } from '@/components/design/CTAs';
import { DevalTicker }    from '@/components/design/DevalTicker';
import { JourneyCard }    from '@/components/design/JourneyCard';
import { AIToolCard }     from '@/components/design/AIToolCard';
import { CardTile, type TileCard } from '@/components/design/CardTile';
import { DesignFooter }   from '@/components/design/Footer';

/* ============================================================
   DATA
   ============================================================ */
const TICKER_ITEMS = [
  'Axis Magnus · Yatra capped at ₹15k/mo',
  'HDFC Smartbuy · Cleartrip points cut 50%',
  'ICICI Emeralde · Lounge access trimmed',
  'SBI Elite · Vistara waiver removed',
  'Amex MRCC · MakeMyTrip devalued 30%',
  'Axis Atlas · Edge Miles capped on hotels',
  'HDFC Diners · 10× removed on Tata Neu',
  'Citi PremierMiles · Migrated to Axis',
];

const JOURNEYS = [
  {
    eyebrow: 'Start here',
    title: 'Find my card',
    subtitle:
      'Tell us your real spend in 90 seconds. We rank every Indian card by what you actually keep — net of fees, GST and breakage.',
    accent: 'copper' as const,
    href: '/smart-match',
  },
  {
    eyebrow: 'Already have one?',
    title: 'Roast my card',
    subtitle:
      'Drop in your current card. Our AI auditor compares it against the 93-card universe and tells you, bluntly, what you\'re losing.',
    accent: 'terracotta' as const,
    href: '/card-roast',
  },
  {
    eyebrow: 'Going abroad?',
    title: 'Travel smarter',
    subtitle:
      'Forex, lounges, transfer partners, devaluation alerts. The travel-points playbook built for Indian wallets.',
    accent: 'sage' as const,
    href: '/travel',
  },
];

const AI_TOOLS: { icon: string; title: string; desc: string; href: string; badge?: { text: string; tone?: string } }[] = [
  { icon: '◐', title: 'Card Match AI',    desc: 'AI ranks every card by your real spend pattern.',                  href: '/smart-match',     badge: { text: 'Most used', tone: 'badge-copper' } },
  { icon: '⌇', title: 'Card Roast',        desc: 'Brutally honest audit of your current card.',                      href: '/card-roast',      badge: { text: 'Viral',      tone: 'badge-red' } },
  { icon: '⊡', title: 'Statement Truth',   desc: 'Upload a statement. See what you actually earned.',                 href: '/statement-truth', badge: { text: 'New',        tone: 'badge-green' } },
  { icon: '⇄', title: 'Switch Wizard',     desc: 'Step-by-step migration plan, with fee waivers in mind.',            href: '/card-switch' },
  { icon: '✈', title: 'Travel AI',         desc: 'Transfer partners, forex, lounges and devaluation alerts.',         href: '/travel' },
  { icon: '◉', title: 'Lounge Tracker',    desc: 'Live lounge availability across India.',                            href: '/lounge-tracker' },
];

const TOP_CARDS: TileCard[] = [
  { bank: 'HDFC',  name: 'Infinia Metal',        tier: 'SUPER PREMIUM', tagline: 'RESERVE METAL',  network: 'VISA',       variant: 'obsidian', tags: ['Smartbuy 5×', 'Lounge ∞'], fee: 12500, iqScore: 94 },
  { bank: 'AXIS',  name: 'Magnus Burgundy',      tier: 'TRAVEL',        tagline: 'EDGE MILES',     network: 'MASTERCARD', variant: 'navy',     tags: ['1:5 transfers', 'Hotel perks'], fee: 12500, iqScore: 91 },
  { bank: 'ICICI', name: 'Emeralde Private',     tier: 'PREMIUM',       tagline: 'METAL',          network: 'AMERICAN EXPRESS', variant: 'plum', tags: ['6 LPP', 'Taj Epicure'], fee: 12499, iqScore: 89 },
  { bank: 'SBI',   name: 'Cashback',             tier: 'CASHBACK',      tagline: 'FLAT 5%',        network: 'VISA',       variant: 'mint',     tags: ['Online 5%', '₹999 fee'], fee: 999, iqScore: 82 },
  { bank: 'AMEX',  name: 'Platinum Travel',      tier: 'TRAVEL',        tagline: 'MILESTONE',      network: 'AMEX',       variant: 'gold',     tags: ['Taj voucher', 'Milestone'], fee: 5000, iqScore: 78 },
  { bank: 'TATA',  name: 'Neu Infinity',         tier: 'LIFESTYLE',     tagline: 'NEUCOINS',       network: 'HDFC VISA',  variant: 'iris',     tags: ['5% NeuCoins', 'UPI rewards'], fee: 1499, iqScore: 74 },
];

/* ============================================================
   PAGE
   ============================================================ */
export default function HomePage() {
  return (
    <main className="page-fade">
      <TopNav />
      <Hero />
      <DevalTicker items={TICKER_ITEMS} />
      <Journeys />
      <AITools />
      <TopCardsSection />
      <DesignFooter />
    </main>
  );
}

/* ============================================================
   HERO — editorial typography + stacked 3D cards + stats
   ============================================================ */
function Hero() {
  return (
    <section
      className="section"
      style={{
        position: 'relative',
        paddingTop: 'clamp(120px, 16vw, 160px)',
        paddingBottom: 'clamp(40px, 6vw, 80px)',
        overflow: 'hidden',
      }}
    >
      {/* aurora accents */}
      <div
        className="aurora"
        style={{
          top: -160,
          right: -120,
          width: 620,
          height: 620,
          background: 'radial-gradient(circle, rgba(216,155,42,0.35), transparent 60%)',
        }}
      />
      <div
        className="aurora"
        style={{
          top: 280,
          left: -180,
          width: 540,
          height: 540,
          background: 'radial-gradient(circle, rgba(20,41,80,0.18), transparent 60%)',
        }}
      />

      <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
        <div
          className="grid-1-mobile"
          style={{
            display: 'grid',
            gridTemplateColumns: '1.25fr 1fr',
            gap: 'clamp(40px, 6vw, 80px)',
            alignItems: 'center',
          }}
        >
          {/* LEFT — editorial headline */}
          <div>
            <Reveal>
              <div className="label-copper" style={{ marginBottom: 22 }}>
                CREDITIQ — INDIA · EST. 2025
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1
                style={{
                  fontSize: 'clamp(48px, 9.5vw, 140px)',
                  letterSpacing: '-0.04em',
                  lineHeight: 0.94,
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  textWrap: 'balance',
                }}
              >
                The{' '}
                <span
                  className="serif"
                  style={{
                    color: 'var(--copper)',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    fontFamily: 'var(--font-serif)',
                  }}
                >
                  honest
                </span>{' '}
                credit card
                <br />
                intelligence India
                <br />
                <span className="serif" style={{ color: 'var(--ink-3)' }}>needed.</span>
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p
                style={{
                  marginTop: 28,
                  color: 'var(--ink-2)',
                  fontSize: 'clamp(15px, 1.3vw, 19px)',
                  maxWidth: 540,
                  lineHeight: 1.55,
                }}
              >
                The first credit-card platform in India that <em className="serif">isn&apos;t</em>{' '}
                paid by the banks. Real annual value, live devaluation tracking, AI points
                optimiser — all in one place.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div
                className="stack-mobile gap-mobile-sm"
                style={{ display: 'flex', gap: 14, marginTop: 36, flexWrap: 'wrap' }}
              >
                <CopperCTA href="/smart-match">Find my best card</CopperCTA>
                <GhostCTA href="/card-roast" arrow={false}>
                  <span style={{ color: 'var(--copper)', marginRight: 6 }}>♨</span>
                  Roast my card
                </GhostCTA>
              </div>
            </Reveal>

            {/* stat row */}
            <Reveal delay={320}>
              <div
                className="grid-2-mobile"
                style={{
                  marginTop: 56,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 32,
                  maxWidth: 560,
                  paddingTop: 32,
                  borderTop: '1px solid var(--line)',
                }}
              >
                <div>
                  <div
                    className="huge"
                    style={{
                      fontSize: 'clamp(28px, 3.4vw, 44px)',
                      color: 'var(--ink)',
                    }}
                  >
                    <StatNumber value={93} suffix="+" />
                  </div>
                  <div className="label" style={{ marginTop: 8 }}>Cards tracked</div>
                </div>
                <div>
                  <div
                    className="huge"
                    style={{
                      fontSize: 'clamp(28px, 3.4vw, 44px)',
                      color: 'var(--copper)',
                    }}
                  >
                    ₹<StatNumber value={4.2} decimals={1} />L
                  </div>
                  <div className="label" style={{ marginTop: 8 }}>Avg waste / year</div>
                </div>
                <div>
                  <div
                    className="huge"
                    style={{
                      fontSize: 'clamp(28px, 3.4vw, 44px)',
                      color: 'var(--ink)',
                    }}
                  >
                    <StatNumber value={7} />
                  </div>
                  <div className="label" style={{ marginTop: 8 }}>Day refresh cadence</div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* RIGHT — stacked 3D credit cards + IQ score stamp */}
          <div className="hide-mobile">
            <HeroCardStack />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroCardStack() {
  return (
    <Reveal delay={120}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 460,
          aspectRatio: '1 / 1.05',
          marginLeft: 'auto',
        }}
      >
        {/* back card — navy */}
        <div
          style={{
            position: 'absolute',
            inset: 'auto 0 0 auto',
            width: '88%',
            top: '6%',
            right: '-4%',
            transform: 'rotate(7deg)',
            zIndex: 1,
            filter: 'blur(0.2px)',
            opacity: 0.96,
          }}
        >
          <CreditCard3D
            name="MAGNUS"
            bank="AXIS BANK"
            tagline="BURGUNDY"
            network="MASTERCARD"
            variant="navy"
            interactive={false}
          />
        </div>

        {/* middle card — obsidian */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '0%',
            width: '92%',
            transform: 'rotate(-3deg)',
            zIndex: 2,
          }}
        >
          <CreditCard3D
            name="EMERALDE"
            bank="ICICI"
            tagline="PRIVATE METAL"
            network="AMEX"
            variant="obsidian"
            interactive={false}
          />
        </div>

        {/* front card — gold (interactive) */}
        <div
          className="floaty"
          style={{
            position: 'absolute',
            top: '34%',
            left: '6%',
            width: '94%',
            transform: 'rotate(2deg)',
            zIndex: 3,
            filter: 'drop-shadow(0 30px 60px rgba(216,155,42,0.25))',
          }}
        >
          <CreditCard3D
            name="INFINIA"
            bank="HDFC"
            tagline="RESERVE METAL"
            network="VISA"
            variant="gold"
            interactive
          />
        </div>

        {/* IQ score stamp */}
        <Reveal delay={400}>
          <div
            style={{
              position: 'absolute',
              top: '6%',
              left: '-4%',
              zIndex: 4,
              width: 116,
              height: 116,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F2C658, #B5811E 70%, #8C5F12)',
              color: '#1A0E04',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 18px 36px -10px rgba(216,155,42,0.55), inset 0 1px 0 rgba(255,255,255,0.4)',
              border: '1px solid rgba(255,255,255,0.3)',
              transform: 'rotate(-10deg)',
              fontFamily: 'var(--font-display)',
            }}
          >
            <div
              className="label"
              style={{
                fontSize: 9,
                color: 'rgba(26,14,4,0.7)',
                marginBottom: 2,
              }}
            >
              IQ SCORE
            </div>
            <div
              style={{
                fontSize: 38,
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1,
              }}
            >
              <StatNumber value={94} />
            </div>
            <div
              className="serif"
              style={{
                fontSize: 11,
                fontStyle: 'italic',
                color: 'rgba(26,14,4,0.7)',
                marginTop: 2,
              }}
            >
              out of 100
            </div>
          </div>
        </Reveal>
      </div>
    </Reveal>
  );
}

/* ============================================================
   JOURNEYS
   ============================================================ */
function Journeys() {
  return (
    <section className="section">
      <div className="shell">
        <SectionHeader
          label="THREE WAYS IN"
          title="Start where you are."
          subtitle="No questionnaires. No bank quotas. Pick the path that matches your situation."
        />
        <div
          className="grid-1-mobile"
          style={{
            marginTop: 56,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}
        >
          {JOURNEYS.map(j => (
            <JourneyCard key={j.title} {...j} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   AI TOOLS
   ============================================================ */
function AITools() {
  return (
    <section className="section" style={{ background: 'var(--bg-2)' }}>
      <div className="shell">
        <SectionHeader
          label="AI TOOLKIT"
          title="Six engines. One unfair advantage."
          subtitle="Each tool answers a single, specific question — the kind a salesperson at the bank can&apos;t."
        />
        <div
          className="grid-2-mobile grid-1-mobile-sm"
          style={{
            marginTop: 56,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
          }}
        >
          {AI_TOOLS.map(t => (
            <AIToolCard
              key={t.title}
              icon={t.icon}
              title={t.title}
              desc={t.desc}
              href={t.href}
              badge={t.badge}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   TOP CARDS — uses CardTile from design components
   ============================================================ */
function TopCardsSection() {
  return (
    <section className="section">
      <div className="shell">
        <SectionHeader
          label="TOP 6 · MAY 2026"
          title="The cards holding their value this quarter."
          subtitle="Ranked by IQ Score — our composite of real annual value, devaluation risk and ease of redemption."
        />
        <div
          className="grid-2-mobile grid-1-mobile-sm"
          style={{
            marginTop: 56,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 22,
          }}
        >
          {TOP_CARDS.map((c, i) => (
            <CardTile key={c.name} card={c} href="/cards" rank={i + 1} />
          ))}
        </div>

        <div
          style={{
            marginTop: 48,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <GhostCTA href="/cards">See all 93+ cards</GhostCTA>
        </div>
      </div>
    </section>
  );
}

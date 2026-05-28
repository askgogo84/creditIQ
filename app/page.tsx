'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useState } from 'react';
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
import { ShowcaseStrip } from '@/components/design/ShowcaseStrip'
import { CleoHero }       from '@/components/design/CleoHero';
import { SEED_CARDS }     from '@/lib/data/seed-cards';
import type { CreditCard } from '@/lib/types';

const VARIANT_ROTATION: CardVariant[] = ['obsidian', 'navy', 'plum', 'gold', 'iris', 'mint'];
const NETWORK_BY_BANK: Record<string, string> = { HDFC: 'VISA', AXIS: 'MASTERCARD', ICICI: 'AMEX', SBI: 'VISA', AMEX: 'AMEX', AMERICAN: 'AMEX', IDFC: 'VISA', RBL: 'MASTERCARD', YES: 'VISA', AU: 'VISA' };

function tagline(tier?: string) {
  switch (tier) {
    case 'super-premium': return 'Reserve metal';
    case 'premium': return 'Premium';
    case 'mid': return 'Mid-tier';
    case 'entry': return 'Entry';
    default: return 'Standard';
  }
}

function toTileCard(c: CreditCard, i: number): TileCard {
  const bank = c.bank.toUpperCase();
  return { bank, name: c.name.replace(/^HDFC\s+|^AXIS\s+|^ICICI\s+|^SBI\s+|^AMEX\s+/i, '').replace(/ Credit Card$/i, ''), tagline: tagline(c.tier), tier: c.tier ? c.tier.toUpperCase().replace(/-/g, ' ') : 'CARD', network: NETWORK_BY_BANK[bank.split(' ')[0]] || 'VISA', variant: VARIANT_ROTATION[i % VARIANT_ROTATION.length], tags: (c.category || []).slice(0, 2).map(s => s.replace(/-/g, ' ')), fee: c.annual_fee_inr, iqScore: Math.round((c.expert_rating ?? 8) * 10) };
}

const CARDS = SEED_CARDS.filter(c => c.active !== false);

const DARK_BAND = { '--bg': '#0A1226', '--bg-2': '#101A36', '--surface': '#142950', '--ink': '#F5EFE6', '--ink-2': '#DCD2C0', '--ink-3': '#A89C8A', '--line': 'rgba(245,239,230,0.10)', '--line-strong': 'rgba(245,239,230,0.20)', '--copper': '#D89B2A', '--copper-2': '#E5AC3B', '--copper-3': '#F2C658', background: 'var(--obsidian)' } as CSSProperties;

const FAQS = [
  { q: "How do you make money if you don't take affiliate kickbacks?", a: "We charge a flat commission from the issuing bank when a user applies through us. The rate is identical across every card. Our rankings can't be bought." },
  { q: "How often is data refreshed?", a: "Daily for fees and reward rates. Weekly for full MITC scrapes. When a bank pushes a devaluation, we catch it within 6-24 hours and alert affected users." },
  { q: "Is my data safe? Do I need to give bank logins?", a: "No bank logins, no card numbers, no Aadhaar. Statement uploads are processed in-browser — nothing leaves your machine." },
  { q: "Can I trust the rankings?", a: "Every ranking shows its math. The full methodology is documented. Our scoring engine is reproducible from public MITC data." },
  { q: "Why is my favourite card ranked lower than expected?", a: "We rank by effective reward rate after fees and devaluations. If your card got nerfed, it dropped." },
  { q: "Does this work for UAE / Singapore cards?", a: "UAE: yes, 16 cards live. Singapore on the roadmap." },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(o => !o)} style={{ padding: '20px 24px', background: 'var(--surface,#fff)', border: '1px solid var(--line,rgba(20,41,80,0.08))', borderRadius: 24, cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <span style={{ fontWeight: 600, fontSize: 'clamp(15px,1.4vw,18px)', color: 'var(--ink,#142950)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>{q}</span>
        <span style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(216,155,42,0.15)', color: 'var(--copper,#8C5F12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, flexShrink: 0, transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
      </div>
      {open && <p style={{ marginTop: 14, color: 'var(--ink-2,#2A3F6B)', fontSize: 15, lineHeight: 1.6 }}>{a}</p>}
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Header />

      {/* Sticky devaluation ticker — always visible below nav */}
      <div style={{ position: 'sticky', top: 60, zIndex: 49 }}>
        <DevalTicker items={[
          'AXIS Magnus devalued — Grab Vouchers capped at 1:0.4',
          'HDFC SmartBuy halved on Cleartrip from May 2026',
          'ICICI Sapphiro removed all spend-based renewal benefits',
          'SBI Aurum to scrap Priority Pass guest visits',
          'AMEX MRCC reduced point earn on utility bills to 0',
          'New — AU Bank Zenith+ launches with 10x on fuel',
        ]} />
      </div>

      <div className="page-fade">

        <CleoHero />

        <ShowcaseStrip />


        <section style={{ background: '#291210', padding: 'clamp(56px,8vw,96px) 0', borderTop: '1px solid rgba(255,233,199,0.12)', borderBottom: '1px solid rgba(255,233,199,0.12)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-30%', left: '40%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(216,155,42,0.20),transparent 60%)', filter: 'blur(80px)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(20px,5vw,80px)', position: 'relative' }}>
            <Reveal style={{ textAlign: 'center', marginBottom: 'clamp(36px,5vw,56px)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,233,199,0.08)', border: '1px solid rgba(255,233,199,0.18)', marginBottom: 20 }}>
                <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, letterSpacing: '0.16em', color: '#FFE9C7', textTransform: 'uppercase', fontWeight: 600 }}>RECEIPTS . BY THE NUMBERS</span>
              </div>
              <h2 style={{ fontSize: 'clamp(32px,5.5vw,68px)', letterSpacing: '-0.035em', lineHeight: 1.02, fontWeight: 800, color: '#FFE9C7', maxWidth: 800, margin: '0 auto' }}>
                We don't{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontStyle: 'italic', fontWeight: 400, color: '#D89B2A' }}>guess</span>. We just count.
              </h2>
            </Reveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 'clamp(20px,3vw,40px)' }} className="grid-2-mobile">
              {[
                { v: 12847, suffix: '', label: 'Cards roasted', sub: 'And counting daily.' },
                { v: 4.2, prefix: '₹', suffix: 'Cr', label: 'Saved by users', sub: 'In rewards earned vs. lost.', decimals: 1 },
                { v: 100, suffix: '+', label: 'Cards tracked', sub: 'Across 24 banks.' },
                { v: 0, suffix: '', label: 'Affiliate bias', sub: 'Same rate on every card.' },
              ].map((s, i) => (
                <Reveal key={i} delay={i * 80}>
                  <div style={{ borderLeft: '1px solid rgba(255,233,199,0.15)', paddingLeft: 20 }}>
                    <div style={{ fontWeight: 800, fontSize: 'clamp(40px,5.5vw,88px)', letterSpacing: '-0.045em', lineHeight: 0.9, color: '#FFE9C7' }}>
                      <StatNumber value={s.v} prefix={s.prefix || ''} suffix={s.suffix} decimals={s.decimals || 0} />
                    </div>
                    <div style={{ marginTop: 14, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#D89B2A' }}>{s.label}</div>
                    <div style={{ marginTop: 6, fontSize: 13, color: 'rgba(255,233,199,0.5)', lineHeight: 1.5 }}>{s.sub}</div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="section" style={{ ...DARK_BAND, borderTop: '1px solid var(--line)' }}>
          <div className="shell">
            <SectionHeader label="START HERE . 03 PATHS" title={<>Three ways to <span className="serif" style={{ color: 'var(--copper)' }}>begin</span>.</>} subtitle="Most people don't know what they want until they see it. Pick the question that sounds most like you." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginTop: 'clamp(40px,6vw,64px)' }} className="grid-1-mobile">
              <JourneyCard eyebrow="01 . FIND" title={<>Show me the <span className="serif" style={{ color: 'var(--copper)' }}>right</span> card for me.</>} subtitle="Tell us how you spend. Get one card recommendation backed by maths, not commissions." href="/smart-match" />
              <JourneyCard eyebrow="02 . ROAST" title={<>Tell me if my card <span className="serif" style={{ color: 'var(--terracotta)' }}>sucks</span>.</>} subtitle="Drop your current card and a sample month of spending. We grade it brutally — A through F." href="/card-roast" />
              <JourneyCard eyebrow="03 . EARN" title={<>How do I squeeze more from my <span className="serif" style={{ color: 'var(--sage)' }}>points</span>?</>} subtitle="Most people redeem at Rs.0.25/pt. We find paths worth 3-5x more." href="/points-optimizer" />
            </div>
          </div>
        </section>


        {/* ── BIG STATEMENT ── */}
        <section style={{ padding: 'clamp(80px,12vw,140px) 0', background: 'var(--copper-3,#D89B2A)', color: 'var(--ink,#142950)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '120%', opacity: 0.08, pointerEvents: 'none' }}>
            <svg viewBox='0 0 800 200' style={{ width: '100%' }}><path d='M0,100 Q200,20 400,100 T800,100' stroke='var(--ink)' strokeWidth='3' fill='none'/><path d='M0,140 Q200,60 400,140 T800,140' stroke='var(--ink)' strokeWidth='3' fill='none'/></svg>
          </div>
          <div className='shell' style={{ position: 'relative', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(36px,7vw,112px)', letterSpacing: '-0.04em', lineHeight: 0.98, fontWeight: 800, maxWidth: 1100, margin: '0 auto' }}>
              We don't take money to{' '}
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontStyle: 'italic', fontWeight: 400 }}>rank cards</span>
              </span>.
              <br />We take it to{' '}
              <span style={{ background: 'var(--ink,#142950)', color: 'var(--copper-3,#D89B2A)', padding: '0 16px', borderRadius: 8, display: 'inline-block' }}>rank ourselves</span>.
            </h2>
            <p style={{ marginTop: 36, fontSize: 'clamp(16px,1.4vw,21px)', color: 'var(--ink-2,#2A3F6B)', maxWidth: 720, margin: '36px auto 0', lineHeight: 1.55, fontWeight: 500 }}>
              Every other comparison site in India earns Rs.500-3,000 per approved application. Their rankings are bought, not earned. We charge a flat Rs.2,800. Same on every card.
            </p>
          </div>
        </section>

        <section className="section" style={{ background: 'var(--bg-2,#EFE7D8)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', position: 'relative', overflow: 'hidden' }}>
          <div className="shell" style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 40, marginBottom: 'clamp(40px,6vw,64px)' }} className="stack-mobile">
              <SectionHeader label="AI TOOLBOX . 06 TOOLS" title={<>The arsenal.<br /><span className="serif" style={{ color: 'var(--copper)' }}>Built to earn you more</span>, not sell you more.</>} subtitle={null} />
              <Reveal><Link href="/smart-match" style={{ padding: '12px 24px', borderRadius: 999, border: '1.5px solid var(--ink,#142950)', color: 'var(--ink,#142950)', textDecoration: 'none', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>Open the toolbox</Link></Reveal>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="grid-1-mobile">
              <AIToolCard icon="◐" title="Card Match" desc="Type how you spend in plain English. We pick one card. No top-10 lists, no rankings sold to the highest bidder." badge={{ text: 'POPULAR', tone: 'badge-copper' }} href="/smart-match" />
              <AIToolCard icon="✦" title="Card Roast" desc="Brutal A-F grade on your current card. Shareable. Probably mean. Definitely accurate." badge={{ text: 'NEW', tone: 'badge-plum' }} href="/card-roast" />
              <AIToolCard icon="◇" title="Statement Truth" desc="Upload your statement. We tell you if your card is doing what the brochure promised." href="/statement-truth" />
              <AIToolCard icon="↻" title="Switch Wizard" desc="Already have a card? See if there's a better one for the same spend pattern." href="/card-switch" />
              <AIToolCard icon="✈" title="Travel AI" desc="Chat with an AI that knows every airline, hotel and transfer ratio." badge={{ text: 'BETA', tone: 'badge-amber' }} href="/travel" />
              <AIToolCard icon="◉" title="Lounge Tracker" desc="Never get turned away at the gate. Tracks free visits across every card you carry." href="/lounge-tracker" />
            </div>
          </div>
        </section>

        <section className="section">
          <div className="shell">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 40, marginBottom: 'clamp(40px,6vw,56px)', flexWrap: 'wrap' }}>
              <SectionHeader label="THE TOP DECK . RANKED" title={<>Cards that <span className="serif" style={{ color: 'var(--copper)' }}>actually</span> earn their fee.</>} subtitle="Ranked by effective reward rate on Rs.6L-Rs.15L annual spend, after fees." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }} className="grid-1-mobile">
              {CARDS.slice(0, 6).map((c, i) => (
                <CardTile key={c.slug} card={toTileCard(c, i)} rank={i + 1} href={`/card/${c.slug}`} />
              ))}
            </div>
            <Reveal style={{ marginTop: 48, textAlign: 'center' }}>
              <Link href="/cards" style={{ padding: '14px 32px', borderRadius: 999, border: '1.5px solid var(--ink,#142950)', color: 'var(--ink,#142950)', textDecoration: 'none', fontSize: 15, fontWeight: 600, display: 'inline-block' }}>See all 100+ cards</Link>
            </Reveal>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="shell">
            <Reveal>
              <div className="label" style={{ marginBottom: 18 }}>BROWSE BY CATEGORY</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {['International Travel', 'Domestic Travel', 'Forex 0%', 'Lounge Access', 'Cashback', 'Online Shopping', 'Fuel', 'Dining', 'First Card', 'Lifetime Free', 'Business', 'Metal'].map(c => (
                  <Link key={c} href="/cards" className="chip" style={{ fontSize: 14, textDecoration: 'none' }}>{c}</Link>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section style={{ padding: 'clamp(80px,12vw,140px) 0' }}>
          <div className="shell">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'clamp(40px,6vw,80px)', alignItems: 'flex-start' }} className="grid-1-mobile">
              <Reveal>
                <div className="label-copper" style={{ marginBottom: 20 }}>FAQ . 06 OF THEM</div>
                <h2 style={{ fontSize: 'clamp(32px,5vw,68px)', letterSpacing: '-0.035em', lineHeight: 1.02, fontWeight: 800 }}>
                  The honest{' '}
                  <span className="serif" style={{ color: 'var(--copper)', fontStyle: 'italic', fontWeight: 400 }}>questions</span>.
                </h2>
                <p style={{ marginTop: 24, fontSize: 'clamp(15px,1.3vw,18px)', color: 'var(--ink-3,#5A6A8A)', maxWidth: 380, lineHeight: 1.55 }}>
                  Stuff people ask before trusting us with their money. Real answers, no spin.
                </p>
              </Reveal>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {FAQS.map((f, i) => <Reveal key={i} delay={i * 60}><FAQItem q={f.q} a={f.a} /></Reveal>)}
              </div>
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingBottom: 120, position: 'relative' }}>
          <div className="shell" style={{ position: 'relative' }}>
            <Reveal style={{ textAlign: 'center', maxWidth: 1000, margin: '0 auto' }}>
              <div className="label-copper" style={{ marginBottom: 24 }}>YOUR MOVE</div>
              <h2 style={{ fontSize: 'clamp(36px,5vw,64px)', letterSpacing: '-0.035em', lineHeight: 1.04, fontWeight: 800 }}>
                The right card — and every rupee it owes you — is{' '}
                <span className="shimmer-text">90 seconds</span> away.
              </h2>
              <p style={{ marginTop: 32, fontSize: 'clamp(16px,1.3vw,19px)', color: 'var(--ink-2,#2A3F6B)', maxWidth: 520, margin: '32px auto 0' }}>
                No sign-up. No email. No commissions. Just the right card.
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



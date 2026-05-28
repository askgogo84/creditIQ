import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { Reveal } from '@/components/design/Reveal';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'The Indian Credit Card Ladder 2026 | CreditIQ',
  description: 'Which credit card to get first, second, and third in India. The exact upgrade path from entry to super-premium — with income, score, and spend thresholds.',
};

const LADDER = [
  {
    level: '01',
    tier: 'Your First Card',
    income: 'Rs.20,000-40,000/month',
    score: '650-700+',
    color: '#2d7a56',
    bg: 'rgba(45,122,86,0.08)',
    border: 'rgba(45,122,86,0.20)',
    goal: 'Build credit history. Get approved. Earn something back. Don\'t pay fees.',
    cards: [
      { name: 'Amazon Pay ICICI', fee: 'Free', why: '5% on Amazon, 2% on partners, no annual fee. Best first card if you shop on Amazon.', slug: 'amazon-pay-icici' },
      { name: 'Kiwi Axis RuPay', fee: 'Free', why: 'Uncapped 1.5% on all UPI offline transactions. Best if you pay via UPI constantly.', slug: 'kiwi-axis-rupay' },
      { name: 'IDFC FIRST Classic', fee: 'Free', why: 'Easy approval even below Rs.20K income. Good stepping stone.', slug: 'idfc-first-classic' },
      { name: 'Kotak 811 #DreamDifferent', fee: 'Free', why: 'No income proof required. For students and self-employed with no pay slip.', slug: 'kotak-811-dream' },
    ],
    rules: [
      'Pay the FULL bill every month — never carry a balance at 36-42% APR',
      'Use it for 3-6 months before applying for your next card',
      'Keep utilisation below 30% of your credit limit',
      'Do not apply for multiple cards in the same month — hard inquiries hurt your score',
    ],
  },
  {
    level: '02',
    tier: 'The Cashback Layer',
    income: 'Rs.40,000-80,000/month',
    score: '700-730',
    color: 'var(--copper,#8C5F12)',
    bg: 'rgba(212,163,115,0.10)',
    border: 'rgba(212,163,115,0.25)',
    goal: 'Maximise cashback on your actual spending categories. No redemption complexity.',
    cards: [
      { name: 'SBI Cashback', fee: 'Rs.999', why: '5% on all online spends. Auto cashback. If you spend Rs.40K+/month online, this pays for itself 20x over.', slug: 'sbi-cashback' },
      { name: 'Flipkart Axis Bank', fee: 'Rs.500', why: '5% on Flipkart + Myntra, 4% on Swiggy + Uber. Best if you\'re in the Flipkart ecosystem.', slug: 'axis-flipkart' },
      { name: 'HDFC Swiggy BLCK', fee: 'Rs.500', why: '10% on Swiggy food + Instamart. If you order 3+ times a week, this card pays for itself monthly.', slug: 'hdfc-swiggy-blck' },
      { name: 'Axis ACE', fee: 'Rs.499', why: '5% on Google Pay bill payments + 4% on Swiggy/Ola. If you pay all bills via GPay, unbeatable.', slug: 'axis-ace' },
    ],
    rules: [
      'Stack with your first card — use cashback card for its best category, first card for everything else',
      'Check monthly caps — SBI caps at Rs.2,000, HDFC Swiggy caps at Rs.1,500',
      'Don\'t get all of these — pick 1-2 that match your actual spending',
      'At this stage, your score should be 700+ — start tracking it monthly',
    ],
  },
  {
    level: '03',
    tier: 'The Travel Entry Point',
    income: 'Rs.60,000-1,20,000/month',
    score: '720-740',
    color: '#0369a1',
    bg: 'rgba(14,165,233,0.08)',
    border: 'rgba(14,165,233,0.20)',
    goal: 'Get your first lounge access. Start earning airline miles. Low forex markup for travel.',
    cards: [
      { name: 'HDFC Regalia Gold', fee: 'Rs.2,500', why: 'Best mid-tier card in India. 12 domestic + 6 international lounges, 5X on Marriott + Myntra, Rs.2,500 fee waived on Rs.4L spend. First stop on the HDFC ladder.', slug: 'hdfc-regalia-gold' },
      { name: 'Scapia Federal Bank', fee: 'Free', why: 'Zero forex. Use alongside Regalia Gold — Scapia for all international spend, Regalia for domestic earning.', slug: 'scapia-federal' },
      { name: 'IndusInd Pinnacle', fee: 'Free', why: 'Rs.0 annual fee with 8 domestic + 4 international lounges. Underrated — punches far above its fee.', slug: 'indusind-pinnacle' },
      { name: 'HSBC TravelOne', fee: 'Rs.4,999', why: '18 airline transfer partners at 1:1. If you know which airline you fly most, this unlocks serious sweet spots.', slug: 'hsbc-travelone' },
    ],
    rules: [
      'This is the stage where you start learning transfer partners — pick one airline programme and focus on it',
      'Regalia Gold is the safe default — you can upgrade to Infinia or Diners Black from here',
      'Do NOT apply for Infinia or Magnus yet — get approved here first, build relationship with bank',
      'Use Scapia for all international travel — saves 3.5% forex vs standard cards',
    ],
  },
  {
    level: '04',
    tier: 'The Premium Layer',
    income: 'Rs.1,00,000-2,50,000/month',
    score: '740-760',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.20)',
    goal: 'Serious rewards. Unlimited lounges. Real airline transfer programmes. Fee-justified returns.',
    cards: [
      { name: 'Axis Magnus Burgundy', fee: 'Rs.10,000', why: '24% effective return on OTA travel spend. If you spend Rs.1L+/month on MakeMyTrip or Yatra, Magnus wins everything.', slug: 'axis-magnus-burgundy' },
      { name: 'ICICI Emeralde Private Metal', fee: 'Rs.12,499', why: 'Up to 36% on iShop hotel bookings. Unlimited lounges. Strong if you\'re in the ICICI ecosystem.', slug: 'icici-emeralde-private-metal' },
      { name: 'SBI AURUM', fee: 'Rs.9,999', why: '5X dining + travel, unlimited domestic lounges, 8 Priority Pass visits. Best SBI card — good for SBI banking customers.', slug: 'sbi-aurum' },
      { name: 'YES Marquee', fee: 'Rs.9,999', why: 'Unlimited domestic + 8 international lounges, 1.75% forex. Underrated for YES Bank customers.', slug: 'yes-marquee' },
    ],
    rules: [
      'The card fee is only justified if you earn at least 2x the fee back in rewards',
      'At Rs.10,000 fee, you need to earn Rs.20,000+ in rewards — do the maths for your spend before applying',
      'Magnus makes sense above Rs.75,000-1L/month total spend; below that, Regalia Gold is cheaper to justify',
      'At this tier, bank relationship matters — relationship banking unlocks better limits and approval chances',
    ],
  },
  {
    level: '05',
    tier: 'The Super-Premium Layer',
    income: 'Rs.2,50,000+/month',
    score: '760+',
    color: '#78350f',
    bg: 'rgba(212,163,115,0.15)',
    border: 'rgba(201,151,46,0.30)',
    goal: 'Maximum possible rewards. Unlimited everything. Airline transfer ecosystem mastery. Invite-only access.',
    cards: [
      { name: 'HDFC Infinia Metal Edition', fee: 'Rs.12,500', why: 'Best overall super-premium card in India. Unlimited Priority Pass (self + guest), 10X SmartBuy, 1:1 KrisFlyer, Concierge, Golf. The gold standard.', slug: 'hdfc-infinia' },
      { name: 'HDFC Diners Club Black', fee: 'Rs.10,000', why: 'Similar value to Infinia. Better for Diners Club lounge network. Good secondary super-premium card.', slug: 'hdfc-diners-black' },
      { name: 'Axis Reserve', fee: 'Rs.50,000', why: 'Only if you spend Rs.35L+/year. Absolute top-tier — unlimited lounges + 8 guest visits, 24 golf rounds, dedicated RM.', slug: 'axis-reserve' },
      { name: 'Amex Platinum Charge', fee: 'Rs.60,000', why: 'HNI lifestyle card. Hotel status, Centurion lounge access, travel credits. Only for specific HNI needs.', slug: 'amex-platinum-travel' },
    ],
    rules: [
      'Infinia is invite-only — apply only after Rs.8-10L annual spend on HDFC cards or TRV Rs.40L+',
      'At this tier, the correct strategy is a 2-card portfolio: one for earning (Infinia/Magnus), one for zero forex (Scapia)',
      'Start transferring points to airlines — at this level, points accumulate fast enough for premium cabin redemptions',
      'Track devaluations obsessively — these cards have been cut 4x in 18 months',
    ],
  },
];

export default function CardLadderPage() {
  return (
    <>
      <Header />
      <div className="page-fade">
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 48 }}>
          <div className="aurora" style={{ top: -80, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.22),transparent 60%)' }} />
          <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
            <Reveal>
              <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--copper,#8C5F12)', fontWeight: 700, marginBottom: 16 }}>Strategy guide &bull; 2026 Edition</div>
              <h1 style={{ fontSize: 'clamp(36px,6vw,80px)', fontWeight: 800, color: 'var(--ink,#142950)', lineHeight: 1.0, letterSpacing: '-0.04em', margin: '0 0 16px' }}>
                The Indian Credit Card{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>Ladder</span>
              </h1>
              <p style={{ fontSize: 'clamp(15px,1.4vw,18px)', color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.65, margin: 0, maxWidth: 560 }}>
                Which card to get first, second, and third. The exact upgrade path — with income requirements, credit score thresholds, and what each tier unlocks.
              </p>
            </Reveal>
          </div>
        </section>

        <section style={{ paddingBottom: 80 }}>
          <div className="shell" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {LADDER.map((rung, i) => (
              <Reveal key={i} style={{ animationDelay: `${i * 80}ms` }}>
                <div style={{ background: rung.bg, border: `1px solid ${rung.border}`, borderRadius: 20, overflow: 'hidden' }}>
                  {/* Header */}
                  <div style={{ padding: '18px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, fontWeight: 700, color: rung.color, letterSpacing: '0.12em', marginBottom: 4 }}>LEVEL {rung.level}</div>
                      <h2 style={{ fontSize: 'clamp(18px,2.5vw,26px)', fontWeight: 800, color: 'var(--ink,#142950)', margin: '0 0 6px', letterSpacing: '-0.02em' }}>{rung.tier}</h2>
                      <p style={{ fontSize: 14, color: 'var(--ink-2,#2A3F6B)', margin: 0, lineHeight: 1.6 }}>{rung.goal}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, color: 'var(--ink-3,#5A6A8A)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>Income</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: rung.color }}>{rung.income}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, color: 'var(--ink-3,#5A6A8A)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>CIBIL</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: rung.color }}>{rung.score}</div>
                      </div>
                    </div>
                  </div>

                  {/* Cards */}
                  <div style={{ padding: '0 28px 20px' }}>
                    <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 12 }}>Recommended cards at this level</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10, marginBottom: 20 }}>
                      {rung.cards.map((card, ci) => (
                        <Link key={ci} href={`/cards/${card.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                          <div style={{ background: 'var(--surface,#fff)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--line,rgba(20,41,80,0.08))', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink,#142950)', lineHeight: 1.3 }}>{card.name}</div>
                              <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: card.fee === 'Free' ? '#2d7a56' : 'var(--copper,#8C5F12)', fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{card.fee}</span>
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--ink-3,#5A6A8A)', lineHeight: 1.6 }}>{card.why}</div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Rules */}
                    <div style={{ background: 'rgba(20,41,80,0.04)', borderRadius: 10, padding: '14px 16px' }}>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 10 }}>Rules for this level</div>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {rung.rules.map((rule, ri) => (
                          <li key={ri} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.6 }}>
                            <span style={{ color: rung.color, fontWeight: 700, flexShrink: 0, fontSize: 14 }}>→</span>
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}

            {/* CTA */}
            <Reveal>
              <div style={{ background: 'var(--ink,#142950)', borderRadius: 20, padding: 'clamp(28px,4vw,48px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div className="aurora" style={{ top: -40, right: -40, width: 300, height: 300, background: 'radial-gradient(circle,rgba(212,163,115,0.18),transparent 60%)' }} />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <h2 style={{ fontSize: 'clamp(20px,3vw,32px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
                    Not sure which level you&apos;re at?
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, margin: '0 0 24px', lineHeight: 1.7 }}>
                    Tell us your monthly spend and income — our AI picks the exact right card for your profile in 90 seconds.
                  </p>
                  <Link href="/smart-match" style={{ display: 'inline-block', background: 'var(--copper-3,#D89B2A)', color: '#fff', padding: '14px 32px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
                    Find my card →
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
        <DesignFooter />
      </div>
    </>
  );
}

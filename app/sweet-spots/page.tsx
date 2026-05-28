import Link from 'next/link';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { Reveal } from '@/components/design/Reveal';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Credit Card Redemption Sweet Spots India 2026 | CreditIQ',
  description: 'The 8 best credit card redemption sweet spots for Indian cardholders — HDFC Infinia, Axis Magnus, Amex and more. Real numbers, real steps, zero fluff.',
};

const SWEET_SPOTS = [
  {
    id: 'krisflyer-del-sin',
    tag: 'Best Overall',
    tagBg: 'rgba(212,163,115,0.15)',
    tagColor: 'var(--copper,#8C5F12)',
    num: '01',
    headline: 'HDFC Infinia → KrisFlyer → DEL-SIN Business Class',
    subhead: '45,000 points. Worth Rs.85,000+. The benchmark.',
    math: [
      { label: 'Points Used', value: '45,000 HDFC Reward Points', highlight: false },
      { label: 'Catalogue Value', value: 'Rs.9,000', highlight: false },
      { label: 'Redemption Value', value: 'Rs.85,000+', highlight: true },
      { label: 'Advantage', value: '9.4x better than catalogue', highlight: true },
    ],
    why: 'Singapore Airlines business class between Delhi and Singapore is one of the most consistent award sweet spots in Asia. The 1:1 transfer ratio from HDFC Infinia to KrisFlyer makes the maths simple — and the lie-flat seat, book-the-cook dining, and Changi layover make the experience unforgettable.',
    steps: [
      'Log into HDFC NetBanking → Credit Cards → Redeem Reward Points → Airline Transfer',
      'Select Singapore Airlines KrisFlyer and enter your KrisFlyer number',
      'Transfer at least 45,000 points (1:1 ratio, posts in 24–48 hours)',
      'Search krisflyer.com for BOM/DEL/BLR → SIN business class saver awards',
      'Check "KrisFlyer Spontaneous Escapes" — monthly flash sales cut requirements by 30–50%',
      'Book and pay ~Rs.3,500 in taxes only',
    ],
    tip: 'Transfer only when you have confirmed award space — miles take 24–48hrs to post and seats disappear fast.',
    cardSlug: 'hdfc-infinia', cardName: 'HDFC Infinia',
  },
  {
    id: 'turkish-del-ist',
    tag: 'Highest Value',
    tagBg: 'rgba(196,106,82,0.12)',
    tagColor: 'var(--terracotta,#C46A52)',
    num: '02',
    headline: 'HDFC/Axis → Turkish Miles&Smiles → DEL-IST Business Class',
    subhead: '60,000 miles round-trip. Rs.1.07/point. Fixed pricing.',
    math: [
      { label: 'Miles Needed', value: '60,000 Miles&Smiles', highlight: false },
      { label: 'Cash Ticket Price', value: 'Rs.64,000+', highlight: false },
      { label: 'Cash Paid in Taxes', value: '~Rs.7,400 only', highlight: true },
      { label: 'Value Per Point', value: 'Rs.1.07 — top 5% in India', highlight: true },
    ],
    why: 'Turkish Airlines uses a fixed zone-based award chart — no dynamic pricing. DEL to Istanbul in business class costs 30,000 miles each way regardless of peak season. Istanbul also makes a perfect stopover gateway to Europe.',
    steps: [
      'Open a Miles&Smiles account at turkishairlines.com (use mobile app — web signup is buggy)',
      'Transfer from HDFC Infinia (1:1) or Axis Magnus EDGE Miles (1.33:1) via your bank portal',
      'Search turkishairlines.com for award availability — use Star Alliance search for partner flights',
      'DEL-IST on Turkish metal: 30,000 miles J one-way, 60,000 round-trip',
      'Call Turkish to book Star Alliance partner awards — cannot be done online',
      'Pay taxes (~Rs.7,400 round-trip) — Turkish does not add fuel surcharges on most partner bookings',
    ],
    tip: 'Turkish went through a December 2025 devaluation but the India-to-Europe zone remains strong value.',
    cardSlug: 'hdfc-infinia', cardName: 'HDFC Infinia / Axis Magnus',
  },
  {
    id: 'smartbuy-gyftr',
    tag: 'No-Brainer',
    tagBg: 'rgba(75,181,130,0.12)',
    tagColor: '#2d7a56',
    num: '03',
    headline: 'HDFC SmartBuy Gyftr Vouchers — 16% Return, Zero Effort',
    subhead: 'No airline. No transfer. Just 16% back on everyday brands.',
    math: [
      { label: 'Points Used', value: '1,000 HDFC Reward Points', highlight: false },
      { label: 'Catalogue Rate', value: 'Rs.200 (Rs.0.20/pt)', highlight: false },
      { label: 'Gyftr Rate', value: 'Rs.320 in brand vouchers', highlight: true },
      { label: 'Uplift', value: '60% better than catalogue', highlight: true },
    ],
    why: 'Not everyone wants to book business class. Gyftr on SmartBuy gives Rs.0.32/point — 60% better than the standard catalogue — across Amazon, Flipkart, Myntra, Nykaa, Swiggy, and Zomato. Simple, instant, no transfers.',
    steps: [
      'Go to smartbuy.hdfcbank.com and log in with your HDFC NetBanking credentials',
      'Click "Gift Cards" → browse Gyftr brand partners',
      'Select the brand and denomination — Amazon, Flipkart, Swiggy, Zomato all available',
      'Pay entirely with Reward Points — no cash top-up needed',
      'Gift card code delivered to your registered email within minutes',
    ],
    tip: 'SmartBuy gives 5X accelerated points when you shop there — stack earning and redemption on the same portal.',
    cardSlug: 'hdfc-regalia-gold', cardName: 'HDFC Infinia / Diners Black / Regalia Gold',
  },
  {
    id: 'amex-marriott',
    tag: 'Points Multiplier',
    tagBg: 'rgba(99,102,241,0.10)',
    tagColor: '#4f46e5',
    num: '04',
    headline: 'Amex MR → Marriott Bonvoy → Airline Transfer (The 3:1 Trick)',
    subhead: 'Unlock Air India top-ups via Amex — the only indirect route.',
    math: [
      { label: 'Transfer Rate', value: '3 Amex MR = 1 Marriott point', highlight: false },
      { label: 'Marriott to Airlines', value: '3:1 with 25% bonus miles', highlight: false },
      { label: 'Best Window', value: 'Marriott 30% transfer bonus promos', highlight: true },
      { label: 'Use Case', value: 'Air India top-up without HDFC card', highlight: true },
    ],
    why: 'Amex Membership Rewards transfers to Marriott Bonvoy at 3:1. Marriott then transfers to 40+ airline partners at 3:1 with a 25% bonus. For Air India, this is the only indirect way to top up Flying Returns using a non-HDFC card.',
    steps: [
      'Earn Amex MR points on Amex Platinum Travel or MRCC',
      'Transfer to Marriott Bonvoy (3 MR = 1 Marriott point, allow 1–3 business days)',
      'In Marriott account, go to Points → Transfer to Airlines → select Air India',
      'Minimum 10,000 Marriott points per transfer → receive ~4,166 Air India miles (with 25% bonus)',
      'Watch for Marriott\'s 30% transfer bonus promotions — they run 2–3x per year',
    ],
    tip: 'Never transfer without a Marriott bonus promo active — the base ratio is mediocre, the bonus rate makes it worthwhile.',
    cardSlug: 'amex-platinum-travel', cardName: 'Amex Platinum Travel / MRCC',
  },
  {
    id: 'axis-magnus-12x',
    tag: 'Earning Hack',
    tagBg: 'rgba(14,165,233,0.10)',
    tagColor: '#0369a1',
    num: '05',
    headline: 'Axis Magnus 12X on OTA Travel — 24% Effective Return',
    subhead: '12 EDGE Miles per Rs.100 on MakeMyTrip, Yatra, EaseMyTrip.',
    math: [
      { label: 'Earn Rate', value: '12 EDGE Miles per Rs.100 on OTAs', highlight: false },
      { label: 'Mile Value', value: 'Rs.2 per EDGE Mile at partners', highlight: false },
      { label: 'Effective Return', value: '24% on all OTA travel spend', highlight: true },
      { label: 'Category', value: 'Highest earn rate on any Indian card', highlight: true },
    ],
    why: 'Axis Magnus gives 12 EDGE Miles per Rs.100 on travel aggregators. Each EDGE Mile is worth Rs.2 transferred to partner airlines. That\'s 24% back on every flight or hotel booked via OTA — the highest earn rate on any mainstream Indian credit card.',
    steps: [
      'Get the Axis Magnus card (Rs.10,000 fee, waived on Rs.15L annual spend)',
      'Book all flights and hotels via Yatra, MakeMyTrip, or EaseMyTrip with the Magnus',
      'Earn 12 EDGE Miles per Rs.100 (vs 3.5 EDGE Miles on regular spends)',
      'Transfer EDGE Miles to Singapore KrisFlyer (1.33 EDGE Miles = 1 KrisFlyer mile)',
      'Or transfer to Turkish Miles&Smiles for the DEL-IST sweet spot above',
    ],
    tip: 'Axis removed Accor, Qatar, and Marriott as partners in April 2026. The remaining partners — KrisFlyer, Turkish, Air France KLM — are the strongest ones anyway.',
    cardSlug: 'axis-magnus', cardName: 'Axis Magnus',
  },
  {
    id: 'sbi-cashback',
    tag: 'Simplest',
    tagBg: 'rgba(100,116,139,0.10)',
    tagColor: '#475569',
    num: '06',
    headline: 'SBI Cashback Card — 5% Back Online, No Category Restrictions',
    subhead: 'Rs.0 in thinking required. Spend online, get 5% back monthly.',
    math: [
      { label: 'Online Rate', value: '5% on all online spends', highlight: true },
      { label: 'Offline Rate', value: '1% on all other spends', highlight: false },
      { label: 'Monthly Cap', value: 'Rs.2,000/month (post April 2026)', highlight: false },
      { label: 'Annual Fee', value: 'Rs.999 (waived on Rs.2L spend)', highlight: false },
    ],
    why: 'After the April 2026 devaluation, the SBI Cashback card\'s 5% rate is now capped at Rs.2,000/month. For users spending under Rs.40,000/month online, this is still India\'s best no-effort cashback card — credited automatically, no portals.',
    steps: [
      'Apply for SBI Cashback card (Rs.999 annual fee, waived on Rs.2L annual spend)',
      'Use it for all online spends — Amazon, Flipkart, Swiggy, Zomato, Nykaa, OTT subscriptions',
      'Cashback credited as statement credit every billing cycle',
      'No activation, no portal login, no transfer — it just works',
    ],
    tip: 'Post April 2026: cashback caps at Rs.2,000/month online and Rs.2,000/month offline. For higher spend, pair with Axis ACE for overflow.',
    cardSlug: 'sbi-cashback', cardName: 'SBI Cashback',
  },
  {
    id: 'zero-fee-trio',
    tag: 'Zero-Fee Stack',
    tagBg: 'rgba(20,41,80,0.07)',
    tagColor: 'var(--ink,#142950)',
    num: '07',
    headline: 'The Rs.0 Portfolio — Amazon Pay ICICI + BoB Eterna + Scapia',
    subhead: '3–5% blended return, Rs.0 in annual fees. Better maths for most.',
    math: [
      { label: 'Amazon Pay ICICI', value: '5% on Amazon & partners, lifetime free', highlight: false },
      { label: 'BoB Eterna', value: '3.75% on all other spends, lifetime free', highlight: false },
      { label: 'Scapia', value: 'Zero forex markup abroad, lifetime free', highlight: false },
      { label: 'Net Annual Value', value: 'Rs.25,500 on Rs.50K/month spend', highlight: true },
    ],
    why: 'Three lifetime-free cards, divided intelligently by category, can outperform a Rs.10,000-fee premium card for spenders under Rs.6L/year. Amazon Pay ICICI covers online, BoB Eterna handles everything else domestically, Scapia handles international.',
    steps: [
      'Amazon Pay ICICI: apply via Amazon app — 5% on Amazon + partner merchants (Swiggy, Uber, BookMyShow)',
      'BoB Eterna: apply via Bank of Baroda — 3.75% effective return on all other domestic spends',
      'Scapia Federal Bank: apply online — zero forex markup on all international transactions',
      'Divide monthly spend: Amazon → ICICI, domestic other → BoB, international → Scapia',
      'No annual fee means every rupee of reward is genuine profit',
    ],
    tip: 'This portfolio works best under Rs.6L/year. Above that, the premium cards\' airline transfer value starts to outweigh the fee.',
    cardSlug: 'amazon-pay-icici', cardName: 'Amazon Pay ICICI + BoB Eterna + Scapia',
  },
  {
    id: 'krisflyer-spontaneous',
    tag: 'Time-Sensitive',
    tagBg: 'rgba(212,163,115,0.15)',
    tagColor: 'var(--copper,#8C5F12)',
    num: '08',
    headline: 'KrisFlyer Spontaneous Escapes — 30–50% Off Every Thursday',
    subhead: 'Flash sales every week. Real discounts on real seats.',
    math: [
      { label: 'Standard DEL-SIN J', value: '45,000 KrisFlyer miles', highlight: false },
      { label: 'Spontaneous Escapes', value: '30,000–35,000 miles', highlight: true },
      { label: 'Saving', value: '10,000–15,000 miles per redemption', highlight: true },
      { label: 'Lead Time Needed', value: '1–6 weeks departure', highlight: false },
    ],
    why: 'Singapore Airlines releases unsold premium cabin inventory every Thursday with 30–50% discounts. For flexible travellers with HDFC Infinia or Axis Magnus points already parked, this is consistently the best value in Indian miles.',
    steps: [
      'Sign up for KrisFlyer Spontaneous Escapes email alerts at singaporeair.com',
      'Check every Thursday morning — departures are typically 1–6 weeks out',
      'You need KrisFlyer miles already credited — transfers from HDFC take 24–48hrs',
      'Keep at least 40,000 miles "parked" and ready at all times',
      'Book directly on singaporeair.com — Spontaneous Escapes appear in the standard award search',
      'Pay taxes (~Rs.3,500 for BLR-SIN) and get your boarding pass',
    ],
    tip: 'Spontaneous Escapes disappear within hours. Have miles ready before Thursday, not after you see the deal.',
    cardSlug: 'hdfc-infinia', cardName: 'HDFC Infinia / Axis Magnus',
  },
];

export default function SweetSpotsPage() {
  return (
    <>
      <Header />
      <div className="page-fade">

        {/* ── Hero ── */}
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 60 }}>
          <div className="aurora" style={{ top: -80, right: -120, width: 700, height: 600, background: 'radial-gradient(circle,rgba(212,163,115,0.28),transparent 60%)' }} />
          <div className="aurora" style={{ bottom: -60, left: -80, width: 500, height: 400, background: 'radial-gradient(circle,rgba(196,106,82,0.18),transparent 60%)' }} />

          <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
            <Reveal style={{ textAlign: 'center', maxWidth: 820, margin: '0 auto clamp(48px,7vw,80px)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 16px', borderRadius: 999, background: 'rgba(212,163,115,0.12)', border: '1px solid rgba(212,163,115,0.30)', marginBottom: 28 }}>
                <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--copper,#8C5F12)', textTransform: 'uppercase', fontWeight: 700 }}>Original Research &bull; Updated May 2026</span>
              </div>
              <h1 style={{ fontSize: 'clamp(40px,7vw,96px)', letterSpacing: '-0.04em', lineHeight: 1.0, fontWeight: 800, color: 'var(--ink,#142950)', margin: '0 0 24px' }}>
                The 8 Best{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>Sweet Spots</span>
                <br />in India
              </h1>
              <p style={{ maxWidth: 540, margin: '0 auto', color: 'var(--ink-2,#2A3F6B)', fontSize: 'clamp(15px,1.4vw,18px)', lineHeight: 1.65 }}>
                Where your credit card points actually go the furthest — with real numbers, real steps, and zero fluff. All original research, no affiliate push.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── Sweet Spots ── */}
        <section style={{ paddingBottom: 80 }}>
          <div className="shell" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {SWEET_SPOTS.map((spot) => (
              <Reveal key={spot.id}>
                <article style={{ background: 'var(--paper,#FAF5EB)', borderRadius: 24, border: '1px solid var(--line,rgba(20,41,80,0.08))', overflow: 'hidden' }}>

                  {/* Header bar */}
                  <div style={{ background: 'var(--ink,#142950)', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>#{spot.num}</span>
                      <span style={{ padding: '3px 12px', borderRadius: 999, background: spot.tagBg, border: `1px solid ${spot.tagColor}30`, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: spot.tagColor }}>
                        {spot.tag}
                      </span>
                    </div>
                    <Link href={`/cards/${spot.cardSlug}`} style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--copper-3,#D89B2A)', textDecoration: 'none', letterSpacing: '0.05em', fontWeight: 600 }}>
                      {spot.cardName} →
                    </Link>
                  </div>

                  <div style={{ padding: 'clamp(20px,3vw,36px)' }}>
                    {/* Title */}
                    <h2 style={{ fontSize: 'clamp(18px,2.2vw,24px)', fontWeight: 800, color: 'var(--ink,#142950)', margin: '0 0 6px', lineHeight: 1.25, letterSpacing: '-0.02em' }}>
                      {spot.headline}
                    </h2>
                    <p style={{ fontFamily: 'var(--font-serif,Georgia,serif)', fontSize: 15, color: 'var(--ink-3,#5A6A8A)', margin: '0 0 24px', fontStyle: 'italic' }}>
                      {spot.subhead}
                    </p>

                    {/* Math grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1, background: 'var(--line,rgba(20,41,80,0.08))', borderRadius: 14, overflow: 'hidden', marginBottom: 24 }}>
                      {spot.math.map((m, i) => (
                        <div key={i} style={{ background: m.highlight ? 'rgba(212,163,115,0.10)' : 'var(--surface,#fff)', padding: '14px 18px' }}>
                          <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 5 }}>{m.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: m.highlight ? 'var(--copper,#8C5F12)' : 'var(--ink,#142950)', lineHeight: 1.3 }}>{m.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Why */}
                    <p style={{ fontSize: 14, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.8, margin: '0 0 24px' }}>{spot.why}</p>

                    {/* Steps */}
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ink-3,#5A6A8A)', marginBottom: 12 }}>How to do it</div>
                      <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {spot.steps.map((step, i) => (
                          <li key={i} style={{ fontSize: 13.5, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.65 }}>{step}</li>
                        ))}
                      </ol>
                    </div>

                    {/* Tip */}
                    <div style={{ padding: '12px 16px', background: 'rgba(212,163,115,0.10)', border: '1px solid rgba(212,163,115,0.25)', borderRadius: 10, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--copper,#8C5F12)', textTransform: 'uppercase', flexShrink: 0, paddingTop: 1 }}>Pro tip</span>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2,#2A3F6B)', lineHeight: 1.6 }}>{spot.tip}</p>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ paddingBottom: 80 }}>
          <div className="shell">
            <Reveal>
              <div style={{ background: 'var(--ink,#142950)', borderRadius: 24, padding: 'clamp(32px,5vw,56px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div className="aurora" style={{ top: -80, right: -80, width: 400, height: 400, background: 'radial-gradient(circle,rgba(212,163,115,0.20),transparent 60%)' }} />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <h2 style={{ fontSize: 'clamp(22px,3.5vw,36px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
                    Find your card&apos;s sweet spot{' '}
                    <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>automatically</span>
                  </h2>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, margin: '0 0 28px', lineHeight: 1.7, maxWidth: 480, marginInline: 'auto' }}>
                    Enter your card and points balance — CreditIQ&apos;s AI ranks every redemption path by actual rupee value.
                  </p>
                  <Link href="/points-optimizer" style={{ display: 'inline-block', background: 'var(--copper-3,#D89B2A)', color: '#fff', padding: '14px 32px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none', letterSpacing: '-0.01em' }}>
                    Optimise My Points →
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

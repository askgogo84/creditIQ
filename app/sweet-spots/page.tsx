import Link from 'next/link';
import { Header } from '@/components/Header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Credit Card Redemption Sweet Spots India 2026 | CreditIQ',
  description: 'The 8 best credit card redemption sweet spots for Indian cardholders — HDFC Infinia, Axis Magnus, Amex, and more. Verified valuations, step-by-step how-to.',
};

const SWEET_SPOTS = [
  {
    id: 'krisflyer-del-sin',
    tag: 'Best Overall',
    tagColor: '#C9972E',
    headline: 'HDFC Infinia → KrisFlyer → DEL-SIN Business Class',
    subhead: '45,000 points. Worth ₹85,000+. The benchmark.',
    math: {
      points: '45,000 HDFC Reward Points',
      cashValue: '₹9,000 (catalogue)',
      redeemValue: '₹85,000+ (SQ J class)',
      multiplier: '9.4x better than catalogue',
    },
    why: 'Singapore Airlines business class between Delhi and Singapore is one of the most consistent award sweet spots in Asia. The 1:1 transfer ratio from HDFC Infinia to KrisFlyer makes the maths simple — and the lie-flat seat, book-the-cook dining, and Changi layover make the experience unforgettable.',
    steps: [
      'Log into HDFC NetBanking → Credit Cards → Redeem Reward Points → Airline Transfer',
      'Select Singapore Airlines KrisFlyer and enter your KrisFlyer number',
      'Transfer at least 45,000 points (1:1 ratio, takes 24–48 hours to credit)',
      'Search krisflyer.com for BOM/DEL/BLR → SIN business class saver awards',
      'Check "KrisFlyer Spontaneous Escapes" — monthly flash sales cut requirements by 30–50%',
      'Book and pay ~₹3,500 in taxes only',
    ],
    cardSlug: 'hdfc-infinia',
    cardName: 'HDFC Infinia',
    tip: 'Transfer only when you have confirmed award space — miles take 24–48hrs to post and seats can disappear.',
  },
  {
    id: 'turkish-del-ist',
    tag: 'Highest Value',
    tagColor: '#e11d48',
    headline: 'HDFC/Axis → Turkish Miles&Smiles → DEL-IST Business Class',
    subhead: '60,000 miles round-trip. Value: ₹1.07/point.',
    math: {
      points: '60,000 Miles&Smiles miles',
      cashValue: '₹64,000+ (Turkish J class)',
      redeemValue: '₹64,000+ ticket for ~₹7,400 in taxes',
      multiplier: '₹1.07 per point — top 5% in India',
    },
    why: 'Turkish Airlines uses a fixed zone-based award chart — no dynamic pricing. That means DEL to Istanbul in business class costs 30,000 miles each way (60,000 round-trip) regardless of whether you\'re flying peak season or not. Istanbul also makes a perfect stopover on the way to Europe.',
    steps: [
      'Open a Miles&Smiles account at turkishairlines.com (use the mobile app — web signup has bugs)',
      'Transfer from HDFC Infinia (1:1) or Axis Magnus EDGE Miles (1.33:1) via your bank portal',
      'Search turkishairlines.com for award availability — use the Star Alliance search for partner flights',
      'DEL-IST on Turkish metal: 30,000 miles J one-way, 60,000 round-trip',
      'Call Turkish (+90 212 444 0849) to book Star Alliance partner awards — cannot be done online',
      'Pay taxes (~₹7,400 round-trip) — Turkish does not add fuel surcharges on most partner bookings',
    ],
    cardSlug: 'hdfc-infinia',
    cardName: 'HDFC Infinia / Axis Magnus',
    tip: 'Turkish Miles&Smiles went through a December 2025 devaluation — but the India-to-Europe zone is still excellent value.',
  },
  {
    id: 'smartbuy-gyftr',
    tag: 'No-Brainer',
    tagColor: '#10b981',
    headline: 'HDFC SmartBuy Gyftr Vouchers — 16% Return, Zero Effort',
    subhead: 'No airline. No transfer. Just 16% back on everyday brands.',
    math: {
      points: '1,000 HDFC Reward Points',
      cashValue: '₹200 (catalogue rate)',
      redeemValue: '₹320 in brand vouchers (Gyftr)',
      multiplier: '60% better than the product catalogue',
    },
    why: 'Not everyone wants to book business class. If you spend 50–70% of your points on flights and the rest on lifestyle, Gyftr on SmartBuy is the answer. Brands like Amazon, Flipkart, Myntra, Nykaa, Swiggy, and Zomato are available. At ₹0.32/point, it\'s 60% better than the standard catalogue.',
    steps: [
      'Go to smartbuy.hdfcbank.com and log in with your HDFC NetBanking credentials',
      'Click "Gift Cards" → browse Gyftr brand partners',
      'Select the brand (Amazon, Flipkart, Swiggy, etc.) and denomination',
      'Pay entirely with Reward Points — no cash top-up needed',
      'Gift card code delivered to your registered email within minutes',
    ],
    cardSlug: 'hdfc-regalia-gold',
    cardName: 'HDFC Infinia / Diners Black / Regalia Gold',
    tip: 'SmartBuy also gives 5X accelerated points when you shop there — stack this to earn and redeem on the same platform.',
  },
  {
    id: 'amex-marriott-airindia',
    tag: 'Points Multiplier',
    tagColor: '#6366f1',
    headline: 'Amex MR → Marriott Bonvoy → Air India (The 3:1 Trick)',
    subhead: '3 Amex points become 1 Marriott point + 25% bonus on transfers.',
    math: {
      points: '30,000 Amex MR → 10,000 Marriott → 3,333 Air India miles',
      cashValue: '₹9,000 (catalogue rate)',
      redeemValue: 'Complex but unlocks Air India domestic awards',
      multiplier: 'Best when Marriott runs 30% transfer bonus',
    },
    why: 'Amex Membership Rewards transfers to Marriott Bonvoy at 3:1. Marriott then transfers to 40+ airline partners at 3:1 with a 25% bonus (so 60,000 Marriott = 25,000 airline miles). For Air India, this is the only indirect way to top up your Flying Returns balance using a non-HDFC card.',
    steps: [
      'Earn Amex MR points on Amex Platinum Travel or MRCC',
      'Transfer to Marriott Bonvoy (3 MR = 1 Marriott point, allow 1–3 business days)',
      'In Marriott account, go to Points → Transfer to Airlines',
      'Select Air India Flying Returns — minimum 10,000 Marriott points per transfer',
      'Receive 3,333 + 25% bonus = ~4,166 Air India miles per 10,000 Marriott points',
      'Watch for Marriott\'s 30% transfer bonus promotions (run 2–3x/year)',
    ],
    cardSlug: 'amex-platinum-travel',
    cardName: 'Amex Platinum Travel / MRCC',
    tip: 'Wait for a Marriott transfer bonus before converting — 30% bonus turns this from a mediocre rate to a good one.',
  },
  {
    id: 'axis-magnus-bulge',
    tag: 'Earning Hack',
    tagColor: '#0ea5e9',
    headline: 'Axis Magnus 12X on Travel Bookings — Stack It With EDGE Miles',
    subhead: '12 EDGE Miles per ₹100 on flights and hotels. ₹2/mile redemption.',
    math: {
      points: '12 EDGE Miles per ₹100 spend on Yatra/MakeMyTrip',
      cashValue: '₹2 per EDGE Mile at partner airlines',
      redeemValue: 'Effective 24% return rate on travel spend',
      multiplier: '8–10x better than base credit card cashback',
    },
    why: 'Axis Magnus gives 12 EDGE Miles per ₹100 on travel aggregators. Each EDGE Mile is worth ₹2 when transferred to partner airlines like Singapore KrisFlyer or Turkish Miles&Smiles. That\'s an effective 24% return on every flight or hotel you book — one of the highest earn rates on any Indian credit card.',
    steps: [
      'Get the Axis Magnus card (₹10,000 fee — waived on ₹15L annual spend)',
      'Book all flights and hotels via Yatra, MakeMyTrip, or EaseMyTrip with the Magnus',
      'Earn 12 EDGE Miles per ₹100 (vs 3.5 EDGE Miles on regular spends)',
      'Transfer EDGE Miles to Singapore KrisFlyer at 1.33 Magnus EDGE Miles = 1 KrisFlyer mile',
      'Or transfer to Turkish Miles&Smiles for the DEL-IST sweet spot above',
      'Use EDGE Miles portal for straightforward flight redemptions at ₹2/mile if you prefer',
    ],
    cardSlug: 'axis-magnus',
    cardName: 'Axis Magnus',
    tip: 'Axis removed Accor, Qatar, and Marriott as partners in April 2026. The remaining partners — KrisFlyer, Turkish, Air France KLM — are the strongest ones anyway.',
  },
  {
    id: 'sbi-cashback-5pc',
    tag: 'Simplest',
    tagColor: '#64748b',
    headline: 'SBI Cashback Card — 5% Back Online, No Merchant Restrictions',
    subhead: '₹0 in thinking required. Just spend and get 5% back.',
    math: {
      points: 'No points — direct cashback',
      cashValue: '5% on all online spends, 1% offline',
      redeemValue: 'Auto-credited to statement monthly',
      multiplier: 'Beats most "premium" cards for online-heavy spenders',
    },
    why: 'Most Indian credit card users spend the majority online — Swiggy, Amazon, Nykaa, OTT subscriptions, utility bills. The SBI Cashback card gives 5% back on all online spends with no merchant exclusions and no category caps. For someone spending ₹50,000/month online, that\'s ₹30,000/year — credited automatically.',
    steps: [
      'Apply for SBI Cashback card (₹999 annual fee, waived on ₹2L annual spend)',
      'Use it for all online spends — Amazon, Flipkart, Swiggy, Zomato, Nykaa, OTT',
      'Cashback is credited as statement credit every billing cycle',
      'No activation, no portal login, no transfer — it just works',
    ],
    cardSlug: 'sbi-cashback',
    cardName: 'SBI Cashback',
    tip: 'Combine with a premium card (HDFC Infinia or Axis Magnus) for offline/travel — let SBI handle the online volume.',
  },
  {
    id: 'zero-fee-trio',
    tag: 'Zero-Fee Stack',
    tagColor: '#1B3A5C',
    headline: 'The ₹0 Fee Portfolio — 3 Cards, 3–5% Return, No Annual Fee',
    subhead: 'BoB Eterna + Amazon Pay ICICI + Scapia. Beats most fee cards.',
    math: {
      points: 'No annual fee on all 3',
      cashValue: '3–5% blended return across categories',
      redeemValue: 'Monthly cashback auto-credited — ₹18,000–₹30,000/year on ₹50K spend',
      multiplier: 'Better net return than many ₹5,000+ fee cards',
    },
    why: 'Paying ₹5,000–₹12,500 in annual fees for a premium card only makes sense if you\'re earning significantly more back. For most Indians spending ₹40,000–₹60,000/month, this trio of zero-fee cards outperforms after accounting for fee drag. It\'s not exciting — it\'s just better maths.',
    steps: [
      'BoB Eterna: Get it via Bank of Baroda for 3.75% return on all spends via reward points',
      'Amazon Pay ICICI: 5% on Amazon, 2% on other online merchants, 1% offline — lifetime free',
      'Scapia: Zero forex markup, lifetime free — use abroad and at international merchants',
      'Divide your spends: Amazon → ICICI, travel abroad → Scapia, everything else → BoB Eterna',
      'No annual fee means every rupee of reward is genuine profit',
    ],
    cardSlug: 'amazon-pay-icici',
    cardName: 'BoB Eterna + Amazon Pay ICICI + Scapia',
    tip: 'This portfolio works best for spenders under ₹6L/year. Above that, the premium cards justify their fees.',
  },
  {
    id: 'krisflyer-spontaneous',
    tag: 'Time-Sensitive',
    tagColor: '#f59e0b',
    headline: 'KrisFlyer Spontaneous Escapes — 30–50% Off Award Flights Monthly',
    subhead: 'Flash sales every Thursday. Real discounts on real seats.',
    math: {
      points: 'DEL-SIN normally 45,000 KrisFlyer → on Spontaneous Escapes: 30,000–35,000',
      cashValue: 'Save 10,000–15,000 miles per booking',
      redeemValue: '₹20,000–₹30,000 of additional value per redemption',
      multiplier: 'Best deal in Indian miles — if you can plan 2–6 weeks ahead',
    },
    why: 'Singapore Airlines releases unsold premium cabin inventory every Thursday in a program called Spontaneous Escapes. Departures are 1–6 weeks out. Discounts run 30–50% off standard Saver award rates. For flexible travellers with HDFC Infinia or Axis Magnus, this is consistently the best value in Indian miles redemption.',
    steps: [
      'Follow @KrisFlyer on Instagram or sign up for email alerts at singaporeair.com/en_IN/destinations/spontaneous-escapes/',
      'Check the list every Thursday morning — new flights go live weekly',
      'You need KrisFlyer miles already in your account — transfers take 24–48hrs so plan ahead',
      'Book directly on singaporeair.com — Spontaneous Escapes show up in the standard award search',
      'Pay taxes (~₹3,500 for BLR-SIN) and get your boarding pass',
    ],
    cardSlug: 'hdfc-infinia',
    cardName: 'HDFC Infinia / Axis Magnus',
    tip: 'Keep at least 40,000 KrisFlyer miles "parked" and ready — Spontaneous Escapes disappear in hours.',
  },
];

const BLOG_TEASER_ARTICLES = [
  {
    slug: 'hdfc-infinia-review-2026',
    tag: 'Card Review',
    tagColor: '#1B3A5C',
    title: 'HDFC Infinia Review 2026 — Is the ₹12,500 Fee Still Worth It?',
    excerpt: 'After four devaluations in 18 months, we ran the actual numbers. Here\'s who should keep Infinia, who should downgrade, and the one use case where it\'s irreplaceable.',
    readTime: '8 min read',
  },
  {
    slug: 'axis-magnus-vs-hdfc-infinia',
    tag: 'Comparison',
    tagColor: '#e11d48',
    title: 'Axis Magnus Burgundy vs HDFC Infinia — The Honest Comparison',
    excerpt: 'Both cost over ₹10,000 a year. Both earn airline miles. But they\'re for completely different spenders. We break down exactly who should pick which.',
    readTime: '6 min read',
  },
  {
    slug: 'zero-fee-portfolio-beats-premium',
    tag: 'Strategy',
    tagColor: '#10b981',
    title: 'The ₹0 Credit Card Portfolio That Outperforms Magnus',
    excerpt: 'Three lifetime-free cards, combined intelligently, can beat a ₹10,000-fee premium card for most Indian spenders. Here\'s the maths.',
    readTime: '5 min read',
  },
];

export default function SweetSpotsPage() {
  return (
    <div style={{ backgroundColor: '#faf9f6', minHeight: '100vh' }}>
      <Header />
      <main style={{ maxWidth: 900, marginInline: 'auto', padding: 'clamp(100px,14vw,140px) clamp(16px,4vw,32px) 80px' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{
            display: 'inline-block', backgroundColor: '#1B3A5C', color: '#C9972E',
            fontSize: 11, fontWeight: 700, letterSpacing: 1.8, padding: '5px 18px',
            borderRadius: 100, marginBottom: 24, textTransform: 'uppercase',
          }}>
            Original Research &bull; Updated May 2026
          </span>
          <h1 style={{
            fontSize: 'clamp(28px,5vw,44px)', fontWeight: 800, color: '#1B3A5C',
            lineHeight: 1.15, letterSpacing: '-0.5px', margin: '0 0 16px',
          }}>
            The 8 Best Redemption<br />Sweet Spots in India
          </h1>
          <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: '#64748b', maxWidth: 520, marginInline: 'auto', lineHeight: 1.75 }}>
            Where your credit card points actually go the furthest — with real numbers,
            real steps, and zero fluff. All original research, no affiliate push.
          </p>
        </div>

        {/* Sweet Spots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {SWEET_SPOTS.map((spot, idx) => (
            <article key={spot.id} style={{
              backgroundColor: '#fff',
              borderRadius: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}>
              {/* Header bar */}
              <div style={{
                backgroundColor: '#1B3A5C',
                padding: '16px 28px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    backgroundColor: spot.tagColor, color: '#fff',
                    fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase',
                    padding: '3px 10px', borderRadius: 100,
                  }}>{spot.tag}</span>
                  <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 500 }}>#{idx + 1}</span>
                </div>
                <Link
                  href={`/cards/${spot.cardSlug}`}
                  style={{ color: '#C9972E', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}
                >
                  {spot.cardName} &rarr;
                </Link>
              </div>

              <div style={{ padding: 28 }}>
                {/* Title */}
                <h2 style={{ fontSize: 'clamp(17px,2.5vw,22px)', fontWeight: 800, color: '#1B3A5C', margin: '0 0 6px', lineHeight: 1.3 }}>
                  {spot.headline}
                </h2>
                <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 20px', fontStyle: 'italic' }}>
                  {spot.subhead}
                </p>

                {/* Math box */}
                <div style={{
                  backgroundColor: '#f8fafc', borderRadius: 12, padding: '16px 20px',
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 24px',
                  marginBottom: 20, border: '1px solid #f1f5f9',
                }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Points Used</p>
                    <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{spot.math.points}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Catalogue Value</p>
                    <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 700, color: '#dc2626' }}>{spot.math.cashValue}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Redemption Value</p>
                    <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 700, color: '#10b981' }}>{spot.math.redeemValue}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 }}>Advantage</p>
                    <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 800, color: '#C9972E' }}>{spot.math.multiplier}</p>
                  </div>
                </div>

                {/* Why */}
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.75, margin: '0 0 20px' }}>{spot.why}</p>

                {/* Steps */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>
                    How to do it
                  </p>
                  <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {spot.steps.map((step, i) => (
                      <li key={i} style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{step}</li>
                    ))}
                  </ol>
                </div>

                {/* Tip */}
                <div style={{
                  backgroundColor: '#fffbeb', border: '1px solid #fde68a',
                  borderRadius: 10, padding: '10px 14px',
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>Pro tip:</span>
                  <p style={{ margin: 0, fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>{spot.tip}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Blog teaser */}
        <div style={{ marginTop: 80 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: '#1B3A5C', margin: 0 }}>
              From the Blog
            </h2>
            <Link href="/blog" style={{ color: '#C9972E', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              All articles &rarr;
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
            {BLOG_TEASER_ARTICLES.map(article => (
              <Link key={article.slug} href={`/blog/${article.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  backgroundColor: '#fff', borderRadius: 16, padding: 24,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  transition: 'box-shadow 0.2s',
                  height: '100%', boxSizing: 'border-box',
                }}>
                  <span style={{
                    display: 'inline-block',
                    backgroundColor: article.tagColor, color: '#fff',
                    fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                    padding: '3px 10px', borderRadius: 100, marginBottom: 12,
                  }}>{article.tag}</span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B3A5C', margin: '0 0 8px', lineHeight: 1.4 }}>
                    {article.title}
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px', lineHeight: 1.6 }}>
                    {article.excerpt}
                  </p>
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>{article.readTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          marginTop: 64, backgroundColor: '#1B3A5C', borderRadius: 20,
          padding: 'clamp(28px,4vw,48px)', textAlign: 'center',
        }}>
          <h2 style={{ fontSize: 'clamp(20px,3vw,28px)', fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
            Find your card&apos;s sweet spot automatically
          </h2>
          <p style={{ color: '#94a3b8', fontSize: 15, margin: '0 0 24px', lineHeight: 1.7 }}>
            Enter your card and points balance — CreditIQ&apos;s AI ranks every redemption path by actual rupee value.
          </p>
          <Link
            href="/points-optimizer"
            style={{
              display: 'inline-block', backgroundColor: '#C9972E', color: '#fff',
              padding: '14px 32px', borderRadius: 12, fontWeight: 700, fontSize: 15,
              textDecoration: 'none',
            }}
          >
            Optimise My Points &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}

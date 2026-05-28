import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import type { Metadata } from 'next';

// ── Article content ──────────────────────────────────────────────────────────

const ARTICLES: Record<string, {
  title: string;
  tag: string;
  tagColor: string;
  date: string;
  readTime: string;
  intro: string;
  sections: { heading: string; body: string }[];
  verdict?: string;
  relatedCard?: string;
  relatedCardSlug?: string;
  relatedSweetSpot?: string;
}> = {

  'hdfc-infinia-review-2026': {
    title: 'HDFC Infinia Review 2026 — Is the ₹12,500 Fee Still Worth It?',
    tag: 'Card Review',
    tagColor: '#1B3A5C',
    date: 'May 25, 2026',
    readTime: '8 min read',
    intro: 'HDFC Infinia is India\'s most talked-about premium credit card. It\'s also been devalued four times in 18 months. In this review, we cut through the hype and show you exactly when the ₹12,500 annual fee makes sense — and when it doesn\'t.',
    sections: [
      {
        heading: 'What you actually get for ₹12,500',
        body: 'Infinia earns 5 reward points per ₹150 spent (3.33 pts/₹100). Each point is worth ₹0.50 in the product catalogue, or ₹1.00 when redeemed via SmartBuy for flights and hotels, or up to ₹2.00+ when transferred to airline partners like Singapore KrisFlyer at a 1:1 ratio.\n\nIn addition: unlimited domestic and international airport lounge access (Priority Pass), ₹10,000 welcome benefit, 10X points on SmartBuy, golf privileges at 200+ courses, and a concierge. The card is metal, invite-only, and has no earning cap.',
      },
      {
        heading: 'The four devaluations — what actually changed',
        body: 'Between mid-2024 and early 2026, HDFC made the following changes:\n\n1. SmartBuy 10X categories reduced — utility payments no longer earn 10X.\n2. Gyftr vouchers capped at 50,000 points per month.\n3. Lounge guest policy tightened — self-access remains unlimited, but paid guest access now costs ₹2,000/visit.\n4. Fuel surcharge waiver reduced from 1% to 0.5%.\n\nNone of these changes are catastrophic. Infinia\'s core value — the 1:1 airline transfer ratio and SmartBuy 10X on flights — remains intact. The devaluations hurt casual users more than power users.',
      },
      {
        heading: 'The maths: who actually profits from Infinia',
        body: 'To break even on the ₹12,500 fee, you need to earn at least ₹12,500 back in rewards. At 3.33 pts/₹100 (base) and ₹0.50/pt, you need ₹75,000 in monthly spend just to cover the fee.\n\nBut with SmartBuy 10X on flights (effectively 6.67 pts/₹100 = ₹3.33 back per ₹100), spending ₹30,000/month on flight bookings via SmartBuy earns ₹12,000/year — almost covering the fee on flights alone.\n\nThe real value unlocks when you transfer to airlines. 45,000 points → KrisFlyer → DEL-SIN Business Class is worth ₹85,000. To accumulate 45,000 points at base rate, you need ₹2.7L in eligible spend — which takes a mid-to-heavy user about 3–4 months.',
      },
      {
        heading: 'Who should keep Infinia',
        body: '1. Anyone spending ₹5L+ per year on the card, especially on travel and dining.\n2. Anyone who flies internationally 2+ times per year and can use airline transfers.\n3. Anyone with Burgundy status at Axis (gets upgrade treatment and easier approval).\n4. People with a genuine need for concierge, golf, or unlimited lounge access.',
      },
      {
        heading: 'Who should consider downgrading',
        body: '1. Spenders under ₹3L/year — the fee eats too much of your reward.\n2. People who never book flights through SmartBuy or transfer to airlines.\n3. Anyone who just wants cashback — SBI Cashback or Axis Ace will give you more for less complexity.\n4. If your spend is mostly groceries and utilities with no travel — Infinia\'s sweet spots won\'t trigger.',
      },
    ],
    verdict: 'Infinia remains India\'s best premium credit card — if you use it right. The airline transfer ecosystem is unmatched. But it\'s a specialised tool, not an all-rounder. If you\'re not using SmartBuy or making at least one airline redemption per year, you\'re overpaying for the brand name.',
    relatedCard: 'HDFC Infinia',
    relatedCardSlug: 'hdfc-infinia',
    relatedSweetSpot: 'krisflyer-del-sin',
  },

  'axis-magnus-vs-hdfc-infinia': {
    title: 'Axis Magnus Burgundy vs HDFC Infinia — The Honest Comparison',
    tag: 'Comparison',
    tagColor: '#e11d48',
    date: 'May 22, 2026',
    readTime: '6 min read',
    intro: 'Both cards cost over ₹10,000 per year. Both earn airline miles. Both are invite-only. But they\'re designed for completely different spending patterns. Here\'s who wins — and the one scenario where Magnus beats Infinia by a wide margin.',
    sections: [
      {
        heading: 'The fundamental difference',
        body: 'HDFC Infinia is a general-purpose premium card. It rewards all spend reasonably well (3.33 pts/₹100) and significantly rewards SmartBuy spend (10X).\n\nAxis Magnus is a travel specialist. Its baseline earn rate (3.5 EDGE Miles/₹100) is similar, but it gives 12 EDGE Miles per ₹100 on travel aggregators like MakeMyTrip, Yatra, and EaseMyTrip. Each EDGE Mile is worth ₹2 when transferred to airline partners. That\'s an effective 24% return on travel spend — the highest earn rate on any Indian credit card.',
      },
      {
        heading: 'Fee comparison',
        body: 'HDFC Infinia: ₹12,500 + GST, waived on ₹10L annual spend.\nAxis Magnus Burgundy: ₹10,000 + GST, waived on ₹15L annual spend.\n\nThe fee waiver threshold for Magnus is higher — so it\'s effectively a more expensive card unless you spend ₹15L+ per year.',
      },
      {
        heading: 'Transfer partners: what changed in April 2026',
        body: 'Axis removed Accor, Qatar Airways, and Marriott Bonvoy from its transfer partner list in April 2026. This was a significant devaluation for users who valued those programmes.\n\nHDFC\'s transfer partner list remains largely intact. For most Indian users, the key partners are Singapore KrisFlyer (1:1 from Infinia/Diners) and Turkish Miles&Smiles (both cards, 1:1).\n\nAxis Magnus remaining partners: Singapore KrisFlyer (1.33 EDGE Miles = 1 KrisFlyer mile), Turkish Miles&Smiles, Air France KLM Flying Blue, Air India, and InterMiles. The KrisFlyer ratio is less attractive on Magnus vs Infinia.',
      },
      {
        heading: 'When Magnus wins',
        body: 'Magnus wins clearly when your primary spend is on booking flights and hotels through OTAs. At 12 EDGE Miles/₹100 and ₹2/mile redemption, you\'re getting ₹24 back per ₹100 — or 24%. No other mainstream Indian card comes close for travel-heavy spenders.\n\nIf you spend ₹2L/month on travel via OTAs, Magnus earns you ₹5.76L in annual rewards — vastly outperforming Infinia for that specific spend pattern.',
      },
      {
        heading: 'When Infinia wins',
        body: 'Infinia wins when your spend is diversified — dining, shopping, utilities, entertainment — and you\'re not spending primarily on OTAs. Its SmartBuy 10X for flight redemptions (vs just booking via OTA) is also better structured for infrequent travellers who prefer to redeem rather than earn travel points.\n\nInfonia\'s 1:1 KrisFlyer ratio also beats Magnus\'s 1.33:1 ratio — so if you\'re transferring to KrisFlyer specifically, Infinia gives you more miles per point.',
      },
    ],
    verdict: 'Magnus for heavy OTA travel bookers. Infinia for everyone else. If you book ₹2L+/month in flights and hotels through MakeMyTrip or Yatra, Magnus wins decisively. For anything else, Infinia\'s broader reward structure and better transfer ratio to KrisFlyer keeps it ahead.',
    relatedCard: 'Axis Magnus',
    relatedCardSlug: 'axis-magnus',
    relatedSweetSpot: 'axis-magnus-bulge',
  },

  'zero-fee-portfolio-beats-premium': {
    title: 'The ₹0 Credit Card Portfolio That Outperforms Magnus',
    tag: 'Strategy',
    tagColor: '#10b981',
    date: 'May 18, 2026',
    readTime: '5 min read',
    intro: 'The credit card industry wants you to believe that paying ₹10,000+ in annual fees is the price of good rewards. The data says otherwise — at least for most Indian spenders. Here\'s the portfolio that proves it.',
    sections: [
      {
        heading: 'The three cards',
        body: 'Card 1 — Amazon Pay ICICI (Lifetime Free)\n5% cashback on Amazon, 2% on other partner merchants (Swiggy, BookMyShow, Uber, etc), 1% on everything else. Cashback credited to Amazon Pay balance every month, no activation needed.\n\nCard 2 — BoB Eterna (Lifetime Free if applied via Bank of Baroda)\n3.75% effective return on all spends via reward points. Points redeemable for travel, vouchers, and statement credit. High base earn rate with no category restrictions.\n\nCard 3 — Scapia (Lifetime Free)\nZero forex markup on all international transactions. Points on every foreign currency spend. No annual fee. The perfect card for international travel, foreign subscriptions (Netflix US, Apple, Spotify), and USD payments.',
      },
      {
        heading: 'How to divide your spend',
        body: 'Amazon and partner merchants → Amazon Pay ICICI (5% back)\nAll other domestic spends → BoB Eterna (3.75% back)\nAll foreign currency spends → Scapia (zero forex + rewards)\n\nFor a person spending ₹50,000/month:\n- ₹15,000 on Amazon/partners = ₹750 cashback\n- ₹30,000 on other domestic = ₹1,125 cashback\n- ₹5,000 in USD = ₹250 in savings (on forex alone)\n- Total per month: ₹2,125\n- Annual: ₹25,500 in rewards, ₹0 in fees\n- Net value: ₹25,500',
      },
      {
        heading: 'How does Axis Magnus compare at the same spend?',
        body: 'Axis Magnus at ₹50,000/month (none on OTAs):\n- Base earn: 3.5 EDGE Miles/₹100 = 1,750 EDGE Miles/month\n- At ₹2/mile: ₹3,500/month = ₹42,000/year\n- Annual fee: ₹10,000 + GST (₹11,800)\n- Net value: ₹30,200\n\nMagnus wins — but by only ₹4,700/year. For a card that\'s invite-only and requires ₹15L spend for fee waiver, that margin shrinks further when you factor in the hassle, credit inquiry, and opportunity cost.',
      },
      {
        heading: 'Where the zero-fee portfolio wins',
        body: 'Below ₹50,000/month in spend: the zero-fee portfolio wins outright, because the fee drag on Magnus represents a higher percentage of total rewards.\n\nFor spends below ₹3L/year: the zero-fee portfolio wins by ₹8,000–₹15,000/year net.\n\nFor completely online spenders (Amazon, Swiggy, subscriptions): Amazon Pay ICICI alone gives 5% back — better than any premium card\'s online spend category.',
      },
      {
        heading: 'The honest caveat',
        body: 'This portfolio has no airport lounge access, no concierge, and no airline transfer programme. If you fly business class using transferred miles, the zero-fee portfolio cannot compete with Infinia or Magnus.\n\nThe right choice depends on what you value: pure financial return (zero-fee wins at lower spend) vs experiences and premium travel (Infinia/Magnus wins at higher spend and travel frequency).',
      },
    ],
    verdict: 'For most Indians spending under ₹6L/year with no international business class ambitions, the zero-fee portfolio delivers more net value. It\'s not sexy — but the maths is honest. Above ₹6L/year and with genuine international travel plans, upgrade to Infinia.',
    relatedCard: 'Amazon Pay ICICI',
    relatedCardSlug: 'amazon-pay-icici',
    relatedSweetSpot: 'zero-fee-trio',
  },
};

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return Object.keys(ARTICLES).map(slug => ({ slug }));
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = ARTICLES[params.slug];
  if (!article) return { title: 'Article Not Found | CreditIQ' };
  return {
    title: `${article.title} | CreditIQ`,
    description: article.intro.substring(0, 160),
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const article = ARTICLES[params.slug];
  if (!article) notFound();

  return (
    <div style={{ backgroundColor: '#faf9f6', minHeight: '100vh' }}>
      <Header />
      <main style={{ maxWidth: 720, marginInline: 'auto', padding: 'clamp(100px,14vw,140px) clamp(16px,4vw,24px) 80px' }}>

        {/* Back */}
        <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 32 }}>
          &larr; All articles
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <span style={{
              backgroundColor: article.tagColor, color: '#fff',
              fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase',
              padding: '4px 12px', borderRadius: 100,
            }}>{article.tag}</span>
            <span style={{ color: '#94a3b8', fontSize: 12 }}>{article.date} &bull; {article.readTime}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(22px,4vw,34px)', fontWeight: 800, color: '#1B3A5C', margin: '0 0 20px', lineHeight: 1.25 }}>
            {article.title}
          </h1>
          <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.8, margin: 0, borderLeft: '3px solid #C9972E', paddingLeft: 16 }}>
            {article.intro}
          </p>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {article.sections.map((section, idx) => (
            <section key={idx}>
              <h2 style={{ fontSize: 'clamp(17px,2.5vw,21px)', fontWeight: 700, color: '#1B3A5C', margin: '0 0 12px' }}>
                {section.heading}
              </h2>
              <div style={{ fontSize: 15, color: '#334155', lineHeight: 1.85 }}>
                {section.body.split('\n\n').map((para, i) => (
                  <p key={i} style={{ margin: i > 0 ? '14px 0 0' : 0 }}>
                    {para.split('\n').map((line, j) => (
                      <span key={j}>{line}{j < para.split('\n').length - 1 && <br />}</span>
                    ))}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Verdict */}
        {article.verdict && (
          <div style={{
            marginTop: 40, backgroundColor: '#1B3A5C', borderRadius: 16, padding: '20px 24px',
          }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase', letterSpacing: 1.2 }}>
              CreditIQ Verdict
            </p>
            <p style={{ margin: 0, fontSize: 15, color: '#e2e8f0', lineHeight: 1.75 }}>{article.verdict}</p>
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: 48, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {article.relatedCardSlug && (
            <Link
              href={`/cards/${article.relatedCardSlug}`}
              style={{
                display: 'inline-block', backgroundColor: '#C9972E', color: '#fff',
                padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14,
                textDecoration: 'none',
              }}
            >
              View {article.relatedCard} &rarr;
            </Link>
          )}
          <Link
            href="/sweet-spots"
            style={{
              display: 'inline-block', backgroundColor: 'transparent',
              border: '2px solid #1B3A5C', color: '#1B3A5C',
              padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14,
              textDecoration: 'none',
            }}
          >
            View all Sweet Spots
          </Link>
        </div>

        {/* Related articles */}
        <div style={{ marginTop: 56 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1B3A5C', margin: '0 0 16px' }}>More from the blog</h3>
          <Link href="/blog" style={{
            display: 'block', backgroundColor: '#fff', borderRadius: 12, padding: 20,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textDecoration: 'none',
          }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1B3A5C' }}>View all articles &rarr;</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>Card reviews, comparisons, and earning strategies</p>
          </Link>
        </div>
      </main>
    </div>
  );
}

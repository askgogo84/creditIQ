import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { SEED_CARDS } from '@/lib/data/seed-cards';
import { Header } from '@/components/Header';
import { getApplyUrl } from '@/lib/affiliate';

interface Props {
  params: { category: string };
}

const CATEGORY_CONFIG: Record<string, {
  title: string;
  h1: string;
  description: string;
  metaDesc: string;
  keywords: string;
  filter: (card: any) => boolean;
  sortBy: (a: any, b: any) => number;
  insight: string;
  faqs: { q: string; a: string }[];
}> = {
  travel: {
    title: 'Best Travel Credit Cards in India 2026 -- Ranked by Value | CreditIQ',
    h1: 'Best Travel Credit Cards in India 2026',
    description: 'Ranked by actual travel value -- lounge access, air miles, forex markup, hotel points. No affiliate bias.',
    metaDesc: 'Best travel credit cards India 2026. Compare HDFC Infinia, Axis Magnus, Amex Platinum Travel -- ranked by real travel value, not commission. Unbiased analysis.',
    keywords: 'best travel credit card India 2026, travel credit card India, airport lounge credit card India, air miles credit card India, HDFC Infinia, Axis Magnus',
    filter: (c) => Array.isArray(c.category) ? c.category.includes('travel') : c.category === 'travel',
    sortBy: (a, b) => (b.annual_fee_inr ?? 0) - (a.annual_fee_inr ?? 0),
    insight: 'The best travel cards in India give 4-6x value when you transfer points to airline partners like Singapore KrisFlyer or Vistara. Never redeem points for cashback -- you lose 60-70% of their value.',
    faqs: [
      { q: 'Which is the best travel credit card in India in 2026?', a: 'HDFC Infinia Metal and Axis Magnus are the top travel credit cards in India for 2026. Both offer unlimited airport lounge access, 1:1 airline mile transfers, and reward rates of 3-5% on travel spends. For frequent international travelers, Amex Platinum Travel is also excellent.' },
      { q: 'Which credit card is best for international travel in India?', a: 'For international travel, HDFC Infinia (2% forex markup), Axis Magnus (2% forex markup), and Scapia (zero forex markup) are the best options. Most Indian credit cards charge 3.5% forex markup which negates all rewards earned abroad.' },
      { q: 'Do travel credit cards give free airport lounge access in India?', a: 'Yes, premium travel cards like HDFC Infinia, Axis Magnus, and SBI Elite offer free airport lounge access via Priority Pass. However, most cards now require minimum quarterly spend (typically Rs.1 lakh) to qualify for lounge access.' },
    ],
  },
  cashback: {
    title: 'Best Cashback Credit Cards in India 2026 -- Highest Returns | CreditIQ',
    h1: 'Best Cashback Credit Cards in India 2026',
    description: 'Highest cashback rates with no points complexity. Direct money back on every spend.',
    metaDesc: 'Best cashback credit cards India 2026. SBI Cashback, Axis Ace, HSBC Live+ -- ranked by actual cashback percentage. No reward points complexity. Honest comparison.',
    keywords: 'best cashback credit card India 2026, cashback credit card India, SBI cashback card, Axis Ace credit card, flat cashback credit card',
    filter: (c) => Array.isArray(c.category) ? c.category.includes('cashback') : c.category === 'cashback',
    sortBy: (a, b) => (b.base_reward_rate ?? 0) - (a.base_reward_rate ?? 0),
    insight: 'Cashback cards are ideal if you hate tracking reward points. SBI Cashback gives 5% on all online spends -- the simplest and most valuable cashback card in India for everyday users.',
    faqs: [
      { q: 'Which cashback credit card gives the highest cashback in India?', a: 'SBI Cashback card gives 5% cashback on all online spends (up to Rs.40,000/month), making it the highest cashback credit card in India for online shopping. Axis Ace gives unlimited 2% cashback on all spends via Google Pay.' },
      { q: 'Is cashback or reward points better on credit cards?', a: 'Cashback is better for most users because it is simple, instant, and guaranteed. Reward points require tracking, have expiry dates, and often give lower value unless redeemed for flights or hotels. If you travel frequently, reward points can give 3-5x better value.' },
      { q: 'What is the best free cashback credit card in India?', a: 'Amazon Pay ICICI is the best lifetime free cashback card -- 5% cashback on Amazon for Prime members, 3% for non-Prime, and 1-2% everywhere else with no annual fee.' },
    ],
  },
  dining: {
    title: 'Best Dining Credit Cards in India 2026 -- Maximum Food Rewards | CreditIQ',
    h1: 'Best Credit Cards for Dining in India 2026',
    description: 'Maximum rewards on restaurants, Swiggy, Zomato and food delivery. Compared honestly.',
    metaDesc: 'Best dining credit cards India 2026. Maximum rewards on restaurants, Swiggy and Zomato. Honest comparison of HDFC, Axis, Amex dining cards with real reward rates.',
    keywords: 'best dining credit card India, credit card for restaurants India, Swiggy Zomato credit card rewards, food credit card India 2026',
    filter: (c) => Array.isArray(c.category) ? c.category.includes('dining') : c.category === 'dining',
    sortBy: (a, b) => (b.base_reward_rate ?? 0) - (a.base_reward_rate ?? 0),
    insight: 'Dining rewards have been devalued by most banks. The best strategy in 2026 is using a card with high base rewards for restaurants rather than a card that promises "5X on dining" with low base value.',
    faqs: [
      { q: 'Which credit card gives the most rewards on dining in India?', a: 'Axis Magnus gives 10X rewards at partner restaurants (worth ~6% return), and the HDFC Infinia gives 5X on SmartBuy dining partners. For everyday restaurants, Amex MRCC gives 4X on the first Rs.50,000 of monthly spends.' },
      { q: 'Which credit card is best for Swiggy and Zomato?', a: 'HDFC Swiggy card gives 10% cashback directly on Swiggy. Axis Ace gives 5% on Swiggy/Zomato via Google Pay. HDFC Millenia gives 5% on all food delivery apps.' },
    ],
  },
  'no-fee': {
    title: 'Best Lifetime Free Credit Cards in India 2026 -- Zero Annual Fee | CreditIQ',
    h1: 'Best Lifetime Free Credit Cards in India 2026',
    description: 'Zero annual fee forever -- no waiver conditions. Best free credit cards with real benefits.',
    metaDesc: 'Best lifetime free credit cards India 2026. Zero annual fee, no waiver conditions. Amazon Pay ICICI, IDFC First, Axis Ace -- honest comparison of free credit cards India.',
    keywords: 'lifetime free credit card India 2026, zero annual fee credit card India, free credit card India, no annual fee credit card India',
    filter: (c) => (c as any).annual_fee_inr === 0,
    sortBy: (a, b) => (b.base_reward_rate ?? 0) - (a.base_reward_rate ?? 0),
    insight: 'Lifetime free cards are ideal for beginners and backup cards. The best ones -- Amazon Pay ICICI and IDFC First -- give surprisingly good rewards with zero ongoing cost.',
    faqs: [
      { q: 'Which is the best lifetime free credit card in India?', a: 'Amazon Pay ICICI is the best lifetime free credit card for online shoppers (5% cashback on Amazon). IDFC First is excellent for everyday use with 10X rewards on weekend dining. Axis Ace offers unlimited 2% cashback on all spends.' },
      { q: 'Are lifetime free credit cards really free?', a: 'Yes, lifetime free credit cards have zero joining fee and zero annual fee for life -- no conditions. However, standard charges like interest (if you carry a balance), forex markup, and cash advance fees still apply.' },
    ],
  },
  premium: {
    title: 'Best Premium Credit Cards in India 2026 -- Super Premium Cards Ranked | CreditIQ',
    h1: 'Best Premium Credit Cards in India 2026',
    description: 'Super premium credit cards with unlimited lounge access, concierge, metal cards and highest reward rates.',
    metaDesc: 'Best premium credit cards India 2026. HDFC Infinia, Axis Magnus, Amex Platinum -- ranked by real value delivered. Worth the annual fee analysis included.',
    keywords: 'premium credit card India, super premium credit card India 2026, HDFC Infinia review, Axis Magnus review, metal credit card India',
    filter: (c) => (c as any).tier === 'super-premium' || (c as any).tier === 'premium',
    sortBy: (a, b) => (b.annual_fee_inr ?? 0) - (a.annual_fee_inr ?? 0),
    insight: 'Premium cards are worth it only if you spend Rs.5L+ annually and travel 4+ times a year. At that spend level, the lounge access, concierge and mile transfers easily justify Rs.10,000-15,000 annual fees.',
    faqs: [
      { q: 'Which is the best premium credit card in India?', a: 'HDFC Infinia Metal is India\'s best premium credit card for 2026 -- unlimited Priority Pass lounge access, 3.3% base rewards, 1:1 airline transfers, and complimentary golf. Axis Magnus is the best value premium card at Rs.10,000 annual fee.' },
      { q: 'Is HDFC Infinia or Axis Magnus better?', a: 'HDFC Infinia is better for travelers who value unlimited lounge access and HDFC\'s SmartBuy portal. Axis Magnus is better for those who want higher reward multipliers and more redemption flexibility. Both have Rs.10,000-12,500 annual fees.' },
    ],
  },
  fuel: {
    title: 'Best Fuel Credit Cards in India 2026 -- Maximum Petrol Savings | CreditIQ',
    h1: 'Best Credit Cards for Fuel in India 2026',
    description: 'Maximum savings on petrol and diesel. Fuel surcharge waiver + reward points on fuel spends.',
    metaDesc: 'Best fuel credit cards India 2026. Maximum savings on petrol. BPCL SBI, Indian Oil Axis, HPCL cards -- honest comparison of fuel credit cards with real savings calculation.',
    keywords: 'best fuel credit card India 2026, petrol credit card India, fuel surcharge waiver credit card, BPCL credit card, Indian Oil credit card',
    filter: (c) => Array.isArray(c.category) ? c.category.includes('fuel') : c.category === 'fuel',
    sortBy: (a, b) => (b.base_reward_rate ?? 0) - (a.base_reward_rate ?? 0),
    insight: 'The 1% fuel surcharge waiver on all credit cards saves Rs.100 on every Rs.10,000 fuel purchase. Dedicated fuel cards give an additional 5-7% on fuel -- combining both gives 6-8% effective savings on petrol.',
    faqs: [
      { q: 'Which credit card gives the most savings on petrol in India?', a: 'BPCL SBI Octane gives 7.25% value back on BPCL petrol stations (6.25% reward points + 1% surcharge waiver). Indian Oil Axis gives 20X points on HPCL pumps worth about 4% back. Both are the best dedicated fuel credit cards in India.' },
    ],
  },
  shopping: {
    title: 'Best Shopping Credit Cards in India 2026 -- Online & Offline | CreditIQ',
    h1: 'Best Shopping Credit Cards in India 2026',
    description: 'Maximum rewards on Amazon, Flipkart, Myntra and all online shopping. Compared honestly.',
    metaDesc: 'Best shopping credit cards India 2026. Maximum cashback on Amazon, Flipkart. Amazon Pay ICICI, Flipkart Axis, HDFC Millenia -- real cashback rates compared without bias.',
    keywords: 'best shopping credit card India 2026, Amazon credit card India, Flipkart credit card, online shopping credit card India, HDFC Millenia',
    filter: (c) => Array.isArray(c.category) ? c.category.includes('shopping') : c.category === 'shopping',
    sortBy: (a, b) => (b.base_reward_rate ?? 0) - (a.base_reward_rate ?? 0),
    insight: 'For Amazon purchases, no card beats the Amazon Pay ICICI at 5% for Prime members -- and it is free for life. For Flipkart, the Flipkart Axis at 5% is the clear winner.',
    faqs: [
      { q: 'Which credit card gives the most cashback on Amazon India?', a: 'Amazon Pay ICICI gives 5% cashback on Amazon for Prime members and 3% for non-Prime -- and it is a lifetime free card. This is the highest cashback on Amazon from any Indian credit card.' },
      { q: 'Which is the best credit card for Flipkart?', a: 'Flipkart Axis Bank credit card gives 5% cashback on Flipkart and Myntra, making it the best card for Flipkart purchases. It also gives 4% on preferred partners and 1.5% on all other spends.' },
    ],
  },
  beginners: {
    title: 'Best Credit Cards for Beginners in India 2026 -- First Credit Card Guide | CreditIQ',
    h1: 'Best Credit Cards for Beginners in India 2026',
    description: 'Easy to get approved, low fees, simple rewards. The best first credit cards in India.',
    metaDesc: 'Best credit cards for beginners India 2026. Easy approval, low fees, simple rewards. First credit card guide for students and salaried professionals in India.',
    keywords: 'best credit card for beginners India, first credit card India, credit card for students India, easy approval credit card India 2026',
    filter: (c) => (c as any).tier === 'entry' || (c as any).tier === 'standard' || (c as any).annual_fee_inr <= 500,
    sortBy: (a, b) => (a.annual_fee_inr ?? 0) - (b.annual_fee_inr ?? 0),
    insight: 'Start with a lifetime free card like Amazon Pay ICICI or IDFC First. Use it for 6-12 months, pay the full bill every month, and you will qualify for premium cards with much better rewards.',
    faqs: [
      { q: 'Which is the best first credit card in India for beginners?', a: 'Amazon Pay ICICI or IDFC First are the best first credit cards in India -- both are lifetime free, easy to get approved, and give good rewards. Start with these before moving to premium cards.' },
      { q: 'What credit score do I need for a credit card in India?', a: 'Most banks require a CIBIL score of 700+ for a basic credit card and 750+ for premium cards. If you have no credit history, apply for a secured credit card (against FD) from HDFC or ICICI to build your score.' },
    ],
  },
};

export async function generateStaticParams() {
  return Object.keys(CATEGORY_CONFIG).map(category => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const config = CATEGORY_CONFIG[params.category];
  if (!config) return {};
  return {
    title: config.title,
    description: config.metaDesc,
    keywords: config.keywords,
    alternates: { canonical: `https://creditiq.app/best-cards/${params.category}` },
    openGraph: {
      title: config.h1,
      description: config.metaDesc,
      url: `https://creditiq.app/best-cards/${params.category}`,
    },
  };
}

export default function BestCardsPage({ params }: Props) {
  const config = CATEGORY_CONFIG[params.category];
  if (!config) notFound();

  const allCards = SEED_CARDS.map(c => c as any);
  const filtered = allCards.filter(config.filter).sort(config.sortBy);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: config.faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  const otherCategories = Object.entries(CATEGORY_CONFIG)
    .filter(([key]) => key !== params.category)
    .slice(0, 5);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Header />

        {/* Breadcrumb */}
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '10px 20px', fontSize: 13, color: '#94a3b8' }}>
            <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Home</Link>
            {' / '}
            <Link href="/cards" style={{ color: '#94a3b8', textDecoration: 'none' }}>Credit Cards</Link>
            {' / '}
            <span style={{ color: '#1B3A5C', fontWeight: 600 }}>{config.h1}</span>
          </div>
        </div>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, #1B3A5C 0%, #0d2240 100%)', padding: '40px 20px 36px' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 10 }}>
              {filtered.length} cards ranked &nbsp;&bull;&nbsp; No affiliate bias &nbsp;&bull;&nbsp; May 2026
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#ffffff', margin: '0 0 12px', lineHeight: 1.2 }}>
              {config.h1}
            </h1>
            <p style={{ fontSize: 16, color: '#94a3b8', margin: 0, lineHeight: 1.6, maxWidth: 560 }}>
              {config.description}
            </p>
          </div>
        </div>

        <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px' }}>

          {/* Expert insight */}
          <div style={{
            backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14,
            padding: '18px 22px', marginBottom: 28, display: 'flex', gap: 14, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, backgroundColor: '#fcd34d', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800,
            }}>i</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 4 }}>
                CreditIQ Insight
              </div>
              <div style={{ fontSize: 14, color: '#78350f', lineHeight: 1.6 }}>{config.insight}</div>
            </div>
          </div>

          {/* Card list */}
          <div style={{ marginBottom: 40 }}>
            {filtered.map((card, i) => {
              const annualFee = card.annual_fee_inr ?? 0;
              const { url: applyUrl, label: applyLabel } = getApplyUrl(card.id);
              const cats = Array.isArray(card.category) ? card.category : [card.category ?? 'rewards'];
              const lounges = card.lounges ?? [];

              return (
                <div key={card.id} style={{
                  backgroundColor: '#fff', borderRadius: 16,
                  border: i === 0 ? '2px solid #C9972E' : '1px solid #e2e8f0',
                  marginBottom: 16, overflow: 'hidden',
                  boxShadow: i === 0 ? '0 4px 20px rgba(201,151,46,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                  {/* Rank bar */}
                  <div style={{
                    backgroundColor: i === 0 ? '#1B3A5C' : '#f8fafc',
                    padding: '10px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 6,
                        backgroundColor: i === 0 ? '#C9972E' : i === 1 ? '#94a3b8' : '#cbd5e1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800, color: '#fff',
                      }}>#{i + 1}</div>
                      <span style={{
                        fontSize: 12, fontWeight: 700,
                        color: i === 0 ? '#C9972E' : '#64748b',
                        textTransform: 'uppercase' as const, letterSpacing: 0.8,
                      }}>
                        {i === 0 ? 'Top pick' : i === 1 ? 'Runner up' : `#${i + 1} pick`}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: i === 0 ? '#94a3b8' : '#cbd5e1', fontWeight: 500 }}>
                      {card.bank}
                    </span>
                  </div>

                  <div style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
                      <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: 19, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
                          {card.name}
                        </h2>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                          {cats.slice(0, 3).map((cat: string, j: number) => (
                            <span key={j} style={{
                              fontSize: 11, color: '#1B3A5C', backgroundColor: '#eff6ff',
                              padding: '2px 8px', borderRadius: 100, textTransform: 'capitalize' as const,
                            }}>{cat}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: annualFee === 0 ? '#16a34a' : '#1B3A5C' }}>
                          {annualFee === 0 ? 'FREE' : `Rs.${annualFee.toLocaleString('en-IN')}`}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>annual fee</div>
                      </div>
                    </div>

                    {/* Key perks */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                      {[
                        { label: 'Base reward', value: card.base_reward_rate ? `${card.base_reward_rate}%` : 'N/A' },
                        { label: 'Forex markup', value: card.forex_markup_percent ? `${card.forex_markup_percent}%` : '3.5%' },
                        { label: 'Lounge access', value: lounges.length > 0 ? (lounges.find((l: any) => l.notes === 'Unlimited') ? 'Unlimited' : `${lounges.length} networks`) : 'None' },
                      ].map((perk, j) => (
                        <div key={j} style={{
                          backgroundColor: '#f8fafc', borderRadius: 10, padding: '12px',
                          textAlign: 'center' as const,
                        }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#1B3A5C' }}>{perk.value}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{perk.label}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <a href={applyUrl} target="_blank" rel="noopener noreferrer" style={{
                        flex: 1, display: 'block', backgroundColor: i === 0 ? '#C9972E' : '#1B3A5C',
                        color: '#fff', textAlign: 'center' as const, padding: '12px',
                        borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none',
                      }}>{applyLabel}</a>
                      <Link href={`/cards/${card.id}`} style={{
                        flex: 1, display: 'block', backgroundColor: '#f8fafc',
                        color: '#1B3A5C', textAlign: 'center' as const, padding: '12px',
                        borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none',
                        border: '1px solid #e2e8f0',
                      }}>Full review &rarr;</Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FAQ section */}
          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 28 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1B3A5C', margin: 0 }}>
                Frequently Asked Questions
              </h2>
            </div>
            {config.faqs.map((faq, i) => (
              <div key={i} style={{ padding: '18px 24px', borderBottom: i < config.faqs.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1B3A5C', margin: '0 0 8px' }}>{faq.q}</h3>
                <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>{faq.a}</p>
              </div>
            ))}
          </div>

          {/* Internal links to other categories */}
          <div style={{ backgroundColor: '#1B3A5C', borderRadius: 16, padding: '24px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#C9972E', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 14 }}>
              Explore other categories
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
              {otherCategories.map(([key, cat]) => (
                <Link key={key} href={`/best-cards/${key}`} style={{
                  padding: '8px 16px', backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: 100, fontSize: 13, color: '#cbd5e1',
                  textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  {cat.h1.replace('Best ', '').replace(' in India 2026', '').replace(' Cards', ' Cards')}
                </Link>
              ))}
              <Link href="/spend-optimizer" style={{
                padding: '8px 16px', backgroundColor: '#C9972E',
                borderRadius: 100, fontSize: 13, color: '#fff',
                textDecoration: 'none', fontWeight: 700,
              }}>Find my best card &rarr;</Link>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}

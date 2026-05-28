import Link from 'next/link';
import { Header } from '@/components/Header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Credit Card Blog India 2026 | CreditIQ',
  description: 'Honest, data-driven articles on Indian credit cards — reviews, comparisons, earning strategies, and redemption guides. No affiliate bias.',
};

const ARTICLES = [
  {
    slug: 'hdfc-infinia-review-2026',
    tag: 'Card Review',
    tagColor: '#1B3A5C',
    title: 'HDFC Infinia Review 2026 — Is the ₹12,500 Fee Still Worth It?',
    excerpt: 'After four devaluations in 18 months, we ran the actual numbers. Here\'s who should keep Infinia, who should downgrade, and the one use case where it\'s irreplaceable.',
    readTime: '8 min',
    date: 'May 25, 2026',
    featured: true,
  },
  {
    slug: 'axis-magnus-vs-hdfc-infinia',
    tag: 'Comparison',
    tagColor: '#e11d48',
    title: 'Axis Magnus Burgundy vs HDFC Infinia — The Honest Comparison',
    excerpt: 'Both cost over ₹10,000 a year. Both earn airline miles. But they\'re for completely different spenders. We break down exactly who should pick which.',
    readTime: '6 min',
    date: 'May 22, 2026',
    featured: false,
  },
  {
    slug: 'zero-fee-portfolio-beats-premium',
    tag: 'Strategy',
    tagColor: '#10b981',
    title: 'The ₹0 Credit Card Portfolio That Outperforms Magnus',
    excerpt: 'Three lifetime-free cards, combined intelligently, can beat a ₹10,000-fee premium card for most Indian spenders. Here\'s the maths — with real numbers.',
    readTime: '5 min',
    date: 'May 18, 2026',
    featured: false,
  },
  {
    slug: 'hdfc-smartbuy-complete-guide',
    tag: 'Guide',
    tagColor: '#6366f1',
    title: 'HDFC SmartBuy — The Complete 2026 Guide to Maximising Reward Points',
    excerpt: 'Flight bookings, Amazon Pay, Gyftr vouchers, utility bills — SmartBuy is the most underused tool in Indian credit card rewards. Here\'s how to extract full value.',
    readTime: '7 min',
    date: 'May 14, 2026',
    featured: false,
  },
  {
    slug: 'credit-card-devaluations-india-2026',
    tag: 'News',
    tagColor: '#f59e0b',
    title: 'Credit Card Devaluations in India 2026 — What Changed and What to Do',
    excerpt: 'Axis lost 3 transfer partners. HDFC cut SmartBuy rates. SBI Cashback capped categories. Here\'s every change that happened and how to respond.',
    readTime: '6 min',
    date: 'May 10, 2026',
    featured: false,
  },
  {
    slug: 'best-credit-card-international-travel-india',
    tag: 'Guide',
    tagColor: '#0ea5e9',
    title: 'Best Credit Cards for International Travel from India 2026',
    excerpt: 'Zero forex markup, airport lounge access, travel insurance, and miles on every flight. We rank the best cards for Indians who travel internationally.',
    readTime: '9 min',
    date: 'May 5, 2026',
    featured: false,
  },
];

const CATEGORIES = ['All', 'Card Review', 'Comparison', 'Strategy', 'Guide', 'News'];

export default function BlogPage() {
  const featured = ARTICLES.find(a => a.featured);
  const rest = ARTICLES.filter(a => !a.featured);

  return (
    <div style={{ backgroundColor: '#faf9f6', minHeight: '100vh' }}>
      <Header />
      <main style={{ maxWidth: 900, marginInline: 'auto', padding: 'clamp(100px,14vw,140px) clamp(16px,4vw,32px) 80px' }}>

        {/* Hero */}
        <div style={{ marginBottom: 48 }}>
          <span style={{
            display: 'inline-block', backgroundColor: '#1B3A5C', color: '#C9972E',
            fontSize: 11, fontWeight: 700, letterSpacing: 1.8, padding: '5px 18px',
            borderRadius: 100, marginBottom: 20, textTransform: 'uppercase',
          }}>
            No affiliate bias &bull; Original research
          </span>
          <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, color: '#1B3A5C', margin: '0 0 12px', lineHeight: 1.15 }}>
            The CreditIQ Blog
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 480, lineHeight: 1.75, margin: 0 }}>
            Honest, data-driven writing on Indian credit cards. No fluff, no bank-sponsored rankings.
          </p>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
          {CATEGORIES.map((cat, i) => (
            <span key={cat} style={{
              padding: '6px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600,
              backgroundColor: i === 0 ? '#1B3A5C' : '#fff',
              color: i === 0 ? '#fff' : '#64748b',
              border: '1.5px solid',
              borderColor: i === 0 ? '#1B3A5C' : '#e2e8f0',
              cursor: 'pointer',
            }}>{cat}</span>
          ))}
        </div>

        {/* Featured */}
        {featured && (
          <Link href={`/blog/${featured.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 32 }}>
            <div style={{
              backgroundColor: '#1B3A5C', borderRadius: 20, padding: 'clamp(24px,4vw,40px)',
              boxShadow: '0 8px 32px rgba(27,58,92,0.15)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <span style={{
                  backgroundColor: '#C9972E', color: '#fff',
                  fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase',
                  padding: '4px 12px', borderRadius: 100,
                }}>Featured</span>
                <span style={{ color: '#64748b', fontSize: 12 }}>{featured.date} &bull; {featured.readTime} read</span>
              </div>
              <h2 style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', lineHeight: 1.3 }}>
                {featured.title}
              </h2>
              <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.7 }}>{featured.excerpt}</p>
              <span style={{ color: '#C9972E', fontWeight: 700, fontSize: 14 }}>Read article &rarr;</span>
            </div>
          </Link>
        )}

        {/* Article grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {rest.map(article => (
            <Link key={article.slug} href={`/blog/${article.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                backgroundColor: '#fff', borderRadius: 16, padding: 24,
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{
                    backgroundColor: article.tagColor, color: '#fff',
                    fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase',
                    padding: '3px 10px', borderRadius: 100,
                  }}>{article.tag}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{article.readTime} read</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B3A5C', margin: '0 0 8px', lineHeight: 1.4, flex: 1 }}>
                  {article.title}
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.6 }}>
                  {article.excerpt}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{article.date}</span>
                  <span style={{ fontSize: 13, color: '#C9972E', fontWeight: 700 }}>Read &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Sweet spots promo */}
        <div style={{ marginTop: 64, textAlign: 'center' }}>
          <Link href="/sweet-spots" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            backgroundColor: '#fff', border: '2px solid #1B3A5C',
            color: '#1B3A5C', padding: '14px 28px', borderRadius: 12,
            fontWeight: 700, fontSize: 14, textDecoration: 'none',
          }}>
            View all 8 Redemption Sweet Spots &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}

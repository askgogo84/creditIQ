import Link from 'next/link';
import { Header } from '@/components/Header';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Credit Card Blog India 2026 | CreditIQ',
  description: 'Honest, data-driven articles on Indian credit cards — reviews, comparisons, earning strategies, devaluation tracker. No affiliate bias, no bank sponsorship.',
};

const ARTICLES = [
  { slug: 'hdfc-infinia-review-2026', tag: 'Card Review', tagColor: '#1B3A5C', title: 'HDFC Infinia Review 2026 — Is the ₹12,500 Fee Still Worth It?', excerpt: 'After four devaluations, we ran the actual numbers. Who should keep it, who should downgrade, and the one use case where it remains irreplaceable.', readTime: '8 min', date: 'May 25, 2026', featured: true },
  { slug: 'credit-card-devaluations-india-2026', tag: 'News', tagColor: '#f59e0b', title: 'Credit Card Devaluations in India 2026 — Every Change, What to Do Next', excerpt: 'Axis lost 3 transfer partners. HDFC cut earn rates. SBI capped cashback. ICICI excluded categories. Every change that happened and how to respond.', readTime: '6 min', date: 'May 10, 2026', featured: false },
  { slug: 'axis-magnus-vs-hdfc-infinia', tag: 'Comparison', tagColor: '#e11d48', title: 'Axis Magnus Burgundy vs HDFC Infinia — The Honest Comparison', excerpt: 'Both cost ₹10,000+ per year. Both earn airline miles. But they are for completely different spenders. We break down exactly who wins.', readTime: '6 min', date: 'May 22, 2026', featured: false },
  { slug: 'hdfc-smartbuy-complete-guide', tag: 'Guide', tagColor: '#6366f1', title: 'HDFC SmartBuy 2026 — The Complete Guide to Maximising Reward Points', excerpt: 'Gyftr vouchers, flight redemptions at ₹1/pt, 10X categories, monthly caps. Everything you need to stop leaving 60% of your SmartBuy value unused.', readTime: '7 min', date: 'May 14, 2026', featured: false },
  { slug: 'best-credit-card-international-travel-india', tag: 'Guide', tagColor: '#0ea5e9', title: 'Best Credit Cards for International Travel from India 2026', excerpt: 'Zero forex markup, airport lounge access, travel insurance, and miles on every flight. We rank the best for every type of Indian international traveller.', readTime: '9 min', date: 'May 5, 2026', featured: false },
  { slug: 'best-credit-card-dining-swiggy-zomato', tag: 'Guide', tagColor: '#e11d48', title: 'Best Credit Cards for Swiggy, Zomato, and Dining in India 2026', excerpt: 'Cards advertise 4–10% on food delivery apps — but caps mean your real rate depends on how much you order. We calculated returns at ₹8,000/month.', readTime: '6 min', date: 'April 28, 2026', featured: false },
  { slug: 'zero-fee-portfolio-beats-premium', tag: 'Strategy', tagColor: '#10b981', title: 'The ₹0 Credit Card Portfolio That Outperforms Magnus', excerpt: 'Three lifetime-free cards, combined intelligently, can beat a ₹10,000-fee premium card for most Indian spenders. Here is the maths.', readTime: '5 min', date: 'May 18, 2026', featured: false },
];

const CATEGORIES = ['All', 'Card Review', 'Comparison', 'Strategy', 'Guide', 'News'];

export default function BlogPage() {
  const featured = ARTICLES.find(a => a.featured);
  const rest = ARTICLES.filter(a => !a.featured);

  return (
    <div style={{ backgroundColor: '#faf9f6', minHeight: '100vh' }}>
      <Header />
      <main style={{ maxWidth: 900, marginInline: 'auto', padding: 'clamp(100px,14vw,140px) clamp(16px,4vw,32px) 80px' }}>

        <div style={{ marginBottom: 48 }}>
          <span style={{ display: 'inline-block', backgroundColor: '#1B3A5C', color: '#C9972E', fontSize: 11, fontWeight: 700, letterSpacing: 1.8, padding: '5px 18px', borderRadius: 100, marginBottom: 20, textTransform: 'uppercase' }}>
            No affiliate bias &bull; Original research
          </span>
          <h1 style={{ fontSize: 'clamp(28px,5vw,40px)', fontWeight: 800, color: '#1B3A5C', margin: '0 0 12px', lineHeight: 1.15 }}>
            The CreditIQ Blog
          </h1>
          <p style={{ fontSize: 16, color: '#64748b', maxWidth: 480, lineHeight: 1.75, margin: 0 }}>
            Honest, data-driven writing on Indian credit cards. No fluff, no bank-sponsored rankings, no hidden agenda.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
          {CATEGORIES.map((cat, i) => (
            <span key={cat} style={{ padding: '6px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, backgroundColor: i === 0 ? '#1B3A5C' : '#fff', color: i === 0 ? '#fff' : '#64748b', border: '1.5px solid', borderColor: i === 0 ? '#1B3A5C' : '#e2e8f0', cursor: 'default' }}>{cat}</span>
          ))}
        </div>

        {featured && (
          <Link href={`/blog/${featured.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 32 }}>
            <div style={{ backgroundColor: '#1B3A5C', borderRadius: 20, padding: 'clamp(24px,4vw,40px)', boxShadow: '0 8px 32px rgba(27,58,92,0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <span style={{ backgroundColor: '#C9972E', color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', padding: '4px 12px', borderRadius: 100 }}>Featured</span>
                <span style={{ color: '#64748b', fontSize: 12 }}>{featured.date} &bull; {featured.readTime} read</span>
              </div>
              <h2 style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', lineHeight: 1.3 }}>{featured.title}</h2>
              <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.7 }}>{featured.excerpt}</p>
              <span style={{ color: '#C9972E', fontWeight: 700, fontSize: 14 }}>Read article &rarr;</span>
            </div>
          </Link>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {rest.map(article => (
            <Link key={article.slug} href={`/blog/${article.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ backgroundColor: article.tagColor, color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 100 }}>{article.tag}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{article.readTime} read</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1B3A5C', margin: '0 0 8px', lineHeight: 1.4, flex: 1 }}>{article.title}</h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px', lineHeight: 1.6 }}>{article.excerpt}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{article.date}</span>
                  <span style={{ fontSize: 13, color: '#C9972E', fontWeight: 700 }}>Read &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: 64, textAlign: 'center' }}>
          <Link href="/sweet-spots" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: '#fff', border: '2px solid #1B3A5C', color: '#1B3A5C', padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            View 8 Redemption Sweet Spots &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}

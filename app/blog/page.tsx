import Link from 'next/link';
import { Header } from '@/components/Header';
import { DesignFooter } from '@/components/design/Footer';
import { Reveal } from '@/components/design/Reveal';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Credit Card Blog India 2026 | CreditIQ',
  description: 'Honest, data-driven articles on Indian credit cards — reviews, comparisons, earning strategies, devaluation tracker. No affiliate bias.',
};

const ARTICLES = [
  { slug: 'hdfc-infinia-review-2026', tag: 'Card Review', tagColor: 'var(--ink,#142950)', title: 'HDFC Infinia Review 2026 — Is the Rs.12,500 Fee Still Worth It?', excerpt: 'After four devaluations, we ran the actual numbers. Who should keep it, who should downgrade, and the one use case where it remains irreplaceable.', readTime: '8 min', date: 'May 25, 2026', featured: true },
  { slug: 'credit-card-devaluations-india-2026', tag: 'News', tagColor: 'var(--copper,#8C5F12)', title: 'Credit Card Devaluations 2026 — Every Change, What to Do Next', excerpt: 'Axis lost 3 transfer partners. HDFC cut earn rates. SBI capped cashback. ICICI excluded categories. Every change that happened and how to respond.', readTime: '6 min', date: 'May 10, 2026', featured: false },
  { slug: 'axis-magnus-vs-hdfc-infinia', tag: 'Comparison', tagColor: 'var(--terracotta,#C46A52)', title: 'Axis Magnus Burgundy vs HDFC Infinia — The Honest Comparison', excerpt: 'Both cost Rs.10,000+ per year. Both earn airline miles. But they are for completely different spenders — and choosing wrong costs you thousands.', readTime: '6 min', date: 'May 22, 2026', featured: false },
  { slug: 'hdfc-smartbuy-complete-guide', tag: 'Guide', tagColor: '#4f46e5', title: 'HDFC SmartBuy 2026 — The Complete Guide to Maximising Reward Points', excerpt: 'Gyftr vouchers, flights at Rs.1/pt, 10X categories, monthly caps. Stop leaving 60% of your SmartBuy value unused.', readTime: '7 min', date: 'May 14, 2026', featured: false },
  { slug: 'best-credit-card-international-travel-india', tag: 'Guide', tagColor: '#0369a1', title: 'Best Credit Cards for International Travel from India 2026', excerpt: 'Zero forex markup, airport lounge access, travel insurance, and miles on every flight. We rank the best for every type of traveller.', readTime: '9 min', date: 'May 5, 2026', featured: false },
  { slug: 'best-credit-card-dining-swiggy-zomato', tag: 'Guide', tagColor: 'var(--terracotta,#C46A52)', title: 'Best Credit Cards for Swiggy, Zomato, and Dining 2026', excerpt: 'Cards advertise 4–10% on food apps but caps mean your real rate depends on how much you order. We calculated returns at Rs.8,000/month.', readTime: '6 min', date: 'April 28, 2026', featured: false },
  { slug: 'zero-fee-portfolio-beats-premium', tag: 'Strategy', tagColor: '#2d7a56', title: 'The Rs.0 Credit Card Portfolio That Outperforms Magnus', excerpt: 'Three lifetime-free cards combined intelligently can beat a Rs.10,000-fee premium card for most Indian spenders. Here is the maths.', readTime: '5 min', date: 'May 18, 2026', featured: false },
];

export default function BlogPage() {
  const featured = ARTICLES.find(a => a.featured);
  const rest = ARTICLES.filter(a => !a.featured);

  return (
    <>
      <Header />
      <div className="page-fade">

        {/* ── Hero ── */}
        <section style={{ position: 'relative', paddingTop: 'clamp(120px,18vw,150px)', paddingBottom: 48 }}>
          <div className="aurora" style={{ top: -60, right: -100, width: 600, height: 500, background: 'radial-gradient(circle,rgba(212,163,115,0.22),transparent 60%)' }} />
          <div className="shell" style={{ position: 'relative', zIndex: 2 }}>
            <Reveal>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '7px 16px', borderRadius: 999, background: 'rgba(212,163,115,0.12)', border: '1px solid rgba(212,163,115,0.28)', marginBottom: 28 }}>
                <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, letterSpacing: '0.18em', color: 'var(--copper,#8C5F12)', textTransform: 'uppercase', fontWeight: 700 }}>No affiliate bias &bull; Original research</span>
              </div>
              <h1 style={{ fontSize: 'clamp(40px,7vw,88px)', letterSpacing: '-0.04em', lineHeight: 1.0, fontWeight: 800, color: 'var(--ink,#142950)', margin: '0 0 20px' }}>
                The CreditIQ{' '}
                <span style={{ fontFamily: 'var(--font-serif,Georgia,serif)', color: 'var(--copper-3,#D89B2A)', fontStyle: 'italic', fontWeight: 400 }}>Blog</span>
              </h1>
              <p style={{ maxWidth: 480, color: 'var(--ink-2,#2A3F6B)', fontSize: 'clamp(15px,1.4vw,18px)', lineHeight: 1.65, margin: 0 }}>
                Honest, data-driven writing on Indian credit cards. No fluff, no bank-sponsored rankings, no hidden agenda.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── Featured ── */}
        {featured && (
          <section style={{ paddingBottom: 24 }}>
            <div className="shell">
              <Reveal>
                <Link href={`/blog/${featured.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <div style={{ background: 'var(--ink,#142950)', borderRadius: 24, padding: 'clamp(28px,4vw,48px)', position: 'relative', overflow: 'hidden' }}>
                    <div className="aurora" style={{ top: -60, right: -80, width: 400, height: 400, background: 'radial-gradient(circle,rgba(212,163,115,0.18),transparent 60%)' }} />
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                        <span style={{ padding: '4px 14px', borderRadius: 999, background: 'rgba(212,163,115,0.15)', border: '1px solid rgba(212,163,115,0.30)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--copper-3,#D89B2A)', fontFamily: 'var(--font-mono,monospace)' }}>
                          Featured Article
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{featured.date} &bull; {featured.readTime} read</span>
                      </div>
                      <h2 style={{ fontSize: 'clamp(20px,3vw,32px)', fontWeight: 800, color: '#fff', margin: '0 0 14px', lineHeight: 1.25, letterSpacing: '-0.02em' }}>{featured.title}</h2>
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px', lineHeight: 1.7 }}>{featured.excerpt}</p>
                      <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 12, color: 'var(--copper-3,#D89B2A)', letterSpacing: '0.05em', fontWeight: 600 }}>Read article →</span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            </div>
          </section>
        )}

        {/* ── Article grid ── */}
        <section style={{ paddingBottom: 80 }}>
          <div className="shell">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
              {rest.map((article, i) => (
                <Reveal key={article.slug} style={{ animationDelay: `${i * 60}ms` }}>
                  <Link href={`/blog/${article.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                    <div style={{ background: 'var(--paper,#FAF5EB)', borderRadius: 20, padding: 24, border: '1px solid var(--line,rgba(20,41,80,0.08))', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <span style={{ padding: '3px 11px', borderRadius: 999, background: `${article.tagColor}14`, border: `1px solid ${article.tagColor}30`, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: article.tagColor, fontFamily: 'var(--font-mono,monospace)' }}>
                          {article.tag}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: 'var(--ink-3,#5A6A8A)' }}>{article.readTime} read</span>
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink,#142950)', margin: '0 0 10px', lineHeight: 1.4, letterSpacing: '-0.01em', flex: 1 }}>{article.title}</h3>
                      <p style={{ fontSize: 13, color: 'var(--ink-3,#5A6A8A)', margin: '0 0 18px', lineHeight: 1.65 }}>{article.excerpt}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 10, color: 'var(--ink-3,#5A6A8A)' }}>{article.date}</span>
                        <span style={{ fontFamily: 'var(--font-mono,monospace)', fontSize: 11, color: 'var(--copper,#8C5F12)', fontWeight: 600 }}>Read →</span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>

            {/* Sweet spots link */}
            <Reveal style={{ marginTop: 48, textAlign: 'center' }}>
              <Link href="/sweet-spots" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px', borderRadius: 12, border: '1.5px solid var(--ink,#142950)', color: 'var(--ink,#142950)', fontWeight: 700, fontSize: 14, textDecoration: 'none', letterSpacing: '-0.01em' }}>
                View 8 Redemption Sweet Spots →
              </Link>
            </Reveal>
          </div>
        </section>

        <DesignFooter />
      </div>
    </>
  );
}

// Single source of truth for the hand-curated blog cards.
// Both the /blog listing (app/blog/page.tsx) and the landing page's "From the
// blog" grid import from here so the two can never drift apart. These are the
// real published posts; none currently carry a cover image, so surfaces that
// need art render a typographic card rather than a stock placeholder.

export type FeaturedPost = {
  slug: string;
  tag: string;
  tagColor: string;
  title: string;
  excerpt: string;
  readTime: string;
  date: string; // human display, e.g. "May 25, 2026"
  iso: string; // sortable YYYY-MM-DD (used only for "latest" ordering)
  featured?: boolean;
};

export const BLOG_POSTS: FeaturedPost[] = [
  { slug: 'hdfc-infinia-review-2026', tag: 'Card Review', tagColor: 'var(--ink,#142950)', title: 'HDFC Infinia Review 2026 — Is the Rs.12,500 Fee Still Worth It?', excerpt: 'After four devaluations, we ran the actual numbers. Who should keep it, who should downgrade, and the one use case where it remains irreplaceable.', readTime: '8 min', date: 'May 25, 2026', iso: '2026-05-25', featured: true },
  { slug: 'axis-magnus-vs-hdfc-infinia', tag: 'Comparison', tagColor: 'var(--terracotta,#C46A52)', title: 'Axis Magnus Burgundy vs HDFC Infinia — The Honest Comparison', excerpt: 'Both cost Rs.10,000+ per year. Both earn airline miles. But they are for completely different spenders — and choosing wrong costs you thousands.', readTime: '6 min', date: 'May 22, 2026', iso: '2026-05-22', featured: false },
  { slug: 'zero-fee-portfolio-beats-premium', tag: 'Strategy', tagColor: '#2d7a56', title: 'The Rs.0 Credit Card Portfolio That Outperforms Magnus', excerpt: 'Three lifetime-free cards combined intelligently can beat a Rs.10,000-fee premium card for most Indian spenders. Here is the maths.', readTime: '5 min', date: 'May 18, 2026', iso: '2026-05-18', featured: false },
  { slug: 'hdfc-smartbuy-complete-guide', tag: 'Guide', tagColor: '#4f46e5', title: 'HDFC SmartBuy 2026 — The Complete Guide to Maximising Reward Points', excerpt: 'Gyftr vouchers, flights at Rs.1/pt, 10X categories, monthly caps. Stop leaving 60% of your SmartBuy value unused.', readTime: '7 min', date: 'May 14, 2026', iso: '2026-05-14', featured: false },
  { slug: 'credit-card-devaluations-india-2026', tag: 'News', tagColor: 'var(--copper,#8C5F12)', title: 'Credit Card Devaluations 2026 — Every Change, What to Do Next', excerpt: 'Axis lost 3 transfer partners. HDFC cut earn rates. SBI capped cashback. ICICI excluded categories. Every change that happened and how to respond.', readTime: '6 min', date: 'May 10, 2026', iso: '2026-05-10', featured: false },
  { slug: 'best-credit-card-international-travel-india', tag: 'Guide', tagColor: '#0369a1', title: 'Best Credit Cards for International Travel from India 2026', excerpt: 'Zero forex markup, airport lounge access, travel insurance, and miles on every flight. We rank the best for every type of traveller.', readTime: '9 min', date: 'May 5, 2026', iso: '2026-05-05', featured: false },
  { slug: 'best-credit-card-dining-swiggy-zomato', tag: 'Guide', tagColor: 'var(--terracotta,#C46A52)', title: 'Best Credit Cards for Swiggy, Zomato, and Dining 2026', excerpt: 'Cards advertise 4–10% on food apps but caps mean your real rate depends on how much you order. We calculated returns at Rs.8,000/month.', readTime: '6 min', date: 'April 28, 2026', iso: '2026-04-28', featured: false },
];

// Latest posts by publish date, newest first. ISO dates sort lexicographically.
export function latestPosts(n?: number): FeaturedPost[] {
  const sorted = [...BLOG_POSTS].sort((a, b) => (a.iso < b.iso ? 1 : -1));
  return typeof n === 'number' ? sorted.slice(0, n) : sorted;
}

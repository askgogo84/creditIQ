import { MetadataRoute } from 'next';
import { SEED_CARDS } from '@/lib/data/seed-cards';

const BASE = 'https://creditiq.app';

const BLOG_SLUGS = [
  'hdfc-infinia-review-2026',
  'axis-magnus-vs-hdfc-infinia',
  'zero-fee-portfolio-beats-premium',
  'hdfc-smartbuy-complete-guide',
  'credit-card-devaluations-india-2026',
  'best-credit-card-international-travel-india',
  'best-credit-card-dining-swiggy-zomato',
];

const BANKS = ['HDFC', 'SBI', 'ICICI', 'Axis', 'Kotak', 'AmEx', 'IDFC', 'RBL', 'Yes', 'IndusInd', 'SC', 'AU'];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/cards`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/smart-match`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE}/compare`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/travel`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/spend-optimizer`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/points-optimizer`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/card-roast`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/statement-truth`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/sweet-spots`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/uae`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/banks`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/calculators`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/glossary`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/credit-score`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/disclosures`, lastModified: now, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${BASE}/lounge-tracker`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/card-switch`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  const categoryPages: MetadataRoute.Sitemap = ['travel', 'cashback', 'dining', 'no-fee', 'premium', 'fuel', 'shopping', 'beginners'].map(cat => ({
    url: `${BASE}/best-cards/${cat}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.9,
  }));

  const bankPages: MetadataRoute.Sitemap = BANKS.map(bank => ({
    url: `${BASE}/banks/${bank}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = BLOG_SLUGS.map(slug => ({
    url: `${BASE}/blog/${slug}`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.7,
  }));

  const cardPages: MetadataRoute.Sitemap = SEED_CARDS.map(card => ({
    url: `${BASE}/cards/${card.id}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...bankPages, ...blogPages, ...cardPages];
}

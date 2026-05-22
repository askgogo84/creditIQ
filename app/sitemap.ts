import { MetadataRoute } from 'next';
import { SEED_CARDS } from '@/lib/data/seed-cards';

const BASE = 'https://creditiq.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/cards`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/smart-match`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/optimize`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/compare`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/travel`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/spend-optimizer`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/uae`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/calculators`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/glossary`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/credit-score`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  // Category pages
  const categories = ['travel', 'cashback', 'dining', 'no-fee', 'premium', 'fuel', 'shopping', 'beginners'];
  const categoryPages: MetadataRoute.Sitemap = categories.map(cat => ({
    url: `${BASE}/best-cards/${cat}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // Card detail pages
  const cardPages: MetadataRoute.Sitemap = SEED_CARDS.map(card => ({
    url: `${BASE}/cards/${card.id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...cardPages];
}

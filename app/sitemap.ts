import { MetadataRoute } from 'next';
import { SEED_CARDS } from '@/lib/data/seed-cards';

const BASE = 'https://creditiq.app';

const BANKS = ['HDFC','SBI','ICICI','Axis','Kotak','AmEx','IDFC','RBL','Yes','IndusInd','SC','AU','Federal','HSBC','OneCard','BOB','IDBI'];

export default function sitemap(): MetadataRoute.Sitemap {
  const cardUrls = SEED_CARDS.filter(c => c.active).map(card => ({
    url: `${BASE}/card/${card.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const bankUrls = BANKS.map(bank => ({
    url: `${BASE}/bank/${bank}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/smart-match`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/optimize`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE}/compare`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/banks`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/calculators`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/credit-score`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/glossary`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/application-status`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    ...cardUrls,
    ...bankUrls,
  ];
}

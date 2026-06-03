import os

# 4a - Root layout metadata
layout_path = r'app/layout.tsx'
with open(layout_path, 'r', encoding='utf-8-sig') as f:
    layout = f.read()

if 'export const metadata' not in layout:
    meta = """export const metadata = {
  metadataBase: new URL('https://creditiq.app'),
  title: {
    default: "CreditIQ \u2014 India's Most Honest Credit Card Intelligence",
    template: '%s | CreditIQ',
  },
  description: "Find the best credit card for your spending. AI-powered card comparison, reward optimizer, trip planner and devaluation alerts. Zero bank bias.",
  keywords: ['best credit card India', 'credit card comparison India', 'reward points calculator', 'airport lounge credit card India', 'travel credit card India 2026', 'HDFC Regalia vs Axis Magnus'],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://creditiq.app',
    siteName: 'CreditIQ',
    title: "CreditIQ \u2014 India's Most Honest Credit Card Intelligence",
    description: 'AI-powered credit card comparison. Zero bank bias. Real community intelligence.',
  },
  twitter: {
    card: 'summary_large_image',
    title: "CreditIQ \u2014 India's Most Honest Credit Card Intelligence",
    description: 'AI-powered credit card comparison. Zero bank bias.',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://creditiq.app' },
}

"""
    layout = layout.replace('export default function', meta + 'export default function', 1)
    with open(layout_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(layout)
    print("OK: layout.tsx root metadata")
else:
    print("SKIP: layout already has metadata")

# 4b - Card page generateMetadata
card_page = r'app/cards/[slug]/page.tsx'
if os.path.exists(card_page):
    with open(card_page, 'r', encoding='utf-8-sig') as f:
        cp = f.read()
    if 'generateMetadata' not in cp:
        meta_fn = """
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { slug } = params
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: card } = await sb.from('cards').select('name,bank,base_reward_rate,annual_fee_inr').eq('slug', slug).single()
    if (card) {
      const title = card.name + ' Review 2026 \u2014 Rewards, Fees & Benefits'
      const desc = card.name + ' by ' + card.bank + ': ' + card.base_reward_rate + '% base rewards, Rs.' + card.annual_fee_inr + ' annual fee. Honest AI-powered review.'
      return { title, description: desc, alternates: { canonical: 'https://creditiq.app/cards/' + slug } }
    }
  } catch {}
  return { title: 'Credit Card Review | CreditIQ', alternates: { canonical: 'https://creditiq.app/cards/' + slug } }
}

"""
        cp = cp.replace('export default', meta_fn + 'export default', 1)
        with open(card_page, 'w', encoding='utf-8', newline='\n') as f:
            f.write(cp)
        print("OK: card page generateMetadata")
    else:
        print("SKIP: card page already has generateMetadata")
else:
    print("NOT FOUND: " + card_page)

# 4c - Blog page
blog_page = r'app/blog/[slug]/page.tsx'
if os.path.exists(blog_page):
    with open(blog_page, 'r', encoding='utf-8-sig') as f:
        bp = f.read()
    if 'generateMetadata' not in bp:
        meta_fn = """
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { slug } = params
  const title = slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return {
    title: title + ' | CreditIQ Blog',
    description: "Credit card insights, reward hacks and devaluation alerts from CreditIQ \u2014 India's most honest credit card intelligence.",
    alternates: { canonical: 'https://creditiq.app/blog/' + slug },
  }
}

"""
        bp = bp.replace('export default', meta_fn + 'export default', 1)
        with open(blog_page, 'w', encoding='utf-8', newline='\n') as f:
            f.write(bp)
        print("OK: blog page generateMetadata")
    else:
        print("SKIP: blog page already has generateMetadata")
else:
    print("NOT FOUND: " + blog_page)

# 4d - Dynamic sitemap
sitemap_path = r'app/sitemap.ts'
if not os.path.exists(sitemap_path):
    sitemap = """import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: cards } = await sb.from('cards').select('slug,updated_at').eq('active', true)

  const staticPages: MetadataRoute.Sitemap = [
    { url: 'https://creditiq.app', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: 'https://creditiq.app/cards', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: 'https://creditiq.app/card-roast', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://creditiq.app/trip-planner', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://creditiq.app/points-optimizer', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://creditiq.app/smart-match', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: 'https://creditiq.app/blog', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://creditiq.app/sweet-spots', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: 'https://creditiq.app/lounge-tracker', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: 'https://creditiq.app/statement-truth', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]

  const cardPages: MetadataRoute.Sitemap = (cards || []).map(card => ({
    url: 'https://creditiq.app/cards/' + card.slug,
    lastModified: card.updated_at ? new Date(card.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...cardPages]
}
"""
    with open(sitemap_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(sitemap)
    print("OK: sitemap.ts created")
else:
    print("SKIP: sitemap already exists")

# 4e - robots.txt
robots_path = r'app/robots.ts'
if not os.path.exists(robots_path):
    robots = """import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    ],
    sitemap: 'https://creditiq.app/sitemap.xml',
    host: 'https://creditiq.app',
  }
}
"""
    with open(robots_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(robots)
    print("OK: robots.ts created")
else:
    print("SKIP: robots.ts already exists")

print("SEO done")

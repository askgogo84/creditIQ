import os

# Step 1: Create blog API route
os.makedirs(r'app/api/blog', exist_ok=True)
api = r"""import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
export const runtime = 'nodejs'
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  if (slug) {
    const { data } = await sb.from('blog_posts').select('*').eq('slug', slug).eq('published', true).single()
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(data)
  }
  const { data } = await sb.from('blog_posts').select('slug,title,tag,tag_color,date,read_time,intro,related_card,related_card_slug').eq('published', true).order('published_at', { ascending: false }).limit(20)
  return NextResponse.json(data || [])
}
"""
with open(r'app/api/blog/route.ts', 'w', encoding='utf-8', newline='\n') as f:
    f.write(api)
print("OK: blog API route created")

# Step 2: SQL to create blog_posts table + seed 7 articles
sql = """-- Create blog_posts table
create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  tag text,
  tag_color text default '#1B3A5C',
  date text,
  read_time text,
  intro text,
  sections jsonb default '[]',
  verdict text,
  related_card text,
  related_card_slug text,
  published boolean default true,
  published_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Seed existing articles (INSERT OR IGNORE)
insert into blog_posts (slug, title, tag, tag_color, date, read_time, intro, published_at) values
('hdfc-infinia-review-2026', 'HDFC Infinia Review 2026 — Is the Rs.12,500 Fee Still Worth It?', 'Card Review', '#1B3A5C', 'May 25, 2026', '8 min read', 'HDFC Infinia is India''s most talked-about premium credit card. It has also been devalued four times in 18 months.', '2026-05-25'),
('axis-magnus-vs-hdfc-infinia', 'Axis Magnus Burgundy vs HDFC Infinia — The Honest Comparison', 'Comparison', '#e11d48', 'May 22, 2026', '6 min read', 'Both cards cost over Rs.10,000 per year. Both earn airline miles. Both are invite-only.', '2026-05-22'),
('zero-fee-portfolio-beats-premium', 'The Rs.0 Credit Card Portfolio That Outperforms Magnus', 'Strategy', '#10b981', 'May 18, 2026', '5 min read', 'The credit card industry wants you to believe that paying Rs.10,000+ annually is the price of good rewards.', '2026-05-18'),
('hdfc-smartbuy-complete-guide', 'HDFC SmartBuy 2026 — The Complete Guide to Maximising Your Reward Points', 'Guide', '#6366f1', 'May 14, 2026', '7 min read', 'SmartBuy is the most powerful — and most underused — tool in the HDFC rewards ecosystem.', '2026-05-14'),
('credit-card-devaluations-india-2026', 'Credit Card Devaluations in India 2026 — Every Change, What to Do Next', 'News', '#f59e0b', 'May 10, 2026', '6 min read', '2026 has been the worst year for Indian credit card rewards in a decade.', '2026-05-10'),
('best-credit-card-international-travel-india', 'Best Credit Cards for International Travel from India 2026', 'Guide', '#0ea5e9', 'May 5, 2026', '9 min read', 'Three things define a great international travel card: zero forex markup, airport lounge access, and a reward programme worth using abroad.', '2026-05-05'),
('best-credit-card-dining-swiggy-zomato', 'Best Credit Cards for Swiggy, Zomato, and Dining in India 2026', 'Guide', '#e11d48', 'April 28, 2026', '6 min read', 'Food delivery is where credit card rewards get genuinely interesting — and genuinely confusing.', '2026-04-28')
on conflict (slug) do nothing;
"""
with open(r'scripts\blog_migration.sql', 'w', encoding='utf-8', newline='\n') as f:
    f.write(sql)
print("OK: blog_migration.sql written to scripts/")
print("")
print("NEXT: Run scripts/blog_migration.sql in Supabase SQL editor")
print("THEN: Blog API will serve articles from DB instead of hardcode")

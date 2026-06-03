filepath = r'app/cards/[slug]/page.tsx'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Add Supabase import at top
old_import = "import { SEED_CARDS } from '@/lib/data/seed-cards';"
new_import = """import { SEED_CARDS } from '@/lib/data/seed-cards';
import { createClient } from '@supabase/supabase-js';"""

content = content.replace(old_import, new_import)

# Make page async and fetch community signals
old_fn = "export default function CardDetailPage({ params }: Props) {\n  const card = SEED_CARDS.find(c => c.id === params.slug);\n  if (!card) notFound();"
new_fn = """export default async function CardDetailPage({ params }: Props) {
  const card = SEED_CARDS.find(c => c.id === params.slug);
  if (!card) notFound();

  // Fetch community signals from intelligence_kb
  let communityInsights: any[] = []
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const cardName = card.name.toLowerCase()
    const bankName = card.bank.toLowerCase()
    const { data } = await sb
      .from('intelligence_kb')
      .select('insight_type, title, content, creator_handle, trust_score, source, scraped_at')
      .eq('active', true)
      .or(`card_mentions.cs.{"${card.name}"},card_mentions.cs.{"${card.bank}"}`)
      .order('trust_score', { ascending: false })
      .limit(3)
    communityInsights = data || []
  } catch {}"""

if old_fn in content:
    content = content.replace(old_fn, new_fn)
    print("OK: page made async + community signals fetch")
else:
    print("MISS: page function signature")

# Insert community signals panel before the FAQ section
old_faq = "        {/* FAQ Schema */}"
new_community = """        {/* Community Intelligence Panel */}
        {communityInsights.length > 0 && (
          <div style={{ backgroundColor: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: '#7c3aed' }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1B3A5C', margin: 0 }}>What the community says</h2>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', fontWeight: 700, letterSpacing: '0.08em' }}>LIVE</span>
            </div>
            {communityInsights.map((insight: any, i: number) => (
              <div key={i} style={{ padding: '16px 24px', borderBottom: i < communityInsights.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                    background: insight.insight_type === 'devaluation' ? '#fef2f2' : insight.insight_type === 'sweet_spot' ? '#f0fdf4' : '#f5f3ff',
                    color: insight.insight_type === 'devaluation' ? '#dc2626' : insight.insight_type === 'sweet_spot' ? '#16a34a' : '#7c3aed'
                  }}>{insight.insight_type?.replace('_', ' ')}</span>
                  {insight.creator_handle && <span style={{ fontSize: 12, color: '#94a3b8' }}>@{insight.creator_handle}</span>}
                  <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>{insight.source?.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1B3A5C', marginBottom: 4 }}>{insight.title}</div>
                {insight.content && <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{insight.content.slice(0, 140)}...</div>}
              </div>
            ))}
            <div style={{ padding: '12px 24px', background: '#fafafa' }}>
              <a href="/intelligence" style={{ fontSize: 13, color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>View all community intelligence &rarr;</a>
            </div>
          </div>
        )}

        {/* FAQ Schema */}"""

if old_faq in content:
    content = content.replace(old_faq, new_community)
    print("OK: community signals panel added to card page")
else:
    print("MISS: FAQ Schema comment not found")

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("done")

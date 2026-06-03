import re

filepath = r'lib/rag.ts'
with open(filepath, 'r', encoding='utf-8-sig') as f:
    content = f.read()

# Replace getIgInsights function - point to intelligence_kb with pgvector search
old_fn = """export async function getIgInsights(limit = 20, query?: string): Promise<string> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) return ''
    const sb = createClient(supabaseUrl, serviceKey)
    const { data, error } = await sb
      .from('ig_knowledge_base')
      .select('insight_type, content, card_mentioned, source_handle, scraped_at')
      .order('scraped_at', { ascending: false })
      .limit(limit)
    if (error || !data?.length) return ''
    return data.map((row: any) =>
      '[' + row.insight_type.toUpperCase() + ']' +
      (row.source_handle ? ' (@' + row.source_handle + ')' : '') +
      (row.card_mentioned ? ' re: ' + row.card_mentioned : '') +
      ': ' + row.content
    ).join('\\n')
  } catch { return '' }
}"""

new_fn = """export async function getIgInsights(limit = 20, query?: string): Promise<string> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) return ''
    const sb = createClient(supabaseUrl, serviceKey)

    // Try pgvector semantic search first if query provided
    if (query) {
      try {
        const openaiKey = process.env.OPENAI_API_KEY
        if (openaiKey) {
          const embRes = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + openaiKey },
            body: JSON.stringify({ model: 'text-embedding-3-small', input: query }),
          })
          if (embRes.ok) {
            const embData = await embRes.json()
            const embedding = embData.data?.[0]?.embedding
            if (embedding) {
              const { data: vecData } = await sb.rpc('match_intelligence', {
                query_embedding: embedding,
                match_threshold: 0.3,
                match_count: limit,
              })
              if (vecData?.length) {
                return formatInsights(vecData)
              }
            }
          }
        }
      } catch { /* fall through to recency fetch */ }
    }

    // Fallback: most recent insights from intelligence_kb
    const { data, error } = await sb
      .from('intelligence_kb')
      .select('insight_type, content, title, creator_handle, card_mentions, trust_score, source, scraped_at')
      .eq('active', true)
      .order('trust_score', { ascending: false })
      .order('scraped_at', { ascending: false })
      .limit(limit)
    if (error || !data?.length) return ''
    return formatInsights(data)
  } catch { return '' }
}

function formatInsights(rows: any[]): string {
  return rows.map((row: any) => {
    const handle = row.creator_handle ? ' (@' + row.creator_handle + ')' : ''
    const cards = row.card_mentions?.length ? ' re: ' + row.card_mentions.join(', ') : ''
    const trust = row.trust_score ? ' [trust:' + row.trust_score.toFixed(1) + ']' : ''
    const src = row.source ? ' [' + row.source.toUpperCase() + ']' : ''
    const body = row.title || row.content || ''
    return '[' + (row.insight_type || 'INSIGHT').toUpperCase() + ']' + src + handle + trust + cards + ': ' + body
  }).join('\\n')
}"""

if old_fn in content:
    content = content.replace(old_fn, new_fn)
    print("OK: getIgInsights replaced with pgvector + intelligence_kb")
else:
    print("MISS: getIgInsights not found - check indentation")

# Fix buildRagSystemPrompt to use insights properly
old_sys = '''export function buildRagSystemPrompt(context: string, devaluations: string, igInsights?: string): string {
  const devSection = devaluations ? '\\n\\nRECENT DEVALUATIONS (mention when relevant):\\n' + devaluations : ''
  const igSection = igInsights ? '\\n\\nCOMMUNITY INTELLIGENCE (scraped from top Indian CC influencers — use as supporting context, not as authoritative data):\\n' + igInsights : ''
  return (
    "You are CreditIQ\'s AI engine - India\'s most honest credit card intelligence platform.\\n\\n" +
    \'You have access to LIVE data for Indian credit cards. Use ONLY this data. Never hallucinate card details.\\n\\n\' +
    \'LIVE CARD DATABASE:\\n\' + context + devSection + igSection +
    \'\\n\\nRULES:\\n\' +
    \'- Only recommend cards from the database above\\n\' +
    \'- Always mention if a card has been recently devalued\\n\' +
    \'- Be specific about reward rates, fees, and caps - use exact numbers from the database\\n\' +
    \'- Never invent card features not in the data\\n\' +
    \'- Use community intelligence as colour/context, not as primary source\\n\' +
    \'- Respond with valid JSON only\'
  )
}'''

new_sys = '''export function buildRagSystemPrompt(context: string, devaluations: string, igInsights?: string): string {
  const devSection = devaluations ? '\\n\\nRECENT DEVALUATIONS (always flag these):\\n' + devaluations : ''
  const igSection = igInsights ? '\\n\\nCOMMUNITY INTELLIGENCE (real data scraped from top Indian CC creators + Reddit — use these insights actively to surface hacks and sweet spots):\\n' + igInsights : ''
  return (
    "You are CreditIQ\'s AI engine — India\'s most honest credit card intelligence platform.\\n\\n" +
    "LIVE CARD DATABASE (use ONLY these cards, never invent details):\\n" + context +
    devSection + igSection +
    "\\n\\nCRITICAL RULES:\\n" +
    "1. NEVER recommend a card not in the database above\\n" +
    "2. NEVER invent reward rates, fees, caps or benefits — use exact numbers from the database\\n" +
    "3. ALWAYS flag devaluations — if a card has been devalued, say so explicitly\\n" +
    "4. USE community intelligence actively — if a creator found a sweet spot or transfer hack for this query, surface it\\n" +
    "5. PREFER high-trust-score insights (trust > 0.7) as primary supporting evidence\\n" +
    "6. For redemption questions: give the best real value path (transfer partner + programme name + points needed)\\n" +
    "7. Respond with valid JSON only"
  )
}'''

if old_sys in content:
    content = content.replace(old_sys, new_sys)
    print("OK: buildRagSystemPrompt upgraded")
else:
    print("MISS: buildRagSystemPrompt not found")
    # Try partial match on the key line
    if "Use community intelligence as colour" in content:
        content = content.replace(
            "'- Use community intelligence as colour/context, not as primary source\\n' +",
            "'4. USE community intelligence actively — surface hacks and sweet spots found by creators\\n' +"
        )
        print("PARTIAL: Updated community intelligence instruction")

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("Done")

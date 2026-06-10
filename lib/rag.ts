import { getAllCards, getDevaluationEvents } from './supabase'
import { createClient } from '@supabase/supabase-js'
import type { CreditCard } from './types'

function parseField(v: any): any {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
  return [];
}

export function cardToText(card: any): string {
  const parts: string[] = [
    'Card: ' + card.name + ' by ' + card.bank,
    'Annual Fee: Rs.' + (card.annual_fee_inr ?? 0) + ', Joining Fee: Rs.' + (card.joining_fee_inr ?? 0),
    'Fee Waiver: ' + (card.fee_waiver_spend_inr ? 'Rs.' + card.fee_waiver_spend_inr + ' annual spend' : 'None'),
    'Base Reward Rate: ' + (card.base_reward_rate ?? 1) + '%',
    'Reward Currency: ' + card.reward_currency,
    'Categories: ' + (Array.isArray(card.category) ? card.category.join(', ') : card.category),
    'Tier: ' + card.tier,
    'Best For: ' + card.best_for,
  ]
  if (parseField(card.category_rewards)?.length > 0) {
    const catRewards = parseField(card.category_rewards).map((cr: any) => cr.category + ': ' + cr.rate + (cr.unit === 'percent' ? '%' : 'x') + (cr.cap_inr_monthly ? ' (cap Rs.' + cr.cap_inr_monthly + '/mo)' : '')).join(', ')
    parts.push('Category Rewards: ' + catRewards)
  }
  if (parseField(card.lounges)?.length > 0) {
    const loungeStr = parseField(card.lounges).map((l: any) => { const isUnlimited = l.notes?.toLowerCase().includes('unlimited') || (!l.visits_per_year && !l.visits_per_quarter); const visitCount = isUnlimited ? 'Unlimited' : (l.visits_per_year ?? (l.visits_per_quarter ?? 0) * 4) + ' visits/year'; const spendNote = l.notes && !isUnlimited ? ' (' + l.notes + ')' : isUnlimited && l.notes ? ' (' + l.notes + ')' : ''; return l.type + ' lounge: ' + visitCount + ' via ' + l.network + spendNote }).join(', ')
    parts.push('Lounge Access: ' + loungeStr)
  }
  if (parseField(card.redemption_options)?.length > 0) {
    const redStr = parseField(card.redemption_options).map((r: any) => r.type + (r.partner ? ' (' + r.partner + ')' : '') + ': Rs.' + r.value_per_point_inr + '/point').join(', ')
    parts.push('Redemption: ' + redStr)
  }
  if (parseField(card.highlights)?.length > 0) parts.push('Highlights: ' + parseField(card.highlights).join('; '))
  if (parseField(card.drawbacks)?.length > 0) parts.push('Drawbacks: ' + parseField(card.drawbacks).join('; '))
  if (card.forex_markup_percent !== undefined) parts.push('Forex Markup: ' + card.forex_markup_percent + '%')
  if (card.min_income_inr_monthly) parts.push('Min Income: Rs.' + card.min_income_inr_monthly + '/month')
  if (parseField(card.devaluations)?.length > 0) {
    const recent = parseField(card.devaluations).slice(0, 3).map((d: any) => d.date + ': ' + d.description + ' (' + d.impact + ' impact)').join('; ')
    parts.push('Recent Devaluations: ' + recent)
  }
  return parts.join('\n')
}

async function getQueryEmbedding(query: string): Promise<number[] | null> {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return null;
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + openaiKey },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: query }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.embedding || null;
  } catch { return null; }
}

export async function getCardNameList(): Promise<string> {
  try {
    const cards = await getAllCards();
    return cards.map(c => c.name + ' (' + c.bank + ')').join(', ');
  } catch { return ''; }
}

export async function getIgInsights(limit = 20, query?: string): Promise<string> {
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
    // No handles/sources in prompt — intelligence is CreditIQ's own
    const cards = row.card_mentions?.length ? ' [cards: ' + row.card_mentions.join(', ') + ']' : ''
    const trust = ''
    const body = row.title || row.content || ''
    return '[' + (row.insight_type || 'INSIGHT').toUpperCase() + ']' + trust + cards + ': ' + body
  }).join('\n')
}

export async function retrieveRelevantCards(
  query: string,
  options: { topK?: number; spendCategories?: string[]; maxFee?: number; intent?: 'travel' | 'cashback' | 'dining' | 'fuel' | 'shopping' | 'general' } = {}
): Promise<{ cards: CreditCard[]; context: string; devaluations: string; igInsights: string }> {
  const { topK = 8, spendCategories = [], maxFee, intent } = options
  const allCards = await getAllCards()
  const devaluationEvents = await getDevaluationEvents(30)
  const igInsights = await getIgInsights(6, query)
  const queryLower = query.toLowerCase()
  const scored = allCards.map(card => {
    let score = 0
    const cardText = cardToText(card).toLowerCase()
    if (intent === 'travel') { if (card.category?.includes('travel')) score += 30; if ((parseField(card.lounges)?.length ?? 0) > 0) score += 20; if (card.forex_markup_percent !== undefined && card.forex_markup_percent < 2) score += 15 }
    if (intent === 'cashback') { if (card.category?.includes('cashback')) score += 30; if (card.reward_currency === 'cashback') score += 20 }
    if (intent === 'dining') { if (parseField(card.category_rewards)?.some((cr: any) => cr.category === 'dining')) score += 25 }
    if (intent === 'fuel') { if ((card as any).fuel_surcharge_waiver) score += 20; if (parseField(card.category_rewards)?.some((cr: any) => cr.category === 'fuel')) score += 20 }
    if (intent === 'shopping') { if (card.category?.includes('shopping')) score += 25; if (parseField(card.category_rewards)?.some((cr: any) => ['online', 'amazon', 'flipkart'].includes(cr.category))) score += 20 }
    const keywords = queryLower.split(' ').filter((w: string) => w.length > 3)
    for (const kw of keywords) { if (cardText.includes(kw)) score += 5 }
    if (maxFee !== undefined && card.annual_fee_inr > maxFee) score = -100
    for (const cat of spendCategories) { if (parseField(card.category_rewards)?.some((cr: any) => cr.category === cat)) score += 15 }
    score += (card.expert_rating ?? 7) * 2
    return { card, score }
  })
  const relevant = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, topK).map(s => s.card)
  const finalCards = relevant.length > 0 ? relevant : allCards.slice(0, topK)
  const context = finalCards.map(card => cardToText(card)).join('\n\n---\n\n')
  const devContext = devaluationEvents.length > 0
    ? devaluationEvents.slice(0, 10).map((d: any) => (d.card_name ?? d.card_id) + ': ' + d.description + ' (' + d.event_date + ', ' + d.impact + ' impact)').join('\n')
    : allCards.filter(c => c.devaluations && c.devaluations.length > 0).flatMap(c => (c.devaluations ?? []).slice(0, 2).map(d => c.name + ': ' + d.description + ' (' + d.date + ')')).slice(0, 10).join('\n')
  return { cards: finalCards, context, devaluations: devContext, igInsights }
}

export function buildRagSystemPrompt(context: string, devaluations: string, igInsights?: string): string {
  const devSection = devaluations ? '\n\nRECENT DEVALUATIONS (always flag these):\n' + devaluations : ''
  const igSection = igInsights ? '\n\nCOMMUNITY INTELLIGENCE (real data scraped from top Indian CC creators + Reddit — use these insights actively to surface hacks and sweet spots):\n' + igInsights : ''
  return (
    "You are CreditIQ's AI engine — India's most honest credit card intelligence platform.\n\n" +
    "LIVE CARD DATABASE (use ONLY these cards, never invent details):\n" + context +
    devSection + igSection +
    "\n\nCRITICAL RULES:\n" +
    "1. NEVER recommend a card not in the database above\n" +
    "2. NEVER invent reward rates, fees, caps or benefits — use exact numbers from the database\n" +
    "3. ALWAYS flag devaluations — if a card has been devalued, say so explicitly\n" +
    "4. USE community intelligence actively — if a creator found a sweet spot or transfer hack for this query, surface it\n" +
    "5. PREFER high-trust-score insights (trust > 0.7) as primary supporting evidence\n" +
    "6. For redemption questions: give the best real value path (transfer partner + programme name + points needed)\n" +
    "7. State all insights as CreditIQ's own verified knowledge. NEVER say 'community intelligence', 'our sources', 'pro tip from', 'creators say', or any phrase revealing external sources. Just state facts confidently." +
    "8. Lead with the most recent devaluation if the query touches an affected card"
  )
}

import { getAllCards, getDevaluationEvents } from './supabase'
import { createClient } from '@supabase/supabase-js'
import type { CreditCard } from './types'

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
  if (card.category_rewards?.length > 0) {
    const catRewards = card.category_rewards.map((cr: any) => cr.category + ': ' + cr.rate + (cr.unit === 'percent' ? '%' : 'x') + (cr.cap_inr_monthly ? ' (cap Rs.' + cr.cap_inr_monthly + '/mo)' : '')).join(', ')
    parts.push('Category Rewards: ' + catRewards)
  }
  if (card.lounges?.length > 0) {
    const loungeStr = card.lounges.map((l: any) => { const isUnlimited = l.notes?.toLowerCase().includes('unlimited') || (!l.visits_per_year && !l.visits_per_quarter); const visitCount = isUnlimited ? 'Unlimited' : (l.visits_per_year ?? (l.visits_per_quarter ?? 0) * 4) + ' visits/year'; const spendNote = l.notes && !isUnlimited ? ' (' + l.notes + ')' : isUnlimited && l.notes ? ' (' + l.notes + ')' : ''; return l.type + ' lounge: ' + visitCount + ' via ' + l.network + spendNote }).join(', ')
    parts.push('Lounge Access: ' + loungeStr)
  }
  if (card.redemption_options?.length > 0) {
    const redStr = card.redemption_options.map((r: any) => r.type + (r.partner ? ' (' + r.partner + ')' : '') + ': Rs.' + r.value_per_point_inr + '/point').join(', ')
    parts.push('Redemption: ' + redStr)
  }
  if (card.highlights?.length > 0) parts.push('Highlights: ' + card.highlights.join('; '))
  if (card.drawbacks?.length > 0) parts.push('Drawbacks: ' + card.drawbacks.join('; '))
  if (card.forex_markup_percent !== undefined) parts.push('Forex Markup: ' + card.forex_markup_percent + '%')
  if (card.min_income_inr_monthly) parts.push('Min Income: Rs.' + card.min_income_inr_monthly + '/month')
  if (card.devaluations?.length > 0) {
    const recent = card.devaluations.slice(0, 3).map((d: any) => d.date + ': ' + d.description + ' (' + d.impact + ' impact)').join('; ')
    parts.push('Recent Devaluations: ' + recent)
  }
  return parts.join('\n')
}

export async function getIgInsights(limit = 20): Promise<string> {
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
    ).join('\n')
  } catch { return '' }
}

export async function retrieveRelevantCards(
  query: string,
  options: { topK?: number; spendCategories?: string[]; maxFee?: number; intent?: 'travel' | 'cashback' | 'dining' | 'fuel' | 'shopping' | 'general' } = {}
): Promise<{ cards: CreditCard[]; context: string; devaluations: string; igInsights: string }> {
  const { topK = 8, spendCategories = [], maxFee, intent } = options
  const allCards = await getAllCards()
  const devaluationEvents = await getDevaluationEvents(30)
  const igInsights = await getIgInsights(20)
  const queryLower = query.toLowerCase()
  const scored = allCards.map(card => {
    let score = 0
    const cardText = cardToText(card).toLowerCase()
    if (intent === 'travel') { if (card.category?.includes('travel')) score += 30; if ((card.lounges?.length ?? 0) > 0) score += 20; if (card.forex_markup_percent !== undefined && card.forex_markup_percent < 2) score += 15 }
    if (intent === 'cashback') { if (card.category?.includes('cashback')) score += 30; if (card.reward_currency === 'cashback') score += 20 }
    if (intent === 'dining') { if (card.category_rewards?.some((cr: any) => cr.category === 'dining')) score += 25 }
    if (intent === 'fuel') { if ((card as any).fuel_surcharge_waiver) score += 20; if (card.category_rewards?.some((cr: any) => cr.category === 'fuel')) score += 20 }
    if (intent === 'shopping') { if (card.category?.includes('shopping')) score += 25; if (card.category_rewards?.some((cr: any) => ['online', 'amazon', 'flipkart'].includes(cr.category))) score += 20 }
    const keywords = queryLower.split(' ').filter((w: string) => w.length > 3)
    for (const kw of keywords) { if (cardText.includes(kw)) score += 5 }
    if (maxFee !== undefined && card.annual_fee_inr > maxFee) score = -100
    for (const cat of spendCategories) { if (card.category_rewards?.some((cr: any) => cr.category === cat)) score += 15 }
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
  const devSection = devaluations ? '\n\nRECENT DEVALUATIONS (mention when relevant):\n' + devaluations : ''
  const igSection = igInsights ? '\n\nCOMMUNITY INTELLIGENCE (scraped from top Indian CC influencers — use as supporting context, not as authoritative data):\n' + igInsights : ''
  return (
    "You are CreditIQ's AI engine - India's most honest credit card intelligence platform.\n\n" +
    'You have access to LIVE data for Indian credit cards. Use ONLY this data. Never hallucinate card details.\n\n' +
    'LIVE CARD DATABASE:\n' + context + devSection + igSection +
    '\n\nRULES:\n' +
    '- Only recommend cards from the database above\n' +
    '- Always mention if a card has been recently devalued\n' +
    '- Be specific about reward rates, fees, and caps - use exact numbers from the database\n' +
    '- Never invent card features not in the data\n' +
    '- Use community intelligence as colour/context, not as primary source\n' +
    '- Respond with valid JSON only'
  )
}

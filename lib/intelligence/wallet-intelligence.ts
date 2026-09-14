import { buildWalletRailMatrix } from '@/lib/redemption-rails/matrix'

export type WalletIdentity = { cardId: string | null; name: string; bank: string }
export type WalletInsightMatch = {
  score: number
  matchedCards: string[]
  matchedBanks: string[]
  matchedProgrammes: string[]
  relevanceReason: string | null
  section: 'IMPORTANT_NOW' | 'FOR_YOU' | 'DISCOVER'
  shouldNotify: boolean
  severity: 'INFO' | 'OPPORTUNITY' | 'WARNING' | 'URGENT'
}

const TYPE_WEIGHT: Record<string, number> = {
  devaluation: 34, transfer_hack: 31, sweet_spot: 29, reward_tip: 24,
  card_comparison: 22, card_review: 17, strategy: 16, lounge: 15, forex: 15, general: 8,
}

function norm(value: unknown) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '') }
function looseMatch(aRaw: unknown, bRaw: unknown, minimum = 5) {
  const a = norm(aRaw), b = norm(bRaw)
  if (!a || !b) return false
  if (a === b) return true
  return Math.min(a.length, b.length) >= minimum && (a.includes(b) || b.includes(a))
}
function publishedTime(row: any) {
  const value = row.published_at || row.scraped_at || row.created_at
  const ms = value ? new Date(value).getTime() : 0
  return Number.isFinite(ms) ? ms : 0
}
function freshnessScore(row: any) {
  const ms = publishedTime(row)
  if (!ms) return 0
  const days = Math.max(0, (Date.now() - ms) / 86_400_000)
  if (days <= 2) return 45
  if (days <= 7) return 38
  if (days <= 30) return 25
  if (days <= 90) return 10
  return 2
}

function programmesForWalletCard(card: WalletIdentity) {
  const input = [{ walletKey: card.cardId || `${card.bank}:${card.name}`, bank: card.bank, cardName: card.name }]
  const rails = [
    ...buildWalletRailMatrix(input, 'flight').cards.flatMap(item => item.rails),
    ...buildWalletRailMatrix(input, 'hotel').cards.flatMap(item => item.rails),
  ]
  return [...new Set(rails.flatMap(rail => rail.type === 'LOYALTY_TRANSFER' && rail.transfer
    ? [rail.transfer.programmeId, rail.transfer.programmeName, rail.transfer.destinationCurrency]
    : rail.bookingDestination ? [rail.bookingDestination] : []
  ).filter(Boolean))]
}

function insightText(row: any) {
  return [row.title, row.content, ...(Array.isArray(row.card_mentions) ? row.card_mentions : []), ...(Array.isArray(row.bank_mentions) ? row.bank_mentions : [])]
    .filter(Boolean).join(' ')
}

export function matchInsightToWallet(row: any, wallet: WalletIdentity[]): WalletInsightMatch {
  const mentions = Array.isArray(row.card_mentions) ? row.card_mentions.map(String) : []
  const bankMentions = Array.isArray(row.bank_mentions) ? row.bank_mentions.map(String) : []
  const text = insightText(row)
  const matchedCards = wallet.filter(card => mentions.some((mention: string) => looseMatch(mention, card.name, 6)) || looseMatch(text, card.name, 7)).map(card => card.name)
  const matchedBanks = wallet.filter(card => bankMentions.some((mention: string) => looseMatch(String(mention).replace(/bank$/i, ''), String(card.bank).replace(/bank$/i, ''), 4))).map(card => card.bank)
  const programmeMatches = new Set<string>()
  for (const card of wallet) for (const programme of programmesForWalletCard(card)) if (looseMatch(text, programme, 5)) programmeMatches.add(programme)

  const uniqueCards = [...new Set(matchedCards)]
  const uniqueBanks = [...new Set(matchedBanks)]
  const matchedProgrammes = [...programmeMatches]
  const trust = Math.max(0, Math.min(1, Number(row.trust_score || 0)))
  const engagement = Math.max(0, Number(row.engagement || 0))
  const walletBoost = uniqueCards.length ? 90 + Math.min(18, (uniqueCards.length - 1) * 6) : matchedProgrammes.length ? 62 : uniqueBanks.length ? 34 : 0
  const score = freshnessScore(row) + (TYPE_WEIGHT[row.insight_type] ?? 8) + trust * 24 + Math.min(14, Math.log10(engagement + 1) * 3) + walletBoost
  const directWalletMatch = uniqueCards.length > 0 || uniqueBanks.length > 0 || matchedProgrammes.length > 0
  const materialType = ['devaluation', 'transfer_hack', 'sweet_spot'].includes(String(row.insight_type || ''))
  const important = directWalletMatch && row.insight_type === 'devaluation'
  const shouldNotify = directWalletMatch && materialType && score >= 90
  const relevanceReason = uniqueCards.length
    ? `Why you’re seeing this: you hold ${uniqueCards.slice(0, 2).join(' + ')}`
    : matchedProgrammes.length ? `Why you’re seeing this: a card in your wallet can reach ${matchedProgrammes[0]}`
    : uniqueBanks.length ? `Why you’re seeing this: you hold a ${uniqueBanks[0]} card` : null

  return {
    score, matchedCards: uniqueCards, matchedBanks: uniqueBanks, matchedProgrammes, relevanceReason,
    section: important ? 'IMPORTANT_NOW' : directWalletMatch ? 'FOR_YOU' : 'DISCOVER',
    shouldNotify,
    severity: row.insight_type === 'devaluation' ? 'WARNING' : shouldNotify ? 'OPPORTUNITY' : 'INFO',
  }
}

export async function loadWalletIdentities(sb: any, userId: string): Promise<WalletIdentity[]> {
  const [{ data: points }, { data: manual }] = await Promise.all([
    sb.from('user_points').select('card_id').eq('user_id', userId).limit(100),
    sb.from('manual_cards').select('bank,card_name').eq('user_id', userId).limit(100),
  ])
  const ids = [...new Set((points || []).map((row: any) => String(row.card_id || '')).filter(Boolean))]
  let catalogue: any[] = []
  if (ids.length) {
    const { data } = await sb.from('cards').select('id,name,bank').in('id', ids).limit(100)
    catalogue = data || []
  }
  const identities: WalletIdentity[] = [
    ...catalogue.map((row: any) => ({ cardId: String(row.id || '') || null, name: String(row.name || ''), bank: String(row.bank || '') })),
    ...(manual || []).map((row: any) => ({ cardId: null, name: String(row.card_name || ''), bank: String(row.bank || '') })),
  ].filter(card => card.name)
  const seen = new Set<string>()
  return identities.filter(card => {
    const key = `${norm(card.bank)}:${norm(card.name)}`
    if (!key || seen.has(key)) return false
    seen.add(key); return true
  })
}

export async function rankedWalletIntelligence(sb: any, userId: string, limit = 100) {
  const [wallet, intel] = await Promise.all([
    loadWalletIdentities(sb, userId),
    sb.from('intelligence_kb').select('id, source, source_url, creator_handle, creator_name, title, content, insight_type, card_mentions, bank_mentions, trust_score, engagement, published_at, scraped_at, created_at').eq('active', true).order('published_at', { ascending: false, nullsFirst: false }).limit(500),
  ])
  if (intel.error) return { wallet, ranked: [] as any[] }
  const ranked = (intel.data ?? []).map((row: any) => ({ row, match: matchInsightToWallet(row, wallet) })).sort((a: any, b: any) => {
    const sectionWeight = (section: string) => section === 'IMPORTANT_NOW' ? 3 : section === 'FOR_YOU' ? 2 : 1
    return sectionWeight(b.match.section) - sectionWeight(a.match.section) || b.match.score - a.match.score || publishedTime(b.row) - publishedTime(a.row)
  }).slice(0, limit)
  return { wallet, ranked }
}

export async function syncWalletIntelligenceNotifications(sb: any, userId: string, maxCreate = 12) {
  const { ranked } = await rankedWalletIntelligence(sb, userId, 120)
  const candidates = ranked.filter((item: any) => item.match.shouldNotify).slice(0, maxCreate)
  if (!candidates.length) return { created: 0 }
  const refs = candidates.map((item: any) => String(item.row.id))
  const { data: existing } = await sb.from('user_notifications').select('source_ref').eq('user_id', userId).eq('source_type', 'INTELLIGENCE').in('source_ref', refs)
  const seen = new Set((existing || []).map((row: any) => String(row.source_ref)))
  const inserts = candidates.filter((item: any) => !seen.has(String(item.row.id))).map((item: any) => ({
    user_id: userId,
    type: item.row.insight_type === 'devaluation' ? 'INTELLIGENCE_DEVALUATION' : 'INTELLIGENCE_OPPORTUNITY',
    title: item.row.insight_type === 'devaluation' ? 'Card update that affects your wallet' : 'Rewards opportunity for your wallet',
    body: String(item.row.title || item.row.content || 'New rewards intelligence').slice(0, 240),
    href: `/feed?insight=${encodeURIComponent(String(item.row.id))}`,
    severity: item.match.severity,
    source_type: 'INTELLIGENCE', source_ref: String(item.row.id),
    metadata: { insight_type: item.row.insight_type, matched_cards: item.match.matchedCards, matched_programmes: item.match.matchedProgrammes, relevance_reason: item.match.relevanceReason },
  }))
  if (!inserts.length) return { created: 0 }
  const { error } = await sb.from('user_notifications').insert(inserts)
  if (error) throw error
  return { created: inserts.length }
}

export function walletIntelligencePrompt(ranked: any[], maxItems = 8) {
  const relevant = ranked.filter((item: any) => item.match.section !== 'DISCOVER').slice(0, maxItems)
  if (!relevant.length) return ''
  return `\n\nPERSONALISED WALLET INTELLIGENCE (community discovery; verify issuer terms before acting):\n${relevant.map((item: any) => {
    const reason = item.match.relevanceReason ? ` — ${item.match.relevanceReason}` : ''
    return `- [${item.row.insight_type}] ${String(item.row.title || item.row.content || '').slice(0, 220)}${reason}`
  }).join('\n')}`
}

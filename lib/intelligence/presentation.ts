/** Community links are external data, never executable URLs. */
export function safeSourceUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null
  } catch { return null }
}

export type WalletFeedItem = {
  id: string; title: string; summary: string; source: string | null; source_url: string | null
  date: string | null; wallet_matches: string[]; bank_matches?: string[]; programme_matches: string[]
  relevant_card_names?: string[]
  relevance_reason: string | null; section: 'IMPORTANT_NOW' | 'FOR_YOU' | 'DISCOVER'
}

export function feedForCard(items: WalletFeedItem[], cardName?: string, bank?: string) {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  return items.filter(item => item.section !== 'DISCOVER' && (!cardName ||
    (item.relevant_card_names || item.wallet_matches).some(name => norm(name) === norm(cardName)) ||
    (!item.wallet_matches.length && item.bank_matches?.some(name => norm(name) === norm(bank || '')))))
}

export function insightAgeLabel(date: string | null, now = Date.now()) {
  const ms = date ? Date.parse(date) : NaN
  if (!Number.isFinite(ms) || ms > now) return 'Date unverified'
  return now - ms > 30 * 86_400_000 ? 'Older signal · recheck terms' : 'Recent signal · recheck terms'
}

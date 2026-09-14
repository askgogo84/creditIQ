import { createClient } from '@supabase/supabase-js'
import type { CreditCard } from './types'
import { SEED_CARDS } from './data/seed-cards'

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function cardIdentity(card: Pick<CreditCard, 'id' | 'slug' | 'name' | 'bank'>): string {
  const id = String(card.id || '').trim().toLowerCase()
  if (id) return `id:${id}`
  const slug = String(card.slug || '').trim().toLowerCase()
  if (slug) return `slug:${slug}`
  const norm = (value: unknown) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
  return `name:${norm(card.bank)}:${norm(card.name)}`
}

/**
 * Return the complete active catalogue while allowing live DB rows to override
 * the curated seed data. A partially populated `cards` table must never make a
 * valid seed card disappear from CIRA or any other catalogue consumer.
 */
export function mergeCatalogueCards(dbCards: CreditCard[], seedCards: CreditCard[] = SEED_CARDS): CreditCard[] {
  const merged = new Map<string, CreditCard>()
  for (const card of seedCards.filter(card => card.active !== false)) merged.set(cardIdentity(card), card)
  for (const card of dbCards.filter(card => card.active !== false)) merged.set(cardIdentity(card), card)
  return [...merged.values()]
}

export async function getAllCards(): Promise<CreditCard[]> {
  try {
    const sb = getSupabaseClient()
    if (!sb) return SEED_CARDS.filter(card => card.active !== false)
    const { data, error } = await sb.from('cards').select('*').eq('active', true).order('iq_score', { ascending: false })
    if (error || !data || data.length === 0) return SEED_CARDS.filter(card => card.active !== false)
    return mergeCatalogueCards(data as CreditCard[])
  } catch {
    return SEED_CARDS.filter(card => card.active !== false)
  }
}

export async function getCardBySlug(slug: string): Promise<CreditCard | null> {
  try {
    const sb = getSupabaseClient()
    if (!sb) return SEED_CARDS.find(c => c.slug === slug) ?? null
    const { data, error } = await sb.from('cards').select('*').eq('slug', slug).single()
    if (error || !data) return SEED_CARDS.find(c => c.slug === slug) ?? null
    return data as CreditCard
  } catch {
    return SEED_CARDS.find(c => c.slug === slug) ?? null
  }
}

export async function getCardById(id: string): Promise<CreditCard | null> {
  try {
    const sb = getSupabaseClient()
    if (!sb) return SEED_CARDS.find(c => c.id === id) ?? null
    const { data, error } = await sb.from('cards').select('*').eq('id', id).single()
    if (error || !data) return SEED_CARDS.find(c => c.id === id) ?? null
    return data as CreditCard
  } catch {
    return SEED_CARDS.find(c => c.id === id) ?? null
  }
}

export async function getDevaluationEvents(limit = 20): Promise<any[]> {
  try {
    const sb = getSupabaseClient()
    if (!sb) return []
    const { data, error } = await sb
      .from('devaluation_events')
      .select('*')
      .order('event_date', { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return data
  } catch {
    return []
  }
}

export async function searchCardEmbeddings(
  queryEmbedding: number[],
  matchCount = 5
): Promise<{ card_id: string; card_slug: string; content: string; similarity: number }[]> {
  try {
    const sb = getSupabaseClient()
    if (!sb) return []
    const { data, error } = await sb.rpc('match_cards', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: matchCount,
    })
    if (error || !data) return []
    return data
  } catch {
    return []
  }
}

export { getSupabaseClient }

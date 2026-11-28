
import { createClient } from '@supabase/supabase-js'
import { SEED_CARDS } from '@/lib/data/seed-cards'
import { uniqueCatalogueRoutes } from '@/lib/catalogue-routes'
import type { CreditCard } from '@/lib/types'

export type Catalogue = { cards: CreditCard[]; source: 'live_catalogue' | 'curated_snapshot' }

const columns = 'id,slug,name,bank,category,tier,joining_fee_inr,annual_fee_inr,fee_waiver_spend_inr,reward_currency,base_reward_rate,category_rewards,lounges,forex_markup_percent,redemption_options,devaluations,best_for,highlights,welcome_benefit_description,last_verified,active'

const cache = { until: 0, read: undefined as Promise<Catalogue> | undefined }

async function readCatalogue(): Promise<Catalogue> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (url && key) {
    try {
      const client = createClient(url, key, { auth: { persistSession: false } })
      const { data, error } = await client.from('cards').select(columns).eq('active', true)
        .order('slug').order('id').limit(1000).abortSignal(AbortSignal.timeout(2500))
      if (!error && data?.length) {
        return { cards: data as unknown as CreditCard[], source: 'live_catalogue' }
      }
    } catch {
      // The existing curated catalogue is a dated fallback.
    }
  }
  return { cards: uniqueCatalogueRoutes(SEED_CARDS.filter(card => card.active !== false)), source: 'curated_snapshot' }
}

export function loadPublicCatalogue(): Promise<Catalogue> {
  if (cache.read && cache.until > Date.now()) return cache.read
  cache.until = Date.now() + 300_000
  const read = readCatalogue()
  cache.read = read
  void read.then(result => {
    if (result.source === 'curated_snapshot' && cache.read === read) cache.until = Date.now() + 30_000
  })
  return read
}

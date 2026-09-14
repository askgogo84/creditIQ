import { describe, expect, it } from 'vitest'
import { SEED_CARDS } from './data/seed-cards'
import { mergeCatalogueCards } from './supabase'

describe('catalogue merge', () => {
  it('preserves seed entries when live rows are partial', () => {
    const live = SEED_CARDS.find(card => card.id === 'hdfc-infinia')
    expect(live).toBeTruthy()
    const merged = mergeCatalogueCards(live ? [live] : [])
    expect(merged.some(card => card.id === 'amex-platinum-travel')).toBe(true)
  })

  it('prefers a matching live row', () => {
    const seed = SEED_CARDS.find(card => card.id === 'hdfc-infinia')
    expect(seed).toBeTruthy()
    const merged = mergeCatalogueCards(seed ? [{ ...seed, expert_rating: 9.7 }] : [])
    expect(merged.find(card => card.id === 'hdfc-infinia')?.expert_rating).toBe(9.7)
  })
})

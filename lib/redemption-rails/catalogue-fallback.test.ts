import { describe, expect, it } from 'vitest'
import { SEED_CARDS } from '@/lib/data/seed-cards'
import { railsForCard } from './registry'

describe('catalogue travel coverage', () => {
  it('keeps every active catalogue card visible with at least one safe flight path or an explicit no-rail state', () => {
    for (const card of SEED_CARDS.filter(card => card.active)) {
      const rails = railsForCard(card.id, 'flight')
      for (const rail of rails) {
        expect(rail.cardIds).toContain(card.id)
        expect(rail.travelKinds).toContain('flight')
      }
    }
  })

  it('keeps every active catalogue card visible with at least one safe hotel path or an explicit no-rail state', () => {
    for (const card of SEED_CARDS.filter(card => card.active)) {
      const rails = railsForCard(card.id, 'hotel')
      for (const rail of rails) {
        expect(rail.cardIds).toContain(card.id)
        expect(rail.travelKinds).toContain('hotel')
      }
    }
  })

  it('never converts catalogue transfer labels into a ratio-bearing transfer rail', () => {
    const explicitCards = new Set(['hdfc-infinia', 'axis-atlas', 'axis-magnus-burgundy'])
    for (const card of SEED_CARDS.filter(card => card.active && !explicitCards.has(card.id))) {
      const rails = [...railsForCard(card.id, 'flight'), ...railsForCard(card.id, 'hotel')]
      expect(rails.every(rail => rail.type !== 'LOYALTY_TRANSFER')).toBe(true)
    }
  })
})

import { describe, expect, it } from 'vitest'
import { SEED_CARDS } from '@/lib/data/seed-cards'
import { auditIndiaTravelCoverage, coverageSummary } from './coverage-audit'

describe('India travel coverage audit', () => {
  it('classifies every active catalogue card for both flights and hotels', () => {
    const active = SEED_CARDS.filter(card => card.active)
    const rows = auditIndiaTravelCoverage()
    expect(rows).toHaveLength(active.length)
    for (const row of rows) {
      expect(['VERIFIED', 'PARTIAL', 'DISCOVERY', 'NO_ROUTE']).toContain(row.flight.level)
      expect(['VERIFIED', 'PARTIAL', 'DISCOVERY', 'NO_ROUTE']).toContain(row.hotel.level)
      expect(row.flight.railCount).toBeGreaterThanOrEqual(0)
      expect(row.hotel.railCount).toBeGreaterThanOrEqual(0)
    }
  })

  it('never treats no-route as a fabricated executable path', () => {
    for (const row of auditIndiaTravelCoverage()) {
      if (row.flight.level === 'NO_ROUTE') expect(row.flight.railCount).toBe(0)
      if (row.hotel.level === 'NO_ROUTE') expect(row.hotel.railCount).toBe(0)
    }
  })

  it('produces totals that reconcile to the active catalogue', () => {
    const summary = coverageSummary()
    const total = (bucket: Record<string, number>) => Object.values(bucket).reduce((sum, value) => sum + value, 0)
    expect(total(summary.flight)).toBe(summary.totalCards)
    expect(total(summary.hotel)).toBe(summary.totalCards)
  })
})

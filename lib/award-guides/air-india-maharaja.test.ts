import { describe, expect, it } from 'vitest'
import {
  AIR_INDIA_MAHARAJA_PUBLISHED_GUIDES,
  findAirIndiaMaharajaPublishedGuide,
} from './air-india-maharaja'

describe('Air India Maharaja published award guides', () => {
  it('returns both sourced fare tiers for a captured route and cabin', () => {
    const guide = findAirIndiaMaharajaPublishedGuide({
      programmeId: 'air-india-maharaja', origin: 'del', destination: 'sin', cabin: 'economy',
    })

    expect(guide?.authority).toBe('PLANNING_ONLY')
    expect(guide?.tiers).toEqual([
      { id: 'VALUE', label: 'Value fare', pointsMin: 12_000, pointsMax: 30_000 },
      { id: 'PRIME', label: 'Prime fare', pointsMin: 40_000, pointsMax: 40_000 },
    ])
    expect(guide?.taxesState).toBe('NOT_PUBLISHED')
    expect(guide?.evidence.sourceKind).toBe('PROGRAMME_CALCULATOR')
  })

  it('does not infer a reverse route or uncaptured cabin', () => {
    expect(findAirIndiaMaharajaPublishedGuide({
      programmeId: 'air-india-maharaja', origin: 'SIN', destination: 'DEL', cabin: 'economy',
    })).toBeNull()
    expect(findAirIndiaMaharajaPublishedGuide({
      programmeId: 'air-india-maharaja', origin: 'DEL', destination: 'SIN', cabin: 'business',
    })).toBeNull()
  })

  it('keeps every captured amount positive and Value no higher than Prime', () => {
    for (const guide of AIR_INDIA_MAHARAJA_PUBLISHED_GUIDES) {
      const [value, prime] = guide.tiers
      expect(value.pointsMin).toBeGreaterThan(0)
      expect(value.pointsMin).toBeLessThanOrEqual(value.pointsMax)
      expect(value.pointsMax).toBeLessThanOrEqual(prime.pointsMin)
      expect(prime.pointsMin).toBe(prime.pointsMax)
    }
  })
})

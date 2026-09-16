import { describe, expect, it } from 'vitest'
import { normalizePanoramaRow, programmeIdForAwardToolCode, splitPanoramaRange, validatePanoramaRange } from './awardtool-panorama'

describe('AwardTool Panorama', () => {
  it('splits a 15-day ±7 window into AwardTool-safe chunks', () => {
    const chunks = splitPanoramaRange('BLR', 'SIN', '2026-10-08', '2026-10-22')
    expect(chunks).toEqual([
      { origin: 'BLR', destination: 'SIN', from: '2026-10-08', to: '2026-10-15' },
      { origin: 'BLR', destination: 'SIN', from: '2026-10-16', to: '2026-10-22' },
    ])
  })

  it('rejects airport-pair Route Data requests longer than eight days', () => {
    expect(() => validatePanoramaRange({ origin: 'BLR', destination: 'SIN', from: '2026-10-01', to: '2026-10-09' })).toThrow(/eight days/i)
  })

  it('maps supported AwardTool programme codes to canonical CreditIQ programme ids', () => {
    expect(programmeIdForAwardToolCode('AC')).toBe('aeroplan')
    expect(programmeIdForAwardToolCode('sq')).toBe('krisflyer')
    expect(programmeIdForAwardToolCode('unknown')).toBeNull()
  })

  it('normalizes cached economy/business and nonstop point prices', () => {
    const row = normalizePanoramaRow({
      date: '2026-10-15',
      route: 'BLR-SIN',
      program: 'AC',
      points: { y: 20000, j: 40000 },
      points_ns: { y: 25000, j: 45000 },
      ls: '2026-09-08T00:00:00Z',
    })
    expect(row).toMatchObject({
      date: '2026-10-15',
      route: 'BLR-SIN',
      programmeCode: 'AC',
      programmeId: 'aeroplan',
      economyPoints: 20000,
      businessPoints: 40000,
      economyNonstopPoints: 25000,
      businessNonstopPoints: 45000,
      freshness: 'CACHED',
      verificationRequired: true,
    })
  })

  it('drops programmes that are not yet connected to CreditIQ wallet transfer rails', () => {
    expect(normalizePanoramaRow({
      date: '2026-10-15',
      route: 'BLR-SIN',
      program: 'ZZ',
      points: { y: 20000 },
    })).toBeNull()
  })
})

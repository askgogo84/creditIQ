import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const source = fs.readFileSync(path.join(process.cwd(), 'components/ciq/travel/GlobalFlightWorkspace.tsx'), 'utf8')

describe('GlobalFlightWorkspace Any cabin search', () => {
  it('defaults the cabin selector to Any', () => {
    expect(source).toContain("useState<CabinFilter>('any')")
    expect(source).toContain('<option value="any">Any cabin</option>')
  })

  it('fans Any out to Economy and Business searches', () => {
    expect(source).toContain("cabin === 'any' ? ['economy', 'business'] : [cabin]")
    expect(source).toContain('cabin: searchCabin')
    expect(source).toContain('searchCabin,')
  })

  it('does not silently include unsupported Premium Economy or First in Any', () => {
    expect(source).not.toContain("['economy', 'premium_economy', 'business', 'first']")
  })

  it('prioritizes exact-date live cash fares ahead of flexible award discovery', () => {
    expect(source).toContain('function flightResultPriority')
    expect(source).toContain('isTargetDate && hasLiveCash')
    expect(source).toContain('flightResultPriority(a, date) - flightResultPriority(b, date)')
    expect(source).toContain('Exact-date live cash fares')
  })

  it('fails closed on nearby-airport provider substitutions', () => {
    expect(source).toContain('function isExactAirportRow')
    expect(source).toContain('isExactAirportRow(row, from, destination)')
  })

  it('ranks non-stop and shorter itineraries ahead of awkward routings on the same date', () => {
    expect(source).toContain('function rowStops')
    expect(source).toContain('function rowDurationMinutes')
    expect(source).toContain('rowStops(a) - rowStops(b)')
    expect(source).toContain('rowDurationMinutes(a) - rowDurationMinutes(b)')
  })
})

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
})

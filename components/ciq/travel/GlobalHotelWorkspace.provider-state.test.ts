import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const source = fs.readFileSync(path.join(process.cwd(), 'components/ciq/travel/GlobalHotelWorkspace.tsx'), 'utf8')

describe('GlobalHotelWorkspace provider failure state', () => {
  it('keeps live provider attempts visible when hotel inventory is unavailable', () => {
    expect(source).toContain('attempts?: ProviderAttempt[]')
    expect(source).toContain('setAttempts(data.attempts ?? [])')
    expect(source).toContain('Live hotel provider status')
  })

  it('defaults hotel search to the same near-term travel window as flights', () => {
    expect(source).toContain('useState(plusDays(7))')
    expect(source).toContain('useState(plusDays(10))')
    expect(source).not.toContain('useState(plusDays(21))')
  })

  it('keeps loyalty discovery visible independently of live cash-provider failure', () => {
    expect(source).not.toContain('const [showDiscovery, setShowDiscovery]')
    expect(source).toContain('<HotelAwardDiscoveryPanel search={submittedSearch} />')
    expect(source).toContain('never the source of loyalty-programme eligibility')
    expect(source).toContain('does not turn a cash-provider failure into “no hotel redemption”')
    expect(source).not.toContain('(!liveUnavailable || showDiscovery)')
  })
})
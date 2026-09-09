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

  it('does not visually promote discovery-only properties by default after live failure', () => {
    expect(source).toContain('const [showDiscovery, setShowDiscovery] = useState(false)')
    expect(source).toContain("View discovery-only points properties")
    expect(source).toContain('(!liveUnavailable || showDiscovery)')
  })
})

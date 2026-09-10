import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const source = fs.readFileSync(path.join(process.cwd(), 'components/ciq/travel/WalletRailMatrix.tsx'), 'utf8')

describe('WalletRailMatrix hotel loyalty routes', () => {
  it('shows sourced loyalty transfers during a generic hotel search', () => {
    expect(source).toContain("if (travelKind === 'hotel' && !programmeId) return true")
    expect(source).toContain("visibleRails(card.rails, programmeId, travelKind)")
    expect(source).toContain('Hotel loyalty transfer desk')
    expect(source).toContain('Check points price → transfer → book direct')
  })

  it('keeps direct programme booking actions attached to sourced rails', () => {
    expect(source).toContain('rail.bookingUrl &&')
    expect(source).toContain('Check points & book →')
    expect(source).toContain('loyalty transfers are irreversible')
  })

  it('does not make generic flight search expose unrelated transfer programmes', () => {
    expect(source).toContain("if (travelKind === 'hotel' && !programmeId) return true")
    expect(source).toContain('return !!programmeId && rail.transfer?.programmeId === programmeId')
  })
})

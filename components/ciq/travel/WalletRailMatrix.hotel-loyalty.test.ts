import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildWalletRailMatrix } from '@/lib/redemption-rails'

const source = fs.readFileSync(path.join(process.cwd(), 'components/ciq/travel/WalletRailMatrix.tsx'), 'utf8')
const axisWallet = [{ walletKey: 'axis', bank: 'Axis Bank', cardName: 'Axis Atlas', pointsBalance: 50000, balanceVerified: true }]

describe('WalletRailMatrix loyalty routes', () => {
  it('keeps sourced loyalty transfers discoverable during a generic hotel search', () => {
    const hotel = buildWalletRailMatrix(axisWallet, 'hotel', null)
    expect(hotel.cards[0].rails.some(rail => rail.type === 'LOYALTY_TRANSFER')).toBe(true)
    expect(source).toContain('Hotel loyalty transfer desk')
    expect(source).toContain('Check points price → transfer → book direct')
  })

  it('keeps direct programme booking actions attached to sourced rails', () => {
    expect(source).toContain('rail.bookingUrl &&')
    expect(source).toContain('Check points & book →')
    expect(source).toContain('loyalty transfers are irreversible')
  })

  it('does not make a generic flight search expose unrelated transfer programmes', () => {
    const genericFlight = buildWalletRailMatrix(axisWallet, 'flight', null)
    expect(genericFlight.cards[0].rails.some(rail => rail.type === 'LOYALTY_TRANSFER')).toBe(false)

    const selectedProgramme = buildWalletRailMatrix(axisWallet, 'flight', 'krisflyer')
    expect(selectedProgramme.cards[0].rails.some(rail => rail.transfer?.programmeId === 'krisflyer')).toBe(true)
  })
})
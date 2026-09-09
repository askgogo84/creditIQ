import { describe, expect, it } from 'vitest'
import {
  cashRetainRail,
  queryRails,
  railsForCard,
  railsForWallet,
  transferRailFor,
} from './registry'

describe('redemption rail registry', () => {
  it('scopes issuer transfer facts to the exact card product', () => {
    expect(transferRailFor('hdfc-infinia', 'krisflyer')).not.toBeNull()
    expect(transferRailFor('hdfc-regalia-gold', 'krisflyer')).toBeNull()
    expect(transferRailFor('hdfc-diners-black', 'krisflyer')).toBeNull()
  })

  it('uses the captured HDFC Infinia Marriott ratio as exact 2:1, not stale seed display data', () => {
    const rail = transferRailFor('hdfc-infinia', 'marriott-bonvoy')
    expect(rail?.transfer?.ratio).toEqual({ fromUnits: 2, toUnits: 1 })
    expect(rail?.executionState).toBe('RATIO_ONLY')
  })

  it('never invents transfer minimum or increment for captured HDFC routes', () => {
    const rail = transferRailFor('hdfc-infinia', 'accor-all')
    expect(rail?.transfer?.minimumBankPoints).toBeNull()
    expect(rail?.transfer?.incrementBankPoints).toBeNull()
    expect(rail?.executionState).toBe('RATIO_ONLY')
  })

  it('structures the sourced HDFC Infinia SmartBuy value and 70% travel cap', () => {
    const rail = railsForCard('hdfc-infinia', 'flight').find((item) => item.id === 'hdfc-infinia-smartbuy-travel')
    expect(rail?.portal?.valuePerPointPaise).toBe(100)
    expect(rail?.portal?.maxPointsShareBps).toBe(7000)
    expect(rail?.portal?.feeMinor).toBe(0)
    expect(rail?.executionState).toBe('CHECKOUT_REQUIRED')
  })

  it('wires Axis Atlas exact-card Air India transfer terms into the rail registry', () => {
    const rail = transferRailFor('axis-atlas', 'air-india-maharaja')
    expect(rail?.transfer?.ratio).toEqual({ fromUnits: 1, toUnits: 2 })
    expect(rail?.transfer?.minimumBankPoints).toBe(500)
    expect(rail?.transfer?.incrementBankPoints).toBeNull()
    expect(rail?.executionState).toBe('RATIO_ONLY')
  })

  it('structures Axis Atlas Travel EDGE value while keeping final fee at checkout', () => {
    const rail = railsForCard('axis-atlas', 'flight').find((item) => item.id === 'axis-atlas-travel-edge')
    expect(rail?.portal?.valuePerPointPaise).toBe(100)
    expect(rail?.portal?.maxPointsShareBps).toBe(10_000)
    expect(rail?.portal?.feeMinor).toBeNull()
    expect(rail?.notes?.join(' ')).toMatch(/₹99/i)
  })

  it('keeps Amex Travel visible without inventing an itinerary conversion rate', () => {
    const rails = railsForCard('amex-platinum-travel', 'flight')
    expect(rails).toHaveLength(1)
    expect(rails[0].type).toBe('MERCHANT_PAY_WITH_POINTS')
    expect(rails[0].executionState).toBe('CHECKOUT_REQUIRED')
    expect(rails[0].portal?.valuePerPointPaise).toBeNull()
    expect(rails[0].notes?.join(' ')).toMatch(/1,000 Membership Rewards/i)
  })

  it('does not use a flight transfer route when evaluating an unrelated award programme', () => {
    const rails = queryRails({ cardId: 'hdfc-infinia', travelKind: 'flight', programmeId: 'air-india-maharaja' })
    const transferIds = rails.filter((r) => r.type === 'LOYALTY_TRANSFER').map((r) => r.transfer?.programmeId)
    expect(transferIds).toEqual(['air-india-maharaja'])
    expect(rails.some((r) => r.type === 'BANK_TRAVEL_PORTAL')).toBe(true)
  })

  it('returns every known rail for every exact card in the wallet plus cash', () => {
    const rails = railsForWallet(
      ['hdfc-infinia', 'axis-atlas', 'amex-platinum-travel', 'sbi-elite'],
      'flight',
      'krisflyer',
    )
    expect(rails.some((r) => r.id === 'hdfc-infinia-transfer-krisflyer')).toBe(true)
    expect(rails.some((r) => r.id === 'axis-atlas-transfer-krisflyer')).toBe(true)
    expect(rails.some((r) => r.id === 'axis-atlas-travel-edge')).toBe(true)
    expect(rails.some((r) => r.id === 'amex-platinum-travel-amex-travel')).toBe(true)
    expect(rails.some((r) => r.id === 'sbi-elite-mmt-voucher')).toBe(true)
    expect(rails.some((r) => r.type === 'CASH_RETAIN')).toBe(true)
  })

  it('does not fabricate a rail for an unsupported card', () => {
    expect(railsForCard('au-zenith-plus', 'flight')).toEqual([])
  })

  it('cash retain is always executable and does not impersonate a card', () => {
    expect(cashRetainRail('hotel')).toMatchObject({
      type: 'CASH_RETAIN',
      cardIds: [],
      executionState: 'EXECUTABLE',
      travelKinds: ['hotel'],
    })
  })
})

import { describe, expect, it } from 'vitest'
import { allRailsFromMatrix, buildWalletRailMatrix } from './matrix'

describe('wallet redemption rail matrix', () => {
  it('keeps supported and unresolved wallet cards visible', () => {
    const matrix = buildWalletRailMatrix([
      { walletKey: '1', bank: 'HDFC', cardName: 'HDFC Infinia Metal Edition', pointsBalance: 50000, balanceVerified: true },
      { walletKey: '2', bank: 'AU', cardName: 'Unknown Legacy Corporate Card', pointsBalance: 12000, balanceVerified: true },
    ], 'flight', 'krisflyer')

    expect(matrix.cards).toHaveLength(2)
    expect(matrix.cards[0]).toMatchObject({ cardId: 'hdfc-infinia', status: 'VERIFICATION_REQUIRED' })
    expect(matrix.cards[0].rails.some((rail) => rail.id === 'hdfc-infinia-transfer-krisflyer')).toBe(true)
    expect(matrix.cards[1]).toMatchObject({ cardId: null, status: 'NO_VERIFIED_REDEMPTION_RAIL', rails: [] })
  })

  it('does not inherit Infinia transfer rails onto Regalia Gold but exposes its own sourced SmartBuy path', () => {
    const matrix = buildWalletRailMatrix([
      { walletKey: 'r', bank: 'HDFC', cardName: 'HDFC Regalia Gold', pointsBalance: 25000 },
    ], 'flight', 'krisflyer')

    const transferRails = matrix.cards[0].rails.filter((rail) => rail.type === 'LOYALTY_TRANSFER')
    expect(transferRails).toEqual([])
    const smartBuy = matrix.cards[0].rails.find(rail => rail.id === 'hdfc-regalia-gold-smartbuy-travel')
    expect(smartBuy?.portal?.valuePerPointPaise).toBe(50)
    expect(smartBuy?.portal?.maxPointsShareBps).toBe(7000)
  })

  it('exposes Diners Black exact transfer and SmartBuy paths without borrowing Infinia ratios', () => {
    const hotel = buildWalletRailMatrix([
      { walletKey: 'd', bank: 'HDFC', cardName: 'HDFC Diners Club Black', pointsBalance: 90000 },
    ], 'hotel')
    const accor = hotel.cards[0].rails.find(rail => rail.transfer?.programmeId === 'accor-all')
    expect(accor?.transfer?.ratio).toEqual({ fromUnits: 2, toUnits: 1 })
    expect(hotel.cards[0].rails.some(rail => rail.id === 'hdfc-diners-black-smartbuy-travel')).toBe(true)
  })

  it('exposes current Magnus for Burgundy partner ratios for both flights and hotels', () => {
    const flight = buildWalletRailMatrix([
      { walletKey: 'm', bank: 'Axis', cardName: 'Axis Magnus for Burgundy', pointsBalance: 70000 },
    ], 'flight')
    const hotel = buildWalletRailMatrix([
      { walletKey: 'm2', bank: 'Axis', cardName: 'Axis Magnus for Burgundy', pointsBalance: 70000 },
    ], 'hotel')

    expect(flight.cards[0].rails.find(rail => rail.transfer?.programmeId === 'krisflyer')?.transfer?.ratio)
      .toEqual({ fromUnits: 5, toUnits: 4 })
    expect(hotel.cards[0].rails.find(rail => rail.transfer?.programmeId === 'ihg-one')?.transfer?.ratio)
      .toEqual({ fromUnits: 5, toUnits: 4 })
  })

  it('surfaces transfer hubs for Amex and HSBC without inventing partner-specific ratios', () => {
    const matrix = buildWalletRailMatrix([
      { walletKey: 'a', bank: 'American Express', cardName: 'American Express Platinum Travel', pointsBalance: 52000 },
      { walletKey: 'h', bank: 'HSBC', cardName: 'HSBC TravelOne Credit Card', pointsBalance: 45000 },
    ], 'hotel')

    const amexHub = matrix.cards[0].rails.find(rail => rail.id === 'amex-membership-rewards-transfer-hub')
    const hsbcHub = matrix.cards[1].rails.find(rail => rail.id === 'hsbc-premium-rewards-transfer-hub')
    expect(amexHub?.executionState).toBe('DISCOVERY_ONLY')
    expect(amexHub?.transfer).toBeUndefined()
    expect(hsbcHub?.executionState).toBe('DISCOVERY_ONLY')
    expect(hsbcHub?.transfer).toBeUndefined()
  })

  it('preserves wallet provenance without promoting self-entered balances', () => {
    const matrix = buildWalletRailMatrix([
      { walletKey: 'a', bank: 'American Express', cardName: 'American Express Platinum Travel', pointsBalance: 52000, balanceVerified: false },
    ], 'hotel')

    expect(matrix.cards[0].balanceVerified).toBe(false)
    expect(matrix.cards[0].pointsBalance).toBe(52000)
  })

  it('deduplicates repeated wallet rows by wallet key only', () => {
    const matrix = buildWalletRailMatrix([
      { walletKey: 'same', bank: 'HDFC', cardName: 'HDFC Infinia Metal Edition' },
      { walletKey: 'same', bank: 'HDFC', cardName: 'HDFC Infinia Metal Edition' },
      { walletKey: 'other', bank: 'HDFC', cardName: 'HDFC Infinia Metal Edition' },
    ], 'hotel', 'marriott-bonvoy')

    expect(matrix.cards).toHaveLength(2)
  })

  it('always exposes cash as an executable alternative', () => {
    const matrix = buildWalletRailMatrix([], 'hotel', 'marriott-bonvoy')
    expect(matrix.cashRail).toMatchObject({ type: 'CASH_RETAIN', executionState: 'EXECUTABLE' })
    expect(allRailsFromMatrix(matrix).map((rail) => rail.type)).toEqual(['CASH_RETAIN'])
  })
})

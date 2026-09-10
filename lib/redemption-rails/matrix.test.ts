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

  it('uses exact captured Amex Marriott and Hilton transfer ratios while keeping the broad hub', () => {
    const marriott = buildWalletRailMatrix([
      { walletKey: 'a', bank: 'American Express', cardName: 'American Express Platinum Travel', pointsBalance: 52000 },
    ], 'hotel', 'marriott-bonvoy')
    const hilton = buildWalletRailMatrix([
      { walletKey: 'b', bank: 'American Express', cardName: 'American Express Platinum Travel', pointsBalance: 52000 },
    ], 'hotel', 'hilton-honors')

    const marriottRail = marriott.cards[0].rails.find(rail => rail.transfer?.programmeId === 'marriott-bonvoy')
    const hiltonRail = hilton.cards[0].rails.find(rail => rail.transfer?.programmeId === 'hilton-honors')
    const amexHub = marriott.cards[0].rails.find(rail => rail.bookingDestination === 'Amex Membership Rewards transfer partners')

    expect(marriottRail?.transfer?.ratio).toEqual({ fromUnits: 100, toUnits: 100 })
    expect(marriottRail?.transfer?.minimumBankPoints).toBe(100)
    expect(marriottRail?.transfer?.incrementBankPoints).toBe(100)
    expect(hiltonRail?.transfer?.ratio).toEqual({ fromUnits: 1000, toUnits: 1500 })
    expect(hiltonRail?.transfer?.minimumBankPoints).toBe(1000)
    expect(hiltonRail?.transfer?.incrementBankPoints).toBe(1000)
    expect(amexHub?.executionState).toBe('DISCOVERY_ONLY')
  })

  it('uses exact captured Amex airline ratios including KrisFlyer and Virgin Atlantic', () => {
    const krisflyer = buildWalletRailMatrix([
      { walletKey: 'k', bank: 'AmEx', cardName: 'Amex Membership Rewards Credit Card', pointsBalance: 52000 },
    ], 'flight', 'krisflyer')
    const virgin = buildWalletRailMatrix([
      { walletKey: 'v', bank: 'AmEx', cardName: 'American Express SmartEarn', pointsBalance: 18000 },
    ], 'flight', 'virgin-atlantic-flying-club')

    expect(krisflyer.cards[0].rails.find(rail => rail.transfer?.programmeId === 'krisflyer')?.transfer?.ratio)
      .toEqual({ fromUnits: 800, toUnits: 400 })
    expect(virgin.cards[0].rails.find(rail => rail.transfer?.programmeId === 'virgin-atlantic-flying-club')?.transfer?.ratio)
      .toEqual({ fromUnits: 800, toUnits: 640 })
  })

  it('keeps the Membership Rewards transfer hub visible for SmartEarn when a partner is not in the capture', () => {
    const matrix = buildWalletRailMatrix([
      { walletKey: 's', bank: 'AmEx', cardName: 'American Express SmartEarn', pointsBalance: 18000 },
    ], 'flight', 'emirates-skywards')

    expect(matrix.cards[0].rails.some(rail => rail.bookingDestination === 'Amex Membership Rewards transfer partners')).toBe(true)
  })

  it('surfaces HSBC transfer hub without inventing partner-specific ratios', () => {
    const matrix = buildWalletRailMatrix([
      { walletKey: 'h', bank: 'HSBC', cardName: 'HSBC TravelOne Credit Card', pointsBalance: 45000 },
    ], 'hotel')

    const hsbcHub = matrix.cards[0].rails.find(rail => rail.id === 'hsbc-premium-rewards-transfer-hub')
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

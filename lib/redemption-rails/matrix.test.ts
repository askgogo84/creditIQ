import { describe, expect, it } from 'vitest'
import { allRailsFromMatrix, buildWalletRailMatrix } from './matrix'

describe('wallet redemption rail matrix', () => {
  it('keeps supported and unsupported wallet cards visible', () => {
    const matrix = buildWalletRailMatrix([
      { walletKey: '1', bank: 'HDFC', cardName: 'HDFC Infinia Metal Edition', pointsBalance: 50000, balanceVerified: true },
      { walletKey: '2', bank: 'AU', cardName: 'AU Zenith Plus', pointsBalance: 12000, balanceVerified: true },
    ], 'flight', 'krisflyer')

    expect(matrix.cards).toHaveLength(2)
    expect(matrix.cards[0]).toMatchObject({ cardId: 'hdfc-infinia', status: 'VERIFICATION_REQUIRED' })
    expect(matrix.cards[0].rails.some((rail) => rail.id === 'hdfc-infinia-transfer-krisflyer')).toBe(true)
    expect(matrix.cards[1]).toMatchObject({ status: 'NO_VERIFIED_REDEMPTION_RAIL', rails: [] })
  })

  it('does not inherit Infinia transfer rails onto another HDFC card', () => {
    const matrix = buildWalletRailMatrix([
      { walletKey: 'r', bank: 'HDFC', cardName: 'HDFC Regalia Gold', pointsBalance: 25000 },
    ], 'flight', 'krisflyer')

    const transferRails = matrix.cards[0].rails.filter((rail) => rail.type === 'LOYALTY_TRANSFER')
    expect(transferRails).toEqual([])
  })

  it('preserves wallet provenance without promoting self-entered balances', () => {
    const matrix = buildWalletRailMatrix([
      { walletKey: 'a', bank: 'American Express', cardName: 'American Express Platinum Travel Credit Card', pointsBalance: 52000, balanceVerified: false },
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

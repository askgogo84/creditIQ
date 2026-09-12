import { describe, expect, it } from 'vitest'
import { rankWalletRails } from '@/lib/redemption-ranking'
import type { WalletRailMatrix } from '@/lib/redemption-rails/matrix'

function matrixFor(cardId: string, rail: any): WalletRailMatrix {
  return {
    travelKind: 'hotel',
    programmeId: 'hilton-honors',
    cards: [{
      walletKey: 'wallet-1',
      cardId,
      bank: cardId.startsWith('amex') ? 'American Express' : 'Test Bank',
      cardName: cardId,
      pointsBalance: 100000,
      balanceVerified: true,
      rails: [rail],
    }],
    cashRail: {
      id: 'cash-retain-hotel', cardIds: [], issuer: 'CASH', type: 'CASH_RETAIN',
      travelKinds: ['hotel'], executionState: 'EXECUTABLE', evidence: [],
    },
  } as WalletRailMatrix
}

describe('wallet redemption display economics', () => {
  it('calculates the bank points needed from a known hotel award price and sourced ratio', () => {
    const rail = {
      id: 'amex-hilton-test', cardIds: ['amex-platinum-travel'], issuer: 'American Express',
      type: 'LOYALTY_TRANSFER', travelKinds: ['hotel'], executionState: 'RATIO_ONLY', evidence: [],
      transfer: {
        programmeId: 'hilton-honors', programmeName: 'Hilton Honors', destinationCurrency: 'Hilton Honors Points',
        ratio: { fromUnits: 1000, toUnits: 1500 }, durationText: '3–5 working days', durationHoursMax: null,
        irreversible: true, minimumBankPoints: null, incrementBankPoints: null,
      },
    }
    const matrix = matrixFor('amex-platinum-travel', rail as any)
    const ranking = rankWalletRails(matrix, {
      travelKind: 'hotel', programmeId: 'hilton-honors', programmePointsRequired: 45000,
      awardTaxesMinor: null, awardTaxesCurrency: null, cashPriceMinor: null, cashCurrency: null,
    })
    const candidate = ranking.candidates.find(c => c.railId === 'amex-hilton-test')
    expect(candidate?.bankPointsTargetMinimum).toBe(30000)
    expect(candidate?.comparisonState).toBe('PROJECTED_NEEDS_VERIFICATION')
  })
})

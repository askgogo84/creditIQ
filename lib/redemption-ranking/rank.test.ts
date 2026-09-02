import { describe, expect, it } from 'vitest'
import { buildWalletRailMatrix, cashRetainRail, type WalletRailMatrix } from '@/lib/redemption-rails'
import { rankWalletRails } from './rank'

function demoMatrix(hdfcPoints = 68_500) {
  return buildWalletRailMatrix([
    { walletKey: 'hdfc-2184', bank: 'HDFC Bank', cardName: 'HDFC Infinia Metal Edition', pointsBalance: hdfcPoints, balanceVerified: true },
    { walletKey: 'axis-4412', bank: 'Axis Bank', cardName: 'Axis Atlas', pointsBalance: 31_200, balanceVerified: true },
    { walletKey: 'amex-1009', bank: 'American Express', cardName: 'American Express Platinum Travel', pointsBalance: 52_000, balanceVerified: false },
    { walletKey: 'sbi-7831', bank: 'SBI Card', cardName: 'SBI ELITE', pointsBalance: 18_600, balanceVerified: true },
    { walletKey: 'au-3302', bank: 'AU', cardName: 'AU Zenith Plus', pointsBalance: 12_000, balanceVerified: true },
  ], 'flight', 'krisflyer')
}

const flightPricing = {
  travelKind: 'flight' as const,
  programmeId: 'krisflyer',
  programmePointsRequired: 43_000,
  awardTaxesMinor: 418_000,
  awardTaxesCurrency: 'INR',
  cashPriceMinor: 5_260_000,
  cashCurrency: 'INR',
}

describe('wallet rail ranking', () => {
  it('keeps cash as the executable winner while surfacing a cheaper ratio-only transfer as projected', () => {
    const result = rankWalletRails(demoMatrix(), flightPricing)

    expect(result.bestExecutable?.railType).toBe('CASH_RETAIN')
    expect(result.bestExecutable?.cashPayableMinor).toBe(5_260_000)

    expect(result.bestProjected?.railId).toBe('hdfc-infinia-transfer-krisflyer')
    expect(result.bestProjected?.bankPointsTargetMinimum).toBe(43_000)
    expect(result.bestProjected?.bankPointsToTransferExact).toBeNull()
    expect(result.bestProjected?.cashPayableMinor).toBe(418_000)
    expect(result.bestProjected?.affordability).toBe('POSSIBLY_AFFORDABLE')
    expect(result.recommendationState).toBe('PROJECTED_WINNER_NEEDS_VERIFICATION')
  })

  it('does not call a ratio-only transfer affordable when the wallet is below the ratio-derived target', () => {
    const result = rankWalletRails(demoMatrix(30_000), flightPricing)
    const hdfc = result.candidates.find((candidate) => candidate.railId === 'hdfc-infinia-transfer-krisflyer')

    expect(hdfc?.affordability).toBe('DEFINITELY_UNAFFORDABLE')
    expect(hdfc?.comparisonState).toBe('NOT_COMPARABLE')
    expect(result.bestProjected).toBeNull()
    expect(result.bestExecutable?.railType).toBe('CASH_RETAIN')
    expect(result.recommendationState).toBe('CASH_ONLY')
  })

  it('refuses to compare award taxes to an INR cash fare when taxes are in another currency and no FX is supplied', () => {
    const result = rankWalletRails(demoMatrix(), {
      ...flightPricing,
      awardTaxesMinor: 4_180,
      awardTaxesCurrency: 'USD',
    })
    const hdfc = result.candidates.find((candidate) => candidate.railId === 'hdfc-infinia-transfer-krisflyer')

    expect(hdfc?.cashPayableMinor).toBeNull()
    expect(hdfc?.reasons.join(' ')).toMatch(/different currencies/i)
    expect(result.bestProjected).toBeNull()
    expect(result.bestExecutable?.railType).toBe('CASH_RETAIN')
  })

  it('preserves unsupported wallet cards instead of pretending another card rule applies', () => {
    const result = rankWalletRails(demoMatrix(), flightPricing)
    expect(result.unsupportedWalletCards).toContainEqual({
      walletKey: 'au-3302',
      bank: 'AU',
      cardName: 'AU Zenith Plus',
    })
  })

  it('keeps checkout-only portal rails visible but out of economic ranking when value/cap are unknown', () => {
    const result = rankWalletRails(demoMatrix(), flightPricing)
    const axisPortal = result.candidates.find((candidate) => candidate.railId === 'axis-atlas-travel-edge')

    expect(axisPortal?.comparisonState).toBe('PROJECTED_NEEDS_VERIFICATION')
    expect(axisPortal?.cashPayableMinor).toBeNull()
    expect(axisPortal?.reasons.join(' ')).toMatch(/value\/cap/i)
  })

  it('can produce an executable transfer winner only when exact transfer mechanics are present', () => {
    const matrix: WalletRailMatrix = {
      travelKind: 'flight',
      programmeId: 'demo-air',
      cards: [{
        walletKey: 'demo-card',
        bank: 'Demo Bank',
        cardName: 'Demo Exact Card',
        cardId: 'demo-exact',
        pointsBalance: 50_000,
        balanceVerified: true,
        status: 'EXECUTABLE',
        rails: [{
          id: 'demo-exact-transfer',
          cardIds: ['demo-exact'],
          issuer: 'Demo Bank',
          type: 'LOYALTY_TRANSFER',
          travelKinds: ['flight'],
          executionState: 'EXECUTABLE',
          evidence: [{ kind: 'ISSUER_CAPTURE', sourceId: 'fixture' }],
          transfer: {
            programmeId: 'demo-air',
            programmeName: 'Demo Air',
            destinationCurrency: 'Demo Miles',
            ratio: { fromUnits: 1, toUnits: 1 },
            durationText: 'instant',
            durationHoursMax: 0,
            irreversible: true,
            minimumBankPoints: 1_000,
            incrementBankPoints: 1_000,
          },
        }],
      }],
      cashRail: cashRetainRail('flight'),
    }

    const result = rankWalletRails(matrix, {
      travelKind: 'flight',
      programmeId: 'demo-air',
      programmePointsRequired: 43_000,
      awardTaxesMinor: 418_000,
      awardTaxesCurrency: 'INR',
      cashPriceMinor: 5_260_000,
      cashCurrency: 'INR',
    })

    expect(result.bestExecutable?.railId).toBe('demo-exact-transfer')
    expect(result.bestExecutable?.bankPointsToTransferExact).toBe(43_000)
    expect(result.bestExecutable?.cashPayableMinor).toBe(418_000)
    expect(result.recommendationState).toBe('EXECUTABLE_WINNER')
  })

  it('still surfaces a projected transfer when no matched cash benchmark exists, without inventing an executable winner', () => {
    const result = rankWalletRails(demoMatrix(), {
      ...flightPricing,
      cashPriceMinor: null,
      cashCurrency: null,
      awardTaxesCurrency: 'INR',
    })

    // Without a comparable cash currency there is no safe economic comparison.
    expect(result.bestExecutable).toBeNull()
    expect(result.bestProjected).toBeNull()
    expect(result.recommendationState).toBe('NO_COMPARABLE_PATH')
  })
})

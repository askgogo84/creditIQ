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
  it('surfaces the strongest sourced transfer as projected while cash remains executable', () => {
    const result = rankWalletRails(demoMatrix(), flightPricing)

    expect(result.bestExecutable?.railType).toBe('CASH_RETAIN')
    expect(result.bestExecutable?.cashPayableMinor).toBe(5_260_000)

    // Axis Atlas -> KrisFlyer is a verified 1:2 edge in the 2026 Atlas graph,
    // so 43,000 KrisFlyer miles require a ratio-derived 21,500 EDGE Miles.
    expect(result.bestProjected?.railId).toBe('axis-atlas-transfer-krisflyer')
    expect(result.bestProjected?.bankPointsTargetMinimum).toBe(21_500)
    expect(result.bestProjected?.bankPointsToTransferExact).toBeNull()
    expect(result.bestProjected?.cashPayableMinor).toBe(418_000)
    expect(result.bestProjected?.affordability).toBe('POSSIBLY_AFFORDABLE')
    expect(result.recommendationState).toBe('PROJECTED_WINNER_NEEDS_VERIFICATION')

    const hdfc = result.candidates.find((candidate) => candidate.railId === 'hdfc-infinia-transfer-krisflyer')
    expect(hdfc?.bankPointsTargetMinimum).toBe(43_000)
    expect(hdfc?.cashPayableMinor).toBe(418_000)
  })

  it('does not call the HDFC transfer affordable when its wallet is below target and still evaluates other exact-card paths', () => {
    const result = rankWalletRails(demoMatrix(30_000), flightPricing)
    const hdfc = result.candidates.find((candidate) => candidate.railId === 'hdfc-infinia-transfer-krisflyer')

    expect(hdfc?.affordability).toBe('DEFINITELY_UNAFFORDABLE')
    expect(hdfc?.comparisonState).toBe('NOT_COMPARABLE')
    expect(result.bestProjected?.railId).toBe('axis-atlas-transfer-krisflyer')
    expect(result.bestExecutable?.railType).toBe('CASH_RETAIN')
    expect(result.recommendationState).toBe('PROJECTED_WINNER_NEEDS_VERIFICATION')
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
    // Portal economics are independent of the award-tax currency and remain
    // projectable against the INR cash fare. Infinia's sourced 70% SmartBuy cap
    // leaves less cash than this wallet's current Atlas balance on Travel EDGE.
    expect(result.bestProjected?.railId).toBe('hdfc-infinia-smartbuy-travel')
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

  it('projects Axis Atlas Travel EDGE points instead of hiding a sourced portal redemption', () => {
    const result = rankWalletRails(demoMatrix(), flightPricing)
    const axisPortal = result.candidates.find((candidate) => candidate.railId === 'axis-atlas-travel-edge')

    expect(axisPortal?.comparisonState).toBe('PROJECTED_NEEDS_VERIFICATION')
    expect(axisPortal?.bankPointsTargetMinimum).toBe(31_200)
    expect(axisPortal?.cashPayableMinor).toBe(2_140_000)
    expect(axisPortal?.cashCurrency).toBe('INR')
    expect(axisPortal?.reasons.join(' ')).toMatch(/31,200 points/i)
    expect(axisPortal?.reasons.join(' ')).toMatch(/redemption fee/i)
  })

  it('projects the HDFC Infinia SmartBuy 70% points share while keeping checkout verification', () => {
    const matrix = buildWalletRailMatrix([
      { walletKey: 'hdfc', bank: 'HDFC Bank', cardName: 'HDFC Infinia Metal Edition', pointsBalance: 100_000, balanceVerified: true },
    ], 'flight', null)
    const result = rankWalletRails(matrix, {
      travelKind: 'flight',
      programmeId: null,
      programmePointsRequired: null,
      awardTaxesMinor: null,
      awardTaxesCurrency: null,
      cashPriceMinor: 1_075_000,
      cashCurrency: 'INR',
    })
    const portal = result.candidates.find((candidate) => candidate.railId === 'hdfc-infinia-smartbuy-travel')

    expect(portal?.bankPointsTargetMinimum).toBe(7_525)
    expect(portal?.cashPayableMinor).toBe(322_500)
    expect(portal?.comparisonState).toBe('PROJECTED_NEEDS_VERIFICATION')
    expect(portal?.reasons.join(' ')).toMatch(/checkout/i)
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

  it('still surfaces no economic winner when no matched cash benchmark exists', () => {
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

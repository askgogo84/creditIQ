import { describe, expect, it } from 'vitest'
import { buildWalletRailMatrix } from '@/lib/redemption-rails'
import { rankWalletRails } from './rank'

describe('issuer redemption caps', () => {
  it('bounds Infinia SmartBuy projection at 150,000 RP per calendar month', () => {
    const matrix = buildWalletRailMatrix([
      {
        walletKey: 'hdfc',
        bank: 'HDFC Bank',
        cardName: 'HDFC Infinia Metal Edition',
        pointsBalance: 300_000,
        balanceVerified: true,
      },
    ], 'flight', null)

    const result = rankWalletRails(matrix, {
      travelKind: 'flight',
      programmeId: null,
      programmePointsRequired: null,
      awardTaxesMinor: null,
      awardTaxesCurrency: null,
      cashPriceMinor: 30_000_000,
      cashCurrency: 'INR',
    })

    const portal = result.candidates.find(candidate => candidate.railId === 'hdfc-infinia-smartbuy-travel')
    expect(portal?.bankPointsTargetMinimum).toBe(150_000)
    expect(portal?.cashPayableMinor).toBe(15_000_000)
    expect(portal?.reasons.join(' ')).toMatch(/150,000 Reward Points per calendar month/i)
    expect(portal?.reasons.join(' ')).toMatch(/remaining monthly allowance must be verified/i)
  })

  it('blocks an Atlas Group A transfer above the 30,000 EDGE Miles annual group ceiling', () => {
    const matrix = buildWalletRailMatrix([
      {
        walletKey: 'axis',
        bank: 'Axis Bank',
        cardName: 'Axis Atlas',
        pointsBalance: 100_000,
        balanceVerified: true,
      },
    ], 'flight', 'krisflyer')

    const result = rankWalletRails(matrix, {
      travelKind: 'flight',
      programmeId: 'krisflyer',
      programmePointsRequired: 80_000,
      awardTaxesMinor: 400_000,
      awardTaxesCurrency: 'INR',
      cashPriceMinor: 5_000_000,
      cashCurrency: 'INR',
    })

    const transfer = result.candidates.find(candidate => candidate.railId === 'axis-atlas-transfer-krisflyer')
    expect(transfer?.bankPointsTargetMinimum).toBe(40_000)
    expect(transfer?.affordability).toBe('DEFINITELY_UNAFFORDABLE')
    expect(transfer?.comparisonState).toBe('NOT_COMPARABLE')
    expect(transfer?.reasons.join(' ')).toMatch(/Group A calendar-year ceiling of 30,000 EDGE Miles/i)
  })

  it('keeps an Atlas transfer under its group ceiling projected and requires remaining annual allowance verification', () => {
    const matrix = buildWalletRailMatrix([
      {
        walletKey: 'axis',
        bank: 'Axis Bank',
        cardName: 'Axis Atlas',
        pointsBalance: 40_000,
        balanceVerified: true,
      },
    ], 'flight', 'air-india-maharaja')

    const result = rankWalletRails(matrix, {
      travelKind: 'flight',
      programmeId: 'air-india-maharaja',
      programmePointsRequired: 60_000,
      awardTaxesMinor: 350_000,
      awardTaxesCurrency: 'INR',
      cashPriceMinor: 4_500_000,
      cashCurrency: 'INR',
    })

    const transfer = result.candidates.find(candidate => candidate.railId === 'axis-atlas-transfer-air-india-maharaja')
    expect(transfer?.bankPointsTargetMinimum).toBe(30_000)
    expect(transfer?.affordability).toBe('POSSIBLY_AFFORDABLE')
    expect(transfer?.comparisonState).toBe('PROJECTED_NEEDS_VERIFICATION')
    expect(transfer?.reasons.join(' ')).toMatch(/Group B allows up to 1,20,000 EDGE Miles per calendar year/i)
    expect(transfer?.reasons.join(' ')).toMatch(/remaining annual allowance must be verified/i)
  })
})

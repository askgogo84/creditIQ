import { describe, expect, it } from 'vitest'
import { cashRetainRail, queryRails } from '@/lib/redemption-rails/registry'
import type { WalletRailMatrix } from '@/lib/redemption-rails/matrix'
import { rankWalletRails } from './rank'
import { findAirIndiaMaharajaGuide } from '@/lib/data/air-india-maharaja-guide'
import { programmeIdForFlightCarrier } from '@/lib/redemption-rails/programme-resolver'

function oneCardMatrix(params: {
  cardId: string
  cardName: string
  bank: string
  points: number
  travelKind?: 'flight' | 'hotel'
  programmeId?: string | null
}): WalletRailMatrix {
  const travelKind = params.travelKind ?? 'flight'
  const programmeId = params.programmeId ?? null
  return {
    travelKind,
    programmeId,
    cards: [{
      walletKey: `test:${params.cardId}`,
      bank: params.bank,
      cardName: params.cardName,
      cardId: params.cardId,
      pointsBalance: params.points,
      balanceVerified: true,
      status: 'VERIFICATION_REQUIRED',
      rails: queryRails({ cardId: params.cardId, travelKind, programmeId }),
    }],
    cashRail: cashRetainRail(travelKind),
  }
}

describe('India travel redemption intelligence', () => {
  it('projects HDFC Infinia SmartBuy points + cash from sourced ₹1/RP and 70% cap', () => {
    const matrix = oneCardMatrix({ cardId: 'hdfc-infinia', cardName: 'HDFC Infinia Metal Edition', bank: 'HDFC Bank', points: 178_783 })
    const ranking = rankWalletRails(matrix, {
      travelKind: 'flight', programmeId: null, programmePointsRequired: null,
      awardTaxesMinor: null, awardTaxesCurrency: null,
      cashPriceMinor: 1_075_000, cashCurrency: 'INR',
    })
    const smartbuy = ranking.candidates.find(candidate => candidate.railId === 'hdfc-infinia-smartbuy-travel')
    expect(smartbuy?.comparisonState).toBe('PROJECTED_NEEDS_VERIFICATION')
    expect(smartbuy?.bankPointsTargetMinimum).toBe(7_525)
    expect(smartbuy?.cashPayableMinor).toBe(322_500)
    expect(smartbuy?.reasons.join(' ')).toContain('70%')
  })

  it('projects Axis Atlas Travel EDGE using wallet balance and the 500-mile floor', () => {
    const matrix = oneCardMatrix({ cardId: 'axis-atlas', cardName: 'Axis Atlas', bank: 'Axis Bank', points: 20_000 })
    const ranking = rankWalletRails(matrix, {
      travelKind: 'flight', programmeId: null, programmePointsRequired: null,
      awardTaxesMinor: null, awardTaxesCurrency: null,
      cashPriceMinor: 1_075_000, cashCurrency: 'INR',
    })
    const travelEdge = ranking.candidates.find(candidate => candidate.railId === 'axis-atlas-travel-edge')
    expect(travelEdge?.comparisonState).toBe('PROJECTED_NEEDS_VERIFICATION')
    expect(travelEdge?.bankPointsTargetMinimum).toBe(10_750)
    expect(travelEdge?.cashPayableMinor).toBe(0)
  })

  it('keeps Amex Travel visible without inventing an itinerary conversion rate', () => {
    const matrix = oneCardMatrix({ cardId: 'amex-platinum-travel', cardName: 'American Express Platinum Travel', bank: 'American Express', points: 50_000 })
    const ranking = rankWalletRails(matrix, {
      travelKind: 'flight', programmeId: null, programmePointsRequired: null,
      awardTaxesMinor: null, awardTaxesCurrency: null,
      cashPriceMinor: 1_075_000, cashCurrency: 'INR',
    })
    const amex = ranking.candidates.find(candidate => candidate.railId === 'amex-platinum-travel-amex-travel')
    expect(amex?.comparisonState).toBe('PROJECTED_NEEDS_VERIFICATION')
    expect(amex?.bankPointsTargetMinimum).toBeNull()
    expect(amex?.cashPayableMinor).toBeNull()
    expect(amex?.reasons.join(' ')).toContain('1,000')
    expect(amex?.reasons.join(' ')).toContain('exact itinerary points')
  })

  it('maps domestic carriers to loyalty programmes even when no live award is returned', () => {
    expect(programmeIdForFlightCarrier('AI')).toBe('air-india-maharaja')
    expect(programmeIdForFlightCarrier('Air India')).toBe('air-india-maharaja')
    expect(programmeIdForFlightCarrier('6E')).toBe('indigo-bluchip')
    expect(programmeIdForFlightCarrier('IndiGo')).toBe('indigo-bluchip')
    expect(programmeIdForFlightCarrier('SG')).toBe('spiceclub')
    expect(programmeIdForFlightCarrier('Akasa Air')).toBeNull()
  })

  it('uses the published Maharaja BLR-DEL guide only as points discovery and computes exact-card transfer targets', () => {
    const guide = findAirIndiaMaharajaGuide('BLR', 'DEL')
    expect(guide?.economyPoints).toBe(7_000)
    expect(guide?.businessPoints).toBe(25_000)
    expect(guide?.availability).toBe('GUIDE_NOT_LIVE')

    const hdfc = oneCardMatrix({
      cardId: 'hdfc-infinia', cardName: 'HDFC Infinia Metal Edition', bank: 'HDFC Bank', points: 178_783,
      programmeId: 'air-india-maharaja',
    })
    const hdfcRanking = rankWalletRails(hdfc, {
      travelKind: 'flight', programmeId: 'air-india-maharaja', programmePointsRequired: 7_000,
      awardTaxesMinor: null, awardTaxesCurrency: null,
      cashPriceMinor: 1_030_600, cashCurrency: 'INR',
    })
    const hdfcTransfer = hdfcRanking.candidates.find(candidate => candidate.railId === 'hdfc-infinia-transfer-air-india-maharaja')
    expect(hdfcTransfer?.bankPointsTargetMinimum).toBe(14_000)

    const axis = oneCardMatrix({
      cardId: 'axis-atlas', cardName: 'Axis Atlas', bank: 'Axis Bank', points: 20_000,
      programmeId: 'air-india-maharaja',
    })
    const axisRanking = rankWalletRails(axis, {
      travelKind: 'flight', programmeId: 'air-india-maharaja', programmePointsRequired: 7_000,
      awardTaxesMinor: null, awardTaxesCurrency: null,
      cashPriceMinor: 1_030_600, cashCurrency: 'INR',
    })
    const axisTransfer = axisRanking.candidates.find(candidate => candidate.railId === 'axis-atlas-transfer-air-india-maharaja')
    expect(axisTransfer?.bankPointsTargetMinimum).toBe(3_500)
  })

  it('shows the IndiGo BluChip transfer relationship as discovery when award points are unknown', () => {
    const matrix = oneCardMatrix({
      cardId: 'axis-atlas', cardName: 'Axis Atlas', bank: 'Axis Bank', points: 20_000,
      programmeId: 'indigo-bluchip',
    })
    const ranking = rankWalletRails(matrix, {
      travelKind: 'flight', programmeId: 'indigo-bluchip', programmePointsRequired: null,
      awardTaxesMinor: null, awardTaxesCurrency: null,
      cashPriceMinor: 1_075_000, cashCurrency: 'INR',
    })
    const transfer = ranking.candidates.find(candidate => candidate.railId === 'axis-atlas-transfer-indigo-bluchip')
    expect(transfer?.comparisonState).toBe('DISCOVERY_ONLY')
    expect(transfer?.bankPointsTargetMinimum).toBeNull()
    expect(transfer?.reasons.join(' ')).toContain('2:1')
    expect(transfer?.reasons.join(' ')).toContain('verify the award')
  })
})

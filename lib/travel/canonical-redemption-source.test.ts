import { describe, expect, it } from 'vitest'
import { buildWalletRailMatrix } from '@/lib/redemption-rails/matrix'
import { buildTravelDecisionContract } from './decision-contract'

function card(walletKey: string, bank: string, cardName: string, pointsBalance = 100000) {
  return { walletKey, bank, cardName, pointsBalance, balanceVerified: true }
}

describe('canonical redemption source', () => {
  it('does not leak Amex Travel Online or a generic Amex transfer hub into an Air India decision', () => {
    const matrix = buildWalletRailMatrix([
      card('hdfc', 'HDFC', 'HDFC Infinia Metal Edition'),
      card('amex', 'American Express', 'American Express Platinum Travel'),
    ], 'flight', 'air-india-maharaja')

    const amex = matrix.cards.find(c => c.walletKey === 'amex')!
    expect(amex.rails.some(r => r.bookingDestination === 'American Express Travel Online')).toBe(false)
    expect(amex.rails.some(r => /transfer partners/i.test(r.bookingDestination || ''))).toBe(false)
    expect(amex.rails.some(r => r.type === 'LOYALTY_TRANSFER')).toBe(false)

    const decision = buildTravelDecisionContract({
      matrix,
      pricing: {
        travelKind: 'flight',
        programmeId: 'air-india-maharaja',
        programmePointsRequired: 7000,
        awardTaxesMinor: 269200,
        awardTaxesCurrency: 'INR',
        cashPriceMinor: 897200,
        cashCurrency: 'INR',
      },
      awardStatus: 'DISCOVERY_ONLY',
    })

    const labels = decision.searchSummary?.alternatives.map(option => option.label) || []
    expect(labels.some(label => /American Express Travel Online/i.test(label))).toBe(false)
    expect(labels.some(label => /Amex Membership Rewards transfer partners/i.test(label))).toBe(false)
  })

  it('shows exact Amex MR economics for a known Hilton stay', () => {
    const matrix = buildWalletRailMatrix([
      card('amex', 'American Express', 'American Express Platinum Travel'),
    ], 'hotel', 'hilton-honors')

    const decision = buildTravelDecisionContract({
      matrix,
      pricing: {
        travelKind: 'hotel',
        programmeId: 'hilton-honors',
        programmePointsRequired: 45000,
        awardTaxesMinor: 0,
        awardTaxesCurrency: 'INR',
        cashPriceMinor: 1800000,
        cashCurrency: 'INR',
      },
      awardStatus: 'DISCOVERY_ONLY',
    })

    const amexHilton = decision.searchSummary?.alternatives.find(option =>
      option.cardName === 'American Express Platinum Travel' && option.railType === 'LOYALTY_TRANSFER'
    )
    expect(amexHilton?.bankPointsRequired).toBe(30000)
    expect(amexHilton?.label).toMatch(/Hilton Honors/)
  })

  it('does not invent an Amex route for Shangri-La', () => {
    const matrix = buildWalletRailMatrix([
      card('amex', 'American Express', 'American Express Platinum Travel'),
    ], 'hotel', 'shangri-la-circle')

    const amex = matrix.cards[0]
    expect(amex.rails.some(r => r.type === 'LOYALTY_TRANSFER')).toBe(false)
    expect(amex.rails.some(r => /transfer partners/i.test(r.bookingDestination || ''))).toBe(false)
  })
})

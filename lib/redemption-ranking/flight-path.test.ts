import { describe, expect, it } from 'vitest'
import type { WalletRailMatrix } from '@/lib/redemption-rails'
import { rankWalletRails } from './rank'
import { buildFlightRedemptionPath, buildFlightRedemptionPaths } from './flight-path'

const pricing = {
  travelKind: 'flight' as const,
  programmeId: 'krisflyer',
  programmePointsRequired: 43_000,
  awardTaxesMinor: 418_000,
  awardTaxesCurrency: 'INR',
  cashPriceMinor: 5_260_000,
  cashCurrency: 'INR',
}

function transferMatrix(durationText: string | null = 'within 5-7 working days'): WalletRailMatrix {
  return {
    travelKind: 'flight',
    programmeId: 'krisflyer',
    cards: [{
      walletKey: 'statement:HDFC:2184',
      bank: 'HDFC',
      cardName: 'HDFC Infinia Metal Edition',
      cardId: 'hdfc-infinia',
      pointsBalance: 68_500,
      balanceVerified: true,
      status: 'VERIFICATION_REQUIRED',
      rails: [{
        id: 'hdfc-infinia-transfer-krisflyer',
        cardIds: ['hdfc-infinia'],
        issuer: 'HDFC',
        type: 'LOYALTY_TRANSFER',
        travelKinds: ['flight'],
        executionState: 'RATIO_ONLY',
        evidence: [],
        transfer: {
          programmeId: 'krisflyer',
          programmeName: 'KrisFlyer',
          destinationCurrency: 'KrisFlyer miles',
          ratio: { fromUnits: 1, toUnits: 1 },
          durationText,
          durationHoursMax: 168,
          irreversible: true,
          minimumBankPoints: null,
          incrementBankPoints: null,
        },
        bookingDestination: 'KrisFlyer',
        bookingUrl: 'https://www.singaporeair.com/en_UK/us/ppsclub-krisflyer/use-miles/',
      }],
    }],
    cashRail: {
      id: 'cash-retain-flight', cardIds: [], issuer: 'Cash', type: 'CASH_RETAIN',
      travelKinds: ['flight'], executionState: 'EXECUTABLE', evidence: [], bookingDestination: 'Selected booking provider',
    },
  }
}

describe('flight redemption execution paths', () => {
  it('keeps the ratio-only transfer projected and carries every irreversible-transfer guard', () => {
    const ranking = rankWalletRails(transferMatrix(), pricing)
    const paths = buildFlightRedemptionPaths(ranking)

    expect(paths.bestProjected).toMatchObject({
      kind: 'TRANSFER_THEN_BOOK',
      state: 'PROJECTED_NEEDS_VERIFICATION',
      programmeName: 'KrisFlyer',
      programmePointsRequired: 43_000,
      bankPointsTargetMinimum: 43_000,
      bankPointsToTransferExact: null,
      durationText: 'within 5-7 working days',
      irreversible: true,
      awardTaxesMinor: 418_000,
    })
    expect(paths.bestProjected?.kind === 'TRANSFER_THEN_BOOK' && paths.bestProjected.warning).toMatch(/Do not transfer yet/)
    expect(paths.bestProjected?.kind === 'TRANSFER_THEN_BOOK' && paths.bestProjected.warning).toMatch(/cannot be reversed/)
    expect(paths.bestExecutable).toMatchObject({ kind: 'CASH_RETAIN', state: 'EXECUTABLE', cashPayableMinor: 5_260_000 })
  })

  it('refuses to assemble a transfer instruction when duration is missing', () => {
    const ranking = rankWalletRails(transferMatrix(null), pricing)
    expect(buildFlightRedemptionPath(ranking, ranking.bestProjected)).toBeNull()
  })

  it('assembles portal-no-transfer arithmetic only from fully structured portal terms', () => {
    const matrix: WalletRailMatrix = {
      travelKind: 'flight', programmeId: 'krisflyer',
      cards: [{
        walletKey: 'statement:HDFC:2184', bank: 'HDFC', cardName: 'HDFC Infinia', cardId: 'hdfc-infinia',
        pointsBalance: 50_000, balanceVerified: true, status: 'EXECUTABLE',
        rails: [{
          id: 'hdfc-infinia-smartbuy-travel', cardIds: ['hdfc-infinia'], issuer: 'HDFC', type: 'BANK_TRAVEL_PORTAL',
          travelKinds: ['flight'], executionState: 'EXECUTABLE', evidence: [], bookingDestination: 'HDFC SmartBuy',
          bookingUrl: 'https://offers.smartbuy.hdfcbank.com/',
          portal: { portalName: 'HDFC SmartBuy', supportsPointsPlusCash: true, valuePerPointPaise: 100, maxPointsShareBps: 7000, feeMinor: 11_682 },
        }],
      }],
      cashRail: { id: 'cash-retain-flight', cardIds: [], issuer: 'Cash', type: 'CASH_RETAIN', travelKinds: ['flight'], executionState: 'EXECUTABLE', evidence: [] },
    }
    const ranking = rankWalletRails(matrix, pricing)
    const path = buildFlightRedemptionPath(ranking, ranking.bestExecutable)

    expect(path).toMatchObject({
      kind: 'PORTAL_NO_TRANSFER',
      state: 'EXECUTABLE',
      portalPointsUsed: 36_820,
      portalMaxPointsShareBps: 7000,
      portalFeeMinor: 11_682,
      cashPayableMinor: 1_589_682,
    })

    const crossCurrency = rankWalletRails(matrix, { ...pricing, cashCurrency: 'USD' })
    const portalCandidate = crossCurrency.candidates.find((candidate) => candidate.railType === 'BANK_TRAVEL_PORTAL')
    expect(portalCandidate?.cashPayableMinor).toBeNull()
    expect(buildFlightRedemptionPath(crossCurrency, portalCandidate ?? null)).toBeNull()
  })
})

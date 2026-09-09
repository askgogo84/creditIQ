import { describe, expect, it } from 'vitest'
import type { TravelDecisionContract } from '@/lib/travel/decision-contract'
import { buildSearchRedemptionSummary } from './search-redemption-summary'

function decision(overrides: Partial<TravelDecisionContract> = {}): TravelDecisionContract {
  const transferRail = {
    id: 'hdfc-infinia-transfer-air-india-maharaja',
    cardIds: ['hdfc-infinia'],
    issuer: 'HDFC',
    type: 'LOYALTY_TRANSFER' as const,
    travelKinds: ['flight' as const],
    executionState: 'RATIO_ONLY' as const,
    evidence: [],
    transfer: {
      programmeId: 'air-india-maharaja',
      programmeName: 'Air India Maharaja Club',
      destinationCurrency: 'Maharaja Points',
      ratio: { fromUnits: 2, toUnits: 1 },
      durationText: 'within 48 - 96 working hours',
      durationHoursMax: 96,
      irreversible: true,
      minimumBankPoints: null,
      incrementBankPoints: null,
    },
    bookingDestination: 'Air India Maharaja Club',
  }
  const matrix = {
    travelKind: 'flight' as const,
    programmeId: 'air-india-maharaja',
    cards: [{
      walletKey: 'wallet:hdfc:1234',
      bank: 'HDFC',
      cardName: 'HDFC Infinia Metal Edition',
      cardId: 'hdfc-infinia',
      pointsBalance: 100000,
      balanceVerified: true,
      status: 'VERIFICATION_REQUIRED' as const,
      rails: [transferRail],
    }],
    cashRail: {
      id: 'cash-retain-flight',
      cardIds: [],
      issuer: 'Cash',
      type: 'CASH_RETAIN' as const,
      travelKinds: ['flight' as const],
      executionState: 'EXECUTABLE' as const,
      evidence: [],
      bookingDestination: 'Selected booking provider',
    },
  }
  const transferCandidate = {
    id: 'wallet:hdfc:1234|hdfc-infinia-transfer-air-india-maharaja',
    walletKey: 'wallet:hdfc:1234',
    bank: 'HDFC',
    cardName: 'HDFC Infinia Metal Edition',
    railId: 'hdfc-infinia-transfer-air-india-maharaja',
    railType: 'LOYALTY_TRANSFER' as const,
    railExecutionState: 'RATIO_ONLY' as const,
    comparisonState: 'PROJECTED_NEEDS_VERIFICATION' as const,
    affordability: 'POSSIBLY_AFFORDABLE' as const,
    bankPointsTargetMinimum: 30000,
    bankPointsToTransferExact: null,
    cashPayableMinor: 100000,
    cashCurrency: 'INR',
    reasons: ['Transfer ratio is sourced, but an exact issuer transfer instruction is still blocked.'],
  }
  const cashCandidate = {
    id: 'cash-retain',
    walletKey: null,
    bank: 'Cash',
    cardName: 'Cash & retain points',
    railId: 'cash-retain',
    railType: 'CASH_RETAIN' as const,
    railExecutionState: 'EXECUTABLE' as const,
    comparisonState: 'EXECUTABLE' as const,
    affordability: 'AFFORDABLE' as const,
    bankPointsTargetMinimum: null,
    bankPointsToTransferExact: null,
    cashPayableMinor: 1000000,
    cashCurrency: 'INR',
    reasons: ['Pay cash and retain all wallet points.'],
  }

  const base: TravelDecisionContract = {
    version: 'travel-decision-v1',
    travelKind: 'flight',
    inventory: { state: 'AVAILABLE', selection: { id: 'AI-123' } },
    awardState: {
      status: 'LIVE_OR_PROVIDER_RETURNED',
      programmeId: 'air-india-maharaja',
      pointsRequired: 15000,
      taxesMinor: 100000,
      taxesCurrency: 'INR',
    },
    sourceAuthority: {
      cash: 'kiwi-mcp',
      award: 'awardtool-realtime',
      awardPricingAuthority: 'DATE_SPECIFIC_LIVE',
      railPolicy: 'inventory-first-card-exact-no-bank-inheritance',
    },
    wallet: {
      matrix,
      ranking: {
        pricing: {
          travelKind: 'flight',
          programmeId: 'air-india-maharaja',
          programmePointsRequired: 15000,
          awardTaxesMinor: 100000,
          awardTaxesCurrency: 'INR',
          cashPriceMinor: 1000000,
          cashCurrency: 'INR',
        },
        matrix,
        candidates: [transferCandidate, cashCandidate],
        bestExecutable: cashCandidate,
        bestProjected: transferCandidate,
        recommendationState: 'PROJECTED_WINNER_NEEDS_VERIFICATION',
        unsupportedWalletCards: [],
      },
      projectedWinner: transferCandidate,
      executableWinner: cashCandidate,
    },
    blockedReasons: ['Exact issuer transfer instruction is blocked.'],
    provenance: {},
    conciergeAction: {
      state: 'READY_FOR_OPERATOR_VERIFICATION',
      instructionState: 'PROJECTED_PATH_NEEDS_VERIFICATION',
      recommendedCandidateId: transferCandidate.id,
      requiresLiveReverification: true,
      irreversibleTransferAllowed: false,
    },
    generatedAt: '2026-09-09T00:00:00.000Z',
  }
  return { ...base, ...overrides }
}

describe('buildSearchRedemptionSummary', () => {
  it('turns a live ratio-only transfer into a verify-redemption verdict with projected value', () => {
    const summary = buildSearchRedemptionSummary(decision(), { programmeName: 'Air India Maharaja Club' })
    expect(summary.verdict).toBe('VERIFY_REDEMPTION')
    expect(summary.bestPath?.label).toContain('Air India Maharaja Club')
    expect(summary.bestPath?.bankPointsRequired).toBe(30000)
    expect(summary.bestPath?.savingsVsCashMinor).toBe(900000)
    expect(summary.bestPath?.valuePerBankPointInr).toBe(0.3)
    expect(summary.bestExecutable?.railType).toBe('CASH_RETAIN')
  })

  it('never promotes a cached award to use-points', () => {
    const live = decision()
    const cached = decision({
      awardState: { ...live.awardState, status: 'DISCOVERY_ONLY' },
      sourceAuthority: { ...live.sourceAuthority, awardPricingAuthority: 'CACHED_DISCOVERY' },
    })
    expect(buildSearchRedemptionSummary(cached).verdict).toBe('VERIFY_AWARD')
  })

  it('returns pay-cash when cash is the only comparable executable path', () => {
    const base = decision()
    const cash = base.wallet.ranking.candidates.find((candidate) => candidate.railType === 'CASH_RETAIN')!
    const cashOnly = decision({
      awardState: { status: 'NOT_FOUND', programmeId: null, pointsRequired: null, taxesMinor: null, taxesCurrency: null },
      wallet: {
        ...base.wallet,
        ranking: {
          ...base.wallet.ranking,
          pricing: { ...base.wallet.ranking.pricing, programmeId: null, programmePointsRequired: null, awardTaxesMinor: null, awardTaxesCurrency: null },
          candidates: [cash],
          bestExecutable: cash,
          bestProjected: null,
          recommendationState: 'CASH_ONLY',
        },
        projectedWinner: null,
        executableWinner: cash,
      },
      conciergeAction: {
        ...base.conciergeAction,
        state: 'CASH_ONLY',
        instructionState: 'CASH_ONLY',
        recommendedCandidateId: cash.id,
        requiresLiveReverification: false,
      },
    })
    const summary = buildSearchRedemptionSummary(cashOnly)
    expect(summary.verdict).toBe('PAY_CASH')
    expect(summary.bestPath?.cashPayableMinor).toBe(1000000)
  })
})

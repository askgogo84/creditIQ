import { describe, expect, it } from 'vitest'
import { buildWalletRailMatrix } from '@/lib/redemption-rails'
import { buildTravelDecisionContract } from './decision-contract'

function matrix(points = 68_500) {
  return buildWalletRailMatrix([
    {
      walletKey: 'hdfc-2184',
      bank: 'HDFC Bank',
      cardName: 'HDFC Infinia Metal Edition',
      pointsBalance: points,
      balanceVerified: true,
    },
  ], 'flight', 'krisflyer')
}

const pricing = {
  travelKind: 'flight' as const,
  programmeId: 'krisflyer',
  programmePointsRequired: 43_000,
  awardTaxesMinor: 418_000,
  awardTaxesCurrency: 'INR',
  cashPriceMinor: 5_260_000,
  cashCurrency: 'INR',
}

describe('travel decision contract', () => {
  it('keeps projected and executable winners separate and never authorises an irreversible transfer', () => {
    const decision = buildTravelDecisionContract({
      matrix: matrix(),
      pricing,
      awardStatus: 'LIVE_OR_PROVIDER_RETURNED',
      cashSource: 'skyscanner-live',
      awardSource: 'awardtool-realtime',
      awardPricingAuthority: 'DATE_SPECIFIC_LIVE',
      inventory: { state: 'AVAILABLE', selection: { from: 'BLR', to: 'SIN' } },
      generatedAt: '2026-09-08T05:00:00.000Z',
    })

    expect(decision.version).toBe('travel-decision-v1')
    expect(decision.wallet.projectedWinner?.railId).toBe('hdfc-infinia-transfer-krisflyer')
    expect(decision.wallet.executableWinner?.railType).toBe('CASH_RETAIN')
    expect(decision.conciergeAction.instructionState).toBe('PROJECTED_PATH_NEEDS_VERIFICATION')
    expect(decision.conciergeAction.requiresLiveReverification).toBe(true)
    expect(decision.conciergeAction.irreversibleTransferAllowed).toBe(false)
    expect(decision.blockedReasons.join(' ')).toMatch(/verification/i)
  })

  it('falls back to cash-only when the wallet cannot afford the projected transfer', () => {
    const decision = buildTravelDecisionContract({
      matrix: matrix(30_000),
      pricing,
      awardStatus: 'LIVE_OR_PROVIDER_RETURNED',
    })

    expect(decision.wallet.projectedWinner).toBeNull()
    expect(decision.wallet.executableWinner?.railType).toBe('CASH_RETAIN')
    expect(decision.conciergeAction.state).toBe('CASH_ONLY')
    expect(decision.conciergeAction.instructionState).toBe('CASH_ONLY')
    expect(decision.conciergeAction.irreversibleTransferAllowed).toBe(false)
  })

  it('does not invent a safe winner when comparable pricing is incomplete', () => {
    const decision = buildTravelDecisionContract({
      matrix: matrix(),
      pricing: { ...pricing, cashPriceMinor: null, cashCurrency: null },
      awardStatus: 'DISCOVERY_ONLY',
    })

    expect(decision.wallet.executableWinner).toBeNull()
    expect(decision.wallet.projectedWinner).toBeNull()
    expect(decision.conciergeAction.state).toBe('BLOCKED')
    expect(decision.conciergeAction.instructionState).toBe('NO_SAFE_ACTION')
    expect(decision.blockedReasons.length).toBeGreaterThan(0)
  })
})

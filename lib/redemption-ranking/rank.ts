import { assertSafeInteger, bankPointsForProgramme, roundUpTransfer } from '@/lib/redemption-engine/rational'
import type { RedemptionRailDefinition, WalletRailMatrix } from '@/lib/redemption-rails'
import type {
  RailAffordability,
  RailComparisonState,
  RailRankingResult,
  RankedRailCandidate,
  RankingRecommendationState,
  SelectedTravelPricing,
} from './types'

function normalizedCurrency(value: string | null): string | null {
  const v = value?.trim().toUpperCase()
  return v || null
}

function sameCurrency(a: string | null, b: string | null): boolean {
  const left = normalizedCurrency(a)
  const right = normalizedCurrency(b)
  return !!left && left === right
}

function safeNonNegative(name: string, value: number | null): number | null {
  if (value == null) return null
  assertSafeInteger(name, value, { min: 0 })
  return value
}

function railComparisonState(rail: RedemptionRailDefinition): RailComparisonState {
  if (rail.executionState === 'EXECUTABLE') return 'EXECUTABLE'
  if (rail.executionState === 'RATIO_ONLY' || rail.executionState === 'CHECKOUT_REQUIRED') {
    return 'PROJECTED_NEEDS_VERIFICATION'
  }
  if (rail.executionState === 'DISCOVERY_ONLY') return 'DISCOVERY_ONLY'
  return 'NOT_COMPARABLE'
}

function compareKnownCash(a: RankedRailCandidate, b: RankedRailCandidate): number {
  const av = a.cashPayableMinor
  const bv = b.cashPayableMinor
  if (av == null && bv == null) return a.id.localeCompare(b.id)
  if (av == null) return 1
  if (bv == null) return -1
  if (av !== bv) return av - bv
  return a.id.localeCompare(b.id)
}

function cashCandidate(pricing: SelectedTravelPricing): RankedRailCandidate {
  const cash = safeNonNegative('cash price minor', pricing.cashPriceMinor)
  return {
    id: 'cash-retain',
    walletKey: null,
    bank: 'Cash',
    cardName: 'Cash & retain points',
    railId: 'cash-retain',
    railType: 'CASH_RETAIN',
    railExecutionState: 'EXECUTABLE',
    comparisonState: cash == null ? 'NOT_COMPARABLE' : 'EXECUTABLE',
    affordability: cash == null ? 'UNKNOWN' : 'AFFORDABLE',
    bankPointsTargetMinimum: null,
    bankPointsToTransferExact: null,
    cashPayableMinor: cash,
    cashCurrency: normalizedCurrency(pricing.cashCurrency),
    reasons: cash == null
      ? ['Matched cash price is unavailable.']
      : ['Pay cash and retain all wallet points.'],
  }
}

function transferCandidate(
  rail: RedemptionRailDefinition,
  card: WalletRailMatrix['cards'][number],
  pricing: SelectedTravelPricing,
): RankedRailCandidate {
  const reasons: string[] = []
  const transfer = rail.transfer
  const programmePoints = safeNonNegative('programme points required', pricing.programmePointsRequired)
  const awardTaxes = safeNonNegative('award taxes minor', pricing.awardTaxesMinor)

  if (!transfer || !pricing.programmeId || transfer.programmeId !== pricing.programmeId || programmePoints == null) {
    return {
      id: `${card.walletKey}|${rail.id}`,
      walletKey: card.walletKey,
      bank: card.bank,
      cardName: card.cardName,
      railId: rail.id,
      railType: rail.type,
      railExecutionState: rail.executionState,
      comparisonState: 'NOT_COMPARABLE',
      affordability: 'UNKNOWN',
      bankPointsTargetMinimum: null,
      bankPointsToTransferExact: null,
      cashPayableMinor: null,
      cashCurrency: null,
      reasons: ['Selected award does not expose a compatible programme price for this transfer rail.'],
    }
  }

  const target = bankPointsForProgramme(programmePoints, transfer.ratio)
  const balance = card.pointsBalance
  let exact: number | null = null
  let affordability: RailAffordability = 'UNKNOWN'

  if (balance != null) {
    assertSafeInteger('wallet points balance', balance, { min: 0 })
    if (balance < target) {
      affordability = 'DEFINITELY_UNAFFORDABLE'
      reasons.push(`Wallet balance is below the minimum ratio-derived target of ${target.toLocaleString('en-IN')} points.`)
    } else if (transfer.minimumBankPoints != null && transfer.incrementBankPoints != null) {
      exact = roundUpTransfer(target, transfer.minimumBankPoints, transfer.incrementBankPoints)
      affordability = balance >= exact ? 'AFFORDABLE' : 'DEFINITELY_UNAFFORDABLE'
      if (balance < exact) reasons.push('Rounded issuer minimum/increment makes this transfer unaffordable.')
    } else {
      affordability = 'POSSIBLY_AFFORDABLE'
      reasons.push('Balance covers the ratio-derived target, but issuer minimum/increment are not fully sourced.')
    }
  } else {
    reasons.push('Wallet balance is unavailable for affordability checking.')
  }

  const taxesComparable = awardTaxes != null && sameCurrency(pricing.awardTaxesCurrency, pricing.cashCurrency)
  if (awardTaxes == null) reasons.push('Award taxes/cash component are unavailable.')
  else if (!sameCurrency(pricing.awardTaxesCurrency, pricing.cashCurrency)) {
    reasons.push('Award taxes and cash benchmark use different currencies; no FX conversion is invented here.')
  }

  if (rail.executionState === 'RATIO_ONLY') {
    reasons.push('Transfer ratio is sourced, but an exact issuer transfer instruction is still blocked.')
  }

  const comparisonState: RailComparisonState =
    affordability === 'DEFINITELY_UNAFFORDABLE'
      ? 'NOT_COMPARABLE'
      : railComparisonState(rail)

  return {
    id: `${card.walletKey}|${rail.id}`,
    walletKey: card.walletKey,
    bank: card.bank,
    cardName: card.cardName,
    railId: rail.id,
    railType: rail.type,
    railExecutionState: rail.executionState,
    comparisonState,
    affordability,
    bankPointsTargetMinimum: target,
    bankPointsToTransferExact: exact,
    cashPayableMinor: taxesComparable ? awardTaxes : null,
    cashCurrency: taxesComparable ? normalizedCurrency(pricing.cashCurrency) : null,
    reasons,
  }
}

function genericRailCandidate(
  rail: RedemptionRailDefinition,
  card: WalletRailMatrix['cards'][number],
  pricing: SelectedTravelPricing,
): RankedRailCandidate {
  const state = railComparisonState(rail)
  const reasons: string[] = []

  if (rail.type === 'BANK_TRAVEL_PORTAL' || rail.type === 'MERCHANT_PAY_WITH_POINTS') {
    const cashPrice = safeNonNegative('cash price minor', pricing.cashPriceMinor)
    const portal = rail.portal
    const balance = card.pointsBalance
    if (
      cashPrice != null && normalizedCurrency(pricing.cashCurrency) === 'INR' && balance != null && balance > 0 &&
      portal?.supportsPointsPlusCash === true &&
      portal.valuePerPointPaise != null && portal.valuePerPointPaise > 0 &&
      portal.maxPointsShareBps != null && portal.maxPointsShareBps >= 0 && portal.maxPointsShareBps <= 10_000 &&
      portal.feeMinor != null && portal.feeMinor >= 0
    ) {
      assertSafeInteger('wallet points balance', balance, { min: 0 })
      const capMinor = Math.floor((cashPrice * portal.maxPointsShareBps) / 10_000)
      const pointsByCap = Math.floor(capMinor / portal.valuePerPointPaise)
      const pointsUsed = Math.min(balance, pointsByCap)
      const cashPayable = cashPrice - (pointsUsed * portal.valuePerPointPaise) + portal.feeMinor
      reasons.push(`${portal.portalName} uses ${pointsUsed.toLocaleString('en-IN')} points within its sourced booking cap.`)
      if (rail.executionState !== 'EXECUTABLE') reasons.push('Issuer/merchant checkout remains the authoritative execution boundary.')
      return {
        id: `${card.walletKey}|${rail.id}`,
        walletKey: card.walletKey,
        bank: card.bank,
        cardName: card.cardName,
        railId: rail.id,
        railType: rail.type,
        railExecutionState: rail.executionState,
        comparisonState: state,
        affordability: 'AFFORDABLE',
        bankPointsTargetMinimum: null,
        bankPointsToTransferExact: null,
        cashPayableMinor: cashPayable,
        cashCurrency: normalizedCurrency(pricing.cashCurrency),
        reasons,
      }
    }
  }

  if (rail.type === 'BANK_TRAVEL_PORTAL' || rail.type === 'MERCHANT_PAY_WITH_POINTS') {
    if (rail.portal?.valuePerPointPaise == null || rail.portal.maxPointsShareBps == null) {
      reasons.push('Portal exists, but current card-specific value/cap is not fully structured.')
    }
    reasons.push('Issuer/merchant checkout is the authoritative execution boundary.')
  } else if (rail.type === 'TRAVEL_VOUCHER') {
    reasons.push('Voucher rail exists, but denomination/points-cost/combination rules are incomplete.')
  } else if (rail.type === 'COBRAND_NATIVE') {
    reasons.push('Native loyalty rail exists, but selected award price/balance execution still requires programme checkout.')
  } else {
    reasons.push('Rail is visible but not economically rankable from current structured facts.')
  }

  return {
    id: `${card.walletKey}|${rail.id}`,
    walletKey: card.walletKey,
    bank: card.bank,
    cardName: card.cardName,
    railId: rail.id,
    railType: rail.type,
    railExecutionState: rail.executionState,
    comparisonState: state,
    affordability: card.pointsBalance == null ? 'UNKNOWN' : 'POSSIBLY_AFFORDABLE',
    bankPointsTargetMinimum: null,
    bankPointsToTransferExact: null,
    cashPayableMinor: null,
    cashCurrency: null,
    reasons,
  }
}

function chooseRecommendation(
  bestExecutable: RankedRailCandidate | null,
  bestProjected: RankedRailCandidate | null,
): RankingRecommendationState {
  if (!bestExecutable && !bestProjected) return 'NO_COMPARABLE_PATH'
  if (bestExecutable?.railType === 'CASH_RETAIN' && !bestProjected) return 'CASH_ONLY'

  if (bestProjected && bestExecutable) {
    const p = bestProjected.cashPayableMinor
    const e = bestExecutable.cashPayableMinor
    if (p != null && e != null && p < e && bestProjected.comparisonState !== 'EXECUTABLE') {
      return 'PROJECTED_WINNER_NEEDS_VERIFICATION'
    }
  }

  if (bestExecutable) return bestExecutable.railType === 'CASH_RETAIN' ? 'CASH_ONLY' : 'EXECUTABLE_WINNER'
  return 'PROJECTED_WINNER_NEEDS_VERIFICATION'
}

/**
 * Compare the selected inventory item across the wallet's sourced redemption rails.
 *
 * Two winners are deliberately tracked:
 * - bestExecutable: only facts sufficient for an action today.
 * - bestProjected: may include ratio-only/checkout-required paths when a cash
 *   comparison is known, but is never presented as an executable instruction.
 *
 * The registry/matrix enumerate rails. This function performs only bounded,
 * explicit arithmetic. It does not infer issuer portal values, FX, voucher values,
 * missing transfer minimums/increments or native-loyalty balances.
 */
export function rankWalletRails(
  matrix: WalletRailMatrix,
  pricing: SelectedTravelPricing,
): RailRankingResult {
  if (matrix.travelKind !== pricing.travelKind) throw new Error('matrix/pricing travel kind mismatch')
  if ((matrix.programmeId ?? null) !== (pricing.programmeId ?? null)) {
    throw new Error('matrix/pricing programme mismatch')
  }

  const candidates: RankedRailCandidate[] = []

  for (const card of matrix.cards) {
    for (const rail of card.rails) {
      candidates.push(
        rail.type === 'LOYALTY_TRANSFER'
          ? transferCandidate(rail, card, pricing)
          : genericRailCandidate(rail, card, pricing),
      )
    }
  }

  candidates.push(cashCandidate(pricing))

  const comparable = candidates.filter((candidate) =>
    candidate.cashPayableMinor != null &&
    candidate.comparisonState !== 'NOT_COMPARABLE' &&
    candidate.affordability !== 'DEFINITELY_UNAFFORDABLE',
  )

  const executable = comparable
    .filter((candidate) => candidate.comparisonState === 'EXECUTABLE')
    .sort(compareKnownCash)

  const projected = comparable
    .filter((candidate) => candidate.comparisonState === 'PROJECTED_NEEDS_VERIFICATION')
    .sort(compareKnownCash)

  const bestExecutable = executable[0] ?? null
  const bestProjected = projected[0] ?? null

  return {
    pricing,
    matrix,
    candidates,
    bestExecutable,
    bestProjected,
    recommendationState: chooseRecommendation(bestExecutable, bestProjected),
    unsupportedWalletCards: matrix.cards
      .filter((card) => card.rails.length === 0)
      .map((card) => ({ walletKey: card.walletKey, bank: card.bank, cardName: card.cardName })),
  }
}

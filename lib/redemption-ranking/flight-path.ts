import { flightProgrammeBookingUrl } from '@/lib/data/flight-programme-booking'
import type { RationalRatio, RedemptionRailDefinition } from '@/lib/redemption-rails'
import type { RailRankingResult, RankedRailCandidate } from './types'

export type FlightRedemptionPathState = 'EXECUTABLE' | 'PROJECTED_NEEDS_VERIFICATION'

interface FlightPathBase {
  candidateId: string
  state: FlightRedemptionPathState
  bank: string
  cardName: string
  cashPayableMinor: number
  cashCurrency: string
}

export interface FlightTransferPath extends FlightPathBase {
  kind: 'TRANSFER_THEN_BOOK'
  programmeId: string
  programmeName: string
  destinationCurrency: string
  programmePointsRequired: number
  bankPointsTargetMinimum: number
  bankPointsToTransferExact: number | null
  ratio: RationalRatio
  durationText: string
  durationHoursMax: number | null
  irreversible: true
  bookingUrl: string
  awardTaxesMinor: number
  awardTaxesCurrency: string
  warning: string
}

export interface FlightPortalPath extends FlightPathBase {
  kind: 'PORTAL_NO_TRANSFER'
  portalName: string
  portalPointsUsed: number
  portalValuePerPointPaise: number
  portalMaxPointsShareBps: number
  portalFeeMinor: number
  bookingUrl: string
}

export interface FlightCashPath extends FlightPathBase {
  kind: 'CASH_RETAIN'
}

export type FlightRedemptionPath = FlightTransferPath | FlightPortalPath | FlightCashPath

export interface FlightRedemptionPaths {
  bestProjected: FlightRedemptionPath | null
  bestExecutable: FlightRedemptionPath | null
}

function candidateRail(ranking: RailRankingResult, candidate: RankedRailCandidate): RedemptionRailDefinition | null {
  for (const card of ranking.matrix.cards) {
    const rail = card.rails.find((item) => item.id === candidate.railId)
    if (rail) return rail
  }
  return candidate.railType === 'CASH_RETAIN' ? ranking.matrix.cashRail : null
}

function candidateState(candidate: RankedRailCandidate): FlightRedemptionPathState {
  return candidate.comparisonState === 'EXECUTABLE' ? 'EXECUTABLE' : 'PROJECTED_NEEDS_VERIFICATION'
}

function knownCash(candidate: RankedRailCandidate): { amount: number; currency: string } | null {
  return candidate.cashPayableMinor != null && candidate.cashCurrency
    ? { amount: candidate.cashPayableMinor, currency: candidate.cashCurrency }
    : null
}

function transferPath(
  ranking: RailRankingResult,
  candidate: RankedRailCandidate,
  rail: RedemptionRailDefinition,
): FlightTransferPath | null {
  const transfer = rail.transfer
  const cash = knownCash(candidate)
  const programmePointsRequired = ranking.pricing.programmePointsRequired
  const bankPointsTargetMinimum = candidate.bankPointsTargetMinimum
  const awardTaxesMinor = ranking.pricing.awardTaxesMinor
  const awardTaxesCurrency = ranking.pricing.awardTaxesCurrency
  const programmeId = ranking.pricing.programmeId
  const bookingUrl = rail.bookingUrl ?? flightProgrammeBookingUrl(programmeId)

  // A transfer path is never assembled without the facts that make its safety
  // warning concrete. Missing facts leave the candidate visible in ranking, but
  // do not turn it into instructions.
  if (
    !transfer || !cash || !programmeId || programmePointsRequired == null ||
    bankPointsTargetMinimum == null || awardTaxesMinor == null || !awardTaxesCurrency ||
    !transfer.durationText || transfer.irreversible !== true || !bookingUrl
  ) return null

  const exact = candidate.bankPointsToTransferExact
  return {
    kind: 'TRANSFER_THEN_BOOK',
    candidateId: candidate.id,
    state: candidateState(candidate),
    bank: candidate.bank,
    cardName: candidate.cardName,
    cashPayableMinor: cash.amount,
    cashCurrency: cash.currency,
    programmeId,
    programmeName: transfer.programmeName,
    destinationCurrency: transfer.destinationCurrency,
    programmePointsRequired,
    bankPointsTargetMinimum,
    bankPointsToTransferExact: exact,
    ratio: transfer.ratio,
    durationText: transfer.durationText,
    durationHoursMax: transfer.durationHoursMax,
    irreversible: true,
    bookingUrl,
    awardTaxesMinor,
    awardTaxesCurrency,
    warning: exact == null
      ? `Do not transfer yet. Transfer timing to ${transfer.programmeName}: ${transfer.durationText}. The transfer cannot be reversed. Confirm the exact award and the issuer minimum/increment before transferring.`
      : `Confirm the exact award before transferring. Transfer timing: ${transfer.durationText}. The transfer cannot be reversed.`,
  }
}

function portalPath(
  ranking: RailRankingResult,
  candidate: RankedRailCandidate,
  rail: RedemptionRailDefinition,
): FlightPortalPath | null {
  const portal = rail.portal
  const cash = knownCash(candidate)
  const pricingCash = ranking.pricing.cashPriceMinor
  const card = ranking.matrix.cards.find((item) => item.walletKey === candidate.walletKey)
  if (
    !portal || !cash || pricingCash == null || card?.pointsBalance == null ||
    portal.valuePerPointPaise == null || portal.maxPointsShareBps == null || portal.feeMinor == null || !rail.bookingUrl
  ) return null

  const capMinor = Math.floor((pricingCash * portal.maxPointsShareBps) / 10_000)
  const pointsByCap = Math.floor(capMinor / portal.valuePerPointPaise)
  const portalPointsUsed = Math.min(card.pointsBalance, pointsByCap)
  if (portalPointsUsed <= 0) return null

  return {
    kind: 'PORTAL_NO_TRANSFER',
    candidateId: candidate.id,
    state: candidateState(candidate),
    bank: candidate.bank,
    cardName: candidate.cardName,
    cashPayableMinor: cash.amount,
    cashCurrency: cash.currency,
    portalName: portal.portalName,
    portalPointsUsed,
    portalValuePerPointPaise: portal.valuePerPointPaise,
    portalMaxPointsShareBps: portal.maxPointsShareBps,
    portalFeeMinor: portal.feeMinor,
    bookingUrl: rail.bookingUrl,
  }
}

export function buildFlightRedemptionPath(
  ranking: RailRankingResult,
  candidate: RankedRailCandidate | null,
): FlightRedemptionPath | null {
  if (!candidate || ranking.pricing.travelKind !== 'flight') return null
  const rail = candidateRail(ranking, candidate)
  const cash = knownCash(candidate)
  if (!rail || !cash) return null

  if (candidate.railType === 'CASH_RETAIN') {
    return {
      kind: 'CASH_RETAIN',
      candidateId: candidate.id,
      state: 'EXECUTABLE',
      bank: candidate.bank,
      cardName: candidate.cardName,
      cashPayableMinor: cash.amount,
      cashCurrency: cash.currency,
    }
  }
  if (candidate.railType === 'LOYALTY_TRANSFER') return transferPath(ranking, candidate, rail)
  if (candidate.railType === 'BANK_TRAVEL_PORTAL' || candidate.railType === 'MERCHANT_PAY_WITH_POINTS') {
    return portalPath(ranking, candidate, rail)
  }
  return null
}

export function buildFlightRedemptionPaths(ranking: RailRankingResult): FlightRedemptionPaths {
  return {
    bestProjected: buildFlightRedemptionPath(ranking, ranking.bestProjected),
    bestExecutable: buildFlightRedemptionPath(ranking, ranking.bestExecutable),
  }
}

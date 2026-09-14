import { SEED_CARDS } from '@/lib/data/seed-cards'
import { buildWalletRailMatrix, type WalletRailStatus } from './matrix'
import type { TravelKind } from './types'

export type CoverageLevel = 'VERIFIED' | 'PARTIAL' | 'DISCOVERY' | 'NO_ROUTE'

export type CardTravelCoverage = {
  cardId: string
  cardName: string
  bank: string
  active: boolean
  flight: { status: WalletRailStatus; level: CoverageLevel; railCount: number }
  hotel: { status: WalletRailStatus; level: CoverageLevel; railCount: number }
}

function levelFor(status: WalletRailStatus): CoverageLevel {
  if (status === 'EXECUTABLE') return 'VERIFIED'
  if (status === 'VERIFICATION_REQUIRED') return 'PARTIAL'
  if (status === 'DISCOVERY_ONLY') return 'DISCOVERY'
  return 'NO_ROUTE'
}

function one(card: (typeof SEED_CARDS)[number], travelKind: TravelKind) {
  const matrix = buildWalletRailMatrix([
    { walletKey: card.id, bank: card.bank, cardName: card.name },
  ], travelKind)
  const result = matrix.cards[0]
  const status: WalletRailStatus = result?.status ?? 'NO_VERIFIED_REDEMPTION_RAIL'
  return { status, level: levelFor(status), railCount: result?.rails.length ?? 0 }
}

/**
 * Truthful all-catalogue coverage report.
 *
 * This intentionally does NOT pretend that every Indian card has an exact
 * transfer ratio. Every active catalogue card is instead guaranteed to land in
 * one explicit state for both Flights and Hotels: VERIFIED, PARTIAL,
 * DISCOVERY, or NO_ROUTE. Travel must never return an undefined/blank state or
 * manufacture arithmetic just to make a card look supported.
 */
export function auditIndiaTravelCoverage(): CardTravelCoverage[] {
  return SEED_CARDS.filter(card => card.active).map(card => ({
    cardId: card.id,
    cardName: card.name,
    bank: card.bank,
    active: card.active,
    flight: one(card, 'flight'),
    hotel: one(card, 'hotel'),
  }))
}

export function coverageSummary(rows = auditIndiaTravelCoverage()) {
  const summarize = (kind: 'flight' | 'hotel') => rows.reduce<Record<CoverageLevel, number>>((acc, row) => {
    acc[row[kind].level] += 1
    return acc
  }, { VERIFIED: 0, PARTIAL: 0, DISCOVERY: 0, NO_ROUTE: 0 })

  return {
    totalCards: rows.length,
    flight: summarize('flight'),
    hotel: summarize('hotel'),
    unresolved: rows.filter(row => row.flight.level === 'NO_ROUTE' || row.hotel.level === 'NO_ROUTE'),
  }
}

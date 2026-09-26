import { resolveRailCardId } from '@/lib/redemption-rails/card-resolver'
import { ACCOR_RULES, HDFC_ACCOR_ROUTE } from './accor'

export function walletCardKey(card: { bank: string; last4: string | null; cardName: string | null }) {
  // Same bank/last4 identity policy as the canonical portfolio, not catalogue ID.
  return JSON.stringify([card.bank.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/(bank|cards|card|limited|ltd)+$/g, ''), card.last4, card.last4 ? null : card.cardName?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? null])
}

/** Capability facts, never an aggregate valuation or a booking recommendation. */
export function redemptionReadiness(card: { bank: string; cardName: string | null; points: number | null }) {
  const cardId = card.cardName ? resolveRailCardId({ bank: card.bank, cardName: card.cardName }) : null
  const supported = cardId === HDFC_ACCOR_ROUTE.card_id
  return {
    cardId,
    state: card.points === null ? 'BALANCE_UNKNOWN' as const : supported ? 'BOOKING_REQUIRED' as const : 'UNSUPPORTED' as const,
    walletValueInr: null,
    reason: card.points === null ? 'Balance unknown. Add a current balance before planning.' : supported
      ? 'Select a booking to compare redemption paths. Whole-wallet value is unavailable.'
      : 'Booking rules for this card are not captured. Whole-wallet value is unavailable.',
    programme: supported ? 'Accor ALL' : null,
    ratio: supported ? HDFC_ACCOR_ROUTE.ratio : null,
    blockers: supported ? [
      'Accor permitted redemption amounts remain disputed.',
      'Accor eligible charges are not verified.',
      'HDFC transfer minimum and increment are not captured for Accor ALL.',
    ] : ['Supported booking rules required.'],
    programmeRules: supported ? [ACCOR_RULES.permitted_amounts, ACCOR_RULES.programme_eligible] : [],
  }
}

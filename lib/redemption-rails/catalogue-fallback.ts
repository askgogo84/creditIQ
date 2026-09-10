import { SEED_CARDS } from '@/lib/data/seed-cards'
import type { RedemptionOption } from '@/lib/types'
import type { RedemptionRailDefinition, TravelKind } from './types'

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function bookingUrlForPartner(partner: string | undefined): string | undefined {
  const p = (partner || '').toLowerCase()
  if (!p) return undefined
  if (p.includes('smartbuy')) return 'https://offers.smartbuy.hdfcbank.com/'
  if (p.includes('travel edge') || p.includes('traveledge')) return 'https://traveledge.axis.bank.in/'
  if (p.includes('american express') || p.includes('amex travel')) return 'https://www.americanexpress.com/in/travel/'
  if (p.includes('make my trip') || p.includes('makemytrip')) return 'https://www.makemytrip.com/'
  if (p.includes('marriott')) return 'https://www.marriott.com/search/findHotels.mi'
  if (p.includes('tata neu')) return 'https://www.tataneu.com/'
  return undefined
}

function appliesToTravel(option: RedemptionOption, travelKind: TravelKind) {
  if (option.type === travelKind) return true
  if (option.type === 'voucher' || option.type === 'cashback') return true
  return false
}

function optionToRail(cardId: string, issuer: string, verifiedAt: string | undefined, option: RedemptionOption, travelKind: TravelKind, index: number): RedemptionRailDefinition | null {
  if (!appliesToTravel(option, travelKind)) return null

  const evidence = [{
    kind: 'INTERNAL_FIXTURE' as const,
    sourceId: `card-catalogue-${cardId}`,
    ...(verifiedAt ? { capturedAt: verifiedAt } : {}),
    note: 'Card-catalogue fallback only. This keeps the card visible in Travel but is not a substitute for an issuer-captured transfer ratio or final checkout verification.',
  }]

  if (option.type === 'cashback') {
    return {
      id: `catalogue-${cardId}-${travelKind}-statement-${index}`,
      cardIds: [cardId],
      issuer,
      type: 'STATEMENT_OFFSET',
      travelKinds: [travelKind],
      executionState: 'DISCOVERY_ONLY',
      evidence,
      bookingDestination: 'Statement credit / cashback',
      notes: [`Catalogue value reference: ₹${option.value_per_point_inr.toFixed(2)} per point. Re-check current issuer redemption rules before relying on this value.`],
    }
  }

  if (option.type === 'voucher') {
    const merchant = option.partner || 'Rewards voucher catalogue'
    return {
      id: `catalogue-${cardId}-${travelKind}-voucher-${index}`,
      cardIds: [cardId],
      issuer,
      type: 'TRAVEL_VOUCHER',
      travelKinds: [travelKind],
      executionState: 'DISCOVERY_ONLY',
      evidence,
      voucher: {
        merchant,
        denominationsInr: null,
        pointsCostPerVoucher: null,
        expiryDays: null,
        canCombine: null,
      },
      bookingDestination: merchant,
      ...(bookingUrlForPartner(merchant) ? { bookingUrl: bookingUrlForPartner(merchant) } : {}),
    }
  }

  if (option.type === 'flight' || option.type === 'hotel') {
    const portalName = option.partner || `${issuer} travel redemption`
    return {
      id: `catalogue-${cardId}-${travelKind}-portal-${index}`,
      cardIds: [cardId],
      issuer,
      type: 'BANK_TRAVEL_PORTAL',
      travelKinds: [travelKind],
      executionState: 'DISCOVERY_ONLY',
      evidence,
      portal: {
        portalName,
        supportsPointsPlusCash: false,
        valuePerPointPaise: Number.isFinite(option.value_per_point_inr) ? Math.round(option.value_per_point_inr * 100) : null,
        maxPointsShareBps: null,
        feeMinor: null,
      },
      bookingDestination: portalName,
      ...(bookingUrlForPartner(portalName) ? { bookingUrl: bookingUrlForPartner(portalName) } : {}),
      notes: ['Catalogue route only. CreditIQ will not promote it as an exact economic winner until the current issuer/checkout terms are verified.'],
    }
  }

  return null
}

/**
 * Safe coverage layer for catalogue cards that do not yet have a richer
 * issuer-backed rail in registry.ts. It never manufactures transfer ratios.
 * Transfer options in seed data are intentionally ignored here because ratio
 * text embedded in catalogue labels can be stale; those require explicit rails.
 */
export function catalogueFallbackRailsForCard(cardId: string, travelKind: TravelKind): RedemptionRailDefinition[] {
  const card = SEED_CARDS.find(candidate => candidate.id === cardId && candidate.active)
  if (!card) return []

  return card.redemption_options
    .map((option, index) => optionToRail(card.id, card.bank, card.last_verified, option, travelKind, index))
    .filter((rail): rail is RedemptionRailDefinition => Boolean(rail))
}

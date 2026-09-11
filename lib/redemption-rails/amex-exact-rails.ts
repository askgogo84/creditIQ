import { flightProgrammeBookingUrl } from '@/lib/data/flight-programme-booking'
import { hotelProgrammeBookingUrl } from '@/lib/data/hotel-programme-booking'
import type { RedemptionRailDefinition, TravelKind } from './types'

const AMEX_TRANSFER_URL = 'https://global.americanexpress.com/rewards/transfer'
const AMEX_CARD_IDS = ['amex-platinum-travel', 'amex-mrcc', 'amex-gold', 'amex-gold-charge', 'amex-smartearn']

const AMEX_PARTNERS = [
  { id: 'asia-miles', name: 'Asia Miles', currency: 'Asia Miles', kind: 'flight' as const, from: 800, to: 400, min: 800, inc: 800, duration: 'up to 48 hours', durationHoursMax: 48 },
  { id: 'british-airways-club', name: 'British Airways Executive Club', currency: 'Avios', kind: 'flight' as const, from: 1200, to: 600, min: null, inc: null, duration: null, durationHoursMax: null },
  { id: 'qatar-privilege-club', name: 'Qatar Privilege Club', currency: 'Avios', kind: 'flight' as const, from: 500, to: 250, min: null, inc: null, duration: null, durationHoursMax: null },
  { id: 'krisflyer', name: 'Singapore KrisFlyer', currency: 'KrisFlyer Miles', kind: 'flight' as const, from: 800, to: 400, min: null, inc: null, duration: null, durationHoursMax: null },
  { id: 'virgin-atlantic-flying-club', name: 'Virgin Atlantic Flying Club', currency: 'Virgin Points', kind: 'flight' as const, from: 800, to: 640, min: null, inc: null, duration: null, durationHoursMax: null },
  { id: 'hilton-honors', name: 'Hilton Honors', currency: 'Hilton Honors Points', kind: 'hotel' as const, from: 1000, to: 1500, min: 1000, inc: 1000, duration: 'up to 48 hours', durationHoursMax: 48 },
  { id: 'marriott-bonvoy', name: 'Marriott Bonvoy', currency: 'Marriott Bonvoy Points', kind: 'hotel' as const, from: 100, to: 100, min: 100, inc: 100, duration: 'up to 48 hours', durationHoursMax: 48 },
] as const

function bookingUrl(partner: (typeof AMEX_PARTNERS)[number]) {
  return partner.kind === 'flight'
    ? flightProgrammeBookingUrl(partner.id)
    : hotelProgrammeBookingUrl(partner.id)
}

export const AMEX_EXACT_TRANSFER_RAILS: readonly RedemptionRailDefinition[] = AMEX_PARTNERS.map(partner => ({
  id: `amex-membership-rewards-transfer-${partner.id}`,
  cardIds: [...AMEX_CARD_IDS],
  issuer: 'American Express',
  type: 'LOYALTY_TRANSFER',
  travelKinds: [partner.kind],
  executionState: 'RATIO_ONLY',
  evidence: [{
    kind: 'ISSUER_CAPTURE',
    sourceId: 'amex-india-transfer-partners-2026-09-11',
    sourceUrl: AMEX_TRANSFER_URL,
    capturedAt: '2026-09-11',
    note: `Official American Express India Membership Rewards transfer page captured 11 Sep 2026: ${partner.from} Membership Rewards points = ${partner.to} ${partner.currency}.${partner.min != null ? ` Minimum ${partner.min}.` : ''}${partner.inc != null ? ` Increment ${partner.inc}.` : ''}${partner.duration ? ` Estimated transfer ${partner.duration}.` : ''}`,
  }],
  transfer: {
    programmeId: partner.id,
    programmeName: partner.name,
    destinationCurrency: partner.currency,
    ratio: { fromUnits: partner.from, toUnits: partner.to },
    durationText: partner.duration,
    durationHoursMax: partner.durationHoursMax,
    irreversible: true,
    minimumBankPoints: partner.min,
    incrementBankPoints: partner.inc,
  },
  bookingDestination: partner.name,
  ...(bookingUrl(partner) ? { bookingUrl: bookingUrl(partner)! } : {}),
}))

export function amexExactRailsForCard(cardId: string, travelKind: TravelKind, programmeId?: string | null): RedemptionRailDefinition[] {
  return AMEX_EXACT_TRANSFER_RAILS.filter(rail => {
    if (!rail.cardIds.includes(cardId) || !rail.travelKinds.includes(travelKind)) return false
    if (!programmeId) return true
    return rail.transfer?.programmeId === programmeId
  })
}

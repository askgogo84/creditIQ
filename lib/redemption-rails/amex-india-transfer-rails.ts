import { flightProgrammeBookingUrl } from '@/lib/data/flight-programme-booking'
import { hotelProgrammeBookingUrl } from '@/lib/data/hotel-programme-booking'
import type { RedemptionRailDefinition, TravelKind } from './types'

const SOURCE_URL = 'https://global.americanexpress.com/rewards/transfer'
const CAPTURED_AT = '2026-09-11'

const AMEX_CARD_IDS = [
  'amex-platinum-travel',
  'amex-mrcc',
  'amex-gold',
  'amex-smartearn',
]

type Partner = {
  id: string
  displayName: string
  currency: string
  kind: TravelKind
  from: number
  to: number
  minimum?: number
  increment?: number
  durationText?: string
}

const PARTNERS: Partner[] = [
  { id: 'cathay', displayName: 'Asia Miles', currency: 'Asia Miles', kind: 'flight', from: 800, to: 400, minimum: 800, increment: 800, durationText: 'Up to 48 hours' },
  { id: 'british-airways-club', displayName: 'British Airways Executive Club', currency: 'Avios', kind: 'flight', from: 1200, to: 600 },
  { id: 'qatar-privilege-club', displayName: 'Qatar Privilege Club', currency: 'Avios', kind: 'flight', from: 500, to: 250 },
  { id: 'krisflyer', displayName: 'Singapore Airlines KrisFlyer', currency: 'KrisFlyer miles', kind: 'flight', from: 800, to: 400 },
  { id: 'virgin-atlantic-flying-club', displayName: 'Virgin Atlantic Flying Club', currency: 'Virgin Points', kind: 'flight', from: 800, to: 640 },
  { id: 'hilton-honors', displayName: 'Hilton Honors', currency: 'Hilton Honors Points', kind: 'hotel', from: 1000, to: 1500, minimum: 1000, increment: 1000, durationText: 'Up to 48 hours' },
  { id: 'marriott-bonvoy', displayName: 'Marriott Bonvoy', currency: 'Marriott Bonvoy Points', kind: 'hotel', from: 100, to: 100, minimum: 100, increment: 100, durationText: 'Up to 48 hours' },
]

function rail(partner: Partner): RedemptionRailDefinition {
  const bookingUrl = partner.kind === 'flight'
    ? flightProgrammeBookingUrl(partner.id)
    : hotelProgrammeBookingUrl(partner.id)

  return {
    id: `amex-india-transfer-${partner.id}`,
    cardIds: AMEX_CARD_IDS,
    issuer: 'American Express',
    type: 'LOYALTY_TRANSFER',
    travelKinds: [partner.kind],
    executionState: partner.minimum != null && partner.increment != null ? 'RATIO_ONLY' : 'RATIO_ONLY',
    evidence: [{
      kind: 'ISSUER_CAPTURE',
      sourceId: 'amex-india-transfer-grid-2026-09-11',
      sourceUrl: SOURCE_URL,
      capturedAt: CAPTURED_AT,
      note: 'American Express India transfer-partner page captured on 11 Sep 2026. Partner ratio is exact from issuer page. Minimum/increment/TAT are included only where the issuer detail panel was captured; otherwise those execution fields remain withheld.',
    }],
    transfer: {
      programmeId: partner.id,
      programmeName: partner.displayName,
      destinationCurrency: partner.currency,
      ratio: { fromUnits: partner.from, toUnits: partner.to },
      durationText: partner.durationText ?? null,
      durationHoursMax: partner.durationText ? 48 : null,
      irreversible: true,
      minimumBankPoints: partner.minimum ?? null,
      incrementBankPoints: partner.increment ?? null,
    },
    bookingDestination: partner.displayName,
    ...(bookingUrl ? { bookingUrl } : {}),
  }
}

export const AMEX_INDIA_TRANSFER_RAILS: readonly RedemptionRailDefinition[] = PARTNERS.map(rail)

export function amexIndiaRailsForCard(cardId: string, travelKind: TravelKind, programmeId?: string | null) {
  return AMEX_INDIA_TRANSFER_RAILS.filter(item =>
    item.cardIds.includes(cardId) &&
    item.travelKinds.includes(travelKind) &&
    (!programmeId || item.transfer?.programmeId === programmeId),
  )
}

import { flightProgrammeBookingUrl } from '@/lib/data/flight-programme-booking'
import { hotelProgrammeBookingUrl } from '@/lib/data/hotel-programme-booking'
import type { RedemptionRailDefinition, TravelKind } from './types'

const AMEX_MR_URL = 'https://www.americanexpress.com/en-in/benefits/rewards/membership-rewards/'
const AMEX_TRANSFER_URL = 'https://global.americanexpress.com/rewards/transfer'
const AMEX_REWARDS_URL = 'https://global.americanexpress.com/rewards'
const AMEX_CAPTURED_AT = '2026-09-11'

function norm(value: unknown) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function isAmex(bank: string) {
  const n = norm(bank)
  return n === 'amex' || n.includes('americanexpress')
}

function isHsbc(bank: string) {
  return norm(bank).includes('hsbc')
}

function isMembershipRewardsEligibleName(cardName: string) {
  const n = norm(cardName)
  return [
    'centurion',
    'platinum',
    'platinumreserve',
    'platinumtravel',
    'gold',
    'goldcharge',
    'membershiprewards',
    'mrcc',
    'smartearn',
  ].some(token => n.includes(token))
}

function isHsbcTransferEligibleName(cardName: string) {
  const n = norm(cardName)
  return ['travelone', 'premier'].some(token => n.includes(token))
}

type CapturedAmexPartner = {
  programmeId: string
  programmeName: string
  destinationCurrency: string
  travelKind: TravelKind
  ratioFrom: number
  ratioTo: number
  minimum: number | null
  increment: number | null
  maximum: number | null
  durationText: string | null
  durationHoursMax: number | null
}

/**
 * Captured from the India Membership Rewards transfer page on 2026-09-11.
 * These values are intentionally separated from the generic Amex transfer hub:
 * exact partner ratios can be used in wallet math, while any partner not in this
 * capture remains a discovery/verification path rather than being guessed.
 */
const AMEX_CAPTURED_PARTNERS: readonly CapturedAmexPartner[] = [
  {
    programmeId: 'cathay',
    programmeName: 'Cathay Asia Miles',
    destinationCurrency: 'Asia Miles',
    travelKind: 'flight',
    ratioFrom: 800,
    ratioTo: 400,
    minimum: 800,
    increment: 800,
    maximum: 900000,
    durationText: 'Up to 48 hours',
    durationHoursMax: 48,
  },
  {
    programmeId: 'british-airways-club',
    programmeName: 'British Airways Executive Club',
    destinationCurrency: 'Avios',
    travelKind: 'flight',
    ratioFrom: 1200,
    ratioTo: 600,
    minimum: null,
    increment: null,
    maximum: null,
    durationText: null,
    durationHoursMax: null,
  },
  {
    programmeId: 'qatar-privilege-club',
    programmeName: 'Qatar Privilege Club',
    destinationCurrency: 'Avios',
    travelKind: 'flight',
    ratioFrom: 500,
    ratioTo: 250,
    minimum: null,
    increment: null,
    maximum: null,
    durationText: null,
    durationHoursMax: null,
  },
  {
    programmeId: 'krisflyer',
    programmeName: 'Singapore Airlines KrisFlyer',
    destinationCurrency: 'KrisFlyer miles',
    travelKind: 'flight',
    ratioFrom: 800,
    ratioTo: 400,
    minimum: null,
    increment: null,
    maximum: null,
    durationText: null,
    durationHoursMax: null,
  },
  {
    programmeId: 'virgin-atlantic-flying-club',
    programmeName: 'Virgin Atlantic Flying Club',
    destinationCurrency: 'Virgin Points',
    travelKind: 'flight',
    ratioFrom: 800,
    ratioTo: 640,
    minimum: null,
    increment: null,
    maximum: null,
    durationText: null,
    durationHoursMax: null,
  },
  {
    programmeId: 'hilton-honors',
    programmeName: 'Hilton Honors',
    destinationCurrency: 'Hilton Honors Points',
    travelKind: 'hotel',
    ratioFrom: 1000,
    ratioTo: 1500,
    minimum: 1000,
    increment: 1000,
    maximum: 900000,
    durationText: 'Up to 48 hours',
    durationHoursMax: 48,
  },
  {
    programmeId: 'marriott-bonvoy',
    programmeName: 'Marriott Bonvoy',
    destinationCurrency: 'Marriott Bonvoy Points',
    travelKind: 'hotel',
    ratioFrom: 100,
    ratioTo: 100,
    minimum: 100,
    increment: 100,
    maximum: 900000,
    durationText: 'Up to 48 hours',
    durationHoursMax: 48,
  },
]

function exactAmexTransferRail(cardName: string, partner: CapturedAmexPartner): RedemptionRailDefinition {
  const bookingUrl = partner.travelKind === 'flight'
    ? flightProgrammeBookingUrl(partner.programmeId)
    : hotelProgrammeBookingUrl(partner.programmeId)

  return {
    id: `amex-membership-rewards-${norm(cardName)}-${partner.programmeId}`,
    cardIds: [],
    issuer: 'American Express',
    type: 'LOYALTY_TRANSFER',
    travelKinds: [partner.travelKind],
    executionState: partner.minimum != null && partner.increment != null ? 'EXECUTABLE' : 'RATIO_ONLY',
    evidence: [{
      kind: 'ISSUER_CAPTURE',
      sourceId: `amex-india-transfer-${partner.programmeId}-2026-09-11`,
      sourceUrl: AMEX_TRANSFER_URL,
      capturedAt: AMEX_CAPTURED_AT,
      note: `${partner.ratioFrom} Membership Rewards points = ${partner.ratioTo} ${partner.destinationCurrency}.${partner.minimum != null ? ` Minimum ${partner.minimum.toLocaleString('en-IN')} MR.` : ''}${partner.increment != null ? ` Increment ${partner.increment.toLocaleString('en-IN')} MR.` : ''}${partner.maximum != null ? ` Maximum ${partner.maximum.toLocaleString('en-IN')} MR.` : ''}${partner.durationText ? ` Estimated transfer ${partner.durationText}.` : ''}`,
    }],
    transfer: {
      programmeId: partner.programmeId,
      programmeName: partner.programmeName,
      destinationCurrency: partner.destinationCurrency,
      ratio: { fromUnits: partner.ratioFrom, toUnits: partner.ratioTo },
      durationText: partner.durationText,
      durationHoursMax: partner.durationHoursMax,
      irreversible: true,
      minimumBankPoints: partner.minimum,
      incrementBankPoints: partner.increment,
    },
    bookingDestination: partner.programmeName,
    ...(bookingUrl ? { bookingUrl } : {}),
    notes: partner.maximum != null ? [`Captured maximum transfer: ${partner.maximum.toLocaleString('en-IN')} Membership Rewards points.`] : undefined,
  }
}

function hsbcTransferHub(travelKind: TravelKind): RedemptionRailDefinition {
  return {
    id: 'hsbc-premium-rewards-transfer-hub',
    cardIds: [],
    issuer: 'HSBC',
    type: 'BANK_TRAVEL_PORTAL',
    travelKinds: [travelKind],
    executionState: 'DISCOVERY_ONLY',
    evidence: [{
      kind: 'ISSUER_PUBLIC',
      sourceId: 'hsbc-india-rewards-transfer-hub',
      note: 'Eligible HSBC premium travel cards can access airline/hotel rewards transfers. Partner-specific ratio, minimum and live eligibility must be verified in the issuer rewards account before CreditIQ can promote a transfer instruction.',
    }],
    portal: {
      portalName: 'HSBC Rewards transfer partners',
      supportsPointsPlusCash: false,
      valuePerPointPaise: null,
      maxPointsShareBps: null,
      feeMinor: null,
    },
    bookingDestination: 'HSBC Rewards transfer partners',
    notes: ['Discovery-only transfer hub. No partner ratio is inferred.'],
  }
}

/**
 * Keep issuer transfer ecosystems visible for eligible wallet products even
 * when a duplicate catalogue row cannot be mapped to a canonical card slug.
 * Exact captured partners are emitted as real loyalty-transfer rails where we
 * have them; broad hubs remain discovery/verification paths without guessed ratios.
 */
export function walletIssuerHubRails(input: {
  bank: string
  cardName: string
  travelKind: TravelKind
}): RedemptionRailDefinition[] {
  if (isHsbc(input.bank) && isHsbcTransferEligibleName(input.cardName)) {
    return [hsbcTransferHub(input.travelKind)]
  }

  if (!isAmex(input.bank) || !isMembershipRewardsEligibleName(input.cardName)) return []

  const exact = AMEX_CAPTURED_PARTNERS
    .filter(partner => partner.travelKind === input.travelKind)
    .map(partner => exactAmexTransferRail(input.cardName, partner))

  return [
    ...exact,
    {
      id: `amex-membership-rewards-wallet-hub-${norm(input.cardName)}`,
      cardIds: [],
      issuer: 'American Express',
      type: 'BANK_TRAVEL_PORTAL',
      travelKinds: [input.travelKind],
      executionState: 'DISCOVERY_ONLY',
      evidence: [{
        kind: 'ISSUER_PUBLIC',
        sourceId: 'amex-india-membership-rewards-transfers',
        sourceUrl: AMEX_MR_URL,
        note: 'American Express India confirms Membership Rewards transfers to participating airline and hotel loyalty programmes. Exact captured partners are shown separately. Any partner not present in the 2026-09-11 capture remains a login-time verification path rather than being assigned a guessed ratio.',
      }],
      portal: {
        portalName: 'Amex Membership Rewards transfer partners',
        supportsPointsPlusCash: false,
        valuePerPointPaise: null,
        maxPointsShareBps: null,
        feeMinor: null,
      },
      bookingDestination: 'Amex Membership Rewards transfer partners',
      bookingUrl: AMEX_REWARDS_URL,
      notes: ['Exact captured ratios are used where available. Verify live partner availability before an irreversible transfer.'],
    },
  ]
}

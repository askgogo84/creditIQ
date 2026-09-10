import {
  AXIS_MAGNUS_BURGUNDY_AS_OF,
  AXIS_MAGNUS_BURGUNDY_PARTNERS,
  AXIS_MAGNUS_BURGUNDY_SOURCE,
} from '@/lib/data/axis-magnus-burgundy-transfer-partners'
import { flightProgrammeBookingUrl } from '@/lib/data/flight-programme-booking'
import { hotelProgrammeBookingUrl } from '@/lib/data/hotel-programme-booking'
import type { RedemptionRailDefinition, TravelKind } from './types'

const HDFC_DCB_TNC = 'https://www.hdfcbank.com/content/bbp/repositories/723fb80a-2dde-42a3-9793-7ae1be57c87f/?path=%2FPersonal%2FPay%2FCards%2FCredit+Card%2FCredit+Card+Landing+Page%2FCredit+Cards%2FSuper+Premium%2FDiners+Club+Black%2FDiners-Black-Service-Communication-Latest.pdf'
const HDFC_MITC = 'https://www.hdfcbank.com/content/bbp/repositories/723fb80a-2dde-42a3-9793-7ae1be57c87f/?path=%2FPersonal%2FPay%2FCards%2FCredit+Card%2FCredit+Card+Landing+Page%2FCredit+Cards%2FMITC.pdf'
const HDFC_DCB_VALUE = 'https://www.hdfcbank.com/content/bbp/repositories/723fb80a-2dde-42a3-9793-7ae1be57c87f/?path=%2FFooter%2FNeed+Help%2FFAQ%2FValue+Chart+of+CC%2FValue+proposition+_+Diners+Black.pdf'
const HDFC_REGALIA_GOLD = 'https://www.hdfcbank.com/content/bbp/repositories/723fb80a-2dde-42a3-9793-7ae1be57c87f/?path=%2FPersonal%2FPay%2FCards%2FCredit+Card%2FCredit+Card+Landing+Page%2FCredit+Cards%2FSuper+Premium%2FRegalia+Gold+Credit+Card%2FRewards-redemption-through-Smartbuy.pdf'
const HDFC_DINERS_PRIVILEGE = 'https://www.hdfcbank.com/content/bbp/repositories/723fb80a-2dde-42a3-9793-7ae1be57c87f/?path=%2FPersonal%2FPay%2FCards%2FCredit+Card%2FCredit+Card+Landing+Page%2FCredit+Cards%2FSuper+Premium%2FDiners+Club+Privilege+New%2FKnow-more-Privilege-Portfolio-Communication.pdf'
const AMEX_MR = 'https://www.americanexpress.com/en-in/benefits/rewards/membership-rewards/'
const HSBC_REWARDS = 'https://www.about.hsbc.co.in/-/media/india/en/news-and-media/250514-hsbc-rewards-platform-2025.pdf?sc_lang=en-GB'

function magnusRail(partner: (typeof AXIS_MAGNUS_BURGUNDY_PARTNERS)[number]): RedemptionRailDefinition {
  const bookingUrl = partner.kind === 'flight'
    ? flightProgrammeBookingUrl(partner.id)
    : hotelProgrammeBookingUrl(partner.id)

  return {
    id: `axis-magnus-burgundy-transfer-${partner.id}`,
    cardIds: ['axis-magnus-burgundy'],
    issuer: 'Axis',
    type: 'LOYALTY_TRANSFER',
    travelKinds: [partner.kind],
    executionState: 'RATIO_ONLY',
    evidence: [{
      kind: 'ISSUER_PUBLIC',
      sourceId: 'axis-magnus-burgundy-transfer-grid-2026',
      sourceUrl: AXIS_MAGNUS_BURGUNDY_SOURCE,
      capturedAt: AXIS_MAGNUS_BURGUNDY_AS_OF,
      note: `Magnus for Burgundy only. Current Axis ratio; Partner Group ${partner.group}.${partner.note ? ` ${partner.note}` : ''}`,
    }],
    transfer: {
      programmeId: partner.id,
      programmeName: partner.displayName,
      destinationCurrency: partner.destinationCurrency,
      ratio: { fromUnits: partner.ratioFrom, toUnits: partner.ratioTo },
      durationText: partner.tat,
      durationHoursMax: null,
      irreversible: true,
      minimumBankPoints: null,
      incrementBankPoints: null,
    },
    bookingDestination: partner.displayName,
    ...(bookingUrl ? { bookingUrl } : {}),
  }
}

const magnusRails = AXIS_MAGNUS_BURGUNDY_PARTNERS.map(magnusRail)

const dinersBlackTransfers: RedemptionRailDefinition[] = [
  ['turkish-miles-smiles', 'Turkish Airlines Miles&Smiles', 'Miles&Smiles Miles', 'flight'],
  ['avianca-lifemiles', 'Avianca LifeMiles', 'LifeMiles', 'flight'],
  ['accor-all', 'ALL – Accor Live Limitless', 'ALL Accor Reward points', 'hotel'],
].map(([programmeId, programmeName, destinationCurrency, kind]) => ({
  id: `hdfc-diners-black-transfer-${programmeId}`,
  cardIds: ['hdfc-diners-black'],
  issuer: 'HDFC',
  type: 'LOYALTY_TRANSFER' as const,
  travelKinds: [kind as TravelKind],
  executionState: 'RATIO_ONLY' as const,
  evidence: [{
    kind: 'ISSUER_PUBLIC' as const,
    sourceId: 'hdfc-diners-black-transfer-2026',
    sourceUrl: HDFC_DCB_TNC,
    capturedAt: '2025-10-16',
    note: 'HDFC Diners Black communication states 2 Reward Points convert to 1 Loyalty Point for Turkish Miles, Accor and Avianca LifeMiles. Minimum, increment and TAT are not stated here and remain withheld.',
  }],
  transfer: {
    programmeId,
    programmeName,
    destinationCurrency,
    ratio: { fromUnits: 2, toUnits: 1 },
    durationText: null,
    durationHoursMax: null,
    irreversible: true,
    minimumBankPoints: null,
    incrementBankPoints: null,
  },
  bookingDestination: programmeName,
  ...((kind === 'flight' ? flightProgrammeBookingUrl(programmeId) : hotelProgrammeBookingUrl(programmeId))
    ? { bookingUrl: (kind === 'flight' ? flightProgrammeBookingUrl(programmeId) : hotelProgrammeBookingUrl(programmeId))! }
    : {}),
}))

const hdfcSmartBuyRails: RedemptionRailDefinition[] = [
  {
    id: 'hdfc-diners-black-smartbuy-travel',
    cardIds: ['hdfc-diners-black'],
    issuer: 'HDFC',
    type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'],
    executionState: 'CHECKOUT_REQUIRED',
    evidence: [
      { kind: 'ISSUER_PUBLIC', sourceId: 'hdfc-dcb-value', sourceUrl: HDFC_DCB_VALUE, note: 'HDFC Diners Black value proposition states 1 Reward Point = INR 1 for airline/hotel travel vouchers on SmartBuy.' },
      { kind: 'ISSUER_PUBLIC', sourceId: 'hdfc-mitc-70pct-travel-cap', sourceUrl: HDFC_MITC, note: 'HDFC MITC permits up to 70% of a flight/hotel booking value to be redeemed with points for Diners Black; balance is paid by card.' },
      { kind: 'ISSUER_PUBLIC', sourceId: 'hdfc-dcb-75k-monthly-redemption-cap', sourceUrl: HDFC_DCB_TNC, capturedAt: '2025-10-16', note: 'Diners Black SmartBuy flight/hotel reward-point redemption is capped at 75,000 Reward Points per calendar month.' },
    ],
    portal: {
      portalName: 'HDFC SmartBuy',
      supportsPointsPlusCash: true,
      valuePerPointPaise: 100,
      maxPointsShareBps: 7_000,
      feeMinor: null,
    },
    bookingDestination: 'HDFC SmartBuy',
    bookingUrl: 'https://offers.smartbuy.hdfcbank.com/diners',
    notes: ['Monthly Reward Point cap: 75,000. Final fare and any current fee remain checkout facts.'],
  },
  {
    id: 'hdfc-regalia-gold-smartbuy-travel',
    cardIds: ['hdfc-regalia-gold'],
    issuer: 'HDFC',
    type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'],
    executionState: 'CHECKOUT_REQUIRED',
    evidence: [
      { kind: 'ISSUER_PUBLIC', sourceId: 'hdfc-regalia-gold-smartbuy', sourceUrl: HDFC_REGALIA_GOLD, note: 'Regalia Gold: 1 Reward Point = INR 0.50 for flight/hotel bookings via SmartBuy.' },
      { kind: 'ISSUER_PUBLIC', sourceId: 'hdfc-mitc-70pct-travel-cap', sourceUrl: HDFC_MITC, note: 'HDFC MITC permits up to 70% of eligible flight/hotel booking value to be redeemed with Reward Points for Regalia Gold.' },
    ],
    portal: {
      portalName: 'HDFC SmartBuy',
      supportsPointsPlusCash: true,
      valuePerPointPaise: 50,
      maxPointsShareBps: 7_000,
      feeMinor: null,
    },
    bookingDestination: 'HDFC SmartBuy',
    bookingUrl: 'https://offers.reward360.in/v1/regaliagold',
  },
  {
    id: 'hdfc-diners-privilege-smartbuy-travel',
    cardIds: ['hdfc-diners-privilege'],
    issuer: 'HDFC',
    type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'],
    executionState: 'CHECKOUT_REQUIRED',
    evidence: [{
      kind: 'ISSUER_PUBLIC',
      sourceId: 'hdfc-diners-privilege-smartbuy',
      sourceUrl: HDFC_DINERS_PRIVILEGE,
      note: 'Diners Club Privilege: 1 Reward Point = INR 0.50 for flight/hotel bookings and up to 70% of booking value may be paid with points.',
    }],
    portal: {
      portalName: 'HDFC SmartBuy',
      supportsPointsPlusCash: true,
      valuePerPointPaise: 50,
      maxPointsShareBps: 7_000,
      feeMinor: null,
    },
    bookingDestination: 'HDFC SmartBuy',
    bookingUrl: 'https://offers.smartbuy.hdfcbank.com/diners',
  },
]

function transferHubRail(input: {
  id: string
  cardIds: string[]
  issuer: string
  portalName: string
  sourceId: string
  sourceUrl: string
  note: string
  bookingUrl: string
}): RedemptionRailDefinition {
  return {
    id: input.id,
    cardIds: input.cardIds,
    issuer: input.issuer,
    type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'],
    executionState: 'DISCOVERY_ONLY',
    evidence: [{ kind: 'ISSUER_PUBLIC', sourceId: input.sourceId, sourceUrl: input.sourceUrl, note: input.note }],
    portal: {
      portalName: input.portalName,
      supportsPointsPlusCash: false,
      valuePerPointPaise: null,
      maxPointsShareBps: null,
      feeMinor: null,
    },
    bookingDestination: input.portalName,
    bookingUrl: input.bookingUrl,
  }
}

const membershipRewardHubs: RedemptionRailDefinition[] = [
  transferHubRail({
    id: 'amex-membership-rewards-transfer-hub',
    cardIds: ['amex-platinum-travel', 'amex-mrcc', 'amex-gold', 'amex-gold-charge'],
    issuer: 'American Express',
    portalName: 'Amex Membership Rewards transfer partners',
    sourceId: 'amex-india-membership-rewards-transfers',
    sourceUrl: AMEX_MR,
    note: 'Amex India confirms Membership Rewards transfers to participating airline and hotel programmes. Transfers usually take 3–5 working days and are irreversible. Partner-specific conversion levels can change and are not fabricated here; open the logged-in transfer hub to verify the selected partner.',
    bookingUrl: 'https://global.americanexpress.com/rewards',
  }),
  transferHubRail({
    id: 'hsbc-premium-rewards-transfer-hub',
    cardIds: ['hsbc-premier', 'hsbc-travelone'],
    issuer: 'HSBC',
    portalName: 'HSBC Rewards Marketplace transfer partners',
    sourceId: 'hsbc-india-rewards-marketplace-2025',
    sourceUrl: HSBC_REWARDS,
    note: 'HSBC India confirms 20 transfer partners: 15 airlines plus Accor, Marriott Bonvoy, IHG, Shangri-La Circle and Wyndham. Premier/Privé/TravelOne receive 1:1 for most transfer partners with about one-day turnaround. Because “most” is not partner-specific, CreditIQ does not label every partner 1:1 until the selected conversion is verified.',
    bookingUrl: 'https://www.hsbc.co.in/credit-cards/rewards/',
  }),
]

const SUPPLEMENTAL_RAILS: readonly RedemptionRailDefinition[] = [
  ...magnusRails,
  ...dinersBlackTransfers,
  ...hdfcSmartBuyRails,
  ...membershipRewardHubs,
]

export function supplementalRailsForCard(cardId: string, travelKind: TravelKind, programmeId?: string | null): RedemptionRailDefinition[] {
  return SUPPLEMENTAL_RAILS.filter(rail => {
    if (!rail.cardIds.includes(cardId) || !rail.travelKinds.includes(travelKind)) return false
    if (!programmeId || rail.type !== 'LOYALTY_TRANSFER') return true
    return rail.transfer?.programmeId === programmeId
  })
}

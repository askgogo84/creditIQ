import { HDFC_INFINIA_AS_OF, HDFC_INFINIA_SOURCE, HDFC_INFINIA_TRANSFER_PARTNERS } from '@/lib/data/hdfc-transfer-partners'
import {
  AXIS_ATLAS_AS_OF,
  AXIS_ATLAS_CARD_SOURCE,
  AXIS_ATLAS_PORTAL,
  AXIS_ATLAS_TRANSFER_PARTNERS,
  AXIS_ATLAS_TRAVEL_EDGE_SOURCE,
} from '@/lib/data/axis-atlas-redemption'
import { flightProgrammeBookingUrl } from '@/lib/data/flight-programme-booking'
import type {
  RailQuery,
  RationalRatio,
  RedemptionRailDefinition,
  TravelKind,
} from './types'

function integerRatio(fromPoints: number, toUnits: number): RationalRatio {
  if (!Number.isFinite(fromPoints) || !Number.isFinite(toUnits) || fromPoints <= 0 || toUnits <= 0) {
    throw new Error('invalid transfer ratio')
  }

  if (Number.isInteger(fromPoints) && Number.isInteger(toUnits)) {
    return { fromUnits: fromPoints, toUnits }
  }
  if (fromPoints === 1 && toUnits === 0.5) {
    return { fromUnits: 2, toUnits: 1 }
  }

  throw new Error(`unsupported non-integer transfer ratio ${fromPoints}:${toUnits}`)
}

const hdfcInfiniaTransferRails: RedemptionRailDefinition[] = HDFC_INFINIA_TRANSFER_PARTNERS.map((partner) => ({
  id: `hdfc-infinia-transfer-${partner.id}`,
  cardIds: ['hdfc-infinia'],
  issuer: 'HDFC',
  type: 'LOYALTY_TRANSFER',
  travelKinds: [partner.kind === 'hotel' ? 'hotel' : 'flight'],
  executionState: 'RATIO_ONLY',
  evidence: [{
    kind: 'ISSUER_CAPTURE',
    sourceId: 'hdfc-infinia-reward360-transfer-partners',
    sourceUrl: HDFC_INFINIA_SOURCE,
    capturedAt: HDFC_INFINIA_AS_OF,
    note: 'Logged-in Infinia transfer-partner page; card scope is Infinia only.',
  }],
  transfer: {
    programmeId: partner.id,
    programmeName: partner.display_name,
    destinationCurrency: partner.destination_currency,
    ratio: integerRatio(partner.from_points, partner.to_units),
    durationText: partner.duration_text,
    durationHoursMax: partner.duration_hours_max,
    irreversible: true,
    minimumBankPoints: null,
    incrementBankPoints: null,
  },
  bookingDestination: partner.display_name,
  ...(flightProgrammeBookingUrl(partner.id) ? { bookingUrl: flightProgrammeBookingUrl(partner.id)! } : {}),
}))

const axisAtlasTransferRails: RedemptionRailDefinition[] = AXIS_ATLAS_TRANSFER_PARTNERS.map((partner) => ({
  id: `axis-atlas-transfer-${partner.id}`,
  cardIds: ['axis-atlas'],
  issuer: 'Axis',
  type: 'LOYALTY_TRANSFER',
  travelKinds: [partner.kind],
  executionState: 'RATIO_ONLY',
  evidence: [{
    kind: 'ISSUER_PUBLIC',
    sourceId: 'axis-travel-edge-partners-2026',
    sourceUrl: AXIS_ATLAS_TRAVEL_EDGE_SOURCE,
    capturedAt: AXIS_ATLAS_AS_OF,
    note: 'Axis Travel EDGE partner table effective 2 Apr 2026; exact Atlas column only.',
  }],
  transfer: {
    programmeId: partner.id,
    programmeName: partner.displayName,
    destinationCurrency: partner.destinationCurrency,
    ratio: integerRatio(partner.fromMiles, partner.toPartnerUnits),
    durationText: null,
    durationHoursMax: null,
    irreversible: true,
    minimumBankPoints: null,
    incrementBankPoints: null,
  },
  bookingDestination: partner.displayName,
  ...(flightProgrammeBookingUrl(partner.id) ? { bookingUrl: flightProgrammeBookingUrl(partner.id)! } : {}),
}))

/**
 * Portal/native rails. CHECKOUT_REQUIRED means we may calculate sourced fixed
 * value/cap mechanics, while the issuer's own fare, fees and final checkout stay
 * authoritative. Unknown mechanics remain null rather than being invented.
 */
const discoveryRails: RedemptionRailDefinition[] = [
  {
    id: 'hdfc-infinia-smartbuy-travel',
    cardIds: ['hdfc-infinia'], issuer: 'HDFC', type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [
      {
        kind: 'ISSUER_PUBLIC',
        sourceId: 'hdfc-infinia-current-card-page',
        sourceUrl: 'https://www.hdfc.bank.in/credit-cards/infinia-credit-card',
        capturedAt: '2026-09-09',
        note: 'Current Infinia page: flights/hotels redeem at ₹1 per Reward Point; travel/airmiles monthly cap is 1.5 lakh RP.',
      },
      {
        kind: 'ISSUER_PUBLIC',
        sourceId: 'hdfc-card-mitc-70-percent-travel',
        sourceUrl: 'https://www.hdfc.bank.in/content/dam/hdfcbankpws/in/en/personal-banking/discover-products/cards/credit-cards/cc-mitc.pdf',
        capturedAt: '2026-09-09',
        note: 'HDFC MITC: Infinia flight/hotel bookings can use points for up to 70% of booking value; remainder is paid by card.',
      },
    ],
    portal: {
      portalName: 'HDFC SmartBuy', supportsPointsPlusCash: true,
      valuePerPointPaise: 100, maxPointsShareBps: 7000, minimumPoints: null, feeMinor: null,
    },
    bookingDestination: 'HDFC SmartBuy',
    bookingUrl: 'https://offers.smartbuy.hdfcbank.com/',
    notes: ['Projected points/cash use the selected live cash fare as the benchmark; SmartBuy fare and any checkout fee must be rechecked.'],
  },
  {
    id: 'axis-atlas-travel-edge',
    cardIds: ['axis-atlas'], issuer: 'Axis', type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [
      {
        kind: 'ISSUER_PUBLIC', sourceId: 'axis-atlas-card-tc', sourceUrl: AXIS_ATLAS_CARD_SOURCE,
        capturedAt: AXIS_ATLAS_AS_OF, note: 'Atlas T&C: 1 EDGE Mile equals INR 1 and Travel EDGE is a redemption channel.',
      },
      {
        kind: 'ISSUER_PUBLIC', sourceId: 'axis-travel-edge-current', sourceUrl: AXIS_ATLAS_TRAVEL_EDGE_SOURCE,
        capturedAt: AXIS_ATLAS_AS_OF, note: 'Travel EDGE supports EDGE Miles alone or EDGE Miles + card; minimum Atlas redemption is 500 EDGE Miles.',
      },
    ],
    portal: {
      portalName: 'Axis Travel EDGE', supportsPointsPlusCash: true,
      valuePerPointPaise: AXIS_ATLAS_PORTAL.valuePerEdgeMilePaise,
      maxPointsShareBps: AXIS_ATLAS_PORTAL.maxPointsShareBps,
      minimumPoints: AXIS_ATLAS_PORTAL.minimumEdgeMiles,
      feeMinor: null,
    },
    bookingDestination: 'Axis Travel EDGE',
    bookingUrl: 'https://traveledge.axis.bank.in/',
    notes: ['Projected points/cash use the selected live fare as a benchmark; Travel EDGE checkout fare and any fee remain authoritative.'],
  },
  {
    id: 'axis-magnus-burgundy-travel-edge',
    cardIds: ['axis-magnus-burgundy'], issuer: 'Axis', type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [{ kind: 'ISSUER_PUBLIC', sourceId: 'axis-travel-edge', sourceUrl: AXIS_ATLAS_TRAVEL_EDGE_SOURCE, note: 'Travel EDGE exists; do not inherit Atlas transfer ratios or value assumptions.' }],
    portal: { portalName: 'Axis Travel EDGE', supportsPointsPlusCash: true, valuePerPointPaise: null, maxPointsShareBps: null, minimumPoints: null, feeMinor: null },
    bookingDestination: 'Axis Travel EDGE',
  },
  {
    id: 'amex-platinum-travel-amex-travel',
    cardIds: ['amex-platinum-travel'], issuer: 'American Express', type: 'MERCHANT_PAY_WITH_POINTS',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [{
      kind: 'ISSUER_PUBLIC',
      sourceId: 'amex-india-travel-points-pay',
      sourceUrl: 'https://www.americanexpress.com/in/travel/terms-and-conditions/',
      capturedAt: '2026-09-09',
      note: 'Points for Travel / Points + Pay is supported. Minimum 1,000 MR points; exact itinerary points are set by Amex at booking time.',
    }],
    portal: {
      portalName: 'American Express Travel Online', supportsPointsPlusCash: true,
      valuePerPointPaise: null, maxPointsShareBps: null, minimumPoints: 1000, feeMinor: null,
    },
    bookingDestination: 'American Express Travel Online',
    bookingUrl: 'https://www.americanexpress.com/en-in/travel/',
  },
  {
    id: 'idfc-first-wealth-travel-shop',
    cardIds: ['idfc-first-wealth'], issuer: 'IDFC FIRST', type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [{ kind: 'ISSUER_PUBLIC', sourceId: 'idfc-first-travel-shop', note: 'Travel & Shop rail confirmed; exact caps/value must be card/current-rule specific.' }],
    portal: { portalName: 'IDFC FIRST Travel & Shop', supportsPointsPlusCash: true, valuePerPointPaise: null, maxPointsShareBps: null, minimumPoints: null, feeMinor: null },
    bookingDestination: 'IDFC FIRST Travel & Shop',
  },
  {
    id: 'yes-marquee-rewardz-travel',
    cardIds: ['yes-marquee'], issuer: 'YES BANK', type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [{ kind: 'ISSUER_PUBLIC', sourceId: 'yes-rewardz-travel', note: 'YES Rewardz travel rail confirmed; current tier caps remain structured-source work.' }],
    portal: { portalName: 'YES Rewardz', supportsPointsPlusCash: true, valuePerPointPaise: null, maxPointsShareBps: null, minimumPoints: null, feeMinor: null },
    bookingDestination: 'YES Rewardz',
  },
  {
    id: 'sbi-elite-mmt-voucher',
    cardIds: ['sbi-elite'], issuer: 'SBI Card', type: 'TRAVEL_VOUCHER',
    travelKinds: ['flight', 'hotel'], executionState: 'DISCOVERY_ONLY',
    evidence: [{ kind: 'ISSUER_PUBLIC', sourceId: 'sbi-rewards-mmt-voucher', note: 'Travel voucher rail exists; denomination, points cost, expiry and combination rules must be captured before ranking.' }],
    voucher: { merchant: 'MakeMyTrip', denominationsInr: null, pointsCostPerVoucher: null, expiryDays: null, canCombine: null },
    bookingDestination: 'MakeMyTrip',
  },
  {
    id: 'hdfc-marriott-bonvoy-native',
    cardIds: ['hdfc-marriott-bonvoy'], issuer: 'HDFC', type: 'COBRAND_NATIVE',
    travelKinds: ['hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [{ kind: 'PROGRAMME_PUBLIC', sourceId: 'marriott-bonvoy-native-card', note: 'Card earns native Bonvoy currency; hotel award price still comes from Bonvoy inventory/checkout.' }],
    bookingDestination: 'Marriott Bonvoy',
  },
  {
    id: 'tata-neu-infinity-neucoins-travel',
    cardIds: ['tata-neu-infinity-hdfc'], issuer: 'HDFC / Tata Neu', type: 'COBRAND_NATIVE',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [{ kind: 'PROGRAMME_PUBLIC', sourceId: 'tata-neu-travel', note: 'NeuCoins/Tata ecosystem rail exists; exact itinerary/property applicability comes from Tata Neu checkout.' }],
    bookingDestination: 'Tata Neu',
  },
]

export const REDEMPTION_RAIL_REGISTRY: readonly RedemptionRailDefinition[] = [
  ...hdfcInfiniaTransferRails,
  ...axisAtlasTransferRails,
  ...discoveryRails,
]

export function railsForCard(cardId: string, travelKind?: TravelKind): RedemptionRailDefinition[] {
  return REDEMPTION_RAIL_REGISTRY.filter((rail) =>
    rail.cardIds.includes(cardId) && (!travelKind || rail.travelKinds.includes(travelKind)),
  )
}

export function queryRails(query: RailQuery): RedemptionRailDefinition[] {
  return railsForCard(query.cardId, query.travelKind).filter((rail) => {
    if (!query.programmeId) return true
    if (rail.type !== 'LOYALTY_TRANSFER') return true
    return rail.transfer?.programmeId === query.programmeId
  })
}

export function transferRailFor(cardId: string, programmeId: string): RedemptionRailDefinition | null {
  return REDEMPTION_RAIL_REGISTRY.find((rail) =>
    rail.type === 'LOYALTY_TRANSFER' &&
    rail.cardIds.includes(cardId) &&
    rail.transfer?.programmeId === programmeId,
  ) ?? null
}

export function cashRetainRail(travelKind: TravelKind): RedemptionRailDefinition {
  return {
    id: `cash-retain-${travelKind}`,
    cardIds: [],
    issuer: 'Cash',
    type: 'CASH_RETAIN',
    travelKinds: [travelKind],
    executionState: 'EXECUTABLE',
    evidence: [],
    bookingDestination: 'Selected booking provider',
  }
}

export function railsForWallet(cardIds: string[], travelKind: TravelKind, programmeId?: string | null): RedemptionRailDefinition[] {
  const unique = new Map<string, RedemptionRailDefinition>()
  for (const cardId of cardIds) {
    for (const rail of queryRails({ cardId, travelKind, programmeId })) unique.set(rail.id, rail)
  }
  const cash = cashRetainRail(travelKind)
  unique.set(cash.id, cash)
  return [...unique.values()]
}

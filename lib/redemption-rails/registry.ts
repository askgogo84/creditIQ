import { HDFC_INFINIA_AS_OF, HDFC_INFINIA_SOURCE, HDFC_INFINIA_TRANSFER_PARTNERS } from '@/lib/data/hdfc-transfer-partners'
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

  // Current captured issuer data uses 1 and 0.5. Convert decimal display data to
  // an exact integer rational before it enters the new registry.
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
  // Partner, ratio and SLA are captured; issuer minimum/increment are not. That
  // deliberately prevents an "exactly transfer N now" instruction.
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

/**
 * Broad rails confirmed to exist, but intentionally not executable until the
 * card-specific checkout mechanics are captured into structured facts.
 */
const discoveryRails: RedemptionRailDefinition[] = [
  {
    id: 'hdfc-infinia-smartbuy-travel',
    cardIds: ['hdfc-infinia'], issuer: 'HDFC', type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [{ kind: 'ISSUER_PUBLIC', sourceId: 'hdfc-smartbuy-travel', note: 'SmartBuy flight/hotel redemption exists; checkout/card-specific mechanics remain authoritative.' }],
    portal: { portalName: 'HDFC SmartBuy', supportsPointsPlusCash: true, valuePerPointPaise: null, maxPointsShareBps: null, feeMinor: null },
    bookingDestination: 'HDFC SmartBuy',
    bookingUrl: 'https://offers.smartbuy.hdfcbank.com/',
  },
  {
    id: 'axis-atlas-travel-edge',
    cardIds: ['axis-atlas'], issuer: 'Axis', type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [{ kind: 'ISSUER_PUBLIC', sourceId: 'axis-atlas-travel-edge', note: 'Travel EDGE booking rail confirmed; exact current redemption mechanics must be structured from issuer terms/checkout.' }],
    portal: { portalName: 'Axis Travel EDGE', supportsPointsPlusCash: true, valuePerPointPaise: null, maxPointsShareBps: null, feeMinor: null },
    bookingDestination: 'Axis Travel EDGE',
  },
  {
    id: 'axis-magnus-burgundy-travel-edge',
    cardIds: ['axis-magnus-burgundy'], issuer: 'Axis', type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [{ kind: 'ISSUER_PUBLIC', sourceId: 'axis-travel-edge', note: 'Travel EDGE exists; do not inherit Atlas transfer ratios.' }],
    portal: { portalName: 'Axis Travel EDGE', supportsPointsPlusCash: true, valuePerPointPaise: null, maxPointsShareBps: null, feeMinor: null },
    bookingDestination: 'Axis Travel EDGE',
  },
  {
    id: 'amex-platinum-travel-amex-travel',
    cardIds: ['amex-platinum-travel'], issuer: 'American Express', type: 'MERCHANT_PAY_WITH_POINTS',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [{ kind: 'ISSUER_PUBLIC', sourceId: 'amex-india-travel-points-pay', note: 'Amex Travel / Points + Pay rail confirmed; live checkout determines the payable mix.' }],
    portal: { portalName: 'American Express Travel Online', supportsPointsPlusCash: true, valuePerPointPaise: null, maxPointsShareBps: null, feeMinor: null },
    bookingDestination: 'American Express Travel Online',
  },
  {
    id: 'idfc-first-wealth-travel-shop',
    cardIds: ['idfc-first-wealth'], issuer: 'IDFC FIRST', type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [{ kind: 'ISSUER_PUBLIC', sourceId: 'idfc-first-travel-shop', note: 'Travel & Shop rail confirmed; exact caps/value must be card/current-rule specific.' }],
    portal: { portalName: 'IDFC FIRST Travel & Shop', supportsPointsPlusCash: true, valuePerPointPaise: null, maxPointsShareBps: null, feeMinor: null },
    bookingDestination: 'IDFC FIRST Travel & Shop',
  },
  {
    id: 'yes-marquee-rewardz-travel',
    cardIds: ['yes-marquee'], issuer: 'YES BANK', type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [{ kind: 'ISSUER_PUBLIC', sourceId: 'yes-rewardz-travel', note: 'YES Rewardz travel rail confirmed; current tier caps remain structured-source work.' }],
    portal: { portalName: 'YES Rewardz', supportsPointsPlusCash: true, valuePerPointPaise: null, maxPointsShareBps: null, feeMinor: null },
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

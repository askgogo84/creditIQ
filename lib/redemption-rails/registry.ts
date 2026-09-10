import { HDFC_INFINIA_AS_OF, HDFC_INFINIA_SOURCE, HDFC_INFINIA_TRANSFER_PARTNERS } from '@/lib/data/hdfc-transfer-partners'
import { AXIS_ATLAS_HOTEL_AS_OF, AXIS_ATLAS_HOTEL_PARTNERS, AXIS_ATLAS_HOTEL_SOURCE } from '@/lib/data/axis-atlas-hotel-transfer-partners'
import { flightProgrammeBookingUrl } from '@/lib/data/flight-programme-booking'
import { hotelProgrammeBookingUrl } from '@/lib/data/hotel-programme-booking'
import { TRANSFER_EDGES } from '@/lib/data/transfer-graph'
import type {
  RailQuery,
  RationalRatio,
  RedemptionRailDefinition,
  TravelKind,
} from './types'
import { programmeIdForFlightSource } from './programme-resolver'

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

const hdfcInfiniaTransferRails: RedemptionRailDefinition[] = HDFC_INFINIA_TRANSFER_PARTNERS.map((partner) => {
  const bookingUrl = partner.kind === 'hotel'
    ? hotelProgrammeBookingUrl(partner.id)
    : flightProgrammeBookingUrl(partner.id)

  return {
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
    ...(bookingUrl ? { bookingUrl } : {}),
  }
})

const AXIS_PROGRAMME_META: Record<string, { name: string; currency: string }> = {
  aeroplan: { name: 'Aeroplan', currency: 'Aeroplan points' },
  'airasia-rewards': { name: 'AirAsia rewards', currency: 'AirAsia points' },
  'air-india-maharaja': { name: 'Air India Maharaja Club', currency: 'Maharaja Points' },
  'british-airways-club': { name: 'The British Airways Club', currency: 'Avios' },
  ethiopian: { name: 'Ethiopian ShebaMiles', currency: 'ShebaMiles' },
  'etihad-guest': { name: 'Etihad Guest', currency: 'Etihad Guest Miles' },
  finnair: { name: 'Finnair Plus', currency: 'Avios' },
  'flying-blue': { name: 'Flying Blue', currency: 'Flying Blue Miles' },
  'indigo-bluchip': { name: 'IndiGo BluChip', currency: 'IndiGo BluChips' },
  'jal-mileage-bank': { name: 'JAL Mileage Bank', currency: 'JAL miles' },
  krisflyer: { name: 'KrisFlyer', currency: 'KrisFlyer miles' },
  lotusmiles: { name: 'Lotusmiles', currency: 'Lotusmiles miles' },
  qantas: { name: 'Qantas Frequent Flyer', currency: 'Qantas Points' },
  'qatar-privilege-club': { name: 'Qatar Privilege Club', currency: 'Avios' },
  spiceclub: { name: 'SpiceClub', currency: 'SC Points' },
  'thai-royal-orchid': { name: 'Thai Royal Orchid Plus', currency: 'Royal Orchid Plus miles' },
  'turkish-miles-smiles': { name: 'Turkish Airlines Miles&Smiles', currency: 'Miles&Smiles Miles' },
  'united-mileageplus': { name: 'United MileagePlus', currency: 'MileagePlus miles' },
}

function axisTat(note: string | null): string | null {
  if (!note) return null
  const match = note.match(/official TAT ([^.]+)\./i)
  return match?.[1]?.trim() || null
}

const axisAtlasTransferRails: RedemptionRailDefinition[] = TRANSFER_EDGES
  .filter((edge) => edge.from_currency === 'axis_atlas_miles' && edge.state === 'verified')
  .flatMap((edge): RedemptionRailDefinition[] => {
    const programmeId = programmeIdForFlightSource(edge.to_programme)
    if (!programmeId) return []
    const meta = AXIS_PROGRAMME_META[programmeId] ?? {
      name: programmeId.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
      currency: 'partner points',
    }
    return [{
      id: `axis-atlas-transfer-${programmeId}`,
      cardIds: ['axis-atlas'],
      issuer: 'Axis',
      type: 'LOYALTY_TRANSFER',
      travelKinds: ['flight'],
      executionState: 'RATIO_ONLY',
      evidence: [{
        kind: 'ISSUER_PUBLIC',
        sourceId: 'axis-atlas-travel-edge-transfer-2026',
        sourceUrl: edge.source,
        capturedAt: edge.as_of,
        note: edge.bonus_note ?? 'Axis Atlas official transfer ratio.',
      }],
      transfer: {
        programmeId,
        programmeName: meta.name,
        destinationCurrency: meta.currency,
        ratio: { fromUnits: edge.ratio_from, toUnits: edge.ratio_to },
        durationText: axisTat(edge.bonus_note),
        durationHoursMax: null,
        irreversible: true,
        minimumBankPoints: edge.min_transfer,
        incrementBankPoints: null,
      },
      bookingDestination: meta.name,
      ...(flightProgrammeBookingUrl(programmeId) ? { bookingUrl: flightProgrammeBookingUrl(programmeId)! } : {}),
    }]
  })

const axisAtlasHotelTransferRails: RedemptionRailDefinition[] = AXIS_ATLAS_HOTEL_PARTNERS.map((partner) => {
  const bookingUrl = hotelProgrammeBookingUrl(partner.id)
  return {
    id: `axis-atlas-transfer-${partner.id}`,
    cardIds: ['axis-atlas'],
    issuer: 'Axis',
    type: 'LOYALTY_TRANSFER',
    travelKinds: ['hotel'],
    executionState: 'RATIO_ONLY',
    evidence: [{
      kind: 'ISSUER_PUBLIC',
      sourceId: 'axis-atlas-hotel-transfer-grid-2026',
      sourceUrl: AXIS_ATLAS_HOTEL_SOURCE,
      capturedAt: AXIS_ATLAS_HOTEL_AS_OF,
      note: `Axis Atlas official EDGE Miles ratio. Partner Group ${partner.group}; Atlas annual cap is ${partner.group === 'A' ? '30,000' : '1,20,000'} EDGE Miles across Group ${partner.group}, 1,50,000 overall.`,
    }],
    transfer: {
      programmeId: partner.id,
      programmeName: partner.displayName,
      destinationCurrency: partner.destinationCurrency,
      ratio: { fromUnits: partner.ratioFrom, toUnits: partner.ratioTo },
      durationText: partner.tat,
      durationHoursMax: null,
      irreversible: true,
      minimumBankPoints: 500,
      incrementBankPoints: null,
    },
    bookingDestination: partner.displayName,
    ...(bookingUrl ? { bookingUrl } : {}),
  }
})

const discoveryRails: RedemptionRailDefinition[] = [
  {
    id: 'hdfc-infinia-smartbuy-travel',
    cardIds: ['hdfc-infinia'], issuer: 'HDFC', type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [{
      kind: 'ISSUER_PUBLIC',
      sourceId: 'hdfc-infinia-smartbuy-travel',
      note: 'Infinia travel redemption: 1 Reward Point = INR 1 and up to 70% of flight/hotel booking value may be paid with Reward Points on SmartBuy. Portal fare, monthly cap usage and any redemption fee remain checkout/account facts.',
    }],
    portal: {
      portalName: 'HDFC SmartBuy',
      supportsPointsPlusCash: true,
      valuePerPointPaise: 100,
      maxPointsShareBps: 7_000,
      feeMinor: null,
    },
    bookingDestination: 'HDFC SmartBuy',
    bookingUrl: 'https://offers.smartbuy.hdfcbank.com/',
  },
  {
    id: 'axis-atlas-travel-edge',
    cardIds: ['axis-atlas'], issuer: 'Axis', type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [{
      kind: 'ISSUER_PUBLIC',
      sourceId: 'axis-atlas-travel-edge',
      sourceUrl: 'https://traveledge.axis.bank.in/travel/common/termsandcondition',
      note: 'Atlas defines 1 EDGE Mile = INR 1. Travel EDGE supports paying by EDGE Miles or EDGE Miles + Card for flight/hotel bookings. Redemption fee remains a separate issuer charge and must be verified.',
    }],
    portal: {
      portalName: 'Axis Travel EDGE',
      supportsPointsPlusCash: true,
      valuePerPointPaise: 100,
      maxPointsShareBps: 10_000,
      feeMinor: null,
    },
    bookingDestination: 'Axis Travel EDGE',
    bookingUrl: 'https://traveledge.axis.bank.in/',
  },
  {
    id: 'axis-magnus-burgundy-travel-edge',
    cardIds: ['axis-magnus-burgundy'], issuer: 'Axis', type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [{ kind: 'ISSUER_PUBLIC', sourceId: 'axis-travel-edge', note: 'Travel EDGE exists; do not inherit Atlas transfer ratios or Atlas point value without product-specific evidence.' }],
    portal: { portalName: 'Axis Travel EDGE', supportsPointsPlusCash: true, valuePerPointPaise: null, maxPointsShareBps: null, feeMinor: null },
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
      note: 'American Express Travel Online supports Points for Travel and Points + Pay. Amex states the exact points required for a particular itinerary are determined and shown at booking, so CreditIQ must not invent a fixed conversion rate.',
    }],
    portal: { portalName: 'American Express Travel Online', supportsPointsPlusCash: true, valuePerPointPaise: null, maxPointsShareBps: null, feeMinor: null },
    bookingDestination: 'American Express Travel Online',
    bookingUrl: 'https://www.americanexpress.com/in/travel/',
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
    bookingUrl: 'https://www.marriott.com/search/findHotels.mi',
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
  ...axisAtlasHotelTransferRails,
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

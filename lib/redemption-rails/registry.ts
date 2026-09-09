import { HDFC_INFINIA_AS_OF, HDFC_INFINIA_SOURCE, HDFC_INFINIA_TRANSFER_PARTNERS } from '@/lib/data/hdfc-transfer-partners'
import { flightProgrammeBookingUrl } from '@/lib/data/flight-programme-booking'
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

const AXIS_PROGRAMME_META: Record<string, { name: string; currency: string }> = {
  aeroplan: { name: 'Aeroplan', currency: 'Aeroplan points' },
  'british-airways-club': { name: 'The British Airways Club', currency: 'Avios' },
  ethiopian: { name: 'Ethiopian ShebaMiles', currency: 'ShebaMiles' },
  'etihad-guest': { name: 'Etihad Guest', currency: 'Etihad Guest Miles' },
  finnair: { name: 'Finnair Plus', currency: 'Avios' },
  'qatar-privilege-club': { name: 'Qatar Privilege Club', currency: 'Avios' },
  krisflyer: { name: 'KrisFlyer', currency: 'KrisFlyer miles' },
  'turkish-miles-smiles': { name: 'Turkish Airlines Miles&Smiles', currency: 'Miles&Smiles Miles' },
  'united-mileageplus': { name: 'United MileagePlus', currency: 'MileagePlus miles' },
  'flying-blue': { name: 'Flying Blue', currency: 'Flying Blue Miles' },
  'air-india-maharaja': { name: 'Air India Maharaja Club', currency: 'Maharaja Points' },
  qantas: { name: 'Qantas Frequent Flyer', currency: 'Qantas Points' },
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
      // Atlas minimum is sourced, but transfer increments are not modelled yet.
      // Keep this projected until the exact issuer transfer step is fully captured.
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
        // Axis publishes working-day TAT. Do not silently convert it to calendar hours.
        durationHoursMax: null,
        irreversible: true,
        minimumBankPoints: edge.min_transfer,
        incrementBankPoints: null,
      },
      bookingDestination: meta.name,
      ...(flightProgrammeBookingUrl(programmeId) ? { bookingUrl: flightProgrammeBookingUrl(programmeId)! } : {}),
    }]
  })

/**
 * Broad rails confirmed to exist. Where card-specific value/cap facts are
 * structured, CreditIQ may show projected points arithmetic while keeping the
 * issuer checkout as the execution boundary. Unknown fees are never treated as
 * zero for an executable instruction.
 */
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
      // Travel EDGE exposes both "Pay by EDGE Miles" and "EDGE Miles + Card".
      // A full-points booking path therefore exists; checkout remains authoritative.
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

import { HDFC_INFINIA_AS_OF, HDFC_INFINIA_SOURCE, HDFC_INFINIA_TRANSFER_PARTNERS } from '@/lib/data/hdfc-transfer-partners'
import { flightProgrammeBookingUrl } from '@/lib/data/flight-programme-booking'
import { TRANSFER_EDGES } from '@/lib/data/transfer-graph'
import { programmeIdForFlightSource } from './programme-resolver'
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

const AXIS_ATLAS_PROGRAMME_NAMES: Record<string, string> = {
  aeroplan: 'Aeroplan',
  'british-airways-club': 'The British Airways Club',
  'ethiopian-shebamiles': 'Ethiopian ShebaMiles',
  'etihad-guest': 'Etihad Guest',
  'finnair-plus': 'Finnair Plus',
  'qatar-privilege-club': 'Qatar Privilege Club',
  krisflyer: 'Singapore Airlines KrisFlyer',
  'turkish-miles-smiles': 'Turkish Airlines Miles&Smiles',
  'united-mileageplus': 'United MileagePlus',
  'flying-blue': 'Flying Blue',
  'air-india-maharaja': 'Air India Maharaja Club',
  'qantas-frequent-flyer': 'Qantas Frequent Flyer',
}

function axisTat(note: string | null | undefined): string | null {
  const match = note?.match(/official TAT ([^.]+)\./i)
  return match?.[1]?.trim() || null
}

const axisAtlasTransferRails: RedemptionRailDefinition[] = TRANSFER_EDGES.flatMap((edge) => {
  if (
    edge.from_currency !== 'axis_atlas_miles' ||
    edge.state !== 'verified' ||
    !edge.card_name_allowlist?.includes('Axis Atlas')
  ) return []

  const programmeId = programmeIdForFlightSource(edge.to_programme)
  if (!programmeId) return []
  const programmeName = AXIS_ATLAS_PROGRAMME_NAMES[programmeId] ?? programmeId
  const bookingUrl = flightProgrammeBookingUrl(programmeId)

  return [{
    id: `axis-atlas-transfer-${programmeId}`,
    cardIds: ['axis-atlas'],
    issuer: 'Axis',
    type: 'LOYALTY_TRANSFER',
    travelKinds: ['flight'],
    // Ratio + 500-mile minimum + partner TAT are issuer-published. The transfer
    // increment and the user's remaining annual Group cap are checkout/account
    // facts, so the engine can calculate a required target but cannot instruct an
    // irreversible transfer yet.
    executionState: 'RATIO_ONLY',
    evidence: [{
      kind: 'ISSUER_PUBLIC',
      sourceId: 'axis-atlas-transfer-terms-2026-04-02',
      sourceUrl: edge.source,
      capturedAt: edge.as_of,
      note: 'Atlas exact-card transfer ratio, minimum, partner TAT and annual Group caps are issuer-published.',
    }],
    transfer: {
      programmeId,
      programmeName,
      destinationCurrency: `${programmeName} points/miles`,
      ratio: { fromUnits: edge.ratio_from, toUnits: edge.ratio_to },
      durationText: axisTat(edge.bonus_note),
      durationHoursMax: null,
      irreversible: true,
      minimumBankPoints: edge.min_transfer,
      incrementBankPoints: null,
    },
    bookingDestination: programmeName,
    ...(bookingUrl ? { bookingUrl } : {}),
    notes: [
      edge.bonus_note || 'Axis Atlas annual transfer cap usage must be verified before transfer.',
      'All Axis points/miles transfers are final and cannot be reversed or refunded.',
    ],
  }]
})

const discoveryRails: RedemptionRailDefinition[] = [
  {
    id: 'hdfc-infinia-smartbuy-travel',
    cardIds: ['hdfc-infinia'], issuer: 'HDFC', type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [
      {
        kind: 'ISSUER_CAPTURE',
        sourceId: 'hdfc-smartbuy-savings-calculator-infinia',
        sourceUrl: 'https://offers.reward360.in/v1/savings_calculator',
        capturedAt: '2026-08-20',
        note: 'Issuer calculator publishes the Infinia SmartBuy travel ceiling at ₹1 per Reward Point.',
      },
      {
        kind: 'ISSUER_PUBLIC',
        sourceId: 'hdfc-mitc-smartbuy-70-percent',
        sourceUrl: 'https://www.hdfcbank.com/content/bbp/repositories/723fb80a-2dde-42a3-9793-7ae1be57c87f/?path=%2FPersonal%2FPay%2FCards%2FCredit+Card%2FCredit+Card+Landing+Page%2FManage+Your+Credit+Cards+PDFs%2FMITC+1.64.pdf',
        capturedAt: '2026-09-10',
        note: 'HDFC MITC: flight/hotel redemption is capped at 70% of booking value; Infinia flight/hotel redemption is capped at 150,000 RP per calendar month.',
      },
    ],
    portal: { portalName: 'HDFC SmartBuy', supportsPointsPlusCash: true, valuePerPointPaise: 100, maxPointsShareBps: 7000, feeMinor: 0 },
    bookingDestination: 'HDFC SmartBuy',
    bookingUrl: 'https://offers.smartbuy.hdfcbank.com/',
    notes: [
      'Projected against the matched cash fare. SmartBuy portal fare and the user’s remaining 150,000-RP monthly travel cap must still be checked at checkout.',
      'HDFC’s current MITC excludes Infinia from the standard ₹99 rewards redemption fee.',
    ],
  },
  {
    id: 'axis-atlas-travel-edge',
    cardIds: ['axis-atlas'], issuer: 'Axis', type: 'BANK_TRAVEL_PORTAL',
    travelKinds: ['flight', 'hotel'], executionState: 'CHECKOUT_REQUIRED',
    evidence: [
      {
        kind: 'ISSUER_PUBLIC',
        sourceId: 'axis-atlas-card-page-edge-mile-value',
        sourceUrl: 'https://www.axis.bank.in/cards/credit-card/axis-bank-atlas-credit-card',
        capturedAt: '2026-09-10',
        note: 'Atlas page states 1 EDGE Mile = ₹1 and that EDGE Miles can be redeemed for flights, hotels and experiences on Travel EDGE.',
      },
      {
        kind: 'ISSUER_PUBLIC',
        sourceId: 'axis-travel-edge-points-plus-card',
        sourceUrl: 'https://traveledge.axis.bank.in/travel/common/termsandcondition',
        capturedAt: '2026-09-10',
        note: 'Travel EDGE permits EDGE Miles alone or EDGE Miles + Axis card; minimum redemption is 500 EDGE Miles.',
      },
    ],
    // Travel EDGE explicitly permits points-only redemption, so 100% is a sourced
    // portal-share ceiling. The ₹99 + applicable-tax redemption fee is kept out of
    // feeMinor because the tax component is not a fixed integer amount here.
    portal: { portalName: 'Axis Travel EDGE', supportsPointsPlusCash: true, valuePerPointPaise: 100, maxPointsShareBps: 10_000, feeMinor: null },
    bookingDestination: 'Axis Travel EDGE',
    bookingUrl: 'https://traveledge.axis.bank.in/',
    notes: [
      'Axis charges ₹99 + applicable taxes for each EDGE portal redemption; the final fee is verified at checkout.',
      'Travel EDGE portal fare can differ from the matched public cash fare; the calculated miles are a projected wallet requirement, not a live portal quote.',
      'Minimum redemption is 500 EDGE Miles.',
    ],
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
    evidence: [{
      kind: 'ISSUER_PUBLIC',
      sourceId: 'amex-india-travel-points-pay',
      sourceUrl: 'https://www.americanexpress.com/in/travel/terms-and-conditions/',
      capturedAt: '2026-09-10',
      note: 'Amex Travel supports Points for Travel / Points + Pay. The itinerary-specific MR requirement is determined by Amex at booking.',
    }],
    portal: { portalName: 'American Express Travel Online', supportsPointsPlusCash: true, valuePerPointPaise: null, maxPointsShareBps: null, feeMinor: null },
    bookingDestination: 'American Express Travel Online',
    bookingUrl: 'https://www.americanexpress.com/en-in/travel/',
    notes: [
      'Amex determines the Membership Rewards points required for each itinerary at booking; CreditIQ must not invent a fixed conversion rate.',
      'A minimum of 1,000 Membership Rewards points per Online Travel Booking applies when paying with points.',
    ],
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

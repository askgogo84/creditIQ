// Axis Atlas redemption facts captured from Axis Bank's current Travel EDGE terms.
// Effective partner table: 2 Apr 2026. Card scope is ATLAS ONLY — never inherit
// these EDGE Mile ratios to another Axis product.

export const AXIS_ATLAS_TRAVEL_EDGE_SOURCE =
  'https://traveledge.axis.bank.in/travel/common/termsandcondition'
export const AXIS_ATLAS_CARD_SOURCE =
  'https://www.axisbank.com/docs/default-source/default-document-library/credit-cards/terms-and-conditions-of-features-of-axis-bank-atlas-credit-card.pdf?sfvrsn=755e5a56_18'
export const AXIS_ATLAS_AS_OF = '2026-09-09'

export const AXIS_ATLAS_PORTAL = {
  valuePerEdgeMilePaise: 100,
  maxPointsShareBps: 10_000,
  minimumEdgeMiles: 500,
} as const

export interface AxisAtlasTransferPartner {
  id: string
  displayName: string
  destinationCurrency: string
  fromMiles: number
  toPartnerUnits: number
  kind: 'flight' | 'hotel'
}

// P0 India travel partners plus the hotel programmes needed by the current
// Travel product. Ratios are the standing Atlas column in Axis's table, not a
// bank-wide assumption and not a promotional ratio.
export const AXIS_ATLAS_TRANSFER_PARTNERS: AxisAtlasTransferPartner[] = [
  { id: 'air-india-maharaja', displayName: 'Air India Maharaja Club', destinationCurrency: 'Maharaja Points', fromMiles: 1, toPartnerUnits: 2, kind: 'flight' },
  { id: 'indigo-bluchip', displayName: 'IndiGo BluChip', destinationCurrency: 'BluChips', fromMiles: 2, toPartnerUnits: 1, kind: 'flight' },
  { id: 'spiceclub', displayName: 'SpiceJet SpiceClub', destinationCurrency: 'SpiceClub points', fromMiles: 1, toPartnerUnits: 2, kind: 'flight' },
  { id: 'ihg-one', displayName: 'IHG One Rewards', destinationCurrency: 'IHG One Rewards points', fromMiles: 1, toPartnerUnits: 2, kind: 'hotel' },
  { id: 'club-itc', displayName: 'Club ITC', destinationCurrency: 'Green Points', fromMiles: 1, toPartnerUnits: 2, kind: 'hotel' },
  { id: 'radisson-rewards', displayName: 'Radisson Rewards', destinationCurrency: 'Radisson Rewards points', fromMiles: 1, toPartnerUnits: 1, kind: 'hotel' },
  { id: 'wyndham-rewards', displayName: 'Wyndham Rewards', destinationCurrency: 'Wyndham Rewards points', fromMiles: 1, toPartnerUnits: 2, kind: 'hotel' },
]

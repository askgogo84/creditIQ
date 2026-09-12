// Issuer redemption/transfer ceilings used to bound projections.
// These are maximum programme limits, not a substitute for the user's
// remaining allowance. Prior-period usage is an account/checkout fact and
// must still be verified before execution.

export const HDFC_INFINIA_SMARTBUY_MONTHLY_REDEMPTION_CAP_POINTS = 150_000

export type AxisAtlasTransferGroup = 'A' | 'B'

export const AXIS_ATLAS_ANNUAL_TRANSFER_CAP_POINTS = 150_000
export const AXIS_ATLAS_GROUP_A_ANNUAL_TRANSFER_CAP_POINTS = 30_000
export const AXIS_ATLAS_GROUP_B_ANNUAL_TRANSFER_CAP_POINTS = 120_000

// Source: Axis Travel EDGE Points/Miles Transfer Terms.
// https://traveledge.axis.bank.in/travel/common/termsandcondition
// Group classification can change at the issuer's discretion; keep this list
// synchronized with the sourced transfer registry.
const AXIS_ATLAS_GROUP_A_PROGRAMMES = new Set([
  'aeroplan',
  'british-airways-club',
  'ethiopian',
  'etihad-guest',
  'finnair',
  'jal-mileage-bank',
  'qatar-privilege-club',
  'krisflyer',
  'thai-royal-orchid',
  'turkish-miles-smiles',
  'united-mileageplus',
  'lotusmiles',
  'wyndham-rewards',
])

const AXIS_ATLAS_GROUP_B_PROGRAMMES = new Set([
  'airasia-rewards',
  'flying-blue',
  'air-india-maharaja',
  'ihg-one',
  'indigo-bluchip',
  'club-itc',
  'orchid-rewards',
  'postcard-sunshine-club',
  'qantas',
  'radisson-rewards',
  'spiceclub',
])

export function axisAtlasTransferGroup(programmeId: string): AxisAtlasTransferGroup | null {
  if (AXIS_ATLAS_GROUP_A_PROGRAMMES.has(programmeId)) return 'A'
  if (AXIS_ATLAS_GROUP_B_PROGRAMMES.has(programmeId)) return 'B'
  return null
}

export function axisAtlasGroupAnnualCapPoints(group: AxisAtlasTransferGroup): number {
  return group === 'A'
    ? AXIS_ATLAS_GROUP_A_ANNUAL_TRANSFER_CAP_POINTS
    : AXIS_ATLAS_GROUP_B_ANNUAL_TRANSFER_CAP_POINTS
}

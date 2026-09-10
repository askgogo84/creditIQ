import type { RedemptionRailDefinition, TravelKind } from './types'

const AMEX_MR_URL = 'https://www.americanexpress.com/en-in/benefits/rewards/membership-rewards/'
const AMEX_REWARDS_URL = 'https://global.americanexpress.com/rewards'

function norm(value: unknown) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function isAmex(bank: string) {
  const n = norm(bank)
  return n === 'amex' || n.includes('americanexpress')
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

/**
 * Some issuer transfer ecosystems are real and useful even when the public page
 * does not expose a stable partner-by-partner conversion table. Keep those paths
 * visible for the exact eligible wallet product, but never manufacture a ratio.
 */
export function walletIssuerHubRails(input: {
  bank: string
  cardName: string
  travelKind: TravelKind
}): RedemptionRailDefinition[] {
  if (!isAmex(input.bank) || !isMembershipRewardsEligibleName(input.cardName)) return []

  return [{
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
      note: 'American Express India confirms Membership Rewards transfers to participating airline and hotel loyalty programmes. Transfers are normally completed within 3–5 working days and are irreversible. The selected partner conversion level is verified in the logged-in Membership Rewards account before transfer.',
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
    notes: ['Transfer available. Verify the selected airline/hotel partner and current conversion level after login before moving points.'],
  }]
}

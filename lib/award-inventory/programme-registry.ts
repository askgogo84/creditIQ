export type HotelAwardDiscoveryMode =
  | 'AGGREGATOR_CACHED'
  | 'AGGREGATOR_LIVE'
  | 'DIRECT_REQUIRED'

export interface HotelAwardProgrammeDefinition {
  programmeId: string
  displayName: string
  discoveryMode: HotelAwardDiscoveryMode
  discoveryProviders: string[]
  /** Final verification is always direct before an irreversible points move. */
  finalVerification: 'DIRECT_PROGRAMME_CHECKOUT'
  notes?: string[]
}

/**
 * Strategic hotel loyalty programmes CreditIQ intends to surface even when the
 * currently connected aggregator does not cover them.
 *
 * A DIRECT_REQUIRED row is not an error and must not be hidden from search. It
 * means cash inventory can still be shown while award availability requires a
 * direct programme adapter or Concierge verification.
 */
export const HOTEL_AWARD_PROGRAMMES: readonly HotelAwardProgrammeDefinition[] = [
  {
    programmeId: 'marriott-bonvoy',
    displayName: 'Marriott Bonvoy',
    discoveryMode: 'AGGREGATOR_CACHED',
    discoveryProviders: ['awardtool'],
    finalVerification: 'DIRECT_PROGRAMME_CHECKOUT',
  },
  {
    programmeId: 'world-of-hyatt',
    displayName: 'World of Hyatt',
    discoveryMode: 'AGGREGATOR_CACHED',
    discoveryProviders: ['awardtool'],
    finalVerification: 'DIRECT_PROGRAMME_CHECKOUT',
  },
  {
    programmeId: 'ihg-one',
    displayName: 'IHG One Rewards',
    discoveryMode: 'AGGREGATOR_CACHED',
    discoveryProviders: ['awardtool'],
    finalVerification: 'DIRECT_PROGRAMME_CHECKOUT',
  },
  {
    programmeId: 'hilton-honors',
    displayName: 'Hilton Honors',
    discoveryMode: 'AGGREGATOR_CACHED',
    discoveryProviders: ['awardtool'],
    finalVerification: 'DIRECT_PROGRAMME_CHECKOUT',
  },
  {
    programmeId: 'wyndham-rewards',
    displayName: 'Wyndham Rewards',
    discoveryMode: 'AGGREGATOR_CACHED',
    discoveryProviders: ['awardtool'],
    finalVerification: 'DIRECT_PROGRAMME_CHECKOUT',
  },
  {
    programmeId: 'choice-privileges',
    displayName: 'Choice Privileges',
    discoveryMode: 'AGGREGATOR_CACHED',
    discoveryProviders: ['awardtool'],
    finalVerification: 'DIRECT_PROGRAMME_CHECKOUT',
  },
  {
    programmeId: 'i-prefer',
    displayName: 'I Prefer Hotel Rewards',
    discoveryMode: 'AGGREGATOR_CACHED',
    discoveryProviders: ['awardtool'],
    finalVerification: 'DIRECT_PROGRAMME_CHECKOUT',
  },
  {
    programmeId: 'accor-all',
    displayName: 'ALL Accor',
    discoveryMode: 'DIRECT_REQUIRED',
    discoveryProviders: [],
    finalVerification: 'DIRECT_PROGRAMME_CHECKOUT',
    notes: ['Keep v3.1 redemption guards until logged-in checkout mechanics are reconfirmed.'],
  },
  {
    programmeId: 'taj-neupass',
    displayName: 'Taj / NeuPass',
    discoveryMode: 'DIRECT_REQUIRED',
    discoveryProviders: [],
    finalVerification: 'DIRECT_PROGRAMME_CHECKOUT',
  },
  {
    programmeId: 'club-itc',
    displayName: 'Club ITC',
    discoveryMode: 'DIRECT_REQUIRED',
    discoveryProviders: [],
    finalVerification: 'DIRECT_PROGRAMME_CHECKOUT',
  },
  {
    programmeId: 'radisson-rewards',
    displayName: 'Radisson Rewards',
    discoveryMode: 'DIRECT_REQUIRED',
    discoveryProviders: [],
    finalVerification: 'DIRECT_PROGRAMME_CHECKOUT',
  },
  {
    programmeId: 'shangri-la-circle',
    displayName: 'Shangri-La Circle',
    discoveryMode: 'DIRECT_REQUIRED',
    discoveryProviders: [],
    finalVerification: 'DIRECT_PROGRAMME_CHECKOUT',
  },
]

export function hotelAwardProgramme(programmeId: string): HotelAwardProgrammeDefinition | null {
  return HOTEL_AWARD_PROGRAMMES.find((programme) => programme.programmeId === programmeId) ?? null
}

// Axis Atlas -> hotel loyalty programme transfer ratios.
// Source: Axis Travel EDGE Points/Miles Transfer Terms, revised effective 2 Apr 2026.
// https://traveledge.axis.bank.in/travel/common/termsandcondition
//
// Card scope is ATLAS only. Do not apply these EDGE Miles ratios to another
// Axis product: the same table publishes different ratios by card variant.

export const AXIS_ATLAS_HOTEL_SOURCE = 'https://traveledge.axis.bank.in/travel/common/termsandcondition'
export const AXIS_ATLAS_HOTEL_AS_OF = '2026-04-02'

export type AxisAtlasHotelPartner = {
  id: string
  displayName: string
  destinationCurrency: string
  ratioFrom: number
  ratioTo: number
  tat: string
  group: 'A' | 'B'
}

export const AXIS_ATLAS_HOTEL_PARTNERS: readonly AxisAtlasHotelPartner[] = [
  { id: 'ihg-one', displayName: 'IHG One Rewards', destinationCurrency: 'IHG One Rewards points', ratioFrom: 1, ratioTo: 2, tat: 'up to 1 working day', group: 'B' },
  { id: 'club-itc', displayName: 'Club ITC', destinationCurrency: 'Green Points', ratioFrom: 1, ratioTo: 2, tat: 'up to 10 working days', group: 'B' },
  { id: 'orchid-rewards', displayName: 'Orchid Rewards', destinationCurrency: 'Orchid Rewards points', ratioFrom: 1, ratioTo: 1, tat: 'up to 1 working day', group: 'B' },
  { id: 'postcard-sunshine-club', displayName: 'The Postcard Sunshine Club', destinationCurrency: 'Sunshine Club points', ratioFrom: 1, ratioTo: 2, tat: 'up to 2 working days', group: 'B' },
  { id: 'radisson-rewards', displayName: 'Radisson Rewards', destinationCurrency: 'Radisson Rewards points', ratioFrom: 1, ratioTo: 1, tat: 'up to 1 working day', group: 'B' },
  { id: 'wyndham-rewards', displayName: 'Wyndham Rewards', destinationCurrency: 'Wyndham Rewards points', ratioFrom: 1, ratioTo: 2, tat: 'up to 1 working day', group: 'A' },
]

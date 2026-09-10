// Axis Magnus for Burgundy -> current airline/hotel partner transfer ratios.
// Source: Axis Travel EDGE Points/Miles Transfer Terms, revised effective 2 Apr 2026.
// https://traveledge.axis.bank.in/travel/common/termsandcondition
//
// Card scope is Magnus for Burgundy only. Ratios are partner-specific in the
// current grid; do not inherit these terms into standard Magnus or other Axis cards.

export const AXIS_MAGNUS_BURGUNDY_SOURCE = 'https://traveledge.axis.bank.in/travel/common/termsandcondition'
export const AXIS_MAGNUS_BURGUNDY_AS_OF = '2026-04-02'

export type AxisMagnusBurgundyPartner = {
  id: string
  displayName: string
  destinationCurrency: string
  ratioFrom: number
  ratioTo: number
  tat: string
  group: 'A' | 'B'
  kind: 'flight' | 'hotel'
  note?: string
}

export const AXIS_MAGNUS_BURGUNDY_PARTNERS: readonly AxisMagnusBurgundyPartner[] = [
  { id: 'airasia-rewards', displayName: 'AirAsia rewards', destinationCurrency: 'AirAsia points', ratioFrom: 5, ratioTo: 4, tat: 'up to 10 working days', group: 'B', kind: 'flight' },
  { id: 'aeroplan', displayName: 'Aeroplan', destinationCurrency: 'Aeroplan points', ratioFrom: 5, ratioTo: 4, tat: 'up to 1 working day', group: 'A', kind: 'flight' },
  { id: 'flying-blue', displayName: 'Flying Blue', destinationCurrency: 'Flying Blue Miles', ratioFrom: 5, ratioTo: 4, tat: 'up to 1 working day', group: 'B', kind: 'flight' },
  { id: 'air-india-maharaja', displayName: 'Air India Maharaja Club', destinationCurrency: 'Maharaja Points', ratioFrom: 5, ratioTo: 4, tat: 'up to 5 working days', group: 'B', kind: 'flight' },
  { id: 'british-airways-club', displayName: 'The British Airways Club', destinationCurrency: 'Avios', ratioFrom: 5, ratioTo: 2, tat: 'up to 1 working day', group: 'A', kind: 'flight' },
  { id: 'ethiopian', displayName: 'Ethiopian ShebaMiles', destinationCurrency: 'ShebaMiles', ratioFrom: 5, ratioTo: 4, tat: 'up to 10 working days', group: 'A', kind: 'flight' },
  { id: 'etihad-guest', displayName: 'Etihad Guest', destinationCurrency: 'Etihad Guest Miles', ratioFrom: 5, ratioTo: 4, tat: 'up to 1 working day', group: 'A', kind: 'flight' },
  { id: 'finnair', displayName: 'Finnair Plus', destinationCurrency: 'Avios', ratioFrom: 5, ratioTo: 2, tat: 'up to 1 working day', group: 'A', kind: 'flight' },
  { id: 'ihg-one', displayName: 'IHG One Rewards', destinationCurrency: 'IHG One Rewards points', ratioFrom: 5, ratioTo: 4, tat: 'up to 1 working day', group: 'B', kind: 'hotel' },
  { id: 'indigo-bluchip', displayName: 'IndiGo BluChip', destinationCurrency: 'IndiGo BluChips', ratioFrom: 5, ratioTo: 4, tat: 'up to 1-2 working days', group: 'B', kind: 'flight', note: 'Current limited-period introductory offer; verify the live Travel EDGE ratio before transferring.' },
  { id: 'club-itc', displayName: 'Club ITC', destinationCurrency: 'Green Points', ratioFrom: 5, ratioTo: 4, tat: 'up to 10 working days', group: 'B', kind: 'hotel' },
  { id: 'jal-mileage-bank', displayName: 'JAL Mileage Bank', destinationCurrency: 'JAL miles', ratioFrom: 5, ratioTo: 4, tat: 'up to 10 working days', group: 'A', kind: 'flight' },
  { id: 'orchid-rewards', displayName: 'Orchid Rewards', destinationCurrency: 'Orchid Rewards points', ratioFrom: 5, ratioTo: 4, tat: 'up to 1 working day', group: 'B', kind: 'hotel' },
  { id: 'postcard-sunshine-club', displayName: 'The Postcard Sunshine Club', destinationCurrency: 'Sunshine Club points', ratioFrom: 5, ratioTo: 4, tat: 'up to 2 working days', group: 'B', kind: 'hotel' },
  { id: 'qantas', displayName: 'Qantas Frequent Flyer', destinationCurrency: 'Qantas Points', ratioFrom: 5, ratioTo: 4, tat: 'up to 1 working day', group: 'B', kind: 'flight' },
  { id: 'qatar-privilege-club', displayName: 'Qatar Privilege Club', destinationCurrency: 'Avios', ratioFrom: 5, ratioTo: 2, tat: 'up to 1 working day', group: 'A', kind: 'flight' },
  { id: 'radisson-rewards', displayName: 'Radisson Rewards', destinationCurrency: 'Radisson Rewards points', ratioFrom: 5, ratioTo: 4, tat: 'up to 1 working day', group: 'B', kind: 'hotel' },
  { id: 'krisflyer', displayName: 'KrisFlyer', destinationCurrency: 'KrisFlyer miles', ratioFrom: 5, ratioTo: 4, tat: 'up to 10 working days', group: 'A', kind: 'flight' },
  { id: 'spiceclub', displayName: 'SpiceClub', destinationCurrency: 'SC Points', ratioFrom: 5, ratioTo: 4, tat: 'up to 10 working days', group: 'B', kind: 'flight' },
  { id: 'thai-royal-orchid', displayName: 'Thai Royal Orchid Plus', destinationCurrency: 'Royal Orchid Plus miles', ratioFrom: 5, ratioTo: 4, tat: 'up to 1 working day', group: 'A', kind: 'flight' },
  { id: 'turkish-miles-smiles', displayName: 'Turkish Airlines Miles&Smiles', destinationCurrency: 'Miles&Smiles Miles', ratioFrom: 5, ratioTo: 4, tat: 'up to 10 working days', group: 'A', kind: 'flight' },
  { id: 'united-mileageplus', displayName: 'United MileagePlus', destinationCurrency: 'MileagePlus miles', ratioFrom: 5, ratioTo: 4, tat: 'up to 1 working day', group: 'A', kind: 'flight' },
  { id: 'lotusmiles', displayName: 'Lotusmiles', destinationCurrency: 'Lotusmiles miles', ratioFrom: 5, ratioTo: 2, tat: 'up to 1 working day', group: 'A', kind: 'flight' },
  { id: 'wyndham-rewards', displayName: 'Wyndham Rewards', destinationCurrency: 'Wyndham Rewards points', ratioFrom: 5, ratioTo: 4, tat: 'up to 1 working day', group: 'A', kind: 'hotel' },
]

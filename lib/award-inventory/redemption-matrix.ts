import type { WalletRailCardInput, WalletRailMatrix } from '@/lib/redemption-rails'
import { buildWalletRailMatrix } from '@/lib/redemption-rails'
import type { FlightAwardOption, HotelAwardProperty } from './types'

export interface AwardWithWalletRails<T> {
  award: T
  railMatrix: WalletRailMatrix
}

/**
 * Attach sourced wallet rails to a normalized flight award.
 * Inventory data remains untouched; this only enumerates possible execution
 * rails for the award programme and every card in the user's wallet.
 */
export function attachRailsToFlightAward(
  award: FlightAwardOption,
  walletCards: WalletRailCardInput[],
): AwardWithWalletRails<FlightAwardOption> {
  return {
    award,
    railMatrix: buildWalletRailMatrix(walletCards, 'flight', award.programmeId),
  }
}

/**
 * Attach sourced wallet rails to a normalized hotel-award property.
 * Date-specific hotel award pricing can be added later without changing the
 * registry contract because the loyalty programme identity is already carried
 * by the property.
 */
export function attachRailsToHotelAward(
  award: HotelAwardProperty,
  walletCards: WalletRailCardInput[],
): AwardWithWalletRails<HotelAwardProperty> {
  return {
    award,
    railMatrix: buildWalletRailMatrix(walletCards, 'hotel', award.programmeId),
  }
}

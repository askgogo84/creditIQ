import assert from 'node:assert/strict'
import { normalizeAwardToolFlightRow } from '../lib/award-inventory/providers/awardtool-flight'
import { searchFlightAwards } from '../lib/award-inventory/flight-orchestrator'
import type { FlightAwardSearchQuery } from '../lib/award-inventory/types'

async function main() {
  const query: FlightAwardSearchQuery = {
    origin: 'BLR',
    destination: 'SIN',
    date: '2026-10-01',
    cabin: 'business',
    adults: 1,
    programmeIds: ['krisflyer'],
  }

  const fetchedAt = '2026-09-08T00:00:00.000Z'

  const blankTaxes = normalizeAwardToolFlightRow({
    program: 'SQ', miles: 50_000, cabin: 'Business', taxes: '',
  }, query, fetchedAt, 0)
  assert(blankTaxes, 'blank-tax fixture must normalize')
  assert.equal(blankTaxes.taxesMinor, null, 'blank taxes must remain unknown, not zero')
  assert.equal(blankTaxes.taxesCurrency, null, 'unknown taxes must not invent a currency')

  const nullTaxes = normalizeAwardToolFlightRow({
    program: 'SQ', miles: 50_000, cabin: 'Business', cash_component: null,
  }, query, fetchedAt, 1)
  assert(nullTaxes, 'null-tax fixture must normalize')
  assert.equal(nullTaxes.taxesMinor, null, 'null cash component must remain unknown, not zero')

  const knownTaxes = normalizeAwardToolFlightRow({
    program: 'SQ', miles: 50_000, cabin: 'Business', taxes: '12.34', taxes_currency: 'USD',
  }, query, fetchedAt, 2)
  assert(knownTaxes, 'known-tax fixture must normalize')
  assert.equal(knownTaxes.taxesMinor, 1234, 'known decimal taxes must convert to currency minor units')
  assert.equal(knownTaxes.taxesCurrency, 'USD')

  const unavailableSeats = { isConfigured: () => false } as any
  const unavailableAwardWallet = { isConfigured: () => false } as any

  const providerFailure = await searchFlightAwards(query, {
    awardTool: {
      isConfigured: () => true,
      search: async () => { throw new Error('synthetic provider failure') },
    } as any,
    seats: unavailableSeats,
    awardWallet: unavailableAwardWallet,
  })
  assert.equal(
    providerFailure.status,
    'PROVIDER_UNAVAILABLE',
    'a configured provider that errors must not be reported as proof that no award seats exist',
  )

  const completedEmpty = await searchFlightAwards(query, {
    awardTool: {
      isConfigured: () => true,
      search: async () => [],
    } as any,
    seats: unavailableSeats,
    awardWallet: unavailableAwardWallet,
  })
  assert.equal(
    completedEmpty.status,
    'NO_AWARD_OPTIONS',
    'a live provider that completed successfully with zero rows may be reported as no award options',
  )

  console.log('✓ validate-awardtool-truth: blank taxes stay unknown; provider errors do not masquerade as empty live inventory.')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})

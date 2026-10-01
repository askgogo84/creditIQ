import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { runJevHotelVerdict, deterministicHotelVerdict, type HotelVerdictInput } from './creditiq-hotel-decision'
import { runJevTravelDecision } from './creditiq-travel-decision'

const input = (): HotelVerdictInput => ({ destination: 'Synthetic', cash: { amountMinor: null, currency: null, source: null, live: false }, loyalty: { programmeId: 'accor', propertyName: 'Synthetic', pointsRequired: 2000, cashComponentMinor: null, cashCurrency: null, status: 'CACHED_DISCOVERY', pricingAuthority: 'DISCOVERY_ONLY' } })
const provider = vi.fn()
beforeEach(() => { vi.stubEnv('TYPESAFE_API_KEY', 'synthetic'); vi.stubEnv('JEV_API_KEY', ''); vi.stubGlobal('fetch', provider); provider.mockReset() })
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })
function answer(action: string) { provider.mockResolvedValue(new Response(JSON.stringify({ answers: { action: { type: 'choice', choice: action }, transfer_risk: { type: 'choice', choice: 'LOW' } } }))) }

it.each(['BOOK_CASH', 'USE_HOTEL_POINTS', 'COMPARE_LIVE_OPTIONS'])('blocks unsupported model action %s on discovery evidence', async action => {
  answer(action)
  expect((await runJevHotelVerdict(input())).action).toBe('VERIFY_LOYALTY_AVAILABILITY')
  expect(provider).toHaveBeenCalledTimes(1)
})
it('requires the cash component and currency before recommending live points', async () => {
  const value = input(); value.loyalty.pricingAuthority = 'DATE_SPECIFIC_LIVE'
  expect(deterministicHotelVerdict(value).action).toBe('WAIT')
  answer('USE_HOTEL_POINTS')
  expect((await runJevHotelVerdict(value)).action).toBe('WAIT')
  value.loyalty.cashComponentMinor = 0; value.loyalty.cashCurrency = 'INR'
  expect(deterministicHotelVerdict(value).action).toBe('USE_HOTEL_POINTS')
})
it('preserves a valid model comparison when both prices exist', async () => {
  const value = input(); value.loyalty = { ...value.loyalty, pricingAuthority: 'DATE_SPECIFIC_LIVE', cashComponentMinor: 0, cashCurrency: 'INR' }
  value.cash = { amountMinor: 200000, currency: 'INR', live: true, source: 'synthetic' }
  answer('COMPARE_LIVE_OPTIONS')
  expect(await runJevHotelVerdict(value)).toMatchObject({ action: 'COMPARE_LIVE_OPTIONS', source: 'jev' })
})
it.each([401, 429, 500])('falls back on provider HTTP %s', async status => {
  provider.mockResolvedValue(new Response('{}', { status }))
  expect(await runJevHotelVerdict(input())).toMatchObject({ source: 'deterministic-fallback', error: `typesafe_http_${status}` })
})
it('falls back on malformed responses and aborted requests', async () => {
  provider.mockResolvedValueOnce(new Response('{}'))
  expect((await runJevHotelVerdict(input())).error).toBe('typesafe_malformed_response')
  provider.mockRejectedValueOnce(new DOMException('aborted', 'AbortError'))
  expect((await runJevHotelVerdict(input())).error).toBe('typesafe_timeout')
})
it('does not contact the provider without a configured key', async () => {
  vi.stubEnv('TYPESAFE_API_KEY', '')
  expect((await runJevHotelVerdict(input())).error).toBe('typesafe_key_missing')
  expect(provider).not.toHaveBeenCalled()
})
it('does not let Jev downgrade flight risk below unresolved blockers', async () => {
  answer('VERIFY_REDEMPTION')
  const decision = { travelKind: 'flight', awardState: { status: 'LIVE_OR_PROVIDER_RETURNED' }, conciergeAction: { requiresLiveReverification: false }, blockedReasons: ['Issuer checkout not verified'], inventory: { state: 'AVAILABLE' }, sourceAuthority: {}, searchSummary: { verdict: 'VERIFY_REDEMPTION', cash: { amountMinor: null }, bestPath: null } } as any
  expect(await runJevTravelDecision(decision)).toMatchObject({ source: 'jev', transferRisk: 'MEDIUM' })
})

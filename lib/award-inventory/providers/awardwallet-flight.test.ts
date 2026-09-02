import { describe, expect, it } from 'vitest'
import { normalizeAwardWalletFlightResults, resolveGuestAwardWalletFlightProvider } from './awardwallet-flight'

describe('AwardWallet flight adapter', () => {
  it('resolves only guest-capable providers for a programme', () => {
    const providers = [
      { code: 'aeroplan', displayName: 'Air Canada (Aeroplan)', shortName: 'Air Canada', loginRequired: true, authMode: 'required', supportedCurrencies: ['CAD'] },
      { code: 'singapore', displayName: 'Singapore Airlines KrisFlyer', shortName: 'Singapore Airlines', loginRequired: false, authMode: 'optional', supportedCurrencies: ['USD'] },
    ]
    expect(resolveGuestAwardWalletFlightProvider('krisflyer', providers)?.code).toBe('singapore')
    expect(resolveGuestAwardWalletFlightProvider('aeroplan', providers)).toBeNull()
  })

  it('normalizes miles, taxes/fees and flight segments without inventing FX', () => {
    const out = normalizeAwardWalletFlightResults({
      state: 1,
      routes: [{
        mileCost: { program: 'singapore', miles: 43000 },
        cashCost: { currency: 'USD', taxes: 52.5, fees: 3.25 },
        segments: [{
          departure: { airport: 'BLR', dateTime: '2026-10-15T09:25:00+05:30' },
          arrival: { airport: 'SIN', dateTime: '2026-10-15T16:35:00+08:00' },
          standardCOS: 'business',
          flightNumbers: ['SQ509'],
        }],
      }],
    }, 'krisflyer', 'singapore', '2026-09-03T00:00:00Z')

    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      programmeId: 'krisflyer', origin: 'BLR', destination: 'SIN', cabin: 'business', miles: 43000,
      taxesMinor: 5575, taxesCurrency: 'USD',
    })
    expect(out[0].segments[0].flightNumber).toBe('SQ509')
    expect(out[0].evidence).toMatchObject({ provider: 'awardwallet-flight', freshness: 'LIVE' })
  })

  it('fails closed when provider response is incomplete', () => {
    expect(normalizeAwardWalletFlightResults({ state: 0, routes: [] }, 'krisflyer', 'singapore', 'x')).toEqual([])
    expect(normalizeAwardWalletFlightResults({ state: 1, routes: [{ mileCost: { miles: 0 } }] }, 'krisflyer', 'singapore', 'x')).toEqual([])
  })
})

import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.hoisted(() => vi.fn())
const matrixProps = vi.hoisted(() => [] as any[])
vi.mock('@/lib/authed-fetch', () => ({ authedFetch: fetchMock }))
vi.mock('./WalletRailMatrix', () => ({ WalletRailMatrix: (props: any) => { matrixProps.push(props); return <div data-testid="matrix" /> } }))

import { FlightAwardVerificationPanel } from './FlightAwardVerificationPanel'

beforeEach(() => { fetchMock.mockReset(); matrixProps.length = 0 })

const baseProps = {
  programmeId: 'krisflyer', programmeName: 'KrisFlyer', origin: 'BLR', destination: 'SIN', date: '2026-10-15', cabin: 'business' as const,
  cachedMiles: 44500, cachedTaxesMinor: null, cachedTaxesCurrency: null, cashPriceMinor: 5260000, cashCurrency: 'INR',
}

describe('FlightAwardVerificationPanel', () => {
  it('replaces cached pricing with live verified selected-programme pricing for ranking', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({
      status: 'SUCCESS_LIVE_VERIFIED', pricingAuthority: 'DATE_SPECIFIC_LIVE', attempts: [
        { source: 'awardwallet', configured: true, state: 'SUCCESS', freshness: 'LIVE', reason: '1 live option' },
      ],
      options: [{
        providerResultId: 'live-1', programmeId: 'krisflyer', origin: 'BLR', destination: 'SIN', departureAt: null, arrivalAt: null,
        cabin: 'business', miles: 43000, taxesMinor: 418000, taxesCurrency: 'INR', segments: [],
        evidence: { provider: 'awardwallet-flight', freshness: 'LIVE', fetchedAt: 'x' },
      }],
    }) })
    render(<FlightAwardVerificationPanel {...baseProps} />)
    expect(await screen.findByText('LIVE VERIFIED')).toBeInTheDocument()
    expect(screen.getByText(/43,000 miles/)).toBeInTheDocument()
    await waitFor(() => expect(matrixProps.at(-1)).toMatchObject({ programmePointsRequired: 43000, awardTaxesMinor: 418000, awardTaxesCurrency: 'INR' }))
  })

  it('keeps cached discovery pricing when live verification is unavailable', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ status: 'PROVIDER_UNAVAILABLE', reason: 'not configured', attempts: [] }) })
    render(<FlightAwardVerificationPanel {...baseProps} />)
    expect(await screen.findByText('CACHED DISCOVERY')).toBeInTheDocument()
    await waitFor(() => expect(matrixProps.at(-1)).toMatchObject({ programmePointsRequired: 44500, awardTaxesMinor: null }))
    expect(screen.getByText(/does not convert provider failure into/)).toBeInTheDocument()
  })

  it('renders Maharaja Value and Prime guidance without substituting it into ranking', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({
      status: 'PROVIDER_UNAVAILABLE', reason: 'not configured', attempts: [],
      publishedGuide: {
        programmeId: 'air-india-maharaja', programmeName: 'Air India Maharaja Club',
        origin: 'DEL', destination: 'SIN', cabin: 'economy', tripType: 'ONE_WAY', passengerScope: 'PER_PASSENGER',
        tiers: [
          { id: 'VALUE', label: 'Value fare', pointsMin: 12_000, pointsMax: 30_000 },
          { id: 'PRIME', label: 'Prime fare', pointsMin: 40_000, pointsMax: 40_000 },
        ],
        taxesState: 'NOT_PUBLISHED', authority: 'PLANNING_ONLY',
        evidence: { sourceKind: 'PROGRAMME_CALCULATOR', sourceUrl: 'https://www.airindia.com/calculator', capturedAt: '2026-09-03', caveat: 'Availability dependent.' },
      },
    }) })
    render(<FlightAwardVerificationPanel {...baseProps} programmeId="air-india-maharaja" programmeName="Air India Maharaja Club" origin="DEL" destination="SIN" cabin="economy" cachedMiles={24_000} />)

    expect(await screen.findByText('Value fare')).toBeInTheDocument()
    expect(screen.getByText('Prime fare')).toBeInTheDocument()
    expect(screen.getByText('12,000–30,000')).toBeInTheDocument()
    expect(screen.getByText('40,000')).toBeInTheDocument()
    await waitFor(() => expect(matrixProps.at(-1)).toMatchObject({ programmePointsRequired: 24_000 }))
  })
})

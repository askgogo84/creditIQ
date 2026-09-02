import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.hoisted(() => vi.fn())
const matrixProps = vi.hoisted(() => [] as any[])
vi.mock('@/lib/authed-fetch', () => ({ authedFetch: fetchMock }))
vi.mock('./WalletRailMatrix', () => ({
  WalletRailMatrix: (props: any) => { matrixProps.push(props); return <div data-testid="matrix" /> },
}))

import { HotelAwardJoinPanel } from './HotelAwardJoinPanel'

const offer = {
  id: 'cash-1',
  hotelName: 'JW Marriott Hotel Singapore South Beach',
  chainName: 'Marriott',
  latitude: 1.2945,
  longitude: 103.8572,
  currency: 'SGD',
  totalPrice: 575,
}

function successResponse(hotelName = offer.hotelName) {
  return {
    status: 'SUCCESS',
    programmeId: 'marriott-bonvoy',
    provider: { code: 'marriott', displayName: 'Marriott', shortName: 'Marriott', loginRequired: false },
    fetchedAt: '2026-09-02T16:00:00Z',
    pricingAuthority: 'DATE_SPECIFIC_LIVE',
    attempts: [
      { source: 'awardwallet', configured: true, state: 'SUCCESS', freshness: 'LIVE', reason: '1 date-specific award rate returned.' },
      { source: 'awardtool', configured: false, state: 'SKIPPED', freshness: null, reason: 'Stronger live source succeeded.' },
      { source: 'direct', configured: true, state: 'DIRECT_REQUIRED', freshness: 'DIRECT', reason: 'Final verification.' },
    ],
    rates: [{
      id: 'rate-1', programmeId: 'marriott-bonvoy', providerCode: 'marriott', hotelName,
      hotelUrl: null, addressText: null, latitude: 1.2945, longitude: 103.8572,
      checkInDate: '2026-10-15', checkOutDate: '2026-10-18', numberOfNights: 3,
      roomType: 'Standard', roomName: 'King', rateName: 'Standard Reward',
      pointsPerNight: 42000, totalPoints: 126000, cashPerNightMinor: null,
      totalCashMinor: null, cashCurrency: null, fetchedAt: '2026-09-02T16:00:00Z',
      freshness: 'LIVE', source: 'awardwallet',
    }],
  }
}

beforeEach(() => {
  fetchMock.mockReset()
  matrixProps.length = 0
})

describe('HotelAwardJoinPanel', () => {
  it('passes a safely joined award price into wallet ranking', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => successResponse() })
    render(<HotelAwardJoinPanel offer={offer} programmeId="marriott-bonvoy" destination="Singapore" checkInDate="2026-10-15" checkOutDate="2026-10-18" adults={2} />)

    expect(await screen.findByText('Cash + award joined')).toBeInTheDocument()
    expect(screen.getByText('1,26,000 pts')).toBeInTheDocument()
    expect(screen.getByText('Award source plan')).toBeInTheDocument()
    expect(screen.getByText('Success')).toBeInTheDocument()
    await waitFor(() => expect(matrixProps.at(-1)).toMatchObject({
      travelKind: 'hotel', programmeId: 'marriott-bonvoy', programmePointsRequired: 126000,
      cashPriceMinor: 57500, cashCurrency: 'SGD',
    }))
  })

  it('does not attach award pricing when the provider result cannot be safely joined', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => successResponse('Completely Different Marriott Airport') })
    render(<HotelAwardJoinPanel offer={{ ...offer, latitude: null, longitude: null }} programmeId="marriott-bonvoy" destination="Singapore" checkInDate="2026-10-15" checkOutDate="2026-10-18" adults={2} />)

    expect(await screen.findByText(/Award inventory returned, but this property was not safely joined/)).toBeInTheDocument()
    await waitFor(() => expect(matrixProps.at(-1)?.programmePointsRequired).toBeNull())
  })

  it('keeps cached AwardTool discovery visible but out of exact ranking', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({
      status: 'CACHED_DISCOVERY', programmeId: 'marriott-bonvoy', rates: [], pricingAuthority: 'DISCOVERY_ONLY',
      reason: 'Cached award discovery exists, but no live date-specific price is available.',
      cachedProperties: [{ name: 'JW Marriott Singapore', observedPointsMin: 39000, observedPointsMax: 51000 }],
      attempts: [
        { source: 'awardwallet', configured: false, state: 'UNAVAILABLE', freshness: null, reason: 'AwardWallet API is not configured.' },
        { source: 'awardtool', configured: true, state: 'CACHED_DISCOVERY', freshness: 'CACHED', reason: '1 cached property result.' },
        { source: 'direct', configured: true, state: 'DIRECT_REQUIRED', freshness: 'DIRECT', reason: 'Final verification.' },
      ],
    }) })
    render(<HotelAwardJoinPanel offer={offer} programmeId="marriott-bonvoy" destination="Singapore" checkInDate="2026-10-15" checkOutDate="2026-10-18" adults={2} />)

    expect(await screen.findByText('Cached award discovery only')).toBeInTheDocument()
    expect(screen.getByText(/JW Marriott Singapore/)).toBeInTheDocument()
    expect(screen.getByText('Cached discovery')).toBeInTheDocument()
    await waitFor(() => expect(matrixProps.at(-1)).toMatchObject({
      programmeId: 'marriott-bonvoy', programmePointsRequired: null, awardTaxesMinor: null,
      cashPriceMinor: 57500, cashCurrency: 'SGD',
    }))
  })

  it('keeps direct-required programmes visible without calling them an award join', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 409, json: async () => ({
      status: 'DIRECT_REQUIRED', programmeId: 'accor-all', rates: [], reason: 'ALL Accor requires direct verification.',
    }) })
    render(<HotelAwardJoinPanel offer={{ ...offer, hotelName: 'Pullman Singapore', chainName: 'Accor' }} programmeId="accor-all" destination="Singapore" checkInDate="2026-10-15" checkOutDate="2026-10-18" adults={2} />)

    expect(await screen.findByText('Direct programme check required')).toBeInTheDocument()
    expect(screen.getByText(/ALL Accor requires direct verification/)).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/authed-fetch', () => ({ authedFetch: fetchMock }))

import { WalletRailMatrix } from './WalletRailMatrix'

const matrix = {
  travelKind: 'flight',
  programmeId: 'krisflyer',
  cards: [
    {
      walletKey: 'hdfc-2184', bank: 'HDFC', cardName: 'HDFC Infinia Metal Edition', cardId: 'hdfc-infinia',
      pointsBalance: 68500, balanceVerified: true, status: 'VERIFICATION_REQUIRED',
      rails: [{
        id: 'hdfc-infinia-transfer-krisflyer', cardIds: ['hdfc-infinia'], issuer: 'HDFC', type: 'LOYALTY_TRANSFER',
        travelKinds: ['flight'], executionState: 'RATIO_ONLY', evidence: [],
        transfer: { programmeId: 'krisflyer', programmeName: 'KrisFlyer', destinationCurrency: 'miles', ratio: { fromUnits: 1, toUnits: 1 }, durationText: '5-7 days', durationHoursMax: 168, irreversible: true, minimumBankPoints: null, incrementBankPoints: null },
      }],
    },
    {
      walletKey: 'au-3302', bank: 'AU Bank', cardName: 'Unidentified AU Bank card ••••3302', cardId: null,
      pointsBalance: 12000, balanceVerified: true, status: 'NO_VERIFIED_REDEMPTION_RAIL', rails: [],
    },
  ],
  cashRail: { id: 'cash-retain-flight', cardIds: [], issuer: 'Cash', type: 'CASH_RETAIN', travelKinds: ['flight'], executionState: 'EXECUTABLE', evidence: [], bookingDestination: 'Selected booking provider' },
}

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ matrix, walletCount: 2 }) })
})

describe('WalletRailMatrix', () => {
  it('shows every card, including unsupported cards, plus cash', async () => {
    render(<WalletRailMatrix travelKind="flight" programmeId="krisflyer" />)
    expect(await screen.findByText('HDFC Infinia Metal Edition')).toBeInTheDocument()
    expect(screen.getByText('Unidentified AU Bank card ••••3302')).toBeInTheDocument()
    expect(screen.getByText('Transfer → KrisFlyer · 1:1')).toBeInTheDocument()
    expect(screen.getByText('No sourced rail')).toBeInTheDocument()
    expect(screen.getByText('Cash + retain points')).toBeInTheDocument()
  })

  it('queries only the selected travel kind and programme', async () => {
    render(<WalletRailMatrix travelKind="flight" programmeId="krisflyer" />)
    await screen.findByText('HDFC Infinia Metal Edition')
    expect(fetchMock).toHaveBeenCalledWith('/api/travel/redemption-rails', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ travelKind: 'flight', programmeId: 'krisflyer' }),
    }))
  })

  it('labels a cheaper ratio-only transfer as projected while cash remains executable', async () => {
    render(
      <WalletRailMatrix
        travelKind="flight"
        programmeId="krisflyer"
        programmePointsRequired={43_000}
        awardTaxesMinor={418_000}
        awardTaxesCurrency="INR"
        cashPriceMinor={5_260_000}
        cashCurrency="INR"
      />,
    )

    expect(await screen.findByText('Best projected path · verification required')).toBeInTheDocument()
    expect(screen.getByText('HDFC Infinia Metal Edition → krisflyer')).toBeInTheDocument()
    expect(screen.getByText(/at least 43,000 bank points/)).toBeInTheDocument()
    expect(screen.getByText('Best executable now')).toBeInTheDocument()
    expect(screen.getAllByText('Cash + retain points').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/Projected paths are never promoted/)).toBeInTheDocument()
  })
})

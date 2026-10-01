import { beforeEach, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import { HotelAwardDiscoveryPanel } from './HotelAwardDiscoveryPanel'
const load = vi.hoisted(() => vi.fn())
vi.mock('@/lib/authed-fetch', () => ({ authedFetch: load }))
vi.mock('./WalletRailMatrix', () => ({ WalletRailMatrix: () => null }))
const search = (destination: string) => ({ destination, checkInDate: '2026-12-01', checkOutDate: '2026-12-03' })
const response = (name: string) => new Response(JSON.stringify({ properties: [{ providerPropertyId: name, programmeId: 'accor-all', name, imageUrl: null, source: 'FIRST_PARTY' }] }))
beforeEach(() => { load.mockReset() })
it('removes the old destination results when the new search fails', async () => {
  load.mockResolvedValueOnce(response('Old hotel')).mockRejectedValueOnce(new Error('Synthetic outage'))
  const { rerender } = render(<HotelAwardDiscoveryPanel search={search('Singapore')} />)
  await screen.findByRole('heading', { name: 'Old hotel' })
  rerender(<HotelAwardDiscoveryPanel search={search('Tokyo')} />)
  await screen.findByText('Synthetic outage')
  expect(screen.queryByText('Old hotel')).not.toBeInTheDocument()
})
it('ignores a late response from the previous destination', async () => {
  let finish!: (response: Response) => void
  load.mockImplementationOnce(() => new Promise(resolve => { finish = resolve })).mockResolvedValueOnce(response('Tokyo hotel'))
  const { rerender } = render(<HotelAwardDiscoveryPanel search={search('Singapore')} />)
  rerender(<HotelAwardDiscoveryPanel search={search('Tokyo')} />)
  await screen.findByRole('heading', { name: 'Tokyo hotel' })
  await act(async () => finish(response('Old hotel')))
  expect(screen.queryByText('Old hotel')).not.toBeInTheDocument()
})
it('does not repeat a search when only the prop object identity changes', async () => {
  load.mockResolvedValue(response('Hotel'))
  const { rerender } = render(<HotelAwardDiscoveryPanel search={search('Singapore')} />)
  await screen.findByRole('heading', { name: 'Hotel' })
  rerender(<HotelAwardDiscoveryPanel search={search('Singapore')} />)
  await waitFor(() => expect(load).toHaveBeenCalledTimes(1))
})

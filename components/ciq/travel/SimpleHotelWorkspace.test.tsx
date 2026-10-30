import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { SimpleHotelWorkspace } from './SimpleHotelWorkspace'
const load = vi.hoisted(() => vi.fn())
vi.mock('@/lib/authed-fetch', () => ({ authedFetch: load }))
vi.mock('@/lib/request-timeout', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/request-timeout')>()
  return { withRequestTimeout: <T,>(request: (signal: AbortSignal) => Promise<T>) => actual.withRequestTimeout(request, 30) }
})
vi.mock('@/components/ciq/concierge/ConciergeRequestButton', () => ({ ConciergeRequestButton: () => <button>Concierge</button> }))
beforeEach(() => { load.mockReset() })
it.each([409, 'timeout'])('keeps programme verification usable after %s', async outcome => {
  load.mockImplementation((url: string) => {
    if (url.endsWith('/award-search')) return outcome === 'timeout' ? new Promise(() => {}) : Promise.resolve({ ok: false, status: 409, json: async () => ({ status: 'DIRECT_REQUIRED', reason: 'Check the programme directly.' }) })
    return Promise.resolve({ ok: true, status: 200, json: async () => url.endsWith('/award-discovery') ? { properties: [{ providerPropertyId: 'synthetic', programmeId: 'club-itc', name: 'Synthetic Hotel' }] } : {} })
  })
  render(<SimpleHotelWorkspace />)
  fireEvent.click(screen.getByRole('button', { name: 'Search hotels' }))
  await waitFor(() => expect(screen.getByText('Synthetic Hotel')).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: 'Check programme for these dates' }))
  await waitFor(() => expect(screen.getByText(outcome === 'timeout' ? /Check the programme directly to confirm availability/ : 'Check the programme directly.')).toBeInTheDocument())
  expect(screen.getByRole('button', { name: 'Check programme for these dates' })).toBeEnabled()
})
it('explains an invalid search instead of silently doing nothing', () => {
  render(<SimpleHotelWorkspace />)
  fireEvent.change(screen.getByLabelText('Destination'), { target: { value: '' } })
  fireEvent.click(screen.getByRole('button', { name: 'Search hotels' }))
  expect(screen.getByText(/Enter a destination/)).toBeInTheDocument()
  expect(load).not.toHaveBeenCalled()
})
it('recovers from two stalled providers and allows retry', async () => {
  load.mockImplementation(() => new Promise(() => {}))
  render(<SimpleHotelWorkspace />)
  fireEvent.click(screen.getByRole('button', { name: 'Search hotels' }))
  await waitFor(() => expect(screen.getByText(/Hotel search could not be completed/)).toBeInTheDocument())
  expect(screen.getByRole('button', { name: 'Search hotels' })).toBeEnabled()
  expect(load.mock.calls.every(([, init]) => init.signal.aborted)).toBe(true)
})
it('keeps returned cash inventory usable when the optional verdict stalls', async () => {
  load.mockImplementation((url: string) => url.endsWith('/verdict') ? new Promise(() => {}) : Promise.resolve({ ok: true, status: 200, json: async () => url.endsWith('/search') ? { offers: [{ id: 'synthetic', hotelName: 'Synthetic Hotel', currency: 'INR', totalPrice: 12000, source: 'synthetic' }] } : { properties: [] } }))
  render(<SimpleHotelWorkspace />)
  fireEvent.click(screen.getByRole('button', { name: 'Search hotels' }))
  await waitFor(() => expect(screen.getByRole('button', { name: 'Search hotels' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: /Pay cash/ }))
  expect(screen.getByText('Synthetic Hotel')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Search hotels' })).toBeEnabled()
})
it('preserves discovery results when the cash provider fails', async () => {
  load.mockImplementation((url: string) => Promise.resolve({ ok: !url.endsWith('/search'), status: url.endsWith('/search') ? 503 : 200, json: async () => url.endsWith('/award-discovery') ? { properties: [{ providerPropertyId: 'synthetic', programmeId: 'accor-all', name: 'Synthetic Loyalty Hotel' }] } : {} }))
  render(<SimpleHotelWorkspace />)
  fireEvent.click(screen.getByRole('button', { name: 'Search hotels' }))
  await waitFor(() => expect(screen.getByText('Synthetic Loyalty Hotel')).toBeInTheDocument())
  expect(screen.getByText('Live points check required')).toBeInTheDocument()
})

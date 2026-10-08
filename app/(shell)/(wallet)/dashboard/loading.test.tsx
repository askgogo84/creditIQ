import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), replace: vi.fn() }))
vi.mock('@/lib/authed-fetch', () => ({ authedFetch: mocks.fetch }))
vi.mock('@supabase/ssr', () => ({ createBrowserClient: () => ({ auth: {
  getUser: async () => ({ data: { user: { id: 'owner-a', email: 'test@example.invalid' } } }),
} }) }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: mocks.replace }) }))
vi.mock('@/components/ciq/WalletView', () => ({ WalletView: ({ cards, onRefresh }: any) => (
  <div>Loaded {cards.length} cards<button onClick={onRefresh}>Refresh wallet</button></div>
) }))
import Dashboard from './page'

let fail = false
beforeEach(() => {
  fail = false
  mocks.replace.mockReset()
  mocks.fetch.mockReset().mockImplementation(async (url: string) => {
    if (url === '/api/user-cards' || url === '/api/manual-cards') {
      if (fail) return new Response(JSON.stringify({ error: 'unavailable', cards: [] }), { status: 503 })
      return new Response(JSON.stringify({ cards: url === '/api/manual-cards' ? [{ id: 'c1', bank: 'HDFC', card_name: 'Infinia', points_balance: 100 }] : [] }))
    }
    return new Response(JSON.stringify({ onboarding_complete: true }))
  })
})
describe('wallet loading and recovery', () => {
  it.each([401, 503])('withholds the empty wallet when just one source returns %s', async status => {
    const normalFetch = mocks.fetch.getMockImplementation()!
    mocks.fetch.mockImplementation((url: string) => url === '/api/manual-cards'
      ? Promise.resolve(new Response(JSON.stringify({ cards: [] }), { status }))
      : normalFetch(url))
    render(<Dashboard />)
    expect(await screen.findByRole('alert')).toHaveTextContent(status === 401 ? 'sign in again' : 'could not be loaded')
    expect(screen.queryByText(/Loaded 0 cards/)).not.toBeInTheDocument()
    expect(mocks.replace).not.toHaveBeenCalled()
  })

  it('never presents a failed read as zero cards and recovers on retry', async () => {
    fail = true
    render(<Dashboard />)
    expect(screen.getByText('Loading your portfolio...')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded')
    expect(screen.queryByText(/Loaded 0 cards/)).not.toBeInTheDocument()
    expect(mocks.replace).not.toHaveBeenCalled()
    fail = false
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading cards' }))
    expect(await screen.findByText('Loaded 1 cards')).toBeInTheDocument()
  })
  it('does not replace a loaded wallet with zero cards when refresh fails', async () => {
    render(<Dashboard />)
    await screen.findByText('Loaded 1 cards')
    fail = true
    fireEvent.click(screen.getByRole('button', { name: 'Refresh wallet' }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
    expect(screen.queryByText(/Loaded 0 cards/)).not.toBeInTheDocument()
  })
})

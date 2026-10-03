import { beforeEach, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { DashboardHome } from './DashboardHome'
const load = vi.hoisted(() => vi.fn())
vi.mock('@/lib/authed-fetch', () => ({ authedFetch: load }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
beforeEach(() => {
  load.mockReset()
  window.matchMedia = vi.fn().mockReturnValue({ matches: false, addEventListener() {}, removeEventListener() {} })
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
})
const props = { displayName: 'Synthetic', primaryBank: 'HDFC', totalPoints: 11400, cards: [{ id: 'one', bank: 'HDFC', card_name: 'Infinia', points_balance: 11400, source: 'statement', self_entered: false }] }
it('keeps statement provenance while readiness is loading', () => {
  load.mockImplementation(() => new Promise(() => {}))
  render(<DashboardHome {...props} />)
  expect(screen.getByText(/100% verified/)).toBeInTheDocument()
  expect(screen.getByText(/Loading redemption readiness/)).toBeInTheDocument()
  expect(screen.getByText('Wallet value unavailable')).toBeInTheDocument()
  expect(load).toHaveBeenCalledWith('/api/cockpit/summary')
})
it('keeps provenance and explicitly reports failed readiness', async () => {
  load.mockResolvedValue(new Response('{}', { status: 500 }))
  render(<DashboardHome {...props} />)
  await waitFor(() => expect(screen.getByText(/temporarily unavailable/)).toBeInTheDocument())
  expect(screen.getByText(/100% verified/)).toBeInTheDocument()
  expect(screen.queryByText(/0\.25|1\.80/)).not.toBeInTheDocument()
  expect(load.mock.calls.every(([url]) => url === '/api/cockpit/summary')).toBe(true)
})
it('shows missing balances as unknown, not self-entered or verified zero', async () => {
  load.mockResolvedValue(new Response(JSON.stringify({ availability: 'partial', cards: [{ id: 'one', bank: 'HDFC', cardName: 'Infinia', last4: null, points: null, verified: false, selfEntered: false, partners: [], catalogueId: null }], summary: { total: 0, verified: 0, selfEntered: 0, verifiedPercent: 0, cardCount: 1, transferPathCount: 0 } })))
  render(<DashboardHome {...props} />)
  await waitFor(() => expect(screen.getByText(/Partial wallet/)).toBeInTheDocument())
  expect(screen.getAllByText('Unknown').length).toBeGreaterThan(0)
  expect(screen.getByText('BALANCE UNKNOWN')).toBeInTheDocument()
})

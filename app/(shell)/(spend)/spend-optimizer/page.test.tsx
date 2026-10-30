import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SpendOptimizerPage from './page'
const load = vi.hoisted(() => vi.fn())
vi.mock('@/lib/authed-fetch', () => ({ authedFetch: load }))
vi.mock('@/lib/hooks/useScrollToResults', () => ({ useScrollToResults: () => ({ ref: { current: null }, scrollToResults: vi.fn() }) }))
vi.mock('@/lib/request-timeout', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/request-timeout')>()
  return { withRequestTimeout: <T,>(request: (signal: AbortSignal) => Promise<T>) => actual.withRequestTimeout(request, 30) }
})
beforeEach(() => { load.mockReset() })
function compare() {
  render(<SpendOptimizerPage />)
  fireEvent.change(screen.getByRole('spinbutton', { name: /Monthly spend amount/ }), { target: { value: '20000' } })
  fireEvent.click(screen.getByRole('button', { name: /Compare cards/ }))
}
it('labels catalogue estimates and opens assumptions without erasing the result', async () => {
  load.mockResolvedValue({ ok: true, json: async () => ({ cards: [{ name: 'Synthetic Card', bank: 'Synthetic Bank', bestFor: 'Example', monthlyEarnings: 100, annualEarnings: 1200, annualFee: 0, netAnnualValue: 1200 }] }) })
  compare()
  await waitFor(() => expect(screen.getByRole('heading', { name: 'Compare Synthetic Card' })).toBeInTheDocument())
  expect(screen.queryByText('wallet match')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Reward assumptions/ }))
  expect(screen.getByRole('region', { name: 'Reward assumptions' })).toHaveTextContent('including cards outside your wallet')
  expect(screen.getByRole('heading', { name: 'Compare Synthetic Card' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Review assumptions/ }))
  expect(screen.queryByRole('region', { name: 'Reward assumptions' })).not.toBeInTheDocument()
})
it.each([{}, { cards: [{ name: 'Bad card', monthlyEarnings: 'unknown' }] }])('handles an incomplete AI result without crashing', async data => {
  load.mockResolvedValue({ ok: true, json: async () => data })
  compare()
  await waitFor(() => expect(screen.getByText(/could not complete the card comparison/)).toBeInTheDocument())
  expect(screen.getByRole('button', { name: /Compare cards/ })).toBeEnabled()
})
it('allows retry after an unresponsive comparison', async () => {
  load.mockImplementation(() => new Promise(() => {}))
  compare()
  await waitFor(() => expect(screen.getByText(/could not complete the card comparison/)).toBeInTheDocument())
  expect(screen.getByRole('button', { name: /Compare cards/ })).toBeEnabled()
  expect(load.mock.calls[0][1].signal.aborted).toBe(true)
})

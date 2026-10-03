import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdminConciergePage from './page'
vi.mock('@/lib/concierge/execution-plan', () => ({ buildBookingExecutionPlan: () => ({ mode: 'BLOCKED', canStartBooking: false, blockedReasons: [], steps: [] }) }))
const load = vi.fn()
beforeEach(() => { load.mockReset(); vi.stubGlobal('fetch', load) })
afterEach(() => vi.unstubAllGlobals())
const response = (version: number) => new Response(JSON.stringify({ cases: [{ id: 'same-case', source_type: 'HOTEL', title: 'Synthetic case', status: 'REVIEWING', currency: 'INR', selection: {}, source_snapshot: {}, redemption_snapshot: { version } }] }))
it('refreshes the review form when the same case receives updated evidence', async () => {
  load.mockResolvedValueOnce(response(1)).mockResolvedValueOnce(response(2))
  render(<AdminConciergePage />)
  await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(JSON.stringify({ version: 1 }, null, 2)))
  fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
  await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(JSON.stringify({ version: 2 }, null, 2)))
  expect(load).toHaveBeenCalledTimes(2)
  expect(load.mock.calls.every(([, options]) => !options.method)).toBe(true)
})
it('shows a recoverable queue error after a network failure', async () => {
  load.mockRejectedValueOnce(new Error('offline'))
  render(<AdminConciergePage />)
  expect(await screen.findByText('Could not load Concierge queue. Please retry.')).toBeInTheDocument()
})

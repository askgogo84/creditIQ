import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdminConciergePage from './page'
vi.mock('@/lib/concierge/execution-plan', () => ({ buildBookingExecutionPlan: () => ({ mode: 'CASH_PROVIDER_DEEPLINK', canStartBooking: true, blockedReasons: [], steps: [], provider: 'synthetic', bookingUrl: 'https://example.invalid/book' }) }))
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


it('runs the approved case through the preview booking sandbox from the admin queue', async () => {
  const approved = new Response(JSON.stringify({ cases: [{
    id: 'same-case', source_type: 'FLIGHT', title: 'Synthetic flight', status: 'TRANSFER_APPROVED',
    approval_state: 'APPROVED', snapshot_trust: 'SERVER_VERIFIED', expected_cash_minor: 418000, currency: 'INR',
    selection: { from: 'BLR', to: 'SIN', award_date: '2026-11-10' }, source_snapshot: {}, redemption_snapshot: {},
    verified_redemption_snapshot: { booking_url: 'https://example.invalid/book' }, booking_reference: null, reconciliation: null,
  }] }))
  const completed = new Response(JSON.stringify({ case: { status: 'RECONCILED' }, sandbox: { bookingReference: 'CIQ-FLT-ABCDEF1234' } }))
  const refreshed = new Response(JSON.stringify({ cases: [{
    id: 'same-case', source_type: 'FLIGHT', title: 'Synthetic flight', status: 'RECONCILED',
    approval_state: 'APPROVED', snapshot_trust: 'SERVER_VERIFIED', expected_cash_minor: 418000, currency: 'INR',
    selection: { from: 'BLR', to: 'SIN', award_date: '2026-11-10' }, source_snapshot: {}, redemption_snapshot: {},
    verified_redemption_snapshot: { booking_url: 'https://example.invalid/book' }, booking_reference: 'CIQ-FLT-ABCDEF1234', reconciliation: { mode: 'SANDBOX' },
  }] }))
  load.mockResolvedValueOnce(approved).mockResolvedValueOnce(completed).mockResolvedValueOnce(refreshed)
  render(<AdminConciergePage />)

  const button = await screen.findByRole('button', { name: 'Run booking sandbox end to end' })
  fireEvent.click(button)

  await waitFor(() => expect(load.mock.calls.some(([url, options]) =>
    String(url).endsWith('/sandbox-book') && options?.method === 'POST'
  )).toBe(true))
  const call = load.mock.calls.find(([url, options]) => String(url).endsWith('/sandbox-book') && options?.method === 'POST')!
  expect(JSON.parse(String(call[1].body))).toMatchObject({
    holder: { firstName: 'Test', lastName: 'Traveller' },
    participantCount: 1,
    simulation: 'SUCCESS',
  })
  expect(await screen.findByText(/Sandbox booking RECONCILED: CIQ-FLT-ABCDEF1234/)).toBeInTheDocument()
})

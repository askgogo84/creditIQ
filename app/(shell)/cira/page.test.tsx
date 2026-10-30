import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CiraPage from './page'
const load = vi.hoisted(() => vi.fn())
vi.mock('@/lib/authed-fetch', () => ({ authedFetch: load }))
vi.mock('@/lib/request-timeout', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/request-timeout')>()
  return { withRequestTimeout: <T,>(request: (signal: AbortSignal) => Promise<T>) => actual.withRequestTimeout(request, 30) }
})
beforeEach(() => {
  load.mockReset()
  window.history.replaceState({}, '', '/cira')
  Element.prototype.scrollIntoView = vi.fn()
})
it('preserves a question handed off from Home and labels examples honestly', () => {
  window.history.replaceState({}, '', '/cira?seed=Explain%20my%20wallet')
  render(<CiraPage />)
  expect(screen.getByRole('textbox', { name: 'Message CIRA' })).toHaveValue('Explain my wallet')
  expect(screen.queryByText('Recent')).not.toBeInTheDocument()
  fireEvent.click(screen.getAllByRole('button', { name: /Plan a Bengaluru/ })[0])
  expect(screen.getByRole('textbox', { name: 'Message CIRA' })).toHaveValue('Plan a Bengaluru–Singapore trip with my points')
  expect(load).not.toHaveBeenCalled()
})
it('recovers from a stalled answer and prevents resetting into an in-flight reply', async () => {
  load.mockImplementation(() => new Promise(() => {}))
  render(<CiraPage />)
  fireEvent.change(screen.getByRole('textbox', { name: 'Message CIRA' }), { target: { value: 'Compare a hotel stay' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
  expect(screen.getAllByRole('button', { name: 'New conversation' }).every(button => button.hasAttribute('disabled'))).toBe(true)
  await waitFor(() => expect(screen.getByText(/trouble connecting/)).toBeInTheDocument())
  expect(screen.getAllByRole('button', { name: 'New conversation' })[0]).toBeEnabled()
  expect(load.mock.calls[0][1].signal.aborted).toBe(true)
})
it('does not render a malformed assistant message as a React child', async () => {
  load.mockResolvedValue({ ok: true, json: async () => ({ message: { invalid: true } }) })
  render(<CiraPage />)
  fireEvent.change(screen.getByRole('textbox', { name: 'Message CIRA' }), { target: { value: 'Hello' } })
  fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
  await waitFor(() => expect(screen.getByText(/trouble connecting/)).toBeInTheDocument())
})

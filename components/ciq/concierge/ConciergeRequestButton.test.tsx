import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'
import { ConciergeRequestButton, type ConciergeRequest } from './ConciergeRequestButton'

const fetchMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/authed-fetch', () => ({ authedFetch: fetchMock }))
const request: ConciergeRequest = { sourceType: 'HOTEL', sourceRef: 'synthetic', title: 'Test stay', selection: {}, redemptionSnapshot: {}, sourceSnapshot: {}, expectedCashMinor: null }
beforeEach(() => fetchMock.mockReset())

it('blocks both personal and corporate handoffs when booking evidence is missing', () => {
  render(<ConciergeRequestButton request={request} disabled disabledReason="Booking evidence required" />)
  const personal = screen.getByRole('button', { name: 'Have CreditIQ Concierge book this' })
  const corporate = screen.getByRole('button', { name: /Corporate account/ })
  expect(personal).toBeDisabled()
  expect(corporate).toBeDisabled()
  expect(corporate).toHaveAttribute('title', 'Booking evidence required')
  fireEvent.click(corporate)
  fireEvent.click(personal)
  expect(fetchMock).not.toHaveBeenCalled()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

it('keeps eligible handoffs available without submitting when the confirmation opens', () => {
  render(<ConciergeRequestButton request={request} />)
  expect(screen.getByRole('button', { name: /Corporate account/ })).toBeEnabled()
  fireEvent.click(screen.getByRole('button', { name: 'Have CreditIQ Concierge book this' }))
  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(fetchMock).not.toHaveBeenCalled()
})

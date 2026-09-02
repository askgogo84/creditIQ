import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const state = vi.hoisted(() => ({
  status: 'REVIEWING',
  calls: [] as Array<{ url: string; init?: RequestInit }>,
}))

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('case=11111111-1111-4111-8111-111111111111'),
}))

vi.mock('@/lib/authed-fetch', () => ({
  authedFetch: vi.fn(async (url: string, init?: RequestInit) => {
    state.calls.push({ url, init })
    const base = {
      id: '11111111-1111-4111-8111-111111111111',
      context: 'HNI', source_type: 'FLIGHT', source_ref: 'award-sq', title: 'BLR → SIN',
      status: state.status, approval_state: state.status === 'AWAITING_USER_APPROVAL' ? 'REQUESTED' : 'NOT_REQUESTED',
      expected_cash_minor: 418000, currency: 'INR', contact_channel: 'BOTH', snapshot_trust: 'CLIENT_REQUEST',
      created_at: '2026-09-02T07:00:00Z', updated_at: '2026-09-02T07:00:00Z',
    }
    if (url === '/api/concierge/cases') {
      return new Response(JSON.stringify({ cases: [base] }), { status: 200 })
    }
    if (init?.method === 'PATCH') {
      state.status = 'TRANSFER_APPROVED'
      return new Response(JSON.stringify({ case: { ...base, status: 'TRANSFER_APPROVED', approval_state: 'APPROVED', selection: {}, redemption_snapshot: {}, source_snapshot: {}, notes: null, approval_requested_at: null, approved_at: '2026-09-02T07:10:00Z', cancelled_at: null, operator_verified_at: null, verified_redemption_snapshot: null, booking_reference: null, reconciliation: null } }), { status: 200 })
    }
    return new Response(JSON.stringify({ case: { ...base, selection: {}, redemption_snapshot: {}, source_snapshot: {}, notes: null, approval_requested_at: null, approved_at: null, cancelled_at: null, operator_verified_at: null, verified_redemption_snapshot: null, booking_reference: null, reconciliation: null } }), { status: 200 })
  }),
}))

import ConciergeCaseView from './ConciergeCaseView'

beforeEach(() => {
  state.status = 'REVIEWING'
  state.calls.length = 0
})

describe('ConciergeCaseView approval boundary', () => {
  it('does not offer approval while Concierge is still reviewing', async () => {
    render(<ConciergeCaseView />)
    expect(await screen.findByText(/Concierge is reviewing your option/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Approve transfer/i })).not.toBeInTheDocument()
    expect(screen.getByText(/No approval action is available while Concierge is still reviewing/i)).toBeInTheDocument()
  })

  it('shows approval only after the case is AWAITING_USER_APPROVAL and PATCHes only the action', async () => {
    state.status = 'AWAITING_USER_APPROVAL'
    render(<ConciergeCaseView />)
    const approve = await screen.findByRole('button', { name: /Approve transfer \+ booking/i })
    fireEvent.click(approve)

    await waitFor(() => expect(state.calls.some((call) => call.init?.method === 'PATCH')).toBe(true))
    const patch = state.calls.find((call) => call.init?.method === 'PATCH')!
    expect(JSON.parse(String(patch.init?.body))).toEqual({ action: 'APPROVE' })
    expect(String(patch.init?.body)).not.toContain('userId')
  })
})

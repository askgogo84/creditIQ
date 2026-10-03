import { StrictMode } from 'react'
import { beforeEach, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
const mocks = vi.hoisted(() => ({ load: vi.fn(), query: '' }))
vi.mock('@/lib/authed-fetch', () => ({ authedFetch: mocks.load }))
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams({ q: mocks.query }) }))
vi.mock('@/components/ciq/PageHeader', () => ({ PageHeader: () => null }))
import TravelPage from './page'
beforeEach(() => {
  mocks.load.mockReset(); mocks.query = 'Can I use 50% points and keep %25 literal?'
  Element.prototype.scrollIntoView = vi.fn()
})
it('preserves percent characters and sends a handoff only once under Strict Mode', async () => {
  mocks.load.mockResolvedValue(new Response(JSON.stringify({ reply: 'Synthetic answer' })))
  render(<StrictMode><TravelPage /></StrictMode>)
  await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(1))
  expect(JSON.parse(mocks.load.mock.calls[0][1].body).messages).toEqual([{ role: 'user', content: mocks.query }])
})

import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { WalletIntelligencePanel } from './WalletIntelligencePanel'
const load = vi.hoisted(() => vi.fn())
vi.mock('@/lib/authed-fetch', () => ({ authedFetch: load }))
const item = { id: 'signal-1', title: 'Accor transfer opportunity', summary: '', source: 'community', source_url: 'https://example.com/source', date: '2026-09-25', section: 'FOR_YOU', wallet_matches: [], relevant_card_names: ['HDFC Infinia'], programme_matches: ['Accor'], relevance_reason: 'Your card can reach Accor' }
beforeEach(() => load.mockReset())
it('shows programme-reachable evidence for the selected card, with a source and caveat', async () => {
  load.mockResolvedValue(new Response(JSON.stringify({ items: [item] })))
  const view = render(<WalletIntelligencePanel cardName="HDFC Infinia" bank="HDFC" />)
  expect(await screen.findByText(item.title)).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Source/ })).toHaveAttribute('href', item.source_url)
  expect(screen.getByText(/Community discovery, not verified/)).toBeInTheDocument()
  view.rerender(<WalletIntelligencePanel cardName="Axis Atlas" bank="Axis" />)
  expect(screen.queryByText(item.title)).not.toBeInTheDocument()
  expect(load).toHaveBeenCalledTimes(1)
})
it('distinguishes failed reads from empty results and retries', async () => {
  load.mockResolvedValueOnce(new Response('{}', { status: 503 })).mockResolvedValueOnce(new Response('{"items":[]}'))
  render(<WalletIntelligencePanel />)
  fireEvent.click(await screen.findByRole('button', { name: 'Retry intelligence' }))
  await waitFor(() => expect(screen.getByText(/No matched intelligence yet/)).toBeInTheDocument())
  expect(load).toHaveBeenCalledTimes(2)
})
it('never renders an executable source URL from an ingested post', async () => {
  load.mockResolvedValue(new Response(JSON.stringify({ items: [{ ...item, source_url: 'javascript:alert(1)' }] })))
  render(<WalletIntelligencePanel cardName="HDFC Infinia" />)
  await screen.findByText(item.title)
  expect(screen.queryByRole('link', { name: /Source/ })).not.toBeInTheDocument()
})

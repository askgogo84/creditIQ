/** @vitest-environment node */
import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ user: vi.fn(), ranked: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ auth: { getUser: mocks.user } }) }))
vi.mock('@/lib/intelligence/wallet-intelligence', () => ({ rankedWalletIntelligence: mocks.ranked }))
import { GET } from './route'
beforeEach(() => { vi.clearAllMocks(); mocks.user.mockResolvedValue({ data: { user: { id: 'owner-A' } }, error: null }); mocks.ranked.mockResolvedValue({ wallet: [], ranked: [] }) })
const request = (token?: string) => new NextRequest('http://localhost/api/feed?userId=victim', { headers: token ? { authorization: `Bearer ${token}` } : {} })
it('rejects missing or invalid authentication before wallet access', async () => {
  expect((await GET(request())).status).toBe(401)
  mocks.user.mockResolvedValue({ data: { user: null }, error: 'invalid' })
  expect((await GET(request('invalid'))).status).toBe(401)
  expect(mocks.ranked).not.toHaveBeenCalled()
})
it('uses the authenticated owner and explicitly distinguishes a successful empty feed', async () => {
  const res = await GET(request('valid'))
  expect(mocks.ranked).toHaveBeenCalledWith(expect.anything(), 'owner-A', 100)
  expect(await res.json()).toMatchObject({ availability: 'empty', items: [] })
})
it('does not turn a wallet or intelligence failure into an empty feed', async () => {
  mocks.ranked.mockRejectedValue(new Error('synthetic source outage'))
  const res = await GET(request('valid'))
  expect(res.status).toBe(503)
  expect(await res.json()).toMatchObject({ availability: 'unavailable' })
})

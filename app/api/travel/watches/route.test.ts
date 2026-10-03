/** @vitest-environment node */
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ gate: vi.fn(), eq: vi.fn(), one: vi.fn(), update: vi.fn(), fetch: vi.fn(), from: vi.fn() }))
vi.mock('@/lib/api-auth', () => ({ requireAuth: mocks.gate }))
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({ from: mocks.from }) }))
import { POST } from './route'
beforeEach(() => {
  vi.clearAllMocks(); vi.stubGlobal('fetch', mocks.fetch)
  mocks.gate.mockResolvedValue({ ok: true, userId: 'owner-A' })
  const query: any = { select: () => query, eq: mocks.eq, maybeSingle: mocks.one, update: mocks.update }
  mocks.from.mockReturnValue(query); mocks.eq.mockReturnValue(query)
})
afterEach(() => vi.unstubAllGlobals())
const request = () => new NextRequest('http://localhost/api/travel/watches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'check', id: 'victim-watch', userId: 'victim' }) })
it('rejects anonymous requests before database or provider access', async () => {
  mocks.gate.mockResolvedValue({ ok: false, res: new Response('{}', { status: 401 }) })
  expect((await POST(request())).status).toBe(401)
  expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.fetch).not.toHaveBeenCalled()
})
it('scopes forged watch ids to the authenticated owner', async () => {
  mocks.one.mockResolvedValue({ data: null, error: null })
  expect((await POST(request())).status).toBe(404)
  expect(mocks.eq).toHaveBeenCalledWith('user_id', 'owner-A')
  expect(mocks.fetch).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled()
})
it.each([{ cabin: 'premium_economy', travellers: 1 }, { cabin: 'business', travellers: 2 }])('rejects unsupported intent before provider calls or mutations: %j', async watch => {
  mocks.one.mockResolvedValue({ data: { ...watch, status: 'ACTIVE' }, error: null })
  expect((await POST(request())).status).toBe(422)
  expect(mocks.fetch).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled()
})

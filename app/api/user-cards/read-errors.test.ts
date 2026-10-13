import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), order: vi.fn(), eq: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: () => ({
  auth: { getUser: mocks.getUser },
  from: () => ({ select: () => ({ eq: mocks.eq }) }),
}) }))
import { GET as statement } from './route'
import { GET as manual } from '../manual-cards/route'

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.invalid')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon')
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service')
  mocks.getUser.mockReset().mockResolvedValue({ data: { user: { id: 'owner-a' } }, error: null })
  mocks.eq.mockReset().mockReturnValue({ order: mocks.order })
  mocks.order.mockReset().mockResolvedValue({ data: [], error: null })
})
const request = () => new NextRequest('https://test.invalid/api/cards?userId=other-owner', { headers: { authorization: 'Bearer test-token' } })
describe.each([['statement', statement], ['manual', manual]] as const)('%s card reads', (_, get) => {
  it('returns an empty wallet only after a successful owner-scoped query', async () => {
    const response = await get(request())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ cards: [] })
    expect(mocks.eq).toHaveBeenCalledWith('user_id', 'owner-a')
  })
  it('does not turn database failures into empty cards', async () => {
    mocks.order.mockResolvedValue({ data: null, error: { message: 'private database detail' } })
    const response = await get(request())
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error: 'Could not load saved cards' })
  })
  it('reports missing server configuration', async () => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')
    expect((await get(request())).status).toBe(503)
  })
  it('rejects an expired session before reading cards', async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'expired' } })
    expect((await get(request())).status).toBe(401)
    expect(mocks.eq).not.toHaveBeenCalled()
  })
})

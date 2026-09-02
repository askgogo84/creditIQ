/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const captured = vi.hoisted(() => ({ query: null as any }))
vi.mock('@/lib/api-auth', () => ({
  requireAuth: async (req: Request) => req.headers.get('authorization') === 'Bearer tokenA'
    ? { ok: true, userId: 'user-A' }
    : { ok: false, res: new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }) },
}))
vi.mock('@/lib/award-inventory/flight-orchestrator', () => ({
  searchFlightAwards: async (query: any) => {
    captured.query = query
    return { status: 'SUCCESS_CACHED_DISCOVERY', query, options: [], attempts: [], pricingAuthority: 'CACHED_DISCOVERY', fetchedAt: 'x', reason: 'ok', liveProvider: null }
  },
}))

function post(body: unknown, auth?: string) {
  const headers: Record<string,string> = { 'Content-Type': 'application/json' }
  if (auth) headers.Authorization = auth
  return new Request('http://localhost/api/flights/award-search', { method: 'POST', headers, body: JSON.stringify(body) }) as any
}

beforeEach(() => { captured.query = null })

describe('flight award search API', () => {
  it('rejects anonymous requests before running provider search', async () => {
    const { POST } = await import('./route')
    const res = await POST(post({ origin: 'BLR', destination: 'SIN', date: '2026-10-15', cabin: 'business' }))
    expect(res.status).toBe(401)
    expect(captured.query).toBeNull()
  })

  it('ignores forged body userId and sends only validated travel query', async () => {
    const { POST } = await import('./route')
    const res = await POST(post({ origin: 'blr', destination: 'sin', date: '2026-10-15', cabin: 'business', adults: 2, programmeId: 'krisflyer', userId: 'user-VICTIM' }, 'Bearer tokenA'))
    expect(res.status).toBe(200)
    expect(captured.query).toEqual({ origin: 'BLR', destination: 'SIN', date: '2026-10-15', cabin: 'business', adults: 2, programmeIds: ['krisflyer'] })
    expect(JSON.stringify(captured.query)).not.toContain('user-VICTIM')
  })

  it('rejects invalid airport/programme input', async () => {
    const { POST } = await import('./route')
    expect((await POST(post({ origin: 'BANGALORE', destination: 'SIN', date: '2026-10-15', cabin: 'business' }, 'Bearer tokenA'))).status).toBe(400)
    expect((await POST(post({ origin: 'BLR', destination: 'SIN', date: '2026-10-15', cabin: 'business', programmeId: '../bad' }, 'Bearer tokenA'))).status).toBe(400)
  })
})

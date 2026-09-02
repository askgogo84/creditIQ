/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ ok: true, userId: 'user-A' }))
const orchestrate = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api-auth', () => ({
  requireAuth: vi.fn(async () => auth.ok
    ? { ok: true, userId: auth.userId }
    : { ok: false, res: new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }) }),
}))

vi.mock('@/lib/award-inventory/orchestrator', () => ({ searchHotelAwards: orchestrate }))

function request(body: unknown, authenticated = true) {
  auth.ok = authenticated
  return new Request('http://localhost/api/hotels/award-search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(authenticated ? { Authorization: 'Bearer tokenA' } : {}) },
    body: JSON.stringify(body),
  }) as any
}

const BODY = {
  programmeId: 'marriott-bonvoy',
  destination: 'Singapore',
  checkInDate: '2026-10-15',
  checkOutDate: '2026-10-18',
  numberOfRooms: 1,
  numberOfAdults: 2,
  numberOfKids: 0,
}

beforeEach(() => {
  auth.ok = true
  orchestrate.mockReset()
  orchestrate.mockImplementation(async (input: any) => input.programmeId === 'accor-all'
    ? {
        status: 'DIRECT_REQUIRED', programmeId: 'accor-all', rates: [], cachedProperties: [], provider: null,
        fetchedAt: '2026-09-02T16:00:00Z', reason: 'ALL Accor requires direct programme availability verification.',
        attempts: [], pricingAuthority: 'DIRECT_ONLY',
      }
    : {
        status: 'SUCCESS', programmeId: input.programmeId, rates: [], cachedProperties: [], provider: null,
        fetchedAt: '2026-09-02T16:00:00Z', reason: 'Live date-specific award inventory returned.',
        attempts: [], pricingAuthority: 'DATE_SPECIFIC_LIVE',
      })
})

describe('hotel award search security boundary', () => {
  it('rejects unauthenticated searches before touching award orchestration', async () => {
    const { POST } = await import('./route')
    const res = await POST(request(BODY, false))
    expect(res.status).toBe(401)
    expect(orchestrate).not.toHaveBeenCalled()
  })

  it('ignores a forged body userId and forwards only bounded travel fields', async () => {
    const { POST } = await import('./route')
    const res = await POST(request({ ...BODY, userId: 'user-VICTIM', password: 'do-not-forward', loyaltyAccount: { password: 'x' } }))
    expect(res.status).toBe(200)
    expect(orchestrate).toHaveBeenCalledTimes(1)
    const [providerInput] = orchestrate.mock.calls[0]
    expect(providerInput).toEqual({
      programmeId: 'marriott-bonvoy', destination: 'Singapore', checkInDate: '2026-10-15', checkOutDate: '2026-10-18',
      numberOfRooms: 1, numberOfAdults: 2, numberOfKids: 0,
    })
    expect(providerInput).not.toHaveProperty('userId')
    expect(providerInput).not.toHaveProperty('password')
    expect(providerInput).not.toHaveProperty('loyaltyAccount')
  })

  it('returns direct-required policy without converting it to provider failure', async () => {
    const { POST } = await import('./route')
    const res = await POST(request({ ...BODY, programmeId: 'accor-all' }))
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ status: 'DIRECT_REQUIRED', programmeId: 'accor-all', pricingAuthority: 'DIRECT_ONLY' })
  })

  it('rejects invalid date ranges and unsupported programme ids before orchestration', async () => {
    const { POST } = await import('./route')
    const badDate = await POST(request({ ...BODY, checkOutDate: '2026-10-14' }))
    expect(badDate.status).toBe(400)
    const badProgramme = await POST(request({ ...BODY, programmeId: '../secret' }))
    expect(badProgramme.status).toBe(400)
    expect(orchestrate).not.toHaveBeenCalled()
  })
})

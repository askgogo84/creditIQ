/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ ok: true, userId: 'user-A' }))
const searchGuest = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api-auth', () => ({
  requireAuth: vi.fn(async () => auth.ok
    ? { ok: true, userId: auth.userId }
    : { ok: false, res: new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }) }),
}))

vi.mock('@/lib/award-inventory/providers/awardwallet', () => ({
  AwardWalletHotelSearchClient: class {
    searchGuest = searchGuest
  },
}))

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
  searchGuest.mockReset()
  searchGuest.mockResolvedValue({
    status: 'SUCCESS',
    provider: { code: 'marriott', displayName: 'Marriott', shortName: 'Marriott', loginRequired: false },
    rates: [],
    fetchedAt: '2026-09-02T16:00:00Z',
  })
})

describe('hotel award search security boundary', () => {
  it('rejects unauthenticated searches before touching the award provider', async () => {
    const { POST } = await import('./route')
    const res = await POST(request(BODY, false))
    expect(res.status).toBe(401)
    expect(searchGuest).not.toHaveBeenCalled()
  })

  it('ignores a forged body userId and sends only bounded travel fields to the provider', async () => {
    const { POST } = await import('./route')
    const res = await POST(request({ ...BODY, userId: 'user-VICTIM', password: 'do-not-forward' }))
    expect(res.status).toBe(200)
    expect(searchGuest).toHaveBeenCalledTimes(1)
    const [programmeId, providerInput] = searchGuest.mock.calls[0]
    expect(programmeId).toBe('marriott-bonvoy')
    expect(providerInput).toMatchObject({ destination: 'Singapore', numberOfAdults: 2, numberOfKids: 0 })
    expect(providerInput).not.toHaveProperty('userId')
    expect(providerInput).not.toHaveProperty('password')
    expect(providerInput).not.toHaveProperty('loyaltyAccount')
  })

  it('does not call an aggregator for DIRECT_REQUIRED programmes', async () => {
    const { POST } = await import('./route')
    const res = await POST(request({ ...BODY, programmeId: 'accor-all' }))
    expect(res.status).toBe(409)
    expect(await res.json()).toMatchObject({ status: 'DIRECT_REQUIRED', programmeId: 'accor-all' })
    expect(searchGuest).not.toHaveBeenCalled()
  })

  it('rejects invalid date ranges and unsupported programme ids', async () => {
    const { POST } = await import('./route')
    const badDate = await POST(request({ ...BODY, checkOutDate: '2026-10-14' }))
    expect(badDate.status).toBe(400)
    const badProgramme = await POST(request({ ...BODY, programmeId: '../secret' }))
    expect(badProgramme.status).toBe(400)
    expect(searchGuest).not.toHaveBeenCalled()
  })
})

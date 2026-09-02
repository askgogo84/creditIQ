/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const captured = vi.hoisted(() => ({
  portfolioUserIds: [] as string[],
}))

vi.mock('@/lib/api-auth', () => ({
  requireAuth: async (req: Request) => {
    const auth = req.headers.get('authorization')
    return auth === 'Bearer tokenA'
      ? { ok: true as const, userId: 'user-A' }
      : { ok: false as const, res: new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 }) }
  },
}))

vi.mock('@/lib/wallet/decision-portfolio', () => ({
  loadDecisionPortfolio: async (userId: string) => {
    captured.portfolioUserIds.push(userId)
    return [
      {
        source: 'statement', bank: 'HDFC Bank', cardName: 'HDFC Infinia Metal Edition', last4: '2184',
        points: 68500, pointsCurrency: 'Reward Points', verified: true, selfEntered: false,
        observedAt: '2026-09-01T00:00:00Z', linkedBalanceMerged: false,
      },
      {
        source: 'linked', bank: 'AU Bank', cardName: null, last4: '3302',
        points: 12000, pointsCurrency: 'Points', verified: true, selfEntered: false,
        observedAt: '2026-09-01T00:00:00Z', linkedBalanceMerged: false,
      },
    ]
  },
}))

function request(body?: unknown, auth?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (auth) headers.Authorization = auth
  return new Request('http://localhost/api/travel/redemption-rails', {
    method: 'POST',
    headers,
    body: JSON.stringify(body ?? {}),
  }) as any
}

beforeEach(() => {
  captured.portfolioUserIds.length = 0
})

describe('travel redemption rail matrix IDOR', () => {
  it('uses only the bearer identity and ignores a forged body userId', async () => {
    const { POST } = await import('@/app/api/travel/redemption-rails/route')
    const res = await POST(request({ travelKind: 'flight', programmeId: 'krisflyer', userId: 'user-VICTIM' }, 'Bearer tokenA'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(captured.portfolioUserIds).toEqual(['user-A'])
    expect(data.matrix.cards[0].cardName).toBe('HDFC Infinia Metal Edition')
    expect(data.matrix.cards[0].rails.some((r: any) => r.transfer?.programmeId === 'krisflyer')).toBe(true)
  })

  it('rejects unauthenticated requests before loading the wallet', async () => {
    const { POST } = await import('@/app/api/travel/redemption-rails/route')
    const res = await POST(request({ travelKind: 'flight' }))
    expect(res.status).toBe(401)
    expect(captured.portfolioUserIds).toHaveLength(0)
  })

  it('rejects invalid travel kinds', async () => {
    const { POST } = await import('@/app/api/travel/redemption-rails/route')
    const res = await POST(request({ travelKind: 'casino' }, 'Bearer tokenA'))
    expect(res.status).toBe(400)
    expect(captured.portfolioUserIds).toHaveLength(0)
  })

  it('keeps unnamed linked cards visible without guessing a product', async () => {
    const { POST } = await import('@/app/api/travel/redemption-rails/route')
    const res = await POST(request({ travelKind: 'hotel', programmeId: 'marriott-bonvoy' }, 'Bearer tokenA'))
    const data = await res.json()
    const au = data.matrix.cards.find((c: any) => c.bank === 'AU Bank')

    expect(au).toBeTruthy()
    expect(au.cardId).toBeNull()
    expect(au.status).toBe('NO_VERIFIED_REDEMPTION_RAIL')
    expect(au.rails).toEqual([])
  })
})

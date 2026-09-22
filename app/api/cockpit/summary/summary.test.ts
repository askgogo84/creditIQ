/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ ok: true, userId: 'user-A' }))
const portfolio = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api-auth', () => ({
  requireAuth: vi.fn(async () => auth.ok
    ? { ok: true, userId: auth.userId }
    : { ok: false, res: new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 }) }),
}))

vi.mock('@/lib/wallet/decision-portfolio', () => ({
  loadDecisionPortfolio: portfolio,
}))

beforeEach(() => {
  auth.ok = true
  portfolio.mockReset().mockResolvedValue([
    {
      source: 'statement',
      bank: 'HDFC',
      cardName: 'HDFC Infinia Metal Edition',
      last4: '4412',
      points: 38000,
      pointsCurrency: 'Reward Points',
      verified: true,
      selfEntered: false,
      observedAt: '2026-09-20T00:00:00Z',
      linkedBalanceMerged: false,
    },
    {
      source: 'manual',
      bank: 'Axis',
      cardName: 'Axis Atlas',
      last4: '9027',
      points: 14000,
      pointsCurrency: 'EDGE Miles',
      verified: false,
      selfEntered: true,
      observedAt: '2026-09-20T00:00:00Z',
      linkedBalanceMerged: false,
    },
  ])
})

describe('cockpit summary', () => {
  it('rejects unauthenticated reads before loading wallet data', async () => {
    auth.ok = false
    const { GET } = await import('./route')
    const res = await GET(new Request('http://localhost/api/cockpit/summary') as any)
    expect(res.status).toBe(401)
    expect(portfolio).not.toHaveBeenCalled()
  })

  it('derives totals and provenance from the authenticated wallet only', async () => {
    const { GET } = await import('./route')
    const res = await GET(new Request('http://localhost/api/cockpit/summary', {
      headers: { Authorization: 'Bearer tokenA' },
    }) as any)

    expect(res.status).toBe(200)
    expect(portfolio).toHaveBeenCalledWith('user-A')
    const body = await res.json()
    expect(body.summary).toMatchObject({
      total: 52000,
      verified: 38000,
      selfEntered: 14000,
      cardCount: 2,
    })
    expect(body.cards).toHaveLength(2)
    expect(body.cards[0]).toMatchObject({
      bank: 'HDFC',
      cardName: 'HDFC Infinia Metal Edition',
      points: 38000,
      verified: true,
    })
    expect(body.cards[0].partners.length).toBeGreaterThan(0)
  })

  // Hypothesis C invariant: a card that does NOT resolve against the SEED_CARDS
  // catalogue must still be KEPT — its points count toward the total and the
  // cardCount. A catalogue miss may drop partners/best-use, never the card itself.
  it('keeps a card that does not match the catalogue, points and count intact', async () => {
    portfolio.mockReset().mockResolvedValue([
      {
        source: 'manual',
        bank: 'Slice',
        cardName: 'Slice Super Card',
        last4: '5599',
        points: 8000,
        pointsCurrency: 'Points',
        verified: false,
        selfEntered: true,
        observedAt: '2026-09-20T00:00:00Z',
        linkedBalanceMerged: false,
      },
    ])

    const { GET } = await import('./route')
    const res = await GET(new Request('http://localhost/api/cockpit/summary', {
      headers: { Authorization: 'Bearer tokenA' },
    }) as any)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.summary.cardCount).toBe(1)
    expect(body.summary.total).toBe(8000)
    expect(body.cards).toHaveLength(1)
    expect(body.cards[0]).toMatchObject({
      bank: 'Slice',
      cardName: 'Slice Super Card',
      points: 8000,
      catalogueId: null,
    })
  })
})

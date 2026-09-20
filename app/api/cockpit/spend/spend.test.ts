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

function request(body: unknown) {
  return new Request('http://localhost/api/cockpit/spend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer tokenA' },
    body: JSON.stringify(body),
  }) as any
}

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
      observedAt: null,
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
      observedAt: null,
      linkedBalanceMerged: false,
    },
  ])
})

describe('cockpit spend comparison', () => {
  it('uses only cards from the authenticated wallet', async () => {
    const { POST } = await import('./route')
    const res = await POST(request({ amount: 25000, merchant: 'Apple', category: 'shopping' }))

    expect(res.status).toBe(200)
    expect(portfolio).toHaveBeenCalledWith('user-A')
    const body = await res.json()
    expect(body.cards.length).toBe(2)
    expect(body.cards.map((card: any) => card.cardName)).toEqual(expect.arrayContaining([
      'HDFC Infinia Metal Edition',
      'Axis Atlas',
    ]))
    expect(body.cards.map((card: any) => card.cardName)).not.toContain('SBI Cashback Credit Card')
    expect(body.disclosure).toMatch(/Estimated reward value/i)
  })

  it('rejects zero-value comparisons', async () => {
    const { POST } = await import('./route')
    const res = await POST(request({ amount: 0, merchant: 'Apple', category: 'shopping' }))
    expect(res.status).toBe(400)
    expect(portfolio).not.toHaveBeenCalled()
  })
})

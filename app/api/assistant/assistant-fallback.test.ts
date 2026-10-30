/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const callAI = vi.hoisted(() => vi.fn())

vi.mock('@/lib/ai', () => ({ callAI }))

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(async () => ({ ok: true })),
}))

vi.mock('@/lib/api-auth', () => ({
  callerId: vi.fn(async () => null),
}))

vi.mock('@/lib/rag', () => ({
  retrieveRelevantCards: vi.fn(async () => ({
    context: [],
    devaluations: [],
    igInsights: [],
    sourced: [],
  })),
  buildRagSystemPrompt: vi.fn(() => ''),
}))

vi.mock('@/lib/intelligence/wallet-intelligence', () => ({
  rankedWalletIntelligence: vi.fn(),
  walletIntelligencePrompt: vi.fn(() => ''),
}))

vi.mock('@/lib/redemption-rails/cira-context', () => ({
  ciraCanonicalTravelContext: vi.fn(() => ''),
}))

function request(message: string) {
  return new Request('http://localhost/api/assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history: [] }),
  }) as any
}

beforeEach(() => {
  callAI.mockReset()
})

describe('CIRA safe fallback', () => {
  it('explains wallet valuation without asking a model to invent card rates', async () => {
    const { POST } = await import('./route')
    const res = await POST(request('Explain why my wallet shows points rather than a rupee value. What do I need for a hotel redemption?'))
    const body = await res.json()
    expect(body.message).toContain('does not have a verified single rupee value')
    expect(body.message).toContain('confirmed points quote')
    expect(body.message).toContain('Missing information stays unknown')
    expect(body.message).toContain('(/hotels)')
    expect(callAI).not.toHaveBeenCalled()
  })

  it('does not promise wallet-only recommendations when the spend model is unavailable', async () => {
    callAI.mockResolvedValue({ ok: false, reason: 'ai_error' })
    const { POST } = await import('./route')
    const body = await (await POST(request('Which card for an Amazon purchase?'))).json()
    expect(body.message).toContain('cards you do not own')
    expect(body.message).toContain('(/spend-optimizer)')
    expect(body.message).not.toContain('best card from your wallet')
  })
  it('returns a useful 200 travel fallback when every AI provider is unavailable', async () => {
    callAI.mockResolvedValue({
      ok: false,
      reason: 'ai_error',
      status: 502,
      detail: 'all_providers_unavailable',
    })

    const { POST } = await import('./route')
    const res = await POST(request('Plan a Bengaluru to Singapore trip with my points'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({ ok: true, degraded: true })
    expect(body.message).toMatch(/Open Travel/i)
    expect(body.message).toMatch(/do not transfer points yet/i)
  })

  it('returns the model answer when a provider succeeds', async () => {
    callAI.mockResolvedValue({
      ok: true,
      provider: 'gemini',
      text: 'Use the verified route and re-check before transfer.',
    })

    const { POST } = await import('./route')
    const res = await POST(request('Which card should I use?'))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toMatchObject({
      ok: true,
      provider: 'gemini',
      message: 'Use the verified route and re-check before transfer.',
    })
  })
})

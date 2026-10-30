/** @vitest-environment node */
import { expect, it, vi } from 'vitest'
const retrieve = vi.hoisted(() => vi.fn(async () => ({ context: '', devaluations: [], sourced: [] })))
vi.mock('@/lib/rag', () => ({ retrieveRelevantCards: retrieve, buildRagSystemPrompt: () => '' }))
vi.mock('@/lib/ai', () => ({ MODELS: { sonnet: 'mock' }, callClaude: vi.fn(async () => ({ ok: true, text: '{"cards":[]}' })) }))
vi.mock('@/lib/rate-limit', () => ({ rateLimit: vi.fn(async () => ({ ok: true })) }))
it('retrieves merchant shopping evidence even when the output example mentions travel and dining', async () => {
  const { POST } = await import('./route')
  const response = await POST(new Request('http://localhost/api/spend-optimizer', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'Example: travel and dining card with lounge access', spends: { shopping: '20000' }, totalSpend: 20000, merchant: 'Amazon India' }),
  }) as any)
  expect(response.status).toBe(200)
  expect(retrieve).toHaveBeenCalledWith('Amazon India shopping credit card rewards', expect.objectContaining({ intent: 'shopping' }))
})

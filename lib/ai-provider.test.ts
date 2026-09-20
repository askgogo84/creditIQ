/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const originalEnv = { ...process.env }

beforeEach(() => {
  vi.restoreAllMocks()
  process.env = { ...originalEnv }
  delete process.env.AI_PROVIDER_ORDER
  delete process.env.GEMINI_API_KEY
  delete process.env.GOOGLE_AI_API_KEY
  delete process.env.ANTHROPIC_API_KEY
})

afterEach(() => {
  process.env = { ...originalEnv }
})

describe('AI provider gateway', () => {
  it('falls through from Gemini to Anthropic when Gemini is unavailable', async () => {
    process.env.GEMINI_API_KEY = 'gemini-test'
    process.env.ANTHROPIC_API_KEY = 'anthropic-test'

    const fetchMock = vi.spyOn(globalThis, 'fetch' as any)
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: 'quota' } }), { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        content: [{ type: 'text', text: 'Anthropic fallback answer' }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }))

    const { callAI } = await import('./ai')
    const result = await callAI({
      messages: [{ role: 'user', content: 'hello' }],
      max_tokens: 100,
      timeoutMs: 1000,
    })

    expect(result).toEqual({ ok: true, text: 'Anthropic fallback answer', provider: 'anthropic' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[0][0])).toContain('generativelanguage.googleapis.com')
    expect(String(fetchMock.mock.calls[1][0])).toBe('https://api.anthropic.com/v1/messages')
  })

  it('uses Gemini first when configured and healthy', async () => {
    process.env.GEMINI_API_KEY = 'gemini-test'
    process.env.ANTHROPIC_API_KEY = 'anthropic-test'

    const fetchMock = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue(
      new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: 'Gemini answer' }] } }],
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )

    const { callAI } = await import('./ai')
    const result = await callAI({
      messages: [{ role: 'user', content: 'hello' }],
      max_tokens: 100,
      timeoutMs: 1000,
    })

    expect(result).toEqual({ ok: true, text: 'Gemini answer', provider: 'gemini' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('returns structured failure when no provider is configured', async () => {
    const { callAI } = await import('./ai')
    const result = await callAI({
      messages: [{ role: 'user', content: 'hello' }],
      max_tokens: 100,
      timeoutMs: 1000,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason).toBe('ai_not_configured')
  })
})

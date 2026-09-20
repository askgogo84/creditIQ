// Shared AI provider gateway.
//
// CreditIQ must not depend on one model vendor. Deterministic product engines
// (wallet maths, travel inventory, award verification) remain outside this
// module; this gateway is for explanation/orchestration only.

export const MODELS = {
  opus: 'claude-opus-4-8',
  sonnet: 'claude-sonnet-4-6',
  haiku: 'claude-haiku-4-5-20251001',
} as const

export type AIProvider = 'gemini' | 'anthropic'

export type AIResult =
  | { ok: true; text: string; provider?: AIProvider }
  | { ok: false; reason: 'ai_not_configured' | 'ai_error'; status: number; detail?: string }

export type ClaudeResult = AIResult

export interface CallAIOpts {
  messages: any[]
  system?: string
  max_tokens: number
  timeoutMs?: number
  anthropicModel?: string
  geminiModel?: string
}

export interface CallClaudeOpts {
  model: string
  messages: any[]
  system?: string
  max_tokens: number
  timeoutMs?: number
  extraHeaders?: Record<string, string>
}

function providerOrder(): AIProvider[] {
  const raw = (process.env.AI_PROVIDER_ORDER || 'gemini,anthropic')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean)
  const out: AIProvider[] = []
  for (const value of raw) {
    if ((value === 'gemini' || value === 'anthropic') && !out.includes(value)) out.push(value)
  }
  return out.length ? out : ['gemini', 'anthropic']
}

function geminiRole(role: string) {
  return role === 'assistant' ? 'model' : 'user'
}

export async function callGemini(opts: CallAIOpts): Promise<AIResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (!apiKey) return { ok: false, reason: 'ai_not_configured', status: 503, detail: 'gemini_key_missing' }

  const model = opts.geminiModel || process.env.GEMINI_MODEL || 'gemini-3.5-flash'
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 20000)

  try {
    const body: any = {
      contents: (opts.messages || []).map((message: any) => ({
        role: geminiRole(String(message?.role || 'user')),
        parts: [{ text: String(message?.content || '') }],
      })),
      generationConfig: {
        maxOutputTokens: opts.max_tokens,
      },
    }
    if (opts.system) body.systemInstruction = { parts: [{ text: opts.system }] }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      },
    )

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error(`Gemini API error ${response.status}: ${detail.slice(0, 300)}`)
      return { ok: false, reason: 'ai_error', status: 502, detail: `gemini_upstream_${response.status}` }
    }

    const data = await response.json()
    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map((part: any) => part?.text)
      .filter((value: any) => typeof value === 'string')
      .join('\n')
      .trim()

    if (!text) return { ok: false, reason: 'ai_error', status: 502, detail: 'gemini_empty_response' }
    return { ok: true, text, provider: 'gemini' }
  } catch (err: any) {
    const aborted = err?.name === 'AbortError'
    console.error('Gemini call failed:', aborted ? 'timeout' : err?.message || String(err))
    return { ok: false, reason: 'ai_error', status: aborted ? 504 : 502, detail: aborted ? 'gemini_timeout' : 'gemini_fetch_error' }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Direct Anthropic call retained for routes that explicitly need Claude.
 */
export async function callClaude(opts: CallClaudeOpts): Promise<ClaudeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('MISSING ENV: ANTHROPIC_API_KEY — AI call skipped')
    return { ok: false, reason: 'ai_not_configured', status: 503, detail: 'anthropic_key_missing' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30000)
  try {
    const body: any = {
      model: opts.model,
      max_tokens: opts.max_tokens,
      messages: opts.messages,
    }
    if (opts.system) body.system = opts.system

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        ...(opts.extraHeaders || {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error(`Anthropic API error ${response.status}: ${detail.slice(0, 300)}`)
      return { ok: false, reason: 'ai_error', status: 502, detail: `anthropic_upstream_${response.status}` }
    }

    const data = await response.json()
    const text = (data?.content || [])
      .filter((b: any) => b?.type === 'text')
      .map((b: any) => b.text)
      .join('\n')
      .trim()

    if (!text) return { ok: false, reason: 'ai_error', status: 502, detail: 'anthropic_empty_response' }
    return { ok: true, text, provider: 'anthropic' }
  } catch (err: any) {
    const aborted = err?.name === 'AbortError'
    console.error('Anthropic call failed:', aborted ? 'timeout after 30s' : err?.message || String(err))
    return { ok: false, reason: 'ai_error', status: aborted ? 504 : 502, detail: aborted ? 'anthropic_timeout' : 'anthropic_fetch_error' }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Provider-neutral gateway. Tries configured providers in AI_PROVIDER_ORDER,
 * defaults to Gemini -> Anthropic. If every model provider fails, the caller
 * can use its deterministic CreditIQ fallback.
 */
export async function callAI(opts: CallAIOpts): Promise<AIResult> {
  let last: AIResult = { ok: false, reason: 'ai_not_configured', status: 503 }

  for (const provider of providerOrder()) {
    const result = provider === 'gemini'
      ? await callGemini(opts)
      : await callClaude({
          model: opts.anthropicModel || MODELS.haiku,
          max_tokens: opts.max_tokens,
          system: opts.system,
          messages: opts.messages,
          timeoutMs: opts.timeoutMs,
        })

    if (result.ok) return result
    last = result
    console.warn('AI provider unavailable, trying next provider', provider, result.detail || result.reason)
  }

  return last
}

export function extractJson<T = any>(text: string): { ok: true; data: T } | { ok: false } {
  if (!text) return { ok: false }
  const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
  try {
    return { ok: true, data: JSON.parse(clean) as T }
  } catch {
    return { ok: false }
  }
}

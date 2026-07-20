// Shared Anthropic helper — single choke point for every Claude call.
// Guarantees: env-var presence check, 30s timeout, response.ok check before
// parse, and structured failure instead of a thrown SyntaxError. Routes keep
// their own post-processing by calling extractJson (or parsing raw text
// themselves) on the returned string.

export const MODELS = {
  opus: 'claude-opus-4-8',
  sonnet: 'claude-sonnet-4-6',
  haiku: 'claude-haiku-4-5-20251001',
} as const

export type ClaudeResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'ai_not_configured' | 'ai_error'; status: number; detail?: string }

export interface CallClaudeOpts {
  model: string
  messages: any[]
  system?: string
  max_tokens: number
  timeoutMs?: number
  /** Extra request headers, e.g. { 'anthropic-beta': 'pdfs-2024-09-25' } for PDF document mode. */
  extraHeaders?: Record<string, string>
}

/**
 * Call the Anthropic Messages API through one hardened path.
 * Never throws — always resolves to a structured ClaudeResult so callers
 * can return a clean error response instead of crashing.
 */
export async function callClaude(opts: CallClaudeOpts): Promise<ClaudeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('MISSING ENV: ANTHROPIC_API_KEY — AI call skipped')
    return { ok: false, reason: 'ai_not_configured', status: 503 }
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
      return { ok: false, reason: 'ai_error', status: 502, detail: `upstream_${response.status}` }
    }

    const data = await response.json()
    const text = (data?.content || [])
      .filter((b: any) => b?.type === 'text')
      .map((b: any) => b.text)
      .join('\n')
    return { ok: true, text }
  } catch (err: any) {
    const aborted = err?.name === 'AbortError'
    console.error('Anthropic call failed:', aborted ? 'timeout after 30s' : err?.message || String(err))
    return { ok: false, reason: 'ai_error', status: aborted ? 504 : 502 }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Strip markdown fences and JSON.parse model output inside a try/catch.
 * Returns { ok:false } instead of throwing on malformed output.
 */
export function extractJson<T = any>(text: string): { ok: true; data: T } | { ok: false } {
  if (!text) return { ok: false }
  const clean = text.replace(/```json/g, '').replace(/```/g, '').trim()
  try {
    return { ok: true, data: JSON.parse(clean) as T }
  } catch {
    return { ok: false }
  }
}


import { createHmac } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'
import type { Channel } from './tools'

export function allowedOrigin(request: Request, channel: Channel) {
  const origin = request.headers.get('origin')
  if (!origin) return true // Server-to-server calls do not carry a browser Origin.
  const allowed = [
    'https://www.creditiq.app',
    'https://creditiq.app',
    ...(channel === 'claude' ? ['https://claude.ai'] : []),
    ...(channel === 'chatgpt' ? ['https://chatgpt.com'] : []),
    ...(process.env.MCP_ALLOWED_ORIGINS ?? '').split(',').map(value => value.trim()).filter(Boolean),
  ]
  return allowed.includes(origin)
}

export function connectorEnabled() {
  if (process.env.VERCEL_ENV === 'production') return process.env.CREDITIQ_MCP_ENABLED === 'true'
  return process.env.CREDITIQ_MCP_ENABLED !== 'false'
}

const windowMs = 60_000
let localLimit = { start: 0, count: 0 }

export async function rateGate(request: NextRequest, channel: Channel): Promise<'allowed' | 'limited' | 'unavailable'> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!process.env.VERCEL && process.env.NODE_ENV !== 'production' && (!url || !secret)) {
    if (Date.now() - localLimit.start > windowMs) localLimit = { start: Date.now(), count: 0 }
    localLimit.count += 1
    return localLimit.count <= 120 ? 'allowed' : 'limited'
  }
  if (!url || !secret) return 'unavailable'

  // This header is set by Vercel. A short-lived digest prevents writing raw IPs to rate_limits.
  const ip = process.env.VERCEL ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() : null
  const day = new Date().toISOString().slice(0, 10)
  const bucket = createHmac('sha256', secret).update('mcp-rate:' + day + ':' + (ip || 'unknown')).digest('hex').slice(0, 32)
  try {
    const client = createClient(url, secret, { auth: { persistSession: false } })
    const response = await client.rpc('rl_hit', { p_key: 'mcp:' + channel + ':' + bucket, p_window_seconds: 60, p_limit: 120 })
      .abortSignal(AbortSignal.timeout(1500))
    const allowed = response.data?.[0]?.allowed
    if (response.error || typeof allowed !== 'boolean') return 'unavailable'
    return allowed ? 'allowed' : 'limited'
  } catch {
    return 'unavailable'
  }
}

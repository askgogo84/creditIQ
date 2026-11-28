
import type { NextRequest } from 'next/server'
import { allowedOrigin, connectorEnabled, rateGate } from '@/lib/mcp/guard'
import { dispatchMcp } from '@/lib/mcp/server'
import type { Channel } from '@/lib/mcp/tools'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 10

type Params = { params: { channel?: string[] } }

function rpcHttpError(status: number, message: string, retryAfter?: string) {
  const headers = new Headers({ 'Cache-Control': 'no-store' })
  if (retryAfter) headers.set('Retry-After', retryAfter)
  return Response.json({ jsonrpc: '2.0', id: null, error: { code: -32000, message } }, { status, headers })
}

function channelFor({ params }: Params): Channel | null {
  const route = params.channel ?? []
  if (!route.length) return 'mcp'
  return route.length === 1 && (route[0] === 'claude' || route[0] === 'chatgpt') ? route[0] : null
}

function available(req: NextRequest, context: Params) {
  const channel = channelFor(context)
  if (!channel || !connectorEnabled()) return { error: rpcHttpError(404, 'CreditIQ MCP endpoint is unavailable.') }
  if (!allowedOrigin(req, channel)) return { error: rpcHttpError(403, 'Origin is not permitted.') }
  return { channel }
}

export async function POST(req: NextRequest, context: Params) {
  const access = available(req, context)
  if (access.error) return access.error
  const gate = await rateGate(req, access.channel)
  if (gate === 'limited') return rpcHttpError(429, 'Too many requests. Retry in one minute.', '60')
  if (gate === 'unavailable') return rpcHttpError(503, 'Request protection is temporarily unavailable.', '10')
  try {
    return await dispatchMcp(req, access.channel)
  } catch {
    return rpcHttpError(500, 'CreditIQ MCP request failed.')
  }
}

export function GET(req: NextRequest, context: Params) {
  const access = available(req, context)
  return access.error ?? new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } })
}

export const DELETE = GET

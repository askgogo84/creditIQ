
import type { NextRequest } from 'next/server'
import { connectorEnabled, rateGate } from '@/lib/mcp/guard'
import { referralChannel } from '@/lib/mcp/referrals'

export const runtime = 'nodejs'
export const maxDuration = 5

export async function POST(request: NextRequest, { params }: { params: { channel: string } }) {
  const headers = { 'Cache-Control': 'no-store' }
  const channel = referralChannel(params.channel)
  if (!connectorEnabled() || !channel) return new Response(null, { status: 404, headers })
  const host = request.headers.get('host')
  const protocol = process.env.VERCEL ? 'https:' : request.nextUrl.protocol
  const origin = host ? protocol + '//' + host : request.nextUrl.origin
  const length = request.headers.get('content-length')
  if (request.headers.get('origin') !== origin ||
    request.headers.get('sec-fetch-site') !== 'same-origin' || (length !== null && length !== '0')) {
    return new Response(null, { status: 403, headers })
  }
  if (request.headers.get('sec-gpc') === '1' || request.headers.get('dnt') === '1') return new Response(null, { status: 204, headers })
  const result = await rateGate(request, channel)
  if (result !== 'allowed') return new Response(null, { status: result === 'limited' ? 429 : 503, headers })
  console.info(JSON.stringify({ event: 'creditiq_mcp_referral', channel }))
  return new Response(null, { status: 204, headers })
}

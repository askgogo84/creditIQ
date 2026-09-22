import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  const configured = Boolean(String(process.env.TYPESAFE_API_KEY || process.env.JEV_API_KEY || '').trim())
  return NextResponse.json({
    configured,
    model: 'jev-latest',
    endpoint: '/v1/systemone',
    mode: configured ? 'jev-with-deterministic-fallback' : 'deterministic-fallback-only',
  })
}

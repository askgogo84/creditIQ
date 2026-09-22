import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const configured = Boolean(String(process.env.TYPESAFE_API_KEY || process.env.JEV_API_KEY || '').trim())
  return NextResponse.json({
    configured,
    model: 'jev-latest',
    endpoint: '/v1/systemone',
    mode: configured ? 'jev-with-deterministic-fallback' : 'deterministic-fallback-only',
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

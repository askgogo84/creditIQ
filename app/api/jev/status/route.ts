import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const apiKey = String(process.env.TYPESAFE_API_KEY || process.env.JEV_API_KEY || '').trim()
  const configured = Boolean(apiKey)

  let authenticated = false
  let providerStatus: number | null = null
  let error: string | null = null

  if (configured) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    try {
      const res = await fetch('https://api.typesafe.ai/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
      })
      providerStatus = res.status
      authenticated = res.ok
      if (!res.ok) error = `typesafe_http_${res.status}`
    } catch (err: any) {
      error = err?.name === 'AbortError' ? 'typesafe_timeout' : 'typesafe_unreachable'
    } finally {
      clearTimeout(timer)
    }
  }

  return NextResponse.json({
    configured,
    authenticated,
    providerStatus,
    model: 'jev-latest',
    endpoint: '/v1/systemone',
    mode: authenticated ? 'jev-with-deterministic-fallback' : 'deterministic-fallback-only',
    error,
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

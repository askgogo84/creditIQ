import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 20

const BASE_URL = 'https://apisv2.awardtoolapi.com'

function numericUsageFields(row: Record<string, unknown>) {
  const out: Record<string, number> = {}
  for (const [key, value] of Object.entries(row)) {
    if (key.toLowerCase().includes('api_key')) continue
    if (typeof value === 'number' && Number.isFinite(value)) out[key] = value
    else if (typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value)) out[key] = Number(value)
  }
  return out
}

function safeDate(row: Record<string, unknown>) {
  for (const key of ['date', 'usage_date', 'day', 'created_at']) {
    const value = row[key]
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 32)
  }
  return null
}

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  const apiKey = process.env.AWARDTOOL_API_KEY || ''
  if (!apiKey) {
    return NextResponse.json({ configured: false, recent: [], totals: {}, note: 'AwardTool is not configured.' })
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12_000)
    let response: Response
    try {
      response = await fetch(`${BASE_URL}/api/v1/api_usage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey }),
        signal: controller.signal,
        cache: 'no-store',
      })
    } finally {
      clearTimeout(timer)
    }

    const json = await response.json().catch(() => ({})) as Record<string, unknown>
    if (!response.ok) {
      return NextResponse.json({ configured: true, error: `AwardTool usage endpoint returned HTTP ${response.status}` }, { status: 502 })
    }

    const rows = Array.isArray(json.data)
      ? json.data.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
      : []
    const recent = rows.slice(-14).map(row => ({ date: safeDate(row), ...numericUsageFields(row) }))
    const totals: Record<string, number> = {}
    for (const row of rows) {
      for (const [key, value] of Object.entries(numericUsageFields(row))) totals[key] = (totals[key] || 0) + value
    }

    return NextResponse.json({
      configured: true,
      recent,
      totals,
      rows: rows.length,
      generated_at: new Date().toISOString(),
      note: 'Sanitized AwardTool usage counts only. Credential values are never returned.',
    })
  } catch (error) {
    console.error('AwardTool usage diagnostics failed', error)
    return NextResponse.json({ configured: true, error: 'AwardTool usage diagnostics unavailable' }, { status: 502 })
  }
}

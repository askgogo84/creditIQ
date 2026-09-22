import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { runJevHotelVerdict, type HotelVerdictInput } from '@/lib/typesafe/creditiq-hotel-decision'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function text(value: unknown, max = 160): string | null {
  if (typeof value !== 'string') return null
  const v = value.trim()
  return v && v.length <= max ? v : null
}

function money(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 && Number.isSafeInteger(Math.round(n)) ? Math.round(n) : null
}

function authority(value: unknown): HotelVerdictInput['loyalty']['pricingAuthority'] {
  return ['DATE_SPECIFIC_LIVE', 'DISCOVERY_ONLY', 'DIRECT_ONLY', 'NONE'].includes(String(value))
    ? value as HotelVerdictInput['loyalty']['pricingAuthority']
    : 'NONE'
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.res

  const body = await req.json().catch(() => ({}))
  const destination = text(body.destination)
  if (!destination) return NextResponse.json({ error: 'destination is required' }, { status: 400 })

  const input: HotelVerdictInput = {
    destination,
    cash: {
      amountMinor: money(body.cash?.amountMinor),
      currency: text(body.cash?.currency, 8)?.toUpperCase() ?? null,
      source: text(body.cash?.source, 80),
      live: Boolean(body.cash?.live),
    },
    loyalty: {
      programmeId: text(body.loyalty?.programmeId, 80),
      propertyName: text(body.loyalty?.propertyName, 180),
      pointsRequired: money(body.loyalty?.pointsRequired),
      cashComponentMinor: money(body.loyalty?.cashComponentMinor),
      cashCurrency: text(body.loyalty?.cashCurrency, 8)?.toUpperCase() ?? null,
      status: text(body.loyalty?.status, 80),
      pricingAuthority: authority(body.loyalty?.pricingAuthority),
    },
  }

  const verdict = await runJevHotelVerdict(input, 900)
  return NextResponse.json({
    verdict,
    configured: Boolean(String(process.env.TYPESAFE_API_KEY || process.env.JEV_API_KEY || '').trim()),
  })
}
